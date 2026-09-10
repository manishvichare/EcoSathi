import api from './api';

/**
 * Complaint Service
 * All calls are backed by real Supabase DB via the EcoSathi backend API.
 * No fake counters. No silent local-only increments.
 */

// ─── Offline fallback data (only used when backend is unreachable) ────────────

// ─── List Complaints ──────────────────────────────────────────────────────────

export async function getComplaints(params = {}) {
  try {
    const response = await api.get('/complaints', { params });
    if (response.data?.success && Array.isArray(response.data.complaints)) {
      return response.data.complaints;
    }
    return response.data || [];
  } catch (error) {
    console.warn('Backend complaints fetch failed:', error.message);
    return [];
  }
}

// ─── Get Single Complaint (Simple) ───────────────────────────────────────────

export async function getComplaint(complaintId) {
  try {
    const response = await api.get(`/complaints/${complaintId}`);
    return response.data?.complaint || response.data;
  } catch (apiError) {
    const found = MOCK_COMPLAINTS.find(c => c.id === complaintId);
    if (!found) throw new Error('Complaint not found');
    return found;
  }
}

// ─── Get Full Enriched Detail ─────────────────────────────────────────────────

export async function getComplaintDetail(complaintId) {
  const response = await api.get(`/complaints/${complaintId}/detail`);
  return response.data?.complaint || response.data;
}

// ─── Submit New Complaint ─────────────────────────────────────────────────────

export async function submitComplaint(complaintData) {
  const cityName = complaintData.cityName || complaintData.city || 'Pune';
  const formData = new FormData();
  formData.append('description', complaintData.description);
  formData.append('cityName', cityName);
  formData.append('category', complaintData.category || 'other');
  formData.append('address', complaintData.location || complaintData.address || `${cityName}, Area`);

  if (complaintData.lat) formData.append('lat', complaintData.lat);
  if (complaintData.lng) formData.append('lng', complaintData.lng);
  if (complaintData.photo instanceof File) formData.append('photo', complaintData.photo);

  try {
    const response = await api.post('/complaints', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 90000,
    });
    return response.data?.complaint || response.data;
  } catch (apiError) {
    const serverMessage = apiError.response?.data?.message || apiError.message;
    const err = new Error(serverMessage);
    err.code = apiError.response?.data?.code;
    err.details = apiError.response?.data?.details;
    throw err;
  }
}

// ─── Support Complaint (real DB, deduplicated) ────────────────────────────────

/**
 * @returns {{ success, supportCount, alreadySupported? }}
 * Throws on network error. Returns 409 data if already supported.
 */
export async function supportComplaint(id) {
  try {
    const res = await api.post(`/complaints/${id}/support`);
    return res.data;
  } catch (err) {
    if (err.response?.status === 409) {
      return { ...err.response.data, success: false, alreadySupported: true };
    }
    if (err.response?.status === 401) {
      throw new Error('Please log in to support this report.');
    }
    throw err;
  }
}

// ─── Unsupport Complaint ──────────────────────────────────────────────────────

export async function unsupportComplaint(id) {
  const res = await api.delete(`/complaints/${id}/support`);
  return res.data;
}

// ─── Add Help Action (typed, real DB, deduplicated) ───────────────────────────

/**
 * @param {string} id - complaint ID
 * @param {string} helpType - one of: visit_location | provide_photos | provide_information |
 *                                     help_cleanup | contact_authority | volunteer_action
 * @param {string} [notes] - optional notes
 */
export async function addHelpAction(id, helpType, notes = '') {
  try {
    const res = await api.post(`/complaints/${id}/help`, { help_type: helpType, notes });
    return res.data;
  } catch (err) {
    if (err.response?.status === 409) {
      return { ...err.response.data, success: false, alreadyHelping: true };
    }
    if (err.response?.status === 401) {
      throw new Error('Please log in to offer help.');
    }
    throw err;
  }
}

// Legacy alias
export async function volunteerComplaint(id) {
  return addHelpAction(id, 'volunteer_action');
}

// ─── Upload Additional Evidence ───────────────────────────────────────────────

export async function addEvidence(complaintId, photo, evidenceType = 'additional', description = '') {
  const formData = new FormData();
  formData.append('photo', photo);
  formData.append('evidence_type', evidenceType);
  formData.append('description', description);

  const res = await api.post(`/complaints/${complaintId}/evidence`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return res.data;
}

// ─── Submit Resolution ────────────────────────────────────────────────────────

export async function submitResolution(complaintId, { photo, resolution_type, description, notes }) {
  const formData = new FormData();
  formData.append('photo', photo);
  formData.append('resolution_type', resolution_type);
  formData.append('description', description);
  if (notes) formData.append('notes', notes);

  const res = await api.post(`/complaints/${complaintId}/resolution`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return res.data;
}

// ─── Verify Resolution (admin) ────────────────────────────────────────────────

export async function verifyResolution(complaintId, approved, reviewNotes = '') {
  const res = await api.post(`/complaints/${complaintId}/resolution/verify`, {
    approved,
    review_notes: reviewNotes,
  });
  return res.data;
}

// ─── Assign Action (admin) ────────────────────────────────────────────────────

export async function assignAction(complaintId, { action_type, instructions, deadline, assignee_name }) {
  const res = await api.post(`/complaints/${complaintId}/assign`, {
    action_type, instructions, deadline, assignee_name,
  });
  return res.data;
}

// ─── Update Assignment ────────────────────────────────────────────────────────

export async function updateAssignment(assignmentId, { status, completion_description, completion_evidence_url }) {
  const res = await api.patch(`/complaints/assignments/${assignmentId}`, {
    status, completion_description, completion_evidence_url,
  });
  return res.data;
}

// ─── Set Authority (admin) ────────────────────────────────────────────────────

export async function setAuthority(complaintId, { department, reference_number, submitted_date, submission_status, notes }) {
  const res = await api.post(`/complaints/${complaintId}/authority`, {
    department, reference_number, submitted_date, submission_status, notes,
  });
  return res.data;
}

// ─── Add Authority Response (admin) ──────────────────────────────────────────

export async function addAuthorityResponse(complaintId, { response_text, response_date }) {
  const res = await api.post(`/complaints/${complaintId}/authority/response`, {
    response_text, response_date,
  });
  return res.data;
}

// ─── Take Authority Action (Authority or Admin) ──────────────────────────────

export async function takeAuthorityAction(complaintId, { status, department, action_notes, reference_number, action_type, photo }) {
  let payload;
  let headers = {};

  if (photo) {
    payload = new FormData();
    payload.append('status', status || 'action_in_progress');
    payload.append('department', department || 'Municipal Enforcement');
    payload.append('action_notes', action_notes || '');
    if (reference_number) payload.append('reference_number', reference_number);
    if (action_type) payload.append('action_type', action_type);
    payload.append('photo', photo);
    headers['Content-Type'] = 'multipart/form-data';
  } else {
    payload = {
      status: status || 'action_in_progress',
      department: department || 'Municipal Enforcement',
      action_notes: action_notes || '',
      reference_number: reference_number || undefined,
      action_type: action_type || undefined,
    };
  }

  const res = await api.post(`/complaints/${complaintId}/authority-action`, payload, { headers });
  return res.data;
}


// ─── Get IDs of reports the current user has supported ───────────────────────

export async function getUserSupportedIds() {
  try {
    const res = await api.get('/complaints/me/supported');
    return res.data?.supportedIds || [];
  } catch {
    return [];
  }
}

// ─── Get Activity Timeline ────────────────────────────────────────────────────

export async function getComplaintActivity(complaintId) {
  const res = await api.get(`/complaints/${complaintId}/activity`);
  return res.data?.activity || [];
}

// ─── Categories ───────────────────────────────────────────────────────────────

export function getComplaintCategories() {
  return [
    { value: 'all', label: 'All Categories' },
    { value: 'air-pollution', label: '💨 Air Pollution' },
    { value: 'illegal-dumping', label: '🗑️ Garbage / Illegal Dumping' },
    { value: 'water-pollution', label: '💧 Water Contamination' },
    { value: 'tree-cutting', label: '🌳 Tree Felling / Greenery' },
    { value: 'plastic-waste', label: '🛍️ Plastic Pollution' },
    { value: 'other', label: '⚠️ Other Environmental Issue' },
  ];
}

export function getMockComplaints() {
  return MOCK_COMPLAINTS;
}