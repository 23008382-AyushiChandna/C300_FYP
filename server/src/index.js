require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 1573;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(bodyParser.json());

// Routes
const authRouter = require('./routes/auth');
const customerRouter = require('./routes/customers');
const paymentRouter = require('./routes/payments');
const invoiceRouter = require('./routes/invoices');
const dashboardRouter = require('./routes/dashboard');
app.use('/api/auth', authRouter);
app.use('/api', authRouter);
app.use('/api/customers', customerRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/invoices', invoiceRouter);
app.use('/api/dashboard', dashboardRouter);

app.get('/api/ping', (req, res) => res.json({ ok: true }));

async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('DB connected');
    app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
