const express = require('express');
const router = express.Router();
const {
  sendInvitation,
  verifyInvitation,
  acceptInvitation,
} = require('../controllers/invitationController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Protected routes (admin only)
router.post('/send', authMiddleware, adminOnly, sendInvitation);

// Public routes
router.get('/verify/:token', verifyInvitation);
router.post('/accept', acceptInvitation);

module.exports = router;
