const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const depositRoutes = require('./routes/deposits');
const transferRoutes = require('./routes/transfers');
const transactionRoutes = require('./routes/transactions');
const errorHandler = require('./middleware/errorHandler');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Valmont API running on port ${PORT}`));
