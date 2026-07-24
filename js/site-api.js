// ============================================================
// ONE SQUARE METER INITIATIVE — SHARED API HELPER
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
  }
};
