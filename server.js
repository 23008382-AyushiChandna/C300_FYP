const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Serve static files

// Accounts storage (simple JSON file)
const accountsFile = path.join(__dirname, 'accounts.json');

// Ensure accounts.json exists
if (!fs.existsSync(accountsFile)) {
  fs.writeFileSync(accountsFile, JSON.stringify([]));
}

// Email transporter (Gmail SMTP - replace with your Gmail credentials)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-gmail@gmail.com', // Replace with your Gmail address
    pass: 'your-app-password' // Replace with Gmail App Password (not regular password)
  }
});

// Verify email transporter
transporter.verify((error, success) => {
  if (error) {
    console.log('Email transporter error:', error);
  } else {
    console.log('Email transporter is ready');
  }
});

// Helper to read accounts
function readAccounts() {
  try {
    const data = fs.readFileSync(accountsFile, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Helper to write accounts
function writeAccounts(accounts) {
  fs.writeFileSync(accountsFile, JSON.stringify(accounts, null, 2));
}

// Signup endpoint
app.post('/api/signup', async (req, res) => {
  const { companyName, email, password, confirmPassword } = req.body;

  if (!companyName || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  const accounts = readAccounts();
  const existing = accounts.find(acc => acc.email === email);
  if (existing) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  // Add new account
  accounts.push({ companyName, email, password });
  writeAccounts(accounts);

  // Send welcome email
  try {
    const info = await transporter.sendMail({
      from: '"AR Portal" <noreply@arportal.com>',
      to: email,
      subject: 'Welcome to Accounts Receivable Portal',
      text: `Hello ${companyName},\n\nWelcome to Accounts Receivable Portal! Your account has been created with this email: ${email}\n\nYou are now a new customer and can access your dashboard.\n\nThank you for joining.`,
      html: `<p>Hello ${companyName},</p><p>Welcome to Accounts Receivable Portal! Your account has been created with this email: ${email}</p><p>You are now a new customer and can access your dashboard.</p><p>Thank you for joining.</p>`
    });
    console.log('Welcome email sent:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  } catch (emailError) {
    console.error('Email send failed:', emailError);
    // Continue anyway, don't fail signup
  }

  res.json({ success: true, message: 'Account created and welcome email sent' });
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const accounts = readAccounts();
  const account = accounts.find(acc => acc.email === email);

  if (!account || account.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({ success: true, companyName: account.companyName });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});