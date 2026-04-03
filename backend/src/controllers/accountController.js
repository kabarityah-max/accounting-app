const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getAccounts(req, res) {
  try {
    const accounts = await prisma.account.findMany({ orderBy: { code: 'asc' } });
    res.json(accounts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function createAccount(req, res) {
  try {
    const { code, name, type, normalBalance } = req.body;
    if (!code || !name || !type || !normalBalance) {
      return res.status(400).json({ error: 'All fields required' });
    }
    const account = await prisma.account.create({
      data: { code, name, type, normalBalance },
    });
    res.status(201).json(account);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Account code already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateAccount(req, res) {
  try {
    const { id } = req.params;
    const { code, name, type, normalBalance } = req.body;
    const account = await prisma.account.update({
      where: { id: parseInt(id) },
      data: { code, name, type, normalBalance },
    });
    res.json(account);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Account not found' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function deleteAccount(req, res) {
  try {
    const { id } = req.params;
    await prisma.account.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Account deleted' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Account not found' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getAccounts, createAccount, updateAccount, deleteAccount };
