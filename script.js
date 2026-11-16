/* Aleksandra Bocheva · arcade edition */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ───────── i18n ─────────
     Static text: elements carry data-i18n="key" (innerHTML) and
     data-i18n-attr="attr:key …". Translations live in lang/<code>.js and are
     loaded on demand; anything missing falls back to the English in the HTML.
     Dynamic text (mini-game, achievements, …) uses UI_EN below as fallback. */
  const LANGS = {
    en: { short: 'EN', name: 'English', locale: 'en-US', html: 'en' },
    sv: { short: 'SV', name: 'Svenska', locale: 'sv-SE', html: 'sv' },
    bg: { short: 'BG', name: 'Български', locale: 'bg-BG', html: 'bg' },
    de: { short: 'DE', name: 'Deutsch', locale: 'de-DE', html: 'de' },
    zh: { short: '中文', name: '中文', locale: 'zh-CN', html: 'zh-Hans' },
  };
  const UI_EN = {
    lang: 'Language',
    achUnlocked: 'ACHIEVEMENT UNLOCKED',
    achSecret: 'A secret…',
    ach: {
      start: ['Press Start', 'Began the adventure'],
      character: ['Character Inspected', 'Read the character sheet'],
      quests: ['Quest Log Read', 'Followed the route so far'],
      boss: ['Boss Encountered', 'Entered the thesis level'],
      game: ['Model Whisperer', 'Played a round against the model'],
      power: ['Power Player', 'Toggled a predictor power-up'],
      victory: ['Boss Defeated', 'Reached the end of the thesis'],
      trophies: ['Trophy Hunter', 'Visited the trophy room'],
      contact: ['Completionist', 'Made it to the continue screen'],
      konami: ['Secret Code', '↑↑↓↓←→←→BA'],
    },
    phrases: ['Computational Social Scientist', 'Machine Learning × Sociology', 'Discrete-Choice Modeller', 'Data Researcher', 'Partner-Choice Predictor'],
    edu: ['less than high school', 'high school', 'some college', "bachelor's", 'advanced degree'],
    her: '{age} years old · {edu}',
    sameAge: 'same age',
    older: '{n} yr older',
    younger: '{n} yr younger',
    candAria: 'Candidate {name}',
    candHead: 'CANDIDATE {name}',
    age: 'Age {age}',
    sameRace: 'Same race/ethnicity:',
    yes: 'yes',
    no: 'no',
    win: '✓ Same pick as the model. It gives Candidate {name} a {p} chance.',
    lose: '✗ The model prefers Candidate {name} ({p}). The deciding factor was {factor}.',
    factor: { same: 'sharing her race/ethnicity', older: 'being older than her', gap: 'a smaller age gap', edu: 'a closer education level', hyper: 'his education level', hypo: 'his education level' },
    abl: {
      AER: "Full power: the real husband sits in the top 15% of his city's men.",
      AE: 'Race removed: only 2.8 pp worse. Less than its big coefficient suggests.',
      ER: 'Age removed: the rank nearly doubles to 28.6%. Age does the most work.',
      AR: 'Education removed: +1.3 pp. It adds the least on top of the others.',
      A: 'Age alone already finds the husband in the top fifth of the city.',
      R: 'Race alone: 35.1%. The largest coefficient, but a blunt yes/no signal.',
      E: 'Education alone: 37.3%, the weakest of the three solo.',
      '': 'No predictors left, so this is pure random guessing.',
    },
    cities: { atl: 'Atlanta', la: 'Los Angeles', bos: 'Boston', sf: 'San Francisco' },
    diff: { easy: 'EASY', normal: 'NORMAL', hard: 'HARD', expert: 'EXPERT' },
    worldRank: 'spline metro rank · {n} men',
    winner: 'Winner: {w}',
    splineWin: '👑 Spline clogit',
    forestFull: 'Forest (full), {p}',
    countdownDone: 'YES',
  };

  let lang = 'en';
  let UI = UI_EN;
  const packs = { en: { html: {}, ui: {} } };
  const t = (k, vars) => {
    let s = UI[k] !== undefined ? UI[k] : UI_EN[k];
    if (vars) for (const v in vars) s = s.split('{' + v + '}').join(vars[v]);
    return s;
  };
  const sub = (group, k) => (UI[group] && UI[group][k] !== undefined ? UI[group][k] : UI_EN[group][k]);
  const num = (v, d = 0) => new Intl.NumberFormat(LANGS[lang].locale, { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
  const pct = (v, d = 0) => num(v, d) + '%';

  // Remember the English originals so switching back needs no extra file.
  const origHTML = new Map();
  const origAttr = new Map();
  $$('[data-i18n]').forEach(el => origHTML.set(el, el.innerHTML));
  $$('[data-i18n-attr]').forEach(el => {
    const m = {};
    el.dataset.i18nAttr.split(/\s+/).forEach(pair => { const [a] = pair.split(':'); m[a] = el.getAttribute(a); });
    origAttr.set(el, m);
  });

  function applyStatic(pack) {
    const H = pack.html || {};
    origHTML.forEach((en, el) => {
      const k = el.dataset.i18n;
      const v = H[k] !== undefined ? H[k] : en;
      if (el.innerHTML !== v) el.innerHTML = v;
    });
    origAttr.forEach((en, el) => {
      el.dataset.i18nAttr.split(/\s+/).forEach(pair => {
        const [a, k] = pair.split(':');
        el.setAttribute(a, H[k] !== undefined ? H[k] : en[a]);
      });
    });
  }

  function loadPack(code) {
    if (packs[code]) return Promise.resolve(packs[code]);
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = `lang/${code}.js?v=1`;
      s.onload = () => {
        const p = window.SITE_I18N && window.SITE_I18N[code];
        if (!p) return reject(new Error('missing pack ' + code));
        packs[code] = p;
        resolve(p);
      };
      s.onerror = () => reject(new Error('failed to load ' + code));
      document.head.appendChild(s);
    });
  }

  const langWrap = $('#lang');
  const langBtn = $('#lang-btn');
  const langMenu = $('#lang-menu');
  const langItems = $$('#lang-menu [data-lang]');
  const rerender = [];   // dynamic parts register here

  function setMenu(open) {
    langMenu.hidden = !open;
    langBtn.setAttribute('aria-expanded', open);
    if (open) (langItems.find(b => b.dataset.lang === lang) || langItems[0]).focus();
  }

  async function setLang(code, save = true) {
    if (!LANGS[code]) code = 'en';
    let pack;
    try { pack = await loadPack(code); }
    catch (e) { console.warn(e); code = 'en'; pack = packs.en; }
    lang = code;
    UI = Object.assign({}, UI_EN, pack.ui || {});
    applyStatic(pack);
    document.documentElement.lang = LANGS[code].html;
    $('#lang-cur').textContent = LANGS[code].short;
    langBtn.setAttribute('aria-label', `${t('lang')}: ${LANGS[code].name}`);
    langBtn.title = t('lang');
    langItems.forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === code));
    rerender.forEach(fn => fn());
    if (save) {
      try { localStorage.setItem('ab-lang', code); } catch (e) { /* storage blocked */ }
      try {
        const u = new URL(location.href);
        if (u.searchParams.has('lang')) { u.searchParams.set('lang', code); history.replaceState(null, '', u); }
      } catch (e) { /* ignore */ }
    }
  }

  langBtn.addEventListener('click', e => { e.stopPropagation(); setMenu(langMenu.hidden); });
  langItems.forEach(b => b.addEventListener('click', () => { setMenu(false); langBtn.focus(); setLang(b.dataset.lang); }));
  langMenu.addEventListener('keydown', e => {
    const i = langItems.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); langItems[(i + 1) % langItems.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); langItems[(i - 1 + langItems.length) % langItems.length].focus(); }
  });
  document.addEventListener('click', e => { if (!langWrap.contains(e.target)) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !langMenu.hidden) { setMenu(false); langBtn.focus(); } });

  /* ───────── Achievements ───────── */
  const ACH = [
    { id: 'start',     icon: '▶️' },
    { id: 'character', icon: '🧙' },
    { id: 'quests',    icon: '📜' },
    { id: 'boss',      icon: '💘' },
    { id: 'game',      icon: '🎯' },
    { id: 'power',     icon: '⚡' },
    { id: 'victory',   icon: '🏆' },
    { id: 'trophies',  icon: '🏅' },
    { id: 'contact',   icon: '🪙' },
    { id: 'konami',    icon: '🕹️', secret: true },
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
      const [name, desc] = sub('ach', a.id);
      li.innerHTML = `<span class="ai">${hidden ? '❔' : a.icon}</span><span><strong>${hidden ? '???' : name}</strong><br>${hidden ? t('achSecret') : desc}</span>`;
      achList.appendChild(li);
    });
    achCount.textContent = got.size;
  }
  rerender.push(renderAch);

  function unlock(id) {
    if (got.has(id)) return;
    const a = ACH.find(x => x.id === id);
    if (!a) return;
    got.add(id);
    renderAch();
    trophyBtn.classList.remove('bump'); void trophyBtn.offsetWidth; trophyBtn.classList.add('bump');
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span class="ti">${a.icon}</span><div><b>${t('achUnlocked')}</b><span>${sub('ach', id)[0]}</span></div>`;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 2800);
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
  function loop(time) { drawStars(time); requestAnimationFrame(loop); }
  makeStars();
  window.addEventListener('resize', makeStars);
  if (reduceMotion) { drawStars(); window.addEventListener('scroll', () => drawStars(), { passive: true }); }
  else requestAnimationFrame(loop);

  /* ───────── Typewriter ───────── */
  const tw = $('#typewriter');
  let phrases = UI_EN.phrases;
  let pi = 0, ci = phrases[0].length, deleting = true;
  if (!reduceMotion) {
    const tick = () => {
      if (deleting) {
        ci--;
        if (ci <= 0) { deleting = false; pi = (pi + 1) % phrases.length; }
      } else {
        ci++;
      }
      tw.textContent = [...phrases[pi]].slice(0, Math.max(ci, 0)).join('');
      let delay = deleting ? 35 : 70;
      if (!deleting && ci >= [...phrases[pi]].length) { deleting = true; delay = 2200; }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 2600);
  }
  rerender.push(() => {
    phrases = t('phrases');
    pi = 0; ci = [...phrases[0]].length; deleting = false;
    tw.textContent = phrases[0];
  });

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
  rerender.push(onScroll);

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
    const finish = () => { el.dataset.done = '1'; el.textContent = num(target) + suffix; };
    if (reduceMotion) { finish(); return; }
    const dur = 1400, t0 = performance.now();
    const step = now => {
      const k = clamp((now - t0) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - k, 3);
      if (k === 1) { finish(); return; }
      el.textContent = num(Math.round(target * eased));
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  rerender.push(() => {
    $$('[data-count][data-done]').forEach(el => { el.textContent = num(+el.dataset.count) + (el.dataset.suffix || ''); });
  });

  /* ───────── Mini-game: think like the model ─────────
     Linear conditional logit coefficients (thesis, Fig. 4.1):
     same race 1.65 · man older 0.77 · |age gap| −0.22 · |educ diff| −0.57
     hypergamy (man more educated) −0.21 · hypogamy (man less educated) 0.07 */
  const B = { same: 1.65, older: 0.77, gap: -0.22, edu: -0.57, hyper: -0.21, hypo: 0.07 };
  const NAMES = ['A', 'B', 'C', 'D', 'E', 'F'];
  const HAIR = ['#ffd166', '#ff6fb5', '#4fe3d1', '#a77bff', '#ff9f43', '#7ee787', '#5b8cff'];
  const SHIRT = ['#3b2f6b', '#24998c', '#b23f7c', '#5b3fa8', '#2f6fb2', '#a35b1f'];
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

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
    state = { w, men, best: order[0], picked: null };
    renderRound();
  }

  function renderRound() {
    const { w, men } = state;
    const edu = t('edu');
    $('#her').textContent = t('her', { age: w.age, edu: edu[w.edu] });
    $('#g-round').textContent = round;
    candBox.classList.remove('revealed');
    candBox.innerHTML = '';
    men.forEach((m, i) => {
      const gap = m.age - w.age;
      const gapTxt = gap === 0 ? t('sameAge') : (gap > 0 ? t('older', { n: gap }) : t('younger', { n: -gap }));
      const b = document.createElement('button');
      b.className = 'cand';
      b.type = 'button';
      b.setAttribute('aria-label', t('candAria', { name: m.name }));
      b.innerHTML = `${sprite(m.hair, m.shirt)}
        <div><h5>${t('candHead', { name: m.name })}</h5>
          <ul>
            <li>${t('age', { age: m.age })} <span class="muted">(${gapTxt})</span></li>
            <li>${cap(edu[m.edu])}</li>
            <li>${t('sameRace')} ${m.same ? `<span class="cyan">${t('yes')}</span>` : `<span class="muted">${t('no')}</span>`}</li>
          </ul></div>
        <div class="prob"><i style="--p:${(m.p * 100).toFixed(1)}%"></i><span>${pct(m.p * 100)}</span></div>`;
      b.addEventListener('click', () => choose(i));
      candBox.appendChild(b);
    });
    showResult();
  }

  function showResult() {
    msg.textContent = ''; msg.className = 'game-msg';
    nextBtn.hidden = state.picked === null;
    if (state.picked === null) return;
    const i = state.picked;
    const cards = $$('.cand', candBox);
    cards.forEach(c => { c.disabled = true; });
    candBox.classList.add('revealed');
    cards[state.best].classList.add('best');
    cards[i].classList.add('picked');
    const best = state.men[state.best];
    if (i === state.best) {
      msg.textContent = t('win', { name: best.name, p: pct(best.p * 100) });
      msg.classList.add('win');
    } else {
      cards[i].classList.add('wrong');
      const mine = state.men[i];
      let topK = 'same', topD = -Infinity;
      for (const k of Object.keys(best.u)) {
        const d = best.u[k] - mine.u[k];
        if (d > topD) { topD = d; topK = k; }
      }
      msg.textContent = t('lose', { name: best.name, p: pct(best.p * 100), factor: sub('factor', topK) });
      msg.classList.add('lose');
    }
  }

  function choose(i) {
    if (!state || state.picked !== null) return;
    state.picked = i;
    unlock('game');
    if (i === state.best) score++;
    $('#g-score').textContent = score;
    showResult();
  }
  nextBtn.addEventListener('click', () => { round++; newRound(); });
  newRound();
  rerender.push(renderRound);

  /* ───────── Power-ups (ablation, Table 4.5) ───────── */
  const ABL = {
    AER: [15.02, 49.2], AE: [17.81, 39.2], ER: [28.55, 29.8], AR: [16.35, 45.0],
    A: [20.01, 34.7], R: [35.06, 21.0], E: [37.34, 19.5], '': [50.0, 10.0],
  };
  const puBtns = $$('.pu');
  const puRank = $('#pu-rank'), puTop = $('#pu-top1'), puMarker = $('#pu-marker'), puMsg = $('#pu-msg');
  function updatePU() {
    const key = puBtns.filter(b => b.classList.contains('on')).map(b => b.dataset.k).join('');
    const [rank, top1] = ABL[key];
    puRank.textContent = pct(rank, 1);
    puTop.textContent = pct(top1, 1);
    puRank.classList.toggle('bad', rank > 25);
    puTop.classList.toggle('bad', top1 < 30);
    puMarker.style.left = (rank / 50 * 100) + '%';
    puMsg.textContent = sub('abl', key);
  }
  puBtns.forEach(b => b.addEventListener('click', () => {
    b.classList.toggle('on');
    b.setAttribute('aria-pressed', b.classList.contains('on'));
    unlock('power');
    updatePU();
  }));
  updatePU();
  rerender.push(updatePU);

  /* ───────── World select (Table 4.4, spline clogit) ───────── */
  const CITIES = [
    { id: 'atl', r: [11.07, 10.92], n: [1135, 1099], forest: [null, null] },
    { id: 'la',  r: [12.55, 12.91], n: [2552, 2034], forest: [null, null] },
    { id: 'bos', r: [14.17, 13.60], n: [928, 901],   forest: [null, null] },
    { id: 'sf',  r: [14.25, 16.54], n: [1066, 841],  forest: [null, 16.51] },
  ];
  const worlds = $('#worlds');
  let period = 0;
  function diff(r) {
    if (r < 12) return ['easy', '★☆☆☆', 'easy'];
    if (r < 13.5) return ['normal', '★★☆☆', ''];
    if (r < 15) return ['hard', '★★★☆', ''];
    return ['expert', '★★★★', 'hard'];
  }
  function renderWorlds() {
    const p = period;
    worlds.innerHTML = '';
    CITIES.forEach(c => {
      const r = c.r[p];
      const [label, starsTxt, cls] = diff(r);
      const f = c.forest[p];
      const el = document.createElement('div');
      el.className = 'world px ' + cls;
      el.innerHTML = `<h4>${sub('cities', c.id)}</h4>
        <p class="diff">${starsTxt}<em>${sub('diff', label)}</em></p>
        <div class="wr">${pct(r, 1)}</div>
        <p class="wl">${t('worldRank', { n: num(c.n[p]) })}</p>
        <div class="wbar"><i style="width:${(r / 20 * 100).toFixed(1)}%"></i></div>
        <p class="wl">${t('winner', { w: f === null ? t('splineWin') : t('forestFull', { p: pct(f, 2) }) })}</p>`;
      worlds.appendChild(el);
    });
  }
  $$('.period-btn').forEach(b => b.addEventListener('click', () => {
    $$('.period-btn').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
    period = +b.dataset.p;
    renderWorlds();
  }));
  renderWorlds();
  rerender.push(renderWorlds);

  /* ───────── Inventory tooltips ───────── */
  const tip = $('#inv-tip');
  let tipSlot = null;
  const showTip = () => { if (tipSlot) tip.textContent = '› ' + tipSlot.dataset.tip; };
  $$('.slot').forEach(s => {
    const show = () => { tipSlot = s; $$('.slot').forEach(x => x.classList.toggle('sel', x === s)); showTip(); };
    s.addEventListener('mouseenter', show);
    s.addEventListener('focus', show);
    s.addEventListener('click', show);
  });
  rerender.push(showTip);

  /* ───────── Continue countdown ───────── */
  let counting = false, countDone = false;
  const cdEl = $('#countdown');
  function startCountdown() {
    if (counting) return;
    counting = true;
    let n = 9;
    const iv = setInterval(() => {
      n--;
      if (n <= 0) { clearInterval(iv); countDone = true; cdEl.textContent = t('countdownDone'); return; }
      cdEl.textContent = n;
    }, 700);
  }
  rerender.push(() => { if (countDone) cdEl.textContent = t('countdownDone'); });

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

  /* ───────── Initial language: ?lang= → saved choice → English ───────── */
  let initial = 'en';
  try { initial = localStorage.getItem('ab-lang') || 'en'; } catch (e) { /* storage blocked */ }
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q && LANGS[q]) initial = q;
  } catch (e) { /* ignore */ }
  if (initial !== 'en') setLang(initial, false);
})();
