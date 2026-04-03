const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { getAccounts, createAccount, updateAccount, deleteAccount } = require('../controllers/accountController');

router.get('/', authMiddleware, getAccounts);
router.post('/', authMiddleware, adminOnly, createAccount);
router.put('/:id', authMiddleware, adminOnly, updateAccount);
router.delete('/:id', authMiddleware, adminOnly, deleteAccount);

module.exports = router;
