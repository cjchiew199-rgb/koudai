// Entry point: hash router, favourites toggle, service worker.
import { $, store, toggleFav, pushRecent, toast } from './lib.js';
import { toolById } from './tools.js';

const MODULES = {
  home: () => import('./screens/home.js'),
  tools: () => import('./screens/tools.js'),
  me: () => import('./screens/me.js'),
  calc: () => import('./screens/calc.js'),
  convert: () => import('./screens/convert.js'),
  fx: () => import('./screens/fx.js'),
  split: () => import('./screens/split.js'),
  money: () => import('./screens/money.js'),
  countdown: () => import('./screens/countdown.js'),
  expense: () => import('./screens/expense.js'),
  life: () => import('./screens/life.js'),
  trip: () => import('./screens/trip.js'),
  scan: () => import('./screens/scan.js'),
  sensors: () => import('./screens/sensors.js'),
};

// path -> [module, export name]
const PAGES = {
  '': ['home', 'default'],
  tools: ['tools', 'default'],
  favs: ['tools', 'favs'],
  me: ['me', 'default'],
  'trip/plan': ['trip', 'plan'],
};

let cleanup = null;
let navToken = 0;

async function route() {
  const token = ++navToken;
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  let target = PAGES[path];
  const tool = toolById(path);
  if (!target && tool && !tool.soon) target = [tool.mod, tool.fn || 'default'];
  if (!target) target = PAGES[''];

  let mod;
  try {
    mod = await MODULES[target[0]]();
  } catch (err) {
    console.error(err);
    toast('页面加载失败，请检查网络后重试');
    return;
  }
  if (token !== navToken) return; // a newer navigation won

  if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
  document.querySelectorAll('.overlay').forEach((o) => o.remove());
  const root = $('#app');
  root.onclick = root.oninput = root.onchange = root.onsubmit = root.onkeydown = null;
  root.innerHTML = '';
  window.scrollTo(0, 0);

  const render = mod[target[1]] || mod.default;
  cleanup = render(root, new URLSearchParams(query)) || null;
  if (tool) {
    pushRecent(tool.id);
    document.title = tool.name + ' · 口袋工具箱';
  } else {
    document.title = '口袋工具箱';
  }
}

// Star buttons in tool headers work on every screen.
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-fav]');
  if (!b) return;
  const on = toggleFav(b.dataset.fav);
  b.setAttribute('aria-pressed', String(on));
  toast(on ? '已加入收藏' : '已取消收藏', 1400);
});

window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('SW register failed', e));
}

// First-run marker, used by the install hint on the home screen.
if (!store.get('firstSeen', null)) store.set('firstSeen', Date.now());
