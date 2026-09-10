// src/routes/leaderboardRoutes.js
// Handles leaderboard rankings and evidence-based eco task verification.

const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const taskUpload = require('../middlewares/taskUploadMiddleware');

// ─── Public routes ──────────────────────────────────────────────────────────

// GET /api/leaderboard
router.get('/leaderboard', leaderboardController.getLeaderboard);

// GET /api/tasks — list active eco tasks with verification requirements
router.get('/tasks', leaderboardController.getAllTasks);

// ─── Authenticated user routes ───────────────────────────────────────────────

// GET /api/tasks/my-submissions — user's task submissions and statuses
router.get('/tasks/my-submissions', authMiddleware.protect, leaderboardController.getUserTaskSubmissions);

// GET /api/tasks/user-reports — user's existing reports for linking to 'Report Pollution' task
router.get('/tasks/user-reports', authMiddleware.protect, leaderboardController.getUserReportsForLinking);

// POST /api/tasks/:id/submit-proof — submit task evidence for verification
router.post(
  '/tasks/:id/submit-proof',
  authMiddleware.protect,
  taskUpload,
  leaderboardController.submitTaskProof
);

// POST /api/tasks/submissions/:submissionId/resubmit — resubmit evidence after rejection or more evidence requested
router.post(
  '/tasks/submissions/:submissionId/resubmit',
  authMiddleware.protect,
  taskUpload,
  leaderboardController.resubmitTaskProof
);

// ─── Admin / Moderator routes ───────────────────────────────────────────────

// GET /api/tasks/admin/submissions — list pending submissions across all users
router.get(
  '/tasks/admin/submissions',
  authMiddleware.protect,
  roleMiddleware.adminOnly,
  leaderboardController.getAdminSubmissions
);

// POST /api/tasks/submissions/:submissionId/review — approve, reject, or request more evidence
router.post(
  '/tasks/submissions/:submissionId/review',
  authMiddleware.protect,
  roleMiddleware.adminOnly,
  leaderboardController.reviewTaskSubmission
);

// ─── Legacy route (deprecated) ──────────────────────────────────────────────
router.post('/tasks/:id/complete', authMiddleware.protect, leaderboardController.completeTask);

module.exports = router;