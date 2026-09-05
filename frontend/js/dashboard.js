// ====================================================================
// Urban Furniture Accounting System — Dashboard Controller JS
// Fetch live metrics from GET /api/dashboard and render in UI
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');

  // Redirect to login if token is missing
  if (!token) {
    window.location.href = '../index.html';
    return;
  }

  // Populate User Info in Top Navbar if available
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      const navUserName = document.getElementById('navUserName');
      const navUserEmail = document.getElementById('navUserEmail');
      if (navUserName && user.name) navUserName.textContent = user.name;
      if (navUserEmail && user.email) navUserEmail.textContent = user.email;
    } catch (e) {
      console.warn('Failed to parse cached user object:', e);
    }
  }

  // Fetch Live Dashboard Data
  fetchDashboardMetrics(token);
});

/**
 * Fetch dashboard KPIs and recent transactions from backend Express REST API
 * @param {string} token - JWT Authorization Token
 */
async function fetchDashboardMetrics(token) {
  try {
    const response = await fetch('/api/dashboard', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    // Handle missing / invalid / expired token (401 / 403)
    if (response.status === 401 || response.status === 403) {
      console.warn('Authentication token expired or invalid. Redirecting to login...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '../index.html';
      return;
    }

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('Failed to load dashboard metrics:', result.message);
      return;
    }

    const { total_sales, payments_collected, receivables_due, recent_transactions } = result.data || {};

    // 1. Format Currency Numbers
    const salesVal = parseFloat(total_sales || 0);
    const paymentsVal = parseFloat(payments_collected || 0);
    const receivablesVal = parseFloat(receivables_due || 0);
    const netProfitVal = salesVal - receivablesVal; // Net invoiced realized income

    // 2. Update KPI Card Values in UI
    const kpiTotalSales = document.getElementById('kpiTotalSales');
    const kpiPaymentsCollected = document.getElementById('kpiPaymentsCollected');
    const kpiReceivablesDue = document.getElementById('kpiReceivablesDue');
    const kpiNetProfit = document.getElementById('kpiNetProfit');

    if (kpiTotalSales) kpiTotalSales.textContent = formatINR(salesVal);
    if (kpiPaymentsCollected) kpiPaymentsCollected.textContent = formatINR(paymentsVal);
    if (kpiReceivablesDue) kpiReceivablesDue.textContent = formatINR(receivablesVal);
    if (kpiNetProfit) kpiNetProfit.textContent = formatINR(netProfitVal);

    // 3. Render Recent Transactions Table Rows
    renderRecentTransactions(recent_transactions || []);

  } catch (error) {
    console.error('Network/Server error fetching dashboard metrics:', error);
  }
}

/**
 * Helper to format monetary numbers in Indian Currency (INR) style
 * @param {number} amount 
 * @returns {string} Formatted currency string (e.g. ₹97,940.00)
 */
function formatINR(amount) {
  return '₹' + amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Render recent transaction rows inside existing HTML table body
 * @param {Array} transactions 
 */
function renderRecentTransactions(transactions) {
  const tbody = document.getElementById('recentTransactionsTableBody');
  if (!tbody) return;

  if (!transactions || transactions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted py-4">
          <span class="material-symbols-outlined fs-3 d-block mb-1 text-secondary">inbox</span>
          No recent sales transactions recorded yet.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = transactions.map(order => {
    // Format order date YYYY-MM-DD
    let formattedDate = '--';
    if (order.order_date) {
      formattedDate = new Date(order.order_date).toISOString().split('T')[0];
    }

    // Format total amount
    const formattedAmount = formatINR(parseFloat(order.total_amount || 0));

    // Status Badge Logic matching Stitch design
    let statusClass = 'badge-draft';
    let statusLabel = order.status ? order.status.toUpperCase() : 'DRAFT';

    const statusLower = (order.status || '').toLowerCase();
    if (statusLower === 'confirmed') {
      statusClass = 'badge-confirmed';
      statusLabel = 'Confirmed';
    } else if (statusLower === 'paid' || statusLower === 'invoiced') {
      statusClass = 'badge-paid';
      statusLabel = statusLower === 'paid' ? 'Paid' : 'Invoiced';
    } else if (statusLower === 'unpaid' || statusLower === 'overdue') {
      statusClass = 'badge-unpaid';
      statusLabel = 'Unpaid';
    } else if (statusLower === 'draft') {
      statusClass = 'badge-draft';
      statusLabel = 'Draft';
    }

    return `
      <tr>
        <td class="fw-bold">${escapeHtml(order.order_number)}</td>
        <td>${escapeHtml(order.contact_name || 'N/A')}</td>
        <td>${formattedDate}</td>
        <td><span class="badge-status ${statusClass}">${statusLabel}</span></td>
        <td class="text-end fw-bold">${formattedAmount}</td>
      </tr>
    `;
  }).join('');
}

/**
 * Helper to escape HTML characters to prevent XSS
 * @param {string} str 
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
