import React, { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:1573';

const initialCustomerData = [
  {
    company: 'Aurora Logistics',
    contact: 'Samantha Lee',
    email: 'samantha@auroralogistics.com',
    phone: '+65 9123 4567',
    credit: '$78,000',
    terms: 'Net 30',
    balance: '$24,500',
    status: 'active',
    address: '18 Shenton Way, Singapore'
  },
  {
    company: 'Vertex Manufacturing',
    contact: 'James Tan',
    email: 'james.tan@vertex.com.sg',
    phone: '+65 9234 5567',
    credit: '$120,000',
    terms: 'Net 45',
    balance: '$62,800',
    status: 'on-hold',
    address: '88 Market Street, Singapore'
  },
  {
    company: 'BlueHarbor Ltd',
    contact: 'Fiona Chow',
    email: 'fiona@blueharbor.co',
    phone: '+65 9345 6789',
    credit: '$92,000',
    terms: 'Net 30',
    balance: '$8,400',
    status: 'active',
    address: '32 Marina Boulevard, Singapore'
  },
  {
    company: 'Nimbus Retail',
    contact: 'Daniel Wong',
    email: 'daniel@nimbusretail.com',
    phone: '+65 9456 7890',
    credit: '$65,000',
    terms: 'Net 60',
    balance: '$18,300',
    status: 'overdue',
    address: '5 Orchard Road, Singapore'
  },
  {
    company: 'Cedar Financial',
    contact: 'Maya Patel',
    email: 'maya.patel@cedarfin.com',
    phone: '+65 9567 8901',
    credit: '$142,000',
    terms: 'Net 30',
    balance: '$4,200',
    status: 'active',
    address: '122 Cecil Street, Singapore'
  }
];

export default function Customers() {
  const [customers, setCustomers] = useState(initialCustomerData);
  const [activeStatus, setActiveStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    company: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    credit: '',
    terms: '',
    status: 'active'
  });

  // Fetch customers from backend on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/customers`);
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map(c => ({
            id: c.id,
            company: c.companyName,
            contact: c.contactPerson,
            email: c.email,
            phone: c.phone,
            address: c.address,
            credit: `$${Number(c.creditLimit).toLocaleString()}`,
            terms: c.paymentTerms,
            balance: '$0',
            status: c.status || 'active'
          }));
          setCustomers(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch customers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts(t => t.filter(toast => toast.id !== id));
    }, 3500);
  };

  const getFilteredCustomers = () => {
    return customers.filter(customer => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = query === '' || [customer.company, customer.contact, customer.email].some(field => field.toLowerCase().includes(query));
      const matchesStatus = activeStatus === 'all' || customer.status === activeStatus;
      return matchesSearch && matchesStatus;
    });
  };

  const filteredCustomers = getFilteredCustomers();

  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    creditExposure: customers.reduce((sum, c) => sum + Number(c.credit.replace(/[,$]/g, '')), 0)
  };

  const handleOpenModal = (index = null) => {
    if (index !== null) {
      const customer = customers[index];
      setFormData({
        company: customer.company,
        contact: customer.contact,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        credit: customer.credit,
        terms: customer.terms,
        status: customer.status
      });
      setEditIndex(index);
    } else {
      setFormData({ company: '', contact: '', email: '', phone: '', address: '', credit: '', terms: '', status: 'active' });
      setEditIndex(null);
    }
    setShowModal(true);
  };

  const handleSaveCustomer = async () => {
    if (!formData.company || !formData.contact || !formData.email) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    try {
      if (editIndex !== null) {
        // Update existing customer
        const customer = customers[editIndex];
        const res = await fetch(`${API_BASE}/api/customers/${customer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: formData.company,
            contactPerson: formData.contact,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            creditLimit: Number(formData.credit.replace(/[,$]/g, '')),
            paymentTerms: formData.terms,
            status: formData.status || 'active'
          })
        });
        if (!res.ok) throw new Error('Failed to update customer');
        
        const updated = [...customers];
        updated[editIndex] = { ...formData, status: updated[editIndex].status };
        setCustomers(updated);
        showToast('Customer updated successfully', 'success');
      } else {
        // Create new customer
        const res = await fetch(`${API_BASE}/api/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: formData.company,
            contactPerson: formData.contact,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            creditLimit: Number(formData.credit.replace(/[,$]/g, '')),
            paymentTerms: formData.terms,
            status: 'active'
          })
        });
        
        const responseData = await res.json();
        if (!res.ok) throw new Error(responseData.error || 'Failed to add customer');
        
        const newCustomer = responseData;
        setCustomers([{ 
          id: newCustomer.id,
          company: formData.company, 
          contact: formData.contact, 
          email: formData.email, 
          phone: formData.phone, 
          address: formData.address, 
          credit: formData.credit, 
          terms: formData.terms, 
          status: 'active', 
          balance: '$0' 
        }, ...customers]);
        showToast('Customer added successfully', 'success');
      }
      setShowModal(false);
    } catch (err) {
      showToast(err.message || 'Failed to save customer', 'error');
    }
  };

  const handleDeleteCustomer = async () => {
    if (editIndex !== null) {
      try {
        const customer = customers[editIndex];
        const res = await fetch(`${API_BASE}/api/customers/${customer.id}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete customer');
        
        setCustomers(customers.filter((_, i) => i !== editIndex));
        showToast('Customer deleted successfully', 'success');
      } catch (err) {
        showToast(err.message || 'Failed to delete customer', 'error');
      }
    }
    setShowDeleteModal(false);
    setEditIndex(null);
  };

  const getStatusColor = (status) => {
    if (status === 'active') return 'bg-green-100 text-green-800';
    if (status === 'on-hold') return 'bg-yellow-100 text-yellow-800';
    if (status === 'overdue') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    return status.replace('-', ' ').charAt(0).toUpperCase() + status.replace('-', ' ').slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-6 rounded border border-border">
          <p className="text-sm text-textSecondary">Total Customers</p>
          <p className="text-3xl font-bold mt-2">{stats.total}</p>
        </div>
        <div className="bg-card p-6 rounded border border-border">
          <p className="text-sm text-textSecondary">Active Customers</p>
          <p className="text-3xl font-bold mt-2">{stats.active}</p>
        </div>
        <div className="bg-card p-6 rounded border border-border">
          <p className="text-sm text-textSecondary">Total Credit Exposure</p>
          <p className="text-3xl font-bold mt-2">${stats.creditExposure.toLocaleString()}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-card p-4 rounded border border-border flex gap-4">
        <input
          type="search"
          placeholder="Search customers, company or email"
          className="flex-1 p-2 bg-background rounded border border-border text-textPrimary"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="p-2 bg-background rounded border border-border text-textPrimary"
          value={activeStatus}
          onChange={(e) => setActiveStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="on-hold">On Hold</option>
          <option value="overdue">Overdue</option>
        </select>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-primary rounded hover:opacity-80 font-medium"
        >
          Add Customer
        </button>
      </div>

      {/* Customers Table */}
      <div className="bg-card rounded border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold">Customer Directory</h2>
          <p className="text-sm text-textSecondary mt-1">Track credit limits, payment terms and outstanding balances</p>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-textSecondary">
            No customers match your search
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="text-left p-4 font-semibold text-textPrimary">Company Name</th>
                  <th className="text-left p-4 font-semibold text-textPrimary">Contact</th>
                  <th className="text-left p-4 font-semibold text-textPrimary">Email</th>
                  <th className="text-left p-4 font-semibold text-textPrimary">Phone</th>
                  <th className="text-left p-4 font-semibold text-textPrimary">Credit Limit</th>
                  <th className="text-left p-4 font-semibold text-textPrimary">Terms</th>
                  <th className="text-left p-4 font-semibold text-textPrimary">Balance</th>
                  <th className="text-left p-4 font-semibold text-textPrimary">Status</th>
                  <th className="text-left p-4 font-semibold text-textPrimary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer, index) => (
                  <tr key={index} className="border-b border-border hover:bg-background">
                    <td className="p-4">{customer.company}</td>
                    <td className="p-4">{customer.contact}</td>
                    <td className="p-4">{customer.email}</td>
                    <td className="p-4">{customer.phone}</td>
                    <td className="p-4">{customer.credit}</td>
                    <td className="p-4">{customer.terms}</td>
                    <td className="p-4">{customer.balance}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(customer.status)}`}>
                        {getStatusLabel(customer.status)}
                      </span>
                    </td>
                    <td className="p-4 space-x-2">
                      <button
                        onClick={() => handleOpenModal(index)}
                        className="px-3 py-1 text-sm bg-primary rounded hover:opacity-80"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setEditIndex(index);
                          setShowDeleteModal(true);
                        }}
                        className="px-3 py-1 text-sm bg-red-600 rounded hover:opacity-80"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-border text-sm text-textSecondary">
          Showing {filteredCustomers.length} of {customers.length} customers
        </div>
      </div>

      {/* Add/Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded border border-border max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">{editIndex !== null ? 'Edit Customer' : 'Add Customer'}</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Company Name"
                className="w-full p-2 bg-background rounded border border-border text-textPrimary"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
              <input
                type="text"
                placeholder="Contact Person"
                className="w-full p-2 bg-background rounded border border-border text-textPrimary"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full p-2 bg-background rounded border border-border text-textPrimary"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <input
                type="tel"
                placeholder="Phone"
                className="w-full p-2 bg-background rounded border border-border text-textPrimary"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <textarea
                placeholder="Address"
                className="w-full p-2 bg-background rounded border border-border text-textPrimary"
                rows="3"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              <input
                type="text"
                placeholder="Credit Limit"
                className="w-full p-2 bg-background rounded border border-border text-textPrimary"
                value={formData.credit}
                onChange={(e) => setFormData({ ...formData, credit: e.target.value })}
              />
              <input
                type="text"
                placeholder="Payment Terms"
                className="w-full p-2 bg-background rounded border border-border text-textPrimary"
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              />
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-background rounded border border-border hover:bg-opacity-80"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomer}
                className="flex-1 px-4 py-2 bg-primary rounded hover:opacity-80 font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded border border-border max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-2">Delete Customer</h3>
            <p className="text-textSecondary mb-6">Are you sure? This action cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-background rounded border border-border hover:bg-opacity-80"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCustomer}
                className="flex-1 px-4 py-2 bg-red-600 rounded hover:opacity-80 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
  );
}
