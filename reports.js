const API_BASE = window.location.port === '1573' ? '' : 'http://localhost:1573';

const reportState = {
  invoices: [],
  payments: []
};

const chartState = {
  ageing: null,
  monthly: null
};

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(amount) {
  return `$${toNumber(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = toDate(value);
  return date ? date.toISOString().slice(0, 10) : '-';
}

function getDaysOverdue(dueDate) {
  const due = toDate(dueDate);
  if (!due) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - due.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
}

function getAgeingBucket(daysOverdue) {
  if (daysOverdue === 0) return 'current';
  if (daysOverdue <= 60) return 'days31to60';
  if (daysOverdue <= 90) return 'days61to90';
  return 'over90';
}

function getPriority(daysOverdue) {
  if (daysOverdue >= 90) return 'Critical';
  if (daysOverdue >= 61) return 'High';
  if (daysOverdue >= 31) return 'Medium';
  return 'Low';
}

function normalizeInvoice(invoice) {
  return {
    invoiceNo: invoice.invoiceNumber || invoice.invoiceNo || '-',
    customerName: invoice.customerName || invoice.customer || 'Unknown',
    dueDate: invoice.dueDate,
    issueDate: invoice.issueDate,
    amount: toNumber(invoice.amount || invoice.total),
    paid: toNumber(invoice.paid),
    status: (invoice.status || 'pending').toLowerCase()
  };
}

function parseDateRange() {
  const input = document.getElementById('dateRange');
  if (!input) return { start: null, end: null };

  const value = (input.value || '').trim();
  if (!value) return { start: null, end: null };

  const parts = value.split(/\s*(?:to|-|–)\s*/i);
  if (parts.length < 2) return { start: null, end: null };

  const start = toDate(parts[0]);
  const end = toDate(parts[1]);
  if (!start || !end) return { start: null, end: null };

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function passesFilters(invoice) {
  const customerFilter = document.getElementById('customerFilter');
  const selectedCustomer = customerFilter ? customerFilter.value : '';
  if (selectedCustomer && invoice.customerName !== selectedCustomer) {
    return false;
  }

  const range = parseDateRange();
  if (!range.start || !range.end) {
    return true;
  }

  const dueDate = toDate(invoice.dueDate);
  if (!dueDate) {
    return false;
  }

  return dueDate >= range.start && dueDate <= range.end;
}

function populateCustomerFilter(invoices) {
  const filter = document.getElementById('customerFilter');
  if (!filter) return;

  const current = filter.value;
  const names = Array.from(new Set(invoices.map((item) => item.customerName))).sort();

  filter.innerHTML = '<option value="">All customers</option>';
  names.forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    filter.appendChild(option);
  });

  if (current && names.includes(current)) {
    filter.value = current;
  }
}

function renderCustomerTable(customerData) {
  const table = document.getElementById('customerReportTable');
  if (!table) return;

  const rows = Object.entries(customerData)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([customer, data]) => `
      <tr>
        <td>${customer}</td>
        <td>${formatMoney(data.total)}</td>
        <td>${formatMoney(data.current)}</td>
        <td>${formatMoney(data.days31to60)}</td>
        <td>${formatMoney(data.days61to90)}</td>
        <td>${formatMoney(data.over90)}</td>
      </tr>
    `)
    .join('');

  table.innerHTML = rows || '<tr><td colspan="6">No outstanding receivables found.</td></tr>';
}

function renderInvoicesTable(invoices) {
  const table = document.getElementById('overdueTable');
  if (!table) return;

  const statusFilter = document.getElementById('statusFilter');
  const selectedStatus = statusFilter ? statusFilter.value : 'partial';

  const filtered = invoices.filter(inv => (inv.status || '').toLowerCase() === selectedStatus.toLowerCase());

  const rows = filtered
    .sort((a, b) => new Date(b.dueDate || 0) - new Date(a.dueDate || 0))
    .map((invoice) => `
      <tr>
        <td>${invoice.invoiceNo}</td>
        <td>${invoice.customerName}</td>
        <td>${formatDate(invoice.dueDate)}</td>
        <td>${formatMoney(invoice.amount)}</td>
        <td>${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</td>
      </tr>
    `)
    .join('');

  table.innerHTML = rows || '<tr><td colspan="5">No invoices found.</td></tr>';
}

function renderTopCustomers(customerData) {
  const wrapper = document.getElementById('topCustomers');
  if (!wrapper) return;

  const rows = Object.entries(customerData)
    .map(([customer, data]) => ({ customer, total: data.total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  if (rows.length === 0) {
    wrapper.innerHTML = '<p>No outstanding balances.</p>';
    return;
  }

  const max = rows[0].total || 1;
  wrapper.innerHTML = rows.map((row) => {
    const width = Math.max(8, Math.round((row.total / max) * 100));
    return `
      <div class="top-customer">
        <div>
          <strong>${row.customer}</strong>
          <span>${formatMoney(row.total)}</span>
        </div>
        <div class="progress-bar"><div style="width: ${width}%"></div></div>
      </div>
    `;
  }).join('');
}

function renderMonthlyCollection(payments) {
  const canvas = document.getElementById('monthlyCollectionChart');
  if (!canvas) return;

  const points = [];
  const labels = [];
  const now = new Date();

  for (let i = 5; i >= 0; i -= 1) {
    const marker = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(marker.toLocaleString(undefined, { month: 'short' }));
    points.push({ key: `${marker.getFullYear()}-${marker.getMonth()}` , total: 0 });
  }

  payments.forEach((payment) => {
    const paymentDate = toDate(payment.paymentDate || payment.date);
    if (!paymentDate) return;

    const key = `${paymentDate.getFullYear()}-${paymentDate.getMonth()}`;
    const slot = points.find((point) => point.key === key);
    if (slot) {
      slot.total += toNumber(payment.amount);
    }
  });

  const values = points.map((point) => Number(point.total.toFixed(2)));

  if (chartState.monthly) {
    chartState.monthly.destroy();
  }

  if (!window.Chart) {
    const fallback = document.createElement('div');
    fallback.className = 'line-chart-placeholder';
    fallback.textContent = labels.map((label, idx) => `${label}: ${formatMoney(values[idx])}`).join(' | ');
    canvas.replaceWith(fallback);
    return;
  }

  chartState.monthly = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Collections',
        data: values,
        borderRadius: 8,
        backgroundColor: 'rgba(20, 184, 166, 0.75)',
        borderColor: 'rgba(56, 189, 248, 0.95)',
        borderWidth: 1.5,
        hoverBackgroundColor: 'rgba(56, 189, 248, 0.9)',
        maxBarThickness: 46
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              return `Collected: ${formatMoney(context.parsed.y)}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#94A3B8' },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#94A3B8',
            callback(value) {
              return `$${Number(value).toLocaleString()}`;
            }
          },
          grid: { color: 'rgba(148, 163, 184, 0.2)' }
        }
      }
    }
  });
}

function renderAgeingDistribution(invoices) {
  const canvas = document.getElementById('ageingDistributionChart');
  const legend = document.getElementById('ageingLegend');
  if (!canvas || !legend) return;

  const totals = {
    current: 0,
    days31to60: 0,
    days61to90: 0,
    over90: 0
  };

  invoices.forEach((invoice) => {
    const outstanding = Math.max(0, toNumber(invoice.amount) - toNumber(invoice.paid));
    if (outstanding <= 0) return;
    const bucket = getAgeingBucket(getDaysOverdue(invoice.dueDate));
    totals[bucket] += outstanding;
  });

  const values = [totals.current, totals.days31to60, totals.days61to90, totals.over90];
  const labels = ['Current', '31-60d', '61-90d', '90+d'];
  const grandTotal = values.reduce((sum, value) => sum + value, 0);

  const percentages = values.map((value) => (grandTotal > 0 ? (value / grandTotal) * 100 : 0));
  legend.innerHTML = [
    `<span><span class="legend-swatch current"></span>Current ${percentages[0].toFixed(0)}%</span>`,
    `<span><span class="legend-swatch days30"></span>31-60d ${percentages[1].toFixed(0)}%</span>`,
    `<span><span class="legend-swatch days60"></span>61-90d ${percentages[2].toFixed(0)}%</span>`,
    `<span><span class="legend-swatch days90"></span>90+d ${percentages[3].toFixed(0)}%</span>`
  ].join('');

  if (chartState.ageing) {
    chartState.ageing.destroy();
  }

  if (!window.Chart) {
    canvas.parentElement.innerHTML = `<div class="line-chart-placeholder">${labels.map((label, index) => `${label}: ${formatMoney(values[index])}`).join(' | ')}</div>`;
    return;
  }

  chartState.ageing = new Chart(canvas, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: [
          'rgba(56, 189, 248, 0.85)',
          'rgba(20, 184, 166, 0.85)',
          'rgba(249, 115, 22, 0.85)',
          'rgba(240, 67, 63, 0.85)'
        ],
        borderColor: 'rgba(15, 23, 42, 0.95)',
        borderWidth: 3,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              const value = context.parsed || 0;
              const share = grandTotal > 0 ? ((value / grandTotal) * 100).toFixed(1) : '0.0';
              return `${context.label}: ${formatMoney(value)} (${share}%)`;
            }
          }
        }
      }
    }
  });
}

function renderOutstandingTrend(invoices) {
  const element = document.getElementById('outstandingTrend');
  if (!element) return;

  const monthly = {};
  invoices.forEach((invoice) => {
    const dueDate = toDate(invoice.dueDate);
    const outstanding = Math.max(0, invoice.amount - invoice.paid);
    if (!dueDate || outstanding <= 0) return;

    const key = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;
    monthly[key] = (monthly[key] || 0) + outstanding;
  });

  const keys = Object.keys(monthly).sort().slice(-6);
  if (keys.length === 0) {
    element.textContent = 'No outstanding trend data available.';
    return;
  }

  element.textContent = keys.map((key) => `${key}: ${formatMoney(monthly[key])}`).join(' | ');
}

function renderCollectionPerformance(invoices, payments) {
  const element = document.getElementById('collectionPerformance');
  if (!element) return;

  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter((invoice) => invoice.paid >= invoice.amount && invoice.amount > 0).length;
  const paidRatio = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0;

  const totalBilled = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalCollected = payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0);
  const cashRatio = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

  element.textContent = `Paid invoices: ${paidRatio.toFixed(1)}% | Cash collection: ${cashRatio.toFixed(1)}%`;
}

function renderAiSummary(overdueAmount, overdueCount) {
  if (overdueCount > 0) {
    setText('aiSummary', `There are ${overdueCount} overdue invoices totaling ${formatMoney(overdueAmount)}. Prioritize critical and high overdue accounts.`);
  } else {
    setText('aiSummary', 'No overdue invoices found. Receivables are in healthy condition.');
  }
}

function renderReport() {
  const filteredInvoices = reportState.invoices.filter(passesFilters);
  const totalCollected = reportState.payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0);

  let totalOutstanding = 0;
  let overdueAmount = 0;
  const customerData = {};
  const overdueInvoices = [];

  filteredInvoices.forEach((invoice) => {
    const outstanding = Math.max(0, invoice.amount - invoice.paid);
    const daysOverdue = getDaysOverdue(invoice.dueDate);
    const bucket = getAgeingBucket(daysOverdue);

    totalOutstanding += outstanding;
    
    // Track overdue invoices for AI summary
    const statusLower = (invoice.status || '').toLowerCase();
    if (statusLower === 'partial' || statusLower === 'overdue') {
      overdueAmount += outstanding;
      overdueInvoices.push({
        invoiceNo: invoice.invoiceNo,
        customerName: invoice.customerName,
        outstanding,
        daysOverdue
      });
    }

    if (outstanding > 0) {
      if (!customerData[invoice.customerName]) {
        customerData[invoice.customerName] = {
          total: 0,
          current: 0,
          days31to60: 0,
          days61to90: 0,
          over90: 0
        };
      }

      customerData[invoice.customerName].total += outstanding;
      customerData[invoice.customerName][bucket] += outstanding;
    }
  });

  const efficiency = totalOutstanding + totalCollected > 0
    ? (totalCollected / (totalOutstanding + totalCollected)) * 100
    : 0;

  setText('totalOutstanding', formatMoney(totalOutstanding));
  setText('currentAmount', formatMoney(totalCollected));
  setText('overdueAmount', formatMoney(overdueAmount));
  setText('collectionEfficiency', `${efficiency.toFixed(1)}%`);

  renderCustomerTable(customerData);
  renderInvoicesTable(filteredInvoices);
  renderTopCustomers(customerData);
  renderAgeingDistribution(filteredInvoices);
  renderMonthlyCollection(reportState.payments);
  renderOutstandingTrend(filteredInvoices);
  renderCollectionPerformance(filteredInvoices, reportState.payments);
  renderAiSummary(overdueAmount, overdueInvoices.length);
}

function showLoadError(message) {
  setText('aiSummary', message);
  const customerTable = document.getElementById('customerReportTable');
  const overdueTable = document.getElementById('overdueTable');
  if (customerTable) {
    customerTable.innerHTML = '<tr><td colspan="6">Unable to load report data.</td></tr>';
  }
  if (overdueTable) {
    overdueTable.innerHTML = '<tr><td colspan="6">Unable to load report data.</td></tr>';
  }
  const topCustomers = document.getElementById('topCustomers');
  if (topCustomers) {
    topCustomers.innerHTML = '<p>Unable to load customer balances.</p>';
  }
  const monthlyChart = document.getElementById('monthlyCollectionChart');
  if (monthlyChart) {
    const parent = monthlyChart.parentElement;
    if (parent) {
      parent.innerHTML = '<div class="line-chart-placeholder">No chart data available.</div>';
    }
  }
  const ageingChart = document.getElementById('ageingDistributionChart');
  if (ageingChart) {
    const parent = ageingChart.parentElement;
    if (parent) {
      parent.innerHTML = '<div class="line-chart-placeholder">No chart data available.</div>';
    }
  }
  setText('outstandingTrend', 'Unable to load trend data.');
  setText('collectionPerformance', 'Unable to load performance data.');
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

async function loadReportData() {
  try {
    const [invoicesRaw, paymentsRaw] = await Promise.all([
      fetchJson(`${API_BASE}/api/invoices`),
      fetchJson(`${API_BASE}/api/payments`)
    ]);

    reportState.invoices = (Array.isArray(invoicesRaw) ? invoicesRaw : []).map(normalizeInvoice);
    reportState.payments = Array.isArray(paymentsRaw) ? paymentsRaw : [];

    populateCustomerFilter(reportState.invoices);
    renderReport();
  } catch (error) {
    console.error(error);
    showLoadError('Unable to load report data from database API.');
  }
}

function bindEvents() {
  const button = document.getElementById('generateReportBtn');
  const customerFilter = document.getElementById('customerFilter');
  const dateRange = document.getElementById('dateRange');
  const statusFilter = document.getElementById('statusFilter');

  if (button) button.addEventListener('click', renderReport);
  if (customerFilter) customerFilter.addEventListener('change', renderReport);
  if (dateRange) dateRange.addEventListener('change', renderReport);
  if (statusFilter) statusFilter.addEventListener('change', renderReport);
}

bindEvents();
loadReportData();
