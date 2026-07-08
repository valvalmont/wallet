const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

function buildWhere(accountId, { type, from, to }) {
  const where = { accountId };
  if (type && type !== 'all') where.type = type;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }
  return where;
}

// GET /api/transactions
router.get('/', auth, async (req, res, next) => {
  try {
    const { type, from, to, page = 1 } = req.query;
    const pageSize = 20;
    const skip = (parseInt(page) - 1) * pageSize;

    const account = await prisma.account.findUnique({ where: { userId: req.userId } });
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const where = buildWhere(account.id, { type, from, to });

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({ transactions, total, page: parseInt(page), pageSize });
  } catch (err) {
    next(err);
  }
});

// GET /api/transactions/export — CSV download
router.get('/export', auth, async (req, res, next) => {
  try {
    const { type, from, to } = req.query;

    const account = await prisma.account.findUnique({ where: { userId: req.userId } });
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const where = buildWhere(account.id, { type, from, to });
    const transactions = await prisma.transaction.findMany({ where, orderBy: { createdAt: 'desc' } });

    const header = 'Date,Type,Amount (USD),BTC Address,BTC Amount,Status,Reference\n';
    const rows = transactions.map((t) => [
      new Date(t.createdAt).toISOString(),
      t.type,
      t.amount.toFixed(2),
      t.btcAddress || '',
      t.btcAmount ? t.btcAmount.toFixed(8) : '',
      t.status,
      t.reference,
    ].join(','));

    const csv = header + rows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="credbridge-transactions.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
