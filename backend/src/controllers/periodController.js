const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getPeriods(req, res) {
  try {
    const periods = await prisma.financialPeriod.findMany({
      orderBy: { startDate: 'desc' },
      include: { creator: { select: { name: true } } },
    });
    res.json(periods);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function createPeriod(req, res) {
  try {
    const { name, startDate, endDate } = req.body;
    if (!name || !startDate || !endDate) {
      return res.status(400).json({ error: 'Name, start date, and end date required' });
    }
    const period = await prisma.financialPeriod.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        createdBy: req.user.id,
      },
    });
    res.status(201).json(period);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function closePeriod(req, res) {
  try {
    const { id } = req.params;
    const period = await prisma.financialPeriod.update({
      where: { id: parseInt(id) },
      data: { isClosed: true },
    });
    res.json(period);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Period not found' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getPeriods, createPeriod, closePeriod };
