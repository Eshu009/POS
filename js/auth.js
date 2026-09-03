// ============================================
// POS-Shop — Auth Module
// Login, register, session management, role checking
// ============================================

import { getSupabase } from './supabase.js';
import Config from './config.js';
import { showToast } from './utils/toast.js';

class Auth {
  constructor() {
    this.user = null;
    this.profile = null;
    this.session = null;
    this.listeners = [];
    this._initialized = false;
  }

  /**
   * Initialize auth — call once on app start.
   */
  async init() {
    if (this._initialized) return;
    this._initialized = true;

    // Check for demo session in localStorage first
    const demoSession = localStorage.getItem('pos-shop-demo-auth');
    if (demoSession) {
      try {
        const parsed = JSON.parse(demoSession);
        this.user = parsed.user;
        this.profile = parsed.profile;
        this.session = parsed.session || { user: parsed.user };
        this._notify('SIGNED_IN');
        return;
      } catch (e) {
        localStorage.removeItem('pos-shop-demo-auth');
      }
    }

    const sb = getSupabase();
    if (!sb) return;

    // Get initial session
    const { data: { session } } = await sb.auth.getSession();
    if (session) {
      this.session = session;
      this.user = session.user;
      await this._loadProfile();
    }

    // Listen for auth changes
    sb.auth.onAuthStateChange(async (event, session) => {
      this.session = session;
      this.user = session?.user || null;

      if (session?.user) {
        await this._loadProfile();
      } else {
        this.profile = null;
      }

      this._notify(event);
    });
  }

  /**
   * Quick Demo Login for offline/testing mode.
   */
  loginAsDemo(role = Config.ROLES.STAFF) {
    const names = {
      staff: 'Demo Cashier (Staff)',
      admin: 'Demo Admin',
      customer: 'Demo Customer',
    };
    const emails = {
      staff: 'cashier@myshop.com',
      admin: 'admin@myshop.com',
      customer: 'customer@myshop.com',
    };

    const user = {
      id: `demo-${role}-id`,
      email: emails[role] || 'user@myshop.com',
      user_metadata: { full_name: names[role], role },
    };

    const profile = {
      id: user.id,
      full_name: names[role],
      role: role,
      phone: '+91 98765 43210',
    };

    const session = {
      access_token: 'demo-token',
      user,
    };

    this.user = user;
    this.profile = profile;
    this.session = session;

    localStorage.setItem('pos-shop-demo-auth', JSON.stringify({ user, profile, session }));
    showToast(`Logged in as ${names[role]}!`, 'success');
    this._notify('SIGNED_IN');
  }

  /**
   * Load user profile from profiles table.
   */
  async _loadProfile() {
    if (!this.user) return;

    const sb = getSupabase();
    const { data, error } = await sb
      .from('profiles')
      .select('*, stores(name)')
      .eq('id', this.user.id)
      .single();

    if (!error && data) {
      this.profile = data;
    }
  }

  /**
   * Sign up with email and password.
   */
  async signUp(email, password, fullName) {
    const sb = getSupabase();
    if (!sb) return { error: new Error('Not initialized') };

    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: Config.ROLES.CUSTOMER,
        },
      },
    });

    if (error) {
      showToast(error.message, 'error');
      return { error };
    }

    showToast('Account created! Check your email to verify.', 'success');
    return { data };
  }

  /**
   * Sign in with email and password.
   */
  async signIn(email, password) {
    const sb = getSupabase();
    if (!sb) return { error: new Error('Not initialized') };

    const { data, error } = await sb.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      showToast(error.message, 'error');
      return { error };
    }

    showToast('Welcome back!', 'success');
    return { data };
  }

  /**
   * Sign in with Google OAuth.
   */
  async signInWithGoogle() {
    const sb = getSupabase();
    if (!sb) return { error: new Error('Not initialized') };

    const { data, error } = await sb.auth.signInWithOAuth({
      provider: 'google',
    });

    if (error) {
      showToast(error.message, 'error');
    }

    return { data, error };
  }

  /**
   * Sign out.
   */
  async signOut() {
    localStorage.removeItem('pos-shop-demo-auth');
    const sb = getSupabase();
    if (sb) {
      try {
        await sb.auth.signOut();
      } catch (e) {
        // ignore offline error
      }
    }

    this.user = null;
    this.profile = null;
    this.session = null;
    showToast('Signed out successfully', 'info');
    this._notify('SIGNED_OUT');
  }

  /**
   * Reset password.
   */
  async resetPassword(email) {
    const sb = getSupabase();
    if (!sb) return { error: new Error('Not initialized') };

    const { error } = await sb.auth.resetPasswordForEmail(email);
    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Password reset link sent to your email', 'success');
    }
    return { error };
  }

  /**
   * Check if user is authenticated.
   */
  isAuthenticated() {
    return !!this.session;
  }

  /**
   * Get user role.
   */
  getRole() {
    return this.profile?.role || this.user?.user_metadata?.role || Config.ROLES.CUSTOMER;
  }

  /**
   * Check if user has a specific role.
   */
  hasRole(role) {
    return this.getRole() === role;
  }

  /**
   * Check if user is staff or admin.
   */
  isStaff() {
    const role = this.getRole();
    return role === Config.ROLES.STAFF || role === Config.ROLES.ADMIN;
  }

  /**
   * Check if user is admin.
   */
  isAdmin() {
    return this.getRole() === Config.ROLES.ADMIN;
  }

  /**
   * Get display name.
   */
  getDisplayName() {
    return this.profile?.full_name || this.user?.user_metadata?.full_name || this.user?.email || 'Guest';
  }

  /**
   * Get initials for avatar.
   */
  getInitials() {
    const name = this.getDisplayName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  /**
   * Subscribe to auth state changes.
   * @param {Function} callback - (event) => void
   * @returns {Function} unsubscribe function
   */
  onAuthChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Notify all listeners.
   */
  _notify(event) {
    this.listeners.forEach((cb) => cb(event));
  }
}

// Singleton
const auth = new Auth();
export default auth;
