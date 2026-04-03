const express = require('express');
const router = express.Router();
const { login, me, logout } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', authMiddleware, me);
router.post('/logout', logout);

module.exports = router;
