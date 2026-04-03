const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { getDashboard, getTrialBalance, getIncomeStatement, getBalanceSheet, getGeneralLedger, exportPdf } = require('../controllers/reportController');

router.get('/dashboard', authMiddleware, getDashboard);
router.get('/trial-balance', authMiddleware, adminOnly, getTrialBalance);
router.get('/income-statement', authMiddleware, adminOnly, getIncomeStatement);
router.get('/balance-sheet', authMiddleware, adminOnly, getBalanceSheet);
router.get('/general-ledger', authMiddleware, adminOnly, getGeneralLedger);
router.get('/export-pdf/:type', authMiddleware, adminOnly, exportPdf);

module.exports = router;
