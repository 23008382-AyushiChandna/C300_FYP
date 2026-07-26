import React, { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:1573';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    invoice: '',
    customerName: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    method: 'Bank Transfer',
    referenceNumber: '',
    status: 'reconciled'
  });
  const [lookupLoading, setLookupLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts(t => t.filter(toast => toast.id !== id));
    }, 3500);
  };

  const lookupInvoice = async (invoiceNumber) => {
    if (!invoiceNumber.trim()) {
      setFormData(prev => ({ ...prev, customerName: '' }));
      return;
    }

    setLookupLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/payments/lookup/${invoiceNumber}`);
      if (res.ok) {
        const invoice = await res.json();
        setFormData(prev => ({ ...prev, customerName: invoice.customerName }));
        showToast(`Invoice found: ${invoice.customerName}`, 'success');
      } else {
        setFormData(prev => ({ ...prev, customerName: '' }));
        showToast('Invoice not found', 'error');
      }
    } catch (err) {
      setFormData(prev => ({ ...prev, customerName: '' }));
      showToast('Failed to lookup invoice', 'error');
    } finally {
      setLookupLoading(false);
    }
  };

  const getFilteredPayments = () => {
    return payments.filter(payment => {
      const query = searchQuery.toLowerCase();
      return query === '' || payment.invoice.toLowerCase().includes(query) || payment.customer.toLowerCase().includes(query);
    });
  };

  const filteredPayments = getFilteredPayments();

  useEffect(() => {
    fetch(`${API_BASE}/api/payments`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mapped = data.map(item => ({
            id: item.id,
            invoice: item.invoiceNumber,
            customer: item.customerName,
            amount: Number(item.amount),
            date: item.paymentDate,
            method: item.paymentMethod,
            status: item.status,
            referenceNumber: item.referenceNumber
          }));
          setPayments(mapped);
        }
      })
      .catch(() => {
        setPayments([]);
      });
  }, []);

  useEffect(() => {
    setFormData(prev => {
      if (prev.referenceNumber && prev.referenceNumber.trim() !== '') {
        return prev;
      }
      return { ...prev, referenceNumber: generateReferenceNumber(prev.method) };
    });
  }, [payments]);

  const stats = {
    totalPayments: payments.length,
    thisMonth: 412500,
    avgPaymentTime: 14,
    reconcileRate: payments.length > 0 ? Math.round((payments.filter(p => p.status === 'reconciled').length / payments.length) * 100) : 0
  };

  const generateReferenceNumber = (method) => {
    const methodPrefix = method === 'Bank Transfer' ? 'BT' : method === 'Cheque' ? 'CHQ' : method === 'Credit Card' ? 'CC' : 'CSH';
    const methodPayments = payments.filter(p => p.method === method);
    const nextNumber = methodPayments.length + 1;
    return `${methodPrefix}-${String(nextNumber).padStart(3, '0')}`;
  };

  const resetForm = () => {
    setFormData({
      invoice: '',
      customerName: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      method: 'Bank Transfer',
      referenceNumber: generateReferenceNumber('Bank Transfer'),
      status: 'reconciled'
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleRecordPayment = async () => {
    if (!formData.invoice || !formData.amount || !formData.customerName) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      const payload = {
        invoiceNumber: formData.invoice,
        customerName: formData.customerName,
        amount: parseFloat(formData.amount),
        paymentDate: formData.date,
        paymentMethod: formData.method,
        referenceNumber: formData.referenceNumber || generateReferenceNumber(formData.method),
        status: formData.status || 'reconciled'
      };

      const url = editingId ? `${API_BASE}/api/payments/${editingId}` : `${API_BASE}/api/payments`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const saved = await res.json();
      if (!res.ok) throw new Error(saved.error || 'Save failed');

      const paymentData = {
        id: saved.id,
        invoice: saved.invoiceNumber,
        customer: saved.customerName,
        amount: Number(saved.amount),
        date: saved.paymentDate,
        method: saved.paymentMethod,
        status: saved.status,
        referenceNumber: saved.referenceNumber
      };

      if (editingId) {
        setPayments(prev => prev.map(payment => payment.id === editingId ? paymentData : payment));
        showToast('Payment updated successfully', 'success');
      } else {
        setPayments([paymentData, ...payments]);
        showToast('Payment recorded successfully', 'success');
      }

      resetForm();
    } catch (err) {
      showToast(err.message || 'Failed to save payment', 'error');
    }
  };

  const handleEditPayment = (payment) => {
    setEditingId(payment.id);
    setFormData({
      invoice: payment.invoice,
      customerName: payment.customer,
      amount: String(payment.amount),
      date: payment.date || new Date().toISOString().split('T')[0],
      method: payment.method,
      referenceNumber: payment.referenceNumber || '',
      status: payment.status || 'reconciled'
    });
    setShowForm(true);
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Delete this payment?')) return;

    try {
      const res = await fetch(`${API_BASE}/api/payments/${paymentId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Delete failed');

      setPayments(prev => prev.filter(payment => payment.id !== paymentId));
      showToast('Payment deleted successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete payment', 'error');
    }
  };

  const getStatusColor = (status) => {
    if (status === 'reconciled') return 'bg-green-100 text-green-800';
    if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const handleExportSpreadsheet = () => {
    if (filteredPayments.length === 0) {
      showToast('No payments to export', 'default');
      return;
    }

    const rows = filteredPayments.map((payment) => ({
      Invoice: payment.invoice,
      Customer: payment.customer,
      Amount: Number(payment.amount) || 0,
      'Payment Date': payment.date,
      Method: payment.method,
      Reference: payment.referenceNumber || '',
      Status: payment.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');

    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `payments-${today}.xlsx`);
    showToast('Spreadsheet exported successfully', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-6 rounded border border-border">
          <p className="text-sm text-textSecondary">Payments Received</p>
          <p className="text-3xl font-bold mt-2">{stats.totalPayments}</p>
        </div>
        <div className="bg-card p-6 rounded border border-border">
          <p className="text-sm text-textSecondary">Collected This Month</p>
          <p className="text-3xl font-bold mt-2">${stats.thisMonth.toLocaleString()}</p>
        </div>
        <div className="bg-card p-6 rounded border border-border">
          <p className="text-sm text-textSecondary">Average Payment Time</p>
          <p className="text-3xl font-bold mt-2">{stats.avgPaymentTime} days</p>
        </div>
        <div className="bg-card p-6 rounded border border-border">
          <p className="text-sm text-textSecondary">Reconciled</p>
          <p className="text-3xl font-bold mt-2 text-green-500">{stats.reconcileRate}%</p>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="bg-card p-4 rounded border border-border flex gap-4">
        <input
          type="search"
          placeholder="Search invoice, customer or reference"
          className="flex-1 p-2 bg-background rounded border border-border text-textPrimary"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          onClick={handleExportSpreadsheet}
          className="px-4 py-2 bg-background border border-border rounded hover:opacity-80 font-medium"
        >
          Export Spreadsheet
        </button>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary rounded hover:opacity-80 font-medium"
        >
          Record Payment
        </button>
      </div>

      {/* Payment Entry Form */}
      {showForm && (
        <div className="bg-card p-6 rounded border border-border">
          <h3 className="text-xl font-bold mb-4">Payment Entry</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Invoice Number *</label>
              <input
                type="text"
                placeholder="INV-2026-014"
                className="w-full p-2 bg-background rounded border border-border text-textPrimary"
                value={formData.invoice}
                onChange={(e) => {
                  setFormData({ ...formData, invoice: e.target.value });
                  lookupInvoice(e.target.value);
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Customer Name {lookupLoading && '(loading...)'}</label>
              <input
                type="text"
                placeholder="Auto-populated from invoice"
                className="w-full p-2 bg-background rounded border border-border text-textPrimary opacity-75"
                value={formData.customerName}
                readOnly
              />
              {formData.customerName && <p className="text-xs text-green-500 mt-1">✓ Found in invoice</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Amount Paid *</label>
              <input
                type="number"
                placeholder="0.00"
                className="w-full p-2 bg-background rounded border border-border text-textPrimary"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Payment Date</label>
              <input
                type="date"
                className="w-full p-2 bg-background rounded border border-border text-textPrimary"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Payment Method</label>
              <select
                className="w-full p-2 bg-background rounded border border-border text-textPrimary"
                value={formData.method}
                onChange={(e) => {
                  const nextMethod = e.target.value;
                  setFormData(prev => {
                    const autoGenerated = generateReferenceNumber(prev.method);
                    const shouldRegenerate = !prev.referenceNumber || prev.referenceNumber === autoGenerated;
                    return {
                      ...prev,
                      method: nextMethod,
                      referenceNumber: shouldRegenerate ? generateReferenceNumber(nextMethod) : prev.referenceNumber
                    };
                  });
                }}
              >
                <option>Bank Transfer</option>
                <option>Cheque</option>
                <option>Credit Card</option>
                <option>Cash</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Reference Key / Number</label>
              <input
                type="text"
                className="w-full p-2 bg-background rounded border border-border text-textPrimary font-mono text-sm"
                value={formData.referenceNumber}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                placeholder="e.g. BT-001"
              />
              <p className="text-xs text-textSecondary mt-1">You can edit this manually.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                className="w-full p-2 bg-background rounded border border-border text-textPrimary"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="reconciled">Reconciled</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-background border border-border rounded hover:opacity-80"
            >
              Cancel
            </button>
            <button
              onClick={handleRecordPayment}
              className="px-4 py-2 bg-primary rounded hover:opacity-80 font-medium disabled:opacity-50"
              disabled={lookupLoading || !formData.customerName}
            >
              {editingId ? 'Update Payment' : 'Save Payment'}
            </button>
          </div>
        </div>
      )}

      {/* Recent Payments Table */}
      <div className="bg-card rounded border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold">Recent Payment Activity</h2>
          <p className="text-sm text-textSecondary mt-1">Review the latest cash receipts and apply payments against customer invoices</p>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="p-8 text-center text-textSecondary">
            No payments found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="text-left p-4 font-semibold text-textPrimary">Invoice</th>
                  <th className="text-left p-4 font-semibold text-textPrimary">Customer</th>
                  <th className="text-right p-4 font-semibold text-textPrimary">Amount</th>
                  <th className="text-left p-4 font-semibold text-textPrimary">Payment Date</th>
                  <th className="text-left p-4 font-semibold text-textPrimary">Method</th>
                  <th className="text-left p-4 font-semibold text-textPrimary">Reference</th>
                  <th className="text-left p-4 font-semibold text-textPrimary">Status</th>
                  <th className="text-left p-4 font-semibold text-textPrimary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment, index) => (
                  <tr key={index} className="border-b border-border hover:bg-background">
                    <td className="p-4 font-semibold">{payment.invoice}</td>
                    <td className="p-4">{payment.customer}</td>
                    <td className="p-4 text-right">${payment.amount.toLocaleString()}</td>
                    <td className="p-4 text-sm text-textSecondary">{payment.date}</td>
                    <td className="p-4 text-sm">{payment.method}</td>
                    <td className="p-4 text-sm font-mono">{payment.referenceNumber || '-'}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(payment.status)}`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 flex gap-2">
                      <button onClick={() => handleEditPayment(payment)} className="px-3 py-1 text-sm border border-border rounded hover:bg-background">Edit</button>
                      <button onClick={() => handleDeletePayment(payment.id)} className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-border text-sm text-textSecondary">
          Showing {filteredPayments.length} of {payments.length} payments
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-40">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded ${
              toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
            } text-white`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  )
}
