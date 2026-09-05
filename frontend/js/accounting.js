// ====================================================================
// Urban Furniture Accounting System — Accounting & Ledgers Controller JS
// Chart of Accounts, Journals, Double-Entry Entries & Budgets
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

  // 1. Chart of Accounts
  const accountsTableBody = document.getElementById('accountsTableBody');
  if (accountsTableBody) {
    fetchAndRenderAccounts(token);
  }

  // 2. Journals
  const journalsTableBody = document.getElementById('journalsTableBody');
  if (journalsTableBody) {
    fetchAndRenderJournals(token);
  }

  // 3. Journal Entries
  const journalEntriesTableBody = document.getElementById('journalEntriesTableBody');
  if (journalEntriesTableBody) {
    fetchAndRenderJournalEntries(token);
  }

  // 4. Budgets & Analytic Accounts
  const budgetTableBody = document.getElementById('budgetTableBody');
  const analyticTableBody = document.getElementById('analyticTableBody');
  if (budgetTableBody || analyticTableBody) {
    fetchAndRenderBudgets(token, budgetTableBody ? 'budgetTableBody' : 'analyticTableBody');
  }
});

async function fetchAndRenderAccounts(token) {
  try {
    const res = await fetch('/api/accounts', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.status === 401 || res.status === 403) return handleAuthFailure();
    const result = await res.json();
    if (!res.ok || !result.success) return;

    const tbody = document.getElementById('accountsTableBody');
    if (!tbody) return;

    tbody.innerHTML = (result.data || []).map(a => {
      let typeBadge = '<span class="badge bg-primary">Asset</span>';
      if (a.type === 'liability') typeBadge = '<span class="badge bg-danger">Liability</span>';
      if (a.type === 'expense') typeBadge = '<span class="badge bg-warning text-dark">Expense</span>';
      if (a.type === 'income') typeBadge = '<span class="badge bg-success">Income</span>';
      if (a.type === 'capital') typeBadge = '<span class="badge bg-dark">Capital</span>';

      return `
        <tr>
          <td class="fw-bold">${escapeHtml(a.account_code)}</td>
          <td class="fw-semibold">${escapeHtml(a.account_name)}</td>
          <td>${typeBadge}</td>
          <td><span class="badge-status badge-paid">Active</span></td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error fetching accounts:', err);
  }
}

async function fetchAndRenderJournals(token) {
  try {
    const res = await fetch('/api/journals', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.status === 401 || res.status === 403) return handleAuthFailure();
    const result = await res.json();
    if (!res.ok || !result.success) return;

    const tbody = document.getElementById('journalsTableBody');
    if (!tbody) return;

    tbody.innerHTML = (result.data || []).map(j => `
      <tr>
        <td class="fw-bold text-primary">${escapeHtml(j.code)}</td>
        <td class="fw-semibold">${escapeHtml(j.name)}</td>
        <td><span class="badge bg-secondary">${escapeHtml(j.type.toUpperCase())}</span></td>
        <td>${escapeHtml(j.default_account_name || 'System Managed')}</td>
        <td><span class="badge-status badge-paid">Active</span></td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error fetching journals:', err);
  }
}

async function fetchAndRenderJournalEntries(token) {
  try {
    const res = await fetch('/api/journal-entries', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.status === 401 || res.status === 403) return handleAuthFailure();
    const result = await res.json();
    if (!res.ok || !result.success) return;

    const tbody = document.getElementById('journalEntriesTableBody');
    if (!tbody) return;

    tbody.innerHTML = (result.data || []).map(je => {
      let entryDate = '--';
      if (je.entry_date) entryDate = new Date(je.entry_date).toISOString().split('T')[0];

      return `
        <tr>
          <td class="fw-bold text-primary">${escapeHtml(je.entry_number)}</td>
          <td>${escapeHtml(je.journal_name || 'General Journal')}</td>
          <td>${escapeHtml(je.reference || 'Manual Entry')}</td>
          <td>${entryDate}</td>
          <td><span class="badge-status badge-paid">Posted</span></td>
          <td class="text-end fw-bold">₹${parseFloat(je.total_debit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td class="text-end fw-bold">₹${parseFloat(je.total_credit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error fetching journal entries:', err);
  }
}

async function fetchAndRenderBudgets(token, containerId) {
  try {
    const res = await fetch('/api/budgets', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.status === 401 || res.status === 403) return handleAuthFailure();
    const result = await res.json();
    if (!res.ok || !result.success) return;

    const tbody = document.getElementById(containerId);
    if (!tbody) return;

    tbody.innerHTML = (result.data || []).map(b => {
      let startDate = b.start_date ? new Date(b.start_date).toISOString().split('T')[0] : '--';
      let endDate = b.end_date ? new Date(b.end_date).toISOString().split('T')[0] : '--';

      return `
        <tr>
          <td class="fw-bold">${escapeHtml(b.name)}</td>
          <td>${escapeHtml(b.account_name || 'General Account')}</td>
          <td>${startDate} to ${endDate}</td>
          <td>${escapeHtml(b.responsible_name || 'Admin')}</td>
          <td class="text-end fw-bold">₹${parseFloat(b.planned_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td><span class="badge-status badge-paid">Active</span></td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error fetching budgets:', err);
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
