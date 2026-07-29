// Hero plot-grid animation — metres claim one by one, with subtle parallax.
// Option 1 — only runs when data-hero-visual="grid".
(function () {
  const root = document.querySelector('.lp-hero-visual');
  const grid = document.getElementById('plotGrid');
  const countEl = document.getElementById('plotOwnedCount');
  if (!grid || !countEl) return;

  const mode = (root && root.getAttribute('data-hero-visual')) || 'story';
  if (mode !== 'grid') return;

  const plot = grid.closest('.lp-plot');
  const stage = plot && plot.querySelector('.lp-plot-stage');
  const hero = plot && plot.closest('.lp-hero');

  const COLS = 10;
  const ROWS = 8;
  const TOTAL = COLS * ROWS;
  const OWN_TARGET = 18;
  const CLAIM_DELAY_MS = 110;
  const HOLD_MS = 2200;
  const RESET_MS = 700;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const claimedSet = new Set([
    2, 3, 12, 13, 22, 31, 40, 41, 50, 51, 52, 61, 70, 71, 7, 17, 27, 37, 47, 57,
  ]);

  const ownOrder = [
    33, 34, 43, 44, 35, 45, 53, 54, 42, 32, 24, 25, 26, 36, 46, 55, 63, 64,
  ].filter((i) => !claimedSet.has(i)).slice(0, OWN_TARGET);

  grid.style.setProperty('--cols', String(COLS));
  grid.style.setProperty('--rows', String(ROWS));

  const cells = [];
  for (let i = 0; i < TOTAL; i++) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'lp-plot-cell';
    cell.tabIndex = -1;
    cell.setAttribute('aria-hidden', 'true');
    if (claimedSet.has(i)) cell.classList.add('is-claimed');
    grid.appendChild(cell);
    cells.push(cell);
  }

  let timer = null;
  let running = true;

  function setCount(n) {
    countEl.textContent = String(n);
  }

  function clearYours() {
    ownOrder.forEach((i) => {
      cells[i].classList.remove('is-yours', 'is-pulse');
    });
    setCount(0);
  }

  function claimAt(step) {
    if (step >= ownOrder.length) {
      timer = setTimeout(resetAndReplay, HOLD_MS);
      return;
    }
    const idx = ownOrder[step];
    const cell = cells[idx];
    cell.classList.add('is-yours', 'is-pulse');
    setCount(step + 1);
    setTimeout(() => cell.classList.remove('is-pulse'), 420);
    timer = setTimeout(() => claimAt(step + 1), CLAIM_DELAY_MS);
  }

  function resetAndReplay() {
    if (!running) return;
    clearYours();
    timer = setTimeout(() => claimAt(0), RESET_MS);
  }

  function start() {
    clearTimeout(timer);
    clearYours();
    if (reduceMotion) {
      ownOrder.forEach((i) => cells[i].classList.add('is-yours'));
      setCount(ownOrder.length);
      return;
    }
    timer = setTimeout(() => claimAt(0), 400);
  }

  if (stage && !reduceMotion) {
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId = 0;
    let pointerActive = false;

    function applyParallax() {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      stage.style.setProperty('--parallax-x', currentX.toFixed(4));
      stage.style.setProperty('--parallax-y', currentY.toFixed(4));

      if (
        Math.abs(targetX - currentX) > 0.001 ||
        Math.abs(targetY - currentY) > 0.001
      ) {
        rafId = requestAnimationFrame(applyParallax);
      } else {
        rafId = 0;
      }
    }

    function kickParallax() {
      if (!rafId) rafId = requestAnimationFrame(applyParallax);
    }

    function setFromPointer(clientX, clientY) {
      const rect = stage.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((clientY - rect.top) / rect.height) * 2 - 1;
      targetX = Math.max(-1, Math.min(1, x));
      targetY = Math.max(-1, Math.min(1, y));
      kickParallax();
    }

    const trackEl = hero || plot;
    trackEl.addEventListener(
      'pointermove',
      (e) => {
        pointerActive = true;
        setFromPointer(e.clientX, e.clientY);
      },
      { passive: true }
    );

    trackEl.addEventListener('pointerleave', () => {
      pointerActive = false;
      targetX = 0;
      targetY = 0;
      kickParallax();
    });

    window.addEventListener(
      'scroll',
      () => {
        if (pointerActive || !running) return;
        const rect = stage.getBoundingClientRect();
        const mid = window.innerHeight * 0.5;
        const offset = (rect.top + rect.height * 0.5 - mid) / window.innerHeight;
        targetY = Math.max(-0.35, Math.min(0.35, offset * 0.6));
        targetX = targetX * 0.92;
        kickParallax();
      },
      { passive: true }
    );
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        running = visible;
        if (visible) start();
        else clearTimeout(timer);
      },
      { threshold: 0.35 }
    );
    io.observe(plot || grid);
  } else {
    start();
  }
})();
