const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/auth');
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transactionController');

router.get('/', authMiddleware, getTransactions);
router.get('/:id', authMiddleware, getTransaction);
router.post('/', authMiddleware, createTransaction);
router.put('/:id', authMiddleware, adminOnly, updateTransaction);
router.delete('/:id', authMiddleware, adminOnly, deleteTransaction);

module.exports = router;
