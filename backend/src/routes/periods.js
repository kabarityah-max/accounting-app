const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { getPeriods, createPeriod, closePeriod } = require('../controllers/periodController');

router.get('/', authMiddleware, getPeriods);
router.post('/', authMiddleware, adminOnly, createPeriod);
router.patch('/:id/close', authMiddleware, adminOnly, closePeriod);

module.exports = router;
