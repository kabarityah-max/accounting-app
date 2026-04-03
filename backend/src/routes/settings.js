const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/auth');

let defaultExchangeRate = parseFloat(process.env.DEFAULT_EXCHANGE_RATE) || 0.71;

router.get('/exchange-rate', authMiddleware, (req, res) => {
  res.json({ exchangeRate: defaultExchangeRate });
});

router.put('/exchange-rate', authMiddleware, adminOnly, (req, res) => {
  const { exchangeRate } = req.body;
  if (!exchangeRate || isNaN(exchangeRate) || exchangeRate <= 0) {
    return res.status(400).json({ error: 'Valid exchange rate required' });
  }
  defaultExchangeRate = parseFloat(exchangeRate);
  res.json({ exchangeRate: defaultExchangeRate });
});

module.exports = router;
