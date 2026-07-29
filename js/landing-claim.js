// Hero visual option 3 — interactive “claim a metre”.
(function () {
  const root = document.querySelector('.lp-hero-visual');
  const claim = document.querySelector('.lp-claim');
  const gridEl = document.getElementById('claimGrid');
  const countEl = document.getElementById('claimCount');
  const totalEl = document.getElementById('claimTotal');
  const hintEl = document.getElementById('claimHint');
  const toastEl = document.getElementById('claimToast');
  const resetBtn = document.getElementById('claimReset');

  if (!root || !claim || !gridEl) return;

  const mode = root.getAttribute('data-hero-visual') || 'story';
  // Visibility is also set by landing-story.js; reinforce here for load order safety.
  document.querySelectorAll('.lp-hero-visual [data-visual]').forEach((el) => {
    const on = el.getAttribute('data-visual') === mode;
    if (on) el.removeAttribute('hidden');
    else el.setAttribute('hidden', '');
  });
  if (mode !== 'claim') return;

  const COLS = 10;
  const ROWS = 8;
  const PRICE = 40000;
  const MIN_HINT = 5;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Pre-claimed by others — not selectable.
  const taken = new Set([
    0, 1, 2, 10, 11, 20, 8, 9, 18, 19, 28, 29, 70, 71, 72, 73, 79, 69, 59,
  ]);

  gridEl.style.setProperty('--cols', String(COLS));
  gridEl.style.setProperty('--rows', String(ROWS));

  const selected = new Set();
  const cells = [];
  let toastTimer = null;

  function formatNaira(n) {
    return '₦' + Math.round(n).toLocaleString('en-NG');
  }

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('is-on');
      toastEl.hidden = true;
    }, 1400);
  }

  function sync() {
    const n = selected.size;
    if (countEl) countEl.textContent = String(n);
    if (totalEl) totalEl.textContent = formatNaira(n * PRICE);
    claim.classList.toggle('has-selection', n > 0);
    if (hintEl) {
      if (n === 0) {
        hintEl.textContent =
          'Tap empty squares to lock them in. Click again to release.';
      } else if (n < MIN_HINT) {
        hintEl.textContent =
          n +
          ' sqm selected — purchases start from ' +
          MIN_HINT +
          ' sqm on checkout.';
      } else {
        hintEl.textContent =
          'Nice — ' + n + ' sqm ready. Create an account to make them yours.';
      }
    }
  }

  for (let i = 0; i < COLS * ROWS; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lp-claim-cell';
    btn.dataset.index = String(i);

    if (taken.has(i)) {
      btn.classList.add('is-taken');
      btn.disabled = true;
      btn.setAttribute('aria-label', 'Already claimed');
      btn.title = 'Already claimed';
    } else {
      btn.setAttribute('aria-label', 'Available square metre');
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', () => {
        if (selected.has(i)) {
          selected.delete(i);
          btn.classList.remove('is-yours', 'is-pop');
          btn.setAttribute('aria-pressed', 'false');
          btn.setAttribute('aria-label', 'Available square metre');
        } else {
          selected.add(i);
          btn.classList.add('is-yours');
          btn.setAttribute('aria-pressed', 'true');
          btn.setAttribute('aria-label', 'Your selected square metre');
          if (!reduceMotion) {
            btn.classList.remove('is-pop');
            // Retrigger pop animation.
            void btn.offsetWidth;
            btn.classList.add('is-pop');
          }
          showToast('Metre locked');
        }
        sync();
      });
    }

    gridEl.appendChild(btn);
    cells.push(btn);
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      selected.forEach((i) => {
        const btn = cells[i];
        btn.classList.remove('is-yours', 'is-pop');
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('aria-label', 'Available square metre');
      });
      selected.clear();
      sync();
      showToast('Selection cleared');
    });
  }

  sync();
})();
