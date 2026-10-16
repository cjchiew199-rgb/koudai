import { icon, esc, store, topbar, pressed, today, parseDay, dayKey, daysBetween, fmtFull, uid, openSheet, toast } from '../lib.js';
import { upcomingHolidays } from '../data.js';

export default function countdown(root) {
  let filter = 'all';
  const loadEvents = () => store.get('events', []);
  const saveEvents = (list) => store.set('events', list);

  function items() {
    const t = today();
    const hol = upcomingHolidays(t).map((h) => ({
      key: 'h:' + h.date, kind: 'holiday', name: h.name, sub: h.en, day: h.day, days: h.days, note: h.note, est: h.est,
    }));
    const mine = loadEvents().map((e) => {
      const day = parseDay(e.date);
      return { key: e.id, id: e.id, kind: 'mine', name: e.name, day, days: daysBetween(t, day), pinned: e.pinned };
    });
    return { hol, mine, t };
  }

  function row(it) {
    const past = it.days < 0;
    const tag = it.est ? '预计' : it.note || '';
    return `<li>
      <${it.kind === 'mine' ? `button type="button" data-edit="${it.id}"` : 'div'} class="item" style="min-height:70px">
        <span class="ibox" style="width:50px;height:52px;flex-direction:column;gap:1px;${it.kind === 'mine' ? 'background:var(--sel);color:var(--on-sel)' : ''}">
          <span style="font-size:11px">${it.day.getMonth() + 1}月</span>
          <span class="num" style="font-size:19px;line-height:21px;font-weight:700">${String(it.day.getDate()).padStart(2, '0')}</span>
        </span>
        <span class="grow stack" style="gap:3px">
          <span class="row" style="gap:6px;flex-wrap:wrap"><span class="t">${esc(it.name)}</span>${tag ? `<span class="badge soft" style="padding:1px 6px;font-size:11px">${esc(tag)}</span>` : ''}</span>
          <span class="s">${fmtFull(it.day)}${it.sub ? ' · ' + esc(it.sub) : ''}</span>
        </span>
        <span class="stack" style="gap:0;align-items:flex-end">
          <span class="small muted">${it.days === 0 ? '就是' : past ? '已经' : '还有'}</span>
          <span class="row" style="gap:3px;align-items:baseline">${it.days === 0 ? '<span style="font-size:20px;font-weight:700">今天</span>' : `<span class="num" style="font-size:24px;line-height:28px;font-weight:700">${Math.abs(it.days)}</span><span class="small">天</span>`}</span>
        </span>
      </${it.kind === 'mine' ? 'button' : 'div'}>
    </li>`;
  }

  function render() {
    const { hol, mine, t } = items();
    const pinned = mine.find((m) => m.pinned) || null;
    const heroItem = pinned || hol[0] || null;
    const yearStart = new Date(t.getFullYear(), 0, 1);
    const yearDays = daysBetween(yearStart, new Date(t.getFullYear() + 1, 0, 1));
    const dayNo = daysBetween(yearStart, t) + 1;
    const yearPct = Math.round((dayNo / yearDays) * 100);
    let list = filter === 'holiday' ? hol : filter === 'mine' ? mine : [...mine, ...hol];
    list = list.filter((x) => x !== heroItem).sort((a, b) => (a.days < 0) - (b.days < 0) || Math.abs(a.days) - Math.abs(b.days));

    root.innerHTML = `<div class="screen">
      ${topbar({ title: '倒数日', right: `<button type="button" class="round dark" data-add aria-label="新建倒数日">${icon('plus', 20)}</button>` })}
      <main class="body">
        ${heroItem ? `<section class="accent-card stack" style="gap:0">
          <div class="between">
            <span class="badge dark">${pinned ? '置顶' : '下一个公共假期'}</span>
            <span class="small muted">${fmtFull(heroItem.day)}</span>
          </div>
          <span style="margin-top:18px;font-size:18px;font-weight:600">${heroItem.days === 0 ? '就是今天：' : heroItem.days < 0 ? '' : '距离 '}${esc(heroItem.name)}${heroItem.days > 0 ? ' 还有' : heroItem.days < 0 ? ' 已经' : ''}</span>
          <span class="row" style="gap:6px;align-items:baseline">
            <span class="num" style="font-size:96px;line-height:100px;font-weight:700;letter-spacing:-4px">${Math.abs(heroItem.days)}</span>
            <span style="font-size:20px;font-weight:600">天</span>
          </span>
          <div class="stack" style="margin-top:6px;gap:8px">
            <span class="bar" style="background:rgba(20,20,20,.15)"><span style="width:${yearPct}%;background:#141414"></span></span>
            <span class="small muted">${t.getFullYear()} 年已过去 ${yearPct}%，今天是第 ${dayNo} 天</span>
          </div>
        </section>` : ''}
        <div class="seg" role="group" aria-label="筛选">
          ${[['all', '全部'], ['holiday', '公共假期'], ['mine', '我的']].map(([k, l]) => `<button type="button" data-filter="${k}" ${pressed(filter === k)}>${l}</button>`).join('')}
        </div>
        ${list.length ? `<ul class="list">${list.map(row).join('')}</ul>` : `<div class="card empty"><span>${filter === 'mine' ? '还没有自己的倒数日' : '没有更多了'}</span>${filter === 'mine' ? '<button type="button" class="btn small dark" data-add style="width:auto;padding:0 20px;margin-top:8px">添加生日、纪念日或考试日</button>' : ''}</div>`}
        <p class="note">${icon('info', 16)}<span>公共假期按全国和多数州属整理；标「预计」的伊斯兰节日以官方宣布为准，部分州属另有州假期。点自己添加的倒数日可以修改或删除。</span></p>
      </main>
    </div>`;
  }

  function editor(ev) {
    const isNew = !ev;
    const e = ev || { id: uid(), name: '', date: dayKey(today()), pinned: false };
    const sheet = openSheet(`<h2 class="title">${isNew ? '新建倒数日' : '编辑倒数日'}</h2>
      <label class="field"><span class="label">名称</span><input class="input" id="ev-name" maxlength="30" placeholder="比如：妈妈生日、SPM 考试" value="${esc(e.name)}"></label>
      <label class="field"><span class="label">日期</span><input class="input" id="ev-date" type="date" value="${esc(e.date)}"></label>
      <label class="toggle"><span>置顶显示在最上面</span><input type="checkbox" class="switch" id="ev-pin" ${e.pinned ? 'checked' : ''}></label>
      <span class="small muted">日期已过的会显示「已经 N 天」，适合记录纪念日。</span>
      <button type="button" class="btn dark" data-save>保存</button>
      ${isNew ? '' : '<button type="button" class="btn ghost danger" data-del style="background:var(--surface-2)">删除</button>'}`, { label: '倒数日' });
    sheet.el.addEventListener('click', (x) => {
      if (x.target.closest('[data-save]')) {
        const name = sheet.el.querySelector('#ev-name').value.trim();
        const date = sheet.el.querySelector('#ev-date').value;
        if (!name || !date) { toast('请填写名称和日期'); return; }
        const pinned = sheet.el.querySelector('#ev-pin').checked;
        let list = loadEvents().filter((i) => i.id !== e.id);
        if (pinned) list = list.map((i) => ({ ...i, pinned: false }));
        list.push({ id: e.id, name, date, pinned });
        saveEvents(list);
        sheet.close();
        render();
      } else if (x.target.closest('[data-del]')) {
        saveEvents(loadEvents().filter((i) => i.id !== e.id));
        sheet.close();
        render();
      }
    });
  }

  root.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.filter) { filter = b.dataset.filter; render(); }
    else if (b.hasAttribute('data-add')) editor(null);
    else if (b.dataset.edit) editor(loadEvents().find((x) => x.id === b.dataset.edit));
  };

  render();
}
