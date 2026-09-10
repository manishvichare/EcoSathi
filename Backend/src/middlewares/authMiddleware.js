// src/middlewares/authMiddleware.js
// Verifies the JWT sent by the frontend (Authorization: Bearer <token>)
// and attaches the decoded user id to req.user so controllers can use it
// (e.g. complaintController, leaderboardController).

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { supabase } = require('../config/db');

// protect: require a valid JWT to access the route
exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, env.JWT_SECRET); // { id: userId, iat, exp }

    // Confirm the user still exists (in case they were deleted after the token was issued)
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', decoded.id)
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    req.user = { id: user.id, email: user.email, name: user.name, role: user.role }; // controllers read req.user
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// adminOnly: use after protect, for admin-restricted routes (e.g. sending notices)
exports.adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};