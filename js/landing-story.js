// Hero visual option 2 — empty land → survey grid → metres → certificate.
(function () {
  const root = document.querySelector('.lp-hero-visual');
  const story = document.querySelector('.lp-story');
  const stage = document.getElementById('storyStage');
  const gridEl = document.getElementById('storyGrid');
  const titleEl = document.getElementById('storyTitle');
  const captionEl = document.getElementById('storyCaption');
  const phasesEl = document.getElementById('storyPhases');
  const certSqm = document.getElementById('storyCertSqm');

  if (!root || !story || !stage || !gridEl) return;

  // Activate the correct option; keep the other in the DOM for easy switching.
  const mode = root.getAttribute('data-hero-visual') || 'story';
  document.querySelectorAll('.lp-hero-visual [data-visual]').forEach((el) => {
    const on = el.getAttribute('data-visual') === mode;
    if (on) el.removeAttribute('hidden');
    else el.setAttribute('hidden', '');
  });
  if (mode !== 'story') return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLS = 10;
  const ROWS = 8;
  const OWN_COUNT = 12;

  const copy = {
    land: {
      title: 'Empty land',
      caption: 'A real, mapped plot — waiting to be subdivided.',
    },
    grid: {
      title: 'Surveyed into metres',
      caption: 'The plot is split into individual square metres you can buy.',
    },
    own: {
      title: 'Your metres, claimed',
      caption: 'Buy what you can now — ownership grows one square metre at a time.',
    },
    cert: {
      title: 'Ownership recorded',
      caption: 'Your allocation is logged and ready on your dashboard.',
    },
  };

  // Build survey cells once.
  gridEl.style.setProperty('--cols', String(COLS));
  gridEl.style.setProperty('--rows', String(ROWS));
  const cells = [];
  for (let i = 0; i < COLS * ROWS; i++) {
    const cell = document.createElement('span');
    cell.className = 'lp-story-cell';
    gridEl.appendChild(cell);
    cells.push(cell);
  }

  // Contiguous cluster near centre for “yours”.
  const ownOrder = [
    33, 34, 43, 44, 35, 45, 42, 32, 24, 25, 36, 46, 53, 54, 26, 55,
  ].slice(0, OWN_COUNT);

  if (certSqm) certSqm.textContent = OWN_COUNT + ' sqm';

  let timer = null;
  let running = true;
  let phaseTimers = [];

  function clearPhaseTimers() {
    phaseTimers.forEach(clearTimeout);
    phaseTimers = [];
  }

  function setPhase(name) {
    stage.dataset.phase = name;
    if (titleEl) titleEl.textContent = copy[name].title;
    if (captionEl) captionEl.textContent = copy[name].caption;
    if (phasesEl) {
      phasesEl.querySelectorAll('[data-phase]').forEach((li) => {
        li.classList.toggle('is-active', li.getAttribute('data-phase') === name);
      });
    }
  }

  function clearOwned() {
    cells.forEach((c) => c.classList.remove('is-yours', 'is-pulse'));
  }

  function claimMetres(done) {
    let step = 0;
    function next() {
      if (!running) return;
      if (step >= ownOrder.length) {
        if (done) done();
        return;
      }
      const cell = cells[ownOrder[step]];
      cell.classList.add('is-yours', 'is-pulse');
      setTimeout(() => cell.classList.remove('is-pulse'), 380);
      step += 1;
      phaseTimers.push(setTimeout(next, 95));
    }
    next();
  }

  function runCycle() {
    clearTimeout(timer);
    clearPhaseTimers();
    clearOwned();
    setPhase('land');

    if (reduceMotion) {
      setPhase('cert');
      ownOrder.forEach((i) => cells[i].classList.add('is-yours'));
      return;
    }

    // land → grid → own → cert → hold → loop
    phaseTimers.push(
      setTimeout(() => {
        setPhase('grid');
      }, 2200)
    );

    phaseTimers.push(
      setTimeout(() => {
        setPhase('own');
        claimMetres(() => {
          phaseTimers.push(
            setTimeout(() => {
              setPhase('cert');
              timer = setTimeout(() => {
                if (running) runCycle();
              }, 3200);
            }, 500)
          );
        });
      }, 4000)
    );
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        running = visible;
        if (visible) runCycle();
        else {
          clearTimeout(timer);
          clearPhaseTimers();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(story);
  } else {
    runCycle();
  }
})();
