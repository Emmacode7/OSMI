// ============================================================
// ONE SQUARE METRE INITIATIVE — PRICE CHART
// ============================================================
// A small, dependency-free "stock chart" style SVG line chart: filled
// gradient area under the line, a current-price + percent-change header,
// and date labels at each end. Green when price has risen since the first
// point, red if it's fallen (rare in this business model, but handled).
// ============================================================

function renderPriceChart(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const history = (data && data.history) || [];
  if (history.length === 0) {
    container.innerHTML = '<div class="inspector-empty">No price history yet.</div>';
    return;
  }

  const prices = history.map(h => h.price);
  const minPrice = Math.min.apply(null, prices);
  const maxPrice = Math.max.apply(null, prices);
  const priceRange = (maxPrice - minPrice) || 1;

  const firstPrice = history[0].price;
  const currentPrice = (data.currentPricePerSqm != null) ? data.currentPricePerSqm : history[history.length - 1].price;
  const change = currentPrice - firstPrice;
  const changePct = firstPrice > 0 ? (change / firstPrice) * 100 : 0;
  const isUp = change >= 0;
  const lineColor = isUp ? '#1e8449' : '#c0392b';

  const W = 600, H = 200, padX = 12, padY = 18;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  const times = history.map(h => new Date(h.date).getTime());
  const minTime = Math.min.apply(null, times);
  const maxTime = Math.max.apply(null, times);
  const timeRange = (maxTime - minTime) || 1;

  function xFor(i) {
    if (history.length === 1) return padX + innerW / 2;
    return padX + ((times[i] - minTime) / timeRange) * innerW;
  }
  function yFor(price) {
    return padY + innerH - ((price - minPrice) / priceRange) * innerH;
  }

  let points = history.map((h, i) => [xFor(i), yFor(h.price)]);
  if (points.length === 1) {
    points = [[padX, points[0][1]], [W - padX, points[0][1]]];
  }

  const linePath = points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const areaPath = linePath +
    ' L' + points[points.length - 1][0].toFixed(1) + ',' + (H - padY) +
    ' L' + points[0][0].toFixed(1) + ',' + (H - padY) + ' Z';

  const gradId = 'priceGrad_' + containerId;

  function fmtNaira(n) { return '₦' + Number(n).toLocaleString('en-NG'); }
  function fmtDate(d) { return d.toLocaleDateString('en-NG', { year: 'numeric', month: 'short' }); }
  function fmtFullDate(d) { return d.toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' }); }

  const firstDate = new Date(history[0].date);
  const lastDate = new Date(history[history.length - 1].date);

  const dots = history.map((h, i) => {
    const x = points.length === history.length ? points[i][0] : xFor(i);
    const y = points.length === history.length ? points[i][1] : yFor(h.price);
    return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3" fill="' + lineColor + '">' +
      '<title>' + fmtFullDate(new Date(h.date)) + ': ' + fmtNaira(h.price) + '/sqm</title>' +
    '</circle>';
  }).join('');

  container.innerHTML =
    '<div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:10px; flex-wrap:wrap; gap:8px;">' +
      '<div>' +
        '<div style="font-family:\'IBM Plex Mono\', monospace; font-size:22px; font-weight:600; color:var(--ink);">' + fmtNaira(currentPrice) + '</div>' +
        '<div style="font-size:11px; color:var(--ink-faint); text-transform:uppercase; letter-spacing:0.06em;">Current price / sqm</div>' +
      '</div>' +
      '<div style="text-align:right;">' +
        '<div style="font-family:\'IBM Plex Mono\', monospace; font-size:14px; font-weight:600; color:' + lineColor + ';">' + (isUp ? '▲' : '▼') + ' ' + (changePct >= 0 ? '+' : '') + changePct.toFixed(1) + '%</div>' +
        '<div style="font-size:11px; color:var(--ink-faint);">since ' + fmtDate(firstDate) + '</div>' +
      '</div>' +
    '</div>' +
    '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%; height:auto; display:block;">' +
      '<defs><linearGradient id="' + gradId + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="' + lineColor + '" stop-opacity="0.25"/>' +
        '<stop offset="100%" stop-color="' + lineColor + '" stop-opacity="0"/>' +
      '</linearGradient></defs>' +
      '<path d="' + areaPath + '" fill="url(#' + gradId + ')" stroke="none"/>' +
      '<path d="' + linePath + '" fill="none" stroke="' + lineColor + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
      dots +
    '</svg>' +
    '<div style="display:flex; justify-content:space-between; font-size:10.5px; color:var(--ink-faint); font-family:\'IBM Plex Mono\', monospace; margin-top:4px;">' +
      '<span>' + fmtDate(firstDate) + '</span>' +
      '<span>' + fmtDate(lastDate) + '</span>' +
    '</div>';
}
