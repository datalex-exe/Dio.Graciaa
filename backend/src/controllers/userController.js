import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// List all registered users (ROLE_A only)
export async function listUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permittedProjects: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(users);
  } catch (err) {
    console.error('Failed to list users:', err);
    return res.status(500).json({ error: 'Failed to retrieve users' });
  }
}

// Create new login user (ROLE_A only)
export async function createUser(req, res) {
  const { email, password, name, role, permittedProjects } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Validate role (defaults to ROLE_C - Viewer / Read-Only if not provided or invalid)
  const allowedRoles = ['ROLE_A', 'ROLE_B', 'ROLE_C', 'ROLE_D'];
  const userRole = allowedRoles.includes(role) ? role : 'ROLE_C';

  try {
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing) {
      return res.status(400).json({ error: 'A user with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: name.trim(),
        role: userRole,
        // Only ROLE_D (Viewer 2) uses project restrictions; clear for all others
        permittedProjects: userRole === 'ROLE_D' ? (permittedProjects ? String(permittedProjects).trim() : '') : ''
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permittedProjects: true,
        createdAt: true
      }
    });

    return res.status(201).json({
      message: 'User created successfully.',
      user: newUser
    });
  } catch (err) {
    console.error('Failed to create user:', err);
    return res.status(500).json({ error: 'Failed to create user.' });
  }
}

// Update login user (ROLE_A only)
export async function updateUser(req, res) {
  const { userId } = req.params;
  const { email, password, name, role, permittedProjects } = req.body;

  try {
    const existing = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const updateData = {};
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      if (normalizedEmail !== existing.email) {
        const emailCheck = await prisma.user.findUnique({
          where: { email: normalizedEmail }
        });
        if (emailCheck) {
          return res.status(400).json({ error: 'A user with this email address already exists.' });
        }
      }
      updateData.email = normalizedEmail;
    }

    if (name) updateData.name = name.trim();
    if (role) {
      const allowedRoles = ['ROLE_A', 'ROLE_B', 'ROLE_C', 'ROLE_D'];
      if (allowedRoles.includes(role)) {
        updateData.role = role;
        // Only ROLE_D needs project restrictions; clear for all other roles
        if (role !== 'ROLE_D') {
          updateData.permittedProjects = '';
        }
      }
    }

    // Only update permittedProjects if the user is (or will become) ROLE_D
    const effectiveRole = updateData.role || existing.role;
    if (permittedProjects !== undefined && effectiveRole === 'ROLE_D') {
      updateData.permittedProjects = String(permittedProjects).trim();
    }

    if (password && password.trim()) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permittedProjects: true,
        createdAt: true
      }
    });

    return res.json({
      message: 'User updated successfully.',
      user: updated
    });
  } catch (err) {
    console.error('Failed to update user:', err);
    return res.status(500).json({ error: 'Failed to update user.' });
  }
}

// Delete user account (ROLE_A only)
export async function deleteUser(req, res) {
  const { userId } = req.params;

  if (userId === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own logged-in account.' });
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Run in a transaction to clean up audit logs before deleting the user
    await prisma.$transaction(async (tx) => {
      // 1. Delete associated audit logs for this user
      await tx.auditLog.deleteMany({
        where: { userId }
      });

      // 2. Delete the user account
      await tx.user.delete({
        where: { id: userId }
      });
    });

    return res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Failed to delete user:', err);
    return res.status(400).json({ error: 'Cannot delete user because they have recorded project orders.' });
  }
}
