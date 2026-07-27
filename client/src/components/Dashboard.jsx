import React, { useEffect, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line, Area, AreaChart } from 'recharts'

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
  const [topCustomers, setTopCustomers] = useState([]);
  const [monthlyPaymentTrend, setMonthlyPaymentTrend] = useState([]);
  const [paymentMethodBreakdown, setPaymentMethodBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`${API_BASE}/api/dashboard/aggregates`);
        if (!response.ok) {
          throw new Error('Failed to load dashboard data');
        }

        const payload = await response.json();

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

  // Fetch payments and aggregate by customer
  useEffect(() => {
    let active = true;

    async function loadPayments() {
      try {
        const response = await fetch(`${API_BASE}/api/payments`);
        if (!response.ok) throw new Error('Failed to load payments');
        
        const payments = await response.json();
        if (!active) return;

        // Also fetch invoices to get customer names
        const invoicesResponse = await fetch(`${API_BASE}/api/invoices`);
        const invoices = await invoicesResponse.json();
        if (!active) return;

        // Create a map of invoice id to customer name
        const invoiceMap = {};
        invoices.forEach(inv => {
          invoiceMap[inv.id] = inv.customerName || 'Unknown';
        });

        // Aggregate payments by customer
        const customerPayments = {};
        payments.forEach(payment => {
          const customerName = payment.customerName || invoiceMap[payment.invoiceId] || 'Unknown';
          customerPayments[customerName] = (customerPayments[customerName] || 0) + Number(payment.amount || 0);
        });

        // Sort by amount descending and take top 5
        const sorted = Object.entries(customerPayments)
          .map(([name, amount]) => ({ name, amount }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);

        setTopCustomers(sorted);
      } catch (err) {
        if (!active) return;
        console.error('Failed to load top customers:', err);
      }
    }

    loadPayments();
    return () => { active = false; };
  }, []);

  // Fetch payments and aggregate by month
  useEffect(() => {
    let active = true;

    async function loadMonthlyPayments() {
      try {
        const response = await fetch(`${API_BASE}/api/payments`);
        if (!response.ok) throw new Error('Failed to load payments');
        
        const payments = await response.json();
        if (!active) return;

        // Aggregate payments by month
        const monthlyData = {};
        const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        payments.forEach(payment => {
          const paymentDate = new Date(payment.paymentDate);
          if (!isNaN(paymentDate.getTime())) {
            const year = paymentDate.getFullYear();
            const month = paymentDate.getMonth();
            const key = `${year}-${month}`;
            
            if (!monthlyData[key]) {
              monthlyData[key] = {
                month: monthLabels[month],
                fullMonth: `${monthLabels[month]} ${year}`,
                amount: 0
              };
            }
            monthlyData[key].amount += Number(payment.amount || 0);
          }
        });

        // Sort by date and format
        const sorted = Object.values(monthlyData)
          .sort((a, b) => new Date(a.fullMonth) - new Date(b.fullMonth))
          .slice(-12) // Last 12 months
          .map(item => ({
            month: item.month,
            amount: item.amount
          }));

        setMonthlyPaymentTrend(sorted);
      } catch (err) {
        if (!active) return;
        console.error('Failed to load monthly payments:', err);
      }
    }

    loadMonthlyPayments();
    return () => { active = false; };
  }, []);

  // Fetch payments and aggregate by payment method
  useEffect(() => {
    let active = true;

    async function loadPaymentMethods() {
      try {
        const response = await fetch(`${API_BASE}/api/payments`);
        if (!response.ok) throw new Error('Failed to load payments');
        
        const payments = await response.json();
        if (!active) return;

        // Aggregate payments by method
        const methodData = {};
        payments.forEach(payment => {
          const method = payment.method || 'Other';
          methodData[method] = (methodData[method] || 0) + Number(payment.amount || 0);
        });

        // Convert to array format for pie chart
        const breakdown = Object.entries(methodData)
          .map(([name, value]) => ({
            name,
            value
          }))
          .sort((a, b) => b.value - a.value);

        setPaymentMethodBreakdown(breakdown);
      } catch (err) {
        if (!active) return;
        console.error('Failed to load payment methods:', err);
      }
    }

    loadPaymentMethods();
    return () => { active = false; };
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

      {/* Top Customers by Payment */}
      <div className="bg-card p-6 rounded border border-border">
        <div className="mb-6">
          <h3 className="text-xl font-bold">Top Customers by Payment</h3>
          <p className="text-sm text-textSecondary mt-1">Ranking of customers with highest payments</p>
        </div>
        {topCustomers.length === 0 ? (
          <p className="text-textSecondary text-center py-8">No payment data available</p>
        ) : (
          <div className="w-full" style={{ height: Math.max(300, topCustomers.length * 70) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={topCustomers} 
                layout="vertical" 
                margin={{ top: 10, right: 40, left: 120, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis 
                  type="number" 
                  tick={{ fill: '#e5e7eb', fontSize: 12, fontWeight: 500 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={120}
                  tick={{ fill: '#f3f4f6', fontSize: 13, fontWeight: 600 }}
                />
                <Tooltip 
                  formatter={(value) => formatMoney(value)}
                  contentStyle={{ 
                    backgroundColor: 'var(--color-card)',
                    border: '2px solid var(--color-primary)',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                  labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 'bold' }}
                />
                <Bar 
                  dataKey="amount" 
                  fill="#3b82f6" 
                  radius={[0, 12, 12, 0]}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Monthly Payment Trend */}
      <div className="bg-card p-6 rounded border border-border">
        <div className="mb-6">
          <h3 className="text-xl font-bold">Monthly Payment Trend</h3>
          <p className="text-sm text-textSecondary mt-1">Total payment amount by month over time</p>
        </div>
        {monthlyPaymentTrend.length === 0 ? (
          <p className="text-textSecondary text-center py-8">No payment data available</p>
        ) : (
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={monthlyPaymentTrend}
                margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#e5e7eb', fontSize: 12, fontWeight: 500 }}
                />
                <YAxis 
                  tick={{ fill: '#e5e7eb', fontSize: 12, fontWeight: 500 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value) => formatMoney(value)}
                  contentStyle={{ 
                    backgroundColor: 'var(--color-card)',
                    border: '2px solid var(--color-primary)',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                  labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                  dot={{ fill: '#3b82f6', r: 5 }}
                  activeDot={{ r: 7 }}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Payment Method Breakdown */}
      <div className="bg-card p-6 rounded border border-border">
        <div className="mb-6">
          <h3 className="text-xl font-bold">Payment Method Breakdown</h3>
          <p className="text-sm text-textSecondary mt-1">Distribution of payments by method</p>
        </div>
        {paymentMethodBreakdown.length === 0 ? (
          <p className="text-textSecondary text-center py-8">No payment data available</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {paymentMethodBreakdown.map((entry, index) => {
                      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                      return <Cell key={entry.name} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <Tooltip formatter={(value) => formatMoney(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col justify-center space-y-4">
              {paymentMethodBreakdown.map((method, index) => {
                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                const total = paymentMethodBreakdown.reduce((sum, m) => sum + m.value, 0);
                const percentage = total > 0 ? ((method.value / total) * 100).toFixed(1) : 0;
                return (
                  <div key={method.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                      <span className="text-textPrimary font-medium">{method.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-textSecondary text-sm">{percentage}%</span>
                      <span className="font-semibold">{formatMoney(method.value)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
