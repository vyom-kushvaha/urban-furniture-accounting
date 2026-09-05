// ====================================================================
// Urban Furniture Accounting System — Products Module Controller JS
// Manages Products Catalog List, Kanban, and Master Form Integration
// ====================================================================

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

  // 1. Products List Page (products.html)
  const productsTableBody = document.getElementById('productsTableBody');
  if (productsTableBody) {
    fetchAndRenderProducts(token);
  }

  // 2. Standalone Product Kanban Page (product-kanban.html)
  const standaloneProductKanbanGrid = document.getElementById('standaloneProductKanbanGrid');
  if (standaloneProductKanbanGrid) {
    fetchAndRenderProductKanbanPage(token);
  }

  // 3. Standalone Product Master Form Page (product-form.html)
  const productMasterForm = document.getElementById('productMasterForm');
  if (productMasterForm) {
    productMasterForm.addEventListener('submit', (e) => handleProductCreateSubmit(e, token));
  }
});

/**
 * Fetch all products from GET /api/products and render List Table
 * @param {string} token 
 */
async function fetchAndRenderProducts(token) {
  try {
    const response = await fetch('/api/products', {
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
      console.error('Failed to fetch products:', result.message);
      return;
    }

    const products = result.data || [];
    renderProductsTable(products);
    renderProductsKanban(products, 'view-kanban');
  } catch (err) {
    console.error('Error fetching products:', err);
  }
}

/**
 * Fetch products specifically for standalone product-kanban.html page
 * @param {string} token 
 */
async function fetchAndRenderProductKanbanPage(token) {
  try {
    const response = await fetch('/api/products', {
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
      console.error('Failed to fetch products:', result.message);
      return;
    }

    renderProductsKanban(result.data || [], 'standaloneProductKanbanGrid');
  } catch (err) {
    console.error('Error fetching product kanban:', err);
  }
}

/**
 * Render Product Table Rows (List View)
 * @param {Array} products 
 */
function renderProductsTable(products) {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted py-4">
          No products recorded yet. Click "New Product" to add one.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = products.map(p => {
    let typeBadge = '<span class="badge bg-secondary">Goods</span>';
    const typeLower = (p.type || '').toLowerCase();
    if (typeLower === 'service') {
      typeBadge = '<span class="badge bg-info text-dark">Service</span>';
    } else if (typeLower === 'combo') {
      typeBadge = '<span class="badge bg-success text-white">Combo</span>';
    }

    const salesPrice = formatINR(parseFloat(p.sales_price || 0));
    const purchasePrice = formatINR(parseFloat(p.purchase_price || 0));

    return `
      <tr>
        <td>#${p.id}</td>
        <td class="fw-bold">${escapeHtml(p.name)}</td>
        <td>${typeBadge}</td>
        <td>${escapeHtml(p.category || 'General')}</td>
        <td class="text-end fw-bold">${salesPrice}</td>
        <td class="text-end text-muted">${purchasePrice}</td>
        <td><span class="badge-status badge-paid">Active</span></td>
      </tr>
    `;
  }).join('');
}

/**
 * Render Product Kanban Cards
 * @param {Array} products 
 * @param {string} containerId 
 */
function renderProductsKanban(products, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center text-muted py-4">
        No products available in Kanban view.
      </div>
    `;
    return;
  }

  container.innerHTML = products.map(p => {
    let typeBadge = '<span class="badge bg-secondary">Goods</span>';
    const typeLower = (p.type || '').toLowerCase();
    if (typeLower === 'service') {
      typeBadge = '<span class="badge bg-info text-dark">Service</span>';
    } else if (typeLower === 'combo') {
      typeBadge = '<span class="badge bg-success text-white">Combo</span>';
    }

    const salesPrice = formatINR(parseFloat(p.sales_price || 0));
    const purchasePrice = formatINR(parseFloat(p.purchase_price || 0));

    return `
      <div class="col-12 col-sm-6 col-md-4 col-xl-3">
        <div class="kanban-card">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="fw-bold m-0">${escapeHtml(p.name)}</h6>
            ${typeBadge}
          </div>
          <p class="text-muted small mb-1">Category: <strong class="text-dark">${escapeHtml(p.category || 'General')}</strong></p>
          <p class="text-muted small mb-1">Sales Price: <strong class="text-dark">${salesPrice}</strong></p>
          <p class="text-muted small mb-0">Cost Price: ${purchasePrice}</p>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Form Submit Handler for Creating Product SKU
 * @param {Event} e 
 * @param {string} token 
 */
async function handleProductCreateSubmit(e, token) {
  e.preventDefault();

  const nameEl = document.getElementById('formProductName');
  const typeEl = document.getElementById('formProductType');
  const salesPriceEl = document.getElementById('formSalesPrice');
  const purchasePriceEl = document.getElementById('formPurchasePrice');
  const categoryEl = document.getElementById('formCategory');
  const alertEl = document.getElementById('formProductAlert');

  if (!nameEl || !nameEl.value.trim()) {
    showUIError(alertEl, 'Product name is required.');
    return;
  }

  const payload = {
    name: nameEl.value.trim(),
    type: typeEl ? typeEl.value : 'goods',
    sales_price: salesPriceEl ? parseFloat(salesPriceEl.value || 0) : 0,
    purchase_price: purchasePriceEl ? parseFloat(purchasePriceEl.value || 0) : 0,
    category: categoryEl ? categoryEl.value : 'General',
  };

  try {
    const response = await fetch('/api/products', {
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
      showUIError(alertEl, result.message || 'Failed to create product SKU');
      return;
    }

    // Success Handling
    if (alertEl) {
      alertEl.className = 'alert alert-success mt-2 mb-3';
      alertEl.textContent = 'Product SKU created successfully!';
      alertEl.classList.remove('d-none');
    }

    // Redirect to Products list page
    setTimeout(() => {
      window.location.href = 'products.html';
    }, 1000);

  } catch (err) {
    console.error('Error creating product:', err);
    showUIError(alertEl, 'Network or server error while saving product SKU.');
  }
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
