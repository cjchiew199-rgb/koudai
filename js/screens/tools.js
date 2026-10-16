import { icon, esc, tabbar, getFavs } from '../lib.js';
import { TOOLS, CATS, toolById, LIVE_COUNT } from '../tools.js';

const tile = (t) =>
  t.soon
    ? `<span class="tile soon" aria-disabled="true"><span class="tb">${icon(t.icon, 24)}<span class="soon-tag">即将</span></span><span>${esc(t.name)}</span></span>`
    : `<a class="tile on" href="#/${t.id}"><span class="tb">${icon(t.icon, 24)}</span><span>${esc(t.name)}</span></a>`;

export default function tools(root, params) {
  root.innerHTML = `<div class="screen">
    <main class="body" style="padding-top:calc(env(safe-area-inset-top) + 24px)">
      <header class="stack" style="gap:2px">
        <h1 class="h1">全部工具</h1>
        <span class="muted" id="count" style="font-size:14px">${LIVE_COUNT} 个工具 · 点星星可以加入收藏</span>
      </header>
      <label class="search">${icon('search', 20)}<span class="sr">搜索工具</span>
        <input class="bare" id="q" type="search" placeholder="搜索 ${LIVE_COUNT} 个工具" autocomplete="off" enterkeyhint="search">
      </label>
      <div id="sections" class="stack" style="gap:18px"></div>
    </main>
    ${tabbar('tools')}
  </div>`;

  const sections = root.querySelector('#sections');
  const count = root.querySelector('#count');

  function render(q = '') {
    const needle = q.trim().toLowerCase();
    const hit = (t) => !needle || (t.name + ' ' + (t.keys || '')).toLowerCase().includes(needle);
    let total = 0;
    const html = CATS.map((cat) => {
      const list = TOOLS.filter((t) => t.cat === cat && hit(t));
      total += list.length;
      if (!list.length) return '';
      return `<section class="stack" style="gap:10px">
        <div class="section-h"><h3>${esc(cat)}</h3></div>
        <div class="card tiles" style="padding:16px 8px">${list.map(tile).join('')}</div>
      </section>`;
    }).join('');
    sections.innerHTML = total
      ? html
      : `<div class="card empty"><span style="font-weight:600;color:var(--ink)">没有找到「${esc(q)}」</span><span class="small">换个关键词试试，比如「计算」「假期」</span></div>`;
    count.textContent = needle ? `找到 ${total} 个工具` : `${LIVE_COUNT} 个工具 · 点星星可以加入收藏`;
  }

  root.oninput = (e) => { if (e.target.id === 'q') render(e.target.value); };
  render();
  if (params.get('focus')) setTimeout(() => root.querySelector('#q').focus(), 80);
}

export function favs(root) {
  const list = getFavs().map(toolById).filter(Boolean);
  root.innerHTML = `<div class="screen">
    <main class="body" style="padding-top:calc(env(safe-area-inset-top) + 24px)">
      <header class="stack" style="gap:2px">
        <h1 class="h1">收藏</h1>
        <span class="muted" style="font-size:14px">${list.length ? `${list.length} 个常用工具` : '把常用的工具收在这里'}</span>
      </header>
      ${list.length
        ? `<ul class="list">${list.map((t) => `<li><a class="item" href="#/${t.id}"><span class="ibox accent">${icon(t.icon, 20)}</span><span class="grow t">${esc(t.name)}</span><span class="faint">${icon('chev', 18)}</span></a></li>`).join('')}</ul>`
        : `<div class="card empty">
            <span class="ibox" style="width:52px;height:52px">${icon('star', 26)}</span>
            <span style="font-weight:600;color:var(--ink)">还没有收藏</span>
            <span class="small">打开任意工具，点右上角的星星就能收藏。</span>
            <a class="btn small dark" href="#/tools" style="width:auto;padding:0 20px;margin-top:8px">去看看全部工具</a>
          </div>`}
    </main>
    ${tabbar('favs')}
  </div>`;
}
