/* Aleksandra Bocheva · arcade edition */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ───────── Achievements ───────── */
  const ACH = [
    { id: 'start',     icon: '▶️', name: 'Press Start',        desc: 'Began the adventure' },
    { id: 'character', icon: '🧙', name: 'Character Inspected', desc: 'Read the character sheet' },
    { id: 'quests',    icon: '📜', name: 'Quest Log Read',      desc: 'Followed the route so far' },
    { id: 'boss',      icon: '💘', name: 'Boss Encountered',    desc: 'Entered the thesis level' },
    { id: 'game',      icon: '🎯', name: 'Model Whisperer',     desc: 'Played a round against the model' },
    { id: 'power',     icon: '⚡', name: 'Power Player',        desc: 'Toggled a predictor power-up' },
    { id: 'victory',   icon: '🏆', name: 'Boss Defeated',       desc: 'Reached the end of the thesis' },
    { id: 'trophies',  icon: '🏅', name: 'Trophy Hunter',       desc: 'Visited the trophy room' },
    { id: 'contact',   icon: '🪙', name: 'Completionist',       desc: 'Made it to the continue screen' },
    { id: 'konami',    icon: '🕹️', name: 'Secret Code',         desc: '↑↑↓↓←→←→BA', secret: true },
  ];
  const got = new Set();
  const achCount = $('#ach-count');
  const achList = $('#ach-list');
  const trophyBtn = $('#trophy-btn');
  const achPanel = $('#ach-panel');
  $('#ach-total').textContent = ACH.length;

  function renderAch() {
    achList.innerHTML = '';
    ACH.forEach(a => {
      const li = document.createElement('li');
      const has = got.has(a.id);
      if (has) li.className = 'got';
      const hidden = a.secret && !has;
      li.innerHTML = `<span class="ai">${hidden ? '❔' : a.icon}</span><span><strong>${hidden ? '???' : a.name}</strong><br>${hidden ? 'A secret…' : a.desc}</span>`;
      achList.appendChild(li);
    });
    achCount.textContent = got.size;
  }

  function unlock(id) {
    if (got.has(id)) return;
    const a = ACH.find(x => x.id === id);
    if (!a) return;
    got.add(id);
    renderAch();
    trophyBtn.classList.remove('bump'); void trophyBtn.offsetWidth; trophyBtn.classList.add('bump');
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span class="ti">${a.icon}</span><div><b>ACHIEVEMENT UNLOCKED</b><span>${a.name}</span></div>`;
    $('#toasts').appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, 2800);
  }

  trophyBtn.addEventListener('click', () => { achPanel.hidden = !achPanel.hidden; });
  $('#ach-close').addEventListener('click', () => { achPanel.hidden = true; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') achPanel.hidden = true; });
  renderAch();

  $('#press-start').addEventListener('click', () => unlock('start'));

  /* ───────── Starfield ───────── */
  const canvas = $('#stars');
  const ctx = canvas.getContext('2d');
  let stars = [], W = 0, H = 0, DPR = 1;
  const COLORS = ['#ffffff', '#c9b3ff', '#4fe3d1', '#ff6fb5', '#ffd166'];

  function makeStars() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const n = Math.round((W * H) / 7000);
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      s: Math.random() < 0.85 ? 2 : 3,
      d: 0.05 + Math.random() * 0.35,           // parallax depth
      c: COLORS[Math.random() < 0.7 ? 0 : 1 + Math.floor(Math.random() * 4)],
      t: Math.random() * Math.PI * 2,
      sp: 0.5 + Math.random() * 1.5,
    }));
  }
  function drawStars(time = 0) {
    ctx.clearRect(0, 0, W, H);
    const sy = window.scrollY;
    for (const st of stars) {
      const y = ((st.y - sy * st.d) % H + H) % H;
      const a = reduceMotion ? 0.7 : 0.35 + 0.65 * Math.abs(Math.sin(st.t + time * 0.001 * st.sp));
      ctx.globalAlpha = a;
      ctx.fillStyle = st.c;
      ctx.fillRect(Math.round(st.x), Math.round(y), st.s, st.s);
    }
    ctx.globalAlpha = 1;
  }
  function loop(t) { drawStars(t); requestAnimationFrame(loop); }
  makeStars();
  window.addEventListener('resize', makeStars);
  if (reduceMotion) { drawStars(); window.addEventListener('scroll', () => drawStars(), { passive: true }); }
  else requestAnimationFrame(loop);

  /* ───────── Typewriter ───────── */
  const tw = $('#typewriter');
  const phrases = [
    'Computational Social Scientist',
    'Machine Learning × Sociology',
    'Discrete-Choice Modeller',
    'Data Researcher',
    'Partner-Choice Predictor',
  ];
  if (!reduceMotion) {
    let pi = 0, ci = phrases[0].length, deleting = true;
    const tick = () => {
      const p = phrases[pi];
      if (deleting) {
        ci--;
        if (ci <= 0) { deleting = false; pi = (pi + 1) % phrases.length; }
      } else {
        ci++;
      }
      tw.textContent = phrases[pi].slice(0, ci);
      let delay = deleting ? 35 : 70;
      if (!deleting && ci === phrases[pi].length) { deleting = true; delay = 2200; }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 2600);
  }

  /* ───────── HUD: XP bar, level, active nav ───────── */
  const xpFill = $('#xp-fill');
  const xpLabel = $('#xp-label');
  const hudLevel = $('#hud-level');
  const sections = $$('section[data-level]');
  const navLinks = $$('.hud-nav a');
  const bossFill = $('#boss-hp-fill');
  const thesis = $('#thesis');
  const timeline = $('#timeline');
  const tlFill = $('#timeline-fill');

  function onScroll() {
    const sy = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? clamp(sy / max, 0, 1) : 0;
    xpFill.style.width = (p * 100).toFixed(2) + '%';
    xpLabel.textContent = 'XP ' + Math.round(p * 9999).toString().padStart(4, '0');

    if (sy > 160) unlock('start');

    // current level
    const mid = window.innerHeight * 0.35;
    let current = sections[0];
    for (const s of sections) if (s.getBoundingClientRect().top <= mid) current = s;
    if (hudLevel.textContent !== current.dataset.level) hudLevel.textContent = current.dataset.level;
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current.id));

    // timeline fill
    const tr = timeline.getBoundingClientRect();
    const tp = clamp((window.innerHeight * 0.6 - tr.top) / tr.height, 0, 1);
    tlFill.style.height = (tp * 100) + '%';

    // boss HP
    const br = thesis.getBoundingClientRect();
    const bp = clamp((window.innerHeight * 0.75 - br.top) / br.height, 0, 1);
    bossFill.style.width = ((1 - bp) * 100).toFixed(1) + '%';
    if (bp > 0.97) unlock('victory');
  }
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(() => { onScroll(); ticking = false; }); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ───────── Reveal + section achievements ───────── */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('in');
      io.unobserve(el);
      $$('.stat-bar i, .race-bar i', el).forEach(i => { i.style.width = i.dataset.w * (i.closest('.race-bar') ? 2 : 1) + '%'; });
      $$('[data-count]', el).forEach(countUp);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  const secIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const map = { character: 'character', quests: 'quests', thesis: 'boss', trophies: 'trophies', contact: 'contact' };
      if (map[e.target.id]) unlock(map[e.target.id]);
      if (e.target.id === 'contact') startCountdown();
    });
  }, { threshold: 0.25 });
  ['character', 'quests', 'thesis', 'trophies', 'contact'].forEach(id => secIO.observe(document.getElementById(id)));

  function countUp(el) {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = target.toLocaleString('en-US') + suffix; return; }
    const dur = 1400, t0 = performance.now();
    const step = now => {
      const k = clamp((now - t0) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-US') + (k === 1 ? suffix : '');
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ───────── Mini-game: think like the model ─────────
     Linear conditional logit coefficients (thesis, Fig. 4.1):
     same race 1.65 · man older 0.77 · |age gap| −0.22 · |educ diff| −0.57
     hypergamy (man more educated) −0.21 · hypogamy (man less educated) 0.07 */
  const B = { same: 1.65, older: 0.77, gap: -0.22, edu: -0.57, hyper: -0.21, hypo: 0.07 };
  const EDU = ['less than high school', 'high school', 'some college', "bachelor's", 'advanced degree'];
  const NAMES = ['A', 'B', 'C', 'D', 'E', 'F'];
  const HAIR = ['#ffd166', '#ff6fb5', '#4fe3d1', '#a77bff', '#ff9f43', '#7ee787', '#5b8cff'];
  const SHIRT = ['#3b2f6b', '#24998c', '#b23f7c', '#5b3fa8', '#2f6fb2', '#a35b1f'];
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  function sprite(hair, shirt) {
    const rows = ['..HHHH..', '.HHHHHH.', '.HFFFFH.', '.FEFFEF.', '.FFFFFF.', '..FFFF..', '.SSSSSS.', 'SSSSSSSS'];
    const col = { H: hair, F: '#e9dcff', E: '#100b20', S: shirt };
    let r = '';
    rows.forEach((row, y) => [...row].forEach((ch, x) => { if (col[ch]) r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${col[ch]}"/>`; }));
    return `<svg viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`;
  }

  function utility(w, m) {
    const g = m.age - w.age, d = m.edu - w.edu;
    return {
      same: B.same * (m.same ? 1 : 0),
      older: B.older * (g > 0 ? 1 : 0),
      gap: B.gap * Math.abs(g),
      edu: B.edu * Math.abs(d),
      hyper: B.hyper * (d > 0 ? 1 : 0),
      hypo: B.hypo * (d < 0 ? 1 : 0),
    };
  }
  const total = u => Object.values(u).reduce((a, b) => a + b, 0);

  let round = 1, score = 0, state = null;
  const candBox = $('#candidates');
  const msg = $('#g-msg');
  const nextBtn = $('#g-next');

  function newRound() {
    let w, men, probs, order;
    for (let tries = 0; tries < 200; tries++) {
      w = { age: rnd(23, 38), edu: rnd(1, 4) };
      men = NAMES.map(n => ({
        name: n,
        age: clamp(w.age + rnd(-7, 12), 19, 64),
        edu: clamp(w.edu + rnd(-2, 2), 0, 4),
        same: Math.random() < 0.5,
        hair: pick(HAIR), shirt: pick(SHIRT),
      }));
      men.forEach(m => { m.u = utility(w, m); m.v = total(m.u); });
      const ex = men.map(m => Math.exp(m.v));
      const s = ex.reduce((a, b) => a + b, 0);
      probs = ex.map(e => e / s);
      order = probs.map((p, i) => i).sort((a, b) => probs[b] - probs[a]);
      if (probs[order[0]] - probs[order[1]] > 0.06) break;
    }
    men.forEach((m, i) => { m.p = probs[i]; });
    state = { w, men, best: order[0], done: false };

    $('#her').textContent = `${w.age} years old · ${EDU[w.edu]}`;
    $('#g-round').textContent = round;
    msg.textContent = ''; msg.className = 'game-msg';
    nextBtn.hidden = true;
    candBox.classList.remove('revealed');
    candBox.innerHTML = '';
    men.forEach((m, i) => {
      const gap = m.age - w.age;
      const gapTxt = gap === 0 ? 'same age' : (gap > 0 ? `${gap} yr older` : `${-gap} yr younger`);
      const b = document.createElement('button');
      b.className = 'cand';
      b.type = 'button';
      b.setAttribute('aria-label', `Candidate ${m.name}`);
      b.innerHTML = `${sprite(m.hair, m.shirt)}
        <div><h5>CANDIDATE ${m.name}</h5>
          <ul>
            <li>Age ${m.age} <span class="muted">(${gapTxt})</span></li>
            <li>${EDU[m.edu].charAt(0).toUpperCase() + EDU[m.edu].slice(1)}</li>
            <li>Same race/ethnicity: ${m.same ? '<span class="cyan">yes</span>' : '<span class="muted">no</span>'}</li>
          </ul></div>
        <div class="prob"><i style="--p:${(m.p * 100).toFixed(1)}%"></i><span>${(m.p * 100).toFixed(0)}%</span></div>`;
      b.addEventListener('click', () => choose(i));
      candBox.appendChild(b);
    });
  }

  const LABEL = { same: 'sharing her race/ethnicity', older: 'being older than her', gap: 'a smaller age gap', edu: 'a closer education level', hyper: 'his education level', hypo: 'his education level' };

  function choose(i) {
    if (!state || state.done) return;
    state.done = true;
    unlock('game');
    const cards = $$('.cand', candBox);
    cards.forEach(c => { c.disabled = true; });
    candBox.classList.add('revealed');
    cards[state.best].classList.add('best');
    cards[i].classList.add('picked');
    const best = state.men[state.best];
    if (i === state.best) {
      score++;
      msg.textContent = `✓ Same pick as the model. It gives Candidate ${best.name} a ${(best.p * 100).toFixed(0)}% chance.`;
      msg.classList.add('win');
    } else {
      cards[i].classList.add('wrong');
      const mine = state.men[i];
      let topK = 'same', topD = -Infinity;
      for (const k of Object.keys(best.u)) {
        const d = best.u[k] - mine.u[k];
        if (d > topD) { topD = d; topK = k; }
      }
      msg.textContent = `✗ The model prefers Candidate ${best.name} (${(best.p * 100).toFixed(0)}%). The deciding factor was ${LABEL[topK]}.`;
      msg.classList.add('lose');
    }
    $('#g-score').textContent = score;
    nextBtn.hidden = false;
  }
  nextBtn.addEventListener('click', () => { round++; newRound(); });
  newRound();

  /* ───────── Power-ups (ablation, Table 4.5) ───────── */
  const ABL = {
    AER: [15.02, 49.2, 'Full power: the real husband sits in the top 15% of his city\'s men.'],
    AE:  [17.81, 39.2, 'Race removed: only 2.8 pp worse. Less than its big coefficient suggests.'],
    ER:  [28.55, 29.8, 'Age removed: the rank nearly doubles to 28.6%. Age does the most work.'],
    AR:  [16.35, 45.0, 'Education removed: +1.3 pp. It adds the least on top of the others.'],
    A:   [20.01, 34.7, 'Age alone already finds the husband in the top fifth of the city.'],
    R:   [35.06, 21.0, 'Race alone: 35.1%. The largest coefficient, but a blunt yes/no signal.'],
    E:   [37.34, 19.5, 'Education alone: 37.3%, the weakest of the three solo.'],
    '':  [50.0, 10.0, 'No predictors left, so this is pure random guessing.'],
  };
  const puBtns = $$('.pu');
  const puRank = $('#pu-rank'), puTop = $('#pu-top1'), puMarker = $('#pu-marker'), puMsg = $('#pu-msg');
  function updatePU() {
    const key = puBtns.filter(b => b.classList.contains('on')).map(b => b.dataset.k).join('');
    const [rank, top1, text] = ABL[key];
    puRank.textContent = rank.toFixed(1) + '%';
    puTop.textContent = top1.toFixed(1) + '%';
    puRank.classList.toggle('bad', rank > 25);
    puTop.classList.toggle('bad', top1 < 30);
    puMarker.style.left = (rank / 50 * 100) + '%';
    puMsg.textContent = text;
  }
  puBtns.forEach(b => b.addEventListener('click', () => {
    b.classList.toggle('on');
    b.setAttribute('aria-pressed', b.classList.contains('on'));
    unlock('power');
    updatePU();
  }));
  updatePU();

  /* ───────── World select (Table 4.4, spline clogit) ───────── */
  const CITIES = [
    { name: 'Atlanta',       r: [11.07, 10.92], n: [1135, 1099], win: ['Spline', 'Spline'] },
    { name: 'Los Angeles',   r: [12.55, 12.91], n: [2552, 2034], win: ['Spline', 'Spline'] },
    { name: 'Boston',        r: [14.17, 13.60], n: [928, 901],   win: ['Spline', 'Spline'] },
    { name: 'San Francisco', r: [14.25, 16.54], n: [1066, 841],  win: ['Spline', 'Forest (full), 16.51%'] },
  ];
  const worlds = $('#worlds');
  function diff(r) {
    if (r < 12) return ['EASY', '★☆☆☆', 'easy'];
    if (r < 13.5) return ['NORMAL', '★★☆☆', ''];
    if (r < 15) return ['HARD', '★★★☆', ''];
    return ['EXPERT', '★★★★', 'hard'];
  }
  function renderWorlds(p) {
    worlds.innerHTML = '';
    CITIES.forEach(c => {
      const r = c.r[p];
      const [label, starsTxt, cls] = diff(r);
      const el = document.createElement('div');
      el.className = 'world px ' + cls;
      el.innerHTML = `<h4>${c.name}</h4>
        <p class="diff">${starsTxt}<em>${label}</em></p>
        <div class="wr">${r.toFixed(1)}%</div>
        <p class="wl">spline metro rank · ${c.n[p].toLocaleString('en-US')} men</p>
        <div class="wbar"><i style="width:${(r / 20 * 100).toFixed(1)}%"></i></div>
        <p class="wl">Winner: ${c.win[p] === 'Spline' ? '👑 Spline clogit' : c.win[p]}</p>`;
      worlds.appendChild(el);
    });
  }
  $$('.period-btn').forEach(b => b.addEventListener('click', () => {
    $$('.period-btn').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
    renderWorlds(+b.dataset.p);
  }));
  renderWorlds(0);

  /* ───────── Inventory tooltips ───────── */
  const tip = $('#inv-tip');
  $$('.slot').forEach(s => {
    const show = () => { $$('.slot').forEach(x => x.classList.toggle('sel', x === s)); tip.textContent = '› ' + s.dataset.tip; };
    s.addEventListener('mouseenter', show);
    s.addEventListener('focus', show);
    s.addEventListener('click', show);
  });

  /* ───────── Continue countdown ───────── */
  let counting = false;
  function startCountdown() {
    if (counting) return;
    counting = true;
    const el = $('#countdown');
    let n = 9;
    const iv = setInterval(() => {
      n--;
      if (n <= 0) { clearInterval(iv); el.textContent = 'YES'; return; }
      el.textContent = n;
    }, 700);
  }

  /* ───────── Konami ───────── */
  const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let ki = 0;
  document.addEventListener('keydown', e => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    ki = (k === code[ki]) ? ki + 1 : (k === code[0] ? 1 : 0);
    if (ki === code.length) { ki = 0; heartRain(); unlock('konami'); }
  });
  function heartRain() {
    const glyphs = ['💘', '💜', '💖', '✨', '🩷', '💙'];
    for (let i = 0; i < 40; i++) {
      const h = document.createElement('span');
      h.className = 'rain';
      h.textContent = pick(glyphs);
      h.style.left = Math.random() * 100 + 'vw';
      h.style.animationDuration = (2 + Math.random() * 2.5) + 's';
      h.style.animationDelay = (Math.random() * 1.2) + 's';
      document.body.appendChild(h);
      setTimeout(() => h.remove(), 5000);
    }
  }
})();
