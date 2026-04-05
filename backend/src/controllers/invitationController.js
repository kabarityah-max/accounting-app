const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { sendInvitationEmail } = require('../services/emailService');
const { generateToken, calculateExpiration, isTokenExpired } = require('../utils/tokenGenerator');

const prisma = new PrismaClient();

/**
 * Send an invitation to a user
 * Admin only - Creates an invitation record and sends email
 */
async function sendInvitation(req, res) {
  try {
    const { email, role } = req.body;
    const adminId = req.user.id;
    const organizationId = req.user.organizationId;

    // Validate input
    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    if (!['ADMIN', 'EMPLOYEE'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be ADMIN or EMPLOYEE' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.userInvitation.findFirst({
      where: {
        email,
        organizationId,
        status: 'PENDING',
      },
    });

    if (existingInvitation) {
      return res.status(400).json({ error: 'Pending invitation already exists for this email' });
    }

    // Generate invitation token
    const token = generateToken();
    const expiresAt = calculateExpiration();

    // Create invitation record
    const invitation = await prisma.userInvitation.create({
      data: {
        email,
        role,
        token,
        expiresAt,
        status: 'PENDING',
        createdBy: adminId,
        organizationId,
      },
    });

    // Get admin and organization info for email
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { name: true },
    });

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });

    // Send invitation email
    await sendInvitationEmail(email, token, admin.name, organization.name);

    res.json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (err) {
    console.error('Send invitation error:', err);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
}

/**
 * Verify if an invitation token is valid
 * Public endpoint - used by accept-invite page
 */
async function verifyInvitation(req, res) {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Find invitation by token
    const invitation = await prisma.userInvitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invalid or expired invitation token' });
    }

    // Check if already used
    if (invitation.status === 'ACCEPTED') {
      return res.status(400).json({ error: 'This invitation has already been used' });
    }

    // Check if expired
    if (isTokenExpired(invitation.expiresAt)) {
      // Mark as expired in database
      await prisma.userInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return res.status(400).json({ error: 'Invitation token has expired' });
    }

    // Return invitation details (without sensitive data)
    res.json({
      valid: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        organizationName: invitation.organization.name,
        organizationId: invitation.organization.id,
      },
    });
  } catch (err) {
    console.error('Verify invitation error:', err);
    res.status(500).json({ error: 'Failed to verify invitation' });
  }
}

/**
 * Accept an invitation and create a new user account
 * Public endpoint - called after user fills out accept-invite form
 */
async function acceptInvitation(req, res) {
  try {
    const { token, name, password, confirmPassword } = req.body;

    // Validate input
    if (!token || !name || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Find invitation by token
    const invitation = await prisma.userInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invalid or expired invitation token' });
    }

    // Check if already used
    if (invitation.status === 'ACCEPTED') {
      return res.status(400).json({ error: 'This invitation has already been used' });
    }

    // Check if expired
    if (isTokenExpired(invitation.expiresAt)) {
      await prisma.userInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return res.status(400).json({ error: 'Invitation token has expired' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user within transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          name,
          email: invitation.email,
          passwordHash,
          role: invitation.role,
          organizationId: invitation.organizationId,
          invitedBy: invitation.createdBy,
          invitedAt: new Date(),
          currencyPreference: 'JOD',
          status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      // Mark invitation as accepted
      await tx.userInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });

      return newUser;
    });

    res.json({
      message: 'Account created successfully',
      user,
    });
  } catch (err) {
    console.error('Accept invitation error:', err);

    // Handle Prisma-specific errors
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }

    res.status(500).json({ error: 'Failed to create account' });
  }
}

module.exports = {
  sendInvitation,
  verifyInvitation,
  acceptInvitation,
};
