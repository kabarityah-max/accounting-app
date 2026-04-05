const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create default organization
  const org = await prisma.organization.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Default Company',
      slug: 'default',
    },
  });

  // Create admin user with organization
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: { organizationId: org.id },
    create: {
      name: 'Admin User',
      email: 'admin@company.com',
      passwordHash,
      role: 'ADMIN',
      currencyPreference: 'JOD',
      organizationId: org.id,
    },
  });

  // Assign any existing users to default organization
  const usersWithoutOrg = await prisma.user.findMany({
    where: { organizationId: null },
  });

  for (const user of usersWithoutOrg) {
    await prisma.user.update({
      where: { id: user.id },
      data: { organizationId: org.id },
    });
  }

  // Default Chart of Accounts
  const accounts = [
    { code: '1000', name: 'Cash (JOD)', type: 'ASSET', normalBalance: 'DEBIT' },
    { code: '1001', name: 'Cash (USD)', type: 'ASSET', normalBalance: 'DEBIT' },
    { code: '1100', name: 'Accounts Receivable', type: 'ASSET', normalBalance: 'DEBIT' },
    { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', normalBalance: 'CREDIT' },
    { code: '3000', name: "Owner's Equity", type: 'EQUITY', normalBalance: 'CREDIT' },
    { code: '4000', name: 'Sales Revenue', type: 'REVENUE', normalBalance: 'CREDIT' },
    { code: '4001', name: 'Service Revenue', type: 'REVENUE', normalBalance: 'CREDIT' },
    { code: '5000', name: 'Purchases Expense', type: 'EXPENSE', normalBalance: 'DEBIT' },
    { code: '5001', name: 'Service Expense', type: 'EXPENSE', normalBalance: 'DEBIT' },
    { code: '5002', name: 'Salary Expense', type: 'EXPENSE', normalBalance: 'DEBIT' },
  ];

  for (const account of accounts) {
    await prisma.account.upsert({
      where: { code: account.code },
      update: {},
      create: account,
    });
  }

  // Default financial period: current month
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const periodName = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  const admin = await prisma.user.findUnique({ where: { email: 'admin@company.com' } });

  await prisma.financialPeriod.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: periodName,
      startDate,
      endDate,
      createdBy: admin.id,
    },
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
