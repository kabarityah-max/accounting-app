const express = require('express');
const router = express.Router();
const { getAllUsers, createUser, deleteUser, updateUserRole, updateUserStatus } = require('../controllers/userController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', authMiddleware, adminOnly, getAllUsers);
router.post('/', authMiddleware, adminOnly, createUser);
router.delete('/:id', authMiddleware, adminOnly, deleteUser);
router.patch('/:id/role', authMiddleware, adminOnly, updateUserRole);
router.patch('/:id/status', authMiddleware, adminOnly, updateUserStatus);

module.exports = router;
