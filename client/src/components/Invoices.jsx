import React, { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:1573';

const emptyForm = {
  invoiceNumber: '',
  customerId: '',
  customerName: '',
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: '',
  amount: '',
  description: '',
  notes: '',
  status: 'partial'
};

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/invoices`)
      .then(res => res.json())
      .then(data => { setInvoices(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/customers`)
      .then(res => res.json())
      .then(data => setCustomers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(toast => toast.id !== id)), 3500);
  };

  const generateInvoiceNumber = () => {
    if (invoices.length === 0) return 'INV-2026-001';
    const nums = invoices.map(inv => parseInt((inv.invoiceNumber || '').split('-').pop())).filter(n => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `INV-2026-${String(next).padStart(3, '0')}`;
  };

  const openModal = () => {
    setEditingId(null);
    setFormData({ ...emptyForm, invoiceNumber: generateInvoiceNumber() });
    setShowModal(true);
  };

  const openEditModal = (invoice) => {
    setEditingId(invoice.id);
    setFormData({
      invoiceNumber: invoice.invoiceNumber || '',
      customerId: String(invoice.customerId || ''),
      customerName: invoice.customerName || '',
      issueDate: invoice.issueDate ? String(invoice.issueDate).slice(0, 10) : '',
      dueDate: invoice.dueDate ? String(invoice.dueDate).slice(0, 10) : '',
      amount: String(invoice.amount || ''),
      description: invoice.description || '',
      notes: invoice.notes || '',
      status: invoice.status || 'pending'
    });
    setShowModal(true);
  };

  const handleCustomerChange = (e) => {
    const selectedId = e.target.value;
    const customer = customers.find(c => String(c.id) === String(selectedId));
    setFormData(f => ({ ...f, customerId: selectedId, customerName: customer ? customer.companyName : '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerId) { showToast('Please select a customer', 'error'); return; }
    if (!formData.invoiceNumber || !formData.amount || !formData.dueDate) { showToast('Please fill in all required fields', 'error'); return; }
    setSaving(true);
    try {
      const url = editingId ? `${API_BASE}/api/invoices/${editingId}` : `${API_BASE}/api/invoices`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber: formData.invoiceNumber,
          customerId: formData.customerId,
          customerName: formData.customerName,
          amount: Number(formData.amount),
          issueDate: formData.issueDate,
          dueDate: formData.dueDate,
          description: formData.description,
          notes: formData.notes,
          status: formData.status
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save invoice');
      if (editingId) {
        setInvoices(prev => prev.map(inv => inv.id === editingId ? data : inv));
        showToast(`Invoice ${data.invoiceNumber} updated successfully`);
      } else {
        setInvoices(prev => [data, ...prev]);
        showToast(`Invoice ${data.invoiceNumber} created successfully`);
      }
      setShowModal(false);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (invoiceId) => {
    if (!window.confirm('Delete this invoice?')) return;

    try {
      const res = await fetch(`${API_BASE}/api/invoices/${invoiceId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete invoice');

      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
      showToast('Invoice deleted successfully');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = query === '' || (invoice.invoiceNumber || '').toLowerCase().includes(query) || (invoice.customerName || '').toLowerCase().includes(query);
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalValue: invoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0),
    outstanding: invoices.filter(inv => Number(inv.amount) > Number(inv.paid)).length,
    overdue: invoices.filter(inv => inv.status === 'overdue').length,
    collectionRate: invoices.length > 0 ? Math.round((invoices.filter(inv => inv.status === 'paid').length / invoices.length) * 100) : 0
  };

  const getStatusColor = (status) => {
    if (status === 'paid') return 'bg-green-100 text-green-800';
    if (status === 'sent') return 'bg-blue-100 text-blue-800';
    if (status === 'overdue') return 'bg-red-100 text-red-800';
    if (status === 'partial') return 'bg-yellow-100 text-yellow-800';
    if (status === 'pending') return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

  const formatDateLabel = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    return date.toLocaleDateString();
  };

  const openDetailsModal = (invoice) => {
    setSelectedInvoice(invoice);
  };

  const handlePrintInvoice = (invoice) => {
    const subtotal = Number(invoice.amount || 0);
    const gst = Math.round(subtotal * 0.09 * 100) / 100;
    const total = subtotal + gst;
    const paid = Number(invoice.paid || 0);
    const outstanding = total - paid;

    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Arial', sans-serif;
            background: white;
            padding: 40px;
            color: #333;
            line-height: 1.6;
          }
          .invoice-container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
          }
          .header {
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #333;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .header-left h1 {
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 5px;
            color: #000;
          }
          .header-left p {
            font-size: 14px;
            color: #666;
          }
          .header-right {
            text-align: right;
          }
          .header-right p {
            font-size: 24px;
            font-weight: bold;
            color: #0066cc;
          }
          .info-section {
            margin-bottom: 30px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
          }
          .info-block {
            margin-bottom: 20px;
          }
          .info-label {
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #666;
            margin-bottom: 8px;
          }
          .info-content {
            font-size: 14px;
          }
          .company-info {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 5px;
          }
          .company-details {
            font-size: 13px;
            color: #555;
          }
          .bill-to-section {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 4px;
            margin-bottom: 30px;
          }
          .bill-to-section .info-label {
            margin-bottom: 10px;
          }
          .bill-to-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          table {
            width: 100%;
            margin-bottom: 30px;
            border-collapse: collapse;
          }
          thead {
            background: #f0f0f0;
            border-bottom: 2px solid #333;
          }
          th {
            padding: 12px;
            text-align: left;
            font-weight: bold;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
            font-size: 14px;
          }
          .text-right {
            text-align: right;
          }
          tbody tr:last-child td {
            border-bottom: none;
          }
          .summary {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
          }
          .summary-box {
            width: 350px;
            background: #f9f9f9;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 4px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 14px;
          }
          .summary-row.total {
            border-top: 1px solid #ddd;
            padding-top: 12px;
            margin-top: 12px;
            font-weight: bold;
            font-size: 16px;
          }
          .summary-row.outstanding {
            background: #fffbeb;
            border: 1px solid #fcd34d;
            padding: 10px;
            border-radius: 3px;
            font-weight: bold;
            color: #92400e;
          }
          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-paid {
            background: #d1fae5;
            color: #065f46;
          }
          .status-partial {
            background: #fef3c7;
            color: #92400e;
          }
          .status-overdue {
            background: #fee2e2;
            color: #991b1b;
          }
          .notes-section {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
          }
          .notes-title {
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #666;
            margin-bottom: 10px;
          }
          .notes-content {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 4px;
            font-size: 14px;
            color: #555;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
            text-align: center;
            font-size: 12px;
            color: #999;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
            @page {
              size: A4;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header -->
          <div class="header">
            <div class="header-left">
              <h1>INVOICE</h1>
              <p>Professional Invoice Document</p>
            </div>
            <div class="header-right">
              <p>${invoice.invoiceNumber || 'N/A'}</p>
            </div>
          </div>

          <!-- Company & Invoice Info -->
          <div class="info-section">
            <div>
              <div class="info-label">Invoice From</div>
              <div class="company-info">Your Company</div>
              <div class="company-details">
                123 Business Street<br>
                Singapore 123456<br>
                contact@company.sg
              </div>
            </div>
            <div>
              <div class="info-label">Invoice Details</div>
              <div class="info-content">
                <strong>Issued:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}<br>
                <strong>Due:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}<br>
                <div style="margin-top: 10px;">
                  <span class="status-badge status-${invoice.status || 'partial'}">${(invoice.status || 'partial').toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bill To -->
          <div class="bill-to-section">
            <div class="info-label">Bill To</div>
            <div class="bill-to-name">${invoice.customerName || 'N/A'}</div>
            <div class="company-details">Customer Account</div>
          </div>

          <!-- Line Items -->
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-right">Quantity</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${invoice.description || 'Service'}</td>
                <td class="text-right">1</td>
                <td class="text-right">$${subtotal.toLocaleString('en-SG', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td class="text-right"><strong>$${subtotal.toLocaleString('en-SG', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></td>
              </tr>
            </tbody>
          </table>

          <!-- Summary -->
          <div class="summary">
            <div class="summary-box">
              <div class="summary-row">
                <span>Subtotal</span>
                <span>$${subtotal.toLocaleString('en-SG', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div class="summary-row">
                <span>GST (9%)</span>
                <span>$${gst.toLocaleString('en-SG', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div class="summary-row total">
                <span>Total Due</span>
                <span>$${total.toLocaleString('en-SG', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div class="summary-row">
                <span>Amount Paid</span>
                <span style="color: #16a34a;">$${paid.toLocaleString('en-SG', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div class="summary-row outstanding">
                <span>Outstanding</span>
                <span>$${outstanding.toLocaleString('en-SG', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>

          ${invoice.notes ? `
          <!-- Notes -->
          <div class="notes-section">
            <div class="notes-title">Notes</div>
            <div class="notes-content">${invoice.notes}</div>
          </div>
          ` : ''}

          <!-- Footer -->
          <div class="footer">
            <p>Thank you for your business | This is an electronically generated document</p>
            <p style="margin-top: 8px;">For inquiries, please contact: contact@company.sg</p>
          </div>
        </div>

        <script>
          window.print();
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-6 rounded border border-border"><p className="text-sm text-textSecondary">Total Invoice Value</p><p className="text-3xl font-bold mt-2">${stats.totalValue.toLocaleString()}</p></div>
        <div className="bg-card p-6 rounded border border-border"><p className="text-sm text-textSecondary">Outstanding Invoices</p><p className="text-3xl font-bold mt-2">{stats.outstanding}</p></div>
        <div className="bg-card p-6 rounded border border-border"><p className="text-sm text-textSecondary">Overdue Invoices</p><p className="text-3xl font-bold mt-2 text-red-500">{stats.overdue}</p></div>
        <div className="bg-card p-6 rounded border border-border"><p className="text-sm text-textSecondary">Collection Rate</p><p className="text-3xl font-bold mt-2 text-green-500">{stats.collectionRate}%</p></div>
      </div>

      <div className="bg-card p-4 rounded border border-border flex gap-4">
        <input type="search" placeholder="Search invoice number or customer" className="flex-1 p-2 bg-background rounded border border-border text-textPrimary" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <button onClick={openModal} className="px-4 py-2 bg-primary rounded hover:opacity-80 font-medium">Create Invoice</button>
      </div>

      <div className="bg-card p-4 rounded border border-border">
        <div className="flex gap-2 overflow-x-auto">
          {['all', 'partial', 'paid', 'overdue'].map(status => (
            <button key={status} onClick={() => setFilterStatus(status)} className={`px-4 py-2 rounded whitespace-nowrap font-medium transition-colors ${filterStatus === status ? 'bg-primary text-white' : 'bg-background hover:bg-opacity-80 text-textSecondary'}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded border border-border overflow-hidden">
        <div className="p-6 border-b border-border"><h2 className="text-xl font-bold">Invoice Ledger</h2><p className="text-sm text-textSecondary mt-1">Review invoice details across all statuses</p></div>
        {loading ? (
          <div className="p-8 text-center text-textSecondary">Loading invoices...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-textSecondary">No invoices found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="text-left p-4 font-semibold">Invoice #</th>
                  <th className="text-left p-4 font-semibold">Customer</th>
                  <th className="text-left p-4 font-semibold">Invoice Date</th>
                  <th className="text-left p-4 font-semibold">Due Date</th>
                  <th className="text-right p-4 font-semibold">Subtotal</th>
                  <th className="text-right p-4 font-semibold">GST (9%)</th>
                  <th className="text-right p-4 font-semibold">Total</th>
                  <th className="text-right p-4 font-semibold">Paid</th>
                  <th className="text-right p-4 font-semibold">Outstanding</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice, index) => {
                  const subtotal = Number(invoice.amount || 0);
                  const gst = Math.round(subtotal * 0.09 * 100) / 100;
                  const total = subtotal + gst;
                  const paid = Number(invoice.paid || 0);
                  const outstanding = total - paid;
                  return (
                    <tr key={invoice.id || index} className="border-b border-border hover:bg-background">
                      <td className="p-4 font-semibold">
                        <button
                          type="button"
                          className="underline underline-offset-2 hover:opacity-80"
                          onClick={() => openDetailsModal(invoice)}
                        >
                          {invoice.invoiceNumber}
                        </button>
                      </td>
                      <td className="p-4">{invoice.customerName}</td>
                      <td className="p-4 text-sm text-textSecondary">{invoice.issueDate ? String(invoice.issueDate).slice(0, 10) : ''}</td>
                      <td className="p-4 text-sm text-textSecondary">{invoice.dueDate ? String(invoice.dueDate).slice(0, 10) : ''}</td>
                      <td className="p-4 text-right">${subtotal.toLocaleString()}</td>
                      <td className="p-4 text-right">${gst.toLocaleString()}</td>
                      <td className="p-4 text-right font-semibold">${total.toLocaleString()}</td>
                      <td className="p-4 text-right text-green-500">${paid.toLocaleString()}</td>
                      <td className="p-4 text-right font-semibold">${outstanding.toLocaleString()}</td>
                      <td className="p-4"><span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(invoice.status)}`}>{invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : ''}</span></td>
                      <td className="p-4 flex gap-2">
                        <button onClick={() => openDetailsModal(invoice)} className="px-3 py-1 text-sm border border-border rounded hover:bg-background">View</button>
                        <button onClick={() => openEditModal(invoice)} className="px-3 py-1 text-sm border border-border rounded hover:bg-background">Edit</button>
                        <button onClick={() => handleDelete(invoice.id)} className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50">Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-4 border-t border-border text-sm text-textSecondary">Showing {filteredInvoices.length} of {invoices.length} invoices</div>
      </div>

      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto invoice-modal" onClick={() => setSelectedInvoice(null)}>
          <div className="bg-white text-black rounded-lg shadow-2xl w-full max-w-4xl my-8" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <div className="absolute top-4 right-4">
              <button onClick={() => setSelectedInvoice(null)} className="text-gray-500 hover:text-gray-700 text-3xl leading-none p-2">&times;</button>
            </div>

            {/* Document Content */}
            <div className="p-12">
              {/* Header Section */}
              <div className="mb-12 pb-8 border-b-2 border-gray-300">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900">INVOICE</h1>
                    <p className="text-sm text-gray-600 mt-1">Professional Invoice Document</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-primary">{selectedInvoice.invoiceNumber}</p>
                  </div>
                </div>

                {/* Company Info */}
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-2">Invoice From</p>
                    <p className="font-semibold text-lg text-gray-900">Your Company</p>
                    <p className="text-sm text-gray-600">123 Business Street</p>
                    <p className="text-sm text-gray-600">Singapore 123456</p>
                    <p className="text-sm text-gray-600 mt-2">contact@company.sg</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-2">Invoice Details</p>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-semibold">Issued:</span> {formatDateLabel(selectedInvoice.issueDate)}</p>
                      <p><span className="font-semibold">Due:</span> {formatDateLabel(selectedInvoice.dueDate)}</p>
                      <p className="mt-3"><span className={`inline-block px-3 py-1 rounded text-xs font-bold ${selectedInvoice.status === 'paid' ? 'bg-green-100 text-green-800' : selectedInvoice.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{selectedInvoice.status ? selectedInvoice.status.toUpperCase() : ''}</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bill To Section */}
              <div className="mb-12">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-4">Bill To</p>
                <div className="bg-gray-50 p-6 rounded border border-gray-200">
                  <p className="font-semibold text-lg text-gray-900">{selectedInvoice.customerName || '-'}</p>
                  <p className="text-sm text-gray-600 mt-2">Customer Account</p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="mb-12">
                <table className="w-full mb-6">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="text-left p-4 font-semibold text-gray-900 text-sm">Description</th>
                      <th className="text-right p-4 font-semibold text-gray-900 text-sm">Quantity</th>
                      <th className="text-right p-4 font-semibold text-gray-900 text-sm">Unit Price</th>
                      <th className="text-right p-4 font-semibold text-gray-900 text-sm">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-4 text-sm text-gray-900">{selectedInvoice.description || 'Service'}</td>
                      <td className="text-right p-4 text-sm text-gray-900">1</td>
                      <td className="text-right p-4 text-sm text-gray-900">{formatMoney(selectedInvoice.amount)}</td>
                      <td className="text-right p-4 text-sm font-semibold text-gray-900">{formatMoney(selectedInvoice.amount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary Section */}
              <div className="flex justify-end mb-12">
                <div className="w-80">
                  <div className="space-y-3 bg-gray-50 p-6 rounded border border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold text-gray-900">{formatMoney(selectedInvoice.amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">GST (9%)</span>
                      <span className="font-semibold text-gray-900">{formatMoney(Number(selectedInvoice.amount || 0) * 0.09)}</span>
                    </div>
                    <div className="border-t border-gray-300 pt-3 flex justify-between">
                      <span className="font-semibold text-gray-900">Total Due</span>
                      <span className="text-xl font-bold text-primary">{formatMoney(Number(selectedInvoice.amount || 0) * 1.09)}</span>
                    </div>
                    <div className="border-t border-gray-300 pt-3 flex justify-between">
                      <span className="text-sm text-gray-600">Amount Paid</span>
                      <span className="text-sm font-semibold text-green-600">{formatMoney(selectedInvoice.paid || 0)}</span>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 flex justify-between">
                      <span className="text-sm font-semibold text-gray-900">Outstanding</span>
                      <span className="text-sm font-bold text-yellow-700">{formatMoney((Number(selectedInvoice.amount || 0) * 1.09) - Number(selectedInvoice.paid || 0))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {selectedInvoice.notes && (
                <div className="mb-12 pb-8 border-t border-gray-300 pt-8">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-3">Notes</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded border border-gray-200">{selectedInvoice.notes}</p>
                </div>
              )}

              {/* Footer */}
              <div className="border-t-2 border-gray-300 pt-8 text-center text-xs text-gray-500">
                <p>Thank you for your business | This is an electronically generated document</p>
                <p className="mt-2">For inquiries, please contact: contact@company.sg</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-gray-50 p-6 border-t border-gray-200 rounded-b-lg flex justify-end gap-3 print-hide">
              <button onClick={() => handlePrintInvoice(selectedInvoice)} className="px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 font-medium text-sm">Print / PDF</button>
              <button onClick={() => setSelectedInvoice(null)} className="px-4 py-2 bg-primary text-white rounded hover:opacity-80 font-medium text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div><h3 className="text-lg font-bold">{editingId ? 'Edit Invoice' : 'Create Invoice'}</h3><p className="text-sm text-textSecondary mt-1">{editingId ? 'Update the invoice details below' : 'Fill in the invoice details below'}</p></div>
              <button onClick={() => setShowModal(false)} className="text-textSecondary hover:text-textPrimary text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Invoice Number</label>
                <input type="text" className="w-full p-2 bg-background rounded border border-border text-textPrimary" value={formData.invoiceNumber} onChange={e => setFormData(f => ({ ...f, invoiceNumber: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Customer <span className="text-red-500">*</span></label>
                <select className="w-full p-2 bg-background rounded border border-border text-textPrimary" value={formData.customerId} onChange={handleCustomerChange} required>
                  <option value="">-- Select a registered customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.companyName}</option>
                  ))}
                </select>
                {customers.length === 0 && <p className="text-xs text-red-500 mt-1">No customers found. Add customers on the Customers page first.</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Invoice Date</label>
                  <input type="date" className="w-full p-2 bg-background rounded border border-border text-textPrimary" value={formData.issueDate} onChange={e => setFormData(f => ({ ...f, issueDate: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date <span className="text-red-500">*</span></label>
                  <input type="date" className="w-full p-2 bg-background rounded border border-border text-textPrimary" value={formData.dueDate} onChange={e => setFormData(f => ({ ...f, dueDate: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (SGD, excl. GST) <span className="text-red-500">*</span></label>
                <input type="number" min="0" step="0.01" placeholder="e.g. 5000" className="w-full p-2 bg-background rounded border border-border text-textPrimary" value={formData.amount} onChange={e => setFormData(f => ({ ...f, amount: e.target.value }))} required />
                {formData.amount && (
                  <p className="text-xs text-textSecondary mt-1">GST (9%): ${(Number(formData.amount) * 0.09).toFixed(2)} &nbsp;|&nbsp; Total: ${(Number(formData.amount) * 1.09).toFixed(2)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input type="text" placeholder="e.g. Consulting Services" className="w-full p-2 bg-background rounded border border-border text-textPrimary" value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select className="w-full p-2 bg-background rounded border border-border text-textPrimary" value={formData.status} onChange={e => setFormData(f => ({ ...f, status: e.target.value }))}>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea rows={2} placeholder="Additional notes..." className="w-full p-2 bg-background rounded border border-border text-textPrimary" value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-border rounded hover:bg-background">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-primary rounded hover:opacity-80 font-medium disabled:opacity-50">{saving ? 'Saving...' : editingId ? 'Update Invoice' : 'Save Invoice'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map(toast => (
          <div key={toast.id} className={`px-4 py-3 rounded shadow ${toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'} text-white`}>{toast.message}</div>
        ))}
      </div>
    </div>
  );
}
