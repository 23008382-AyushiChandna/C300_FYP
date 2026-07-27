require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize, User, Customer, Invoice, Payment } = require('./models');

async function run() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    const email = 'ayushichandna30@gmail.com';
    const password = 'Spongebob67';
    const companyName = 'Ayushi Chandna';
    
    // Delete existing user if any
    await User.destroy({ where: { email } });
    console.log('Deleted any existing user with email:', email);
    
    // Create fresh user with properly hashed password
    const hash = await bcrypt.hash(password, 10);
    console.log('Generated hash:', hash);
    
    const user = await User.create({ email, passwordHash: hash, companyName });
    console.log('Created new user:', email);
    console.log('User ID:', user.id);

    // Clear demo entities before reseeding to keep dashboard stable across runs.
    await Promise.all([
      Payment.destroy({ where: {} }),
      Invoice.destroy({ where: {} }),
      Customer.destroy({ where: {} })
    ]);

    const customers = await Customer.bulkCreate([
      {
        companyName: 'Beyonics Pte Ltd',
        contactPerson: 'Alicia Tan',
        email: 'ap@beyonics.com',
        phone: '+65 6123 4501',
        address: '10 Kallang Ave, Singapore',
        creditLimit: 80000,
        paymentTerms: 'Net 30',
        status: 'active'
      },
      {
        companyName: 'Flex Electronics',
        contactPerson: 'Marcus Lee',
        email: 'finance@flex-electronics.com',
        phone: '+65 6777 1290',
        address: '5 Changi South St 3, Singapore',
        creditLimit: 60000,
        paymentTerms: 'Net 45',
        status: 'on-hold'
      },
      {
        companyName: 'Zenith Components',
        contactPerson: 'Nur Aisha',
        email: 'accounts@zenithcomponents.com',
        phone: '+65 6441 7650',
        address: '18 Ubi Road, Singapore',
        creditLimit: 50000,
        paymentTerms: 'Net 30',
        status: 'active'
      }
    ]);

    const customerMap = new Map(customers.map((c) => [c.companyName, c.id]));

    await Invoice.bulkCreate([
      {
        invoiceNumber: 'INV-2025-004',
        customerId: customerMap.get('Beyonics Pte Ltd'),
        customerName: 'Beyonics Pte Ltd',
        amount: 15890,
        paid: 0,
        issueDate: '2025-03-15',
        dueDate: '2025-04-14',
        description: 'Precision parts batch A',
        status: 'overdue',
        notes: 'Follow-up needed'
      },
      {
        invoiceNumber: 'INV-2024-089',
        customerId: customerMap.get('Flex Electronics'),
        customerName: 'Flex Electronics',
        amount: 5200,
        paid: 0,
        issueDate: '2024-12-10',
        dueDate: '2025-01-09',
        description: 'Assembly tooling support',
        status: 'overdue',
        notes: ''
      },
      {
        invoiceNumber: 'INV-2025-011',
        customerId: customerMap.get('Beyonics Pte Ltd'),
        customerName: 'Beyonics Pte Ltd',
        amount: 10690,
        paid: 5490,
        issueDate: '2025-02-01',
        dueDate: '2025-03-03',
        description: 'Machining service package',
        status: 'partial',
        notes: 'Customer requested extension'
      },
      {
        invoiceNumber: 'INV-2025-032',
        customerId: customerMap.get('Zenith Components'),
        customerName: 'Zenith Components',
        amount: 7900,
        paid: 7900,
        issueDate: '2025-05-02',
        dueDate: '2025-06-01',
        description: 'Monthly component supply',
        status: 'paid',
        notes: ''
      },
      {
        invoiceNumber: 'INV-2025-045',
        customerId: customerMap.get('Zenith Components'),
        customerName: 'Zenith Components',
        amount: 12400,
        paid: 0,
        issueDate: '2025-06-12',
        dueDate: '2025-07-12',
        description: 'Prototype line materials',
        status: 'pending',
        notes: ''
      }
    ]);

    await Payment.bulkCreate([
      {
        userId: user.id,
        invoiceNumber: 'INV-2025-011',
        customerName: 'Beyonics Pte Ltd',
        amount: 5490,
        paymentDate: '2025-03-10',
        paymentMethod: 'Bank Transfer',
        status: 'reconciled',
        referenceNumber: 'BT-3044',
        notes: 'First installment'
      },
      {
        userId: user.id,
        invoiceNumber: 'INV-2025-032',
        customerName: 'Zenith Components',
        amount: 7900,
        paymentDate: '2025-06-02',
        paymentMethod: 'PayNow',
        status: 'reconciled',
        referenceNumber: 'PN-7712',
        notes: 'Full payment'
      },
      {
        userId: user.id,
        invoiceNumber: 'INV-2025-004',
        customerName: 'Beyonics Pte Ltd',
        amount: 1500,
        paymentDate: '2025-04-18',
        paymentMethod: 'Bank Transfer',
        status: 'pending',
        referenceNumber: 'BT-3328',
        notes: 'Pending reconciliation'
      }
    ]);

    console.log('Inserted demo customers, invoices, and payments.');
    process.exit(0);
  } catch (err) {
    console.error('Seeder error:', err);
    process.exit(1);
  }
}

run();
