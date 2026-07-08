const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

const OPENING_FEE = 100;

// POST /api/deposits/pay-opening-fee
router.post('/pay-opening-fee', auth, async (req, res, next) => {
  try {
    const account = await prisma.account.findUnique({
      where: { userId: req.userId }
    });

    if (!account) return res.status(404).json({ error: 'Account not found' });
    if (account.isOperational) return res.status(400).json({ error: 'Account is already operational' });

    // Prevent multiple pending opening fees
    const existingPending = await prisma.transaction.findFirst({
      where: {
        accountId: account.id,
        type: 'opening_fee',
        status: 'pending'
      }
    });

    if (existingPending) {
      return res.status(400).json({ 
        error: 'You already have a pending opening fee payment. Please wait for admin confirmation.' 
      });
    }

    const transaction = await prisma.transaction.create({
      data: {
        accountId: account.id,
        type: 'opening_fee',
        amount: OPENING_FEE,
        status: 'pending',
        reference: `FEE-${Date.now()}`,
      }
    });

    res.json({
      message: 'Opening fee payment submitted. Awaiting admin confirmation.',
      transaction
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/deposits (Normal deposits)
router.post('/', auth, async (req, res, next) => {
  try {
    const { amount } = req.body;
    const parsedAmount = parseFloat(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    const account = await prisma.account.findUnique({ where: { userId: req.userId } });
    if (!account) return res.status(404).json({ error: 'Account not found' });

    // Optional: Block normal deposits until account is operational
    if (!account.isOperational) {
      return res.status(403).json({ 
        error: 'You must pay the $100 account opening fee first',
        requiresFee: true 
      });
    }

    const transaction = await prisma.transaction.create({
      data: {
        accountId: account.id,
        type: 'deposit',
        amount: parsedAmount,
        status: 'pending',                    // ← Also pending
        reference: `DEP-${Date.now()}`,
      }
    });

    res.status(201).json({
      message: 'Deposit submitted successfully. Awaiting admin confirmation.',
      transaction
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;