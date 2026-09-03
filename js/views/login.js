// ============================================
// POS-Shop — Login / Register View
// ============================================

import auth from '../auth.js';
import { escapeHtml } from '../utils/dom.js';
import Config from '../config.js';

export async function renderLogin(params, queryParams, container) {
  const redirect = queryParams.redirect || '';
  const isRegister = queryParams.mode === 'register';

  container.innerHTML = `
    <div class="container" style="max-width:440px;margin:0 auto;padding:var(--space-16) var(--space-6)">
      <div class="card" style="padding:var(--space-8)">
        <div style="text-align:center;margin-bottom:var(--space-6)">
          <div class="store-logo-icon" style="width:48px;height:48px;margin:0 auto var(--space-4);border-radius:var(--radius-xl)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h2 id="auth-title">${isRegister ? 'Create Account' : 'Welcome Back'}</h2>
          <p class="text-sm text-muted mt-2">${isRegister ? 'Sign up to start shopping' : 'Sign in to your account'}</p>
        </div>

        <form id="auth-form" class="flex flex-col gap-4">
          <div class="form-group ${isRegister ? '' : 'hidden'}" id="name-group">
            <label class="form-label" for="auth-name">Full Name</label>
            <input type="text" class="form-input" id="auth-name" placeholder="John Doe" autocomplete="name">
          </div>

          <div class="form-group">
            <label class="form-label" for="auth-email">Email</label>
            <input type="email" class="form-input" id="auth-email" placeholder="you@example.com" autocomplete="email" required>
          </div>

          <div class="form-group">
            <label class="form-label" for="auth-password">Password</label>
            <input type="password" class="form-input" id="auth-password" placeholder="••••••••" 
              autocomplete="${isRegister ? 'new-password' : 'current-password'}" required minlength="6">
          </div>

          ${!isRegister ? `
            <div class="flex justify-end">
              <button type="button" class="btn btn-ghost text-sm" id="forgot-password-btn">Forgot password?</button>
            </div>
          ` : ''}

          <button type="submit" class="btn btn-primary btn-lg btn-full" id="auth-submit-btn">
            <span id="auth-submit-text">${isRegister ? 'Create Account' : 'Sign In'}</span>
            <span class="spinner hidden" id="auth-spinner"></span>
          </button>
        </form>

        <div class="divider" style="position:relative;text-align:center">
          <span style="background:var(--color-bg-card);padding:0 var(--space-4);position:relative;z-index:1;
            font-size:var(--text-xs);color:var(--color-text-muted)">OR</span>
        </div>

        <button class="btn btn-secondary btn-full" id="google-sign-in-btn" style="gap:var(--space-3)">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div class="divider" style="position:relative;text-align:center;margin-top:var(--space-6)">
          <span style="background:var(--color-bg-card);padding:0 var(--space-4);position:relative;z-index:1;
            font-size:var(--text-xs);color:var(--color-text-muted)">DEMO QUICK ACCESS</span>
        </div>

        <div class="flex flex-col gap-2 mt-4">
          <button class="btn btn-accent btn-full" id="demo-staff-btn">
            💻 Quick Login as POS Cashier (Staff)
          </button>
          <button class="btn btn-primary btn-full" id="demo-admin-btn">
            📊 Quick Login as Admin
          </button>
        </div>

        <p style="text-align:center;margin-top:var(--space-4);font-size:var(--text-sm);color:var(--color-text-tertiary)">
          ${isRegister
            ? `Already have an account? <a href="#/login${redirect ? '?redirect=' + redirect : ''}">Sign in</a>`
            : `Don't have an account? <a href="#/login?mode=register${redirect ? '&redirect=' + redirect : ''}">Sign up</a>`}
        </p>
      </div>
    </div>
  `;

  setupAuthEvents(container, isRegister, redirect);
}

function setupAuthEvents(container, isRegister, redirect) {
  const form = document.getElementById('auth-form');
  const submitBtn = document.getElementById('auth-submit-btn');
  const submitText = document.getElementById('auth-submit-text');
  const spinner = document.getElementById('auth-spinner');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('auth-email').value.trim();
      const password = document.getElementById('auth-password').value;
      const name = document.getElementById('auth-name')?.value.trim();

      if (!email || !password) return;

      submitBtn.disabled = true;
      submitText.textContent = isRegister ? 'Creating...' : 'Signing in...';
      spinner?.classList.remove('hidden');

      let result;
      if (isRegister) {
        result = await auth.signUp(email, password, name);
      } else {
        result = await auth.signIn(email, password);
      }

      submitBtn.disabled = false;
      submitText.textContent = isRegister ? 'Create Account' : 'Sign In';
      spinner?.classList.add('hidden');

      if (!result.error) {
        window.location.hash = redirect ? `#/${redirect}` : '#/';
      }
    });
  }

  // Google sign-in
  const googleBtn = document.getElementById('google-sign-in-btn');
  if (googleBtn) {
    googleBtn.addEventListener('click', () => auth.signInWithGoogle());
  }

  // Demo Cashier Sign-in
  const demoStaffBtn = document.getElementById('demo-staff-btn');
  if (demoStaffBtn) {
    demoStaffBtn.addEventListener('click', () => {
      auth.loginAsDemo(Config.ROLES.STAFF);
      window.location.hash = redirect ? `#/${redirect}` : '#/pos';
    });
  }

  // Demo Admin Sign-in
  const demoAdminBtn = document.getElementById('demo-admin-btn');
  if (demoAdminBtn) {
    demoAdminBtn.addEventListener('click', () => {
      auth.loginAsDemo(Config.ROLES.ADMIN);
      window.location.hash = redirect ? `#/${redirect}` : '#/admin';
    });
  }

  // Forgot password
  const forgotBtn = document.getElementById('forgot-password-btn');
  if (forgotBtn) {
    forgotBtn.addEventListener('click', () => {
      const email = document.getElementById('auth-email').value.trim();
      if (email) {
        auth.resetPassword(email);
      } else {
        document.getElementById('auth-email').focus();
      }
    });
  }
}

export default { renderLogin };
