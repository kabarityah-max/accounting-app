require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
p.$connect().then(() => {
  console.log('Connected!');
  return p.$disconnect();
}).catch((err) => {
  console.error('Error:', err.message);
});
