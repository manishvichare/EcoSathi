// src/controllers/complaintController.js
// Full Report Issue System — Real DB-backed implementation
//
// Endpoints handled:
//   POST   /api/complaints                       createComplaint
//   GET    /api/complaints                       getAllComplaints
//   GET    /api/complaints/:id                   getComplaintById
//   GET    /api/complaints/:id/detail            getComplaintDetail (full enriched)
//   GET    /api/complaints/:id/activity          getActivity
//   POST   /api/complaints/:id/support           supportComplaint (real, deduplicated)
//   DELETE /api/complaints/:id/support           unsupportComplaint
//   POST   /api/complaints/:id/help              addHelpAction (real, deduplicated)
//   POST   /api/complaints/:id/evidence          addEvidence (upload)
//   POST   /api/complaints/:id/assign            assignAction (admin only)
//   PATCH  /api/complaints/assignments/:aid      updateAssignment
//   POST   /api/complaints/:id/authority         setAuthority (admin only)
//   POST   /api/complaints/:id/authority/response addAuthorityResponse (admin only)
//   POST   /api/complaints/:id/resolution        submitResolution (auth + upload)
//   POST   /api/complaints/:id/resolution/verify verifyResolution (admin only)
//   GET    /api/complaints/me/supported          getUserSupportedIds

const fs = require('fs');
const path = require('path');
const { supabase } = require('../config/db');
const aiClient = require('../services/aiClient');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalizePhotoUrl = (rawUrl, req) => {
  if (!rawUrl) return null;
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
  const filename = path.basename(rawUrl.replace(/\\/g, '/'));
  if (!filename) return null;
  const baseUrl = req ? `${req.protocol}://${req.get('host')}` : 'http://localhost:5000';
  return `${baseUrl}/uploads/complaints/${filename}`;
};

const cleanupFile = (file) => {
  if (file?.path && fs.existsSync(file.path)) {
    try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
  }
};

const logActivity = async (complaintId, actorId, actorName, eventType, description, metadata = null) => {
  try {
    await supabase.from('complaint_activity').insert({
      complaint_id: complaintId,
      actor_id: actorId || null,
      actor_name: actorName || 'System',
      event_type: eventType,
      description,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
  } catch (e) {
    console.warn('Activity log failed:', e.message);
  }
};

// ─── CREATE COMPLAINT ─────────────────────────────────────────────────────────

exports.createComplaint = async (req, res) => {
  try {
    const { description, cityName, category, lat, lng, address } = req.body;
    const userId = req.user?.id;
    const userName = req.user?.name || 'Citizen';

    if (!description || !req.file) {
      cleanupFile(req.file);
      return res.status(400).json({ success: false, message: 'description and photo are required' });
    }

    const { data: city } = await supabase
      .from('cities').select('id').ilike('name', cityName || 'Pune').maybeSingle();

    if (!city) {
      cleanupFile(req.file);
      return res.status(404).json({ success: false, message: `City '${cityName}' not found` });
    }

    // AI Vision Analysis
    let aiResult;
    try {
      aiResult = await aiClient.analyzeComplaint({
        imagePath: req.file.path,
        description,
        category: category || 'other',
      });
    } catch (aiErr) {
      console.warn('⚠️ AI Analysis Service error or timeout:', aiErr.message);
      aiResult = {
        is_valid: true, matches_category: true,
        detected_category: category || 'other',
        detected_content: 'Citizen reported environmental issue',
        severity: 'medium', category: category || 'other',
        summary: 'Report recorded with photo evidence. AI analysis pending.',
        rejection_reason: null,
      };
    }

    if (!aiResult || aiResult.is_valid === false || aiResult.matches_category === false) {
      cleanupFile(req.file);
      return res.status(400).json({
        success: false,
        code: 'AI_IMAGE_REJECTED',
        message: aiResult?.rejection_reason || 'Image rejected: does not show a valid environmental issue.',
        details: { detectedCategory: aiResult?.detected_category, detectedContent: aiResult?.detected_content },
      });
    }

    const photoPath = req.file?.path || `/uploads/complaints/${req.file?.filename}`;

    const { data: complaint, error: insertError } = await supabase
      .from('complaints')
      .insert({
        user_id: userId,
        city_id: city.id,
        description,
        photo_url: photoPath,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        address: address || null,
        category: aiResult.category || category || 'other',
        severity: aiResult.severity || 'medium',
        ai_summary: aiResult.summary || description.slice(0, 100),
        status: 'open',
      })
      .select('*')
      .single();

    if (insertError) { cleanupFile(req.file); throw insertError; }

    // Save original photo as evidence record
    await supabase.from('complaint_evidence').insert({
      complaint_id: complaint.id,
      uploaded_by: userId,
      uploader_name: userName,
      evidence_type: 'original',
      photo_url: photoPath,
      description: 'Original complaint photo submitted by citizen',
    });

    // Log creation activity
    await logActivity(complaint.id, userId, userName, 'report_submitted',
      'Environmental issue reported with photographic evidence and AI severity analysis.',
      { severity: complaint.severity, category: complaint.category }
    );

    const normalized = {
      ...complaint,
      photo_url: normalizePhotoUrl(complaint.photo_url, req),
      photo: normalizePhotoUrl(complaint.photo_url, req),
      imageUrl: normalizePhotoUrl(complaint.photo_url, req),
      supportCount: 0,
      helpCount: 0,
      aiAnalysis: { severity: complaint.severity, category: complaint.category, summary: complaint.ai_summary },
    };

    console.log(`✅ [Complaint Published] ID: ${complaint.id}`);
    res.status(201).json({ success: true, complaint: normalized });
  } catch (err) {
    cleanupFile(req.file);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET ALL COMPLAINTS (List) ────────────────────────────────────────────────

exports.getAllComplaints = async (req, res) => {
  try {
    const { city, category, status, search } = req.query;

    let query = supabase
      .from('complaints')
      .select('*, city:cities(name, center_lat, center_lng), user:users(name, email)')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') query = query.eq('status', status.toLowerCase());
    if (category && category !== 'all') query = query.ilike('category', `%${category}%`);

    const { data: complaints, error } = await query;
    if (error) throw error;

    let filtered = complaints || [];
    if (city && city !== 'all') {
      filtered = filtered.filter(c => c.city?.name?.toLowerCase() === city.toLowerCase());
    }
    if (search && search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(c =>
        c.description?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q)
      );
    }

    // Get real support counts and help counts in bulk
    const ids = filtered.map(c => c.id);
    let supportCounts = {};
    let helpCounts = {};

    if (ids.length > 0) {
      const { data: supports } = await supabase
        .from('complaint_supports')
        .select('complaint_id')
        .in('complaint_id', ids);

      const { data: helps } = await supabase
        .from('complaint_help_actions')
        .select('complaint_id')
        .in('complaint_id', ids)
        .eq('status', 'active');

      (supports || []).forEach(s => {
        supportCounts[s.complaint_id] = (supportCounts[s.complaint_id] || 0) + 1;
      });
      (helps || []).forEach(h => {
        helpCounts[h.complaint_id] = (helpCounts[h.complaint_id] || 0) + 1;
      });
    }

    const mapped = filtered.map(c => ({
      ...c,
      title: c.ai_summary || c.description.slice(0, 60) + (c.description.length > 60 ? '...' : ''),
      photo: normalizePhotoUrl(c.photo_url, req),
      photo_url: normalizePhotoUrl(c.photo_url, req),
      location: c.address || c.city?.name || 'Local Area',
      supportCount: supportCounts[c.id] || 0,
      helpCount: helpCounts[c.id] || 0,
      // Keep legacy field for backward compat
      volunteerCount: helpCounts[c.id] || 0,
    }));

    res.status(200).json({ success: true, count: mapped.length, complaints: mapped });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET COMPLAINT BY ID (Simple) ─────────────────────────────────────────────

exports.getComplaintById = async (req, res) => {
  try {
    const { data: complaint, error } = await supabase
      .from('complaints')
      .select('*, city:cities(name), user:users(name, email)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    // If notice_id exists, fetch notice
    let notice = null;
    if (complaint.notice_id) {
      const { data: noticeData } = await supabase.from('notices').select('*').eq('id', complaint.notice_id).maybeSingle();
      notice = noticeData || null;
    }

    // Get real counts
    const [{ count: supportCount }, { count: helpCount }] = await Promise.all([
      supabase.from('complaint_supports').select('*', { count: 'exact', head: true }).eq('complaint_id', complaint.id),
      supabase.from('complaint_help_actions').select('*', { count: 'exact', head: true }).eq('complaint_id', complaint.id).eq('status', 'active'),
    ]);

    res.status(200).json({
      success: true,
      complaint: {
        ...complaint,
        notice,
        photo_url: normalizePhotoUrl(complaint.photo_url, req),
        photo: normalizePhotoUrl(complaint.photo_url, req),
        supportCount: supportCount || 0,
        helpCount: helpCount || 0,
        volunteerCount: helpCount || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET COMPLAINT DETAIL (Full enriched) ────────────────────────────────────

exports.getComplaintDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id || null;

    const { data: complaint, error } = await supabase
      .from('complaints')
      .select('*, city:cities(name, center_lat, center_lng), user:users(name, email)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!complaint) return res.status(404).json({ success: false, message: 'Report not found' });

    let notice = null;
    if (complaint.notice_id) {
      const { data: noticeData } = await supabase.from('notices').select('*').eq('id', complaint.notice_id).maybeSingle();
      notice = noticeData || null;
    }

    // Fetch all sub-data in parallel
    const [
      { data: evidenceRows },
      { data: activityRows },
      { data: assignmentRows },
      { data: authorityRows },
      { data: resolutionRows },
      { count: supportCount },
      { data: helpRows },
    ] = await Promise.all([
      supabase.from('complaint_evidence').select('*').eq('complaint_id', id).order('created_at', { ascending: false }),
      supabase.from('complaint_activity').select('*').eq('complaint_id', id).order('created_at', { ascending: true }),
      supabase.from('complaint_assignments').select('*').eq('complaint_id', id).order('created_at', { ascending: false }),
      supabase.from('complaint_authority').select('*, responses:complaint_authority_responses(*)').eq('complaint_id', id).maybeSingle(),
      supabase.from('complaint_resolutions').select('*').eq('complaint_id', id).order('created_at', { ascending: false }),
      supabase.from('complaint_supports').select('*', { count: 'exact', head: true }).eq('complaint_id', id),
      supabase.from('complaint_help_actions').select('*').eq('complaint_id', id).eq('status', 'active'),
    ]);

    // Check current user's personal actions
    let userHasSupported = false;
    let userHelpAction = null;
    if (currentUserId) {
      const { data: mySupport } = await supabase
        .from('complaint_supports')
        .select('id')
        .eq('complaint_id', id)
        .eq('user_id', currentUserId)
        .maybeSingle();
      userHasSupported = !!mySupport;

      const { data: myHelp } = await supabase
        .from('complaint_help_actions')
        .select('*')
        .eq('complaint_id', id)
        .eq('user_id', currentUserId)
        .maybeSingle();
      userHelpAction = myHelp || null;
    }

    // Normalize photo URLs in evidence
    const evidence = (evidenceRows || []).map(e => ({
      ...e,
      photo_url: normalizePhotoUrl(e.photo_url, req),
    }));

    res.status(200).json({
      success: true,
      complaint: {
        ...complaint,
        photo_url: normalizePhotoUrl(complaint.photo_url, req),
        photo: normalizePhotoUrl(complaint.photo_url, req),
        supportCount: supportCount || 0,
        helpCount: (helpRows || []).length,
        volunteerCount: (helpRows || []).length,
        evidence,
        activity: activityRows || [],
        assignments: assignmentRows || [],
        authority: authorityRows || null,
        resolutions: resolutionRows || [],
        helpActions: helpRows || [],
        userHasSupported,
        userHelpAction,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET ACTIVITY TIMELINE ────────────────────────────────────────────────────

exports.getActivity = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('complaint_activity')
      .select('*')
      .eq('complaint_id', req.params.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.status(200).json({ success: true, activity: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── SUPPORT COMPLAINT (Real DB, deduplicated) ────────────────────────────────

exports.supportComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userName = req.user?.name || 'Citizen';

    if (!userId) return res.status(401).json({ success: false, message: 'Please log in to support this report.' });

    // Verify complaint exists
    const { data: complaint } = await supabase.from('complaints').select('id, status').eq('id', id).maybeSingle();
    if (!complaint) return res.status(404).json({ success: false, message: 'Report not found.' });

    const { error: insertError } = await supabase
      .from('complaint_supports')
      .insert({ complaint_id: id, user_id: userId });

    if (insertError) {
      if (insertError.code === '23505') { // UNIQUE violation
        return res.status(409).json({ success: false, message: 'You have already supported this report.', alreadySupported: true });
      }
      throw insertError;
    }

    // Get updated real count
    const { count } = await supabase
      .from('complaint_supports')
      .select('*', { count: 'exact', head: true })
      .eq('complaint_id', id);

    await logActivity(id, userId, userName, 'support_added',
      `${userName} supported this report, adding community weight.`);

    res.status(200).json({
      success: true,
      message: 'Support recorded! Your voice adds weight to this environmental report.',
      supportCount: count || 0,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── UNSUPPORT COMPLAINT ──────────────────────────────────────────────────────

exports.unsupportComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated.' });

    await supabase.from('complaint_supports')
      .delete()
      .eq('complaint_id', id)
      .eq('user_id', userId);

    const { count } = await supabase
      .from('complaint_supports')
      .select('*', { count: 'exact', head: true })
      .eq('complaint_id', id);

    res.status(200).json({ success: true, supportCount: count || 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADD HELP ACTION (typed commitment) ───────────────────────────────────────

const VALID_HELP_TYPES = [
  'visit_location', 'provide_photos', 'provide_information',
  'help_cleanup', 'contact_authority', 'volunteer_action',
];

exports.addHelpAction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userName = req.user?.name || 'Citizen';
    const { help_type, notes } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: 'Please log in to offer help.' });
    if (!help_type || !VALID_HELP_TYPES.includes(help_type)) {
      return res.status(400).json({ success: false, message: `Invalid help type. Must be one of: ${VALID_HELP_TYPES.join(', ')}` });
    }

    const { data: complaint } = await supabase.from('complaints').select('id').eq('id', id).maybeSingle();
    if (!complaint) return res.status(404).json({ success: false, message: 'Report not found.' });

    // Check for existing active commitment
    const { data: existing } = await supabase
      .from('complaint_help_actions')
      .select('*')
      .eq('complaint_id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'active') {
        return res.status(409).json({
          success: false,
          message: 'You already have an active help commitment for this report.',
          alreadyHelping: true,
          helpAction: existing,
        });
      }
      // Re-activate if previously cancelled
      const { data: updated } = await supabase
        .from('complaint_help_actions')
        .update({ help_type, notes: notes || existing.notes, status: 'active', updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select('*')
        .single();

      const { count } = await supabase
        .from('complaint_help_actions')
        .select('*', { count: 'exact', head: true })
        .eq('complaint_id', id)
        .eq('status', 'active');

      return res.status(200).json({ success: true, helpAction: updated, helpCount: count || 0 });
    }

    const { data: helpAction, error } = await supabase
      .from('complaint_help_actions')
      .insert({ complaint_id: id, user_id: userId, help_type, notes: notes || null })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ success: false, message: 'You already have a help action for this report.', alreadyHelping: true });
      }
      throw error;
    }

    const { count } = await supabase
      .from('complaint_help_actions')
      .select('*', { count: 'exact', head: true })
      .eq('complaint_id', id)
      .eq('status', 'active');

    const helpTypeLabel = help_type.replace(/_/g, ' ');
    await logActivity(id, userId, userName, 'help_offered',
      `${userName} committed to help by: ${helpTypeLabel}.`,
      { help_type }
    );

    res.status(201).json({
      success: true,
      message: 'Thank you for offering to help! Your commitment has been recorded.',
      helpAction,
      helpCount: count || 0,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADD EVIDENCE (additional photo upload) ───────────────────────────────────

exports.addEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userName = req.user?.name || 'Citizen';
    const { evidence_type, description } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: 'Please log in to upload evidence.' });
    if (!req.file) return res.status(400).json({ success: false, message: 'Photo is required for evidence upload.' });

    const validTypes = ['additional', 'verification', 'action', 'resolution'];
    const type = validTypes.includes(evidence_type) ? evidence_type : 'additional';

    const { data: complaint } = await supabase.from('complaints').select('id').eq('id', id).maybeSingle();
    if (!complaint) {
      cleanupFile(req.file);
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const photoPath = req.file?.path || `/uploads/complaints/${req.file?.filename}`;

    const { data: evidence, error } = await supabase
      .from('complaint_evidence')
      .insert({
        complaint_id: id,
        uploaded_by: userId,
        uploader_name: userName,
        evidence_type: type,
        photo_url: photoPath,
        description: description || null,
      })
      .select('*')
      .single();

    if (error) { cleanupFile(req.file); throw error; }

    await logActivity(id, userId, userName, 'evidence_uploaded',
      `${userName} uploaded ${type} evidence photo.`,
      { evidence_type: type }
    );

    res.status(201).json({
      success: true,
      evidence: { ...evidence, photo_url: normalizePhotoUrl(evidence.photo_url, req) },
    });
  } catch (err) {
    cleanupFile(req.file);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ASSIGN ACTION (admin only) ───────────────────────────────────────────────

exports.assignAction = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;
    const adminName = req.user?.name || 'Admin';
    const { action_type, instructions, deadline, assignee_name } = req.body;

    const validActionTypes = [
      'site_verification', 'evidence_collection', 'additional_investigation',
      'cleanup', 'community_outreach', 'authority_contact', 'on_ground_action',
      'follow_up_inspection', 'resolution_verification',
    ];

    if (!action_type || !validActionTypes.includes(action_type)) {
      return res.status(400).json({ success: false, message: `Invalid action_type. Must be one of: ${validActionTypes.join(', ')}` });
    }

    const { data: complaint } = await supabase.from('complaints').select('id, status').eq('id', id).maybeSingle();
    if (!complaint) return res.status(404).json({ success: false, message: 'Report not found.' });

    const { data: assignment, error } = await supabase
      .from('complaint_assignments')
      .insert({
        complaint_id: id,
        assigned_by: adminId,
        assigned_by_name: adminName,
        assignee_name: assignee_name || 'Unassigned',
        action_type,
        instructions: instructions || null,
        deadline: deadline || null,
      })
      .select('*')
      .single();

    if (error) throw error;

    // Update complaint status to 'assigned' if currently open/under_review
    const promotableStatuses = ['open', 'under_review', 'verified', 'action_required'];
    if (promotableStatuses.includes(complaint.status)) {
      await supabase.from('complaints').update({ status: 'assigned', updated_at: new Date().toISOString() }).eq('id', id);
    }

    await logActivity(id, adminId, adminName, 'action_assigned',
      `${adminName} assigned action: "${action_type.replace(/_/g, ' ')}" to ${assignee_name || 'team'}.`,
      { action_type, deadline, assignee_name }
    );

    res.status(201).json({ success: true, assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── UPDATE ASSIGNMENT ────────────────────────────────────────────────────────

exports.updateAssignment = async (req, res) => {
  try {
    const { aid } = req.params;
    const userId = req.user?.id;
    const userName = req.user?.name || 'User';
    const { status, completion_description, completion_evidence_url } = req.body;

    const validStatuses = ['accepted', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const { data: assignment, error: fetchError } = await supabase
      .from('complaint_assignments')
      .select('*')
      .eq('id', aid)
      .maybeSingle();

    if (fetchError || !assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });

    const { data: updated, error } = await supabase
      .from('complaint_assignments')
      .update({
        status,
        completion_description: completion_description || assignment.completion_description,
        completion_evidence_url: completion_evidence_url || assignment.completion_evidence_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', aid)
      .select('*')
      .single();

    if (error) throw error;

    await logActivity(assignment.complaint_id, userId, userName, 'assignment_updated',
      `Assignment status updated to "${status}" by ${userName}.`);

    res.status(200).json({ success: true, assignment: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── SET AUTHORITY (admin only) ───────────────────────────────────────────────

exports.setAuthority = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;
    const adminName = req.user?.name || 'Admin';
    const { department, reference_number, submitted_date, submission_status, notes } = req.body;

    if (!department) return res.status(400).json({ success: false, message: 'department is required.' });

    // Remove old authority if exists
    await supabase.from('complaint_authority').delete().eq('complaint_id', id);

    const { data: authority, error } = await supabase
      .from('complaint_authority')
      .insert({
        complaint_id: id,
        department,
        reference_number: reference_number || null,
        submitted_date: submitted_date || null,
        submission_status: submission_status || 'not_submitted',
        notes: notes || null,
      })
      .select('*')
      .single();

    if (error) throw error;

    if (submission_status === 'submitted') {
      await supabase.from('complaints')
        .update({ status: 'authority_notified', updated_at: new Date().toISOString() })
        .eq('id', id);
    }

    await logActivity(id, adminId, adminName, 'authority_notified',
      `Case registered with ${department}. Reference: ${reference_number || 'pending'}.`,
      { department, reference_number, submission_status }
    );

    res.status(201).json({ success: true, authority });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADD AUTHORITY RESPONSE (admin only) ─────────────────────────────────────

exports.addAuthorityResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;
    const adminName = req.user?.name || 'Admin';
    const { response_text, response_date } = req.body;

    if (!response_text) return res.status(400).json({ success: false, message: 'response_text is required.' });

    const { data: authority } = await supabase
      .from('complaint_authority')
      .select('id')
      .eq('complaint_id', id)
      .maybeSingle();

    if (!authority) return res.status(404).json({ success: false, message: 'No authority case found for this report. Set authority first.' });

    const { data: response, error } = await supabase
      .from('complaint_authority_responses')
      .insert({
        authority_id: authority.id,
        complaint_id: id,
        recorded_by: adminId,
        recorded_by_name: adminName,
        response_text,
        response_date: response_date || new Date().toISOString().slice(0, 10),
      })
      .select('*')
      .single();

    if (error) throw error;

    await logActivity(id, adminId, adminName, 'authority_response',
      `Authority response recorded: "${response_text.slice(0, 80)}${response_text.length > 80 ? '...' : ''}"`,
      { response_date }
    );

    res.status(201).json({ success: true, response });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── TAKE AUTHORITY ACTION (Authority or Admin) ──────────────────────────────

exports.takeAuthorityAction = async (req, res) => {
  try {
    const { id } = req.params;
    const officerId = req.user?.id;
    const officerName = req.user?.name || 'Municipal Officer';
    const { status, department, action_notes, reference_number, action_type } = req.body;

    if (!action_notes) {
      cleanupFile(req.file);
      return res.status(400).json({ success: false, message: 'Action remarks / notes are required.' });
    }

    const { data: complaint, error: compErr } = await supabase
      .from('complaints')
      .select('*, city:cities(name)')
      .eq('id', id)
      .maybeSingle();

    if (compErr || !complaint) {
      cleanupFile(req.file);
      return res.status(404).json({ success: false, message: 'Complaint report not found.' });
    }

    const targetStatus = status || 'action_in_progress';
    const deptName = department || 'Municipal Environmental Cell';
    const refNum = reference_number || `MUN-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    // 1. Update Complaint Status
    await supabase.from('complaints')
      .update({
        status: targetStatus,
        updated_at: now,
      })
      .eq('id', id);

    // 2. Upsert Authority Case
    await supabase.from('complaint_authority').delete().eq('complaint_id', id);
    const { data: authorityCase } = await supabase
      .from('complaint_authority')
      .insert({
        complaint_id: id,
        department: deptName,
        reference_number: refNum,
        submitted_date: now.slice(0, 10),
        submission_status: targetStatus === 'resolved' ? 'closed' : 'in_progress',
        notes: action_notes,
      })
      .select('*')
      .single();

    // 3. Add Authority Response
    await supabase.from('complaint_authority_responses')
      .insert({
        authority_id: authorityCase?.id || null,
        complaint_id: id,
        recorded_by: officerId,
        recorded_by_name: officerName,
        response_text: `[${action_type || 'Official Enforcement'}]: ${action_notes}`,
        response_date: now.slice(0, 10),
      });

    // 4. Save optional photo evidence if attached
    let evidenceRecord = null;
    if (req.file) {
      const photoPath = req.file?.path || `/uploads/complaints/${req.file?.filename}`;
      const { data: ev } = await supabase.from('complaint_evidence').insert({
        complaint_id: id,
        uploaded_by: officerId,
        uploader_name: officerName,
        evidence_type: targetStatus === 'resolved' ? 'resolution' : 'action',
        photo_url: photoPath,
        description: `Official municipal inspection proof: ${action_notes}`,
      }).select('*').single();
      evidenceRecord = ev;
    }

    // 5. Activity log
    await logActivity(
      id,
      officerId,
      officerName,
      'authority_action',
      `Municipal action taken by ${officerName} (${deptName}): [${targetStatus.toUpperCase()}] ${action_notes}`,
      { department: deptName, reference_number: refNum, status: targetStatus }
    );

    // 6. Upsert into official notices
    try {
      const noticeText = `OFFICIAL MUNICIPAL ENFORCEMENT ACTION\n\nTO: ${deptName}\nLOCATION: ${complaint.address || 'Reported Incident Area'}\nCATEGORY: ${(complaint.category || 'environmental issue').toUpperCase()}\nSTATUS: ${targetStatus.toUpperCase()} (Ref: ${refNum})\nOFFICER: ${officerName}\n\nACTION TAKEN:\n${action_notes}\n\nDate: ${new Date().toLocaleDateString()}`;
      await supabase.from('notices').insert({
        city_id: complaint.city_id,
        complaint_id: id,
        notice_text: noticeText,
        ai_generated: false,
        status: targetStatus === 'resolved' ? 'resolved' : 'enforced',
        created_at: now,
      });
    } catch (noticeErr) {
      console.warn('Notice creation notice skipped:', noticeErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Official municipal action recorded! Complaint updated to "${targetStatus}".`,
      complaint: { ...complaint, status: targetStatus },
      authority: authorityCase,
      evidence: evidenceRecord ? { ...evidenceRecord, photo_url: normalizePhotoUrl(evidenceRecord.photo_url, req) } : null,
    });
  } catch (err) {
    cleanupFile(req.file);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── SUBMIT RESOLUTION (auth, requires evidence) ─────────────────────────────

exports.submitResolution = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userName = req.user?.name || 'Citizen';
    const { resolution_type, description, notes } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: 'Please log in to submit a resolution.' });
    if (!req.file) return res.status(400).json({ success: false, message: 'Photo evidence is required to submit a resolution.' });
    if (!resolution_type || !description) {
      cleanupFile(req.file);
      return res.status(400).json({ success: false, message: 'resolution_type and description are required.' });
    }

    const { data: complaint } = await supabase.from('complaints').select('id, status').eq('id', id).maybeSingle();
    if (!complaint) { cleanupFile(req.file); return res.status(404).json({ success: false, message: 'Report not found.' }); }

    const photoPath = req.file?.path || `/uploads/complaints/${req.file?.filename}`;

    // Save resolution evidence photo
    await supabase.from('complaint_evidence').insert({
      complaint_id: id,
      uploaded_by: userId,
      uploader_name: userName,
      evidence_type: 'resolution',
      photo_url: photoPath,
      description: `Resolution evidence: ${description}`,
    });

    const { data: resolution, error } = await supabase
      .from('complaint_resolutions')
      .insert({
        complaint_id: id,
        submitted_by: userId,
        submitted_by_name: userName,
        resolution_type,
        description,
        evidence_url: photoPath,
        notes: notes || null,
        status: 'pending',
      })
      .select('*')
      .single();

    if (error) { cleanupFile(req.file); throw error; }

    // Update complaint status to resolution_pending
    await supabase.from('complaints')
      .update({ status: 'resolution_pending', updated_at: new Date().toISOString() })
      .eq('id', id);

    await logActivity(id, userId, userName, 'resolution_submitted',
      `${userName} submitted resolution evidence with photo proof. Pending admin verification.`,
      { resolution_type }
    );

    res.status(201).json({
      success: true,
      message: 'Resolution submitted! An admin will verify the evidence before marking this report as resolved.',
      resolution: { ...resolution, evidence_url: normalizePhotoUrl(resolution.evidence_url, req) },
    });
  } catch (err) {
    cleanupFile(req.file);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── VERIFY RESOLUTION (admin only) ──────────────────────────────────────────

exports.verifyResolution = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;
    const adminName = req.user?.name || 'Admin';
    const { approved, review_notes } = req.body;

    if (typeof approved !== 'boolean') {
      return res.status(400).json({ success: false, message: '"approved" (boolean) is required.' });
    }

    // Get the latest pending resolution
    const { data: resolution } = await supabase
      .from('complaint_resolutions')
      .select('*')
      .eq('complaint_id', id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!resolution) return res.status(404).json({ success: false, message: 'No pending resolution found for this report.' });

    const newStatus = approved ? 'approved' : 'rejected';
    const newComplaintStatus = approved ? 'resolved' : 'open';

    await supabase.from('complaint_resolutions').update({
      status: newStatus,
      reviewed_by: adminId,
      reviewed_by_name: adminName,
      review_notes: review_notes || null,
      updated_at: new Date().toISOString(),
    }).eq('id', resolution.id);

    await supabase.from('complaints').update({
      status: newComplaintStatus,
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    await logActivity(id, adminId, adminName,
      approved ? 'resolution_approved' : 'resolution_rejected',
      approved
        ? `Resolution approved by ${adminName}. Issue is now officially marked as Resolved.`
        : `Resolution rejected by ${adminName}. Reason: ${review_notes || 'Not specified'}. Issue returned to open.`,
      { review_notes }
    );

    res.status(200).json({
      success: true,
      approved,
      newComplaintStatus,
      message: approved
        ? '✅ Resolution approved. The report is now marked as Resolved.'
        : '❌ Resolution rejected. Report returned to Open status.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET USER SUPPORTED REPORT IDS ───────────────────────────────────────────

exports.getUserSupportedIds = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(200).json({ success: true, supportedIds: [] });

    const { data } = await supabase
      .from('complaint_supports')
      .select('complaint_id')
      .eq('user_id', userId);

    const supportedIds = (data || []).map(r => r.complaint_id);
    res.status(200).json({ success: true, supportedIds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── LEGACY VOLUNTEER (for backward compat — now redirects to addHelpAction) ─

exports.volunteerComplaint = async (req, res) => {
  req.body.help_type = req.body.help_type || 'volunteer_action';
  return exports.addHelpAction(req, res);
};