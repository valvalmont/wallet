const express = require('express');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// BTC Address Regex
const BTC_ADDRESS_REGEX = /^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[ac-hj-np-z02-9]{6,87})$/;

async function getBtcPrice() {
  const { data } = await axios.get(
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
    { timeout: 5000 }
  );
  return data.bitcoin.usd;
}

// GET BTC Rate
router.get('/btc/rate', auth, async (req, res, next) => {
  try {
    const price = await getBtcPrice();
    res.json({ btcUsdPrice: price, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

// ==================== EXTERNAL BTC TRANSFER ====================
router.post('/external', auth, async (req, res, next) => {
  try {
    const { recipientAddress, amount, currency = "USD" } = req.body;
    const parsedAmount = parseFloat(amount);

    // Validation
    if (!recipientAddress || !parsedAmount) {
      return res.status(400).json({ error: 'Recipient BTC address and amount are required' });
    }
    if (!BTC_ADDRESS_REGEX.test(recipientAddress)) {
      return res.status(400).json({ error: 'Invalid Bitcoin wallet address' });
    }
    if (parsedAmount < 5000) {
      return res.status(400).json({ error: 'Minimum transfer amount is $5000' });
    }

    const account = await prisma.account.findUnique({ 
      where: { userId: req.userId } 
    });

    if (!account) return res.status(404).json({ error: 'Account not found' });
    if (!account.isOperational) {
      return res.status(403).json({ error: 'Account must be operational' });
    }
    if (account.balance < parsedAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const feeAmount = parsedAmount * 0.002; // 0.2%
    const totalDeducted = parsedAmount + feeAmount;

    // Check for existing pending external transfer
    const existingPending = await prisma.transaction.findFirst({
      where: {
        accountId: account.id,
        type: 'external_transfer',
        status: 'pending_fee'
      }
    });

    let transaction;

    if (existingPending) {
      transaction = await prisma.transaction.update({
        where: { id: existingPending.id },
        data: {
          metadata: {
            recipientAddress,
            feeAmount,
            totalDeducted,
            platform: 'btc',
            updatedAt: new Date()
          }
        }
      });
    } else {
      transaction = await prisma.transaction.create({
        data: {
          accountId: account.id,
          type: 'external_transfer',
          amount: parsedAmount,
          status: 'pending_fee',
          metadata: {
            recipientAddress,
            feeAmount,
            totalDeducted,
            platform: 'btc'
          }
        }
      });

      // Deduct balance only for new transfers
      await prisma.account.update({
        where: { id: account.id },
        data: { balance: { decrement: totalDeducted } }
      });
    }

    res.status(201).json({
      transaction,
      feeAmount,
      totalDeducted,
      recipientAddress,
      reference: transaction.reference || `EXT-${Date.now()}`,
      message: `Transfer initiated. Pay the $${feeAmount.toFixed(2)} fee in BTC to complete.`
    });

  } catch (err) {
    next(err);
  }
});

// POST /api/transfers/btc (kept for backward compatibility)
router.post('/btc', auth, async (req, res, next) => {
  try {
    const { btcAddress, usdAmount } = req.body;
    const parsedAmount = parseFloat(usdAmount);

    if (!btcAddress || !parsedAmount) {
      return res.status(400).json({ error: 'BTC address and USD amount are required' });
    }
    if (!BTC_ADDRESS_REGEX.test(btcAddress)) {
      return res.status(400).json({ error: 'Invalid Bitcoin wallet address format' });
    }
    if (parsedAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    const account = await prisma.account.findUnique({ where: { userId: req.userId } });
    if (!account) return res.status(404).json({ error: 'Account not found' });
    if (account.balance < parsedAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const btcPrice = await getBtcPrice();
    const btcAmount = parsedAmount / btcPrice;

    const [, transaction] = await prisma.$transaction([
      prisma.account.update({
        where: { id: account.id },
        data: { balance: { decrement: parsedAmount } },
      }),
      prisma.transaction.create({
        data: {
          accountId: account.id,
          type: 'btc_transfer',
          amount: parsedAmount,
          btcAddress,
          btcAmount,
          btcRate: btcPrice,
          status: 'pending',
        },
      }),
    ]);

    setTimeout(async () => {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'completed' },
      });
    }, 3000);

    res.status(201).json({
      transaction,
      btcAmount,
      btcRate: btcPrice,
      reference: transaction.reference,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/transfers/internal (unchanged)
router.post('/internal', auth, async (req, res, next) => {
  try {
    const { recipientEmail, amount } = req.body;
    const parsedAmount = parseFloat(amount);

    if (!recipientEmail || !parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Recipient email and valid amount required' });
    }

    const sender = await prisma.account.findUnique({ 
      where: { userId: req.userId },
      include: { user: true }
    });

    if (!sender?.isOperational) {
      return res.status(403).json({ error: 'Your account must be operational to send money' });
    }
    if (sender.balance < parsedAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const recipientUser = await prisma.user.findUnique({
      where: { email: recipientEmail },
      include: { account: true }
    });

    if (!recipientUser?.account) {
      return res.status(404).json({ error: 'Recipient account not found' });
    }

    const recipientAcc = recipientUser.account;

    await prisma.$transaction([
      prisma.account.update({
        where: { id: sender.id },
        data: { balance: { decrement: parsedAmount } }
      }),

      prisma.account.update({
        where: { id: recipientAcc.id },
        data: { 
          balance: recipientAcc.isOperational ? { increment: parsedAmount } : undefined 
        }
      }),

      prisma.transaction.create({
        data: {
          accountId: sender.id,
          type: 'internal_transfer',
          amount: parsedAmount,
          status: 'completed',
          reference: `INT-${Date.now()}`,
          metadata: { recipientEmail }
        }
      }),

      prisma.transaction.create({
        data: {
          accountId: recipientAcc.id,
          type: 'internal_transfer_in',
          amount: parsedAmount,
          status: recipientAcc.isOperational ? 'completed' : 'pending_fee',
          reference: `INT-${Date.now()}`,
          metadata: { senderEmail: sender.user.email }
        }
      })
    ]);

    res.json({ message: 'Transfer successful' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;