// ============================================================
// ONE SQUARE METRE INITIATIVE — SHARED API HELPER
// ============================================================
// Thin wrappers around fetch() calls to the Apps Script backend.
// IMPORTANT: POST calls deliberately send a plain string body with
// NO explicit Content-Type header. Setting 'Content-Type: application/json'
// would trigger a CORS preflight (an OPTIONS request) that Apps Script
// web apps don't handle, silently breaking the call. Apps Script's
// doPost() still parses the body as JSON regardless of what content
// type the browser labeled it with.
// ============================================================

const OsmiApi = {
  async getPlotNames() {
    const res = await fetch(OSMI_CONFIG.API_URL);
    return res.json();
  },

  async getPlotDetail(query) {
    const res = await fetch(OSMI_CONFIG.API_URL + '?plot=' + encodeURIComponent(query));
    return res.json();
  },

  async getPlotsForCheckout() {
    const res = await fetch(OSMI_CONFIG.API_URL + '?action=getPlotsForCheckout');
    return res.json();
  },

  async initiateCheckout(plotName, sqm) {
    const url = OSMI_CONFIG.API_URL + '?action=initiateCheckout&plotName=' + encodeURIComponent(plotName) + '&sqm=' + encodeURIComponent(sqm);
    const res = await fetch(url);
    return res.json();
  },

  async getPriceHistory(plotName) {
    const url = OSMI_CONFIG.API_URL + '?action=getPriceHistory&plotName=' + encodeURIComponent(plotName);
    const res = await fetch(url);
    return res.json();
  },

  async completePurchase(payload) {
    const res = await fetch(OSMI_CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify(Object.assign({ action: 'completePurchase' }, payload))
    });
    return res.json();
  },

  async submitSellback(payload) {
    const res = await fetch(OSMI_CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify(Object.assign({ action: 'submitSellback' }, payload))
    });
    return res.json();
  },

  async signUp(payload) {
    const res = await fetch(OSMI_CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify(Object.assign({ action: 'signUp' }, payload))
    });
    return res.json();
  },

  async logIn(payload) {
    const res = await fetch(OSMI_CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify(Object.assign({ action: 'logIn' }, payload))
    });
    return res.json();
  },

  async logOut(token) {
    const res = await fetch(OSMI_CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'logOut', token: token })
    });
    return res.json();
  },

  async getMyPlots(token) {
    const res = await fetch(OSMI_CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'getMyPlots', token: token })
    });
    return res.json();
  },

  async verifyEmail(token) {
    const res = await fetch(OSMI_CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'verifyEmail', token: token })
    });
    return res.json();
  },

  async resendVerification(token) {
    const res = await fetch(OSMI_CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'resendVerification', token: token })
    });
    return res.json();
  },

  async requestPasswordReset(email) {
    const res = await fetch(OSMI_CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'requestPasswordReset', email: email })
    });
    return res.json();
  },

  async resetPassword(token, newPassword) {
    const res = await fetch(OSMI_CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'resetPassword', token: token, newPassword: newPassword })
    });
    return res.json();
  },

  async whoAmI(token) {
    const res = await fetch(OSMI_CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'whoAmI', token: token })
    });
    return res.json();
  },

  async updateProfile(payload) {
    const res = await fetch(OSMI_CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify(Object.assign({ action: 'updateProfile' }, payload))
    });
    return res.json();
  },

  async changePassword(payload) {
    const res = await fetch(OSMI_CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify(Object.assign({ action: 'changePassword' }, payload))
    });
    return res.json();
  },

  async getNextOfKin(token) {
    const res = await fetch(OSMI_CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'getNextOfKin', token: token })
    });
    return res.json();
  },

  async updateNextOfKin(payload) {
    const res = await fetch(OSMI_CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify(Object.assign({ action: 'updateNextOfKin' }, payload))
    });
    return res.json();
  },

  async getSubscriberDetails(token) {
    const res = await fetch(OSMI_CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'getSubscriberDetails', token: token })
    });
    return res.json();
  },

  async updateSubscriberDetails(payload) {
    const res = await fetch(OSMI_CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify(Object.assign({ action: 'updateSubscriberDetails' }, payload))
    });
    return res.json();
  },

  async getReferralStats(token) {
    const res = await fetch(OSMI_CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'getReferralStats', token: token })
    });
    return res.json();
  }
};
