/**
 * Urban Furniture Accounting System — App UI Interactivity Script
 * Handles Mega-Menu Hover/Click, UI View Toggles (List/Kanban), & Form Modals
 */

document.addEventListener('DOMContentLoaded', () => {
  initAuthHeader();
  initMegaMenu();
  initViewSwitchers();
});

/**
 * Navbar Auth Header & Authorization Initializer
 * Populates user details, formats text color, and manages role permissions
 */
function initAuthHeader() {
  const userStr = localStorage.getItem('user');
  if (!userStr) return;

  try {
    const user = JSON.parse(userStr);
    const navUserName = document.getElementById('navUserName');
    const navUserEmail = document.getElementById('navUserEmail');

    if (navUserName && user.name) {
      const roleLabel = (user.role || 'user').toUpperCase();
      let badgeClass = 'bg-secondary';
      if (user.role === 'admin') badgeClass = 'bg-warning text-dark';
      if (user.role === 'accountant') badgeClass = 'bg-info text-dark';
      if (user.role === 'contact') badgeClass = 'bg-success';

      navUserName.innerHTML = `
        <span>${escapeHtml(user.name)}</span>
        <span class="badge ${badgeClass} ms-1" style="font-size: 9px; vertical-align: middle;">${roleLabel}</span>
      `;
    }

    if (navUserEmail && user.email) {
      navUserEmail.textContent = user.email;
      navUserEmail.style.color = '#88A5B7'; // Crisp light slate blue for high readability on dark blue navbar
      navUserEmail.style.fontSize = '11px';
      navUserEmail.style.fontWeight = '500';
    }

    // Single-click Logout button listener
    const logoutBtn = document.querySelector('a[href*="index.html"]');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      });
    }

    // Role-based UI Authorization: Handle contact role limitations gracefully
    if (user.role === 'contact') {
      const restrictedHrefs = [
        'chart-of-accounts.html',
        'journals.html',
        'journal-entries.html',
        'budget.html',
        'reports-balance-sheet.html',
        'reports-profit-loss.html',
        'reports-budget.html',
        'create-user.html'
      ];

      document.querySelectorAll('.mega-item-card').forEach(card => {
        const href = card.getAttribute('href');
        if (restrictedHrefs.includes(href)) {
          card.style.opacity = '0.4';
          card.title = 'Authorized for Admin & Accountant roles only';
          card.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Access Restricted: This accounting / report module is reserved for Admin & Accountant roles.');
          });
        }
      });
    }
  } catch (e) {
    console.warn('[initAuthHeader]:', e);
  }
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

/**
 * Mega-Menu Interaction Handler
 * Supports mouse hover for desktop and tap/click for mobile/tablet screens.
 */
function initMegaMenu() {
  const dropdowns = document.querySelectorAll('.mega-menu-dropdown');

  dropdowns.forEach((dropdown) => {
    const button = dropdown.querySelector('a, button');
    const content = dropdown.querySelector('.mega-menu-content');

    if (!button || !content) return;

    let timeoutId = null;

    const openMenu = () => {
      if (timeoutId) clearTimeout(timeoutId);
      dropdowns.forEach((other) => {
        if (other !== dropdown) {
          other.classList.remove('is-active');
          const otherContent = other.querySelector('.mega-menu-content');
          if (otherContent && window.innerWidth < 1200) {
            otherContent.style.display = 'none';
          }
        }
      });
      dropdown.classList.add('is-active');
    };

    const closeMenu = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        dropdown.classList.remove('is-active');
      }, 150);
    };

    // Desktop hover interaction handling
    dropdown.addEventListener('mouseenter', () => {
      openMenu();
    });

    dropdown.addEventListener('mouseleave', () => {
      closeMenu();
    });

    // Mobile / Tablet click handler
    button.addEventListener('click', (e) => {
      if (window.innerWidth < 1200) {
        e.preventDefault();
        const isOpen = content.style.display === 'block' || dropdown.classList.contains('is-active');

        dropdowns.forEach(other => {
          other.classList.remove('is-active');
          const otherContent = other.querySelector('.mega-menu-content');
          if (otherContent) otherContent.style.display = 'none';
        });

        if (isOpen) {
          dropdown.classList.remove('is-active');
          content.style.display = 'none';
        } else {
          dropdown.classList.add('is-active');
          content.style.display = 'block';
        }
      }
    });
  });

  // Close mega menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.mega-menu-dropdown')) {
      dropdowns.forEach((dropdown) => {
        dropdown.classList.remove('is-active');
        const content = dropdown.querySelector('.mega-menu-content');
        if (content && window.innerWidth < 1200) {
          content.style.display = 'none';
        }
      });
    }
  });
}

/**
 * List / Kanban View Switcher Handler
 */
function initViewSwitchers() {
  const btnList = document.getElementById('btn-view-list');
  const btnKanban = document.getElementById('btn-view-kanban');
  const viewList = document.getElementById('view-list');
  const viewKanban = document.getElementById('view-kanban');

  if (btnList && btnKanban && viewList && viewKanban) {
    btnList.addEventListener('click', () => {
      btnList.classList.add('btn-dark-blue');
      btnList.classList.remove('btn-outline-secondary');
      btnKanban.classList.remove('btn-dark-blue');
      btnKanban.classList.add('btn-outline-secondary');

      viewList.classList.remove('d-none');
      viewKanban.classList.add('d-none');
    });

    btnKanban.addEventListener('click', () => {
      btnKanban.classList.add('btn-dark-blue');
      btnKanban.classList.remove('btn-outline-secondary');
      btnList.classList.remove('btn-dark-blue');
      btnList.classList.add('btn-outline-secondary');

      viewKanban.classList.remove('d-none');
      viewList.classList.add('d-none');
    });
  }
}
