const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { sendWelcomeEmail } = require('../services/emailService');

const prisma = new PrismaClient();

async function getAllUsers(req, res) {
  try {
    const organizationId = req.user.organizationId;

    const users = await prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        currencyPreference: true,
        invitedAt: true,
      },
    });
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function createUser(req, res) {
  try {
    const { name, email, password } = req.body;
    const organizationId = req.user.organizationId;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'EMPLOYEE',
        currencyPreference: 'JOD',
        organizationId,
        status: 'ACTIVE',
      },
      select: { id: true, name: true, email: true, role: true, status: true },
    });

    // Send welcome email to the newly created user (non-blocking)
    const emailResult = await sendWelcomeEmail(user, password);

    // Update email tracking in database
    if (emailResult.success) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailSent: true, emailSentAt: new Date() },
      });
    }

    res.json({
      user,
      message: 'User created successfully',
      emailSent: emailResult.success,
      emailError: emailResult.error || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function deleteUser(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);
    const currentUserId = req.user.id;
    const organizationId = req.user.organizationId;

    if (userId === currentUserId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Verify user belongs to same organization
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!userToDelete) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userToDelete.organizationId !== organizationId) {
      return res.status(403).json({ error: 'Cannot delete user from another organization' });
    }

    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err.message);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

async function updateUserRole(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);
    const { role } = req.body;
    const currentUserId = req.user.id;
    const organizationId = req.user.organizationId;

    if (!role || !['ADMIN', 'EMPLOYEE'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required (ADMIN or EMPLOYEE)' });
    }

    // Verify user belongs to same organization
    const userToUpdate = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!userToUpdate) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userToUpdate.organizationId !== organizationId) {
      return res.status(403).json({ error: 'Cannot update user from another organization' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true, status: true },
    });

    res.json({ user: updatedUser, message: 'Role updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateUserStatus(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);
    const { status } = req.body;
    const currentUserId = req.user.id;
    const organizationId = req.user.organizationId;

    if (!status || !['ACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required (ACTIVE or SUSPENDED)' });
    }

    if (userId === currentUserId) {
      return res.status(400).json({ error: 'Cannot change your own status' });
    }

    // Verify user belongs to same organization
    const userToUpdate = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!userToUpdate) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userToUpdate.organizationId !== organizationId) {
      return res.status(403).json({ error: 'Cannot update user from another organization' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: { id: true, name: true, email: true, role: true, status: true },
    });

    res.json({ user: updatedUser, message: 'Status updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getAllUsers, createUser, deleteUser, updateUserRole, updateUserStatus };
