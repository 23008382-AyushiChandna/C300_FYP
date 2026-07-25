const express = require('express');
const router = express.Router();
const db = require('../models');
const Invoice = db.Invoice;

// GET all invoices
router.get('/', async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET invoice by ID
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE new invoice
router.post('/', async (req, res) => {
  try {
    const invoice = await Invoice.create({
      invoiceNumber: req.body.invoiceNumber,
      customerId: req.body.customerId || null,
      customerName: req.body.customerName,
      amount: req.body.amount,
      paid: req.body.paid || 0,
      dueDate: req.body.dueDate,
      issueDate: req.body.issueDate || new Date(),
      description: req.body.description || '',
      status: req.body.status || 'pending',
      notes: req.body.notes || ''
    });
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE invoice
router.put('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    
    await invoice.update(req.body);
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE invoice
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    
    await invoice.destroy();
    res.json({ message: 'Invoice deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
