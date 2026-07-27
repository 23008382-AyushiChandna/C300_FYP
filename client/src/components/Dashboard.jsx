import React, { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:1573';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalReceivables: 0,
    overdueAmount: 0,
    totalCollected: 0,
    activeCustomers: 0,
    collectionRate: 0
  });
  const [ageing, setAgeing] = useState({ d0to30: 0, d31to60: 0, d61to90: 0, d90plus: 0 });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setLoading(true);
        setError('');

        const [dashboardRes, invoicesRes, paymentsRes] = await Promise.all([
          fetch(`${API_BASE}/api/dashboard/aggregates`),
          fetch(`${API_BASE}/api/invoices`),
          fetch(`${API_BASE}/api/payments`)
        ]);

        if (!dashboardRes.ok || !invoicesRes.ok || !paymentsRes.ok) {
          throw new Error('Failed to load dashboard data');
        }

        const payload = await dashboardRes.json();
        const invoicesData = await invoicesRes.json();
        const paymentsData = await paymentsRes.json();

        if (!active) return;

        setStats(payload.stats || {
          totalReceivables: 0,
          overdueAmount: 0,
          totalCollected: 0,
          activeCustomers: 0,
          collectionRate: 0
        });
        setAgeing(payload.ageing || { d0to30: 0, d31to60: 0, d61to90: 0, d90plus: 0 });
        setRecentInvoices(Array.isArray(payload.recentInvoices) ? payload.recentInvoices : []);
        setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
        setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Unable to load dashboard data');
      } finally {
        if (!active) return;
        setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

  const statusLabel = (status) => {
    const value = String(status || 'pending').toLowerCase();
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const statusClass = (status) => {
    const value = String(status || '').toLowerCase();
    if (value === 'paid') return 'bg-green-100 text-green-800';
    if (value === 'overdue') return 'bg-red-100 text-red-800';
    if (value === 'partial') return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  const collectionRateValue = Math.min(100, Math.max(0, Number(stats.collectionRate) || 0));
  const collectionRateData = [
    { name: 'Collected', value: collectionRateValue },
    { name: 'Outstanding', value: 100 - collectionRateValue }
  ];
  const collectionRateColors = ['#22c55e', '#e5e7eb'];

  const topCustomerOutstanding = React.useMemo(() => {
    const buckets = {};

    invoices.forEach((invoice) => {
      const customer = invoice.customerName || invoice.customer || 'Unknown';
      const total = Number(invoice.amount || invoice.total || 0);
      const paid = Number(invoice.paid || 0);
      const outstanding = Math.max(0, total - paid);

      if (!buckets[customer]) {
        buckets[customer] = 0;
      }
      buckets[customer] += outstanding;
    });

    return Object.entries(buckets)
      .map(([name, amount]) => ({ name, amount: Number(amount.toFixed(2)) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [invoices]);

  const ageingPieData = React.useMemo(() => {
    return [
      { name: '0-30 Days', value: Number(ageing.d0to30 || 0) },
      { name: '31-60 Days', value: Number(ageing.d31to60 || 0) },
      { name: '61-90 Days', value: Number(ageing.d61to90 || 0) },
      { name: '90+ Days', value: Number(ageing.d90plus || 0) }
    ];
  }, [ageing]);

  const ageingPieColors = ['#22c55e', '#38bdf8', '#f59e0b', '#ef4444'];

  const monthlyTrend = React.useMemo(() => {
    const labels = [];
    const slots = [];
    const now = new Date();

    for (let i = 5; i >= 0; i -= 1) {
      const marker = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${marker.getFullYear()}-${marker.getMonth()}`;
      labels.push(marker.toLocaleString(undefined, { month: 'short' }));
      slots.push({ key, month: labels[labels.length - 1], billed: 0, collected: 0 });
    }

    invoices.forEach((invoice) => {
      const issueDate = new Date(invoice.issueDate || invoice.createdAt || '');
      if (Number.isNaN(issueDate.getTime())) return;
      const key = `${issueDate.getFullYear()}-${issueDate.getMonth()}`;
      const slot = slots.find((item) => item.key === key);
      if (!slot) return;
      slot.billed += Number(invoice.amount || invoice.total || 0);
    });

    payments.forEach((payment) => {
      const paymentDate = new Date(payment.paymentDate || payment.date || payment.createdAt || '');
      if (Number.isNaN(paymentDate.getTime())) return;
      const key = `${paymentDate.getFullYear()}-${paymentDate.getMonth()}`;
      const slot = slots.find((item) => item.key === key);
      if (!slot) return;
      slot.collected += Number(payment.amount || 0);
    });

    return slots.map((slot) => ({
      month: slot.month,
      billed: Number(slot.billed.toFixed(2)),
      collected: Number(slot.collected.toFixed(2))
    }));
  }, [invoices, payments]);

  return (
    <div className="space-y-6">
      {loading && (
        <div className="bg-card p-4 rounded border border-border text-textSecondary">Loading dashboard data...</div>
      )}
      {error && (
        <div className="bg-card p-4 rounded border border-border text-red-500">{error}</div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-6 rounded border border-border">
          <p className="text-sm text-textSecondary">Total Receivables</p>
          <p className="text-3xl font-bold mt-2">{formatMoney(stats.totalReceivables)}</p>
        </div>
        <div className="bg-card p-6 rounded border border-border">
          <p className="text-sm text-textSecondary">Overdue Amount</p>
          <p className="text-3xl font-bold mt-2 text-red-500">{formatMoney(stats.overdueAmount)}</p>
        </div>
        <div className="bg-card p-6 rounded border border-border">
          <p className="text-sm text-textSecondary">Collected</p>
          <p className="text-3xl font-bold mt-2 text-green-500">{formatMoney(stats.totalCollected)}</p>
        </div>
        <div className="bg-card p-6 rounded border border-border">
          <p className="text-sm text-textSecondary">Active Customers</p>
          <p className="text-3xl font-bold mt-2">{stats.activeCustomers}</p>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AR Ageing Summary */}
        <div className="bg-card p-6 rounded border border-border">
          <h3 className="text-xl font-bold mb-4">AR Ageing Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <span className="text-textSecondary">0-30 days</span>
              <span className="font-semibold">{formatMoney(ageing.d0to30)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <span className="text-textSecondary">31-60 days</span>
              <span className="font-semibold">{formatMoney(ageing.d31to60)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <span className="text-textSecondary">61-90 days</span>
              <span className="font-semibold">{formatMoney(ageing.d61to90)}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-textSecondary">90+ days</span>
              <span className="font-semibold text-red-500">{formatMoney(ageing.d90plus)}</span>
            </div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-card p-6 rounded border border-border">
          <h3 className="text-xl font-bold mb-4">Recent Invoices</h3>
          {recentInvoices.length === 0 ? (
            <p className="text-textSecondary">No invoices yet.</p>
          ) : (
            <div className="space-y-3">
              {recentInvoices.map((inv, index) => (
                <div key={inv.id || index} className={`flex justify-between items-center ${index < recentInvoices.length - 1 ? 'pb-3 border-b border-border' : 'pt-2'}`}>
                  <div>
                    <p className="font-semibold">{inv.invoiceNumber || '-'}</p>
                    <p className="text-sm text-textSecondary">{formatMoney(inv.total)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm ${statusClass(inv.status)}`}>{statusLabel(inv.status)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card p-6 rounded border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Collection Rate</h3>
          <span className="text-sm font-semibold text-textPrimary">{collectionRateValue}%</span>
        </div>

        <div className="w-full h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={collectionRateData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={84}
                paddingAngle={2}
              >
                {collectionRateData.map((entry, index) => (
                  <Cell key={entry.name} fill={collectionRateColors[index % collectionRateColors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-center gap-6 mt-2 text-sm">
          <div className="flex items-center gap-2 text-textSecondary">
            <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
            <span>Collected</span>
          </div>
          <div className="flex items-center gap-2 text-textSecondary">
            <span className="inline-block w-3 h-3 rounded-full bg-gray-200" />
            <span>Outstanding</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Monthly Billed vs Collected</h3>
            <span className="text-sm text-textSecondary">Last 6 months</span>
          </div>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip formatter={(value) => formatMoney(value)} />
                <Legend />
                <Line type="monotone" dataKey="billed" stroke="#38bdf8" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="collected" stroke="#22c55e" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card p-6 rounded border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Top Customers by Outstanding</h3>
            <span className="text-sm text-textSecondary">Highest balances</span>
          </div>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCustomerOutstanding} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} interval={0} angle={-8} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} stroke="#94a3b8" />
                <Tooltip formatter={(value) => [formatMoney(value), 'Outstanding']} />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {topCustomerOutstanding.map((item, index) => (
                    <Cell key={`${item.name}-${index}`} fill={index % 2 === 0 ? '#38bdf8' : '#22c55e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-card p-6 rounded border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Ageing Composition</h3>
          <span className="text-sm text-textSecondary">Outstanding by bucket</span>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ageingPieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
              >
                {ageingPieData.map((entry, index) => (
                  <Cell key={entry.name} fill={ageingPieColors[index % ageingPieColors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatMoney(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
