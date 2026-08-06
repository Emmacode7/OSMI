// Hero visual option 4 — soft isometric 3D plot; metres rise as blocks.
(function () {
  const root = document.querySelector('.lp-hero-visual');
  const iso = document.querySelector('.lp-iso');
  const board = document.getElementById('isoBoard');
  const world = document.getElementById('isoWorld');
  const stage = document.getElementById('isoStage');
  const countEl = document.getElementById('isoCount');

  if (!root || !iso || !board || !world || !stage) return;

  const mode = root.getAttribute('data-hero-visual') || 'story';
  document.querySelectorAll('.lp-hero-visual [data-visual]').forEach((el) => {
    const on = el.getAttribute('data-visual') === mode;
    if (on) el.removeAttribute('hidden');
    else el.setAttribute('hidden', '');
  });
  if (mode !== 'iso3d') return;

  const COLS = 50;
  const ROWS = 50;
  const OWN_TARGET = 100;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const taken = new Set([0, 1, 8, 9, 7, 15, 56, 57, 63, 55, 48]);
  const ownOrder = [
    27, 28, 35, 36, 19, 20, 29, 37, 26, 34, 43, 44, 21, 45, 18, 46,
  ].filter((i) => !taken.has(i)).slice(0, OWN_TARGET);

  board.style.setProperty('--cols', String(COLS));
  board.style.setProperty('--rows', String(ROWS));

  const cells = [];
  for (let i = 0; i < COLS * ROWS; i++) {
    const cell = document.createElement('div');
    cell.className = 'lp-iso-cell';
    cell.style.setProperty('--r', String(Math.floor(i / COLS)));
    cell.style.setProperty('--c', String(i % COLS));

    const box = document.createElement('div');
    box.className = 'lp-iso-box';
    box.innerHTML =
      '<span class="face top"></span>' +
      '<span class="face front"></span>' +
      '<span class="face side"></span>';

    if (taken.has(i)) {
      cell.classList.add('is-taken');
      box.style.setProperty('--h', '18px');
    } else {
      box.style.setProperty('--h', '6px');
    }

    cell.appendChild(box);
    board.appendChild(cell);
    cells.push({ cell, box });
  }

  let timer = null;
  let running = true;
  let owned = 0;

  function setCount(n) {
    owned = n;
    if (countEl) countEl.textContent = String(n);
  }

  function clearYours() {
    ownOrder.forEach((i) => {
      cells[i].cell.classList.remove('is-yours', 'is-rising');
      cells[i].box.style.setProperty('--h', '6px');
    });
    setCount(0);
  }

  function riseAt(step) {
    if (step >= ownOrder.length) {
      timer = setTimeout(() => {
        if (!running) return;
        clearYours();
        timer = setTimeout(() => riseAt(0), 700);
      }, 2400);
      return;
    }
    const i = ownOrder[step];
    const { cell, box } = cells[i];
    cell.classList.add('is-yours', 'is-rising');
    box.style.setProperty('--h', step % 3 === 0 ? '34px' : '28px');
    setCount(step + 1);
    setTimeout(() => cell.classList.remove('is-rising'), 450);
    timer = setTimeout(() => riseAt(step + 1), 130);
  }

  function start() {
    clearTimeout(timer);
    clearYours();
    if (reduceMotion) {
      ownOrder.forEach((i) => {
        cells[i].cell.classList.add('is-yours');
        cells[i].box.style.setProperty('--h', '28px');
      });
      setCount(ownOrder.length);
      return;
    }
    timer = setTimeout(() => riseAt(0), 500);
  }

  // Soft mouse tilt on the isometric world.
  if (!reduceMotion) {
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;

    function frame() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      // Base isometric pose + subtle tilt
      world.style.transform =
        'rotateX(' +
        (58 + cy * -6).toFixed(2) +
        'deg) rotateZ(' +
        (-42 + cx * 8).toFixed(2) +
        'deg) translate3d(' +
        (cx * 8).toFixed(2) +
        'px, ' +
        (cy * 6).toFixed(2) +
        'px, 0)';
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) {
        raf = requestAnimationFrame(frame);
      } else {
        raf = 0;
      }
    }

    function kick() {
      if (!raf) raf = requestAnimationFrame(frame);
    }

    const track = iso.closest('.lp-hero') || iso;
    track.addEventListener(
      'pointermove',
      (e) => {
        const rect = stage.getBoundingClientRect();
        tx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        ty = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        tx = Math.max(-1, Math.min(1, tx));
        ty = Math.max(-1, Math.min(1, ty));
        kick();
      },
      { passive: true }
    );
    track.addEventListener('pointerleave', () => {
      tx = 0;
      ty = 0;
      kick();
    });
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        running = visible;
        if (visible) start();
        else clearTimeout(timer);
      },
      { threshold: 0.3 }
    );
    io.observe(iso);
  } else {
    start();
  }
})();
