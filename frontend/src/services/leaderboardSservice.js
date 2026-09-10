import api from './api';

/**
 * Leaderboard & Eco Tasks Service - EcoSathi
 * Evidence-based verification system.
 */



const MOCK_TASKS = [
  {
    id: 'task-1',
    title: 'Plant a Native Sapling',
    description: 'Plant a native neem, banyan, or peepal tree in your neighborhood.',
    points: 50,
    category: 'planting',
    verificationConfig: {
      type: 'planting',
      requiresBeforeAfter: false,
      requiresPhoto: true,
      requiresLocation: true,
      label: 'Tree Planting',
      instruction: 'Take a clear photo of the newly planted sapling with visible surrounding soil.',
    },
  },
  {
    id: 'task-2',
    title: 'Cycle to Work / Micro-Mobility',
    description: 'Replace motor vehicle transit with cycling or walking for 5 km today.',
    points: 30,
    category: 'transport',
    verificationConfig: {
      type: 'transport',
      requiresBeforeAfter: false,
      requiresPhoto: true,
      requiresLocation: false,
      label: 'Green Mobility',
      instruction: 'Upload a photo of your bicycle, transit pass, or route activity log.',
    },
  },
  {
    id: 'task-3',
    title: 'Report Pollution Hotspot',
    description: 'Submit an environmental complaint with photo proof on EcoSathi.',
    points: 20,
    category: 'reporting',
    verificationConfig: {
      type: 'reporting',
      requiresBeforeAfter: false,
      requiresPhoto: false,
      requiresLocation: false,
      allowsReportLink: true,
      label: 'Pollution Reporting',
      instruction: 'Link an existing EcoSathi complaint or upload a pollution observation photo.',
    },
  },
  {
    id: 'task-4',
    title: 'Zero Single-Use Plastic Day',
    description: 'Avoid all single-use plastic bags, cups, and cutlery for 24 hours.',
    points: 15,
    category: 'recycling',
    verificationConfig: {
      type: 'recycling',
      requiresBeforeAfter: false,
      requiresPhoto: true,
      requiresLocation: false,
      label: 'Zero-Waste / Reuse',
      instruction: 'Upload a photo demonstrating your reusable alternative or segregated waste.',
    },
  },
  {
    id: 'task-5',
    title: 'Rainwater Harvesting',
    description: 'Set up or maintain a rainwater harvesting unit.',
    points: 40,
    category: 'water',
    verificationConfig: {
      type: 'general',
      requiresBeforeAfter: false,
      requiresPhoto: true,
      requiresLocation: true,
      label: 'Water Conservation',
      instruction: 'Upload a photo/video of your rainwater catchment installation.',
    },
  },
  {
    id: 'task-6',
    title: 'Switch to Solar',
    description: 'Install or advocate for rooftop solar panels.',
    points: 60,
    category: 'energy',
    verificationConfig: {
      type: 'general',
      requiresBeforeAfter: false,
      requiresPhoto: true,
      requiresLocation: false,
      label: 'Clean Energy',
      instruction: 'Upload a photo of your solar installation or community advocacy.',
    },
  },
  {
    id: 'task-7',
    title: 'Community Cleanup Drive',
    description: 'Organize or participate in a local cleanup. Submit Before & After photos.',
    points: 45,
    category: 'cleanup',
    verificationConfig: {
      type: 'cleanup',
      requiresBeforeAfter: true,
      requiresPhoto: true,
      requiresLocation: true,
      label: 'Cleanup Action',
      instruction: 'Upload a BEFORE photo and an AFTER photo proving your cleanup efforts.',
    },
  },
];

// ─── Fetch Leaderboard ────────────────────────────────────────────────────────

export async function getLeaderboard(city = 'Pune') {
  try {
    const response = await api.get('/leaderboard', { params: { city } });
    if (response.data?.success && Array.isArray(response.data.leaderboard)) {
      return response.data.leaderboard.map((item, idx) => ({
        rank: idx + 1,
        userId: item.user_id || item.user?.id || `user-${idx}`,
        name: item.user?.name || `Eco Hero #${idx + 1}`,
        city: item.city?.name || item.user?.city || city,
        points: item.total_points ?? item.points ?? 0,
        tasksCompleted: item.tasks_completed ?? 0,
      }));
    }
    return [];
  } catch (apiError) {
    console.warn('Leaderboard API fetch error:', apiError.message);
    return [];
  }
}

// ─── Fetch Active Tasks ───────────────────────────────────────────────────────

export async function getTasks() {
  try {
    const response = await api.get('/tasks');
    if (response.data?.success && Array.isArray(response.data.tasks)) {
      return response.data.tasks;
    }
    return MOCK_TASKS;
  } catch (err) {
    console.warn('Backend tasks offline, using fallback tasks:', err.message);
    return MOCK_TASKS;
  }
}

// ─── Fetch User Submissions ───────────────────────────────────────────────────

export async function getUserTaskSubmissions() {
  try {
    const response = await api.get('/tasks/my-submissions');
    return response.data?.submissions || [];
  } catch (err) {
    return [];
  }
}

// ─── Fetch User Reports for Linking (Report Pollution Task) ─────────────────

export async function getUserReportsForLinking() {
  try {
    const response = await api.get('/tasks/user-reports');
    return response.data?.reports || [];
  } catch (err) {
    return [];
  }
}

// ─── Submit Task Proof ────────────────────────────────────────────────────────

/**
 * Submits evidence for an eco task.
 * @param {string} taskId
 * @param {FormData} formData containing evidence, before_evidence, description, location_lat, location_lng, location_address, linked_complaint_id
 */
export async function submitTaskProof(taskId, formData) {
  const response = await api.post(`/tasks/${taskId}/submit-proof`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return response.data;
}

// ─── Resubmit Task Proof ──────────────────────────────────────────────────────

export async function resubmitTaskProof(submissionId, formData) {
  const response = await api.post(`/tasks/submissions/${submissionId}/resubmit`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return response.data;
}

// ─── Admin: Fetch Submissions for Verification ───────────────────────────────

export async function getAdminSubmissions(params = {}) {
  const response = await api.get('/tasks/admin/submissions', { params });
  return response.data?.submissions || [];
}

// ─── Admin: Review Submission ────────────────────────────────────────────────

/**
 * @param {string} submissionId
 * @param {'approve'|'reject'|'request_more_evidence'} action
 * @param {string} reviewNotes
 */
export async function reviewTaskSubmission(submissionId, action, reviewNotes = '') {
  const response = await api.post(`/tasks/submissions/${submissionId}/review`, {
    action,
    review_notes: reviewNotes,
  });
  return response.data;
}

// ─── Legacy (Deprecated) ─────────────────────────────────────────────────────

export async function completeTask(taskId) {
  try {
    const response = await api.post(`/tasks/${taskId}/complete`);
    return response.data;
  } catch (apiError) {
    return { success: false, message: 'Please submit photo evidence for verification.' };
  }
}