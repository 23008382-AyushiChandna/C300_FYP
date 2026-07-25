<<<<<<< HEAD
# C300-Project 
=======
# C300-Project

A simple Accounts Receivable system with a login/sign-up page and Node.js backend for email notifications.

## Files

- `index.html` - login and signup page for the AR portal.
- `styles.css` - page styling.
- `app.js` - client-side form behavior and API calls.
- `dashboard.html` - user dashboard after login.
- `server.js` - Node.js backend with Express, handling signup/login and email sending.
- `package.json` - Node.js dependencies.
- `accounts.json` - stored user accounts (created automatically).

## Usage

Open `index.html` in your browser after starting the server.

## Run locally from terminal

From the project root, run:

```bash
chmod +x serve.sh
./serve.sh
```

Or manually:

```bash
npm install
node server.js
```

Then open `http://localhost:8000` in your browser.

## Email Setup

The backend uses Nodemailer with Ethereal (fake SMTP) for testing. For production:

1. Sign up at Ethereal (https://ethereal.email) for test credentials.
2. Replace the transporter config in `server.js` with your Ethereal user/pass.
3. Or use a real email service like Gmail, SendGrid, etc.

## Next steps

- Add an authenticated dashboard for invoices, customers, and payments.
- Implement secure authentication with sessions/tokens.
- Build out receivable reports, aging summaries, and invoice creation.
- Move to a proper database instead of JSON file.