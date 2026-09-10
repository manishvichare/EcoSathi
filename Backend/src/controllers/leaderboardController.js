// src/controllers/leaderboardController.js
// Handles:
//   GET  /api/leaderboard
//   GET  /api/tasks
//   GET  /api/tasks/my-submissions
//   GET  /api/tasks/user-reports (for linking to 'Report Pollution' task)
//   POST /api/tasks/:id/submit-proof
//   POST /api/tasks/submissions/:submissionId/resubmit
//   GET  /api/tasks/admin/submissions (admin/moderator only)
//   POST /api/tasks/submissions/:submissionId/review (admin/moderator only)
//   POST /api/tasks/:id/complete (legacy)

const path = require('path');
const fs = require('fs');
const { supabase } = require('../config/db');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalizeUrl = (rawUrl, req) => {
  if (!rawUrl) return null;
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
  const filename = path.basename(rawUrl.replace(/\\/g, '/'));
  if (!filename) return null;
  const baseUrl = req ? `${req.protocol}://${req.get('host')}` : 'http://localhost:5000';
  if (rawUrl.includes('complaints')) {
    return `${baseUrl}/uploads/complaints/${filename}`;
  }
  return `${baseUrl}/uploads/tasks/${filename}`;
};

const cleanupUploadedFiles = (req) => {
  if (req.files) {
    Object.values(req.files).forEach(fileArr => {
      fileArr.forEach(file => {
        if (file?.path && fs.existsSync(file.path)) {
          try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
        }
      });
    });
  }
};

/**
 * Task-specific verification requirements matrix
 */
const getTaskVerificationConfig = (task) => {
  const cat = (task.category || '').toLowerCase();
  const title = (task.title || '').toLowerCase();

  if (cat === 'cleanup' || title.includes('cleanup')) {
    return {
      type: 'cleanup',
      requiresBeforeAfter: true,
      requiresPhoto: true,
      requiresLocation: true,
      allowsReportLink: false,
      label: 'Cleanup Action',
      instruction: 'Upload a BEFORE photo and an AFTER photo proving your cleanup efforts.',
    };
  }

  if (cat === 'reporting' || title.includes('report')) {
    return {
      type: 'reporting',
      requiresBeforeAfter: false,
      requiresPhoto: false,
      requiresLocation: false,
      allowsReportLink: true,
      label: 'Pollution Reporting',
      instruction: 'Link an existing EcoSathi complaint or upload a pollution observation photo.',
    };
  }

  if (cat === 'planting' || title.includes('tree') || title.includes('plant')) {
    return {
      type: 'planting',
      requiresBeforeAfter: false,
      requiresPhoto: true,
      requiresLocation: true,
      allowsReportLink: false,
      label: 'Tree Planting',
      instruction: 'Take a clear photo of the newly planted sapling with visible surrounding soil.',
    };
  }

  if (cat === 'transport' || title.includes('cycle') || title.includes('transit')) {
    return {
      type: 'transport',
      requiresBeforeAfter: false,
      requiresPhoto: true,
      requiresLocation: false,
      allowsReportLink: false,
      label: 'Green Mobility',
      instruction: 'Upload a photo of your bicycle, transit pass, or route activity log.',
    };
  }

  if (cat === 'recycling' || title.includes('plastic') || title.includes('waste')) {
    return {
      type: 'recycling',
      requiresBeforeAfter: false,
      requiresPhoto: true,
      requiresLocation: false,
      allowsReportLink: false,
      label: 'Zero-Waste / Reuse',
      instruction: 'Upload a photo demonstrating your reusable alternative or segregated waste.',
    };
  }

  return {
    type: 'general',
    requiresBeforeAfter: false,
    requiresPhoto: true,
    requiresLocation: false,
    allowsReportLink: false,
    label: 'Eco Action',
    instruction: 'Upload a photo demonstrating completed eco action.',
  };
};

// ─── GET LEADERBOARD ─────────────────────────────────────────────────────────

exports.getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;

    let query = supabase
      .from('leaderboard_entries')
      .select(`
        *,
        user:users(name, email),
        city:cities(name)
      `)
      .order('total_points', { ascending: false })
      .limit(limit);

    if (req.query.city && req.query.city !== 'all') {
      const { data: cityDoc } = await supabase
        .from('cities')
        .select('id')
        .ilike('name', req.query.city)
        .maybeSingle();

      if (cityDoc) {
        query = query.eq('city_id', cityDoc.id);
      }
    }

    let { data: leaderboard, error } = await query;
    if (error) throw error;

    // If city-specific leaderboard has no entries yet, fallback to real global contributors
    if ((!leaderboard || leaderboard.length === 0) && req.query.city && req.query.city !== 'all') {
      const { data: globalEntries } = await supabase
        .from('leaderboard_entries')
        .select(`
          *,
          user:users(name, email),
          city:cities(name)
        `)
        .order('total_points', { ascending: false })
        .limit(limit);

      if (globalEntries && globalEntries.length > 0) {
        leaderboard = globalEntries;
      }
    }

    res.status(200).json({ success: true, count: leaderboard ? leaderboard.length : 0, leaderboard: leaderboard || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET ALL TASKS ───────────────────────────────────────────────────────────

exports.getAllTasks = async (req, res) => {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('active', true)
      .order('points', { ascending: false });

    if (error) throw error;

    const enriched = (tasks || []).map(t => ({
      ...t,
      verificationConfig: getTaskVerificationConfig(t),
    }));

    res.status(200).json({ success: true, count: enriched.length, tasks: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET USER TASK SUBMISSIONS ───────────────────────────────────────────────

exports.getUserTaskSubmissions = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(200).json({ success: true, submissions: [] });
    }

    const today = new Date().toISOString().slice(0, 10);

    const { data: submissions, error } = await supabase
      .from('task_submissions')
      .select('*, task:tasks(*)')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false });

    if (error) {
      // Table may not exist yet if migration pending
      return res.status(200).json({ success: true, submissions: [] });
    }

    const normalized = (submissions || []).map(s => ({
      ...s,
      evidence_url: normalizeUrl(s.evidence_url, req),
      before_evidence_url: normalizeUrl(s.before_evidence_url, req),
      isToday: s.task_date === today,
    }));

    res.status(200).json({ success: true, submissions: normalized });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET USER COMPLAINTS FOR LINKING (Report Pollution Task) ─────────────────

exports.getUserReportsForLinking = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(200).json({ success: true, reports: [] });
    }

    const { data: reports, error } = await supabase
      .from('complaints')
      .select('id, category, description, photo_url, address, created_at, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    const normalized = (reports || []).map(r => ({
      ...r,
      photo_url: normalizeUrl(r.photo_url, req),
    }));

    res.status(200).json({ success: true, reports: normalized });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── SUBMIT TASK PROOF ───────────────────────────────────────────────────────

exports.submitTaskProof = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userName = req.user?.name || 'Citizen';
    const taskId = req.params.id;
    const {
      description,
      location_lat,
      location_lng,
      location_address,
      linked_complaint_id,
    } = req.body;

    const today = new Date().toISOString().slice(0, 10);

    // 1. Fetch Task
    const { data: task, error: taskErr } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .maybeSingle();

    if (taskErr || !task || !task.active) {
      cleanupUploadedFiles(req);
      return res.status(404).json({ success: false, message: 'Task not found or inactive.' });
    }

    const config = getTaskVerificationConfig(task);

    // 2. Check for existing submission today
    const { data: existing } = await supabase
      .from('task_submissions')
      .select('*')
      .eq('task_id', taskId)
      .eq('user_id', userId)
      .eq('task_date', today)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'approved') {
        cleanupUploadedFiles(req);
        return res.status(409).json({
          success: false,
          message: 'You have already completed and received verified Eco Points for this task today.',
        });
      }
      if (existing.status === 'pending' || existing.status === 'under_review') {
        cleanupUploadedFiles(req);
        return res.status(409).json({
          success: false,
          message: 'You already have an active submission pending verification for this task today.',
        });
      }
    }

    // 3. Extract uploaded files
    const evidenceFile = req.files?.['evidence']?.[0] || req.files?.['photo']?.[0] || req.files?.['after_evidence']?.[0];
    const beforeFile = req.files?.['before_evidence']?.[0];

    let evidenceUrl = null;
    let beforeEvidenceUrl = null;
    let evidenceType = 'photo';
    let linkedReportId = null;

    // 4. Validate evidence based on task type
    if (config.type === 'cleanup') {
      if (!beforeFile || !evidenceFile) {
        cleanupUploadedFiles(req);
        return res.status(400).json({
          success: false,
          message: 'Both BEFORE and AFTER photos are required for cleanup task verification.',
        });
      }
      beforeEvidenceUrl = `/uploads/tasks/${beforeFile.filename}`;
      evidenceUrl = `/uploads/tasks/${evidenceFile.filename}`;
      evidenceType = 'before_after';
    } else if (config.type === 'reporting') {
      if (linked_complaint_id) {
        // Linked existing EcoSathi report
        const { data: complaint } = await supabase
          .from('complaints')
          .select('id, photo_url, description, address, lat, lng')
          .eq('id', linked_complaint_id)
          .maybeSingle();

        if (!complaint) {
          cleanupUploadedFiles(req);
          return res.status(404).json({ success: false, message: 'Linked EcoSathi report not found.' });
        }
        linkedReportId = complaint.id;
        evidenceUrl = complaint.photo_url;
        evidenceType = 'report_link';
      } else if (evidenceFile) {
        evidenceUrl = `/uploads/tasks/${evidenceFile.filename}`;
        evidenceType = 'photo';
      } else {
        cleanupUploadedFiles(req);
        return res.status(400).json({
          success: false,
          message: 'Please link an existing EcoSathi complaint or upload a pollution photo.',
        });
      }
    } else {
      // General tasks (Plant tree, Cycle, Reduce plastic, Solar, etc.)
      if (!evidenceFile) {
        cleanupUploadedFiles(req);
        return res.status(400).json({
          success: false,
          message: `Please upload evidence before submitting this action.`,
        });
      }
      evidenceUrl = `/uploads/tasks/${evidenceFile.filename}`;
      evidenceType = 'photo';
    }

    // Parse coordinates if provided
    const lat = location_lat ? parseFloat(location_lat) : null;
    const lng = location_lng ? parseFloat(location_lng) : null;

    let submission;

    if (existing && (existing.status === 'rejected' || existing.status === 'more_evidence_required')) {
      // Update existing record and archive previous to history
      await supabase.from('task_evidence_history').insert({
        submission_id: existing.id,
        evidence_url: existing.evidence_url,
        before_evidence_url: existing.before_evidence_url,
        description: existing.description,
        action_type: 'previous_round',
      });

      const { data: updated, error: updateErr } = await supabase
        .from('task_submissions')
        .update({
          status: 'pending',
          evidence_type: evidenceType,
          evidence_url: evidenceUrl,
          before_evidence_url: beforeEvidenceUrl,
          description: description || existing.description,
          location_lat: lat || existing.location_lat,
          location_lng: lng || existing.location_lng,
          location_address: location_address || existing.location_address,
          linked_complaint_id: linkedReportId || existing.linked_complaint_id,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('*')
        .single();

      if (updateErr) throw updateErr;
      submission = updated;
    } else {
      // Insert new submission
      const { data: inserted, error: insertErr } = await supabase
        .from('task_submissions')
        .insert({
          task_id: taskId,
          user_id: userId,
          task_date: today,
          status: 'pending',
          evidence_type: evidenceType,
          evidence_url: evidenceUrl,
          before_evidence_url: beforeEvidenceUrl,
          description: description || null,
          location_lat: lat,
          location_lng: lng,
          location_address: location_address || null,
          linked_complaint_id: linkedReportId,
          points_awarded: 0,
          submitted_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (insertErr) throw insertErr;
      submission = inserted;

      // Seed initial history
      await supabase.from('task_evidence_history').insert({
        submission_id: submission.id,
        evidence_url: evidenceUrl,
        before_evidence_url: beforeEvidenceUrl,
        description: description || null,
        action_type: 'initial_submission',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Evidence submitted successfully! Pending verification by a community moderator.',
      submission: {
        ...submission,
        evidence_url: normalizeUrl(submission.evidence_url, req),
        before_evidence_url: normalizeUrl(submission.before_evidence_url, req),
      },
    });
  } catch (err) {
    cleanupUploadedFiles(req);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── RESUBMIT TASK PROOF ─────────────────────────────────────────────────────

exports.resubmitTaskProof = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { submissionId } = req.params;
    const { description } = req.body;

    const { data: submission, error: fetchErr } = await supabase
      .from('task_submissions')
      .select('*, task:tasks(*)')
      .eq('id', submissionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchErr || !submission) {
      cleanupUploadedFiles(req);
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    if (submission.status !== 'rejected' && submission.status !== 'more_evidence_required') {
      cleanupUploadedFiles(req);
      return res.status(400).json({
        success: false,
        message: 'Resubmission is only allowed for rejected or more-evidence-required tasks.',
      });
    }

    const evidenceFile = req.files?.['evidence']?.[0] || req.files?.['photo']?.[0] || req.files?.['after_evidence']?.[0];
    const beforeFile = req.files?.['before_evidence']?.[0];

    if (!evidenceFile && !beforeFile && !description) {
      cleanupUploadedFiles(req);
      return res.status(400).json({ success: false, message: 'Please upload new evidence or provide updated notes.' });
    }

    // Preserve previous evidence in history
    await supabase.from('task_evidence_history').insert({
      submission_id: submission.id,
      evidence_url: submission.evidence_url,
      before_evidence_url: submission.before_evidence_url,
      description: submission.description,
      action_type: 'before_resubmission',
    });

    const updatePayload = {
      status: 'pending',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (evidenceFile) {
      updatePayload.evidence_url = `/uploads/tasks/${evidenceFile.filename}`;
    }
    if (beforeFile) {
      updatePayload.before_evidence_url = `/uploads/tasks/${beforeFile.filename}`;
    }
    if (description) {
      updatePayload.description = description;
    }

    const { data: updated, error: updateErr } = await supabase
      .from('task_submissions')
      .update(updatePayload)
      .eq('id', submission.id)
      .select('*')
      .single();

    if (updateErr) throw updateErr;

    res.status(200).json({
      success: true,
      message: 'New evidence uploaded! Resubmitted for verification.',
      submission: {
        ...updated,
        evidence_url: normalizeUrl(updated.evidence_url, req),
        before_evidence_url: normalizeUrl(updated.before_evidence_url, req),
      },
    });
  } catch (err) {
    cleanupUploadedFiles(req);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN: GET SUBMISSIONS FOR VERIFICATION ─────────────────────────────────

exports.getAdminSubmissions = async (req, res) => {
  try {
    const { status, task_id, date } = req.query;

    let query = supabase
      .from('task_submissions')
      .select(`
        *,
        user:users!task_submissions_user_id_fkey(id, name, email, city),
        task:tasks(id, title, description, points, category),
        linked_complaint:complaints(id, category, description, photo_url, address)
      `)
      .order('submitted_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (task_id && task_id !== 'all') {
      query = query.eq('task_id', task_id);
    }
    if (date) {
      query = query.eq('task_date', date);
    }

    const { data: submissions, error } = await query;
    if (error) throw error;

    const normalized = (submissions || []).map(s => ({
      ...s,
      evidence_url: normalizeUrl(s.evidence_url, req),
      before_evidence_url: normalizeUrl(s.before_evidence_url, req),
      linked_complaint: s.linked_complaint ? {
        ...s.linked_complaint,
        photo_url: normalizeUrl(s.linked_complaint.photo_url, req),
      } : null,
    }));

    res.status(200).json({ success: true, count: normalized.length, submissions: normalized });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN: REVIEW SUBMISSION (Approve, Reject, Request More Evidence) ───────

exports.reviewTaskSubmission = async (req, res) => {
  try {
    const reviewerId = req.user?.id;
    const reviewerName = req.user?.name || 'Moderator';
    const { submissionId } = req.params;
    const { action, review_notes } = req.body;

    const validActions = ['approve', 'reject', 'request_more_evidence'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: `Invalid action. Must be one of: ${validActions.join(', ')}`,
      });
    }

    if ((action === 'reject' || action === 'request_more_evidence') && !review_notes?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A review reason or message is required when rejecting or requesting more evidence.',
      });
    }

    // 1. Fetch submission with task and user details
    const { data: submission, error: fetchErr } = await supabase
      .from('task_submissions')
      .select('*, task:tasks(*), user:users(*)')
      .eq('id', submissionId)
      .maybeSingle();

    if (fetchErr || !submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    if (submission.status === 'approved') {
      return res.status(400).json({ success: false, message: 'This submission has already been approved and rewarded.' });
    }

    const now = new Date().toISOString();

    if (action === 'approve') {
      const pointsToAward = submission.task?.points || 20;

      // Check if points were already awarded via point_transactions ledger
      const { data: existingTx } = await supabase
        .from('point_transactions')
        .select('id')
        .eq('user_id', submission.user_id)
        .eq('reference_id', submission.id)
        .eq('type', 'task_completion')
        .maybeSingle();

      if (existingTx) {
        return res.status(400).json({
          success: false,
          message: 'Points have already been awarded for this task submission.',
        });
      }

      // Record in point_transactions ledger
      await supabase.from('point_transactions').insert({
        user_id: submission.user_id,
        points: pointsToAward,
        type: 'task_completion',
        reference_id: submission.id,
        description: `Verified completion of "${submission.task?.title || 'Eco Action Task'}"`,
      });

      // Update User Points
      const currentPoints = submission.user?.points || 0;
      await supabase.from('users')
        .update({ points: currentPoints + pointsToAward, updated_at: now })
        .eq('id', submission.user_id);

      // Update Leaderboard Entry
      const { data: lbEntry } = await supabase
        .from('leaderboard_entries')
        .select('*')
        .eq('user_id', submission.user_id)
        .maybeSingle();

      if (lbEntry) {
        await supabase.from('leaderboard_entries')
          .update({
            total_points: lbEntry.total_points + pointsToAward,
            tasks_completed: lbEntry.tasks_completed + 1,
            last_task_completed_at: now,
          })
          .eq('id', lbEntry.id);
      } else {
        // Resolve city
        let cityId = null;
        if (submission.user?.city) {
          const { data: c } = await supabase.from('cities').select('id').ilike('name', submission.user.city).maybeSingle();
          if (c) cityId = c.id;
        }
        await supabase.from('leaderboard_entries').insert({
          user_id: submission.user_id,
          city_id: cityId,
          total_points: pointsToAward,
          tasks_completed: 1,
          last_task_completed_at: now,
        });
      }

      // Update Submission status
      const { data: updatedSubmission, error: updateErr } = await supabase
        .from('task_submissions')
        .update({
          status: 'approved',
          points_awarded: pointsToAward,
          reviewed_by: reviewerId,
          reviewed_by_name: reviewerName,
          reviewed_at: now,
          review_notes: review_notes || 'Verified and approved by moderator.',
          updated_at: now,
        })
        .eq('id', submission.id)
        .select('*')
        .single();

      if (updateErr) throw updateErr;

      return res.status(200).json({
        success: true,
        action: 'approved',
        message: `Task approved! +${pointsToAward} Eco Points awarded to ${submission.user?.name || 'Citizen'}.`,
        submission: updatedSubmission,
      });
    }

    if (action === 'reject') {
      const { data: updatedSubmission, error: updateErr } = await supabase
        .from('task_submissions')
        .update({
          status: 'rejected',
          points_awarded: 0,
          reviewed_by: reviewerId,
          reviewed_by_name: reviewerName,
          reviewed_at: now,
          review_notes: review_notes,
          updated_at: now,
        })
        .eq('id', submission.id)
        .select('*')
        .single();

      if (updateErr) throw updateErr;

      return res.status(200).json({
        success: true,
        action: 'rejected',
        message: 'Submission rejected. User may resubmit updated evidence.',
        submission: updatedSubmission,
      });
    }

    if (action === 'request_more_evidence') {
      const { data: updatedSubmission, error: updateErr } = await supabase
        .from('task_submissions')
        .update({
          status: 'more_evidence_required',
          reviewed_by: reviewerId,
          reviewed_by_name: reviewerName,
          reviewed_at: now,
          review_notes: review_notes,
          updated_at: now,
        })
        .eq('id', submission.id)
        .select('*')
        .single();

      if (updateErr) throw updateErr;

      return res.status(200).json({
        success: true,
        action: 'more_evidence_required',
        message: 'Requested additional evidence from user.',
        submission: updatedSubmission,
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── LEGACY COMPLETE TASK (Deprecated: redirects to verification flow) ───────

exports.completeTask = async (req, res) => {
  return res.status(400).json({
    success: false,
    message: 'Immediate completion without verification is disabled. Please submit photo evidence via /api/tasks/:id/submit-proof.',
  });
};