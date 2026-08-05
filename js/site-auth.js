// ============================================================
// ONE SQUARE METRE INITIATIVE — SHARED AUTH HELPER
// ============================================================
// Manages the logged-in session client-side. The session token and basic
// buyer info live in localStorage — this is a real external website (not
// a Claude artifact), so localStorage is the normal, appropriate place for
// a lightweight session like this.
// ============================================================

const OsmiAuth = {
  TOKEN_KEY: 'osmi_session_token',
  BUYER_KEY: 'osmi_session_buyer',
  _sessionCheckPromise: null,

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
    this._sessionCheckPromise = null;
  },

  clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.BUYER_KEY);
    this._sessionCheckPromise = null;
  },

  /**
   * Validates the current token with the server — but only ONCE per page
   * load no matter how many places ask for it (nav rendering,
   * requireLogin, refreshBuyer, the verification banner all used to fire
   * their own separate whoAmI() calls; now they share one in-flight
   * request). Resolves to:
   *   { ok: true,  buyer }  — confirmed valid session
   *   { ok: false, buyer: null } — server explicitly says invalid/expired
   *   { ok: 'unknown', buyer: <last cached buyer, if any> } — the check
   *     itself failed to complete (network hiccup, slow response). This is
   *     deliberately NOT treated the same as an explicit invalid session —
   *     a flaky connection shouldn't force someone who was genuinely
   *     logged in back to the login page.
   */
  _checkSession() {
    if (this._sessionCheckPromise) return this._sessionCheckPromise;

    const token = this.getToken();
    if (!token) {
      this._sessionCheckPromise = Promise.resolve({ ok: false, buyer: null });
      return this._sessionCheckPromise;
    }

    this._sessionCheckPromise = OsmiApi.whoAmI(token).then((result) => {
      if (result.success) {
        localStorage.setItem(this.BUYER_KEY, JSON.stringify(result.buyer));
        return { ok: true, buyer: result.buyer };
      }
      return { ok: false, buyer: null };
    }).catch(() => {
      return { ok: 'unknown', buyer: this.getBuyer() };
    });

    return this._sessionCheckPromise;
  },

  /**
   * Call at the top of any page that requires login (buy, sell, dashboard,
   * profile). Verifies the session WITH THE SERVER — not just checking that
   * a token happens to be sitting in localStorage — so a genuinely stale
   * or expired token gets cleared and the person is sent to log in again.
   * A transient network/server hiccup, however, no longer forces a logout —
   * only an explicit "this session is invalid" response from the server does.
   */
  async requireLogin() {
    const token = this.getToken();
    if (!token) {
      this._goToLogin();
      return null;
    }
    const { ok, buyer } = await this._checkSession();
    if (ok === false) {
      this.clearSession();
      this._goToLogin();
      return null;
    }
    return buyer;
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
   * since they last logged in here. Shares the same memoized check as
   * everything else on the page.
   */
  async refreshBuyer() {
    if (!this.getToken()) return null;
    const { buyer } = await this._checkSession();
    return buyer || this.getBuyer();
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
 * menu (My Plots / Profile / Log Out) when logged in. Uses the same
 * memoized session check as requireLogin()/refreshBuyer() — on pages that
 * also call requireLogin() (dashboard, profile, buy, sell), this means
 * only ONE whoAmI() request fires for the whole page load, not two.
 * Expects nav links tagged with class="auth-logged-out" or
 * class="auth-logged-in", and an element with id="navLogoutBtn" for the
 * log-out action. Also fills in any element with class="auth-buyer-name".
 */
document.addEventListener('DOMContentLoaded', async () => {
  const { ok, buyer } = await OsmiAuth._checkSession();
  const loggedIn = ok === true || (ok === 'unknown' && !!buyer);

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

document.querySelectorAll(".toggle-password").forEach(button => {

    button.addEventListener("click", () => {

        const input = button.previousElementSibling;
        const icon = button.querySelector("i");

        if (input.type === "password") {
            input.type = "text";
            icon.classList.replace("fa-eye", "fa-eye-slash");
        } else {
            input.type = "password";
            icon.classList.replace("fa-eye-slash", "fa-eye");
        }

    });

});
