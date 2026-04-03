const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');
const prisma = new PrismaClient();

function convertAmount(amount, fromCurrency, toCurrency, exchangeRate) {
  const amt = parseFloat(amount);
  if (fromCurrency === toCurrency) return amt;
  if (fromCurrency === 'USD' && toCurrency === 'JOD') return amt * parseFloat(exchangeRate);
  if (fromCurrency === 'JOD' && toCurrency === 'USD') return amt / parseFloat(exchangeRate);
  return amt;
}

// Calculate net balance per account from journal entries
function calcAccountBalances(entries, displayCurrency) {
  const balances = {};
  for (const entry of entries) {
    const rate = entry.transaction.exchangeRate;
    const debit = convertAmount(entry.debitAmount, entry.currency, displayCurrency, rate);
    const credit = convertAmount(entry.creditAmount, entry.currency, displayCurrency, rate);
    const key = entry.account.code;

    if (!balances[key]) {
      balances[key] = { account: entry.account, net: 0 };
    }
    // Net = total debits minus total credits
    balances[key].net += debit - credit;
  }
  return balances;
}

async function getDashboard(req, res) {
  try {
    const displayCurrency = req.query.currency || 'JOD';

    const entries = await prisma.journalEntry.findMany({
      include: { account: true, transaction: true },
    });

    const balances = calcAccountBalances(entries, displayCurrency);

    let totalRevenue = 0;
    let totalExpenses = 0;
    let cashBalance = 0;

    for (const b of Object.values(balances)) {
      const { account, net } = b;
      // Revenue accounts have credit normal balance, so positive net means more debits (unusual)
      // Revenue = credit - debit = -net
      if (account.type === 'REVENUE') {
        totalRevenue += -net; // flip: revenue grows with credits
      } else if (account.type === 'EXPENSE') {
        totalExpenses += net; // expenses grow with debits (positive net)
      }
      if (account.code === '1000' || account.code === '1001') {
        cashBalance += net; // cash grows with debits (positive net)
      }
    }

    const recentTransactions = await prisma.transaction.findMany({
      orderBy: { date: 'desc' },
      take: 10,
      include: {
        journalEntries: { include: { account: true } },
        user: { select: { name: true } },
      },
    });

    res.json({
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netProfit: Math.round((totalRevenue - totalExpenses) * 100) / 100,
      cashBalance: Math.round(cashBalance * 100) / 100,
      currency: displayCurrency,
      recentTransactions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getTrialBalance(req, res) {
  try {
    const { periodId, currency: displayCurrency = 'JOD' } = req.query;

    const where = {};
    if (periodId) where.transaction = { periodId: parseInt(periodId) };

    const entries = await prisma.journalEntry.findMany({
      where,
      include: { account: true, transaction: true },
    });

    const balances = calcAccountBalances(entries, displayCurrency);

    // Show net balance on the correct side (debit or credit) per account
    const rows = Object.values(balances)
      .map((b) => {
        const net = Math.round(b.net * 100) / 100;
        // If net is positive, balance is on debit side; if negative, on credit side
        return {
          code: b.account.code,
          name: b.account.name,
          type: b.account.type,
          debit: net > 0 ? net : 0,
          credit: net < 0 ? Math.abs(net) : 0,
        };
      })
      .filter((r) => r.debit !== 0 || r.credit !== 0)
      .sort((a, b) => a.code.localeCompare(b.code));

    const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

    res.json({
      rows,
      totalDebit: Math.round(totalDebit * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
      currency: displayCurrency,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getIncomeStatement(req, res) {
  try {
    const { periodId, currency: displayCurrency = 'JOD' } = req.query;
    const where = {};
    if (periodId) where.transaction = { periodId: parseInt(periodId) };

    const entries = await prisma.journalEntry.findMany({
      where,
      include: { account: true, transaction: true },
    });

    const balances = calcAccountBalances(entries, displayCurrency);

    const revenueItems = [];
    const expenseItems = [];

    for (const b of Object.values(balances)) {
      const { account, net } = b;
      if (account.type === 'REVENUE') {
        // Revenue normal balance is credit, so amount = -net
        const amount = Math.round(-net * 100) / 100;
        if (amount !== 0) revenueItems.push({ code: account.code, name: account.name, amount });
      } else if (account.type === 'EXPENSE') {
        // Expense normal balance is debit, so amount = net
        const amount = Math.round(net * 100) / 100;
        if (amount !== 0) expenseItems.push({ code: account.code, name: account.name, amount });
      }
    }

    const totalRevenue = revenueItems.reduce((s, i) => s + i.amount, 0);
    const totalExpenses = expenseItems.reduce((s, i) => s + i.amount, 0);

    res.json({
      revenue: revenueItems,
      expenses: expenseItems,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netProfit: Math.round((totalRevenue - totalExpenses) * 100) / 100,
      currency: displayCurrency,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getBalanceSheet(req, res) {
  try {
    const { periodId, currency: displayCurrency = 'JOD' } = req.query;
    const where = {};
    if (periodId) where.transaction = { periodId: parseInt(periodId) };

    const entries = await prisma.journalEntry.findMany({
      where,
      include: { account: true, transaction: true },
    });

    const balances = calcAccountBalances(entries, displayCurrency);

    const assets = [];
    const liabilities = [];
    const equity = [];
    let netProfit = 0;

    for (const b of Object.values(balances)) {
      const { account, net } = b;
      const rounded = Math.round(net * 100) / 100;

      switch (account.type) {
        case 'ASSET':
          // Assets normal balance is debit, amount = net
          if (rounded !== 0) assets.push({ code: account.code, name: account.name, amount: rounded });
          break;
        case 'LIABILITY':
          // Liabilities normal balance is credit, amount = -net
          if (rounded !== 0) liabilities.push({ code: account.code, name: account.name, amount: -rounded });
          break;
        case 'EQUITY':
          // Equity normal balance is credit, amount = -net
          if (rounded !== 0) equity.push({ code: account.code, name: account.name, amount: -rounded });
          break;
        case 'REVENUE':
          netProfit += -net; // revenue = credits = -net
          break;
        case 'EXPENSE':
          netProfit -= net; // expenses = debits = net
          break;
      }
    }

    const totalAssets = assets.reduce((s, i) => s + i.amount, 0);
    const totalLiabilities = liabilities.reduce((s, i) => s + i.amount, 0);
    const totalEquity = equity.reduce((s, i) => s + i.amount, 0) + Math.round(netProfit * 100) / 100;

    res.json({
      assets,
      liabilities,
      equity,
      netProfit: Math.round(netProfit * 100) / 100,
      totalAssets: Math.round(totalAssets * 100) / 100,
      totalLiabilities: Math.round(totalLiabilities * 100) / 100,
      totalEquity: Math.round(totalEquity * 100) / 100,
      currency: displayCurrency,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getGeneralLedger(req, res) {
  try {
    const { accountId, periodId, currency: displayCurrency = 'JOD' } = req.query;
    const where = {};
    if (accountId) where.accountId = parseInt(accountId);
    if (periodId) where.transaction = { periodId: parseInt(periodId) };

    const entries = await prisma.journalEntry.findMany({
      where,
      include: {
        account: true,
        transaction: { select: { id: true, date: true, description: true, exchangeRate: true } },
      },
      orderBy: { transaction: { date: 'asc' } },
    });

    let runningBalance = 0;
    const rows = entries.map((entry) => {
      const rate = entry.transaction.exchangeRate;
      const debit = convertAmount(entry.debitAmount, entry.currency, displayCurrency, rate);
      const credit = convertAmount(entry.creditAmount, entry.currency, displayCurrency, rate);

      if (entry.account.normalBalance === 'DEBIT') {
        runningBalance += debit - credit;
      } else {
        runningBalance += credit - debit;
      }

      return {
        date: entry.transaction.date,
        description: entry.transaction.description,
        accountCode: entry.account.code,
        accountName: entry.account.name,
        debit: Math.round(debit * 100) / 100,
        credit: Math.round(credit * 100) / 100,
        balance: Math.round(runningBalance * 100) / 100,
        note: entry.note,
      };
    });

    res.json({ rows, currency: displayCurrency });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function exportPdf(req, res) {
  try {
    const { type } = req.params;
    const { periodId, currency = 'JOD' } = req.query;

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-${Date.now()}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text('Accounting Report', { align: 'center' });
    doc.moveDown();

    const where = {};
    if (periodId) where.transaction = { periodId: parseInt(periodId) };
    const entries = await prisma.journalEntry.findMany({ where, include: { account: true, transaction: true } });
    const balances = calcAccountBalances(entries, currency);

    if (type === 'trial-balance') {
      doc.fontSize(16).text('Trial Balance', { align: 'center' });
      doc.moveDown();

      const y = doc.y;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Account', 50, y);
      doc.text(`Debit (${currency})`, 250, y);
      doc.text(`Credit (${currency})`, 400, y);
      doc.moveDown();
      doc.font('Helvetica');

      let totalD = 0, totalC = 0;
      for (const b of Object.values(balances).sort((a, bb) => a.account.code.localeCompare(bb.account.code))) {
        const net = Math.round(b.net * 100) / 100;
        if (net === 0) continue;
        const d = net > 0 ? net : 0;
        const c = net < 0 ? Math.abs(net) : 0;
        const row = doc.y;
        doc.text(`${b.account.code} ${b.account.name}`, 50, row);
        doc.text(d > 0 ? d.toLocaleString() : '-', 250, row);
        doc.text(c > 0 ? c.toLocaleString() : '-', 400, row);
        totalD += d;
        totalC += c;
        doc.moveDown(0.5);
      }

      doc.moveDown();
      doc.font('Helvetica-Bold');
      const totRow = doc.y;
      doc.text('Total', 50, totRow);
      doc.text(Math.round(totalD * 100) / 100 + '', 250, totRow);
      doc.text(Math.round(totalC * 100) / 100 + '', 400, totRow);

    } else if (type === 'income-statement') {
      doc.fontSize(16).text('Income Statement', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).font('Helvetica-Bold').text('Revenue');
      doc.font('Helvetica');
      let totalRev = 0;
      for (const b of Object.values(balances)) {
        if (b.account.type !== 'REVENUE') continue;
        const amt = Math.round(-b.net * 100) / 100;
        if (amt === 0) continue;
        doc.text(`  ${b.account.code} ${b.account.name}: ${amt.toLocaleString()} ${currency}`);
        totalRev += amt;
      }
      doc.font('Helvetica-Bold').text(`Total Revenue: ${totalRev.toLocaleString()} ${currency}`);
      doc.moveDown();

      doc.text('Expenses');
      doc.font('Helvetica');
      let totalExp = 0;
      for (const b of Object.values(balances)) {
        if (b.account.type !== 'EXPENSE') continue;
        const amt = Math.round(b.net * 100) / 100;
        if (amt === 0) continue;
        doc.text(`  ${b.account.code} ${b.account.name}: ${amt.toLocaleString()} ${currency}`);
        totalExp += amt;
      }
      doc.font('Helvetica-Bold').text(`Total Expenses: ${totalExp.toLocaleString()} ${currency}`);
      doc.moveDown();
      doc.fontSize(14).text(`Net Profit: ${(totalRev - totalExp).toLocaleString()} ${currency}`);

    } else if (type === 'balance-sheet') {
      doc.fontSize(16).text('Balance Sheet', { align: 'center' });
      doc.moveDown();

      let netProfit = 0;
      const groups = { Assets: [], Liabilities: [], Equity: [] };

      for (const b of Object.values(balances)) {
        const net = Math.round(b.net * 100) / 100;
        if (b.account.type === 'ASSET' && net !== 0) groups.Assets.push({ ...b, amount: net });
        else if (b.account.type === 'LIABILITY' && net !== 0) groups.Liabilities.push({ ...b, amount: -net });
        else if (b.account.type === 'EQUITY' && net !== 0) groups.Equity.push({ ...b, amount: -net });
        else if (b.account.type === 'REVENUE') netProfit += -net;
        else if (b.account.type === 'EXPENSE') netProfit -= net;
      }

      for (const [groupName, items] of Object.entries(groups)) {
        doc.fontSize(12).font('Helvetica-Bold').text(groupName);
        doc.font('Helvetica');
        let total = 0;
        for (const item of items) {
          doc.text(`  ${item.account.code} ${item.account.name}: ${item.amount.toLocaleString()} ${currency}`);
          total += item.amount;
        }
        if (groupName === 'Equity') {
          const np = Math.round(netProfit * 100) / 100;
          doc.text(`  Retained Earnings (Net Profit): ${np.toLocaleString()} ${currency}`);
          total += np;
        }
        doc.font('Helvetica-Bold').text(`Total ${groupName}: ${Math.round(total * 100) / 100} ${currency}`);
        doc.moveDown();
      }
    }

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF generation error' });
  }
}

module.exports = { getDashboard, getTrialBalance, getIncomeStatement, getBalanceSheet, getGeneralLedger, exportPdf };
