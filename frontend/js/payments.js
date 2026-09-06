// ====================================================================
// Urban Furniture Accounting System — Payments Controller JS
// Manages Customer Payments & Vendor Disbursements with Auto-Ledger
// ====================================================================

let pendingInvoicesCache = [];

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

  const paymentsTableBody = document.getElementById('paymentsTableBody');
  if (paymentsTableBody) {
    fetchAndRenderPayments(token);
    loadInvoiceDropdownOptions(token);

    const paymentForm = document.getElementById('registerPaymentForm');
    if (paymentForm) {
      paymentForm.addEventListener('submit', (e) => handlePaymentSubmit(e, token));
    }
  }
});

async function fetchAndRenderPayments(token) {
  try {
    const response = await fetch('/api/payments', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 401 || response.status === 403) {
      handleAuthFailure();
      return;
    }

    const result = await response.json();
    if (!response.ok || !result.success) return;

    renderPaymentsTable(result.data || []);
  } catch (err) {
    console.error('Error fetching payments:', err);
  }
}

function renderPaymentsTable(payments) {
  const tbody = document.getElementById('paymentsTableBody');
  if (!tbody) return;

  if (payments.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted py-4">No payment transactions registered yet.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = payments.map(p => {
    let pDate = '--';
    if (p.payment_date) {
      pDate = new Date(p.payment_date).toISOString().split('T')[0];
    }
    const isBank = (p.payment_method || '').toLowerCase() === 'bank';
    const methodBadge = isBank ? '<span class="badge bg-primary">HDFC Bank</span>' : '<span class="badge bg-success">Cash</span>';

    return `
      <tr>
        <td class="fw-bold text-primary">${escapeHtml(p.payment_number)}</td>
        <td class="fw-semibold">${escapeHtml(p.invoice_number || p.bill_number || 'Direct Voucher')}</td>
        <td>${escapeHtml(p.contact_name || 'N/A')}</td>
        <td>${pDate}</td>
        <td>${methodBadge}</td>
        <td><span class="badge-status badge-paid">Cleared</span></td>
        <td class="text-end fw-bold">₹${parseFloat(p.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      </tr>
    `;
  }).join('');
}

async function loadInvoiceDropdownOptions(token) {
  const invSelect = document.getElementById('payInvoiceSelect');
  if (!invSelect) return;

  try {
    const response = await fetch('/api/invoices', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        pendingInvoicesCache = (result.data || []).filter(i => i.status !== 'paid');
        if (pendingInvoicesCache.length === 0) {
          invSelect.innerHTML = '<option value="">No pending invoices due</option>';
        } else {
          invSelect.innerHTML = pendingInvoicesCache.map(i => {
            const due = i.total_amount - i.paid_amount;
            return `<option value="${i.id}">${escapeHtml(i.invoice_number)} — ${escapeHtml(i.contact_name)} (Due: ₹${due.toLocaleString('en-IN')})</option>`;
          }).join('');
          
          // Auto-fill amount input with remaining due of first selected invoice
          const firstInv = pendingInvoicesCache[0];
          const firstDue = firstInv ? (firstInv.total_amount - firstInv.paid_amount) : 0;
          const amountInput = document.getElementById('payAmountInput');
          if (amountInput && firstDue > 0) amountInput.value = firstDue.toFixed(2);
        }

        // Add event listener to update amount input when selected invoice changes
        invSelect.addEventListener('change', () => {
          const selectedId = parseInt(invSelect.value);
          const inv = pendingInvoicesCache.find(i => i.id === selectedId);
          const due = inv ? (inv.total_amount - inv.paid_amount) : 0;
          const amountInput = document.getElementById('payAmountInput');
          if (amountInput && due > 0) amountInput.value = due.toFixed(2);
        });
      }
    }
  } catch (err) {
    console.error('Error loading invoices dropdown:', err);
  }
}

async function handlePaymentSubmit(e, token) {
  e.preventDefault();

  const invSelect = document.getElementById('payInvoiceSelect');
  const amountInput = document.getElementById('payAmountInput');
  const methodSelect = document.getElementById('payMethodSelect');
  const refInput = document.getElementById('payReferenceInput');
  const alertEl = document.getElementById('payModalAlert');

  if (!invSelect || !invSelect.value) {
    showUIError(alertEl, 'Please select a pending invoice');
    return;
  }
  if (!amountInput || parseFloat(amountInput.value) <= 0) {
    showUIError(alertEl, 'Valid payment amount is required');
    return;
  }

  // Frontend Overpayment Validation Check
  const selectedInvId = parseInt(invSelect.value);
  const targetInv = pendingInvoicesCache.find(i => i.id === selectedInvId);
  const enteredAmount = parseFloat(amountInput.value);
  if (targetInv) {
    const dueAmount = targetInv.total_amount - targetInv.paid_amount;
    if (enteredAmount > dueAmount + 0.01) {
      showUIError(alertEl, `Payment amount (₹${enteredAmount.toLocaleString('en-IN')}) cannot exceed remaining balance due of ₹${dueAmount.toLocaleString('en-IN')}.`);
      return;
    }
  }

  const payload = {
    invoice_id: parseInt(invSelect.value),
    amount: parseFloat(amountInput.value),
    payment_method: methodSelect ? methodSelect.value : 'bank',
    reference: refInput ? refInput.value.trim() : null,
  };

  try {
    const response = await fetch('/api/payments', {
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
      showUIError(alertEl, result.message || 'Failed to register payment');
      return;
    }

    if (alertEl) {
      alertEl.className = 'alert alert-success mt-2 mb-3';
      alertEl.textContent = `Payment (${result.data.payment.payment_number}) registered and posted to Double-Entry ledger!`;
      alertEl.classList.remove('d-none');
    }

    setTimeout(() => {
      const modalElement = document.getElementById('registerPaymentModal');
      if (modalElement && window.bootstrap) {
        const bsModal = window.bootstrap.Modal.getInstance(modalElement);
        if (bsModal) bsModal.hide();
      }
      fetchAndRenderPayments(token);
    }, 1200);

  } catch (err) {
    console.error('Error submitting payment:', err);
    showUIError(alertEl, 'Network or server error while processing payment.');
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

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
