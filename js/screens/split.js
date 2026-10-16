import { icon, esc, store, topbar, pressed, cleanDecimal, money, r2, shareText } from '../lib.js';

const POOL = ['我', '朋友 2', '朋友 3', '朋友 4', '朋友 5', '朋友 6', '朋友 7', '朋友 8'];

export default function split(root) {
  const st = Object.assign({ amount: '', people: 2, svc: true, sst: true, round: false }, store.get('split', {}));
  const save = () => store.set('split', st);

  function calc() {
    const amt = parseFloat(st.amount) || 0;
    const svc = st.svc ? r2(amt * 0.1) : 0;
    const sst = st.sst ? r2((amt + svc) * 0.06) : 0;
    const total = r2(amt + svc + sst);
    const raw = r2(total / st.people);
    const per = st.round ? Math.ceil(raw - 1e-9) : raw;
    const extra = Math.max(0, r2(per * st.people - total));
    return { amt, svc, sst, total, per, extra };
  }

  function resultHtml() {
    const c = calc();
    return `<div class="between"><span class="small muted" style="font-size:14px">每人应付</span><span class="small muted">${st.people} 人平摊</span></div>
      <div class="row" style="gap:6px;align-items:baseline;color:var(--accent)">
        <span style="font-size:26px;font-weight:700">RM</span>
        <span class="num" style="font-size:52px;line-height:56px;font-weight:700;letter-spacing:-2px">${money(c.per)}</span>
      </div>
      ${st.round && c.extra > 0.004 ? `<span class="small muted">取整后共多收 RM${money(c.extra)}</span>` : ''}
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 8px;padding-top:14px;border-top:1px solid var(--hero-line)">
        <div class="stack" style="gap:2px"><span class="small muted">账单</span><span class="num" style="font-weight:600">RM${money(c.amt)}</span></div>
        <div class="stack" style="gap:2px"><span class="small muted">服务费 10%</span><span class="num" style="font-weight:600">RM${money(c.svc)}</span></div>
        <div class="stack" style="gap:2px"><span class="small muted">SST 6%</span><span class="num" style="font-weight:600">RM${money(c.sst)}</span></div>
        <div class="stack" style="gap:2px"><span class="small muted">合计</span><span class="num" style="font-weight:600">RM${money(c.total)}</span></div>
      </div>`;
  }

  function feeBtn(key, label) {
    const c = calc();
    const on = st[key];
    return `<button type="button" class="opt" data-fee="${key}" ${pressed(on)} style="align-items:flex-start;text-align:left">
      <span class="row" style="gap:6px;font-size:15px">${on ? icon('check', 16) : ''}${label}</span>
      <span class="s">+ RM${money(key === 'svc' ? c.svc : c.sst)}</span>
    </button>`;
  }

  function render() {
    const names = POOL.slice(0, Math.min(st.people, POOL.length));
    root.innerHTML = `<div class="screen">
      ${topbar({ title: 'AA 分账', right: `<button type="button" class="pill" data-reset>重置</button>` })}
      <main class="body">
        <section class="card stack">
          <label for="amt" class="label">账单金额（未含服务费和 SST）</label>
          <div class="amount"><span class="cur">RM</span><input class="bare num" id="amt" type="text" inputmode="decimal" autocomplete="off" placeholder="0.00" value="${esc(st.amount)}"></div>
        </section>
        <section class="card tight between">
          <span class="stack" style="gap:2px"><span style="font-weight:500">人数</span><span class="small muted">${esc(names.join('、'))}${st.people > POOL.length ? ' …' : ''}</span></span>
          <span class="stepper">
            <button type="button" class="round" style="background:var(--surface-2)" data-people="-1" aria-label="减少一人" ${st.people <= 1 ? 'disabled' : ''}>${icon('minus', 20)}</button>
            <output class="num" aria-live="polite">${st.people}</output>
            <button type="button" class="round dark" data-people="1" aria-label="增加一人">${icon('plus', 20)}</button>
          </span>
        </section>
        <section class="card stack" style="gap:12px">
          <h2 style="font-size:15px;font-weight:500">附加费用</h2>
          <div class="opts" id="fees" style="grid-template-columns:repeat(2,minmax(0,1fr))">${feeBtn('svc', '服务费 10%')}${feeBtn('sst', 'SST 6%')}</div>
          <span class="small muted">SST 按（账单 + 服务费）× 6% 计算，和多数餐厅收据一致。嘛嘛档、小贩通常没有这两项，记得关掉。</span>
        </section>
        <label class="card tight toggle">
          <span class="stack" style="gap:2px"><span style="font-weight:500">每人向上取整到 RM1</span><span class="small muted">转账更方便，不用找零</span></span>
          <input type="checkbox" class="switch" data-round ${st.round ? 'checked' : ''}>
        </label>
        <section class="hero stack" id="result" style="gap:12px" aria-live="polite">${resultHtml()}</section>
      </main>
      <div class="bottom"><button type="button" class="btn" data-share>${icon('share', 20)}分享分账结果</button></div>
    </div>`;
  }

  root.oninput = (e) => {
    if (e.target.id !== 'amt') return;
    const v = cleanDecimal(e.target.value);
    if (v !== e.target.value) e.target.value = v;
    st.amount = v;
    save();
    root.querySelector('#result').innerHTML = resultHtml();
    root.querySelector('#fees').innerHTML = feeBtn('svc', '服务费 10%') + feeBtn('sst', 'SST 6%');
  };

  root.onchange = (e) => {
    if (e.target.matches('[data-round]')) { st.round = e.target.checked; save(); root.querySelector('#result').innerHTML = resultHtml(); }
  };

  root.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.people) st.people = Math.min(50, Math.max(1, st.people + Number(b.dataset.people)));
    else if (b.dataset.fee) st[b.dataset.fee] = !st[b.dataset.fee];
    else if (b.hasAttribute('data-reset')) Object.assign(st, { amount: '', people: 2, svc: true, sst: true, round: false });
    else if (b.hasAttribute('data-share')) {
      const c = calc();
      const lines = [`AA 分账：合计 RM${money(c.total)}，${st.people} 人平摊`, `每人 RM${money(c.per)}`];
      if (c.svc || c.sst) lines.push(`（账单 RM${money(c.amt)}${c.svc ? ` + 服务费 RM${money(c.svc)}` : ''}${c.sst ? ` + SST RM${money(c.sst)}` : ''}）`);
      shareText(lines.join('\n'));
      return;
    } else return;
    save();
    render();
  };

  render();
}
