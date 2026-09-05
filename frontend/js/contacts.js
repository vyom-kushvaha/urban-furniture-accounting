// ====================================================================
// Urban Furniture Accounting System — Contacts Module Controller JS
// Manages Contacts List, Kanban, and Master Form Integration
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

  // 1. Contacts List & In-Modal Form Page (contacts.html)
  const contactsTableBody = document.getElementById('contactsTableBody');
  const contactsKanbanContainer = document.getElementById('contactsKanbanContainer');

  if (contactsTableBody || contactsKanbanContainer) {
    fetchAndRenderContacts(token);

    // Modal Create Form Listener
    const modalForm = document.getElementById('modalContactForm');
    if (modalForm) {
      modalForm.addEventListener('submit', (e) => handleContactCreateSubmit(e, token, true));
    }
  }

  // 2. Standalone Contact Kanban Page (contact-kanban.html)
  const standaloneKanbanGrid = document.getElementById('standaloneKanbanGrid');
  if (standaloneKanbanGrid) {
    fetchAndRenderKanbanPage(token);
  }

  // 3. Standalone Contact Master Form Page (contact-form.html)
  const contactMasterForm = document.getElementById('contactMasterForm');
  if (contactMasterForm) {
    contactMasterForm.addEventListener('submit', (e) => handleContactCreateSubmit(e, token, false));
  }
});

/**
 * Fetch all contacts from GET /api/contacts and render List + Kanban
 * @param {string} token 
 */
async function fetchAndRenderContacts(token) {
  try {
    const response = await fetch('/api/contacts', {
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
      console.error('Failed to fetch contacts:', result.message);
      return;
    }

    const contacts = result.data || [];
    renderContactsTable(contacts);
    renderContactsKanban(contacts, 'view-kanban');
  } catch (err) {
    console.error('Error fetching contacts:', err);
  }
}

/**
 * Fetch contacts specifically for standalone contact-kanban.html page
 * @param {string} token 
 */
async function fetchAndRenderKanbanPage(token) {
  try {
    const response = await fetch('/api/contacts', {
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
      console.error('Failed to fetch contacts:', result.message);
      return;
    }

    renderContactsKanban(result.data || [], 'standaloneKanbanGrid');
  } catch (err) {
    console.error('Error fetching kanban contacts:', err);
  }
}

/**
 * Render Contact Table Rows (List View)
 * @param {Array} contacts 
 */
function renderContactsTable(contacts) {
  const tbody = document.getElementById('contactsTableBody');
  if (!tbody) return;

  if (contacts.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted py-4">
          No contacts found. Click "New Contact" to create one.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = contacts.map(c => {
    let typeBadge = '<span class="badge bg-primary text-white">Customer</span>';
    if (c.type === 'vendor') {
      typeBadge = '<span class="badge bg-warning text-dark">Vendor</span>';
    } else if (c.type === 'both') {
      typeBadge = '<span class="badge bg-success text-white">Both</span>';
    }

    return `
      <tr>
        <td>#${c.id}</td>
        <td class="fw-bold">${escapeHtml(c.name)}</td>
        <td>${typeBadge}</td>
        <td>${escapeHtml(c.email || '--')}</td>
        <td>${escapeHtml(c.mobile || '--')}</td>
        <td>${escapeHtml(c.city || '--')}</td>
        <td><span class="badge-status badge-paid">Active</span></td>
      </tr>
    `;
  }).join('');
}

/**
 * Render Contact Kanban Cards
 * @param {Array} contacts 
 * @param {string} containerId 
 */
function renderContactsKanban(contacts, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (contacts.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center text-muted py-4">
        No contacts available in Kanban view.
      </div>
    `;
    return;
  }

  container.innerHTML = contacts.map(c => {
    let typeBadge = '<span class="badge bg-primary text-white">Customer</span>';
    if (c.type === 'vendor') {
      typeBadge = '<span class="badge bg-warning text-dark">Vendor</span>';
    } else if (c.type === 'both') {
      typeBadge = '<span class="badge bg-success text-white">Both</span>';
    }

    return `
      <div class="col-12 col-sm-6 col-md-4 col-xl-3">
        <div class="kanban-card">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="fw-bold m-0">${escapeHtml(c.name)}</h6>
            ${typeBadge}
          </div>
          <p class="text-muted small mb-1"><span class="material-symbols-outlined fs-6 align-middle text-warning me-1">mail</span> ${escapeHtml(c.email || 'N/A')}</p>
          <p class="text-muted small mb-0"><span class="material-symbols-outlined fs-6 align-middle text-warning me-1">call</span> ${escapeHtml(c.mobile || 'N/A')}</p>
          ${c.city ? `<p class="text-muted small mb-0 mt-1"><span class="material-symbols-outlined fs-6 align-middle text-secondary me-1">location_on</span> ${escapeHtml(c.city)}${c.state ? `, ${escapeHtml(c.state)}` : ''}</p>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Form Submit Handler for Creating Contact
 * @param {Event} e 
 * @param {string} token 
 * @param {boolean} isModal 
 */
async function handleContactCreateSubmit(e, token, isModal) {
  e.preventDefault();

  const prefix = isModal ? 'modal' : 'form';
  const nameEl = document.getElementById(`${prefix}ContactName`);
  const typeEl = document.getElementById(`${prefix}ContactType`);
  const emailEl = document.getElementById(`${prefix}ContactEmail`);
  const mobileEl = document.getElementById(`${prefix}ContactMobile`);
  const addressEl = document.getElementById(`${prefix}ContactAddress`);
  const cityEl = document.getElementById(`${prefix}ContactCity`);
  const stateEl = document.getElementById(`${prefix}ContactState`);
  const pincodeEl = document.getElementById(`${prefix}ContactPincode`);
  const alertEl = document.getElementById(`${prefix}ContactAlert`);

  if (!nameEl || !nameEl.value.trim()) {
    showUIError(alertEl, 'Contact name is required.');
    return;
  }

  const payload = {
    name: nameEl.value.trim(),
    type: typeEl ? typeEl.value : 'customer',
    email: emailEl ? emailEl.value.trim() : null,
    mobile: mobileEl ? mobileEl.value.trim() : null,
    address: addressEl ? addressEl.value.trim() : null,
    city: cityEl ? cityEl.value.trim() : null,
    state: stateEl ? stateEl.value.trim() : null,
    pincode: pincodeEl ? pincodeEl.value.trim() : null,
  };

  try {
    const response = await fetch('/api/contacts', {
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
      showUIError(alertEl, result.message || 'Failed to create contact');
      return;
    }

    // Success Handling
    if (alertEl) {
      alertEl.className = 'alert alert-success mt-2 mb-3';
      alertEl.textContent = 'Contact created successfully!';
      alertEl.classList.remove('d-none');
    }

    if (isModal) {
      // Close Bootstrap modal if open and refresh list
      const modalElement = document.getElementById('newContactModal');
      if (modalElement && window.bootstrap) {
        const bsModal = window.bootstrap.Modal.getInstance(modalElement);
        if (bsModal) bsModal.hide();
      }
      fetchAndRenderContacts(token);
    } else {
      // Redirect back to contacts list after brief delay
      setTimeout(() => {
        window.location.href = 'contacts.html';
      }, 1000);
    }

  } catch (err) {
    console.error('Error creating contact:', err);
    showUIError(alertEl, 'Network or server error while saving contact.');
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
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
