import { icon, esc, store, money0, fmtFull, today, tabbar, isStandalone } from '../lib.js';
import { toolById, LIVE_COUNT } from '../tools.js';
import { nextHoliday, cachedRates, monthTotal, getBudget, getRates } from '../data.js';

const HOME_TOOLS = ['convert', 'split', 'scan', 'countdown', 'calc', 'fx', 'expense', 'trip'];

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return '夜深了';
  if (h < 12) return '早上好';
  if (h < 18) return '下午好';
  return '晚上好';
}

export default function home(root) {
  const now = new Date();
  const t = today();
  const hol = nextHoliday(t);
  const spent = monthTotal(now.getFullYear(), now.getMonth());
  const budget = getBudget();
  const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
  const recent = store.get('recent', []).map(toolById).filter((x) => x && x.id !== 'trip').slice(0, 3);
  const showInstall = !isStandalone() && !store.get('hideInstall', false);

  const rateCard = () => {
    const r = cachedRates();
    const v = r && r.rates && r.rates.SGD ? r.rates.SGD.toFixed(4) : '—';
    return `<span class="between small muted"><span>MYR → SGD</span>${icon('chev', 16)}</span>
      <span class="v num">${v}</span>
      <span class="small muted">${r ? '点开查看实时汇率' : '点开获取汇率'}</span>`;
  };

  root.innerHTML = `<div class="screen home">
    <main class="body">
      <header class="between">
        <div class="stack" style="gap:2px">
          <span class="muted" style="font-size:14px">${greeting()} · ${fmtFull(t).slice(5)}</span>
          <h1 class="h1">口袋工具箱</h1>
        </div>
        <a class="round" href="#/me" aria-label="我的设置">${icon('user')}</a>
      </header>

      ${showInstall ? `<div class="card tight install">
        <span class="ibox accent">${icon('share', 20)}</span>
        <div class="grow stack" style="gap:2px">
          <span style="font-weight:600">放到 iPhone 桌面</span>
          <span class="small muted">用 Safari 打开，点底部的分享按钮，再选「添加到主屏幕」。</span>
        </div>
        <button type="button" class="round" style="width:36px;height:36px;background:var(--surface-2)" data-act="hide-install" aria-label="不再提示">${icon('close', 16)}</button>
      </div>` : ''}

      <a class="search" href="#/tools?focus=1">${icon('search', 20)}<span>搜索 ${LIVE_COUNT} 个工具，如「汇率」「SST」</span></a>

      ${hol ? `<a class="hero stack" href="#/countdown" style="gap:16px">
        <span class="between">
          <span class="row" style="gap:10px"><span class="badge">下一个公共假期</span><span class="small muted">${fmtFull(hol.day)}</span></span>
          <span class="round" style="width:36px;height:36px;background:var(--hero-chip);color:var(--hero-ink)">${icon('chev', 18)}</span>
        </span>
        <span class="between" style="align-items:baseline">
          <span style="font-size:17px;font-weight:500">${hol.days === 0 ? '今天就是' : '距离'} ${esc(hol.name)}${hol.days === 0 ? '' : ' 还有'}</span>
          <span class="row" style="gap:4px;align-items:baseline">
            <span class="num" style="font-size:56px;line-height:56px;font-weight:700;letter-spacing:-2px;color:var(--accent)">${hol.days}</span>
            <span class="muted">天</span>
          </span>
        </span>
      </a>` : ''}

      <div class="duo">
        <a class="mini" href="#/fx" id="rate-card">${rateCard()}</a>
        <a class="mini" href="#/expense">
          <span class="between small muted"><span>本月支出</span>${icon('chev', 16)}</span>
          <span class="v num">RM${money0(spent)}</span>
          <span class="bar" style="height:6px"><span style="width:${pct}%"></span></span>
          <span class="small muted">预算已用 ${pct}%</span>
        </a>
      </div>

      <a class="card tight row" href="#/trip">
        <span class="ibox" style="width:52px;height:52px;border-radius:16px;background:var(--hero);color:var(--accent)">${icon('sparkle', 26)}</span>
        <span class="grow stack" style="gap:3px">
          <span class="row" style="gap:6px"><span style="font-size:16px;font-weight:700">AI 行程规划</span><span class="badge" style="padding:1px 7px;font-size:11px">新</span></span>
          <span class="small muted" style="font-size:13px">说出想去哪，AI 帮你排好每天的行程</span>
        </span>
        <span class="faint">${icon('chev', 18)}</span>
      </a>

      <section class="stack" style="gap:12px">
        <div class="section-h"><h2>常用工具</h2><a class="link" href="#/tools">全部 ${LIVE_COUNT} 个${icon('chev', 16)}</a></div>
        <div class="tiles">
          ${HOME_TOOLS.map(toolById).map((tl) => `<a class="tile" href="#/${tl.id}"><span class="tb">${icon(tl.icon, 24)}</span><span>${esc(tl.name)}</span></a>`).join('')}
        </div>
      </section>

      ${recent.length ? `<section class="stack" style="gap:12px">
        <div class="section-h"><h2>最近使用</h2></div>
        <ul class="list">
          ${recent.map((tl) => `<li><a class="item" href="#/${tl.id}"><span class="ibox">${icon(tl.icon, 20)}</span><span class="grow t">${esc(tl.name)}</span><span class="faint">${icon('chev', 18)}</span></a></li>`).join('')}
        </ul>
      </section>` : ''}
    </main>
    ${tabbar('home')}
  </div>`;

  root.onclick = (e) => {
    if (e.target.closest('[data-act="hide-install"]')) {
      store.set('hideInstall', true);
      e.target.closest('.install').remove();
    }
  };

  // Refresh the rate card quietly in the background.
  getRates().then(() => {
    const el = root.querySelector('#rate-card');
    if (el) el.innerHTML = rateCard();
  });
}
