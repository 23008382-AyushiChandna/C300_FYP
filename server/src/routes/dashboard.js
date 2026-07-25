const express = require('express');
const router = express.Router();
const { Invoice, Payment, Customer } = require('../models');

router.get('/aggregates', async (req, res) => {
  try {
    const [invoices, payments, customerCount] = await Promise.all([
      Invoice.findAll({ order: [['createdAt', 'DESC']] }),
      Payment.findAll({ order: [['createdAt', 'DESC']] }),
      Customer.count()
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
      totalReceivables: 0,
      overdueAmount: 0,
      totalCollected: 0,
      activeCustomers: customerCount,
      collectionRate: 0
    };

    const ageing = {
      d0to30: 0,
      d31to60: 0,
      d61to90: 0,
      d90plus: 0
    };

    invoices.forEach((inv) => {
      const subtotal = Number(inv.amount || 0);
      const total = subtotal + subtotal * 0.09;
      const paid = Number(inv.paid || 0);
      const outstanding = Math.max(0, total - paid);

      stats.totalReceivables += total;

      if (outstanding <= 0) return;

      const dueDate = new Date(inv.dueDate);
      if (Number.isNaN(dueDate.getTime())) {
        ageing.d0to30 += outstanding;
        return;
      }

      dueDate.setHours(0, 0, 0, 0);
      const daysOverdue = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));

      if (daysOverdue > 0) {
        stats.overdueAmount += outstanding;
      }

      if (daysOverdue <= 30) ageing.d0to30 += outstanding;
      else if (daysOverdue <= 60) ageing.d31to60 += outstanding;
      else if (daysOverdue <= 90) ageing.d61to90 += outstanding;
      else ageing.d90plus += outstanding;
    });

    stats.totalCollected = payments.reduce((sum, p) => {
      const status = String(p.status || '').toLowerCase();
      return status === 'reconciled' ? sum + Number(p.amount || 0) : sum;
    }, 0);

    stats.collectionRate = stats.totalReceivables > 0
      ? Math.round((stats.totalCollected / stats.totalReceivables) * 100)
      : 0;

    const recentInvoices = invoices.slice(0, 3).map((inv) => {
      const subtotal = Number(inv.amount || 0);
      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        status: inv.status,
        total: subtotal + subtotal * 0.09
      };
    });

    res.json({ stats, ageing, recentInvoices });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load dashboard aggregates' });
  }
});

module.exports = router;
