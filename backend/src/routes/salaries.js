const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { getSalaryPayments, paySalary } = require('../controllers/salaryController');

router.get('/', authMiddleware, adminOnly, getSalaryPayments);
router.post('/', authMiddleware, adminOnly, paySalary);

module.exports = router;
