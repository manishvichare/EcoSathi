// src/routes/complaintRoutes.js
// Full Report Issue System Routes

const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

// ─── Public routes ──────────────────────────────────────────────────────────

// GET /api/complaints — list all with filters
router.get('/', complaintController.getAllComplaints);

// GET /api/complaints/me/supported — IDs the current user has supported
router.get('/me/supported', authMiddleware.protect, complaintController.getUserSupportedIds);

// GET /api/complaints/:id — simple single complaint
router.get('/:id', complaintController.getComplaintById);

// GET /api/complaints/:id/detail — full enriched detail (supports, help, evidence, timeline, etc.)
router.get('/:id/detail', complaintController.getComplaintDetail);

// GET /api/complaints/:id/activity — timeline events
router.get('/:id/activity', complaintController.getActivity);

// ─── Authenticated routes ────────────────────────────────────────────────────

// POST /api/complaints — create new complaint (multipart: photo + description)
router.post(
  '/',
  authMiddleware.protect,
  uploadMiddleware.single('image'),
  complaintController.createComplaint
);

// POST /api/complaints/:id/support — support this report (real DB, deduplicated)
router.post('/:id/support', authMiddleware.protect, complaintController.supportComplaint);

// DELETE /api/complaints/:id/support — remove support
router.delete('/:id/support', authMiddleware.protect, complaintController.unsupportComplaint);

// POST /api/complaints/:id/help — typed help commitment (real DB, deduplicated)
router.post('/:id/help', authMiddleware.protect, complaintController.addHelpAction);

// POST /api/complaints/:id/volunteer — legacy alias → help action
router.post('/:id/volunteer', authMiddleware.protect, complaintController.volunteerComplaint);

// POST /api/complaints/:id/evidence — upload additional evidence photo
router.post(
  '/:id/evidence',
  authMiddleware.protect,
  uploadMiddleware.single('photo'),
  complaintController.addEvidence
);

// POST /api/complaints/:id/resolution — submit resolution with evidence
router.post(
  '/:id/resolution',
  authMiddleware.protect,
  uploadMiddleware.single('photo'),
  complaintController.submitResolution
);

// PATCH /api/complaints/assignments/:aid — update assignment status
router.patch(
  '/assignments/:aid',
  authMiddleware.protect,
  complaintController.updateAssignment
);

// ─── Admin-only routes ───────────────────────────────────────────────────────

// POST /api/complaints/:id/assign — assign an action task (admin)
router.post(
  '/:id/assign',
  authMiddleware.protect,
  roleMiddleware.adminOnly,
  complaintController.assignAction
);

// POST /api/complaints/:id/authority — set authority case (admin)
router.post(
  '/:id/authority',
  authMiddleware.protect,
  roleMiddleware.adminOnly,
  complaintController.setAuthority
);

// POST /api/complaints/:id/authority/response — add authority response (admin)
router.post(
  '/:id/authority/response',
  authMiddleware.protect,
  roleMiddleware.adminOnly,
  complaintController.addAuthorityResponse
);

// POST /api/complaints/:id/authority-action — take official action on complaint (Authority or Admin)
router.post(
  '/:id/authority-action',
  authMiddleware.protect,
  roleMiddleware.authorityOrAdmin,
  uploadMiddleware.single('photo'),
  complaintController.takeAuthorityAction
);

// POST /api/complaints/:id/resolution/verify — approve or reject resolution (admin)
router.post(
  '/:id/resolution/verify',
  authMiddleware.protect,
  roleMiddleware.adminOnly,
  complaintController.verifyResolution
);

module.exports = router;