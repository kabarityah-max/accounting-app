const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getTransactions(req, res) {
  try {
    const { periodId, type, limit } = req.query;
    const where = {};

    // Employees can only see their own transactions
    if (req.user.role !== 'ADMIN') {
      where.createdBy = req.user.id;
    }
    if (periodId) where.periodId = parseInt(periodId);
    if (type) where.type = type;

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        journalEntries: { include: { account: true } },
        user: { select: { name: true } },
        period: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
      take: limit ? parseInt(limit) : undefined,
    });
    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getTransaction(req, res) {
  try {
    const { id } = req.params;
    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
      include: {
        journalEntries: { include: { account: true } },
        user: { select: { name: true } },
        period: { select: { name: true } },
      },
    });
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    if (req.user.role !== 'ADMIN' && transaction.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(transaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

// Account code mapping for auto journal entries
const ACCOUNT_MAP = {
  SALE: { debit: '1000', credit: '4000' },
  PURCHASE: { debit: '5000', credit: '1000' },
  SERVICE_SALE: { debit: '1000', credit: '4001' },
  SERVICE_PURCHASE: { debit: '5001', credit: '1000' },
};

async function createTransaction(req, res) {
  try {
    const { date, description, type, currency, exchangeRate, periodId, amount, counterparty, notes, debitAccountId, creditAccountId } = req.body;

    if (!date || !description || !type || !currency || !exchangeRate || !amount) {
      return res.status(400).json({ error: 'Required fields: date, description, type, currency, exchangeRate, amount' });
    }

    if (!debitAccountId && !creditAccountId) {
      return res.status(400).json({ error: 'Select at least a debit or credit account' });
    }

    // Check period is not closed (admins can override)
    if (periodId && req.user.role !== 'ADMIN') {
      const period = await prisma.financialPeriod.findUnique({ where: { id: parseInt(periodId) } });
      if (period && period.isClosed) {
        return res.status(400).json({ error: 'Cannot add transactions to a closed period' });
      }
    }

    const fullDescription = counterparty ? `${description} - ${counterparty}` : description;

    // Build journal entries based on what accounts the user selected
    const journalEntries = [];

    if (debitAccountId) {
      journalEntries.push({
        accountId: parseInt(debitAccountId),
        debitAmount: parseFloat(amount),
        creditAmount: 0,
        currency,
        note: notes || null,
      });
    }

    if (creditAccountId) {
      journalEntries.push({
        accountId: parseInt(creditAccountId),
        debitAmount: 0,
        creditAmount: parseFloat(amount),
        currency,
        note: notes || null,
      });
    }

    const transaction = await prisma.transaction.create({
      data: {
        date: new Date(date),
        description: fullDescription,
        type,
        currency,
        exchangeRate,
        createdBy: req.user.id,
        periodId: periodId ? parseInt(periodId) : null,
        journalEntries: {
          create: journalEntries,
        },
      },
      include: {
        journalEntries: { include: { account: true } },
      },
    });

    res.status(201).json(transaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateTransaction(req, res) {
  try {
    const { id } = req.params;
    const { date, description, type, currency, exchangeRate, periodId, amount, counterparty, notes, debitAccountId, creditAccountId } = req.body;

    const existing = await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
      include: { journalEntries: true },
    });
    if (!existing) return res.status(404).json({ error: 'Transaction not found' });

    const cur = currency || existing.currency;
    const fullDescription = counterparty
      ? `${description || existing.description} - ${counterparty}`
      : (description || existing.description);
    const newAmount = amount ? parseFloat(amount) : parseFloat(existing.journalEntries[0]?.debitAmount || existing.journalEntries[0]?.creditAmount || 0);

    // Build journal entries based on selected accounts
    const journalEntries = [];
    if (debitAccountId) {
      journalEntries.push({
        accountId: parseInt(debitAccountId),
        debitAmount: newAmount,
        creditAmount: 0,
        currency: cur,
        note: notes !== undefined ? notes : null,
      });
    }
    if (creditAccountId) {
      journalEntries.push({
        accountId: parseInt(creditAccountId),
        debitAmount: 0,
        creditAmount: newAmount,
        currency: cur,
        note: notes !== undefined ? notes : null,
      });
    }

    if (journalEntries.length === 0) {
      return res.status(400).json({ error: 'Select at least a debit or credit account' });
    }

    // Delete old journal entries and create new ones
    await prisma.journalEntry.deleteMany({ where: { transactionId: parseInt(id) } });

    const transaction = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: {
        date: date ? new Date(date) : undefined,
        description: fullDescription,
        type: type || undefined,
        currency: cur,
        exchangeRate: exchangeRate ? parseFloat(exchangeRate) : undefined,
        periodId: periodId !== undefined ? (periodId ? parseInt(periodId) : null) : undefined,
        journalEntries: {
          create: journalEntries,
        },
      },
      include: { journalEntries: { include: { account: true } } },
    });

    res.json(transaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function deleteTransaction(req, res) {
  try {
    const { id } = req.params;
    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
      include: { period: true },
    });
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    if (transaction.period && transaction.period.isClosed && req.user.role !== 'ADMIN') {
      return res.status(400).json({ error: 'Cannot delete transactions from a closed period' });
    }

    await prisma.transaction.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction };
