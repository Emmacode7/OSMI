// ============================================================
// ONE SQUARE METRE INITIATIVE — SITE CONFIG
// ============================================================
// This is the ONLY file you need to edit to connect the site to
// its backend. Every page reads from this one spot.
//
// Live backend: Node/Express on Render (osmi-backend service).
// The old Apps Script /exec URL is kept live as a dormant fallback —
// see the project notes for the rollback procedure if this URL ever
// needs to be reverted.
// ============================================================

const OSMI_CONFIG = {
  API_URL: 'https://osmi-backend.onrender.com',
  PAYSTACK_PUBLIC_KEY: 'pk_live_6481a0af0583dc67dcf53dfa42c6823310a25ea9',
  CURRENCY: 'NGN'
};