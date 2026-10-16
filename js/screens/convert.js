import { icon, esc, store, topbar, pressed } from '../lib.js';

const CATS = [
  { name: '长度', dto: 3, units: [
    { n: '米', s: 'm', f: 1 }, { n: '厘米', s: 'cm', f: 0.01 }, { n: '千米', s: 'km', f: 1000 },
    { n: '英尺', s: 'ft', f: 0.3048 }, { n: '英寸', s: 'in', f: 0.0254 }, { n: '英里', s: 'mi', f: 1609.344 },
    { n: '码', s: 'yd', f: 0.9144 }, { n: '毫米', s: 'mm', f: 0.001 },
  ] },
  { name: '重量', dto: 2, units: [
    { n: '千克', s: 'kg', f: 1 }, { n: '克', s: 'g', f: 0.001 }, { n: '斤', s: '市斤', f: 0.5 },
    { n: '磅', s: 'lb', f: 0.45359237 }, { n: '盎司', s: 'oz', f: 0.028349523125 }, { n: '吨', s: 't', f: 1000 },
  ] },
  { name: '温度', dto: 1, units: [
    { n: '摄氏度', s: '°C', to: (v) => v, from: (b) => b },
    { n: '华氏度', s: '°F', to: (v) => ((v - 32) * 5) / 9, from: (b) => (b * 9) / 5 + 32 },
    { n: '开尔文', s: 'K', to: (v) => v - 273.15, from: (b) => b + 273.15 },
  ] },
  { name: '面积', dto: 3, units: [
    { n: '平方米', s: 'm²', f: 1 }, { n: '平方英尺', s: 'ft²', f: 0.09290304 }, { n: '英亩', s: 'ac', f: 4046.8564224 },
    { n: '公顷', s: 'ha', f: 10000 }, { n: '亩', s: '市亩', f: 10000 / 15 }, { n: '平方千米', s: 'km²', f: 1e6 },
  ] },
  { name: '体积', dto: 1, units: [
    { n: '升', s: 'L', f: 1 }, { n: '毫升', s: 'mL', f: 0.001 }, { n: '立方米', s: 'm³', f: 1000 },
    { n: '美制加仑', s: 'gal', f: 3.785411784 }, { n: '美制液量盎司', s: 'fl oz', f: 0.0295735295625 },
  ] },
  { name: '速度', dto: 1, units: [
    { n: '千米/时', s: 'km/h', f: 1 / 3.6 }, { n: '米/秒', s: 'm/s', f: 1 }, { n: '英里/时', s: 'mph', f: 0.44704 }, { n: '节', s: 'kn', f: 1852 / 3600 },
  ] },
  { name: '数据', dto: 2, units: [
    { n: 'MB', s: '兆字节', f: 1 }, { n: 'KB', s: '千字节', f: 1 / 1024 }, { n: 'GB', s: '吉字节', f: 1024 }, { n: 'TB', s: '太字节', f: 1024 * 1024 },
  ] },
];

const toBase = (u, v) => (u.to ? u.to(v) : v * u.f);
const fromBase = (u, b) => (u.from ? u.from(b) : b / u.f);

function fmt(v) {
  if (!isFinite(v)) return '—';
  const a = Math.abs(v);
  if (a !== 0 && (a >= 1e12 || a < 1e-6)) return v.toExponential(4);
  return Number(v.toPrecision(7)).toLocaleString('en-MY', { maximumFractionDigits: 6 });
}
function showInput(s) {
  const [i, d] = s.split('.');
  const neg = i.startsWith('-');
  const int = (neg ? i.slice(1) : i).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg ? '-' : '') + int + (d !== undefined ? '.' + d : '');
}

const KEYS = [
  ['1'], ['2'], ['3'], ['back', '退格'],
  ['4'], ['5'], ['6'], ['clear', '清空', 'C'],
  ['7'], ['8'], ['9'], ['neg', '正负号', '±'],
  ['0', '0', '0', 'w2'], ['.', '小数点', '.'], ['swap', '交换单位'],
];

export default function convert(root) {
  const st = Object.assign({ cat: 0, from: 0, to: 3, input: '1' }, store.get('convert', {}));
  if (!CATS[st.cat]) st.cat = 0;

  function save() { store.set('convert', st); }

  function render() {
    const cat = CATS[st.cat];
    const units = cat.units;
    if (!units[st.from]) st.from = 0;
    if (!units[st.to] || st.to === st.from) st.to = st.from === 0 ? 1 : 0;
    const fu = units[st.from];
    const tu = units[st.to];
    const base = toBase(fu, parseFloat(st.input) || 0);

    root.innerHTML = `<div class="screen fixed">
      ${topbar({ title: '单位换算', fav: 'convert' })}
      <div class="chips" style="flex:none;margin:0;padding:0 20px 12px" role="group" aria-label="换算类别">
        ${CATS.map((c, i) => `<button type="button" class="chip" data-cat="${i}" ${pressed(i === st.cat)}>${c.name}</button>`).join('')}
      </div>
      <div class="body" style="padding-top:0">
        <section class="card" aria-label="换算结果">
          <div class="between">
            <button type="button" class="chip" data-cycle="from" aria-label="切换输入单位">${esc(fu.n)} <span class="muted">${esc(fu.s)}</span>${icon('down', 16)}</button>
            <span class="label">输入</span>
          </div>
          <div class="big num ellipsis" style="margin-top:6px">${showInput(st.input)}</div>
          <div class="row" style="height:52px">
            <span style="flex:1;height:1px;background:var(--line)"></span>
            <button type="button" class="round" style="background:var(--accent);color:var(--on-accent)" data-k="swap" aria-label="交换单位">${icon('swap', 20)}</button>
          </div>
          <div class="between">
            <button type="button" class="chip" data-cycle="to" aria-label="切换结果单位">${esc(tu.n)} <span class="muted">${esc(tu.s)}</span>${icon('down', 16)}</button>
            <span class="label">结果</span>
          </div>
          <output class="big num ellipsis" style="display:block;margin-top:6px" aria-live="polite">${fmt(fromBase(tu, base))}</output>
        </section>
        <section class="stack">
          <div class="section-h"><h3>同时换算为 · 点按设为结果单位</h3></div>
          <div class="card" style="padding:6px">
            ${units.map((u, i) => i === st.from ? '' : `<button type="button" class="item" style="min-height:48px;padding:0 12px;border-radius:14px;${i === st.to ? 'background:var(--accent);color:var(--on-accent)' : ''}" data-to="${i}" ${pressed(i === st.to)}>
              <span class="grow">${esc(u.n)} <span style="opacity:.7;font-size:13px">${esc(u.s)}</span></span>
              <span class="num" style="font-weight:600">${fmt(fromBase(u, base))}</span>
            </button>`).join('')}
          </div>
        </section>
      </div>
      <div class="pad" aria-label="数字键盘">
        ${KEYS.map(([k, aria, label, w]) => {
          const cls = k === 'swap' ? 'acc' : ['back', 'clear', 'neg'].includes(k) ? 'op' : '';
          const inner = k === 'back' ? icon('backspace', 24) : k === 'swap' ? icon('swap', 22) : esc(label || k);
          return `<button type="button" class="key ${cls} ${w || ''}" data-k="${k}" aria-label="${esc(aria || k)}">${inner}</button>`;
        }).join('')}
      </div>
    </div>`;
  }

  function press(k) {
    let s = st.input;
    if (k === 'swap') { [st.from, st.to] = [st.to, st.from]; return; }
    if (k === 'clear') s = '0';
    else if (k === 'back') { s = s.slice(0, -1); if (s === '' || s === '-') s = '0'; }
    else if (k === 'neg') { if (s !== '0') s = s.startsWith('-') ? s.slice(1) : '-' + s; }
    else if (k === '.') { if (!s.includes('.')) s += '.'; }
    else {
      if (s.replace(/[-.]/g, '').length >= 12) return;
      s = s === '0' ? k : s === '-0' ? '-' + k : s + k;
    }
    st.input = s;
  }

  root.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b || b.dataset.fav) return;
    const units = CATS[st.cat].units;
    if (b.dataset.k) press(b.dataset.k);
    else if (b.dataset.cat) { st.cat = Number(b.dataset.cat); st.from = 0; st.to = CATS[st.cat].dto; }
    else if (b.dataset.to) st.to = Number(b.dataset.to);
    else if (b.dataset.cycle) {
      const which = b.dataset.cycle;
      const other = which === 'from' ? st.to : st.from;
      let n = (st[which] + 1) % units.length;
      if (n === other) n = (n + 1) % units.length;
      st[which] = n;
    } else return;
    save();
    render();
  };

  render();
}
