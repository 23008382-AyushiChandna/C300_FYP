const express = require('express');
const router = express.Router();
const { Payment, Invoice } = require('../models');

router.get('/', async (req, res) => {
  try {
    const payments = await Payment.findAll({ order: [['createdAt', 'DESC']] });
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get invoice details by invoice number
router.get('/lookup/:invoiceNumber', async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      where: { invoiceNumber: req.params.invoiceNumber }
    });
    if (invoice) {
      res.json(invoice);
    } else {
      res.status(404).json({ error: 'Invoice not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to lookup invoice' });
  }
});

router.post('/', async (req, res) => {
  try {
    let customerName = req.body.customerName || 'Customer Name';
    const invoiceNumber = req.body.invoiceNumber || req.body.invoice || '';
    const paymentStatus = String(req.body.status || 'reconciled').toLowerCase();

    // Look up invoice to get customer name and update paid amount
    let invoice = null;
    if (invoiceNumber) {
      invoice = await Invoice.findOne({ where: { invoiceNumber } });
      if (invoice) {
        customerName = invoice.customerName;
      }
    }

    const payment = await Payment.create({
      userId: req.body.userId || 1,
      invoiceNumber: invoiceNumber,
      customerName: customerName,
      amount: req.body.amount,
      paymentDate: req.body.paymentDate || req.body.date,
      paymentMethod: req.body.paymentMethod || req.body.method,
      status: paymentStatus,
      referenceNumber: req.body.referenceNumber || '',
      notes: req.body.notes || ''
    });

    // Only reconciled payments affect invoice paid/outstanding and status.
    if (invoice && paymentStatus === 'reconciled') {
      const newPaid = Math.round((Number(invoice.paid || 0) + Number(req.body.amount || 0)) * 100) / 100;
      const subtotal = Number(invoice.amount || 0);
      const gst = Math.round(subtotal * 0.09 * 100) / 100;
      const total = Math.round((subtotal + gst) * 100) / 100;

      let newStatus;
      if (newPaid >= total) {
        newStatus = 'paid';
      } else if (newPaid > 0) {
        newStatus = 'partial';
      } else {
        newStatus = invoice.status;
      }

      await invoice.update({ paid: newPaid, status: newStatus });
    }

    res.status(201).json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save payment' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    await payment.update({
      invoiceNumber: req.body.invoiceNumber || req.body.invoice || payment.invoiceNumber,
      customerName: req.body.customerName || payment.customerName,
      amount: req.body.amount || payment.amount,
      paymentDate: req.body.paymentDate || req.body.date || payment.paymentDate,
      paymentMethod: req.body.paymentMethod || req.body.method || payment.paymentMethod,
      status: String(req.body.status || payment.status || 'reconciled').toLowerCase(),
      referenceNumber: req.body.referenceNumber || payment.referenceNumber,
      notes: req.body.notes || payment.notes
    });

    res.json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    await payment.destroy();
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

module.exports = router;
