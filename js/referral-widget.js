// ============================================================
// ONE SQUARE METRE INITIATIVE — REFERRAL SECTION (dashboard)
// ============================================================
// Renders the buyer's referral code, a ready-to-share signup link, and
// their referred count into a standalone section — same visual pattern as
// the Estimated Land Value Growth section (its own <section> + header +
// panel). Requires a logged-in session; call this after the page's own
// auth check has already run.
// ============================================================

async function renderReferralSection(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML =
    '<section class="referral-dash-section">' +
      '<div class="section-header">' +
        '<h2>Refer a Friend</h2>' +
        '<p>Share your code or link — anyone who signs up with it counts toward your referrals.</p>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="stats-bar">' +
          '<div class="stat"><div class="num" id="refDashCode">Loading…</div><div class="lbl">Your referral code</div></div>' +
          '<div class="stat"><div class="num" id="refDashCount">—</div><div class="lbl">People referred</div></div>' +
        '</div>' +

        '<label for="refDashLinkDisplay" style="margin-top:18px;">Your referral link</label>' +
        '<div style="display:flex; gap:8px;">' +
          '<input id="refDashLinkDisplay" type="text" readonly value="Loading…" style="flex:1; font-size:12px;" />' +
          '<button class="btn btn-secondary" id="refDashCopyLinkBtn" type="button" style="white-space:nowrap; padding:0 16px;">Copy Link</button>' +
        '</div>' +
        '<div class="hint">Sharing the link is easiest — it takes them straight to sign up with your code already applied.</div>' +
      '</div>' +
    '</section>';

  const codeEl = container.querySelector('#refDashCode');
  const countEl = container.querySelector('#refDashCount');
  const linkEl = container.querySelector('#refDashLinkDisplay');
  const copyBtn = container.querySelector('#refDashCopyLinkBtn');

  try {
    const result = await OsmiApi.getReferralStats(OsmiAuth.getToken());
    if (result.success) {
      codeEl.textContent = result.code;
      countEl.textContent = String(result.referredCount);
      linkEl.value = window.location.origin + window.location.pathname.replace(/dashboard\.html$/, '') + 'signup.html?ref=' + encodeURIComponent(result.code);
    } else {
      codeEl.textContent = '—';
      linkEl.value = '—';
    }
  } catch (err) {
    codeEl.textContent = '—';
    linkEl.value = '—';
  }

  copyBtn.addEventListener('click', async () => {
    const link = linkEl.value;
    if (!link || link === 'Loading…' || link === '—') return;
    try {
      await navigator.clipboard.writeText(link);
      copyBtn.textContent = 'Copied!';
    } catch (err) {
      copyBtn.textContent = 'Copy failed';
    }
    setTimeout(() => { copyBtn.textContent = 'Copy Link'; }, 1800);
  });
}
