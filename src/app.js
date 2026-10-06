(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const settings = { listen: false, simple: false, lang: 'fr' };

/* ---------- Pictos au style des illustrations V2 ---------- */
const PICTOS = {
  papiers:   { a: '#8faadc', b: '#ffd966', fr: 'Papiers',   ar: 'الأوراق',
    g: '<rect x="30" y="18" width="40" height="52" rx="4"/><path d="M38 32h24M38 42h24M38 52h16"/><path d="M24 58h40l-4 22H28z"/><path d="M24 58l20 12 20-12"/>' },
  logement:  { a: '#a9d18e', b: '#f4a3c6', fr: 'Logement',  ar: 'السكن',
    g: '<path d="M18 50 50 22l32 28"/><path d="M27 44v34h46V44"/><rect x="43" y="56" width="14" height="22" rx="2"/>' },
  formation: { a: '#c39ad6', b: '#ec6a76', fr: 'Formation', ar: 'التكوين',
    g: '<path d="M14 40 50 24l36 16-36 16z"/><path d="M28 47v14c0 6 10 11 22 11s22-5 22-11V47"/><path d="M84 41v18"/>' },
  permis:    { a: '#8faadc', b: '#ffd966', fr: 'Permis',    ar: 'الرخصة',
    g: '<path d="M18 58l7-18c1-4 4-6 8-6h34c4 0 7 2 8 6l7 18v12H18z"/><circle cx="32" cy="70" r="6"/><circle cx="68" cy="70" r="6"/><path d="M28 50h44"/>' },
  famille:     { a: '#f6a25a', b: '#9fdcb0', fr: 'Famille', ar: 'العائلة',
    g: '<circle cx="36" cy="28" r="9"/><circle cx="64" cy="38" r="7"/><path d="M20 76c0-18 7-34 16-34s16 16 16 34z"/><path d="M52 76c0-13 5-24 12-24s12 11 12 24z"/>' },
  fatigue:     { a: '#5c5f66', b: '#d1493c', fr: 'Fatiguée', ar: 'متعبة',
    g: '<circle cx="48" cy="48" r="26"/><path d="M35 46q6 5 12 0M51 46q6 5 12 0M41 62h14" fill="none"/><path d="M68 12h11l-11 11h11" fill="none"/>' },
  sante:       { a: '#c9ef8a', b: '#e58ac6', fr: 'Santé', ar: 'الصحة',
    g: '<rect x="22" y="32" width="56" height="42" rx="6"/><path d="M40 32v-8h20v8"/><path d="M45 42h10v8h8v10h-8v8H45v-8h-8V50h8z"/>' },
  courage:     { a: '#c48ad6', b: '#ec5a5a', fr: 'Courage', ar: 'الشجاعة',
    g: '<circle cx="60" cy="20" r="8"/><path d="M57 30 43 50l12 9-6 18M43 50l-15 5M57 32l15 11" fill="none" stroke-width="12"/><path d="M57 30 43 50l12 9-6 18M43 50l-15 5M57 32l15 11" fill="none" stroke="#fff" stroke-width="5"/>' },
  amis:        { a: '#f6a25a', b: '#9fdcb0', fr: 'Amis', ar: 'الأصدقاء',
    g: '<circle cx="36" cy="38" r="10"/><circle cx="64" cy="38" r="10"/><path d="M18 78c0-14 8-22 18-22s18 8 18 22z"/><path d="M46 78c0-14 8-22 18-22s18 8 18 22z"/>' },
  allocations: { a: '#c9ef8a', b: '#e58ac6', fr: 'Allocations', ar: 'المساعدات',
    g: '<circle cx="50" cy="42" r="22"/><path d="M59 33c-9-6-21-1-21 9s12 15 21 9M32 39h16M32 46h16" fill="none"/><path d="M18 70c10-6 20-6 30 0h22c4 0 4 8 0 8H34"/>' },
  partage:     { a: '#a9d18e', b: '#f4a3c6', fr: 'Partage', ar: 'المشاركة',
    g: '<path d="M50 66C32 54 24 45 24 35c0-8 6-13 13-13 6 0 10 4 13 9 3-5 7-9 13-9 7 0 13 5 13 13 0 10-8 19-26 31z"/>' },
  appel:       { a: '#7fc4f5', b: '#f7ef62', fr: 'Appel', ar: 'الاتصال',
    g: '<path d="M30 22l10-4 8 16-6 5c3 8 9 14 17 17l5-6 16 8-4 10c-26 2-48-20-46-46z"/>' },
  travail:     { a: '#c9ef8a', b: '#e58ac6', fr: 'Travail', ar: 'العمل',
    g: '<rect x="20" y="36" width="60" height="38" rx="5"/><path d="M38 36v-8h24v8M20 52h60"/>' },
  creer:     { a: '#f6b26b', b: '#a9d18e', fr: 'Créer',     ar: 'إنشاء',
    g: '<path d="M50 16a20 20 0 0 1 12 36v8H38v-8a20 20 0 0 1 12-36z"/><path d="M40 68h20M43 76h14"/>' }
};
function pictoSVG(key, mini) {
  const p = PICTOS[key];
  if (mini) return `<svg viewBox="0 0 100 100" role="img" aria-label="${p.fr}"><rect width="100" height="100" fill="${p.a}"/><path d="M58 0H100V100H38z" fill="${p.b}"/><g fill="#fff" stroke="#3d4555" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" transform="translate(-6,-2) scale(1.12)">${p.g}</g></svg>`;
  return `<svg viewBox="0 0 100 100" role="img" aria-label="${p.fr}"><defs><clipPath id="cp-${key}"><rect width="100" height="100" rx="12"/></clipPath></defs>
  <g clip-path="url(#cp-${key})"><rect width="100" height="100" fill="${p.a}"/><path d="M58 0H100V100H38z" fill="${p.b}"/></g>
  <g fill="#fff" stroke="#3d4555" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round" transform="translate(9,1) scale(.82)">${p.g}</g>
  <text x="50" y="91" text-anchor="middle" font-family="Tahoma,Verdana,sans-serif" font-weight="700" font-size="17" fill="#fff" stroke="#3d4555" stroke-width="5" stroke-linejoin="round" paint-order="stroke" data-picto-label="${key}">${p.fr}</text></svg>`;
}
$$('[data-picto]').forEach(el => { el.innerHTML = pictoSVG(el.dataset.picto, el.hasAttribute('data-mini')); if (!el.classList.contains('np') && !el.classList.contains('chpic') && !el.classList.contains('cpic')) el.style.display = 'block'; });
/* ---------- Portraits des personnages, au style des pictos V2 ---------- */
const INK = '#3d4555';
const PERS = {
  amina:  { n: 'Amina',     a: '#ffd966', b: '#cfafe7', back: `<path d="M29 46C27 20 73 20 71 46L73 76C65 72 62 64 61 58H39C38 64 35 72 27 76Z" fill="${INK}"/>`, front: `<path d="M33 41C34 27 66 27 67 41C60 34 51 32 43 35C39 36 35 39 33 41Z" fill="${INK}"/>` },
  sarah:  { n: 'Sarah',     a: '#8faadc', b: '#a9d18e', back: `<path d="M30 50C26 24 74 24 70 50L69 60H31Z" fill="#8a5a3c"/>`, front: `<path d="M32 44C32 28 68 28 68 44C66 37 60 32 50 32C46 36 38 40 32 44Z" fill="#8a5a3c"/>` },
  salma:  { n: 'Salma',     a: '#f4a3c6', b: '#ffd966', back: `<g fill="${INK}"><circle cx="34" cy="38" r="9"/><circle cx="66" cy="38" r="9"/><circle cx="31" cy="50" r="8"/><circle cx="69" cy="50" r="8"/></g>`, front: `<g fill="${INK}"><circle cx="41" cy="29" r="8"/><circle cx="50" cy="26" r="8"/><circle cx="59" cy="29" r="8"/></g>` },
  robert: { n: 'M. Robert', a: '#8faadc', b: '#cfafe7', back: '', front: `<path d="M34 40C33 34 36 30 40 29M66 40C67 34 64 30 60 29" stroke="#9aa2b1" stroke-width="4" fill="none" stroke-linecap="round"/><g fill="none" stroke="${INK}" stroke-width="2.5"><circle cx="44" cy="45" r="5"/><circle cx="56" cy="45" r="5"/><path d="M49 45h2"/></g>` },
  aicha:  { n: 'Aïcha',     a: '#a9d18e', b: '#ffd966', back: `<circle cx="50" cy="22" r="9" fill="${INK}"/>`, front: `<path d="M33 42C33 27 67 27 67 42C61 35 39 35 33 42Z" fill="${INK}"/>` },
  bruno:  { n: 'Bruno',     a: '#f08a7e', b: '#8faadc', back: '', front: `<path d="M34 40C34 27 66 27 66 40C60 35 40 35 34 40Z" fill="#8a5a3c"/><path d="M35 48C36 64 64 64 65 48C61 56 39 56 35 48Z" fill="#8a5a3c"/>` },
  karim:  { n: 'Karim',     a: '#cfafe7', b: '#a9d18e', back: '', front: `<path d="M33 41C32 25 68 25 67 41C62 33 38 33 33 41Z" fill="${INK}"/>` },
  lea:    { n: 'Léa',       a: '#8faadc', b: '#f4a3c6', back: `<path d="M66 36C80 40 82 58 74 66C74 56 70 46 64 42Z" fill="#d8a24a"/>`, front: `<path d="M33 42C32 26 68 26 67 40C58 32 44 31 33 42Z" fill="#d8a24a"/>` },
  cvs:    { n: 'Le CVS',    a: '#a9d18e', b: '#8faadc', group: true },
  hlux:   { n: 'HLuX',      a: '#8c6aa8', b: '#8c6aa8', logo: true }
};
let pvId = 0;
function personaSVG(k) {
  const P = PERS[k] || PERS.hlux, id = 'pv' + (pvId++);
  const bg = `<defs><clipPath id="${id}"><circle cx="50" cy="50" r="50"/></clipPath></defs><g clip-path="url(#${id})"><rect width="100" height="100" fill="${P.a}"/><path d="M62 0H100V100H30z" fill="${P.b}"/>`;
  if (P.logo) return `<svg viewBox="0 0 100 100" role="img" aria-label="HLuX">${bg}</g><svg x="16" y="16" width="68" height="68" viewBox="${$('#hlux').getAttribute('viewBox')}"><use href="#hlux"/></svg></svg>`;
  const head = (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M16 104C16 76 32 68 50 68S84 76 84 104Z" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="50" cy="44" r="17" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="44" cy="45" r="2.2" fill="${INK}"/><circle cx="56" cy="45" r="2.2" fill="${INK}"/><path d="M44 52q6 5 12 0" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>`;
  if (P.group) return `<svg viewBox="0 0 100 100" role="img" aria-label="${P.n}">${bg}${head(-14, 14, .7)}${head(44, 14, .7)}${head(15, 6, .75)}</g></svg>`;
  return `<svg viewBox="0 0 100 100" role="img" aria-label="${P.n}">${bg}${P.back}<path d="M16 104C16 76 32 68 50 68S84 76 84 104Z" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="50" cy="44" r="17" fill="#fff" stroke="${INK}" stroke-width="3"/>${P.front}<circle cx="44" cy="45" r="2.2" fill="${INK}"/><circle cx="56" cy="45" r="2.2" fill="${INK}"/><path d="M44 52q6 5 12 0" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/></g></svg>`;
}
function fillPersonas(root = document) { $$('[data-persona]', root).forEach(el => { if (!el.firstChild) el.innerHTML = personaSVG(el.dataset.persona); }); }
fillPersonas();

/* ---------- Coque des applications : barre du haut, fil d'étapes, aides ---------- */
const STEPS = {
  pp: [['🃏 Cartes','🃏 بطاقاتي'],['😊 Ressenti','😊 إحساسي'],['🌈 Envies','🌈 رغباتي'],['⭐ Priorités','⭐ أولوياتي'],['👥 Regards','👥 نظرات'],['🛤️ Chemin','🛤️ طريقي']],
  pe: [['📥 Sujets'],['🔎 Constat'],['🧭 Cap'],['⚖️ Choix'],['🛠️ Actions'],['📅 Suivi']]
};
const AIDS = [['listen','🔊 Écouter','🔊 استمع'],['simple','💬 Plus simple','💬 أبسط'],['lang','🌐 Langue','🌐 اللغة']];
$$('.app').forEach(app => {
  const side = app.classList.contains('pe') ? 'pe' : app.classList.contains('pro') ? 'pro' : 'pp';
  const body = document.createElement('div'); body.className = 'app-body';
  while (app.firstChild) body.appendChild(app.firstChild);
  const on = +app.dataset.on;
  const proj = side === 'pp' ? '<span class="proj" data-ar="مشروعي" data-falc="Mon projet">Mon projet</span>'
    : side === 'pe' ? '<span class="proj">Projet d\'Établissement 2027–2031</span>' : '<span class="proj">Mes accompagnements · Sarah</span>';
  const steps = side === 'pro' ? '' : '<div class="stepper">' + STEPS[side].map((s, i) =>
    `<span class="${i === on ? 'on' : ''}"${s[1] ? ` data-ar="${s[1]}"` : ''}>${s[0]}</span>`).join('') + '</div>';
  const top = document.createElement('div'); top.className = 'app-top';
  top.innerHTML = `<span class="logo-badge" aria-hidden="true"><svg viewBox="${$('#hlux').getAttribute('viewBox')}"><use href="#hlux"/></svg></span><span class="wm"><b>HL</b><b>u</b><b>X</b></span>${proj}${steps}`;
  const aids = document.createElement('div'); aids.className = 'app-aids';
  aids.innerHTML = AIDS.map(a => `<button class="aid" data-aid="${a[0]}" aria-pressed="false" data-ar="${a[2]}">${a[1]}</button>`).join('')
    + `<span class="who">${side === 'pp' ? 'Amina · avec Sarah' : side === 'pe' ? 'CHRS Les Lilas' : 'visible de vous seule'}</span>`;
  app.append(top, body, aids);
  $$('[data-k="say"]', app).forEach(s => { s.innerHTML = '<span class="b-av"></span><span class="b-tx" data-k="say-t"></span>'; });
  app.dataset.side = side;
  app.setAttribute('role', 'img');
});

/* ---------- Tracés des chemins ---------- */
$$('.seg').forEach(s => {
  const [x1, y1] = s.dataset.a.split(',').map(Number), [x2, y2] = s.dataset.b.split(',').map(Number);
  const len = Math.hypot(x2 - x1, y2 - y1), ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  const thick = s.classList.contains('cond') || s.classList.contains('dep') || s.classList.contains('ray') ? 0 : s.classList.contains('alt') ? 2 : 2.5;
  Object.assign(s.style, { left: x1 + 'px', top: (y1 - thick) + 'px', width: len + 'px', transform: `rotate(${ang}deg)` });
});

/* ---------- Langue et version simple ---------- */
$$('[data-ar],[data-falc]').forEach(el => { el.dataset.fr = el.innerHTML; });
function textOf(el) {
  const inApp = el.closest('.app');
  if (settings.lang === 'ar' && el.dataset.ar && inApp) return { t: el.dataset.ar, html: false };
  if (settings.simple && el.dataset.falc) return { t: el.dataset.falc, html: false };
  return { t: el.dataset.fr || '', html: true };
}
function refresh(el) {
  const v = textOf(el);
  if (v.html) el.innerHTML = v.t; else el.textContent = v.t;
}
function refreshAll() {
  $$('[data-fr]').forEach(refresh);
  $$('.app').forEach(app => {
    const ar = settings.lang === 'ar';
    app.dataset.lang = ar ? 'ar' : 'fr'; app.lang = ar ? 'ar' : 'fr';
    if (app.hasAttribute('data-rtl')) app.dir = ar ? 'rtl' : 'ltr';
  });
  $$('[data-picto-label]').forEach(t => { const p = PICTOS[t.dataset.pictoLabel]; t.textContent = settings.lang === 'ar' ? p.ar : p.fr; });
  $$('.aid[data-aid]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.aid === 'lang' ? settings.lang === 'ar' : settings[b.dataset.aid])));
}

/* ---------- Mise à l'échelle des tablettes ---------- */
const BASE_W = 760, BASE_H = 540;
function portrait() { return innerWidth <= 980 || innerHeight > innerWidth; }
function fit() {
  const nav = $('.topnav').offsetHeight;
  document.documentElement.style.setProperty('--nav-h', nav + 'px');
  $$('.device').forEach(dev => {
    const stage = dev.closest('.stage'), app = $('.app', dev), sf = $('.screen-fit', dev);
    const sb = $('.storyboard', stage);
    const sbH = sb && getComputedStyle(sb).display !== 'none' ? sb.offsetHeight + 10 : 0;
    const availW = stage.clientWidth - 24;
    const availH = (portrait() ? innerHeight * 0.62 : innerHeight - nav) - sbH - 36;
    const s = Math.max(.3, Math.min(availW / BASE_W, availH / BASE_H, 1.6));
    app.style.transform = `scale(${s})`; app._scale = s;
    sf.style.width = BASE_W * s + 'px'; sf.style.height = BASE_H * s + 'px';
    dev.style.width = BASE_W * s + 24 + 'px';
  });
}

/* ---------- Scènes : étapes cumulatives, idempotentes ---------- */
const scenes = {};
function snapshot(app) {
  const els = $$('[data-k],[data-drag],[data-flip],.chip', app);
  return els.map(el => ({ el, parent: el.parentNode, next: el.nextSibling, cls: el.className, style: el.getAttribute('style') || '',
    fr: el.dataset.fr, ar: el.dataset.ar, falc: el.dataset.falc }));
}
function restore(sc) {
  for (let k = sc.snap.length - 1; k >= 0; k--) { const s = sc.snap[k]; s.parent.insertBefore(s.el, s.next && s.next.parentNode === s.parent ? s.next : null); }
  sc.snap.forEach(s => {
    s.el.className = s.cls;
    if (s.style) s.el.setAttribute('style', s.style); else s.el.removeAttribute('style');
    if (s.fr !== undefined) { s.el.dataset.fr = s.fr; if (s.ar !== undefined) s.el.dataset.ar = s.ar; else delete s.el.dataset.ar; if (s.falc !== undefined) s.el.dataset.falc = s.falc; else delete s.el.dataset.falc; refresh(s.el); }
  });
  const say = $('[data-k="say"]', sc.app); if (say) { say.classList.remove('on'); }
}
function helpers(sc) {
  const app = sc.app;
  const K = k => typeof k === 'string' ? app.querySelector(`[data-k="${k}"]`) : k;
  const local = el => { const r = el.getBoundingClientRect(), a = app.getBoundingClientRect(), s = app._scale || 1;
    return { x: (r.left - a.left + r.width / 2) / s, y: (r.top - a.top + r.height / 2) / s }; };
  const h = {
    K,
    hide: (...ks) => ks.forEach(k => K(k).classList.add('off')),
    show: (...ks) => ks.forEach(k => K(k).classList.remove('off')),
    cls: (k, c, on = true) => K(k).classList.toggle(c, on),
    put: (k, to) => K(to).appendChild(K(k)),
    left: (k, pct) => { K(k).style.left = pct + '%'; },
    css: (k, prop, v) => { K(k).style[prop] = v; },
    text: (k, fr, ar, falc) => { const el = K(k); el.dataset.fr = fr; if (ar) el.dataset.ar = ar; else delete el.dataset.ar; if (falc) el.dataset.falc = falc; else delete el.dataset.falc; refresh(el); },
    glow: (on, ...ks) => ks.forEach(k => K(k).classList.toggle('glow', on)),
    touch: k => { const t = K('touch'); if (!t) return; const p = local(K(k)); t.classList.remove('off'); t.style.left = (p.x - 13) + 'px'; t.style.top = (p.y - 30) + 'px'; },
    move: (k, to) => {
      const el = K(k), a = local(el); a.y -= 12; K(to).appendChild(el); const b = local(el); b.y -= 12;
      const tr = K('trail'); if (tr) { const len = Math.hypot(b.x - a.x, b.y - a.y), ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
        tr.classList.remove('off'); Object.assign(tr.style, { left: a.x + 'px', top: a.y + 'px', width: len + 'px', transform: `rotate(${ang}deg)` }); }
      h.touch(el);
    },
    say: (fr, ar, falc, who = 'hlux') => { const el = K('say'); if (!el) return; if (!fr) { el.classList.remove('on'); return; }
      $('.b-av', el).innerHTML = `<span class="pv">${personaSVG(who)}</span>`; h.text('say-t', fr, ar, falc); el.classList.add('on'); },
    view: name => {
      const v = K('views'); if (!v) return; v.dataset.view = name;
      const sarah = name === 'sarah', order = sarah ? ['row-sait', 'row-vivre', 'row-aime'] : ['row-vivre', 'row-sait', 'row-aime'];
      order.forEach((k, i) => { const r = K(k); K('vl').appendChild(r); r.className = 'lrow r' + (i + 1); });
      h.text('rk-vivre', sarah ? 'ENSUITE' : "D'ABORD"); h.text('rk-sait', sarah ? "D'ABORD · SARAH" : 'ENSUITE');
    }
  };
  return h;
}
function flipRecord(app) {
  const m = new Map();
  $$('[data-flip],[data-drag]:not(.chip)', app).forEach(el => m.set(el, el.getBoundingClientRect()));
  return m;
}
function flipPlay(app, before) {
  if (RM.matches) return;
  const s = app._scale || 1;
  before.forEach((r0, el) => {
    if (!el.isConnected) return;
    const r1 = el.getBoundingClientRect();
    const dx = (r0.left - r1.left) / s, dy = (r0.top - r1.top) / s;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    el.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: getComputedStyle(el).transform === 'none' ? 'none' : getComputedStyle(el).transform }],
      { duration: 560, easing: 'cubic-bezier(.2,.8,.2,1)' });
  });
}
function defineScene(id, who, steps) {
  const root = document.querySelector(`[data-scene="${id}"]`), app = $('.app', root);
  const sc = { id, root, app, steps, cur: -1, manual: false };
  sc.snap = snapshot(app);
  sc.h = helpers(sc);
  sc.apply = (i, animate = true) => {
    const before = animate ? flipRecord(app) : null;
    restore(sc);
    for (let j = 0; j <= i; j++) steps[j].do && steps[j].do(sc.h);
    if (before) flipPlay(app, before);
    sc.cur = i; sc.manual = false; resumeBtn(sc, false);
  };
  // Trois notes par écran ; chacune joue à la suite les étapes de sa phase
  const notes = $('.notes', root);
  const defs = NOTES[id].map(([upto, r, w], k) => ({ upto, r, who: w || (steps[upto] && steps[upto].who) || who, ph: PHASES[k] }));
  sc.defs = defs; sc.note = -1; sc.timers = [];
  defs.forEach((d, k) => {
    const from = k ? defs[k - 1].upto + 1 : 0;
    const n = document.createElement('div'); n.className = 'note stop'; n.dataset.scene = id; n.dataset.i = k;
    n.innerHTML = `<span class="who"><span class="pv">${personaSVG(d.who)}</span></span><div><p class="recit">${d.r}</p><p class="concept">${whyNote(id, k)}</p></div>`;
    notes.appendChild(n);
  });
  $('.dots', root).innerHTML = defs.map(() => '<i></i>').join('');
  const sb = $('.storyboard', root);
  if (sb) {
    sb.innerHTML = [['a','Avant'],['g','Le geste'],['p','Après']].map(([k, l], i) =>
      (i ? '<i>→</i>' : '') + `<button data-ph="${k}">${l}</button>`).join('');
    $$('button', sb).forEach((b, i) => b.addEventListener('click', () => goStop(stops.indexOf($$('.note', root)[i]))));
  }
  sc.go = k => {
    sc.timers.forEach(clearTimeout); sc.timers = [];
    const prev = sc.note; sc.note = k;
    $$('.note', root).forEach((n, i) => n.classList.toggle('on', i === k));
    $$('.dots i', root).forEach((d, i) => d.classList.toggle('on', i <= k));
    $$('.storyboard button', root).forEach((b, i) => b.classList.toggle('on', i === k));
    const target = defs[k].upto, start = prev === k - 1 && prev >= 0 ? defs[prev].upto + 1 : (k === 0 ? 0 : target);
    if (RM.matches || start >= target) { sc.apply(target, true); return; }
    for (let s = start, t = 0; s <= target; s++, t++) sc.timers.push(setTimeout(() => sc.apply(s, true), t * 750));
  };
  scenes[id] = sc;
  return sc;
}

/* ---------- « pourquoi ? » : conception, garde-fou, cadre (repris des V1 à V3) ---------- */
const WHY = {
  p01: [
    { k: "On entre, on n'administre pas : pas de sas, pas de formulaire long, jamais de mot de passe.", g: "Les données d'Amina restent sur son téléphone ou sur la tablette, pas en ligne, sauf ce qu'elle choisit de partager.", f: "PP · expression et participation de la personne." },
    { k: "Une question, trois grands choix : l'accès vient avant toute explication.", g: "Écouter, version simple et langue sont là sur chaque écran, dès le départ." },
    { k: "La Carte se crée en parlant, en écrivant ou en choisissant une image.", g: "Sarah n'écrit pas à la place d'Amina : la parole d'origine est gardée telle quelle." },
    { k: "Une Carte garde son identité, sa provenance et son historique, du premier geste jusqu'à l'engagement du CHRS." }
  ],
  p02: [
    { k: "Les états sont des lieux, pas un menu ; « ça va » reste toujours visible, sans geste.", g: "Parler au micro reste un choix : Amina peut aussi se contenter de toucher une carte. Ce qu'elle dit n'est jamais enregistré.", f: "PP · recueil des attentes, des besoins et des éléments de situation." },
    { k: "Ce qu'on peut prendre se voit au repos ; les destinations s'éclairent dès la prise." },
    { k: "Le geste se voit sans lire : carte soulevée, traînée, point de contact." },
    { k: "Changer d'état, c'est déplacer la carte : aucun autre chemin. Annuler, c'est le même geste à l'envers.", g: "Aucun écran de validation, aucune note : la personne n'est jamais évaluée." },
    { k: "La phrase d'origine est la seule trace du verbatim ; la version simple s'affiche à côté, jamais à sa place.", g: "Rien n'entre au dossier sans un geste d'Amina." }
  ],
  p03: [
    { k: "L'Ikigai réutilise le geste du Bilan : rien de nouveau à apprendre.", f: "PP · aspirations, souhaits et possibilités envisagées." },
    { k: "Les croisements se nomment sous le doigt, jamais comme une grille ou une coordonnée." },
    { k: "Une hypothèse n'est qu'un intitulé ; elle naît d'une Carte et en garde le lien.", g: "L'application ne propose aucune hypothèse : tout vient d'Amina ou de la séance." },
    { k: "À la prise, les quatre cercles s'éclairent : les destinations se montrent d'elles-mêmes." },
    { k: "La position est un geste, pas une mesure : aucun score n'est calculé." },
    { k: "Une hypothèse posée se reprend et se déplace à tout moment.", g: "L'écarter par le bord est le seul geste irréversible, et l'écran le dit clairement." }
  ],
  p04: [
    { k: "Les critères ne sont pas les Cartes : on range les quatre axes, jamais les hypothèses.", f: "PP · priorités exprimées par la personne." },
    { k: "Quatre rangs dits avec des mots : d'abord, ensuite, aussi, moins. Deux axes peuvent partager un rang.", g: "« Je ne sais pas encore » est une réponse légitime, jamais signalée comme un défaut." },
    { k: "Les lignes s'empilent dans l'ordre des rangs : la plus importante est haute et contrastée, la dernière discrète.", g: "C'est la personne qui lit ses lignes ; l'application ne calcule aucun classement." },
    { k: "Une ligne situe les idées les unes par rapport aux autres : quatre y tiennent, huit encore." },
    { k: "Réglé une fois, révisable toujours : l'ordre vaut pour toutes les hypothèses, présentes et à venir.", g: "Ni total, ni pourcentage : la phrase dit ce qui a changé, en mots." }
  ],
  p05: [
    { k: "Choisir qui éclaire quoi : chaque invité, dans sa langue et par son canal.", g: "Chaque invité voit uniquement l'hypothèse qui le concerne, jamais le dossier.", f: "PP · co-construction, coordination et regards croisés." },
    { k: "L'invitée reçoit le même geste que la personne : prendre, poser sur la ligne.", g: "Lien éphémère, sans compte ni installation ; il se régénère d'un geste s'il expire." },
    { k: "L'attente porte les commandes d'Amina : rythme des relances, retirer un invité, révéler sans attendre.", g: "On voit qui a répondu, jamais le contenu ; le silence est une réponse acceptable, dite sans reproche." },
    { k: "Les marques d'Amina en plein, sur ses lignes rangées." },
    { k: "Les marques de Salma en pointillé, sur les mêmes lignes : rien n'est encore comparé." },
    { k: "La bande s'étend de la marque la plus à gauche à la plus à droite.", g: "Aucune moyenne : un désaccord franc et un accord tiède ne se confondent jamais.", g2: "Sarah n'a qu'un carnet de rendez-vous, sans indicateur ni statut ; elle ne propose qu'en séance, à deux." },
    { k: "« Avec l'ordre de Sarah » ne déplace aucune marque : il réempile les lignes. Mêmes places, autre lecture.", g: "Le regard professionnel éclaire, il ne tranche pas." }
  ],
  p06: [
    { k: "Au repos, trois choses seulement : le chemin choisi, ses étapes, le temps.", f: "PP · objectifs personnalisés, modalités d'accompagnement, plan d'action et révision." },
    { k: "Deux ou trois mots par étape ; la phrase entière, sa date et ce qu'elle ouvre vivent dans le toucher." },
    { k: "La légende arrive avec les autres chemins et repart avec eux ; une alternative n'est jamais grise." },
    { k: "La condition s'écrit sur sa branche ; la dépendance se trace, avec sa phrase." },
    { k: "On essaie un futur sur une copie : le cadre en pointillé dit qu'on joue.", g: "Le vrai chemin reste intact ; rien n'est décidé par l'application." },
    { k: "Deux sorties, jamais implicites : garder l'idée pour la séance, ou refermer." },
    { k: "Ce qu'Amina emporte, en quatre temps et dans ses mots.", g: "Son dossier lui appartient : son récit reste amendable (« ce n'est pas comme ça que je le dirais ») et s'exporte, même si le compte de la structure est désactivé." }
  ],
  p07: [
    { k: "Le collectif ne reçoit jamais un dossier individuel.", g: "Seul passe ce que la personne choisit d'apporter, sous la forme qu'elle choisit.", f: "PE · participation des personnes accompagnées, expression collective et saisine." },
    { k: "Sa version et la version collective restent côte à côte : Amina voit exactement ce que verront les autres." },
    { k: "Le consentement est situé : quoi, pour qui, pourquoi.", g: "« Pas maintenant » reste possible ; chaque passage est inscrit dans l'historique de la Carte." },
    { k: "La même Carte, avec sa provenance, passe du jaune au vert.", g: "Les présents ne portent aucun statut ; l'absence est dite sans reproche." }
  ],
  p08: [
    { k: "La même table que le Bilan d'Amina, au pluriel.", f: "PE · diagnostic partagé." },
    { k: "Le tour de parole se voit : la main et la personne qui parle restent visibles." },
    { k: "Chaque carte porte sa source : parole consentie, équipe, CVS." },
    { k: "Qualification collective : situation individuelle, signal à vérifier, difficulté répétée, enjeu confirmé.", g: "Un cas isolé ne devient jamais une vérité générale." },
    { k: "La relecture à voix haute, une phrase par carte, ferme la boucle avant d'orienter." }
  ],
  p09: [
    { k: "Le même Ikigai, au pluriel ; « nous en vivons », ce sont les moyens et les financements.", f: "PE · orientations stratégiques." },
    { k: "Placement à tour de rôle ou à main levée, guidé par l'animatrice." },
    { k: "Deux placements revendiqués restent affichés, comme un sujet à discuter.", g: "Pas de moyenne des positions." },
    { k: "Le changement attendu est observable, pour pouvoir l'évaluer plus tard." }
  ],
  p10: [
    { k: "Le geste d'Amina en 04, avec les critères du métier : effet, droits, urgence, faisabilité, ressources, coopération.", f: "PE · priorisation et arbitrage des enjeux." },
    { k: "Le 360° du collectif : animation, équipe, personnes accompagnées, direction, CVS.", g: "Chaque voix garde sa marque ; aucune majorité automatique." },
    { k: "Chacun règle seul ses rangs et ses lignes, sur la tablette qui passe ou sur son mobile.", g: "On voit qui a placé, jamais où, jusqu'au geste de révélation." },
    { k: "Les marques de Karim en plein ; celles des autres restent invisibles." },
    { k: "Révélation : les marques de tous se superposent.", g: "Jamais de vote, jamais de comptage, pas même « la plupart »." },
    { k: "Les phrases nomment qui converge avec qui ; le désaccord reste ouvert." },
    { k: "La décision est une phrase dictée, reformulée, puis validée par le groupe.", g: "Elle garde sa provenance : diagnostic, orientation, critères, lignes." }
  ],
  p11: [
    { k: "Plusieurs solutions avant un objectif : on ne fige pas la première idée.", f: "PE · objectifs opérationnels et plan d'action." },
    { k: "Les mêmes lignes et la même bande que le 360° d'Amina : les regards se croisent sans se moyenner." },
    { k: "La Carte-engagement porte le fil depuis Papiers, la parole d'Amina." }
  ],
  p12: [
    { k: "La grammaire de Mon chemin, au pluriel : couloirs, décisions, événements.", f: "PE · pilotage, calendrier, suivi et évaluation." },
    { k: "La dépendance se trace sans reproche ; la condition s'écrit sur sa branche." },
    { k: "Une ligne par charge : son nom, ses porteurs, son rythme.", g: "On remarque les prénoms ; l'application ne compte jamais et ne dit pas qui porte le plus." },
    { k: "Le réel reboucle : un engagement reste révisable par ses résultats." },
    { k: "Un seul sens : le collectif ne lit jamais le chemin d'Amina.", g: "C'est elle qui y fait entrer ce qu'il propose, d'un geste, depuis son propre espace." }
  ]
};
function whyHTML(id, j, fallback) {
  const w = (WHY[id] || [])[j] || { k: fallback };
  return [['k', '🎨', 'Conception'], ['g', '🛡️', 'Garde-fou'], ['f', '📚', 'Cadre']]
    .filter(([key]) => w[key]).map(([key, ic, lab]) => `<span class="wl"><b>${ic} ${lab}</b> · ${w[key]}</span>`).join('');
}

/* ---------- « En savoir plus » : 🎨 Conception · 🛡️ Garde-fou · 📚 Cadre, pour chacun des 36 textes ---------- */
const NOTE_WHY = {
  p01: [
    ["Pour entrer, il suffit d'un prénom et d'une phrase.", "Les données d'Amina restent sur son téléphone ou sur la tablette, pas en ligne, sauf ce qu'elle choisit de partager.", "Loi 2002-2 et CASF L311-3 : libre choix et participation directe de la personne à son projet."],
    ["Une Carte se crée en parlant, en écrivant ou en choisissant une image.", "Sarah n'écrit pas à la place d'Amina : la parole d'origine est gardée telle quelle.", "Recommandation HAS (ex-Anesm) « Les attentes de la personne et le projet personnalisé »."],
    ["Une Carte garde son identité, sa provenance et son historique, jusqu'au Projet d'Établissement.", "Ce qui est écrit sur Amina lui est montré, dans ses mots et dans sa langue.", "CASF L311-3 : droit à l'information et accès aux informations qui la concernent."]
  ],
  p02: [
    ["Amina range ses cartes dans trois coins de l'écran ; « ça va » reste toujours à portée de main.", "Parler au micro reste un choix : Amina peut aussi se contenter de toucher une carte. Ce qu'elle dit n'est jamais enregistré.", "Projet personnalisé : recueil des attentes, des besoins et des éléments de situation."],
    ["Quand Amina prend une carte, les endroits où la poser s'allument.", "En posant une carte, Amina dit simplement où elle en est aujourd'hui.", "Accessibilité : gestes simples, pictos et FALC, dans l'esprit de la loi de 2005."],
    ["Changer d'état, c'est déplacer la carte ; annuler, c'est le même geste à l'envers.", "Le verbatim est gardé ; la version simple s'affiche à côté, en complément.", "RGPD : des données exactes, minimales, et rectifiables par la personne."]
  ],
  p03: [
    ["L'Ikigai reprend le geste du Ressenti ; ses croisements se nomment avec des mots.", "Les cercles parlent de ce que la personne aime et dont elle est capable : on part de ses forces.", "Projet personnalisé : aspirations, souhaits et possibilités envisagées."],
    ["Une idée naît d'une Carte et en garde le lien.", "Les idées viennent d'Amina, ou de la séance avec Sarah.", "CASF L311-3 : libre choix des prestations et de l'accompagnement."],
    ["Amina place ses idées du doigt et peut les déplacer quand elle veut.", "L'écarter par le bord est le seul geste irréversible, et l'écran le dit clairement.", "Recommandation HAS : co-construire le projet avec la personne, à partir de ses souhaits."]
  ],
  p04: [
    ["On range les quatre axes ; les Cartes gardent toutes leur valeur, les critères organisent la lecture.", "« Je ne sais pas encore » est une réponse à part entière.", "Projet personnalisé : des priorités exprimées par la personne elle-même."],
    ["Les lignes s'empilent dans l'ordre des rangs ; la phrase suit le geste : « plus à droite que… ».", "C'est Amina qui range, à la main.", "Recommandation HAS : la personne hiérarchise ses attentes, avec l'appui des professionnels."],
    ["À droite sur les lignes hautes, l'idée est vraiment portée ; réglé une fois, révisable toujours.", "Ce qui a changé se raconte avec des mots.", "Le projet personnalisé est réévalué régulièrement avec la personne, au moins chaque année."]
  ],
  p05: [
    ["Amina choisit qui l'éclaire et sur quoi : chacun dans sa langue, par son canal.", "Chaque invité voit seulement l'idée qui le concerne ; le dossier reste à Amina.", "CASF L311-3 : confidentialité des informations ; L311-5-1 : la personne de confiance."],
    ["L'invitée reçoit le même geste ; les regards s'affichent en onglets, une fois réunis.", "On voit qui a répondu ; les contenus se découvrent ensemble, et le silence est une réponse acceptable.", "Les proches sont associés à l'initiative de la personne, à ses côtés."],
    ["La bande va de la marque la plus à gauche à la plus à droite ; l'ordre de Sarah réempile les lignes.", "Sarah fait ses propositions en séance, avec Amina, à partir de son carnet.", "Projet personnalisé : co-construction, coordination et regards croisés."]
  ],
  p06: [
    ["Au repos : le chemin, ses étapes, le temps ; ◆ une décision d'Amina, ● un événement du monde.", "Le détail vit dans le toucher : l'écran reste léger pour la personne.", "Projet personnalisé : objectifs, modalités d'accompagnement et plan d'action."],
    ["On essaie un futur sur une copie : le cadre en pointillé dit qu'on joue.", "Le vrai chemin ne bouge pas : c'est Amina qui décide.", "Contrat de séjour et avenant : des objectifs et des prestations révisables."],
    ["Deux sorties, toujours explicites ; puis le plan, en quatre cases et dans ses mots.", "Son dossier lui appartient : récit amendable (« ce n'est pas comme ça que je le dirais ») et export, même si le compte de la structure est désactivé.", "RGPD : droit d'accès et droit à la portabilité des données (article 20)."]
  ],
  p07: [
    ["Le collectif ne reçoit jamais un dossier individuel.", "Seul passe ce que la personne choisit d'apporter, sous la forme qu'elle choisit.", "Projet d'Établissement : participation, expression collective et saisine."],
    ["Les deux versions côte à côte : Amina voit exactement ce que verront les autres.", "Amina sait ce qu'elle partage, avec qui et pourquoi ; elle peut aussi dire « pas maintenant ».", "RGPD : un consentement libre, éclairé, spécifique et révocable."],
    ["La même Carte, avec sa provenance, passe du jaune au vert.", "Tout le monde est à la même table ; une absence se dit simplement.", "CASF L311-6 : conseil de la vie sociale, ou autres formes de participation."]
  ],
  p08: [
    ["La même table que le Ressenti, au pluriel ; la tablette circule et la parole se voit.", "L'animation est un mandat du groupe : elle se retire et se redonne.", "Recommandation Anesm (2010) : un diagnostic partagé pour élaborer le projet d'établissement."],
    ["Chaque carte porte sa source : parole consentie, équipe, CVS.", "Chaque parole garde le nom de qui l'a dite.", "Une démarche participative : personnes accompagnées, professionnels et partenaires."],
    ["Qualification : situation individuelle, signal à vérifier, difficulté répétée, enjeu confirmé ; puis relecture à voix haute.", "Un cas isolé reste un signal ; il faut plusieurs voix pour faire un constat.", "Référentiel HAS d'évaluation : appuyer les décisions sur l'expression des personnes."]
  ],
  p09: [
    ["Le même Ikigai, au pluriel ; « nous en vivons », ce sont les moyens et les financements.", "Les orientations partent du constat partagé, porté par plusieurs voix.", "CASF L311-8 : un projet d'établissement établi pour cinq ans au plus."],
    ["Placements à tour de rôle ou à main levée, guidés par l'animatrice.", "Quand deux personnes placent différemment, les deux positions restent à l'écran.", "CASF L311-8 : le conseil de la vie sociale est consulté sur le projet."],
    ["Le changement attendu est formulé simplement, pour pouvoir être observé.", "La règle collective se décide ensemble, à partir de ce que chacun vit.", "Des changements observables : la base de l'évaluation de la qualité."]
  ],
  p10: [
    ["Le geste d'Amina, avec six critères du métier ; cinq regards autour d'une orientation.", "Chaque avis reste signé ; c'est la discussion qui tranche.", "Projet d'Établissement : priorisation et arbitrage des enjeux."],
    ["Chacun place seul, sur la tablette qui passe ou sur son mobile, puis tout se révèle.", "On voit qui a déjà placé ; on découvre les positions ensemble, puis on en parle.", "Une délibération attribuée : direction, personnes accompagnées, CVS, professionnels."],
    ["Les bandes nomment qui converge avec qui ; la décision devient une phrase du groupe.", "Un désaccord reste sur la table jusqu'à ce que le groupe en parle.", "Traçabilité : la décision garde sa provenance, du constat aux lignes."]
  ],
  p11: [
    ["On cherche plusieurs solutions avant de s'engager.", "Les solutions sont jugées d'abord sur leur effet pour les personnes.", "Projet d'Établissement : objectifs opérationnels et plan d'action."],
    ["Les mêmes lignes et la même bande que les Regards d'Amina.", "Quand l'équipe et les personnes jugent la faisabilité différemment, l'écart reste affiché.", "Recommandation Anesm : décliner les orientations en actions concrètes."],
    ["La Carte-engagement porte le fil depuis Papiers, la parole d'Amina.", "Chaque engagement a des noms et une date pour en reparler.", "Un plan d'action suivi dans le temps, dans le Projet d'Établissement."]
  ],
  p12: [
    ["La grammaire du Chemin, au pluriel : couloirs, décisions, événements, porteurs.", "On voit les prénoms de ceux qui s'engagent ; chacun apporte ce qu'il peut.", "Projet d'Établissement : pilotage, suivi et évaluation."],
    ["Un seul sens : le collectif ne lit jamais le chemin d'Amina.", "C'est elle qui y fait entrer ce qu'il propose, d'un geste, depuis son propre espace.", "Loi 2002-2 : le projet de la personne et le projet d'établissement se répondent."],
    ["Si le résultat ne suffit pas, on revient au constat.", "Quand ce qui est écrit et ce qui est vécu s'éloignent, cela se voit.", "Évaluation de la qualité des ESSMS tous les cinq ans, selon le référentiel HAS."]
  ]
};
function whyNote(id, k) {
  const t = (NOTE_WHY[id] || [])[k]; if (!t) return '';
  return [['🎨', 'Conception'], ['🛡️', 'Garde-fou'], ['📚', 'Cadre']]
    .map(([ic, lab], i) => t[i] ? `<span class="wl"><b>${ic} ${lab}</b> · ${t[i]}</span>` : '').join('');
}

/* ---------- Trois textes par écran : Avant · Le geste · Après ---------- */
const NOTES = {
  p01: [[0, "Amina ouvre HLuX ; on l'accueille par son prénom."], [2, "Elle touche Papiers, sa Carte dite avec Sarah."], [3, "La Carte s'ouvre, avec toute son histoire."]],
  p02: [[0, "Trois lieux : ça va, je ne sais pas, difficile."], [2, "Amina prend Papiers et la glisse vers « difficile »."], [4, "Posée. Sa phrase est gardée, mot pour mot."]],
  p03: [[1, "Quatre cercles : j'aime, j'en suis capable, je suis utile, j'en vis."], [4, "De Papiers naît une envie : lire ses courriers seule."], [5, "Elle la pose entre « j'en suis capable » et « j'en vis »."]],
  p04: [[1, "D'abord « j'en vis », ensuite « j'en suis capable »."], [3, "Sur ses lignes, elle glisse « Lire » vers la droite."], [4, "« Lire » arrive en tête de ce qui compte pour elle."]],
  p05: [[0, "Amina, au centre, choisit qui l'éclaire."], [4, "Salma répond en arabe ; les regards se superposent.", 'salma'], [5, "La bande montre où chacun se situe."]],
  p06: [[1, "Le chemin d'Amina, saison après saison."], [4, "Et si le rendez-vous à la CAF était repoussé ? Une copie se joue."], [6, "Rien n'a bougé ; elle emporte son plan."]],
  p07: [[0, "Sa difficulté reste privée, tant qu'elle ne choisit pas de la partager.", 'amina'], [2, "Amina dit oui : elle apporte le sujet.", 'amina'], [3, "Le sujet entre à l'ordre du jour."]],
  p08: [[1, "Aïcha a la parole ; la tablette circule."], [2, "Bruno pose une carte de l'équipe.", 'bruno'], [4, "L'équipe et Amina le disent : la difficulté se répète."]],
  p09: [[0, "Le même Ikigai, au pluriel."], [2, "Aïcha et Bruno placent la carte différemment.", 'bruno'], [3, "Les deux avis restent visibles ; le groupe écrit ce qu'il veut voir changer."]],
  p10: [[1, "Le groupe range six critères ; cinq personnes donnent leur avis."], [4, "Chacun place seul, puis tout se révèle.", 'karim'], [6, "Les écarts restent visibles ; le groupe décide."]],
  p11: [[0, "Trois solutions sur la table."], [1, "Placées sur deux lignes : effet, faisabilité."], [2, "Engagement : un atelier chaque mardi."]],
  p12: [[2, "Le suivi : qui porte quoi, et quand."], [3, "Amina relie l'atelier à son chemin.", 'amina'], [4, "Au printemps, trois personnes lisent seules leurs courriers."]]
};
const PHASES = ['a', 'g', 'p'];
function whyFor(id, from, to) {
  const ws = (WHY[id] || []).slice(from, to + 1); const pick = key => (ws.find(w => w && w[key]) || {})[key];
  const last = ws[ws.length - 1] || {};
  const gs = [...new Set(ws.flatMap(w => w ? [w.g, w.g2] : []).filter(Boolean))].slice(0, 2);
  const line = (ic, lab, t) => `<span class="wl"><b>${ic} ${lab}</b> · ${t}</span>`;
  return [last.k || pick('k')].filter(Boolean).map(t => line('🎨', 'Conception', t)).join('')
    + gs.map(t => line('🛡️', 'Garde-fou', t)).join('');
}
/* ---------- Le récit, écran par écran : une phrase, un portrait, un « pourquoi ? » ---------- */
defineScene('p01', 'amina', [
  { r: "Amina ouvre HLuX. On l'accueille par son prénom.", c: "On entre, on n'administre pas : ni sas, ni formulaire.", do: h => h.cls('choices', 'dim') },
  { r: "Trois gros choix. Rien à apprendre.", c: "Une question, trois boutons : l'accès d'abord.", do: h => h.cls('choices', 'dim', false) },
  { r: "Elle touche Papiers, dite mardi avec Sarah.", c: "La Carte vient de sa parole ; Sarah n'écrit pas à sa place.", do: h => { h.cls('ch-pap', 'hl'); h.touch('ch-pap'); } },
  { r: "La Carte s'ouvre, avec son histoire.", c: "Une Carte garde son identité jusqu'au Projet d'Établissement.", do: h => { h.hide('touch'); h.show('open'); h.say('Ta Carte garde tout son parcours.', 'بطاقتكِ تحتفظ بكلّ مسارها.', 'La carte garde tout.'); } }
]);
defineScene('p02', 'amina', [
  { ph: 'a', r: "Trois endroits : ça va, je ne sais pas, difficile.", c: "Les états sont des lieux, pas un menu. « Ça va » reste toujours visible." },
  { ph: 'g', r: "Amina prend Papiers. Les zones s'éclairent.", c: "Ce qu'on peut prendre se voit ; les destinations se montrent dès la prise.", do: h => { h.cls('pap', 'lifted'); h.glow(true, 'z-good', 'z-maybe', 'z-hard'); h.touch('pap'); } },
  { ph: 'g', r: "Elle la glisse vers « c'est difficile ».", c: "Le geste se voit sans lire : traînée, point de contact.", do: h => h.move('pap', 'hard-list') },
  { ph: 'p', r: "Posée. L'écran le redit.", c: "Pas de bouton « valider » ; annuler, c'est le même geste à l'envers.", do: h => { h.cls('pap', 'lifted', false); h.glow(false, 'z-good', 'z-maybe', 'z-hard'); h.hide('trail', 'touch'); h.say("Papiers va dans « c'est difficile ».", 'الأوراق في « صعب ».', "Papiers : c'est difficile."); } },
  { ph: 'p', r: "Sa phrase, telle qu'elle l'a dite.", c: "Le verbatim est gardé ; la version simple s'affiche à côté.", do: h => { h.say(null); h.show('big'); } }
]);
defineScene('p03', 'amina', [
  { ph: 'a', r: "Aimer, j'en suis capable, être utile, en vivre.", c: "L'Ikigai, avec le même geste qu'au Bilan : prendre, poser.", do: h => h.hide('i-pas', 'i-mis', 'i-pro', 'i-voc') },
  { ph: 'a', r: "Passion, Mission, Profession, Vocation.", c: "Les croisements sont nommés avec des mots, jamais des coordonnées.", do: h => h.show('i-pas', 'i-mis', 'i-pro', 'i-voc') },
  { ph: 'g', r: "De Papiers naît une idée.", c: "Les idées viennent d'Amina, jamais de l'application.", do: h => { h.show('lire'); h.say('Je voudrais lire mes courriers seule.', 'أريد أن أقرأ رسائلي وحدي.', null, 'amina'); } },
  { ph: 'g', r: "Elle la prend : les cercles s'éclairent.", c: "Les destinations se montrent d'elles-mêmes.", do: h => { h.say(null); h.cls('lire', 'lifted'); h.glow(true, 'c1', 'c2', 'c3', 'c4'); h.touch('lire'); } },
  { ph: 'g', r: "Sous son doigt : Profession.", c: "La position est un geste, pas une mesure.", do: h => { h.move('lire', 's-pro'); h.cls('i-pro', 'big'); } },
  { ph: 'p', r: "Posée. Elle pourra la déplacer.", c: "Une hypothèse reste vivante ; seul l'écart par le bord est définitif.", do: h => { h.cls('lire', 'lifted', false); h.glow(false, 'c1', 'c2', 'c3', 'c4'); h.cls('i-pro', 'big', false); h.hide('trail', 'touch'); h.say('« Lire mes courriers seule » près de Profession.', '« أقرأ رسائلي وحدي » قرب « مهنة ».'); } }
]);
defineScene('p04', 'amina', [
  { ph: 'a', r: "Qu'est-ce qui compte le plus ?", c: "On range les critères, jamais les Cartes." },
  { ph: 'a', r: "D'abord en vivre, ensuite j'en suis capable.", c: "Un ordre en mots, sans chiffre ; deux axes peuvent partager un rang.", do: h => { h.put('cr-vivre', 'r1'); h.put('cr-sait', 'r2'); h.put('cr-aime', 'r3'); h.put('cr-utile', 'r3'); h.say("D'abord, gagner ma vie.", 'أوّلاً، أن أكسب عيشي.', null, 'amina'); } },
  { ph: 'g', r: "Les lignes s'empilent dans cet ordre.", c: "La plus importante en haut, la plus marquée. L'application ne calcule rien.", do: h => { h.say(null); h.hide('paneA'); h.show('paneB'); } },
  { ph: 'g', r: "Elle glisse « Lire » vers la droite.", c: "On dit « plus à droite que… », jamais une note.", do: h => { h.left('m1', 86); h.touch('m1'); h.text('live', '« Lire » passe devant Formation.', '« أقرأ » قبل « التكوين ».'); } },
  { ph: 'p', r: "« Lire » tient à droite, en haut.", c: "À droite sur les lignes hautes : l'idée est vraiment portée.", do: h => { h.left('m2', 74); h.left('m3', 39); h.left('m4', 62); h.hide('touch'); h.text('live', ''); h.say('« Lire » est portée par tes lignes hautes.', '« أقرأ » قويّة في خطوطكِ العليا.'); } }
]);
defineScene('p05', 'amina', [
  { ph: 'a', r: "Amina au centre. Elle choisit qui l'éclaire.", c: "C'est elle qui invite, et sur quoi. Personne ne voit son dossier." },
  { ph: 'a', r: "Salma reçoit un lien, en arabe.", c: "Sans compte, de droite à gauche, le même geste.", who: 'salma', do: h => { h.show('phone'); h.say('Même geste, en arabe.', 'نفس الحركة، بالعربية.', null, 'salma'); } },
  { ph: 'g', r: "Les regards arrivent. M. Robert : pas encore.", c: "On voit qui a répondu, jamais le contenu. Le silence est accepté.", do: h => { h.say(null); h.hide('phone'); h.cls('ray-s', 'lit'); h.cls('ray-h', 'lit'); h.text('st-s', 'a répondu ✓', 'أجابت ✓'); h.cls('st-s', 'ok'); h.text('st-h', 'a répondu ✓', 'أجابت ✓'); h.cls('st-h', 'ok'); h.text('st-r', 'pas encore', 'ليس بعد'); h.cls('st-r', 'wait'); } },
  { ph: 'g', r: "Mon regard : où Amina place ses idées.", c: "Ses marques en plein, sur ses lignes rangées.", do: h => { h.hide('ring'); h.show('views'); h.view('mine'); } },
  { ph: 'g', r: "Le regard de Salma, sur les mêmes lignes.", c: "Ses marques en pointillé ; rien n'est encore comparé.", who: 'salma', do: h => { h.hide('ring'); h.show('views'); h.view('salma'); } },
  { ph: 'p', r: "Nos regards réunis : la bande dit l'écart.", c: "Bande étroite : on se rejoint. Large : on en parle. Aucune moyenne.", do: h => { h.hide('ring'); h.show('views'); h.view('both'); h.say('Personne ne gagne.', 'لا أحد يربح.'); } },
  { ph: 'p', r: "Avec l'ordre de Sarah : autre lecture.", c: "Le regard professionnel réempile les lignes, sans déplacer une marque.", who: 'sarah', do: h => { h.hide('ring'); h.show('views'); h.view('sarah'); h.say('Mêmes places, autre ordre.', 'نفس الأماكن، ترتيب آخر.', null, 'sarah'); } }
]);
defineScene('p06', 'amina', [
  { r: "Le chemin d'Amina, saison après saison.", c: "Montrer peu ; le détail vit dans le toucher.", do: h => h.hide('alt1', 'cond1', 'dep1', 'nalt', 'ncond', 'c-cond', 'c-dep', 'legend') },
  { r: "L'étape du fil : l'atelier avec Sarah.", c: "◆ une décision d'Amina, ● un événement du monde.", do: h => { h.cls('nfil', 'pulse'); h.say('Le jeudi, avec Sarah.', 'كلّ خميس، مع سارة.', null, 'amina'); } },
  { r: "Les autres chemins, et leur légende.", c: "Une alternative n'est jamais grise.", do: h => { h.say(null); h.cls('nfil', 'pulse', false); h.show('alt1', 'nalt', 'cond1', 'ncond', 'legend'); h.cls('b-alt', 'hl'); } },
  { r: "Une condition, une attente.", c: "La condition s'écrit sur sa branche ; la dépendance se trace.", do: h => h.show('c-cond', 'c-dep', 'dep1') },
  { r: "Et si le rendez-vous à la CAF était repoussé ?", c: "La seule simulation : le cadre en pointillé dit qu'on joue, sur une copie.", do: h => { h.show('whatif'); h.css('moved', 'left', '600px'); h.cls('b-whatif', 'hl'); } },
  { r: "Elle referme. Rien n'a bougé.", c: "Deux sorties, jamais implicites : garder l'idée ou refermer.", do: h => { h.hide('whatif', 'c-cond', 'c-dep'); h.cls('b-whatif', 'hl', false); h.say("Ton chemin n'a pas changé.", 'طريقكِ لم يتغيّر.'); } },
  { r: "Elle emporte son plan d'action.", c: "Quatre temps, dans ses mots, sans échéance qui menace.", do: h => { h.say(null); h.show('plan'); } }
]);
defineScene('p07', 'aicha', [
  { r: "Au CHRS, sa difficulté reste à elle.", c: "Le collectif ne reçoit jamais un dossier individuel.", who: 'amina' },
  { r: "Sa phrase, et une version pour tous.", c: "Amina voit exactement ce que verront les autres.", who: 'amina', do: h => h.show('v-coll', 'consent') },
  { r: "Amina dit oui. Elle apporte le sujet.", c: "Le consentement est situé ; « pas maintenant » reste possible.", who: 'amina', do: h => { h.cls('yes', 'hl'); h.say("Oui, j'apporte.", 'نعم، أُقدّمه.', null, 'amina'); } },
  { r: "Le sujet entre à l'ordre du jour.", c: "La même Carte, avec sa provenance : du jaune au vert.", do: h => { h.hide('consent'); h.put('sujet', 'agenda'); h.hide('v-coll'); h.say('On en parle mardi.', null, null, 'aicha'); } }
]);
defineScene('p08', 'aicha', [
  { r: "Diagnostic partagé. Aïcha a la parole.", c: "La même table qu'au Bilan, au pluriel." },
  { r: "La tablette passe à Bruno.", c: "Le tour de parole se voit : la main, la personne.", who: 'bruno', do: h => { h.hide('sp-a'); h.show('sp-b'); h.text('sp-txt', '🎙️ La parole est à Bruno'); } },
  { r: "Bruno pose une carte de l'équipe.", c: "Chaque carte porte sa source : 🗣️ parole, 👥 équipe, 🏛️ CVS.", who: 'bruno', do: h => { h.hide('sp-a'); h.show('sp-b'); h.text('sp-txt', '🎙️ La parole est à Bruno'); h.put('bruno', 'z-hard'); h.say('Les lettres arrivent sans explication.', null, null, 'bruno'); } },
  { r: "Deux sources : difficulté répétée.", c: "Un cas isolé ne devient jamais une vérité générale.", do: h => { h.hide('sp-a'); h.show('sp-b'); h.text('sp-txt', '🎙️ La parole est à Bruno'); h.put('cc', 'z-hard'); h.text('q-cc', 'difficulté répétée'); h.cls('q-cc', 'rep'); } },
  { r: "Le diagnostic est relu à voix haute.", c: "Le groupe corrige avant d'orienter.", do: h => { h.hide('sp-a'); h.show('sp-b'); h.text('sp-txt', '🎙️ La parole est à Bruno'); h.say('« Comprendre les courriers : difficulté répétée. »'); } }
]);
defineScene('p09', 'aicha', [
  { r: "Le même Ikigai, au pluriel.", c: "« Nous faire vivre » : les moyens et les financements." },
  { r: "Aïcha place la carte près de Mission.", c: "À tour de rôle ou à main levée.", do: h => { h.put('acc', 's-mis'); h.text('acc-s', 'Aïcha · Mission'); h.say("C'est notre mission.", null, null, 'aicha'); } },
  { r: "Bruno la place près de Vocation.", c: "Deux placements revendiqués, aucune moyenne.", who: 'bruno', do: h => { h.show('ghost'); h.say('Je pense aux moyens.', null, null, 'bruno'); } },
  { r: "Deux marques. Un changement attendu.", c: "Un changement observable, pour pouvoir l'évaluer.", do: h => { h.say(null); h.show('change'); } }
]);
defineScene('p10', 'aicha', [
  { r: "Le CHRS range ses six critères.", c: "Le même geste qu'Amina en 04, avec les critères du métier." },
  { r: "Le cercle des regards : cinq voix autour.", c: "Le 360° du collectif : animatrice, équipe, personnes accompagnées, direction, CVS.", do: h => { h.hide('paneA'); h.show('ring2'); } },
  { r: "Chacun place seul, en privé.", c: "On voit qui a placé, jamais où : l'indépendance avant la révélation.", who: 'karim', do: h => { h.hide('paneA', 'ring2'); h.show('neutral'); } },
  { r: "Karim place, sans voir les autres.", c: "Les lignes restent privées jusqu'à la révélation.", who: 'karim', do: h => { h.hide('neutral', 'paneA', 'ring2', 'a1', 'a2', 'a3', 'bb1', 'bb2', 'bb3', 'l1', 'l2', 'l3', 'b1', 'b2', 'b3', 'phr', 'dec'); h.show('paneC'); } },
  { r: "Révélation : toutes les marques.", c: "Jamais de vote, jamais « la plupart ».", do: h => h.show('a1', 'a2', 'a3', 'bb1', 'bb2', 'bb3', 'l1', 'l2', 'l3') },
  { r: "La bande dit l'écart.", c: "Aïcha et Bruno se rejoignent ; Karim et Léa, non, sur la faisabilité.", do: h => { h.hide('paneA', 'ring2', 'dec'); h.show('paneC', 'b1', 'b2', 'b3', 'phr'); } },
  { r: "La décision devient une phrase.", c: "Dictée, reformulée, validée par le groupe.", do: h => { h.hide('paneA', 'ring2', 'phr'); h.show('paneC', 'b1', 'b2', 'b3', 'dec'); h.say('On commence par un atelier.', null, null, 'aicha'); } }
]);
defineScene('p11', 'aicha', [
  { r: "Trois solutions sur la table.", c: "Plusieurs idées avant un engagement.", do: h => h.hide('ls', 'eng') },
  { r: "Placées sur deux lignes.", c: "Les mêmes lignes et la même bande que le 360° d'Amina.", do: h => h.show('ls') },
  { r: "Engagement : un atelier chaque mardi.", c: "La Carte-engagement porte le fil depuis Papiers.", do: h => { h.show('eng'); h.cls('sol1', 'hl'); h.say('Engagement validé.'); } }
]);
defineScene('p12', 'lea', [
  { r: "Le pilotage : la grammaire de Mon chemin.", c: "Une seule grammaire, pour la personne comme pour l'établissement.", do: h => h.hide('dep', 'cond', 'perm', 'jeudi', 'c-dep', 'c-cond') },
  { r: "Une attente, une condition.", c: "La dépendance se trace sans reproche.", do: h => h.show('dep', 'cond', 'perm', 'jeudi', 'c-dep', 'c-cond') },
  { r: "Ce que nous portons : des prénoms, un rythme.", c: "On remarque les prénoms, jamais un total.", do: h => { h.hide('c-dep', 'c-cond'); h.show('carry'); } },
  { r: "Amina relie l'atelier à son chemin.", c: "Un seul sens : c'est elle qui choisit ce qui entre.", who: 'amina', do: h => { h.hide('carry'); h.show('inset'); h.cls('link', 'hl'); h.cls('tue', 'hl'); h.say('Je le relie à mon chemin.', 'أربطها بطريقي.', null, 'amina'); } },
  { r: "Trois personnes lisent seules leurs courriers.", c: "Le réel reboucle : retour au constat pour les relances.", do: h => { h.say(null); h.hide('inset'); h.show('res'); } }
]);
const FIL = { p02: 1, p03: 2, p04: 3, p06: 4, p07: 5, p11: 6 };

/* ---------- Arrêts, défilement guidé ---------- */
const stops = $$('.stop');
let cur = -1;
const lineY = () => innerHeight * (portrait() ? 0.8 : 0.5);
function centerOf(el) { const r = el.getBoundingClientRect(); return r.top + Math.min(r.height, innerHeight) / 2; }
function pick() {
  const L = lineY(); let best = 0, bd = Infinity;
  stops.forEach((s, i) => { const r = s.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    const d = L < r.top ? r.top - L : L > r.bottom ? L - r.bottom : 0; const dc = Math.abs(centerOf(s) - L) / 1e4;
    if (d + dc < bd) { bd = d + dc; best = i; } });
  return best;
}
function activate(i, fromUser = true) {
  if (i === cur) return; const prev = cur; cur = i;
  const s = stops[i];
  // scène
  if (s.classList.contains('note')) {
    const sc = scenes[s.dataset.scene], j = +s.dataset.i;
    if (sc.note !== j || sc.manual) sc.go(j);
  }
  // sections à état
  stops.forEach((x, k) => { if (!x.classList.contains('note')) x.classList.toggle('on', k <= i && (x.dataset.stop === 'hinge' || x.dataset.stop === 'epilogue') && k >= i - 4); });
  // navigation
  const sceneEl = s.closest('[data-scene]'); const sid = sceneEl ? sceneEl.dataset.scene : null;
  $$('[data-nav]').forEach(a => a.setAttribute('aria-current', String(a.dataset.nav === sid)));
  // Menu qui déborde (mobile) : on fait glisser l'item courant au centre.
  const navCur = $(`[data-nav="${sid}"]`), row = navCur && navCur.closest('.nav-row');
  if (row && row.scrollWidth > row.clientWidth + 1) {
    const r = navCur.getBoundingClientRect(), rr = row.getBoundingClientRect();
    row.scrollTo({ left: row.scrollLeft + r.left - rr.left - (rr.width - r.width) / 2, behavior: 'smooth' });
  }
  // fil des Cartes
  let lit = 0;
  Object.entries(FIL).forEach(([id, m]) => {
    const last = $$('.note', scenes[id].root).pop(); const on = i >= stops.indexOf(last);
    const mEl = $(`[data-nav="${id}"]`); const was = mEl.classList.contains('fil');
    mEl.classList.toggle('fil', on); if (on) lit++;
    if (on && !was && prev >= 0 && prev < i && stops.indexOf(last) === i) flyTo(scenes[id], mEl, m >= 5);
  });
  const nb = $('.controls [data-go="next"]');
  if (nb) { const last = i >= stops.length - 1; nb.classList.toggle('is-end', last);
    nb.innerHTML = last ? 'Fin 🎉' : '<span class="lbl-next">Suivant </span>▸'; nb.setAttribute('aria-label', last ? "Fin de l'atlas" : "Étape suivante"); }
  if (settings.listen) speakStop(s);
  if (auto.on) auto.schedule();
}
function flyTo(sc, mEl, pe) {
  if (RM.matches) return;
  const from = ($('[data-k="pap"],[data-k="lire"],[data-k="nfil"],[data-k="sujet"],[data-k="eng"]', sc.app) || sc.app).getBoundingClientRect();
  const to = mEl.getBoundingClientRect();
  const f = document.createElement('div'); f.className = 'flyer' + (pe ? ' pe' : ''); f.textContent = '📄 Papiers';
  document.body.appendChild(f);
  f.style.left = from.left + 'px'; f.style.top = from.top + 'px';
  const dx = to.left - from.left, dy = to.top - from.top;
  f.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(.6)`, opacity: .2 }],
    { duration: 900, easing: 'cubic-bezier(.5,0,.2,1)' }).onfinish = () => { f.remove(); mEl.classList.add('pop'); setTimeout(() => mEl.classList.remove('pop'), 500); };
}
let ticking = false, pending = null, pendT = null;
addEventListener('scroll', () => {
  if (pending !== null) { clearTimeout(pendT); pendT = setTimeout(() => { pending = null; }, 160); return; }
  if (ticking) return; ticking = true; setTimeout(() => { ticking = false; activate(pick()); }, 40);
}, { passive: true });
let lastY = -1;
setInterval(() => { if (pending === null && scrollY !== lastY) { lastY = scrollY; activate(pick()); } }, 200);
function goStop(i) {
  i = Math.max(0, Math.min(stops.length - 1, i));
  const el = stops[i], r = el.getBoundingClientRect();
  const target = Math.max(0, scrollY + r.top + Math.min(r.height, innerHeight) / 2 - lineY());
  pending = i; activate(i);
  if (Math.abs(target - scrollY) < 2) { pending = null; return; }
  scrollTo({ top: target, behavior: RM.matches ? 'auto' : 'smooth' });
  clearTimeout(pendT); pendT = setTimeout(() => { pending = null; }, 1200);
  setTimeout(() => { if (pending === i && Math.abs(scrollY - target) > 40) scrollTo({ top: target, behavior: 'auto' }); }, 900);
}
const base = () => pending !== null ? pending : cur;
const next = () => goStop(base() + 1), prev = () => goStop(base() - 1);

/* ---------- Lecture automatique ---------- */
const auto = { on: false, t: null,
  schedule() { clearTimeout(this.t); if (!this.on) return;
    const s = stops[cur]; const len = (s.textContent || '').length;
    const ms = Math.max(4200, Math.min(14000, len * 55)) + (settings.listen ? 1800 : 0);
    this.t = setTimeout(() => { if (cur >= stops.length - 1) return this.stop(); next(); }, ms); },
  start() { this.on = true; $('[data-go="auto"]').setAttribute('aria-pressed', 'true'); $('[data-go="auto"]').textContent = '⏸'; hint('Lecture automatique. Touchez l\'écran pour l\'arrêter.'); if (cur < 0) activate(pick()); this.schedule(); },
  stop() { this.on = false; clearTimeout(this.t); const b = $('[data-go="auto"]'); b.setAttribute('aria-pressed', 'false'); b.textContent = '▶'; }
};
['pointerdown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, e => { if (auto.on && !e.target.closest('.controls')) auto.stop(); }, { passive: true }));

/* ---------- Commandes ---------- */
$$('[data-go]').forEach(b => b.addEventListener('click', () => {
  const g = b.dataset.go; if (g === 'next') next(); else if (g === 'prev') prev();
}));
addEventListener('keydown', e => {
  if (e.target.closest('input,textarea') || picked) return;
  if (['ArrowRight', 'PageDown', ' '].includes(e.key) && !e.target.closest('[data-drag]')) { e.preventDefault(); if (auto.on) auto.stop(); next(); }
  else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); if (auto.on) auto.stop(); prev(); }
});
$$('.note').forEach(n => n.addEventListener('click', () => goStop(stops.indexOf(n))));
let suppressClick = false;
$$('.device').forEach(dev => dev.addEventListener('click', e => {
  if (suppressClick) { suppressClick = false; return; }
  if (e.target.closest('[data-drag],button,a,.aid')) return;
  next();
}));

/* ---------- Les trois aides ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('.aid[data-aid]'); if (!b) return;
  e.stopPropagation();
  const k = b.dataset.aid;
  if (k === 'lang') settings.lang = settings.lang === 'ar' ? 'fr' : 'ar';
  else settings[k] = !settings[k];
  refreshAll();
  if (k === 'listen') { if (settings.listen) { hint('Écouter : chaque étape est lue à voix haute.'); speakStop(stops[cur] || stops[0]); } else speechSynthesis.cancel(); }
  if (k === 'lang') hint(settings.lang === 'ar' ? 'Les écrans d\'Amina passent en arabe.' : 'Retour au français.');
  if (k === 'simple') hint(settings.simple ? 'Version simple (FALC) activée.' : 'Version simple désactivée.');
}, true);
function voice(lang) { const v = speechSynthesis.getVoices(); return v.find(x => x.lang && x.lang.toLowerCase().startsWith(lang)); }
let warnedAr = false;
function speak(text, lang) {
  if (!('speechSynthesis' in window) || !text) return;
  const u = new SpeechSynthesisUtterance(text);
  const v = voice(lang); if (v) u.voice = v; u.lang = lang === 'ar' ? 'ar' : 'fr-FR'; u.rate = 1;
  speechSynthesis.speak(u);
}
function speakStop(s) {
  if (!('speechSynthesis' in window)) { hint('La lecture à voix haute n\'est pas disponible ici.'); return; }
  speechSynthesis.cancel();
  const rec = s.querySelector('.recit'); speak(rec ? rec.textContent : (s.querySelector('h2,h1')?.textContent || ''), 'fr');
  if (settings.lang === 'ar' && s.classList.contains('note')) {
    const say = $('[data-k="say"].on', scenes[s.dataset.scene].app);
    if (say && say.dataset.ar) { if (voice('ar')) speak(say.dataset.ar, 'ar'); else if (!warnedAr) { warnedAr = true; hint('Pas de voix arabe sur cet appareil : la lecture continue en français.'); } }
  }
}
let hintT; function hint(m) { const h = $('.hint'); h.textContent = m; h.classList.add('show'); clearTimeout(hintT); hintT = setTimeout(() => h.classList.remove('show'), 2600); }

/* ---------- Prendre la main : glisser-poser ---------- */
function resumeBtn(sc, on) {
  let b = $('.resume', sc.root);
  if (on && !b) { b = document.createElement('button'); b.className = 'resume'; b.textContent = '↺ Reprendre la démo';
    b.addEventListener('click', e => { e.stopPropagation(); sc.apply(sc.note >= 0 ? sc.defs[sc.note].upto : 0, true); }); $('.device', sc.root).appendChild(b); }
  if (b) b.hidden = !on;
}
function sceneOf(el) { return scenes[el.closest('[data-scene]').dataset.scene]; }
function dropTargets(app, el) { return $$('.drop', app).filter(d => el.classList.contains('chip') ? d.hasAttribute('data-line') && d.contains(el) : !d.hasAttribute('data-line') && !d.contains(el.parentNode === d ? null : null)); }
function dropInto(el, d) {
  const box = $(':scope > .list', d) || d; const before = flipRecord(el.closest('.app'));
  box.appendChild(el); flipPlay(el.closest('.app'), before);
}
function announce(sc, el, d) {
  const h = sc.h, n = el.dataset.name || el.textContent.trim(), nar = el.dataset.nameAr || n;
  if (d.hasAttribute('data-line')) {
    const left = parseFloat(el.style.left); const others = $$('.chip:not(.me)', d).map(c => ({ n: c.textContent.trim(), x: parseFloat(c.style.left) })).filter(o => o.x < left).sort((a, b) => b.x - a.x);
    h.say(others.length ? `« ${n} » se tient plus à droite que ${others[0].n}.` : `« ${n} » se tient à gauche de la ligne.`);
  } else h.say(`${n} va dans « ${d.dataset.name || 'cet endroit'} ».`, `${nar} ← « ${d.dataset.nameAr || ''} »`);
}
let drag = null, picked = null;
document.addEventListener('pointerdown', e => {
  const el = e.target.closest('.app [data-drag]'); if (!el || e.button > 0) return;
  const sc = sceneOf(el); const app = sc.app;
  drag = { el, sc, app, x0: e.clientX, y0: e.clientY, moved: false, s: app._scale || 1 };
  el.setPointerCapture(e.pointerId);
});
document.addEventListener('pointermove', e => {
  if (!drag) return; const { el, s, app } = drag;
  const dx = (e.clientX - drag.x0) / s, dy = (e.clientY - drag.y0) / s;
  if (!drag.moved && Math.hypot(dx, dy) < 6) return;
  if (!drag.moved) { drag.moved = true; el.classList.add('dragging'); drag.sc.manual = true; resumeBtn(drag.sc, true); if (auto.on) auto.stop();
    drag.targets = $$('.drop', app).filter(d => el.classList.contains('chip') ? d.contains(el) : !d.hasAttribute('data-line')); drag.targets.forEach(d => d.classList.add('glow')); }
  if (el.classList.contains('chip')) {
    const line = el.parentNode.getBoundingClientRect(); const pct = Math.max(4, Math.min(96, (e.clientX - line.left) / line.width * 100));
    el.style.transition = 'none'; el.style.left = pct + '%';
  } else el.style.transform = `translate(${dx}px,${dy}px) scale(1.05)`;
});
document.addEventListener('pointerup', e => {
  if (!drag) return; const { el, sc, app } = drag; const d0 = drag; drag = null;
  if (!d0.moved) return;
  suppressClick = true; setTimeout(() => suppressClick = false, 50);
  el.classList.remove('dragging'); (d0.targets || []).forEach(d => d.classList.remove('glow'));
  if (el.classList.contains('chip')) { el.style.transition = ''; announce(sc, el, el.parentNode); return; }
  el.style.pointerEvents = 'none'; const under = document.elementFromPoint(e.clientX, e.clientY); el.style.pointerEvents = '';
  const d = under && under.closest('.drop'); el.style.transform = '';
  if (d && app.contains(d) && !d.hasAttribute('data-line')) { dropInto(el, d); announce(sc, el, d); }
});
// Clavier : Entrée pour prendre, flèches pour choisir, Entrée pour poser
$$('.app [data-drag]').forEach(el => { el.tabIndex = 0; el.setAttribute('role', 'button'); el.setAttribute('aria-label', (el.dataset.name || el.textContent.trim()) + ' : Entrée pour prendre'); });
document.addEventListener('keydown', e => {
  const el = e.target.closest && e.target.closest('.app [data-drag]');
  if (!picked && el && e.key === 'Enter' && !el.classList.contains('chip')) {
    e.preventDefault(); const sc = sceneOf(el); picked = { el, sc, list: $$('.drop', sc.app).filter(d => !d.hasAttribute('data-line')), i: 0 };
    el.classList.add('lifted'); sc.manual = true; resumeBtn(sc, true); picked.list[0].classList.add('glow'); hint('Flèches pour choisir un endroit, Entrée pour poser, Échap pour annuler.'); return;
  }
  if (picked) {
    const { list } = picked;
    if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) { e.preventDefault(); list[picked.i].classList.remove('glow'); picked.i = (picked.i + (/Right|Down/.test(e.key) ? 1 : list.length - 1)) % list.length; list[picked.i].classList.add('glow'); }
    else if (e.key === 'Enter') { e.preventDefault(); const d = list[picked.i]; d.classList.remove('glow'); picked.el.classList.remove('lifted'); dropInto(picked.el, d); announce(picked.sc, picked.el, d); picked.el.focus(); picked = null; }
    else if (e.key === 'Escape') { list[picked.i].classList.remove('glow'); picked.el.classList.remove('lifted'); picked = null; }
  }
  const chip = el && el.classList.contains('chip') ? el : null;
  if (chip && ['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); const sc = sceneOf(chip); sc.manual = true; resumeBtn(sc, true);
    chip.style.left = Math.max(4, Math.min(96, parseFloat(chip.style.left) + (e.key === 'ArrowRight' ? 4 : -4))) + '%'; announce(sc, chip, chip.parentNode); }
}, true);

/* ---------- Onglets du 360° ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('.views .tab'); if (!t) return;
  e.stopPropagation(); const sc = sceneOf(t); sc.manual = true; resumeBtn(sc, true);
  const before = flipRecord(sc.app); sc.h.view(t.dataset.tab); flipPlay(sc.app, before);
}, true);

window.HLUX = { scenes, stops, activate: i => activate(i) };
/* ---------- Tout déplier ---------- */
const allBtn = $('[data-go="why"]');
if (allBtn) allBtn.addEventListener('click', e => {
  e.stopPropagation(); const open = !document.body.classList.contains('deep');
  document.body.classList.toggle('deep', open); allBtn.setAttribute('aria-pressed', String(open)); allBtn.textContent = open ? 'Version courte' : 'En savoir plus';
});
// À chaque ouverture (y compris retour arrière depuis le cache), on repart en version courte.
const shortVersion = () => { document.body.classList.remove('deep'); if (allBtn) { allBtn.setAttribute('aria-pressed', 'false'); allBtn.textContent = 'En savoir plus'; } };
shortVersion(); addEventListener('pageshow', shortVersion);
/* ---------- Plein écran, là où le navigateur le permet ---------- */
const fsBtn = $('[data-go="fs"]');
if (fsBtn && document.fullscreenEnabled) {
  fsBtn.hidden = false;
  fsBtn.addEventListener('click', e => { e.stopPropagation(); (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => hint("Le plein écran n'est pas disponible ici.")); });
  document.addEventListener('fullscreenchange', () => { fsBtn.setAttribute('aria-label', document.fullscreenElement ? 'Quitter le plein écran' : 'Plein écran'); fit(); });
}
/* ---------- Démarrage ---------- */
refreshAll();
fit();
Object.values(scenes).forEach(sc => { sc.apply(0, false); $$('.dots i', sc.root)[0].classList.add('on'); });
addEventListener('resize', () => { fit(); });
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => {};
const SLUG = { cartes: 'p01', ressenti: 'p02', envies: 'p03', priorites: 'p04', regards: 'p05', chemin: 'p06', sujets: 'p07', constat: 'p08', cap: 'p09', choix: 'p10', actions: 'p11', suivi: 'p12' };
const hash = SLUG[location.hash.slice(1)] || location.hash.slice(1);
setTimeout(() => {
  if (hash && scenes[hash]) { const first = $('.note', scenes[hash].root); goStop(stops.indexOf(first)); }
  activate(pick());
}, 60);
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const slug = a.getAttribute('href').slice(1), id = SLUG[slug] || slug; if (!scenes[id]) return;
  e.preventDefault(); history.replaceState(null, '', '#' + slug); goStop(stops.indexOf($('.note', scenes[id].root)));
}));
})();
