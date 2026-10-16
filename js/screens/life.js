// Everyday tools: 待办清单, 随机决定, 停车计时, 世界时钟.
import { icon, esc, store, topbar, pressed, uid, money, cleanDecimal, openSheet, toast } from '../lib.js';

// ---------- 待办清单 ----------
export function todo(root) {
  const load = () => store.get('todos', []);
  const save = (l) => store.set('todos', l);

  function render() {
    const list = load();
    const open = list.filter((t) => !t.done);
    const done = list.filter((t) => t.done);
    const li = (t) => `<li class="item" style="min-height:56px">
      <input type="checkbox" class="check" data-toggle="${t.id}" ${t.done ? 'checked' : ''} aria-label="完成：${esc(t.text)}">
      <span class="grow" style="${t.done ? 'text-decoration:line-through;color:var(--faint)' : ''}">${esc(t.text)}</span>
      <button type="button" class="round" style="width:36px;height:36px;background:transparent" data-del="${t.id}" aria-label="删除">${icon('close', 16)}</button>
    </li>`;
    root.innerHTML = `<div class="screen">
      ${topbar({ title: '待办清单', fav: 'todo' })}
      <main class="body">
        <form class="row" id="add" style="gap:8px">
          <label class="search grow"><span class="sr">新的待办</span><input class="bare" id="new" maxlength="80" placeholder="要做什么？比如：交电费" autocomplete="off" enterkeyhint="done"></label>
          <button type="submit" class="round dark" style="width:48px;height:48px" aria-label="添加">${icon('plus', 22)}</button>
        </form>
        ${open.length ? `<ul class="list">${open.map(li).join('')}</ul>` : `<div class="card empty"><span style="font-weight:600;color:var(--ink)">${done.length ? '全部完成了' : '还没有待办'}</span><span class="small">在上面输入，按「添加」就记下来了。</span></div>`}
        ${done.length ? `<div class="section-h"><h3>已完成 ${done.length}</h3><button type="button" class="link" data-clear>清除已完成</button></div><ul class="list">${done.map(li).join('')}</ul>` : ''}
      </main>
    </div>`;
  }

  root.onsubmit = (e) => {
    e.preventDefault();
    const input = root.querySelector('#new');
    const text = input.value.trim();
    if (!text) return;
    save([{ id: uid(), text, done: false }, ...load()]);
    render();
    root.querySelector('#new').focus();
  };
  root.onchange = (e) => {
    const id = e.target.dataset.toggle;
    if (!id) return;
    save(load().map((t) => (t.id === id ? { ...t, done: e.target.checked } : t)));
    render();
  };
  root.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.del) { save(load().filter((t) => t.id !== b.dataset.del)); render(); }
    else if (b.hasAttribute('data-clear')) { save(load().filter((t) => !t.done)); render(); }
  };
  render();
}

// ---------- 随机决定 ----------
export function random(root) {
  const DEFAULT = ['嘛嘛档', '经济饭', '炒粿条', '椰浆饭', '叻沙', '鸡饭'];
  let options = store.get('randomOpts', DEFAULT);
  let picked = -1;
  let spinning = false;
  let timer = 0;

  function render(msg = '') {
    root.innerHTML = `<div class="screen">
      ${topbar({ title: '随机决定', fav: 'random' })}
      <main class="body">
        <section class="accent-card stack" style="gap:6px;min-height:150px;justify-content:center;align-items:center;text-align:center" aria-live="polite">
          <span class="muted small" style="font-size:14px">${msg || (picked >= 0 ? '就决定是' : '今天吃什么？去哪里？交给我')}</span>
          <span style="font-size:40px;line-height:48px;font-weight:700">${picked >= 0 ? esc(options[picked]) : '？'}</span>
        </section>
        <button type="button" class="btn dark" data-go ${options.length < 2 || spinning ? 'disabled' : ''}>${icon('dice', 20)}帮我决定</button>
        <div class="duo">
          <button type="button" class="btn ghost small" data-coin>${icon('coin', 18)}抛硬币</button>
          <button type="button" class="btn ghost small" data-dice>${icon('dice', 18)}掷骰子</button>
        </div>
        <section class="card stack" style="gap:12px">
          <div class="between"><h2 style="font-size:15px;font-weight:600">选项 ${options.length}</h2><button type="button" class="link" data-reset>恢复默认</button></div>
          <div class="chips wrap">${options.map((o, i) => `<span class="chip" style="${i === picked ? 'background:var(--accent);color:var(--on-accent)' : ''}">${esc(o)}<button type="button" data-rm="${i}" aria-label="删除 ${esc(o)}" style="display:flex;margin-right:-6px">${icon('close', 14)}</button></span>`).join('')}</div>
          <form class="row" id="add" style="gap:8px">
            <input class="input" id="opt" maxlength="20" placeholder="加一个选项" autocomplete="off" enterkeyhint="done">
            <button type="submit" class="round dark" style="width:48px;height:48px" aria-label="添加选项">${icon('plus', 22)}</button>
          </form>
        </section>
      </main>
    </div>`;
  }

  function spin() {
    if (options.length < 2) return;
    spinning = true;
    let n = 0;
    const steps = 14 + Math.floor(Math.random() * options.length);
    const tick = () => {
      picked = (picked + 1 + Math.floor(Math.random() * (options.length - 1))) % options.length;
      n++;
      if (n >= steps) { spinning = false; render(); return; }
      render('转呀转…');
      timer = setTimeout(tick, 50 + n * 12);
    };
    tick();
  }

  root.onsubmit = (e) => {
    e.preventDefault();
    const v = root.querySelector('#opt').value.trim();
    if (!v) return;
    options = [...options, v];
    store.set('randomOpts', options);
    render();
    root.querySelector('#opt').focus();
  };
  root.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b || b.dataset.fav || spinning) return;
    if (b.hasAttribute('data-go')) spin();
    else if (b.dataset.rm) { options = options.filter((_, i) => i !== Number(b.dataset.rm)); picked = -1; store.set('randomOpts', options); render(); }
    else if (b.hasAttribute('data-reset')) { options = DEFAULT.slice(); picked = -1; store.set('randomOpts', options); render(); }
    else if (b.hasAttribute('data-coin')) { picked = -1; render(Math.random() < 0.5 ? '硬币是：字（正面）' : '硬币是：花（反面）'); }
    else if (b.hasAttribute('data-dice')) { picked = -1; render(`骰子是：${1 + Math.floor(Math.random() * 6)} 点`); }
  };
  render();
  return () => clearTimeout(timer);
}

// ---------- 停车计时 ----------
export function parking(root) {
  let st = store.get('parking', null);
  const rate = Object.assign({ first: '', next: '' }, store.get('parkingRate', {}));
  let timer = 0;

  const elapsed = () => {
    const ms = Date.now() - st.start;
    const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
    return { ms, text: `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`, hours: Math.ceil(ms / 3600000) || 1 };
  };
  const fee = (hours) => {
    const f = parseFloat(rate.first), n = parseFloat(rate.next);
    if (!(f >= 0) || isNaN(f)) return null;
    return f + Math.max(0, hours - 1) * (isNaN(n) ? 0 : n);
  };

  function liveHtml() {
    const e = elapsed();
    const f = fee(e.hours);
    return `<span class="small muted" style="font-size:14px">已停</span>
      <span class="num" style="font-size:56px;line-height:60px;font-weight:700;letter-spacing:-1px">${e.text}</span>
      <span class="small muted">从 ${new Date(st.start).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} 开始${f != null ? ` · 按 ${e.hours} 小时算约 RM${money(f)}` : ''}</span>`;
  }

  function render() {
    clearInterval(timer);
    root.innerHTML = `<div class="screen">
      ${topbar({ title: '停车计时', fav: 'parking' })}
      <main class="body">
        ${st ? `<section class="hero stack" id="live" style="gap:4px" aria-live="off">${liveHtml()}</section>
          ${st.spot ? `<section class="card row">${icon('pin', 22)}<span class="grow stack" style="gap:2px"><span class="small muted">停在</span><span style="font-size:20px;font-weight:700">${esc(st.spot)}</span></span></section>` : ''}
          <button type="button" class="btn dark" data-stop>结束停车</button>`
        : `<section class="card stack" style="gap:14px">
            <label class="field"><span class="label">停在哪里（可选）</span><input class="input" id="spot" maxlength="30" placeholder="比如：B2 · C 区 23 号"></label>
            <button type="button" class="btn" data-start>${icon('parking', 20)}开始计时</button>
          </section>`}
        <section class="card stack" style="gap:12px">
          <h2 style="font-size:15px;font-weight:600">收费（可选）</h2>
          <div class="duo">
            <label class="field"><span class="label">第一小时 RM</span><input class="input num" id="first" inputmode="decimal" value="${esc(rate.first)}" placeholder="0.00"></label>
            <label class="field"><span class="label">之后每小时 RM</span><input class="input num" id="next" inputmode="decimal" value="${esc(rate.next)}" placeholder="0.00"></label>
          </div>
          <span class="small muted">按商场或停车场牌子上的价格填写，会帮你估算费用。</span>
        </section>
      </main>
    </div>`;
    if (st) timer = setInterval(() => { const el = root.querySelector('#live'); if (el) el.innerHTML = liveHtml(); }, 1000);
  }

  root.oninput = (e) => {
    if (e.target.id !== 'first' && e.target.id !== 'next') return;
    const v = cleanDecimal(e.target.value, 6);
    if (v !== e.target.value) e.target.value = v;
    rate[e.target.id] = v;
    store.set('parkingRate', rate);
  };
  root.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-start')) {
      st = { start: Date.now(), spot: root.querySelector('#spot').value.trim() };
      store.set('parking', st);
      render();
    } else if (b.hasAttribute('data-stop')) {
      const e2 = elapsed();
      const f = fee(e2.hours);
      st = null;
      store.remove('parking');
      render();
      toast(`共停了 ${e2.text}${f != null ? `，约 RM${money(f)}` : ''}`, 3500);
    }
  };
  render();
  return () => clearInterval(timer);
}

// ---------- 世界时钟 ----------
const ZONES = {
  'Asia/Kuala_Lumpur': '吉隆坡', 'Asia/Singapore': '新加坡', 'Asia/Bangkok': '曼谷', 'Asia/Jakarta': '雅加达',
  'Asia/Shanghai': '北京', 'Asia/Hong_Kong': '香港', 'Asia/Taipei': '台北', 'Asia/Tokyo': '东京', 'Asia/Seoul': '首尔',
  'Asia/Kolkata': '新德里', 'Asia/Dubai': '迪拜', 'Australia/Perth': '珀斯', 'Australia/Sydney': '悉尼', 'Pacific/Auckland': '奥克兰',
  'Europe/London': '伦敦', 'Europe/Paris': '巴黎', 'America/New_York': '纽约', 'America/Los_Angeles': '洛杉矶',
};

export function clock(root) {
  let zones = store.get('zones', ['Asia/Kuala_Lumpur', 'Asia/Shanghai', 'Asia/Tokyo', 'Australia/Sydney', 'Europe/London', 'America/New_York']);
  let timer = 0;

  // Wall-clock time in `tz`, plus its difference from this phone's local time.
  const info = (tz) => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(now);
    const get = (t) => Number(parts.find((p) => p.type === t).value);
    const y = get('year'), mo = get('month') - 1, d = get('day'), h = get('hour') % 24, mi = get('minute');
    const zoneWall = Date.UTC(y, mo, d, h, mi);
    const localWall = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
    const diffH = Math.round((zoneWall - localWall) / 60000) / 60;
    const dayDiff = Math.round((Date.UTC(y, mo, d) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
    return {
      time: `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`,
      diff: diffH === 0 ? '和本地相同' : `${diffH > 0 ? '快' : '慢'} ${Math.abs(diffH)} 小时`,
      dayLabel: dayDiff === 0 ? '今天' : dayDiff > 0 ? '明天' : '昨天',
    };
  };

  function listHtml() {
    return zones.map((tz) => {
      const i = info(tz);
      return `<li class="item" style="min-height:72px">
        <span class="grow stack" style="gap:2px"><span class="t" style="font-size:17px;font-weight:600">${esc(ZONES[tz] || tz)}</span><span class="s">${i.dayLabel} · ${i.diff}</span></span>
        <span class="num" style="font-size:34px;font-weight:600;letter-spacing:-1px">${i.time}</span>
        <button type="button" class="round" style="width:36px;height:36px;background:transparent" data-rm="${tz}" aria-label="移除 ${esc(ZONES[tz] || tz)}">${icon('close', 16)}</button>
      </li>`;
    }).join('');
  }

  function render() {
    root.innerHTML = `<div class="screen">
      ${topbar({ title: '世界时钟', fav: 'clock' })}
      <main class="body">
        <ul class="list" id="zones">${listHtml()}</ul>
        <button type="button" class="btn ghost" data-add style="border:1.5px dashed var(--faint);background:transparent">${icon('plus', 18)}添加城市</button>
      </main>
    </div>`;
  }

  root.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b || b.dataset.fav) return;
    if (b.dataset.rm) { zones = zones.filter((z) => z !== b.dataset.rm); store.set('zones', zones); render(); }
    else if (b.hasAttribute('data-add')) {
      const opts = Object.keys(ZONES).filter((z) => !zones.includes(z));
      const sheet = openSheet(`<h2 class="title">添加城市</h2>
        <ul class="list" style="padding:0 4px;background:transparent">${opts.map((z) => `<li><button type="button" class="item" data-pick="${z}" style="min-height:52px"><span class="grow t">${esc(ZONES[z])}</span><span class="muted num">${info(z).time}</span></button></li>`).join('')}</ul>
        <button type="button" class="btn ghost" data-close style="background:var(--surface-2)">取消</button>`, { label: '添加城市' });
      sheet.el.addEventListener('click', (x) => {
        const p = x.target.closest('[data-pick]');
        if (!p) return;
        zones = [...zones, p.dataset.pick];
        store.set('zones', zones);
        sheet.close();
        render();
      });
    }
  };
  render();
  timer = setInterval(() => { const el = root.querySelector('#zones'); if (el) el.innerHTML = listHtml(); }, 15000);
  return () => clearInterval(timer);
}
