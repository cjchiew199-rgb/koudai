import { icon, esc, store, topbar, pressed, today, parseDay, dayKey, fmtMD, fmtWeek, money, uid, openSheet, toast, cleanDecimal } from '../lib.js';
import { EXP_CATS, CAT_COLORS, loadExpenses, saveExpenses, monthItems, getBudget } from '../data.js';

export default function expense(root) {
  const now = new Date();
  const st = { y: now.getFullYear(), m: now.getMonth(), filter: 'all' };

  function render() {
    const all = loadExpenses();
    const items = monthItems(all, st.y, st.m);
    const total = items.reduce((s, e) => s + Number(e.amount), 0);
    const budget = getBudget();
    const pct = budget > 0 ? Math.round((total / budget) * 100) : 0;
    const byCat = Object.keys(EXP_CATS)
      .map((k) => ({ k, sum: items.filter((e) => e.cat === k).reduce((s, e) => s + Number(e.amount), 0) }))
      .filter((c) => c.sum > 0)
      .sort((a, b) => b.sum - a.sum);
    const shown = items.filter((e) => st.filter === 'all' || e.cat === st.filter)
      .sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));
    const days = [];
    shown.forEach((e) => {
      let g = days[days.length - 1];
      if (!g || g.date !== e.date) { g = { date: e.date, items: [], sum: 0 }; days.push(g); }
      g.items.push(e);
      g.sum += Number(e.amount);
    });
    const tKey = dayKey(today());
    const yKey = dayKey(new Date(today().getTime() - 86400000));
    const dayLabel = (k) => { const d = parseDay(k); return (k === tKey ? '今天 · ' : k === yKey ? '昨天 · ' : '') + fmtMD(d) + ' ' + fmtWeek(d); };
    const isThisMonth = st.y === now.getFullYear() && st.m === now.getMonth();

    root.innerHTML = `<div class="screen">
      ${topbar({ title: '记账', fav: 'expense' })}
      <main class="body">
        <div class="between">
          <button type="button" class="round" data-month="-1" aria-label="上个月">${icon('back', 20)}</button>
          <span style="font-size:17px;font-weight:700">${st.y}年${st.m + 1}月</span>
          <button type="button" class="round" data-month="1" aria-label="下个月" ${isThisMonth ? 'disabled' : ''}>${icon('chev', 20)}</button>
        </div>
        <section class="hero stack" style="gap:14px">
          <div class="between"><span class="muted" style="font-size:14px">本月支出</span><button type="button" class="chip" style="min-height:32px;background:var(--hero-chip);color:var(--hero-ink);font-size:12px" data-budget>预算 RM${money(budget)}</button></div>
          <div class="row" style="gap:6px;align-items:baseline"><span class="muted" style="font-size:22px;font-weight:700">RM</span><span class="num" style="font-size:44px;line-height:48px;font-weight:700;letter-spacing:-1.5px">${money(total)}</span></div>
          <div class="stack" style="gap:8px">
            <span class="bar"><span style="width:${Math.min(100, pct)}%;${pct > 100 ? 'background:#FF8A80' : ''}"></span></span>
            <span class="between small muted"><span>已用 ${pct}%</span><span>${total <= budget ? `剩余 RM${money(budget - total)}` : `超出 RM${money(total - budget)}`}</span></span>
          </div>
        </section>
        ${byCat.length ? `<section class="card stack" style="gap:14px">
          <h2 style="font-size:15px;font-weight:600">支出构成</h2>
          <div class="stackbar" aria-hidden="true">${byCat.map((c) => `<span style="flex:${c.sum};background:${CAT_COLORS[c.k]}"></span>`).join('')}</div>
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 16px">
            ${byCat.map((c) => `<div class="row" style="gap:8px;align-items:flex-start"><span class="dot" style="margin-top:6px;background:${CAT_COLORS[c.k]}"></span><span class="stack" style="gap:1px"><span style="font-weight:500">${EXP_CATS[c.k].name} · ${Math.round((c.sum / total) * 100)}%</span><span class="small muted">RM${money(c.sum)}</span></span></div>`).join('')}
          </div>
        </section>` : ''}
        <div class="chips" role="group" aria-label="按类别筛选">
          ${[['all', '全部'], ...Object.entries(EXP_CATS).map(([k, v]) => [k, v.name])].map(([k, l]) => `<button type="button" class="chip" data-filter="${k}" ${pressed(st.filter === k)}>${l}</button>`).join('')}
        </div>
        ${days.length ? days.map((g) => `<section class="stack">
          <div class="between small muted" style="padding:0 4px;font-size:13px"><span>${dayLabel(g.date)}</span><span>支出 RM${money(g.sum)}</span></div>
          <ul class="list">${g.items.map((e) => `<li><button type="button" class="item" data-edit="${e.id}">
            <span class="ibox" style="${e.cat === 'food' ? 'background:var(--sel);color:var(--on-sel)' : e.cat === 'shop' ? 'background:var(--accent);color:var(--on-accent)' : ''}">${icon(EXP_CATS[e.cat]?.icon || 'more', 20)}</span>
            <span class="grow stack" style="gap:2px"><span class="t ellipsis">${esc(e.note || EXP_CATS[e.cat]?.name || '其他')}</span><span class="s">${EXP_CATS[e.cat]?.name || '其他'}${e.time ? ' · ' + esc(e.time) : ''}</span></span>
            <span class="num" style="font-weight:600">−RM${money(e.amount)}</span>
          </button></li>`).join('')}</ul>
        </section>`).join('') : `<div class="card empty"><span class="ibox" style="width:52px;height:52px">${icon('wallet', 26)}</span><span style="font-weight:600;color:var(--ink)">${st.filter === 'all' ? '这个月还没有记录' : '这个类别还没有记录'}</span><span class="small">点下面的「记一笔」开始。数据只保存在这台手机上。</span></div>`}
      </main>
      <div class="bottom"><button type="button" class="btn dark" data-add>${icon('plus', 20)}记一笔</button></div>
    </div>`;
  }

  function editor(entry) {
    const isNew = !entry;
    const now2 = new Date();
    const e = entry || { id: uid(), amount: '', cat: 'food', note: '', date: dayKey(today()), time: `${String(now2.getHours()).padStart(2, '0')}:${String(now2.getMinutes()).padStart(2, '0')}` };
    let cat = e.cat;
    const sheet = openSheet(`<h2 class="title">${isNew ? '记一笔' : '修改记录'}</h2>
      <label class="field"><span class="label">金额</span>
        <span class="amount" style="border-color:var(--ink)"><span class="cur">RM</span><input class="bare num" id="x-amt" type="text" inputmode="decimal" autocomplete="off" placeholder="0.00" value="${esc(e.amount)}" style="font-size:36px;line-height:44px"></span>
      </label>
      <div class="field"><span class="label">类别</span>
        <div class="chips wrap" id="x-cats">${Object.entries(EXP_CATS).map(([k, v]) => `<button type="button" class="chip" data-cat="${k}" ${pressed(k === cat)}>${icon(v.icon, 18)}${v.name}</button>`).join('')}</div>
      </div>
      <label class="field"><span class="label">备注（可选）</span><input class="input" id="x-note" maxlength="40" placeholder="比如：早餐 · 嘛嘛档" value="${esc(e.note)}"></label>
      <div style="display:grid;grid-template-columns:3fr 2fr;gap:10px">
        <label class="field"><span class="label">日期</span><input class="input" id="x-date" type="date" value="${esc(e.date)}"></label>
        <label class="field"><span class="label">时间</span><input class="input" id="x-time" type="time" value="${esc(e.time || '')}"></label>
      </div>
      <button type="button" class="btn dark" data-save>保存</button>
      ${isNew ? '' : '<button type="button" class="btn ghost danger" data-del style="background:var(--surface-2)">删除这条记录</button>'}`, { label: '记账' });
    const amtEl = sheet.el.querySelector('#x-amt');
    amtEl.addEventListener('input', () => { const v = cleanDecimal(amtEl.value); if (v !== amtEl.value) amtEl.value = v; });
    sheet.el.addEventListener('click', (x) => {
      const c = x.target.closest('[data-cat]');
      if (c) {
        cat = c.dataset.cat;
        sheet.el.querySelectorAll('#x-cats .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === cat)));
        return;
      }
      if (x.target.closest('[data-save]')) {
        const amount = parseFloat(amtEl.value);
        if (!(amount > 0)) { toast('请输入金额'); return; }
        const rec = { id: e.id, amount: Math.round(amount * 100) / 100, cat, note: sheet.el.querySelector('#x-note').value.trim(), date: sheet.el.querySelector('#x-date').value || dayKey(today()), time: sheet.el.querySelector('#x-time').value };
        saveExpenses([...loadExpenses().filter((i) => i.id !== e.id), rec]);
        const d = parseDay(rec.date);
        st.y = d.getFullYear(); st.m = d.getMonth();
        sheet.close();
        render();
        toast(isNew ? '已记下' : '已更新', 1400);
      } else if (x.target.closest('[data-del]')) {
        saveExpenses(loadExpenses().filter((i) => i.id !== e.id));
        sheet.close();
        render();
      }
    });
  }

  function budgetEditor() {
    const sheet = openSheet(`<h2 class="title">每月预算</h2>
      <label class="field"><span class="label">金额（RM）</span><input class="input num" id="b-amt" type="text" inputmode="decimal" value="${getBudget()}"></label>
      <button type="button" class="btn dark" data-save>保存</button>`, { label: '每月预算' });
    sheet.el.addEventListener('click', (x) => {
      if (!x.target.closest('[data-save]')) return;
      const v = parseFloat(sheet.el.querySelector('#b-amt').value);
      if (!(v >= 0)) { toast('请输入有效金额'); return; }
      store.set('budget', Math.round(v * 100) / 100);
      sheet.close();
      render();
    });
  }

  root.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b || b.dataset.fav) return;
    if (b.dataset.month) {
      const d = new Date(st.y, st.m + Number(b.dataset.month), 1);
      st.y = d.getFullYear(); st.m = d.getMonth();
      render();
    } else if (b.dataset.filter) { st.filter = b.dataset.filter; render(); }
    else if (b.hasAttribute('data-add')) editor(null);
    else if (b.dataset.edit) editor(loadExpenses().find((x) => x.id === b.dataset.edit));
    else if (b.hasAttribute('data-budget')) budgetEditor();
  };

  render();
}
