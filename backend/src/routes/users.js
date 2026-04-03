const express = require('express');
const router = express.Router();
const { getAllUsers, createUser, deleteUser } = require('../controllers/userController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', authMiddleware, adminOnly, getAllUsers);
router.post('/', authMiddleware, adminOnly, createUser);
router.delete('/:id', authMiddleware, adminOnly, deleteUser);

module.exports = router;
