/**
 * Urban Furniture Accounting System — Authentication Integration
 * Handles POST /api/auth/login with JWT localStorage token storage & UI error display
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const loginErrorAlert = document.getElementById('loginErrorAlert');
  const submitBtn = document.getElementById('loginSubmitBtn');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Clear previous error message
      if (loginErrorAlert) {
        loginErrorAlert.classList.add('d-none');
        loginErrorAlert.textContent = '';
      }

      const email = loginEmail ? loginEmail.value.trim() : '';
      const password = loginPassword ? loginPassword.value : '';

      if (!email || !password) {
        if (loginErrorAlert) {
          loginErrorAlert.textContent = 'Please enter both email and password.';
          loginErrorAlert.classList.remove('d-none');
        }
        return;
      }

      // Indicate loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          <span>Signing in...</span>
        `;
      }

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok && data.success && data.token) {
          // 1. Store JWT token in localStorage
          localStorage.setItem('token', data.token);

          // 2. Store basic user information in localStorage
          localStorage.setItem('user', JSON.stringify(data.user));

          // 3. Redirect to dashboard.html
          window.location.href = 'pages/dashboard.html';
        } else {
          // Display backend error message inside existing UI
          if (loginErrorAlert) {
            loginErrorAlert.textContent = data.message || 'Invalid credentials. Please try again.';
            loginErrorAlert.classList.remove('d-none');
          }
        }
      } catch (error) {
        console.error('[Login Error]:', error);
        if (loginErrorAlert) {
          loginErrorAlert.textContent = 'Unable to connect to backend server. Please verify server status.';
          loginErrorAlert.classList.remove('d-none');
        }
      } finally {
        // Reset submit button state if redirection hasn't occurred
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `
            <span>Sign In</span>
            <span class="material-symbols-outlined fs-6">arrow_forward</span>
          `;
        }
      }
    });
  }
});
