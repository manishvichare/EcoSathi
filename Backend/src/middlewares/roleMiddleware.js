// src/middlewares/roleMiddleware.js
// Role-based access control guard.
// Usage: router.post('/admin-route', authMiddleware.protect, roleMiddleware.adminOnly, handler)

/**
 * Restrict route to admin users only.
 * Must be used AFTER authMiddleware.protect (which sets req.user).
 */
exports.adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  const isAuthorizedRole =
    req.user.role === 'admin' ||
    req.user.role === 'moderator' ||
    req.user.email?.toLowerCase().trim() === 'vicharemanish717@gmail.com';

  if (!isAuthorizedRole) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. This action requires coordinator/admin privileges.',
    });
  }
  next();
};

/**
 * Restrict route to Municipal Authority officers or administrators.
 */
exports.authorityOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  const isAuthorized =
    req.user.role === 'admin' ||
    req.user.role === 'authority' ||
    req.user.role === 'moderator' ||
    req.user.email?.toLowerCase().trim() === 'vicharemanish717@gmail.com' ||
    req.user.email?.toLowerCase().trim() === 'authority@ecosathi.gov.in';

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. This action requires Municipal Authority or Administrator privileges.',
    });
  }
  next();
};

