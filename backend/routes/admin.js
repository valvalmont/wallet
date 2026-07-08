const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { randomBytes } = require('crypto');
const auth = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/admin/confirm-payment
router.post('/confirm-payment', auth, adminOnly, async (req, res, next) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    const tx = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { account: true },
    });

    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    if (tx.status === 'completed')
      return res.status(400).json({ error: 'Transaction already completed' });

    await prisma.$transaction(async (txClient) => {
      await txClient.transaction.update({
        where: { id: transactionId },
        data: { status: 'completed' },
      });

      if (tx.type === 'opening_fee') {
        await txClient.account.update({
          where: { id: tx.account.id },
          data: { isOperational: true },
        });
      }

      await txClient.account.update({
        where: { id: tx.account.id },
        data: { balance: { increment: tx.amount } },
      });
    });

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      transaction: { id: transactionId, type: tx.type, amount: tx.amount },
      accountActivated: tx.type === 'opening_fee',
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/pending-payments
router.get('/pending-payments', auth, adminOnly, async (req, res, next) => {
  try {
    const pending = await prisma.transaction.findMany({
      where: { status: 'pending' },
      include: { account: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ pendingPayments: pending });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/create-token
router.post('/create-token', auth, adminOnly, async (req, res, next) => {
  try {
    const { label } = req.body;
    const code = randomBytes(6).toString('hex').toUpperCase(); // e.g. "A3F92C1D"

    const token = await prisma.guarantorToken.create({
      data: { code, label: label || null },
    });

    res.status(201).json({ token });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/tokens
router.get('/tokens', auth, adminOnly, async (req, res, next) => {
  try {
    const tokens = await prisma.guarantorToken.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ tokens });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users  — for the admin to pick who to send a link to
router.get('/users', auth, adminOnly, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, fullName: true, email: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

router.post('/generate-access-link', auth, adminOnly, async (req, res, next) => {
  try {
    const { userId, expiresInMinutes = 720 } = req.body; // 12 hours
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await prisma.accessLink.create({
      data: { token, userId, expiresAt },
    });

    const url = `${process.env.FRONTEND_URL}/secure-access?token=${token}`;
    res.status(201).json({ url, expiresAt });
  } catch (err) {
    next(err);
  }
});

module.exports = router;