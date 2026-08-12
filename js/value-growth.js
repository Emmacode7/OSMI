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
//
// The chart's marker is draggable (mouse, touch, or pen) — dragging it
// previews the projected value on any day in the cycle. That preview only
// ever lives in memory: a page refresh always comes back to today's real
// value, nothing is saved anywhere.
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
  // the projected value would keep climbing past the stated 30%-per-year
  // figure the moment a cycle runs long.
  const daysElapsed = Math.max(0, Math.min(365, rawDaysElapsed));
  const cycleNotYetStarted = rawDaysElapsed < 0;
  const cycleComplete = rawDaysElapsed >= 365;

  function valueOnDay(day) { return basePrice + dailyIncrease * day; }

  function fmtNaira(n) {
    return '₦' + Number(n).toLocaleString('en-NG', { maximumFractionDigits: 0 });
  }
  function fmtNairaPrecise(n) {
    return '₦' + Number(n).toLocaleString('en-NG', { maximumFractionDigits: 2 });
  }
  function fmtDate(d) {
    return d.toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  function statBlock(id, num, lbl, extra) {
    return '<div class="stat"><div class="num"' + (id ? ' id="' + id + '"' : '') + '>' + num + '</div><div class="lbl">' + lbl + (extra || '') + '</div></div>';
  }

  // ---------- chart geometry: a straight projection line from day 0 to day 365 ----------
  const W = 600, H = 180, padX = 12, padY = 16;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;
  const chartRange = totalIncrease || 1; // guards a divide-by-zero if growth is ever configured to 0%

  function xFor(day) { return padX + (day / 365) * innerW; }
  function yFor(value) { return padY + innerH - ((value - basePrice) / chartRange) * innerH; }
  function dayForSvgX(svgX) {
    const raw = ((svgX - padX) / innerW) * 365;
    return Math.max(0, Math.min(365, Math.round(raw)));
  }

  const lineStartX = xFor(0), lineStartY = yFor(basePrice);
  const lineEndX = xFor(365), lineEndY = yFor(finalValue);
  const linePath = 'M' + lineStartX.toFixed(1) + ',' + lineStartY.toFixed(1) + ' L' + lineEndX.toFixed(1) + ',' + lineEndY.toFixed(1);
  const areaPath = linePath + ' L' + lineEndX.toFixed(1) + ',' + (H - padY) + ' L' + lineStartX.toFixed(1) + ',' + (H - padY) + ' Z';

  const gradId = 'valueGrowthGrad_' + containerId;
  const startDateLabel = fmtDate(startDate);
  const endDateLabel = fmtDate(new Date(startDate.getTime() + 365 * msPerDay));

  let baseProgressNote = (daysElapsed / 365 * 100).toFixed(1) + '% of the way through the projected 365-day cycle.';
  if (cycleNotYetStarted) {
    baseProgressNote = 'This projection cycle begins on ' + startDateLabel + '.';
  } else if (cycleComplete) {
    baseProgressNote = 'This projection cycle is complete. Update the start date and base price above to begin a new one.';
  }

  const initialX = xFor(daysElapsed).toFixed(1);
  const initialY = yFor(valueOnDay(daysElapsed)).toFixed(1);

  container.innerHTML =
    '<section class="value-growth-section">' +
      '<div class="section-header">' +
        '<h2>Projected Land Value Growth' +
          '<span style="display:inline-block; margin-left:10px; vertical-align:middle; font-size:10.5px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:var(--orange); background:rgba(242,148,28,0.12); padding:3px 9px; border-radius:20px;">Illustrative</span>' +
        '</h2>' +
        '<p>A projection of how your land value could grow</p>' +
      '</div>' +
      '<div class="panel value-growth-panel">' +

        '<div class="stats-bar value-growth-stats">' +
          statBlock(null, fmtNaira(basePrice), 'Starting price / sqm') +
          statBlock('vgCurrentValue', fmtNairaPrecise(valueOnDay(daysElapsed)), 'Projected value / sqm', ' <span style="opacity:0.7;">· drag chart</span>') +
          statBlock(null, fmtNaira(finalValue), 'Projected value after 365 days') +
        '</div>' +

        '<div class="progress-track" style="margin-top:20px;"><div class="progress-fill" id="vgProgressFill" style="width:' + (daysElapsed / 365 * 100).toFixed(1) + '%; background:var(--orange);"></div></div>' +
        '<div class="hint" id="vgProgressNote" style="margin-top:6px; text-align:right;">' + baseProgressNote + ' <a href="#" id="vgResetLink" style="display:none; color:var(--green-dark); font-weight:600;">Reset to today</a></div>' +

        '<div class="hint" style="margin-top:14px; text-align:center; letter-spacing:0.02em;">Drag the marker on the chart to preview any day\'s projected value</div>' +

        '<svg id="vgSvg" viewBox="0 0 ' + W + ' ' + H + '" style="width:100%; height:auto; display:block; margin-top:10px;">' +
          '<defs><linearGradient id="' + gradId + '" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="#f2941c" stop-opacity="0.28"/>' +
            '<stop offset="100%" stop-color="#f2941c" stop-opacity="0"/>' +
          '</linearGradient></defs>' +
          '<path d="' + areaPath + '" fill="url(#' + gradId + ')" stroke="none"/>' +
          '<path d="' + linePath + '" fill="none" stroke="#c76f00" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
          '<line id="vgMarkerLine" x1="' + initialX + '" y1="' + padY + '" x2="' + initialX + '" y2="' + (H - padY) + '" stroke="#1e8449" stroke-width="1" stroke-dasharray="3,3"/>' +
          '<circle id="vgMarkerHit" cx="' + initialX + '" cy="' + initialY + '" r="16" fill="transparent" style="cursor:grab; touch-action:none;"></circle>' +
          '<circle id="vgMarkerDot" cx="' + initialX + '" cy="' + initialY + '" r="4.5" fill="#1e8449" stroke="#fff" stroke-width="1.5" style="pointer-events:none;"></circle>' +
        '</svg>' +
        '<div style="display:flex; justify-content:space-between; font-size:10.5px; color:var(--ink-faint); font-family:\'IBM Plex Mono\', monospace; margin-top:4px;">' +
          '<span>' + startDateLabel + '</span>' +
          '<span id="vgTodayLabel">Today · ' + fmtNairaPrecise(valueOnDay(daysElapsed)) + '</span>' +
          '<span>' + endDateLabel + '</span>' +
        '</div>' +

        '<div class="hint value-growth-disclaimer">Illustrative projection based on a ' + growthPct + '% annual growth assumption. This does not represent the current selling price or a guaranteed return.</div>' +
      '</div>' +
    '</section>';

  // ---------- interactivity: drag the marker to preview any day ----------
  const svgEl = container.querySelector('#vgSvg');
  const hitEl = container.querySelector('#vgMarkerHit');
  const dotEl = container.querySelector('#vgMarkerDot');
  const lineEl = container.querySelector('#vgMarkerLine');
  const currentValueEl = container.querySelector('#vgCurrentValue');
  const progressFillEl = container.querySelector('#vgProgressFill');
  const progressNoteEl = container.querySelector('#vgProgressNote');
  const resetLinkEl = container.querySelector('#vgResetLink');
  const todayLabelEl = container.querySelector('#vgTodayLabel');

  function setDisplayDay(day) {
    const value = valueOnDay(day);
    const x = xFor(day).toFixed(1);
    const y = yFor(value).toFixed(1);

    hitEl.setAttribute('cx', x);
    hitEl.setAttribute('cy', y);
    dotEl.setAttribute('cx', x);
    dotEl.setAttribute('cy', y);
    lineEl.setAttribute('x1', x);
    lineEl.setAttribute('x2', x);

    currentValueEl.textContent = fmtNairaPrecise(value);

    const pct = (day / 365) * 100;
    progressFillEl.style.width = pct.toFixed(1) + '%';

    const isToday = day === daysElapsed;
    todayLabelEl.textContent = (isToday ? 'Today' : 'Day ' + day) + ' · ' + fmtNairaPrecise(value);
    progressNoteEl.firstChild.textContent = isToday
      ? baseProgressNote + ' '
      : pct.toFixed(1) + '% — previewing day ' + day + ' of 365. ';
    resetLinkEl.style.display = isToday ? 'none' : 'inline';
  }

  function svgXFromClientX(clientX) {
    const pt = svgEl.createSVGPoint();
    pt.x = clientX;
    pt.y = 0;
    const ctm = svgEl.getScreenCTM();
    if (!ctm) return null;
    return pt.matrixTransform(ctm.inverse()).x;
  }

  let dragging = false;

  function onPointerDown(e) {
    dragging = true;
    hitEl.style.cursor = 'grabbing';
    if (hitEl.setPointerCapture) {
      try { hitEl.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
    onPointerMove(e);
    e.preventDefault();
  }
  function onPointerMove(e) {
    if (!dragging) return;
    const svgX = svgXFromClientX(e.clientX);
    if (svgX === null) return;
    setDisplayDay(dayForSvgX(svgX));
    e.preventDefault();
  }
  function onPointerUp() {
    dragging = false;
    hitEl.style.cursor = 'grab';
  }

  hitEl.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);

  resetLinkEl.addEventListener('click', function (e) {
    e.preventDefault();
    setDisplayDay(daysElapsed);
  });
}
