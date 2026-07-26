import React, { useEffect, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

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
    </div>
  )
}
