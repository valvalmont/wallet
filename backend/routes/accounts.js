const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/accounts/me
router.get('/me', auth, async (req, res, next) => {
  try {
    const account = await prisma.account.findUnique({
      where: { userId: req.userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!account) return res.status(404).json({ error: 'Account not found' });

    res.json({
      balance: account.balance,
      currency: account.currency,
      isOperational: account.isOperational,     // ← NEW
      requiresFee: !account.isOperational,      // ← NEW (helpful for frontend)
      recentTransactions: account.transactions,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
