// ====================================================================
// Urban Furniture Accounting System — Sales & Invoices Controller JS
// Manages Sales Orders Creation, Dynamic Calculations, and Invoices
// ====================================================================

let loadedProductsCache = [];

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');

  // Auth Protection: Redirect to login if token is missing
  if (!token) {
    window.location.href = '../index.html';
    return;
  }

  // Populate User Profile in Top Navbar
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      const navUserName = document.getElementById('navUserName');
      const navUserEmail = document.getElementById('navUserEmail');
      if (navUserName && user.name) navUserName.textContent = user.name;
      if (navUserEmail && user.email) navUserEmail.textContent = user.email;
    } catch (e) {
      console.warn('Failed to parse user cache:', e);
    }
  }

  // 1. Sales Orders Page (sales-orders.html)
  const salesOrdersTableBody = document.getElementById('salesOrdersTableBody');
  if (salesOrdersTableBody) {
    fetchAndRenderSalesOrders(token);
    loadModalDropdowns(token);

    const soForm = document.getElementById('salesOrderForm');
    if (soForm) {
      soForm.addEventListener('submit', (e) => handleSalesOrderCreate(e, token));
    }
  }

  // 2. Customer Invoices Page (customer-invoices.html)
  const customerInvoicesTableBody = document.getElementById('customerInvoicesTableBody');
  if (customerInvoicesTableBody) {
    fetchAndRenderCustomerInvoices(token);
  }
});

/**
 * Fetch all Sales Orders from GET /api/sales-orders
 * @param {string} token 
 */
async function fetchAndRenderSalesOrders(token) {
  try {
    const response = await fetch('/api/sales-orders', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 401 || response.status === 403) {
      handleAuthFailure();
      return;
    }

    const result = await response.json();
    if (!response.ok || !result.success) {
      console.error('Failed to fetch sales orders:', result.message);
      return;
    }

    renderSalesOrdersTable(result.data || []);
  } catch (err) {
    console.error('Error fetching sales orders:', err);
  }
}

/**
 * Render Sales Orders Table Rows
 * @param {Array} orders 
 */
function renderSalesOrdersTable(orders) {
  const tbody = document.getElementById('salesOrdersTableBody');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted py-4">
          No Sales Orders found. Click "Create Sales Order" to start a new sale.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = orders.map(so => {
    let orderDate = '--';
    if (so.order_date) {
      orderDate = new Date(so.order_date).toISOString().split('T')[0];
    }

    const totalAmount = formatINR(parseFloat(so.total_amount || 0));

    // Status Badges
    let soStatusClass = 'badge-confirmed';
    if (so.status === 'invoiced' || so.status === 'paid') soStatusClass = 'badge-paid';
    if (so.status === 'draft') soStatusClass = 'badge-draft';

    let invStatusClass = 'badge-unpaid';
    let invStatusLabel = (so.invoice_status || 'Unpaid').toUpperCase();
    if ((so.invoice_status || '').toLowerCase() === 'paid') {
      invStatusClass = 'badge-paid';
      invStatusLabel = 'Paid';
    } else if ((so.invoice_status || '').toLowerCase() === 'partially_paid') {
      invStatusClass = 'badge-confirmed';
      invStatusLabel = 'Partially Paid';
    } else {
      invStatusClass = 'badge-unpaid';
      invStatusLabel = 'Unpaid';
    }

    return `
      <tr>
        <td class="fw-bold text-primary">${escapeHtml(so.order_number)}</td>
        <td>${escapeHtml(so.contact_name || 'N/A')}</td>
        <td>${orderDate}</td>
        <td><span class="badge-status ${soStatusClass}">${escapeHtml(so.status || 'Confirmed')}</span></td>
        <td class="fw-semibold">${escapeHtml(so.invoice_number || 'N/A')}</td>
        <td><span class="badge-status ${invStatusClass}">${invStatusLabel}</span></td>
        <td class="text-end fw-bold">${totalAmount}</td>
      </tr>
    `;
  }).join('');
}

/**
 * Load Customers and Products Dropdowns for the Sales Order Creation Modal
 * @param {string} token 
 */
async function loadModalDropdowns(token) {
  const customerSelect = document.getElementById('soCustomerSelect');
  const productSelect = document.getElementById('soProductSelect');

  try {
    // 1. Load Contacts
    const contactsRes = await fetch('/api/contacts', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (contactsRes.ok) {
      const contactsData = await contactsRes.json();
      if (contactsData.success && customerSelect) {
        const customers = (contactsData.data || []).filter(c => c.type === 'customer' || c.type === 'both' || true);
        customerSelect.innerHTML = customers.map(c => 
          `<option value="${c.id}">${escapeHtml(c.name)} (${c.type.toUpperCase()})</option>`
        ).join('');
      }
    }

    // 2. Load Products
    const productsRes = await fetch('/api/products', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (productsRes.ok) {
      const productsData = await productsRes.json();
      if (productsData.success && productSelect) {
        loadedProductsCache = productsData.data || [];
        productSelect.innerHTML = loadedProductsCache.map(p => 
          `<option value="${p.id}">${escapeHtml(p.name)} (${formatINR(parseFloat(p.sales_price))})</option>`
        ).join('');

        // Set initial price and trigger calculation
        onProductSelected();
      }
    }
  } catch (err) {
    console.error('Error loading dropdown options for Sales Order:', err);
  }

  // Event Listeners for Dynamic Subtotal/Tax/Total Calculations
  if (productSelect) productSelect.addEventListener('change', onProductSelected);
  const qtyInput = document.getElementById('soQuantityInput');
  const priceInput = document.getElementById('soPriceInput');
  if (qtyInput) qtyInput.addEventListener('input', calculateOrderTotals);
  if (priceInput) priceInput.addEventListener('input', calculateOrderTotals);
}

function onProductSelected() {
  const productSelect = document.getElementById('soProductSelect');
  const priceInput = document.getElementById('soPriceInput');
  if (!productSelect || !priceInput) return;

  const selectedId = parseInt(productSelect.value);
  const prod = loadedProductsCache.find(p => p.id === selectedId);
  if (prod) {
    priceInput.value = parseFloat(prod.sales_price || 0).toFixed(2);
  }
  calculateOrderTotals();
}

function calculateOrderTotals() {
  const qtyInput = document.getElementById('soQuantityInput');
  const priceInput = document.getElementById('soPriceInput');

  const qty = parseInt(qtyInput ? qtyInput.value || 1 : 1);
  const unitPrice = parseFloat(priceInput ? priceInput.value || 0 : 0);

  const subtotal = qty * unitPrice;
  const tax = subtotal * 0.18; // 18% GST
  const total = subtotal + tax;

  const subtotalEl = document.getElementById('summarySubtotal');
  const taxEl = document.getElementById('summaryTax');
  const totalEl = document.getElementById('summaryTotal');

  if (subtotalEl) subtotalEl.textContent = formatINR(subtotal);
  if (taxEl) taxEl.textContent = formatINR(tax);
  if (totalEl) totalEl.textContent = formatINR(total);
}

/**
 * Handle Sales Order Creation Submit
 * @param {Event} e 
 * @param {string} token 
 */
async function handleSalesOrderCreate(e, token) {
  e.preventDefault();

  const customerSelect = document.getElementById('soCustomerSelect');
  const productSelect = document.getElementById('soProductSelect');
  const qtyInput = document.getElementById('soQuantityInput');
  const priceInput = document.getElementById('soPriceInput');
  const alertEl = document.getElementById('soModalAlert');

  if (!customerSelect || !customerSelect.value) {
    showUIError(alertEl, 'Please select a customer');
    return;
  }
  if (!productSelect || !productSelect.value) {
    showUIError(alertEl, 'Please select a product');
    return;
  }

  const payload = {
    contact_id: parseInt(customerSelect.value),
    items: [
      {
        product_id: parseInt(productSelect.value),
        quantity: parseInt(qtyInput.value || 1),
        unit_price: parseFloat(priceInput.value || 0),
      }
    ]
  };

  try {
    const response = await fetch('/api/sales-orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 401 || response.status === 403) {
      handleAuthFailure();
      return;
    }

    const result = await response.json();

    if (!response.ok || !result.success) {
      showUIError(alertEl, result.message || 'Failed to create sales order');
      return;
    }

    // Success UI Feedback
    if (alertEl) {
      alertEl.className = 'alert alert-success mt-2 mb-3';
      alertEl.textContent = `Sales Order (${result.data.sales_order.order_number}) & Invoice (${result.data.invoice.invoice_number}) generated successfully!`;
      alertEl.classList.remove('d-none');
    }

    // Close Modal and Refresh Table
    setTimeout(() => {
      const modalElement = document.getElementById('newSalesOrderModal');
      if (modalElement && window.bootstrap) {
        const bsModal = window.bootstrap.Modal.getInstance(modalElement);
        if (bsModal) bsModal.hide();
      }
      fetchAndRenderSalesOrders(token);
    }, 1200);

  } catch (err) {
    console.error('Error creating sales order:', err);
    showUIError(alertEl, 'Network or server error while creating sales order.');
  }
}

/**
 * Fetch Customer Invoices from GET /api/invoices
 * @param {string} token 
 */
async function fetchAndRenderCustomerInvoices(token) {
  try {
    const response = await fetch('/api/invoices', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 401 || response.status === 403) {
      handleAuthFailure();
      return;
    }

    const result = await response.json();
    if (!response.ok || !result.success) {
      console.error('Failed to fetch invoices:', result.message);
      return;
    }

    renderInvoicesTable(result.data || []);
  } catch (err) {
    console.error('Error fetching invoices:', err);
  }
}

/**
 * Render Customer Invoices Table Rows
 * @param {Array} invoices 
 */
function renderInvoicesTable(invoices) {
  const tbody = document.getElementById('customerInvoicesTableBody');
  if (!tbody) return;

  if (invoices.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted py-4">
          No customer invoices generated yet.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = invoices.map(inv => {
    let dueDate = '--';
    if (inv.due_date) {
      dueDate = new Date(inv.due_date).toISOString().split('T')[0];
    }

    const totalAmount = parseFloat(inv.total_amount || 0);
    const paidAmount = parseFloat(inv.paid_amount || 0);
    const balanceDue = totalAmount - paidAmount;

    let statusClass = 'badge-unpaid';
    let statusLabel = (inv.status || 'UNPAID').toUpperCase();

    const statusLower = (inv.status || '').toLowerCase();
    if (statusLower === 'paid') {
      statusClass = 'badge-paid';
      statusLabel = 'Paid';
    } else if (statusLower === 'partially_paid') {
      statusClass = 'badge-confirmed';
      statusLabel = 'Partially Paid';
    } else if (statusLower === 'unpaid') {
      statusClass = 'badge-unpaid';
      statusLabel = 'Unpaid';
    }

    return `
      <tr>
        <td class="fw-bold text-primary">${escapeHtml(inv.invoice_number)}</td>
        <td class="fw-semibold">${escapeHtml(inv.order_number || 'N/A')}</td>
        <td>${escapeHtml(inv.contact_name || 'N/A')}</td>
        <td>${dueDate}</td>
        <td><span class="badge-status ${statusClass}">${statusLabel}</span></td>
        <td class="text-end fw-bold">${formatINR(totalAmount)}</td>
        <td class="text-end text-success fw-bold">${formatINR(paidAmount)}</td>
        <td class="text-end ${balanceDue > 0 ? 'text-danger fw-bold' : 'text-muted'}">${formatINR(balanceDue)}</td>
      </tr>
    `;
  }).join('');
}

function showUIError(alertEl, message) {
  if (alertEl) {
    alertEl.className = 'alert alert-danger mt-2 mb-3';
    alertEl.textContent = message;
    alertEl.classList.remove('d-none');
  }
}

function handleAuthFailure() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '../index.html';
}

function formatINR(amount) {
  return '₹' + amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
