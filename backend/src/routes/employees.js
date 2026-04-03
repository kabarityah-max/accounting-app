const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { getEmployees, createEmployee, updateEmployee } = require('../controllers/employeeController');

router.get('/', authMiddleware, adminOnly, getEmployees);
router.post('/', authMiddleware, adminOnly, createEmployee);
router.put('/:id', authMiddleware, adminOnly, updateEmployee);

module.exports = router;
