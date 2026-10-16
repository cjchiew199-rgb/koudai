import { icon, esc, store, topbar, pressed, copyText } from '../lib.js';

const LAYOUT = ['C', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '0', '.', '='];
const NAMES = { C: '清除', '±': '正负号', '%': '百分比', '÷': '除', '×': '乘', '−': '减', '+': '加', '=': '等于', '.': '小数点' };
const CHIPS = [
  ['+ SST 6%', 1.06, 'SST 6%'],
  ['+ 服务费 10%', 1.1, '服务费 10%'],
  ['+ 两者', 1.166, '服务费 10% + SST 6%'],
  ['− 八折', 0.8, '八折'],
  ['− 七折', 0.7, '七折'],
];

function fmt(n) {
  if (!isFinite(n)) return '错误';
  if (Math.abs(n) >= 1e15) return n.toExponential(6);
  return String(Number(n.toPrecision(12)));
}
function group(s) {
  if (s === '错误' || s.includes('e')) return s;
  const [i, d] = s.split('.');
  const neg = i.startsWith('-');
  const int = (neg ? i.slice(1) : i).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg ? '-' : '') + int + (d !== undefined ? '.' + d : '');
}
function compute(a, op, b) {
  if (op === '+') return a + b;
  if (op === '−') return a - b;
  if (op === '×') return a * b;
  if (op === '÷') return b === 0 ? NaN : a / b;
  return b;
}

export default function calc(root) {
  const st = { cur: '0', prev: null, op: null, fresh: false, expr: '' };
  const history = store.get('calcHistory', []);

  function render() {
    const shown = group(st.cur);
    const size = shown.length <= 8 ? 68 : shown.length <= 11 ? 52 : 40;
    root.innerHTML = `<div class="screen fixed calc">
      ${topbar({ title: '计算器', fav: 'calc' })}
      <div class="body" style="justify-content:flex-end;align-items:flex-end;text-align:right;gap:6px;padding:12px 24px 14px">
        ${history.length ? `<div class="stack small muted" style="gap:4px;align-items:flex-end;margin-bottom:auto;width:100%">${history.slice(0, 3).map((h) => `<span class="ellipsis" style="max-width:100%">${esc(h)}</span>`).join('')}</div>` : ''}
        <span class="muted ellipsis" style="font-size:18px;min-height:26px;max-width:100%">${esc(st.expr)}</span>
        <button type="button" class="num ellipsis" data-copy style="font-size:${size}px;line-height:1.1;font-weight:600;letter-spacing:-2px;max-width:100%" aria-label="结果 ${esc(shown)}，点按复制">${esc(shown)}</button>
      </div>
      <div class="chips" style="flex:none;margin:0;padding:0 16px 12px" role="group" aria-label="快捷计算">
        ${CHIPS.map((c, i) => `<button type="button" class="chip" data-chip="${i}">${c[0]}</button>`).join('')}
      </div>
      <div class="pad" aria-label="计算器键盘" style="gap:10px">
        ${LAYOUT.map((k) => {
          const isOp = '÷×−+'.includes(k);
          const cls = k === '=' ? 'acc' : isOp ? 'op' : ['C', '±', '%'].includes(k) ? 'fn' : '';
          const on = isOp && st.op === k && st.fresh;
          return `<button type="button" class="key ${cls} ${k === '0' ? 'w2' : ''}" data-k="${k}" aria-label="${NAMES[k] || k}" ${isOp ? pressed(on) : ''}>${k}</button>`;
        }).join('')}
      </div>
    </div>`;
  }

  function remember(line) {
    history.unshift(line);
    history.length = Math.min(history.length, 20);
    store.set('calcHistory', history);
  }

  function press(k) {
    const cur = st.cur === '错误' ? '0' : st.cur;
    if (/^\d$/.test(k)) {
      if (st.fresh) { st.cur = k; st.fresh = false; return; }
      if (cur.replace(/[-.]/g, '').length >= 15) return;
      st.cur = cur === '0' ? k : cur === '-0' ? '-' + k : cur + k;
      return;
    }
    if (k === '.') {
      if (st.fresh) { st.cur = '0.'; st.fresh = false; return; }
      if (!cur.includes('.')) st.cur = cur + '.';
      return;
    }
    if (k === 'C') { Object.assign(st, { cur: '0', prev: null, op: null, fresh: false, expr: '' }); return; }
    if (k === '±') { if (cur !== '0') st.cur = cur.startsWith('-') ? cur.slice(1) : '-' + cur; return; }
    if (k === '%') { st.cur = fmt(parseFloat(cur) / 100); st.fresh = true; return; }
    const v = parseFloat(cur);
    if (k === '=') {
      if (!st.op) return;
      const r = compute(st.prev, st.op, v);
      st.expr = `${group(fmt(st.prev))} ${st.op} ${group(fmt(v))} =`;
      remember(`${st.expr} ${group(fmt(r))}`);
      Object.assign(st, { cur: fmt(r), prev: null, op: null, fresh: true });
      return;
    }
    const base = st.op && !st.fresh ? compute(st.prev, st.op, v) : v;
    Object.assign(st, { prev: base, op: k, cur: fmt(base), fresh: true, expr: `${group(fmt(base))} ${k}` });
  }

  root.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b || b.dataset.fav) return;
    if (b.dataset.k) press(b.dataset.k);
    else if (b.dataset.chip) {
      const [, factor, label] = CHIPS[Number(b.dataset.chip)];
      const v = parseFloat(st.cur) || 0;
      const r = Math.round(v * factor * 100) / 100;
      st.expr = `${group(fmt(v))} × ${factor}（${label}）`;
      remember(`${st.expr} = ${group(fmt(r))}`);
      Object.assign(st, { cur: fmt(r), prev: null, op: null, fresh: true });
    } else if (b.hasAttribute('data-copy')) { copyText(st.cur); return; }
    else return;
    render();
  };

  render();
}
