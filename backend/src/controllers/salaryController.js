const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getSalaryPayments(req, res) {
  try {
    const { periodId, employeeId } = req.query;
    const where = {};
    if (periodId) where.periodId = parseInt(periodId);
    if (employeeId) where.employeeId = parseInt(employeeId);

    const payments = await prisma.salaryPayment.findMany({
      where,
      include: {
        employee: true,
        period: { select: { name: true } },
        transaction: true,
      },
      orderBy: { paymentDate: 'desc' },
    });
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function paySalary(req, res) {
  try {
    const { employeeId, periodId, amount, currency, paymentDate, notes } = req.body;

    if (!employeeId || !amount || !currency || !paymentDate) {
      return res.status(400).json({ error: 'Required: employeeId, amount, currency, paymentDate' });
    }

    const employee = await prisma.employee.findUnique({ where: { id: parseInt(employeeId) } });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    if (!employee.active) return res.status(400).json({ error: 'Employee is inactive' });

    // Check period not closed
    if (periodId) {
      const period = await prisma.financialPeriod.findUnique({ where: { id: parseInt(periodId) } });
      if (period && period.isClosed && req.user.role !== 'ADMIN') {
        return res.status(400).json({ error: 'Cannot add to closed period' });
      }
    }

    // Get accounts for journal entry
    const salaryExpense = await prisma.account.findUnique({ where: { code: '5002' } });
    const cashCode = currency === 'USD' ? '1001' : '1000';
    const cashAccount = await prisma.account.findUnique({ where: { code: cashCode } });

    if (!salaryExpense || !cashAccount) {
      return res.status(400).json({ error: 'Required accounts not found' });
    }

    // Default exchange rate
    const exchangeRate = currency === 'JOD' ? 1 : parseFloat(process.env.DEFAULT_EXCHANGE_RATE) || 0.71;

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          date: new Date(paymentDate),
          description: `Salary payment - ${employee.name}`,
          type: 'SALARY',
          currency,
          exchangeRate,
          createdBy: req.user.id,
          periodId: periodId ? parseInt(periodId) : null,
          journalEntries: {
            create: [
              {
                accountId: salaryExpense.id,
                debitAmount: parseFloat(amount),
                creditAmount: 0,
                currency,
              },
              {
                accountId: cashAccount.id,
                debitAmount: 0,
                creditAmount: parseFloat(amount),
                currency,
              },
            ],
          },
        },
      });

      const payment = await tx.salaryPayment.create({
        data: {
          employeeId: parseInt(employeeId),
          periodId: periodId ? parseInt(periodId) : null,
          amount: parseFloat(amount),
          currency,
          paymentDate: new Date(paymentDate),
          transactionId: transaction.id,
          notes,
        },
        include: { employee: true, transaction: { include: { journalEntries: true } } },
      });

      return payment;
    });

    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getSalaryPayments, paySalary };
