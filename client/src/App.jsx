import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { login as apiLogin, signup as apiSignup } from './api/auth'
import Dashboard from './components/Dashboard'
import Customers from './components/Customers'
import Invoices from './components/Invoices'
import Payments from './components/Payments'
import Chatbot from './components/Chatbot'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:1573';
const TOKEN_KEY = 'tsh_token';
const USER_KEY = 'tsh_user';

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function doLogin(e) {
    e.preventDefault();
    const res = await apiLogin(email, password);
    if (res.token) {
      onLogin(res.token, res.user);
      setMessage(`Welcome ${res.user.companyName || res.user.email}`);
    } else {
      setMessage(res.error || 'Login failed');
    }
  }

  return (
    <div className="min-h-screen bg-background text-textPrimary flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">TSH Synergy</h1>
          <p className="text-textSecondary mt-1">Accounts Receivable Portal</p>
        </div>
        <h2 className="text-xl font-semibold mb-4 text-center">Sign In</h2>
        <form onSubmit={doLogin} className="space-y-4">
          <input className="w-full p-2 rounded bg-background border border-border" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input type="password" className="w-full p-2 rounded bg-background border border-border" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button className="w-full px-4 py-2 bg-primary rounded font-medium" type="submit">Login</button>
        </form>

        <p className="mt-5 text-textSecondary text-center">
          No account yet? <Link to="/signup" className="text-primary">Create one</Link>
        </p>

        {message && <p className="mt-4 text-textSecondary text-center">{message}</p>}
      </div>
    </div>
  )
}

function SignupPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [message, setMessage] = useState('');

  async function doSignup(e) {
    e.preventDefault();
    const res = await apiSignup(email, password, companyName);
    if (res.token) {
      onLogin(res.token, res.user);
      setMessage('Account created');
    } else {
      setMessage(res.error || 'Signup failed');
    }
  }

  return (
    <div className="min-h-screen bg-background text-textPrimary flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">TSH Synergy</h1>
          <p className="text-textSecondary mt-1">Accounts Receivable Portal</p>
        </div>
        <h2 className="text-xl font-semibold mb-4 text-center">Create Account</h2>
        <form onSubmit={doSignup} className="space-y-4">
          <input className="w-full p-2 rounded bg-background border border-border" placeholder="Company name" value={companyName} onChange={e=>setCompanyName(e.target.value)} />
          <input className="w-full p-2 rounded bg-background border border-border" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input type="password" className="w-full p-2 rounded bg-background border border-border" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button className="w-full px-4 py-2 bg-secondary rounded font-medium" type="submit">Sign up</button>
        </form>

        <p className="mt-5 text-textSecondary text-center">
          Already have an account? <Link to="/login" className="text-primary">Sign in</Link>
        </p>

        {message && <p className="mt-4 text-textSecondary text-center">{message}</p>}
      </div>
    </div>
  )
}

function DashboardPage() {
  return (
    <div className="min-h-screen bg-background text-textPrimary p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">📊 Dashboard</h1>
      </div>
      <Dashboard />
    </div>
  )
}

function CustomersPage() {
  return (
    <div className="min-h-screen bg-background text-textPrimary p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">👥 Customers</h1>
      </div>
      <Customers />
    </div>
  )
}

function InvoicesPage() {
  return (
    <div className="min-h-screen bg-background text-textPrimary p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">📄 Invoices</h1>
      </div>
      <Invoices />
    </div>
  )
}

function PaymentsPage() {
  return (
    <div className="min-h-screen bg-background text-textPrimary p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">💳 Payments</h1>
      </div>
      <Payments />
    </div>
  )
}

function ReportsPage() {
  const defaultFilters = {
    category: 'invoice',
    dateFrom: '',
    dateTo: '',
    status: 'paid',
    customer: 'all'
  };
    <BrowserRouter>
      <Chatbot />
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/signup" element={<SignupPage onLogin={handleLogin} />} />
        <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={token ? <DashboardPage /> : <Navigate to="/login" />} />
        <Route path="/customers" element={token ? <CustomersPage /> : <Navigate to="/login" />} />
        <Route path="/invoices" element={token ? <InvoicesPage /> : <Navigate to="/login" />} />
        <Route path="/payments" element={token ? <PaymentsPage /> : <Navigate to="/login" />} />
        <Route path="/reports" element={token ? <ReportsPage /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
    agingRows: []
  });

export default AppRoot
  const [filters, setFilters] = React.useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = React.useState(defaultFilters);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const customerOptions = React.useMemo(() => {
    const names = allInvoices
      .map((invoice) => invoice.customerName || invoice.customer || '')
      .filter(Boolean);
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  }, [allInvoices]);

  const parseDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const isWithinDateRange = (value, fromDate, toDate) => {
    const date = parseDate(value);
    if (!date) return false;
    if (fromDate && date < fromDate) return false;
    if (toDate && date > toDate) return false;
    return true;
  };

  const normalizeInvoice = (invoice) => {
    const total = Number(invoice.amount || invoice.total || 0);
    const paid = Number(invoice.paid || 0);
    return {
      id: invoice.id,
      invoiceNo: invoice.invoiceNumber || invoice.invoiceNo || '-',
      customer: invoice.customerName || invoice.customer || 'Unknown',
      issueDate: invoice.issueDate || invoice.invoiceDate || invoice.createdAt || '',
      dueDate: invoice.dueDate || '',
      status: String(invoice.status || 'pending').toLowerCase(),
      total,
      paid,
      outstanding: Math.max(0, total - paid)
    };
  };

  const buildReportData = (invoices, payments, filterValues) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fromDate = parseDate(filterValues.dateFrom);
    const toDate = parseDate(filterValues.dateTo);
    const normalizedInvoices = invoices.map(normalizeInvoice);

    const invoiceDateField = (invoice) => {
      if (true) {
        return invoice.issueDate;
      }
      return invoice.dueDate;
    };

    const baseInvoices = normalizedInvoices.filter((invoice) => {
      const normalizedStatus = String(invoice.status || '').toLowerCase();
      const statusMatch = normalizedStatus === String(filterValues.status || '').toLowerCase();
      const customerMatch = filterValues.customer === 'all' || invoice.customer === filterValues.customer;
      const dateValue = invoiceDateField(invoice);
      const dateMatch = (!fromDate && !toDate) || isWithinDateRange(dateValue, fromDate, toDate);
      return statusMatch && customerMatch && dateMatch;
    });

    const overdueInvoices = baseInvoices.filter((invoice) => String(invoice.status || '').toLowerCase() === 'overdue');

    const partialInvoices = baseInvoices.filter((invoice) => String(invoice.status || '').toLowerCase() === 'partial');

    const outstandingInvoices = baseInvoices.filter((invoice) => invoice.outstanding > 0);
    const paidInvoices = baseInvoices.filter((invoice) => String(invoice.status || '').toLowerCase() === 'paid');

    const totalOutstanding = outstandingInvoices.reduce((sum, invoice) => sum + invoice.outstanding, 0);
    const overdueAmount = overdueInvoices.reduce((sum, invoice) => sum + invoice.outstanding, 0);

    const filteredPayments = payments.filter((payment) => {
      const customer = payment.customerName || payment.customer || 'Unknown';
      const paymentDate = payment.paymentDate || payment.date;
      const paymentStatus = String(payment.status || '').toLowerCase();

      const paymentStatusMatch = filterValues.status === 'paid'
        ? ['paid', 'reconciled', 'completed'].includes(paymentStatus)
        : filterValues.status === 'overdue'
          ? paymentStatus === 'overdue'
          : ['partial', 'pending'].includes(paymentStatus);

      const customerMatch = filterValues.customer === 'all' || customer === filterValues.customer;
      const dateMatch = (!fromDate && !toDate) || isWithinDateRange(paymentDate, fromDate, toDate);
      return customerMatch && paymentStatusMatch && dateMatch;
    });

    const totalCollected = filteredPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const paymentHistory = filteredPayments.map((payment) => ({
      paymentDate: payment.paymentDate || payment.date || '',
      invoiceNo: payment.invoiceNumber || payment.invoice || '-',
      customer: payment.customerName || payment.customer || 'Unknown',
      method: payment.paymentMethod || payment.method || '-',
      status: String(payment.status || '-'),
      amount: Number(payment.amount || 0)
    }));

    const statementMap = {};
    baseInvoices.forEach((invoice) => {
      if (!statementMap[invoice.customer]) {
        statementMap[invoice.customer] = {
          customer: invoice.customer,
          invoiceCount: 0,
          totalInvoiced: 0,
          totalPaid: 0,
          balance: 0
        };
      }
      statementMap[invoice.customer].invoiceCount += 1;
      statementMap[invoice.customer].totalInvoiced += invoice.total;
      statementMap[invoice.customer].totalPaid += invoice.paid;
      statementMap[invoice.customer].balance += invoice.outstanding;
    });

    const customerStatements = Object.values(statementMap);

    const monthlySalesMap = {};
    baseInvoices.forEach((invoice) => {
      const d = parseDate(invoice.issueDate);
      if (!d) return;
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlySalesMap[monthKey]) {
        monthlySalesMap[monthKey] = { month: monthKey, invoiceCount: 0, totalSales: 0 };
      }
      monthlySalesMap[monthKey].invoiceCount += 1;
      monthlySalesMap[monthKey].totalSales += invoice.total;
    });
    const monthlySales = Object.values(monthlySalesMap).sort((a, b) => a.month.localeCompare(b.month));

    const agingRows = outstandingInvoices.map((invoice) => {
      const due = parseDate(invoice.dueDate);
      const daysOverdue = !due ? 0 : Math.max(0, Math.floor((today - due) / (1000 * 60 * 60 * 24)));
      return {
        invoiceNo: invoice.invoiceNo,
        customer: invoice.customer,
        dueDate: invoice.dueDate,
        current: daysOverdue === 0 ? invoice.outstanding : 0,
        days31to60: daysOverdue > 0 && daysOverdue <= 60 ? invoice.outstanding : 0,
        days61to90: daysOverdue > 60 && daysOverdue <= 90 ? invoice.outstanding : 0,
        over90: daysOverdue > 90 ? invoice.outstanding : 0,
        outstanding: invoice.outstanding
      };
    });

    return {
      totalOutstanding,
      totalCollected,
      overdueAmount,
      outstandingInvoices,
      partialInvoices,
      paidInvoices,
      overdueInvoices,
      paymentHistory,
      customerStatements,
      monthlySales,
      agingRows
    };
  };

  const handleSearchFilters = () => {
    if (filters.dateFrom && filters.dateTo && new Date(filters.dateFrom) > new Date(filters.dateTo)) {
      setError('Date From cannot be later than Date To');
      return;
    }
    setError('');
    setAppliedFilters({ ...filters });
  };

  const handleResetFilters = () => {
    setError('');
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

  React.useEffect(() => {
    let active = true;

    async function loadReportData() {
      try {
        setLoading(true);
        setError('');

        const [invoicesRes, paymentsRes] = await Promise.all([
          fetch(`${API_BASE}/api/invoices`),
          fetch(`${API_BASE}/api/payments`)
        ]);

        if (!invoicesRes.ok || !paymentsRes.ok) {
          throw new Error('Failed to load report data');
        }

        const invoicesRaw = await invoicesRes.json();
        const paymentsRaw = await paymentsRes.json();
        const invoices = Array.isArray(invoicesRaw) ? invoicesRaw : [];
        const payments = Array.isArray(paymentsRaw) ? paymentsRaw : [];

        if (active) {
          setAllInvoices(invoices);
          setAllPayments(payments);
          setReportData(buildReportData(invoices, payments, defaultFilters));
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load report data');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadReportData();

    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    if (loading) return;
    setReportData(buildReportData(allInvoices, allPayments, appliedFilters));
  }, [allInvoices, allPayments, appliedFilters, loading]);

  const formatMoney = (amount) => "$" + Number(amount || 0).toLocaleString();
  const formatDateLabel = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
  };

  const summaryStats = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalReceivables = 0;
    let overdueAmount = 0;

    allInvoices.forEach((invoice) => {
      const total = Number(invoice.amount || invoice.total || 0);
      const paid = Number(invoice.paid || 0);
      const outstanding = Math.max(0, total - paid);

      if (outstanding <= 0) return;
      totalReceivables += outstanding;

      const due = parseDate(invoice.dueDate);
      if (due && due < today) {
        overdueAmount += outstanding;
      }
    });

    const totalCollected = allPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    return {
      totalReceivables,
      totalCollected,
      overdueAmount
    };
  }, [allInvoices, allPayments]);

  const collectionEfficiency = summaryStats.totalReceivables + summaryStats.totalCollected > 0
    ? Math.round((summaryStats.totalCollected / (summaryStats.totalReceivables + summaryStats.totalCollected)) * 100)
    : 0;

  const displayedInvoices = appliedFilters.status === 'overdue'
    ? reportData.overdueInvoices
    : appliedFilters.status === 'partial'
      ? reportData.partialInvoices
      : reportData.paidInvoices;

  const noResultsMessage = appliedFilters.status === 'overdue'
    ? 'No overdue invoices found'
    : appliedFilters.status === 'partial'
      ? 'No partial invoices found'
      : 'No paid invoices found';

  return (
    <div className="min-h-screen bg-background text-textPrimary p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">📈 Reports & Analytics</h1>
      </div>

      <div className="bg-card p-6 rounded border border-border mb-6">
        <h2 className="text-xl font-bold mb-4">Report Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Report Category</label>
            <select
              className="w-full p-2 bg-background rounded border border-border text-textPrimary"
              value={filters.category}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
            >
              <option value="invoice">Invoice</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Date From</label>
            <input
              type="date"
              className="w-full p-2 bg-background rounded border border-border text-textPrimary"
              value={filters.dateFrom}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Date To</label>
            <input
              type="date"
              className="w-full p-2 bg-background rounded border border-border text-textPrimary"
              value={filters.dateTo}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              className="w-full p-2 bg-background rounded border border-border text-textPrimary"
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="partial">Partial</option>
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Customer</label>
            <select
              className="w-full p-2 bg-background rounded border border-border text-textPrimary"
              value={filters.customer}
              onChange={(e) => setFilters((prev) => ({ ...prev, customer: e.target.value }))}
            >
              <option value="all">All Customers</option>
              {customerOptions.map((customerName) => (
                <option key={customerName} value={customerName}>{customerName}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={handleSearchFilters} className="px-4 py-2 bg-primary rounded hover:opacity-80 font-medium">Search</button>
          <button onClick={handleResetFilters} className="px-4 py-2 bg-background border border-border rounded hover:opacity-80 font-medium">Reset</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card p-6 rounded border border-border">
          <p className="text-sm text-textSecondary">Total Receivables</p>
          <p className="text-3xl font-bold mt-2">{formatMoney(summaryStats.totalReceivables)}</p>
        </div>
        <div className="bg-card p-6 rounded border border-border">
          <p className="text-sm text-textSecondary">Total Collected</p>
          <p className="text-3xl font-bold mt-2">{formatMoney(summaryStats.totalCollected)}</p>
        </div>
        <div className="bg-card p-6 rounded border border-border">
          <p className="text-sm text-textSecondary">Overdue Amount</p>
          <p className="text-3xl font-bold mt-2 text-red-500">{formatMoney(summaryStats.overdueAmount)}</p>
        </div>
        <div className="bg-card p-6 rounded border border-border">
          <p className="text-sm text-textSecondary">Collection Efficiency</p>
          <p className="text-3xl font-bold mt-2 text-green-500">{collectionEfficiency}%</p>
        </div>
      </div>

      <div className="bg-card rounded border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold">Report Results</h2>
          <p className="text-sm text-textSecondary mt-1">Showing results for your selected filters</p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-textSecondary">Loading report data...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="text-left p-4 font-semibold text-textPrimary">Invoice</th>
                  <th className="text-left p-4 font-semibold text-textPrimary">Customer</th>
                  <th className="text-left p-4 font-semibold text-textPrimary">Issue Date</th>
                  <th className="text-left p-4 font-semibold text-textPrimary">Status</th>
                  <th className="text-right p-4 font-semibold text-textPrimary">Amount</th>
                </tr>
              </thead>
              <tbody>
                {displayedInvoices.map((inv, idx) => (
                  <tr key={idx} className="border-b border-border hover:bg-background">
                    <td className="p-4 font-semibold">{inv.invoiceNo}</td>
                    <td className="p-4">{inv.customer}</td>
                    <td className="p-4 text-sm text-textSecondary">{formatDateLabel(inv.issueDate)}</td>
                    <td className="p-4">{inv.status}</td>
                    <td className="p-4 text-right">{formatMoney(appliedFilters.status === 'paid' ? (inv.paid || inv.total) : inv.outstanding)}</td>
                  </tr>
                ))}
                {displayedInvoices.length === 0 && (
                  <tr><td className="p-4 text-center text-textSecondary" colSpan="5">{noResultsMessage}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}


function DashboardLayout({ user, onLogout, children }) {
  return (
    <div className="min-h-screen bg-background text-textPrimary">
      <nav className="bg-card border-b border-border p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-6">
            <Link to="/dashboard" className="text-xl font-bold hover:text-opacity-80">TSH Synergy AR</Link>
            <div className="flex gap-4 ml-8">
              <Link to="/dashboard" className="hover:text-primary">Dashboard</Link>
              <Link to="/customers" className="hover:text-primary">Customers</Link>
              <Link to="/invoices" className="hover:text-primary">Invoices</Link>
              <Link to="/payments" className="hover:text-primary">Payments</Link>
              <Link to="/reports" className="hover:text-primary">Reports</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-textSecondary">{user?.companyName || user?.email}</span>
            <button onClick={onLogout} className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 text-sm">Logout</button>
          </div>
        </div>
      </nav>
      <div className="p-8">
        {children}
      </div>
    </div>
  )
}

function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedToken = sessionStorage.getItem(TOKEN_KEY);
    const savedUser = sessionStorage.getItem(USER_KEY);

    if (savedToken) {
      setToken(savedToken);
    }

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        sessionStorage.removeItem(USER_KEY);
      }
    }
  }, []);

  function handleLogin(newToken, userData) {
    setToken(newToken);
    setUser(userData);
    sessionStorage.setItem(TOKEN_KEY, newToken);
    sessionStorage.setItem(USER_KEY, JSON.stringify(userData || {}));
    // Redirect to dashboard after login
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 0);
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }

  if (!token) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/signup" element={<SignupPage onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<DashboardLayout user={user} onLogout={handleLogout}><DashboardPage user={user} onLogout={handleLogout} /></DashboardLayout>} />
        <Route path="/customers" element={<DashboardLayout user={user} onLogout={handleLogout}><CustomersPage user={user} onLogout={handleLogout} /></DashboardLayout>} />
        <Route path="/invoices" element={<DashboardLayout user={user} onLogout={handleLogout}><InvoicesPage user={user} onLogout={handleLogout} /></DashboardLayout>} />
        <Route path="/payments" element={<DashboardLayout user={user} onLogout={handleLogout}><PaymentsPage user={user} onLogout={handleLogout} /></DashboardLayout>} />
        <Route path="/reports" element={<DashboardLayout user={user} onLogout={handleLogout}><ReportsPage user={user} onLogout={handleLogout} /></DashboardLayout>} />
        <Route path="*" element={<DashboardLayout user={user} onLogout={handleLogout}><DashboardPage user={user} onLogout={handleLogout} /></DashboardLayout>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
