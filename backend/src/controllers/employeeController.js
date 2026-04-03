const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getEmployees(req, res) {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { name: 'asc' },
      include: { salaryPayments: { orderBy: { paymentDate: 'desc' }, take: 5 } },
    });
    res.json(employees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function createEmployee(req, res) {
  try {
    const { name, position, baseSalary, currency } = req.body;
    if (!name || !position || !baseSalary) {
      return res.status(400).json({ error: 'Name, position, and base salary required' });
    }
    const employee = await prisma.employee.create({
      data: { name, position, baseSalary: parseFloat(baseSalary), currency: currency || 'JOD' },
    });
    res.status(201).json(employee);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const { name, position, baseSalary, currency, active } = req.body;
    const employee = await prisma.employee.update({
      where: { id: parseInt(id) },
      data: {
        ...(name !== undefined && { name }),
        ...(position !== undefined && { position }),
        ...(baseSalary !== undefined && { baseSalary: parseFloat(baseSalary) }),
        ...(currency !== undefined && { currency }),
        ...(active !== undefined && { active }),
      },
    });
    res.json(employee);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Employee not found' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getEmployees, createEmployee, updateEmployee };
