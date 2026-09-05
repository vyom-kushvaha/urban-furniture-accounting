// ====================================================================
// Urban Furniture Accounting System — Purchase & Vendor Bills Controller JS
// Manages Purchase Orders Requisitions & Vendor Bills Payables
// ====================================================================

let loadedProductsCache = [];

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '../index.html';
    return;
  }

  // Navbar user details
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      const navUserName = document.getElementById('navUserName');
      const navUserEmail = document.getElementById('navUserEmail');
      if (navUserName && user.name) navUserName.textContent = user.name;
      if (navUserEmail && user.email) navUserEmail.textContent = user.email;
    } catch (e) {
      console.warn(e);
    }
  }

  // 1. Purchase Orders Page (purchase-orders.html)
  const purchaseOrdersTableBody = document.getElementById('purchaseOrdersTableBody');
  if (purchaseOrdersTableBody) {
    fetchAndRenderPurchaseOrders(token);
    loadPurchaseModalDropdowns(token);

    const poForm = document.getElementById('purchaseOrderForm');
    if (poForm) {
      poForm.addEventListener('submit', (e) => handlePurchaseOrderCreate(e, token));
    }
  }

  // 2. Vendor Bills Page (vendor-bills.html)
  const vendorBillsTableBody = document.getElementById('vendorBillsTableBody');
  if (vendorBillsTableBody) {
    fetchAndRenderVendorBills(token);
  }
});

async function fetchAndRenderPurchaseOrders(token) {
  try {
    const response = await fetch('/api/purchase-orders', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 401 || response.status === 403) {
      handleAuthFailure();
      return;
    }

    const result = await response.json();
    if (!response.ok || !result.success) return;

    renderPurchaseOrdersTable(result.data || []);
  } catch (err) {
    console.error('Error fetching purchase orders:', err);
  }
}

function renderPurchaseOrdersTable(orders) {
  const tbody = document.getElementById('purchaseOrdersTableBody');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted py-4">No Purchase Orders recorded yet.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = orders.map(po => {
    let poDate = '--';
    if (po.created_at) {
      poDate = new Date(po.created_at).toISOString().split('T')[0];
    }
    const totalAmount = '₹' + parseFloat(po.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

    return `
      <tr>
        <td class="fw-bold text-primary">${escapeHtml(po.po_number)}</td>
        <td>${escapeHtml(po.vendor_name || 'N/A')}</td>
        <td>${poDate}</td>
        <td><span class="badge-status badge-confirmed">Confirmed</span></td>
        <td class="fw-semibold">${escapeHtml(po.bill_number || 'N/A')}</td>
        <td><span class="badge-status badge-unpaid">${escapeHtml(po.bill_status || 'Unpaid')}</span></td>
        <td class="text-end fw-bold">${totalAmount}</td>
      </tr>
    `;
  }).join('');
}

async function loadPurchaseModalDropdowns(token) {
  const vendorSelect = document.getElementById('poVendorSelect');
  const productSelect = document.getElementById('poProductSelect');

  try {
    const contactsRes = await fetch('/api/contacts', { headers: { 'Authorization': `Bearer ${token}` } });
    if (contactsRes.ok) {
      const contactsData = await contactsRes.json();
      if (contactsData.success && vendorSelect) {
        const vendors = (contactsData.data || []).filter(c => c.type === 'vendor' || c.type === 'both' || true);
        vendorSelect.innerHTML = vendors.map(v => 
          `<option value="${v.id}">${escapeHtml(v.name)} (${v.type.toUpperCase()})</option>`
        ).join('');
      }
    }

    const productsRes = await fetch('/api/products', { headers: { 'Authorization': `Bearer ${token}` } });
    if (productsRes.ok) {
      const productsData = await productsRes.json();
      if (productsData.success && productSelect) {
        loadedProductsCache = productsData.data || [];
        productSelect.innerHTML = loadedProductsCache.map(p => 
          `<option value="${p.id}">${escapeHtml(p.name)} (Cost: ₹${parseFloat(p.purchase_price).toLocaleString('en-IN')})</option>`
        ).join('');
        onPoProductSelected();
      }
    }
  } catch (err) {
    console.error('Error loading purchase dropdowns:', err);
  }

  if (productSelect) productSelect.addEventListener('change', onPoProductSelected);
  const qtyInput = document.getElementById('poQuantityInput');
  const priceInput = document.getElementById('poPriceInput');
  if (qtyInput) qtyInput.addEventListener('input', calculatePoTotals);
  if (priceInput) priceInput.addEventListener('input', calculatePoTotals);
}

function onPoProductSelected() {
  const productSelect = document.getElementById('poProductSelect');
  const priceInput = document.getElementById('poPriceInput');
  if (!productSelect || !priceInput) return;

  const selectedId = parseInt(productSelect.value);
  const prod = loadedProductsCache.find(p => p.id === selectedId);
  if (prod) {
    priceInput.value = parseFloat(prod.purchase_price || 0).toFixed(2);
  }
  calculatePoTotals();
}

function calculatePoTotals() {
  const qtyInput = document.getElementById('poQuantityInput');
  const priceInput = document.getElementById('poPriceInput');

  const qty = parseInt(qtyInput ? qtyInput.value || 1 : 1);
  const unitPrice = parseFloat(priceInput ? priceInput.value || 0 : 0);

  const subtotal = qty * unitPrice;
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  const subtotalEl = document.getElementById('poSummarySubtotal');
  const taxEl = document.getElementById('poSummaryTax');
  const totalEl = document.getElementById('poSummaryTotal');

  if (subtotalEl) subtotalEl.textContent = '₹' + subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  if (taxEl) taxEl.textContent = '₹' + tax.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  if (totalEl) totalEl.textContent = '₹' + total.toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

async function handlePurchaseOrderCreate(e, token) {
  e.preventDefault();

  const vendorSelect = document.getElementById('poVendorSelect');
  const productSelect = document.getElementById('poProductSelect');
  const qtyInput = document.getElementById('poQuantityInput');
  const priceInput = document.getElementById('poPriceInput');
  const alertEl = document.getElementById('poModalAlert');

  if (!vendorSelect || !vendorSelect.value || !productSelect || !productSelect.value) {
    showUIError(alertEl, 'Vendor and Product selection are required');
    return;
  }

  const payload = {
    contact_id: parseInt(vendorSelect.value),
    items: [
      {
        product_id: parseInt(productSelect.value),
        quantity: parseInt(qtyInput.value || 1),
        unit_price: parseFloat(priceInput.value || 0),
      }
    ]
  };

  try {
    const response = await fetch('/api/purchase-orders', {
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
      showUIError(alertEl, result.message || 'Failed to create Purchase Order');
      return;
    }

    if (alertEl) {
      alertEl.className = 'alert alert-success mt-2 mb-3';
      alertEl.textContent = `Purchase Order (${result.data.purchase_order.po_number}) & Vendor Bill (${result.data.bill.bill_number}) generated successfully!`;
      alertEl.classList.remove('d-none');
    }

    setTimeout(() => {
      const modalElement = document.getElementById('newPurchaseOrderModal');
      if (modalElement && window.bootstrap) {
        const bsModal = window.bootstrap.Modal.getInstance(modalElement);
        if (bsModal) bsModal.hide();
      }
      fetchAndRenderPurchaseOrders(token);
    }, 1200);

  } catch (err) {
    console.error('Error submitting purchase order:', err);
    showUIError(alertEl, 'Network or server error while saving Purchase Order.');
  }
}

async function fetchAndRenderVendorBills(token) {
  try {
    const response = await fetch('/api/vendor-bills', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 401 || response.status === 403) {
      handleAuthFailure();
      return;
    }

    const result = await response.json();
    if (!response.ok || !result.success) return;

    renderVendorBillsTable(result.data || []);
  } catch (err) {
    console.error('Error fetching vendor bills:', err);
  }
}

function renderVendorBillsTable(bills) {
  const tbody = document.getElementById('vendorBillsTableBody');
  if (!tbody) return;

  if (bills.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center text-muted py-4">No vendor bills recorded yet.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = bills.map(b => {
    let billDate = '--';
    if (b.bill_date) {
      billDate = new Date(b.bill_date).toISOString().split('T')[0];
    }
    let dueDate = '--';
    if (b.due_date) {
      dueDate = new Date(b.due_date).toISOString().split('T')[0];
    }
    const total = parseFloat(b.total_amount || 0);
    const paid = parseFloat(b.paid_amount || 0);
    const balance = total - paid;

    let statusClass = 'badge-unpaid';
    if (b.status === 'paid') statusClass = 'badge-paid';

    return `
      <tr>
        <td class="fw-bold text-primary">${escapeHtml(b.bill_number)}</td>
        <td class="fw-semibold">${escapeHtml(b.po_number || 'N/A')}</td>
        <td>${escapeHtml(b.vendor_name || 'N/A')}</td>
        <td>${billDate}</td>
        <td>${dueDate}</td>
        <td><span class="badge-status ${statusClass}">${escapeHtml((b.status || 'UNPAID').toUpperCase())}</span></td>
        <td class="text-end fw-bold">₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td class="text-end text-success fw-bold">₹${paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td class="text-end ${balance > 0 ? 'text-danger fw-bold' : 'text-muted'}">₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
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

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
