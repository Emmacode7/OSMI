// ============================================================
// ONE SQUARE METRE INITIATIVE — ESTIMATED LAND VALUE GROWTH
// ============================================================
// A self-contained, purely illustrative projection widget. Everything it
// shows is derived from the three CONFIG values below — never from the
// site's actual plot prices, price history, checkout logic, or any API
// call. Changing a real plot's price elsewhere on the site has zero effect
// here, and vice versa — that separation is deliberate.
//
// To start a fresh projection cycle (e.g. once 365 days have passed, or
// whenever the underlying assumption should change), just edit
// BASE_PRICE_PER_SQM / START_DATE below — everything else on the page
// recalculates automatically from those two values. Nothing else in this
// file needs to change.
// ============================================================

const VALUE_GROWTH_CONFIG = {
  BASE_PRICE_PER_SQM: 55000,   // ← the tracker's own starting price — independent of the real plot price
  ANNUAL_GROWTH_PERCENT: 30,   // ← projected annual growth used for this illustration
  START_DATE: '2026-07-31'     // ← YYYY-MM-DD. Change this (and the base price above) to begin a new cycle.
};

function renderValueGrowthTracker(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const cfg = VALUE_GROWTH_CONFIG;
  const basePrice = Number(cfg.BASE_PRICE_PER_SQM);
  const growthPct = Number(cfg.ANNUAL_GROWTH_PERCENT);
  const totalIncrease = basePrice * (growthPct / 100);
  const dailyIncrease = totalIncrease / 365;
  const finalValue = basePrice + totalIncrease;

  const msPerDay = 24 * 60 * 60 * 1000;
  const startDate = new Date(cfg.START_DATE + 'T00:00:00');
  const now = new Date();
  const rawDaysElapsed = Math.floor((now.getTime() - startDate.getTime()) / msPerDay);
  // Clamped to [0, 365] for both the math and the display — without this,
  // the "current projected value" would keep climbing past the stated
  // 30%-per-year figure the moment a cycle runs long, which would
  // contradict the "Projected annual growth: 30%" label right next to it.
  const daysElapsed = Math.max(0, Math.min(365, rawDaysElapsed));
  const cycleNotYetStarted = rawDaysElapsed < 0;
  const cycleComplete = rawDaysElapsed >= 365;

  const currentValue = basePrice + dailyIncrease * daysElapsed;
  const progressPercent = (daysElapsed / 365) * 100;

  function fmtNaira(n) {
    return '₦' + Number(n).toLocaleString('en-NG', { maximumFractionDigits: 0 });
  }
  function fmtNairaPrecise(n) {
    return '₦' + Number(n).toLocaleString('en-NG', { maximumFractionDigits: 2 });
  }
  function fmtDate(d) {
    return d.toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  function statBlock(num, lbl) {
    return '<div class="stat"><div class="num">' + num + '</div><div class="lbl">' + lbl + '</div></div>';
  }

  // ---------- chart: a straight projection line from day 0 to day 365, with a marker at "today" ----------
  const W = 600, H = 180, padX = 12, padY = 16;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;
  const chartRange = totalIncrease || 1; // guards against a divide-by-zero if growth is ever configured to 0%

  function xFor(day) { return padX + (day / 365) * innerW; }
  function yFor(value) { return padY + innerH - ((value - basePrice) / chartRange) * innerH; }

  const lineStartX = xFor(0), lineStartY = yFor(basePrice);
  const lineEndX = xFor(365), lineEndY = yFor(finalValue);
  const linePath = 'M' + lineStartX.toFixed(1) + ',' + lineStartY.toFixed(1) + ' L' + lineEndX.toFixed(1) + ',' + lineEndY.toFixed(1);
  const areaPath = linePath + ' L' + lineEndX.toFixed(1) + ',' + (H - padY) + ' L' + lineStartX.toFixed(1) + ',' + (H - padY) + ' Z';

  const markerX = xFor(daysElapsed);
  const markerY = yFor(currentValue);
  const gradId = 'valueGrowthGrad_' + containerId;

  const startDateLabel = fmtDate(startDate);
  const endDateLabel = fmtDate(new Date(startDate.getTime() + 365 * msPerDay));

  let progressNote = progressPercent.toFixed(1) + '% of the way through the projected 365-day cycle.';
  if (cycleNotYetStarted) {
    progressNote = 'This projection cycle begins on ' + startDateLabel + '.';
  } else if (cycleComplete) {
    progressNote = 'This projection cycle is complete. Update the start date and base price above to begin a new one.';
  }

  container.innerHTML =
    '<section class="value-growth-section">' +
      '<div class="section-header">' +
        '<h2>Projected Land Value Growth' +
          '<span style="display:inline-block; margin-left:10px; vertical-align:middle; font-size:10.5px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:var(--orange); background:rgba(242,148,28,0.12); padding:3px 9px; border-radius:20px;">Illustrative</span>' +
        '</h2>' +
        '<p>A projection of how land value could grow under the annual growth assumption.</p>' +
      '</div>' +
      '<div class="panel value-growth-panel">' +

        '<div class="stats-bar value-growth-stats">' +
          statBlock(fmtNaira(basePrice), 'Starting price / sqm') +
          statBlock(growthPct + '%', 'Projected annual growth') +
          statBlock(fmtNairaPrecise(currentValue), 'Current projected value / sqm') +
          statBlock(fmtNairaPrecise(dailyIncrease), 'Estimated daily increase') +
          statBlock(fmtNaira(finalValue), 'Projected value after 365 days') +
          statBlock(daysElapsed + ' / 365', 'Days elapsed') +
        '</div>' +

        '<div class="progress-track" style="margin-top:20px;"><div class="progress-fill" style="width:' + progressPercent.toFixed(1) + '%; background:var(--orange);"></div></div>' +
        '<div class="hint" style="margin-top:6px; text-align:right;">' + progressNote + '</div>' +

        '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%; height:auto; display:block; margin-top:22px;">' +
          '<defs><linearGradient id="' + gradId + '" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="#f2941c" stop-opacity="0.28"/>' +
            '<stop offset="100%" stop-color="#f2941c" stop-opacity="0"/>' +
          '</linearGradient></defs>' +
          '<path d="' + areaPath + '" fill="url(#' + gradId + ')" stroke="none"/>' +
          '<path d="' + linePath + '" fill="none" stroke="#c76f00" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
          '<line x1="' + markerX.toFixed(1) + '" y1="' + padY + '" x2="' + markerX.toFixed(1) + '" y2="' + (H - padY) + '" stroke="#1e8449" stroke-width="1" stroke-dasharray="3,3"/>' +
          '<circle cx="' + markerX.toFixed(1) + '" cy="' + markerY.toFixed(1) + '" r="4.5" fill="#1e8449" stroke="#fff" stroke-width="1.5">' +
            '<title>Day ' + daysElapsed + ': ' + fmtNairaPrecise(currentValue) + '/sqm</title>' +
          '</circle>' +
        '</svg>' +
        '<div style="display:flex; justify-content:space-between; font-size:10.5px; color:var(--ink-faint); font-family:\'IBM Plex Mono\', monospace; margin-top:4px;">' +
          '<span>' + startDateLabel + '</span>' +
          '<span>Today · ' + fmtNairaPrecise(currentValue) + '</span>' +
          '<span>' + endDateLabel + '</span>' +
        '</div>' +

        '<div class="hint value-growth-disclaimer">Illustrative projection based on a ' + growthPct + '% annual growth assumption. This does not represent the current selling price or a guaranteed return.</div>' +
      '</div>' +
    '</section>';
}
