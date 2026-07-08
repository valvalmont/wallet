const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = async function adminMiddleware(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!user || !adminEmails.includes(user.email.toLowerCase())) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (err) {
    next(err);
  }
};