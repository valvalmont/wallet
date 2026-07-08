const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

const SALT_ROUNDS = 12;
const ACCESS_EXPIRY = '15m';
const REFRESH_EXPIRY = '7d';

function generateTokens(userId) {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
  return { accessToken, refreshToken };
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { fullName, email, password, accountType, guarantorToken } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required' });
    }

    // Private client requires a valid guarantor token
    if (accountType === 'Private client') {
      if (!guarantorToken || !guarantorToken.trim()) {
        return res.status(400).json({ error: 'A Guarantor Token ID is required for Private client accounts.' });
      }

      const tokenRecord = await prisma.guarantorToken.findUnique({
        where: { code: guarantorToken.trim().toUpperCase() },
      });

      if (!tokenRecord) {
        return res.status(400).json({
          error: 'Invalid Guarantor Token. Please contact the bank or whoever referred you to obtain a valid token.',
        });
      }
      if (tokenRecord.isUsed) {
        return res.status(400).json({ error: 'This Guarantor Token has already been used.' });
      }
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.$transaction(async (txClient) => {
      const newUser = await txClient.user.create({
        data: {
          fullName,
          email,
          password: hashedPassword,
          account: {
            create: {
              balance: 0.00,
              currency: 'USD',
              isOperational: false,
            },
          },
        },
        select: { id: true, fullName: true, email: true, createdAt: true, mustChangePassword: true },
      });

      if (accountType === 'Private client' && guarantorToken) {
        await txClient.guarantorToken.update({
          where: { code: guarantorToken.trim().toUpperCase() },
          data: { isUsed: true, usedByEmail: email },
        });
      }

      return newUser;
    });

    // Personal and Corporate — no login session, just application reference
    if (accountType === 'Personal' || accountType === 'Corporate') {
      return res.status(201).json({
        requiresBranchVisit: true,
        application: {
          fullName: user.fullName,
          email: user.email,
          accountType,
          referenceNumber: `CB-${user.id.slice(0, 8).toUpperCase()}`,
          submittedAt: user.createdAt,
        },
      });
    }

    // Private client — issue tokens and allow login immediately
    const { accessToken, refreshToken } = generateTokens(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ accessToken, user });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const user = await prisma.user.findUnique({
      where: { email },
      include: { account: true },
    });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const isPrivateClient = await prisma.guarantorToken.findFirst({
      where: { usedByEmail: email },
    });

    if (!user.account?.isOperational && !isPrivateClient) {
      return res.status(403).json({
        error: 'Your account is pending activation. Please visit a CredBridge branch to complete your registration.',
        pendingActivation: true,
      });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
router.post('/refresh', (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: 'No refresh token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_EXPIRY }
    );
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
});

// ─── POST /api/auth/change-password ──────────────────────────────────────────
// Protected — user must be logged in
router.post('/change-password', authMiddleware, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from your current password.' });
    }

    // Fetch user with hashed password
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Verify current password
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    // Hash and save new password, and clear the forced-change flag
    const hashedNew = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedNew, mustChangePassword: false },
    });

    // Invalidate all existing sessions by clearing the refresh cookie.
    // The user will need to log in again on other devices.
    res.clearCookie('refreshToken');

    res.json({ success: true, message: 'Password changed successfully. Please log in again.' });
  } catch (err) {
    next(err);
  }
});


// POST /api/auth/consume-access-link  { token }
router.post('/consume-access-link', async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required', reason: 'missing_token' });

    const link = await prisma.accessLink.findUnique({ where: { token } });

    if (!link) {
      return res.status(401).json({
        error: 'This access link is not valid. It may have been mistyped or already removed.',
        reason: 'invalid',
      });
    }
    if (link.usedAt) {
      return res.status(401).json({
        error: 'This access link has already been used. Each link only works once — ask your admin for a new one.',
        reason: 'used',
      });
    }
    if (link.expiresAt < new Date()) {
      return res.status(401).json({
        error: 'This access link has expired. Ask your admin to generate a new one.',
        reason: 'expired',
      });
    }

    const user = await prisma.user.findUnique({ where: { id: link.userId } });
    if (!user) {
      return res.status(404).json({ error: 'The account for this link no longer exists.', reason: 'user_not_found' });
    }

    await prisma.accessLink.update({
      where: { token },
      data: { usedAt: new Date() },
    });

    const { accessToken, refreshToken } = generateTokens(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;