import { icon, esc, store, topbar, pressed, cleanDecimal, openSheet } from '../lib.js';
import { CURRENCIES, getRates, cachedRates } from '../data.js';

const QUICK = [10, 50, 100, 500, 1000];

function fmt(v, code) {
  if (!isFinite(v)) return '—';
  const big = ['IDR', 'VND', 'KRW', 'JPY'].includes(code);
  return v.toLocaleString('en-MY', { minimumFractionDigits: big ? 0 : 2, maximumFractionDigits: big ? 0 : 2 });
}
function when(ts) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function fx(root) {
  const st = Object.assign({ base: 'MYR', amount: '100', list: ['SGD', 'USD', 'CNY', 'THB'] }, store.get('fx', {}));
  let data = cachedRates();
  let loading = true;
  const save = () => store.set('fx', st);

  const rateOf = (code) => (data && data.rates ? (code === 'MYR' ? 1 : data.rates[code]) : undefined);
  const convert = (amt, from, to) => {
    const a = rateOf(from), b = rateOf(to);
    return a && b ? (amt / a) * b : NaN;
  };

  function listHtml() {
    const amt = parseFloat(st.amount) || 0;
    const codes = ['MYR', ...st.list].filter((c) => c !== st.base);
    return codes.map((c) => {
      const [name, sym] = CURRENCIES[c] || [c, c];
      const one = convert(1, st.base, c);
      return `<li class="item" style="min-height:72px">
        <button type="button" class="ibox" data-base="${c}" style="font-size:12px;font-weight:700;border-radius:20px" aria-label="把${esc(name)}设为基准货币">${esc(sym)}</button>
        <span class="grow stack" style="gap:2px">
          <span class="t">${esc(name)}</span>
          <span class="small muted">1 ${st.base} = ${isFinite(one) ? Number(one.toPrecision(5)) : '—'} ${c}</span>
        </span>
        <span class="stack" style="gap:2px;align-items:flex-end">
          <span class="num" style="font-size:20px;font-weight:700">${fmt(convert(amt, st.base, c), c)}</span>
          <span class="small muted">${c}</span>
        </span>
        ${c !== 'MYR' ? `<button type="button" class="round" style="width:36px;height:36px;background:var(--surface-2)" data-remove="${c}" aria-label="移除${esc(name)}">${icon('close', 16)}</button>` : ''}
      </li>`;
    }).join('');
  }

  function statusHtml() {
    if (loading && !data) return `<span class="spinner" style="width:14px;height:14px"></span><span>正在获取汇率…</span>`;
    if (!data) return '';
    const label = data.sample ? `离线参考数据（${when(data.updated)}），连网后自动更新` : `中间价 · 更新于 ${when(data.updated)} · ${esc(data.source)}`;
    return `${icon('info', 16)}<span class="grow">${label}</span><button type="button" class="link" data-refresh style="min-height:32px">${icon('refresh', 16)}刷新</button>`;
  }

  function render() {
    const [bname, bsym] = CURRENCIES[st.base] || [st.base, st.base];
    root.innerHTML = `<div class="screen">
      ${topbar({ title: '汇率', fav: 'fx' })}
      <main class="body">
        <section class="hero stack" style="gap:14px">
          <div class="between">
            <span class="row" style="gap:12px">
              <span class="ibox accent" style="border-radius:20px;font-size:12px;font-weight:700">${esc(bsym)}</span>
              <span class="stack" style="gap:1px"><span style="font-weight:600">${esc(bname)}</span><span class="small muted">${st.base} · 基准货币</span></span>
            </span>
            <span class="small muted">我有</span>
          </div>
          <label class="amount" style="border-color:var(--hero-line)">
            <span class="sr">金额（${st.base}）</span>
            <span class="cur muted">${esc(bsym)}</span>
            <input class="bare num" id="amt" type="text" inputmode="decimal" autocomplete="off" placeholder="0" value="${esc(st.amount)}">
          </label>
          <div class="chips" style="margin:0;padding:0">
            ${QUICK.map((n) => `<button type="button" class="chip" style="background:${String(n) === st.amount ? 'var(--accent);color:var(--on-accent)' : 'var(--hero-chip);color:var(--hero-ink)'}" data-quick="${n}">${n}</button>`).join('')}
          </div>
        </section>
        <div class="note" id="status" style="align-items:center">${statusHtml()}</div>
        <ul class="list" id="list">${listHtml()}</ul>
        <button type="button" class="btn ghost" data-add style="border:1.5px dashed var(--faint);background:transparent">${icon('plus', 18)}添加货币</button>
        <p class="note">${icon('info', 16)}<span>点左边的货币符号，可以换成用那个货币当基准，比如在新加坡购物时按新币换算回令吉。银行和换汇店的买卖价会和中间价有差别。</span></p>
      </main>
    </div>`;
  }

  root.oninput = (e) => {
    if (e.target.id !== 'amt') return;
    const v = cleanDecimal(e.target.value, 12);
    if (v !== e.target.value) e.target.value = v;
    st.amount = v;
    save();
    root.querySelector('#list').innerHTML = listHtml();
  };

  root.onclick = async (e) => {
    const b = e.target.closest('button');
    if (!b || b.dataset.fav) return;
    if (b.dataset.quick) { st.amount = b.dataset.quick; save(); render(); }
    else if (b.dataset.base) {
      const amt = parseFloat(st.amount) || 0;
      const converted = convert(amt, st.base, b.dataset.base);
      if (st.base !== 'MYR' && !st.list.includes(st.base)) st.list.unshift(st.base);
      st.base = b.dataset.base;
      st.amount = isFinite(converted) ? String(Math.round(converted * 100) / 100) : st.amount;
      save(); render();
    } else if (b.dataset.remove) {
      st.list = st.list.filter((c) => c !== b.dataset.remove);
      if (st.base === b.dataset.remove) st.base = 'MYR';
      save(); render();
    } else if (b.hasAttribute('data-refresh')) {
      loading = true;
      root.querySelector('#status').innerHTML = `<span class="spinner" style="width:14px;height:14px"></span><span>正在更新…</span>`;
      data = await getRates({ force: true });
      if (!alive) return;
      loading = false;
      render();
    } else if (b.hasAttribute('data-add')) {
      const options = Object.keys(CURRENCIES).filter((c) => c !== 'MYR' && !st.list.includes(c) && rateOf(c));
      const sheet = openSheet(`<h2 class="title">添加货币</h2>
        ${options.length ? `<ul class="list" style="padding:0 4px;background:transparent">${options.map((c) => `<li><button type="button" class="item" data-pick="${c}" style="min-height:56px"><span class="ibox" style="font-size:12px;font-weight:700;border-radius:20px">${esc(CURRENCIES[c][1])}</span><span class="grow t">${esc(CURRENCIES[c][0])}</span><span class="muted">${c}</span></button></li>`).join('')}</ul>` : '<p class="muted">常用货币都已经加上了。</p>'}
        <button type="button" class="btn ghost" data-close style="background:var(--surface-2)">取消</button>`, { label: '添加货币' });
      sheet.el.addEventListener('click', (ev) => {
        const p = ev.target.closest('[data-pick]');
        if (!p) return;
        st.list.push(p.dataset.pick);
        save();
        sheet.close();
        render();
      });
    }
  };

  let alive = true;
  render();
  getRates().then((r) => {
    if (!alive) return;
    data = r;
    loading = false;
    root.querySelector('#status').innerHTML = statusHtml();
    root.querySelector('#list').innerHTML = listHtml();
  });
  return () => { alive = false; };
}
