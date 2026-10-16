// Shared helpers: icons, storage, formatting, sheets, toasts, common markup.

export const ICONS = {
  back: 'M15 5l-7 7 7 7',
  chev: 'M9 5l7 7-7 7',
  down: 'M6 9l6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  search: 'M4 11a7 7 0 1014 0 7 7 0 10-14 0M20 20l-4-4',
  user: 'M8 8a4 4 0 108 0 4 4 0 10-8 0M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8',
  home: 'M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1z',
  grid: 'M6 4h3a2 2 0 012 2v3a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2zM15 4h3a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2V6a2 2 0 012-2zM6 13h3a2 2 0 012 2v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3a2 2 0 012-2zM15 13h3a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2v-3a2 2 0 012-2z',
  star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z',
  convert: 'M4 8h15l-3.5-3.5M20 16H5l3.5 3.5',
  split: 'M6 8a3 3 0 106 0 3 3 0 10-6 0M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5a3 3 0 010 6M21 20c0-2.6-1.6-4.8-4-5.6',
  scan: 'M4 8V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2M4 12h16',
  calendar: 'M7 5h10a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V8a3 3 0 013-3zM8 3v4M16 3v4M4 10h16',
  calc: 'M8 3h8a3 3 0 013 3v12a3 3 0 01-3 3H8a3 3 0 01-3-3V6a3 3 0 013-3zM8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01',
  coins: 'M3 9a6 6 0 1012 0A6 6 0 103 9zM14.6 9.6a6 6 0 11-5 5',
  wallet: 'M4 7a2 2 0 012-2h12v4M4 7v10a2 2 0 002 2h14V9H6a2 2 0 01-2-2zM16 14h.01',
  sparkle: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z',
  tag: 'M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8zM7.5 7.5h.01',
  house: 'M4 11l8-7 8 7v9a1 1 0 01-1 1H5a1 1 0 01-1-1zM10 21v-6h4v6',
  todo: 'M10 6h10M10 12h10M10 18h10M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2',
  dice: 'M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2zM8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01',
  fuel: 'M4 21V5a2 2 0 012-2h6a2 2 0 012 2v16M3 21h12M4 10h10M14 8l3 3v6a1.5 1.5 0 003 0V9l-3-3',
  parking: 'M6 3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6a3 3 0 013-3zM10 17V7h3a3 3 0 010 6h-3',
  globe: 'M3 12a9 9 0 1018 0 9 9 0 10-18 0M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9M12 3C9.5 5.7 8.2 8.7 8.2 12s1.3 6.3 3.8 9',
  compass: 'M3 12a9 9 0 1018 0 9 9 0 10-18 0M15.5 8.5l-2 5-5 2 2-5z',
  torch: 'M8 3h8v4l-2 3v11h-4V10L8 7zM12 13v2',
  level: 'M5 9h14a3 3 0 010 6H5a3 3 0 010-6zM10.5 12a1.5 1.5 0 103 0 1.5 1.5 0 10-3 0M9 9v6M15 9v6',
  ruler: 'M3 16L16 3l5 5L8 21zM7 12l2 2M10 9l2 2M13 6l2 2',
  swap: 'M8 4v16M8 4L4.5 7.5M8 4l3.5 3.5M16 20V4M16 20l-3.5-3.5M16 20l3.5-3.5',
  backspace: 'M9 5h11a1 1 0 011 1v12a1 1 0 01-1 1H9l-6-7zM12.5 9.5l5 5M17.5 9.5l-5 5',
  copy: 'M10 8h8a2 2 0 012 2v8a2 2 0 01-2 2h-8a2 2 0 01-2-2v-8a2 2 0 012-2zM16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2',
  share: 'M12 3v12M8 7l4-4 4 4M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6',
  clock: 'M3 12a9 9 0 1018 0 9 9 0 10-18 0M12 7v5l3 2',
  info: 'M3 12a9 9 0 1018 0 9 9 0 10-18 0M12 11v5M12 8h.01',
  pin: 'M12 21s-7-6.2-7-11.5A7 7 0 0119 9.5C19 14.8 12 21 12 21zM9.5 9.5a2.5 2.5 0 105 0 2.5 2.5 0 10-5 0',
  car: 'M4 13l2-6h12l2 6v3H4zM6 16v2M18 16v2M7.5 13h.01M16.5 13h.01',
  plane: 'M21 15l-8-4V5.5a1.5 1.5 0 00-3 0V11l-8 4v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-4.5l8 2.5z',
  bus: 'M6 3h12a2 2 0 012 2v14H4V5a2 2 0 012-2zM4 11h16M7 19v2M17 19v2M8 15h.01M16 15h.01',
  train: 'M7 3h10a3 3 0 013 3v8a3 3 0 01-3 3H7a3 3 0 01-3-3V6a3 3 0 013-3zM4 10h16M8 21l2-4M16 21l-2-4M8.5 13.5h.01M15.5 13.5h.01',
  food: 'M7 3v8M5 3v4a2 2 0 004 0V3M7 11v10M17 3c-2 0-3 2-3 5s1 4 3 4v9',
  camera: 'M4 8h3l2-3h6l2 3h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1zM9 13.5a3 3 0 106 0 3 3 0 10-6 0',
  bed: 'M3 18V7M3 14h18v4M21 14v-2a3 3 0 00-3-3h-7v5M6.5 11.5a1.5 1.5 0 103 0 1.5 1.5 0 10-3 0',
  bag: 'M5 8h14l-1 12H6zM9 8V6a3 3 0 016 0v2',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
  film: 'M5 5h14v14H5zM9 5v14M15 5v14M5 9h4M5 15h4M15 9h4M15 15h4',
  more: 'M6 12h.01M12 12h.01M18 12h.01',
  image: 'M6 4h12a3 3 0 013 3v10a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3zM7 10a2 2 0 104 0 2 2 0 10-4 0M21 16l-5-5-9 9',
  link: 'M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1',
  wifi: 'M2 9a15 15 0 0120 0M5 12.5a10 10 0 0114 0M8.5 16a5 5 0 017 0M12 19.5h.01',
  text: 'M5 6h14M5 12h14M5 18h9',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  key: 'M15 3a6 6 0 11-5.3 8.8L3 18.5V21h3v-2h2v-2h2l1.2-1.2A6 6 0 0115 3zM16.5 7.5h.01',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  bell: 'M6 16v-5a6 6 0 0112 0v5l2 2H4zM10 21h4',
  refresh: 'M20 11a8 8 0 00-14.9-3M4 4v4h4M4 13a8 8 0 0014.9 3M20 20v-4h-4',
  send: 'M5 12h14M13 6l6 6-6 6',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5',
  coin: 'M4 12a8 8 0 1016 0 8 8 0 10-16 0M12 8v8M9.5 10h4a1.5 1.5 0 010 3h-3a1.5 1.5 0 000 3h4',
  sun: 'M8 12a4 4 0 108 0 4 4 0 10-8 0M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
};

export const icon = (name, size = 22, extra = '') =>
  `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"${extra}><path d="${ICONS[name] || ICONS.more}"></path></svg>`;

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

export const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem('pk:' + key);
      return v == null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try { localStorage.setItem('pk:' + key, JSON.stringify(value)); } catch { /* storage full or blocked */ }
  },
  remove(key) {
    try { localStorage.removeItem('pk:' + key); } catch { /* ignore */ }
  },
  clearAll() {
    try {
      Object.keys(localStorage).filter((k) => k.startsWith('pk:')).forEach((k) => localStorage.removeItem(k));
    } catch { /* ignore */ }
  },
};

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const money = (n) =>
  Number(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const money0 = (n) => Math.round(Number(n || 0)).toLocaleString('en-MY');
export const r2 = (n) => Math.round(n * 100) / 100;

// Keeps only digits and one dot, max 2 decimals.
export function cleanDecimal(v, maxLen = 10) {
  let s = String(v).replace(/[^\d.]/g, '');
  const i = s.indexOf('.');
  if (i >= 0) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '').slice(0, 2);
  return s.slice(0, maxLen);
}

export const WEEK = '日一二三四五六';
export function today() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
export function parseDay(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
export function dayKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export const daysBetween = (a, b) => Math.round((b - a) / 86400000);
export const fmtMD = (d) => `${d.getMonth() + 1}月${d.getDate()}日`;
export const fmtWeek = (d) => '周' + WEEK[d.getDay()];
export const fmtFull = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${fmtWeek(d)}`;
export function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

// ---------- favourites & recents ----------
export const getFavs = () => store.get('favs', []);
export function toggleFav(id) {
  const favs = getFavs();
  const next = favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id];
  store.set('favs', next);
  return next.includes(id);
}
export function pushRecent(id) {
  const list = store.get('recent', []).filter((r) => r !== id);
  list.unshift(id);
  store.set('recent', list.slice(0, 6));
}

// ---------- markup helpers ----------
export function topbar({ title, back = '#/', right = '', fav = '' }) {
  const favBtn = fav
    ? `<button type="button" class="round" data-fav="${fav}" aria-pressed="${getFavs().includes(fav)}" aria-label="收藏">${icon('star', 20)}</button>`
    : '';
  return `<header class="top">
    <a class="round" href="${back}" aria-label="返回">${icon('back')}</a>
    <h1>${esc(title)}</h1>
    ${right || favBtn || '<span class="spacer"></span>'}
  </header>`;
}

export function tabbar(active) {
  const tabs = [
    ['home', '#/', '首页', 'home'],
    ['tools', '#/tools', '全部工具', 'grid'],
    ['favs', '#/favs', '收藏', 'star'],
    ['me', '#/me', '我的', 'user'],
  ];
  return `<nav class="tabbar" aria-label="主导航">${tabs
    .map(([id, href, label, ic]) => `<a class="tab" href="${href}"${id === active ? ' aria-current="page"' : ''}><span class="tb">${icon(ic)}</span><span>${label}</span></a>`)
    .join('')}</nav>`;
}

export const pressed = (b) => `aria-pressed="${b ? 'true' : 'false'}"`;

// ---------- toast ----------
let toastTimer = 0;
export function toast(msg, ms = 2200) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), ms);
}

// ---------- bottom sheet ----------
// Returns { el, close }. Clicking the dimmed backdrop or a [data-close] element closes it.
export function openSheet(html, { label = '', onClose } = {}) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(label)}"><span class="grab" aria-hidden="true"></span>${html}</div>`;
  const prevFocus = document.activeElement;
  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
    if (prevFocus && prevFocus.focus) prevFocus.focus();
    if (onClose) onClose();
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.closest('[data-close]')) close();
  });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(overlay);
  const first = overlay.querySelector('input, select, textarea, button:not([data-close])');
  if (first && first.tagName !== 'BUTTON') setTimeout(() => first.focus(), 60);
  return { el: overlay.querySelector('.sheet'), close };
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('已复制');
    return true;
  } catch {
    toast('复制失败，请长按选择文字复制');
    return false;
  }
}

export async function shareText(text, title = '口袋工具箱') {
  if (navigator.share) {
    try { await navigator.share({ title, text }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
  }
  copyText(text);
}

// True inside the iOS app (Capacitor injects window.Capacitor into its web view).
export const isNative = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

export const isStandalone = () =>
  isNative() || window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
