// Small money calculators: 折扣计算, 贷款计算, 油费计算.
import { icon, esc, store, topbar, pressed, money, cleanDecimal } from '../lib.js';

// Generic helper: a screen with numeric fields whose result block re-renders on input.
function numField(id, label, value, unit = '', hint = '') {
  return `<label class="field"><span class="label">${label}</span>
    <span class="row" style="gap:8px"><input class="input num" id="${id}" type="text" inputmode="decimal" autocomplete="off" value="${esc(value)}" placeholder="${esc(hint)}">${unit ? `<span class="muted" style="flex:none">${unit}</span>` : ''}</span>
  </label>`;
}
const num = (v) => parseFloat(v) || 0;

// ---------- 折扣计算 ----------
export function discount(root) {
  const st = Object.assign({ price: '', off: '20', less: '', sst: false }, store.get('discount', {}));
  const save = () => store.set('discount', st);
  const PRESETS = ['10', '20', '30', '50', '70'];

  const result = () => {
    const p = num(st.price);
    let final = Math.max(0, p * (1 - num(st.off) / 100) - num(st.less));
    if (st.sst) final *= 1.06;
    const saved = p * (st.sst ? 1.06 : 1) - final;
    return `<span class="small muted" style="font-size:14px">到手价</span>
      <span class="row" style="gap:6px;align-items:baseline;color:var(--accent)"><span style="font-size:24px;font-weight:700">RM</span><span class="num" style="font-size:52px;line-height:56px;font-weight:700;letter-spacing:-2px">${money(final)}</span></span>
      <span class="small muted">省了 RM${money(Math.max(0, saved))}${num(st.off) ? ` · 相当于 ${Math.round((100 - num(st.off)) / 10 * 10) / 10} 折` : ''}</span>`;
  };

  function render() {
    root.innerHTML = `<div class="screen">
      ${topbar({ title: '折扣计算', fav: 'discount' })}
      <main class="body">
        <section class="card stack" style="gap:14px">
          ${numField('price', '原价（RM）', st.price, '', '0.00')}
          <div class="field"><span class="label">折扣 · 减几成</span>
            <div class="chips wrap">${PRESETS.map((p) => `<button type="button" class="chip" data-off="${p}" ${pressed(st.off === p)}>${p}% off</button>`).join('')}</div>
          </div>
          ${numField('off', '或自己输入折扣', st.off, '% off')}
          ${numField('less', '再减（RM，可选）', st.less, '', '比如满减 10')}
          <label class="toggle"><span>价格另加 SST 6%</span><input type="checkbox" class="switch" data-sst ${st.sst ? 'checked' : ''}></label>
        </section>
        <section class="hero stack" id="res" style="gap:6px" aria-live="polite">${result()}</section>
      </main>
    </div>`;
  }

  root.oninput = (e) => {
    if (!['price', 'off', 'less'].includes(e.target.id)) return;
    const v = cleanDecimal(e.target.value);
    if (v !== e.target.value) e.target.value = v;
    st[e.target.id] = v;
    save();
    root.querySelector('#res').innerHTML = result();
    root.querySelectorAll('[data-off]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.off === st.off)));
  };
  root.onchange = (e) => { if (e.target.matches('[data-sst]')) { st.sst = e.target.checked; save(); root.querySelector('#res').innerHTML = result(); } };
  root.onclick = (e) => { const b = e.target.closest('[data-off]'); if (b) { st.off = b.dataset.off; save(); render(); } };
  render();
}

// ---------- 贷款计算 ----------
export function loan(root) {
  const st = Object.assign({ type: 'house', amount: '500000', rate: '4.0', years: '35' }, store.get('loan', {}));
  const save = () => store.set('loan', st);

  const calc = () => {
    const P = num(st.amount), y = num(st.years), n = Math.round(y * 12), rate = num(st.rate) / 100;
    if (!P || !n) return null;
    let monthly, interest;
    if (st.type === 'house') {
      const r = rate / 12;
      monthly = r ? (P * r) / (1 - Math.pow(1 + r, -n)) : P / n;
      interest = monthly * n - P;
    } else {
      interest = P * rate * y;
      monthly = (P + interest) / n;
    }
    return { monthly, interest, total: P + interest, n };
  };
  const result = () => {
    const c = calc();
    if (!c) return '<span class="muted">填写贷款额和年限后显示月供</span>';
    return `<span class="small muted" style="font-size:14px">每月还款</span>
      <span class="row" style="gap:6px;align-items:baseline;color:var(--accent)"><span style="font-size:24px;font-weight:700">RM</span><span class="num" style="font-size:48px;line-height:54px;font-weight:700;letter-spacing:-2px">${money(c.monthly)}</span></span>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding-top:12px;border-top:1px solid var(--hero-line)">
        <div class="stack" style="gap:2px"><span class="small muted">总利息</span><span class="num" style="font-weight:600">RM${money(c.interest)}</span></div>
        <div class="stack" style="gap:2px"><span class="small muted">总还款 · ${c.n} 期</span><span class="num" style="font-weight:600">RM${money(c.total)}</span></div>
      </div>`;
  };

  function render() {
    root.innerHTML = `<div class="screen">
      ${topbar({ title: '贷款计算', fav: 'loan' })}
      <main class="body">
        <div class="seg" role="group" aria-label="贷款类型">
          <button type="button" data-type="house" ${pressed(st.type === 'house')}>房贷 · 按余额计息</button>
          <button type="button" data-type="car" ${pressed(st.type === 'car')}>车贷 · 固定利率</button>
        </div>
        <section class="card stack" style="gap:14px">
          ${numField('amount', '贷款金额（RM）', st.amount)}
          ${numField('rate', '年利率', st.rate, '%')}
          ${numField('years', '年限', st.years, '年')}
        </section>
        <section class="hero stack" id="res" style="gap:6px" aria-live="polite">${result()}</section>
        <p class="note">${icon('info', 16)}<span>${st.type === 'house' ? '房贷多按余额递减计息（每月按剩余本金算利息）。' : '本地车贷（Hire Purchase）多用固定利率：利息 = 本金 × 年利率 × 年数，平均分到每个月。'}实际以银行报价为准。</span></p>
      </main>
    </div>`;
  }

  root.oninput = (e) => {
    if (!['amount', 'rate', 'years'].includes(e.target.id)) return;
    const v = cleanDecimal(e.target.value, 12);
    if (v !== e.target.value) e.target.value = v;
    st[e.target.id] = v;
    save();
    root.querySelector('#res').innerHTML = result();
  };
  root.onclick = (e) => {
    const b = e.target.closest('[data-type]');
    if (!b) return;
    st.type = b.dataset.type;
    if (st.type === 'car' && num(st.years) > 9) { st.years = '9'; st.rate = '3.0'; st.amount = '100000'; }
    save();
    render();
  };
  render();
}

// ---------- 油费计算 ----------
export function fuel(root) {
  const st = Object.assign({ km: '350', use: '7', price: '', round: true, people: 1 }, store.get('fuel', {}));
  const save = () => store.set('fuel', st);

  const result = () => {
    const dist = num(st.km) * (st.round ? 2 : 1);
    const litres = (dist * num(st.use)) / 100;
    const cost = litres * num(st.price);
    return `<span class="small muted" style="font-size:14px">${st.round ? '来回' : '单程'} ${dist.toLocaleString('en-MY')} km · 约 ${litres.toFixed(1)} 升</span>
      ${num(st.price)
        ? `<span class="row" style="gap:6px;align-items:baseline;color:var(--accent)"><span style="font-size:24px;font-weight:700">RM</span><span class="num" style="font-size:52px;line-height:56px;font-weight:700;letter-spacing:-2px">${money(cost)}</span></span>
           ${st.people > 1 ? `<span class="small muted">${st.people} 人平分，每人 RM${money(cost / st.people)}</span>` : ''}`
        : '<span style="font-size:17px;font-weight:600">填上每升油价就能算出油费</span>'}`;
  };

  function render() {
    root.innerHTML = `<div class="screen">
      ${topbar({ title: '油费计算', fav: 'fuel' })}
      <main class="body">
        <section class="card stack" style="gap:14px">
          ${numField('km', '距离（单程）', st.km, 'km')}
          ${numField('use', '油耗', st.use, 'L/100km')}
          ${numField('price', '油价', st.price, 'RM / 升', '看油站牌价')}
          <label class="toggle"><span>来回</span><input type="checkbox" class="switch" data-round ${st.round ? 'checked' : ''}></label>
          <div class="between"><span>几个人平分</span>
            <span class="stepper">
              <button type="button" class="round" style="background:var(--surface-2)" data-people="-1" aria-label="减少一人" ${st.people <= 1 ? 'disabled' : ''}>${icon('minus', 20)}</button>
              <output class="num">${st.people}</output>
              <button type="button" class="round dark" data-people="1" aria-label="增加一人">${icon('plus', 20)}</button>
            </span>
          </div>
        </section>
        <section class="hero stack" id="res" style="gap:6px" aria-live="polite">${result()}</section>
        <p class="note">${icon('info', 16)}<span>油价会调整，请按油站当天的牌价填写。一般轿车油耗约 6–8 L/100km，可以在车子的仪表或手册里查到。</span></p>
      </main>
    </div>`;
  }

  root.oninput = (e) => {
    if (!['km', 'use', 'price'].includes(e.target.id)) return;
    const v = cleanDecimal(e.target.value);
    if (v !== e.target.value) e.target.value = v;
    st[e.target.id] = v;
    save();
    root.querySelector('#res').innerHTML = result();
  };
  root.onchange = (e) => { if (e.target.matches('[data-round]')) { st.round = e.target.checked; save(); root.querySelector('#res').innerHTML = result(); } };
  root.onclick = (e) => {
    const b = e.target.closest('[data-people]');
    if (!b) return;
    st.people = Math.min(10, Math.max(1, st.people + Number(b.dataset.people)));
    save();
    render();
  };
  render();
}
