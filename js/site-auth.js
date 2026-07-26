// ============================================================
// ONE SQUARE METER INITIATIVE — SHARED AUTH HELPER
// ============================================================
// Manages the logged-in session client-side. The session token and basic
// buyer info live in localStorage — this is a real external website (not
// a Claude artifact), so localStorage is the normal, appropriate place for
// a lightweight session like this.
// ============================================================

const OsmiAuth = {
  TOKEN_KEY: 'osmi_session_token',
  BUYER_KEY: 'osmi_session_buyer',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  getBuyer() {
    try {
      const raw = localStorage.getItem(this.BUYER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  setSession(token, buyer) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.BUYER_KEY, JSON.stringify(buyer));
  },

  clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.BUYER_KEY);
  },

  /**
   * Call at the top of any page that requires login (buy, sell, dashboard,
   * profile). Verifies the session WITH THE SERVER — not just checking that
   * a token happens to be sitting in localStorage — so a stale or expired
   * token gets cleared and the person is sent to log in again, instead of
   * silently landing on a page that only fails once they try to act on it.
   */
  async requireLogin() {
    const token = this.getToken();
    if (!token) {
      this._goToLogin();
      return null;
    }
    try {
      const result = await OsmiApi.whoAmI(token);
      if (result.success) {
        localStorage.setItem(this.BUYER_KEY, JSON.stringify(result.buyer));
        return result.buyer;
      }
    } catch (e) { /* treat as invalid below, same as an explicit failure */ }
    this.clearSession();
    this._goToLogin();
    return null;
  },

  _goToLogin() {
    const here = window.location.pathname.split('/').pop() || 'index.html';
    window.location.href = 'login.html?next=' + encodeURIComponent(here);
  },

  async logOut() {
    const token = this.getToken();
    this.clearSession();
    if (token) {
      try { await OsmiApi.logOut(token); } catch (e) { /* best effort — session is cleared client-side regardless */ }
    }
    window.location.href = 'index.html';
  },

  /**
   * Re-fetches this buyer's current record from the server and updates the
   * local cache — used on pages that care about fresh verification status,
   * in case the person verified their email in a different tab/session
   * since they last logged in here.
   */
  async refreshBuyer() {
    const token = this.getToken();
    if (!token) return null;
    try {
      const result = await OsmiApi.whoAmI(token);
      if (result.success) {
        localStorage.setItem(this.BUYER_KEY, JSON.stringify(result.buyer));
        return result.buyer;
      }
    } catch (e) { /* keep whatever's cached */ }
    return this.getBuyer();
  },

  /**
   * Renders a "please verify your email" banner into the given container
   * if (and only if) the logged-in buyer isn't verified yet. Call this on
   * pages that gate real actions on verification (buy, sell) or that
   * should just remind the person (dashboard). Safe to call even if the
   * buyer turns out to already be verified — it just renders nothing.
   */
  async renderVerificationBanner(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const buyer = await this.refreshBuyer();
    if (!buyer || buyer.emailVerified) {
      container.innerHTML = '';
      return;
    }
    container.innerHTML =
      '<div class="status show pending" style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">' +
        '<span>Please verify your email (' + buyer.email + ') before buying or selling back — check your inbox for the link.</span>' +
        '<button type="button" id="resendVerifyBtn" class="btn btn-secondary" style="padding:8px 14px; font-size:12.5px;">Resend email</button>' +
      '</div>';
    const btn = document.getElementById('resendVerifyBtn');
    if (btn) {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = 'Sending…';
        try {
          const result = await OsmiApi.resendVerification(this.getToken());
          btn.textContent = result.success ? 'Sent!' : 'Try again';
        } catch (e) {
          btn.textContent = 'Try again';
        }
        btn.disabled = false;
      });
    }
  }
};

/**
 * Shared nav rendering: shows Login/Sign Up when logged out, an account
 * menu (My Plots / Profile / Log Out) when logged in. Validates the
 * session WITH THE SERVER on every page load rather than just trusting
 * that a token happens to be sitting in localStorage — a stale or expired
 * token (e.g. left over from earlier testing, or past its 30-day expiry)
 * gets cleared automatically, so the nav can't get stuck in a state that
 * doesn't match reality. Expects nav links tagged with
 * class="auth-logged-out" or class="auth-logged-in", and an element with
 * id="navLogoutBtn" for the log-out action. Also fills in any element with
 * class="auth-buyer-name".
 */
document.addEventListener('DOMContentLoaded', async () => {
  let loggedIn = false;
  let buyer = null;

  const token = OsmiAuth.getToken();
  if (token) {
    try {
      const result = await OsmiApi.whoAmI(token);
      if (result.success) {
        loggedIn = true;
        buyer = result.buyer;
        localStorage.setItem(OsmiAuth.BUYER_KEY, JSON.stringify(buyer));
      } else {
        OsmiAuth.clearSession();
      }
    } catch (e) {
      // Network hiccup — don't force a logged-out flash on a flaky
      // connection; fall back to trusting the last locally cached state.
      loggedIn = OsmiAuth.isLoggedIn();
      buyer = OsmiAuth.getBuyer();
    }
  }

  document.querySelectorAll('.auth-logged-out').forEach(el => {
    el.style.setProperty('display', loggedIn ? 'none' : (el.dataset.show || 'inline-block'), 'important');
  });
  document.querySelectorAll('.auth-logged-in').forEach(el => {
    el.style.setProperty('display', loggedIn ? (el.dataset.show || 'inline-block') : 'none', 'important');
  });

  if (loggedIn && buyer && buyer.name) {
    document.querySelectorAll('.auth-buyer-name').forEach(el => {
      el.textContent = buyer.name.split(' ')[0];
    });
  }

  const logoutBtn = document.getElementById('navLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      OsmiAuth.logOut();
    });
  }

  const trigger = document.getElementById('navAccountTrigger');
  const menu = document.getElementById('navAccountMenu');
  if (trigger && menu) {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && e.target !== trigger) {
        menu.classList.remove('open');
      }
    });
  }
});
