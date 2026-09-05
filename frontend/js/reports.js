// ====================================================================
// Urban Furniture Accounting System — Financial Reports Controller JS
// Dynamically fetches P&L, Balance Sheet & Budget Variance from Backend APIs
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '../index.html';
    return;
  }

  // User details in navbar
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

  // 1. Profit & Loss Report
  const pnlContainer = document.getElementById('pnlReportContainer');
  if (pnlContainer) {
    fetchAndRenderProfitLoss(token);
  }

  // 2. Balance Sheet Report
  const bsContainer = document.getElementById('balanceSheetContainer');
  if (bsContainer) {
    fetchAndRenderBalanceSheet(token);
  }

  // 3. Budget Variance Report
  const budgetReportContainer = document.getElementById('budgetReportTableBody');
  if (budgetReportContainer) {
    fetchAndRenderBudgetReport(token);
  }
});

async function fetchAndRenderProfitLoss(token) {
  try {
    const res = await fetch('/api/reports/profit-loss', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.status === 401 || res.status === 403) return handleAuthFailure();
    const result = await res.json();
    if (!res.ok || !result.success) return;

    const data = result.data || {};
    
    // Update P&L metrics
    setElText('pnlSalesIncome', formatINR(data.total_sales_income));
    setElText('pnlGstCollected', formatINR(data.total_gst_collected));
    setElText('pnlPurchaseCost', formatINR(data.total_purchase_cost));
    setElText('pnlGrossProfit', formatINR(data.gross_profit));
    setElText('pnlOperatingExpenses', formatINR(data.operating_expenses));
    setElText('pnlTotalExpenses', formatINR(data.total_expenses));
    setElText('pnlNetProfit', formatINR(data.net_profit));
    setElText('pnlEbitdaMargin', data.ebitda_margin);

  } catch (err) {
    console.error('Error fetching P&L report:', err);
  }
}

async function fetchAndRenderBalanceSheet(token) {
  try {
    const res = await fetch('/api/reports/balance-sheet', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.status === 401 || res.status === 403) return handleAuthFailure();
    const result = await res.json();
    if (!res.ok || !result.success) return;

    const data = result.data || {};
    const assets = data.assets || {};
    const liabilities = data.liabilities || {};
    const equity = data.equity || {};

    setElText('bsCash', formatINR(assets.cash_and_equivalents));
    setElText('bsBank', formatINR(assets.hdfc_bank_account));
    setElText('bsReceivables', formatINR(assets.accounts_receivable));
    setElText('bsTotalAssets', formatINR(assets.total_current_assets));

    setElText('bsPayables', formatINR(liabilities.accounts_payable));
    setElText('bsTotalLiabilities', formatINR(liabilities.total_liabilities));
    setElText('bsEquity', formatINR(equity.retained_earnings_equity));
    setElText('bsTotalLiabilitiesEquity', formatINR(equity.total_equity_and_liabilities));

  } catch (err) {
    console.error('Error fetching Balance Sheet report:', err);
  }
}

async function fetchAndRenderBudgetReport(token) {
  try {
    const res = await fetch('/api/reports/budget', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.status === 401 || res.status === 403) return handleAuthFailure();
    const result = await res.json();
    if (!res.ok || !result.success) return;

    const tbody = document.getElementById('budgetReportTableBody');
    if (!tbody) return;

    tbody.innerHTML = (result.data || []).map(b => `
      <tr>
        <td class="fw-bold">${escapeHtml(b.name)}</td>
        <td>${escapeHtml(b.account_name)}</td>
        <td class="text-end fw-bold">₹${parseFloat(b.planned_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td class="text-end text-muted">₹${parseFloat(b.actual_spent).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td class="text-end ${b.variance >= 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}">₹${parseFloat(b.variance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td class="text-end fw-semibold">${escapeHtml(b.burn_rate_percent)}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error fetching budget report:', err);
  }
}

function setElText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function handleAuthFailure() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '../index.html';
}

function formatINR(amount) {
  return '₹' + parseFloat(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
