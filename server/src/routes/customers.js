const express = require('express');
const router = express.Router();
const { Customer } = require('../models');

// Get all customers
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.findAll({ 
      order: [['createdAt', 'DESC']]
    });
    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get single customer by ID
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (customer) {
      res.json(customer);
    } else {
      res.status(404).json({ error: 'Customer not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create new customer
router.post('/', async (req, res) => {
  try {
    const customer = await Customer.create({
      companyName: req.body.companyName,
      contactPerson: req.body.contactPerson,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address || '',
      creditLimit: req.body.creditLimit || 0,
      paymentTerms: req.body.paymentTerms || 'Net 30',
      status: req.body.status || 'active'
    });
    res.status(201).json(customer);
  } catch (err) {
    console.error('Customer creation error:', err.message);
    if (err.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Company name or email already exists' });
    } else {
      res.status(500).json({ error: err.message || 'Failed to create customer' });
    }
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    await customer.update({
      companyName: req.body.companyName || customer.companyName,
      contactPerson: req.body.contactPerson || customer.contactPerson,
      email: req.body.email || customer.email,
      phone: req.body.phone || customer.phone,
      address: req.body.address !== undefined ? req.body.address : customer.address,
      creditLimit: req.body.creditLimit !== undefined ? req.body.creditLimit : customer.creditLimit,
      paymentTerms: req.body.paymentTerms || customer.paymentTerms,
      status: req.body.status || customer.status
    });
    res.json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    await customer.destroy();
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

module.exports = router;
