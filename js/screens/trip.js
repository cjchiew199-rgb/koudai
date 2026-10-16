// AI 行程: the request form, built-in sample trips, and the plan viewer.
import { icon, esc, store, topbar, pressed, today, parseDay, dayKey, addDays, fmtMD, fmtWeek, money0, uid, openSheet, toast, shareText } from '../lib.js';
import { askPlan, describeRequest, getApiKey } from '../ai.js';
import { gmapsUrl, wazeUrl, tripFlightUrl, tripHotelUrl, iataOf } from '../links.js';

const MODES = [['car', '自驾', 'car'], ['plane', '飞机', 'plane'], ['bus', '巴士', 'bus'], ['train', '火车', 'train']];
const STYLES = ['美食', '拍照打卡', '文化古迹', '自然风景', '购物', '亲子', '放松慢游', '夜市'];
const PACES = [['easy', '轻松', '每天 3–4 站'], ['mid', '适中', '每天 4–5 站'], ['tight', '紧凑', '每天 6 站以上']];
const IDEAS = [
  { label: '槟城 3天2夜', dest: '槟城', days: 3 },
  { label: '马六甲 一日游', dest: '马六甲', days: 1 },
  { label: '金马伦 2天1夜', dest: '金马伦高原', days: 2 },
  { label: '曼谷 4天3夜', dest: '曼谷', days: 4 },
];
const KIND = {
  transport: { icon: 'car', cls: '' },
  flight: { icon: 'plane', cls: '' },
  food: { icon: 'food', cls: 'accent' },
  sight: { icon: 'camera', cls: 'dark' },
  hotel: { icon: 'bed', cls: '' },
};

const nightsLabel = (d) => (d === 1 ? '一日游' : `${d}天${d - 1}夜`);
function nextSaturday() {
  const t = today();
  return addDays(t, ((6 - t.getDay() + 7) % 7) || 7);
}
const loadTrips = () => store.get('trips', []);
const saveTrips = (list) => store.set('trips', list.slice(0, 10));

// ---------- built-in sample trips (used without an API key) ----------
// place: what to search for on Google Maps / Waze ('' for travel legs).
const P = (time, kind, title, note, travel = '', place = '') => ({ time, kind, title, note, travel, place });
const PRESETS = {
  槟城: {
    match: /槟城|penang|pulau pinang|georgetown|乔治市/i,
    title: '槟城 · 美食与老城',
    summary: '老城壁画、山与寺、海边放松，三天吃遍槟城经典小吃。',
    travel: { flyFrom: 'KUL', flyTo: 'PEN', hotelCity: 'George Town' },
    days: [
      { title: '出发 · 乔治市老城', items: [
        P('08:00', 'transport', '从吉隆坡出发', '走南北大道，自驾约 4 小时，中途在休息站吃早餐。'),
        P('12:30', 'food', '午餐：炒粿条', '乔治市老城区的经典小吃，配一杯煎蕊解暑。', '步行约 10 分钟', 'Char Kway Teow, George Town, Penang'),
        P('14:00', 'sight', '亚美尼亚街壁画', '老城散步拍照，顺路逛姓周桥水上人家。', '步行约 10 分钟', 'Armenian Street, George Town, Penang'),
        P('17:00', 'hotel', '入住老城区酒店', '住在老城区，步行就能到主要景点。', '开车约 15 分钟', 'Hotels near Armenian Street, George Town, Penang'),
        P('19:30', 'food', '晚餐：新关仔角小贩中心', '海边夜宵，沙爹、蚝煎、椰水都有。', '', 'Gurney Drive Hawker Centre, Penang'),
      ] },
      { title: '山与寺', items: [
        P('09:00', 'sight', '极乐寺', '东南亚知名的佛寺，早上比较凉爽，人也少些。', '开车约 5 分钟', 'Kek Lok Si Temple, Penang'),
        P('11:30', 'food', '午餐：亚依淡叻沙', '酸辣开胃的亚参叻沙，槟城必吃。', '开车约 20 分钟', 'Air Itam Laksa, Penang'),
        P('14:00', 'sight', '张弼士故居（蓝屋）', '导览一般需要预约，出发前确认导览时间。', '开车约 25 分钟', 'Cheong Fatt Tze Mansion, Penang'),
        P('17:30', 'sight', '升旗山看日落', '搭缆车上山，山上比较凉，带件薄外套。', '开车约 25 分钟', 'Penang Hill Lower Station'),
        P('20:00', 'food', '小印度晚餐', '试试香蕉叶饭和印度煎饼。', '', 'Little India, George Town, Penang'),
      ] },
      { title: '海边 · 回程', items: [
        P('08:30', 'food', '早餐：老城点心', '吃饱再出发，顺便退房。', '开车约 30 分钟', 'Dim Sum, George Town, Penang'),
        P('10:00', 'sight', '峇都丁宜海滩', '海边放松，可以玩水上活动，记得防晒。', '开车约 30 分钟', 'Batu Ferringhi Beach, Penang'),
        P('12:30', 'food', '午餐 + 买手信', '淡汶饼、白咖啡带回家。', '', 'Tambun Biscuits, Penang'),
        P('14:30', 'transport', '回程吉隆坡', '自驾约 4 小时，周末傍晚大道可能塞车。'),
      ] },
    ],
    packing: [['身份证 MyKad', ''], ['驾照', '自驾需要'], ['过路费卡 / 电子钱包余额', '南北大道往返要用'], ['手机充电器 + 充电宝', ''], ['雨伞', '备着以防午后阵雨'], ['防晒霜 + 太阳眼镜', '海边和老城步行'], ['薄外套', '升旗山傍晚比较凉'], ['泳衣 + 拖鞋', '峇都丁宜海滩']],
  },
  马六甲: {
    match: /马六甲|melaka|malacca/i,
    title: '马六甲 · 老街一日游',
    summary: '红屋、鸡场街、鸡饭粒和娘惹菜，傍晚坐船看马六甲河。',
    travel: { flyFrom: '', flyTo: '', hotelCity: 'Melaka' },
    days: [
      { title: '红屋 · 鸡场街 · 马六甲河', items: [
        P('08:00', 'transport', '从吉隆坡出发', '自驾约 2 小时，早点出发比较好找停车位。', '步行约 10 分钟'),
        P('10:30', 'sight', '荷兰红屋 · 圣保罗山', '红屋广场是马六甲的地标，顺路走上圣保罗山。', '步行约 10 分钟', 'Stadthuys, Melaka'),
        P('12:30', 'food', '午餐：鸡饭粒', '马六甲特色，人多时要排队。', '步行约 10 分钟', 'Chicken Rice Ball, Jonker Street, Melaka'),
        P('14:00', 'sight', '鸡场街老街散步', '逛老店、买娘惹糕点；周末晚上有夜市。', '步行约 5 分钟', 'Jonker Street, Melaka'),
        P('15:30', 'food', '下午茶：煎蕊', '椰糖煎蕊解暑。', '步行约 10 分钟', 'Cendol, Jonker Street, Melaka'),
        P('17:00', 'sight', '马六甲河游船', '傍晚坐船看两岸壁画和老屋，出发前确认班次。', '步行约 10 分钟', 'Melaka River Cruise'),
        P('19:00', 'food', '晚餐：娘惹菜', '试试亚参鱼和娘惹咖喱。', '', 'Nyonya Restaurant, Melaka'),
        P('20:30', 'transport', '回程吉隆坡', '自驾约 2 小时，周末晚上留意大道车况。'),
      ] },
    ],
    packing: [['身份证 MyKad', ''], ['驾照', '自驾需要'], ['过路费卡 / 电子钱包余额', '往返大道要用'], ['雨伞或帽子', '老城大部分时间在户外走'], ['防晒霜', ''], ['舒服的鞋', '一整天都在步行'], ['充电宝', '拍照耗电快']],
  },
  金马伦: {
    match: /金马伦|金马仑|cameron/i,
    title: '金马伦 · 高原避暑',
    summary: '茶园、草莓园和苔藓森林，凉爽的两天高原小旅行。',
    travel: { flyFrom: '', flyTo: '', hotelCity: 'Cameron Highlands' },
    days: [
      { title: '上山 · 茶园与草莓', items: [
        P('08:00', 'transport', '从吉隆坡出发', '自驾约 3.5 小时，山路弯多，容易晕车的人提前准备。', '开车约 15 分钟'),
        P('12:00', 'food', '午餐：火锅 Steamboat', '高原凉爽，火锅很受欢迎。', '开车约 15 分钟', 'Steamboat, Brinchang, Cameron Highlands'),
        P('14:00', 'sight', '茶园', '看大片茶园，可以喝茶拍照。', '开车约 15 分钟', 'Tea Plantation, Cameron Highlands'),
        P('16:00', 'sight', '草莓园', '可以自己摘草莓，价格以现场为准。', '开车约 10 分钟', 'Strawberry Farm, Cameron Highlands'),
        P('17:30', 'hotel', '入住丹那拉打或布林', '晚上气温比较低，记得带外套。', '开车约 10 分钟', 'Hotels, Tanah Rata, Cameron Highlands'),
        P('19:30', 'food', '晚餐 + 布林夜市', '夜市多在周末，以当地为准。', '', 'Brinchang Night Market, Cameron Highlands'),
      ] },
      { title: '森林 · 回程', items: [
        P('08:00', 'food', '早餐：司康饼配红茶', '茶园咖啡厅的经典组合。', '开车约 30 分钟', 'Scones and Tea, Cameron Highlands'),
        P('09:30', 'sight', '苔藓森林', '雾气里的原始森林，路滑要穿防滑鞋；开放情况出发前确认。', '开车约 30 分钟', 'Mossy Forest, Cameron Highlands'),
        P('12:00', 'food', '午餐 + 买蔬菜手信', '高原蔬菜、草莓果酱带回家。', '', 'Kea Farm Market, Cameron Highlands'),
        P('14:00', 'transport', '回程吉隆坡', '自驾约 3.5 小时。'),
      ] },
    ],
    packing: [['身份证 MyKad', ''], ['驾照', '自驾需要'], ['外套或长袖', '高原早晚比较凉'], ['晕车药', '上山弯路多'], ['防滑鞋', '苔藓森林路滑'], ['雨伞', '山上常下雨'], ['充电宝', '']],
  },
};

function presetBudget(total, days) {
  const parts = days > 1
    ? [['住宿', 0.32, `${days - 1} 晚住宿`], ['交通', 0.25, '油费、过路费、停车或车票'], ['餐饮', 0.24, '正餐和小吃'], ['门票活动', 0.12, '景点门票、缆车、导览'], ['机动', 0.07, '手信和意外开销']]
    : [['交通', 0.35, '油费、过路费、停车或车票'], ['餐饮', 0.4, '正餐和小吃'], ['门票活动', 0.15, '景点门票和游船'], ['机动', 0.1, '手信和意外开销']];
  let left = total;
  return parts.map(([name, r, note], i) => {
    const amount = i === parts.length - 1 ? left : Math.round(total * r);
    left -= amount;
    return { name, amount, note };
  });
}

function findPreset(dest) {
  return Object.values(PRESETS).find((p) => p.match.test(dest)) || null;
}

// ---------- form ----------
export default function tripForm(root) {
  const f = Object.assign({
    dest: '槟城', from: store.get('homeCity', '吉隆坡'), start: dayKey(nextSaturday()), days: 3, people: 2,
    budget: 1500, mode: 'car', styles: ['美食', '拍照打卡', '文化古迹'], pace: 'mid', extra: '',
  }, store.get('tripForm', {}));
  if (parseDay(f.start) < today()) f.start = dayKey(nextSaturday());
  let busy = false;
  let alive = true;
  const save = () => store.set('tripForm', f);

  const dateRange = () => {
    const s = parseDay(f.start);
    const e = addDays(s, f.days - 1);
    return f.days === 1 ? `${fmtMD(s)} ${fmtWeek(s)}` : `${fmtMD(s)} ${fmtWeek(s)} → ${fmtMD(e)} ${fmtWeek(e)}`;
  };
  const perDay = () => money0(f.budget / f.people / f.days);

  function render() {
    const hasKey = !!getApiKey();
    root.innerHTML = `<div class="screen">
      ${topbar({ title: 'AI 行程规划', right: `<button type="button" class="pill" data-mine>我的行程</button>` })}
      <main class="body">
        <section class="hero stack" style="gap:14px">
          <span class="row" style="gap:8px">
            <span class="ibox accent" style="width:28px;height:28px;border-radius:14px">${icon('sparkle', 16)}</span>
            <label for="dest" class="muted" style="font-size:14px">想去哪里玩？</label>
          </span>
          <input id="dest" class="bare" maxlength="40" autocomplete="off" placeholder="输入目的地，如：槟城" value="${esc(f.dest)}" style="font-size:30px;line-height:40px;font-weight:700;border-bottom:2px solid var(--hero-line);padding-bottom:8px">
          <span class="small muted">热门灵感</span>
          <div class="chips wrap">${IDEAS.map((i, n) => `<button type="button" class="chip" data-idea="${n}" style="min-height:36px;font-size:13px;font-weight:600;${i.dest === f.dest && i.days === f.days ? 'background:var(--accent);color:var(--on-accent)' : 'background:var(--hero-chip);color:var(--hero-ink)'}">${i.label}</button>`).join('')}</div>
        </section>

        <section class="list" style="padding:4px 16px">
          <label class="item" style="min-height:60px">
            <span class="ibox">${icon('pin', 18)}</span>
            <span class="grow stack" style="gap:1px"><span class="small muted">出发地</span><input id="from" class="bare" maxlength="20" value="${esc(f.from)}" style="font-size:16px;font-weight:600"></span>
          </label>
          <label class="item" style="min-height:60px;border-top:1px solid var(--line)">
            <span class="ibox">${icon('calendar', 18)}</span>
            <span class="grow stack" style="gap:1px"><span class="small muted">出发日期 · ${nightsLabel(f.days)}</span><span id="range" style="font-weight:600">${dateRange()}</span></span>
            <span class="pill" style="position:relative;background:var(--surface-2);min-height:40px;height:40px">更改
              <input id="start" type="date" value="${esc(f.start)}" min="${dayKey(today())}" aria-label="出发日期" style="position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer">
            </span>
          </label>
        </section>

        <div class="duo">
          ${[['people', '人数', 20], ['days', '天数', 14]].map(([k, l]) => `<div class="mini" style="gap:10px">
            <span class="small muted">${l}</span>
            <span class="between">
              <button type="button" class="round" style="background:var(--surface-2)" data-step="${k}" data-d="-1" aria-label="减少${l}" ${f[k] <= 1 ? 'disabled' : ''}>${icon('minus', 18)}</button>
              <output class="num" style="font-size:24px;font-weight:700">${f[k]}</output>
              <button type="button" class="round dark" data-step="${k}" data-d="1" aria-label="增加${l}">${icon('plus', 18)}</button>
            </span>
          </div>`).join('')}
        </div>

        <section class="card stack" style="gap:4px">
          <div class="between"><label for="budget" class="label">总预算</label><span class="small muted" id="perday">约每人每天 RM${perDay()}</span></div>
          <span class="num" id="budgetv" style="font-size:30px;line-height:36px;font-weight:700">RM${money0(f.budget)}</span>
          <input id="budget" class="range" type="range" min="200" max="10000" step="100" value="${f.budget}">
        </section>

        <section class="card stack" style="gap:10px">
          <h2 class="label">出行方式</h2>
          <div class="opts" style="grid-template-columns:repeat(4,minmax(0,1fr))">${MODES.map(([k, l, ic]) => `<button type="button" class="opt" data-mode="${k}" ${pressed(f.mode === k)}>${icon(ic, 22)}${l}</button>`).join('')}</div>
        </section>

        <section class="card stack" style="gap:10px">
          <h2 class="label">旅行风格 · 可多选</h2>
          <div class="chips wrap">${STYLES.map((s) => `<button type="button" class="chip" data-style="${esc(s)}" ${pressed(f.styles.includes(s))}>${s}</button>`).join('')}</div>
        </section>

        <section class="card stack" style="gap:10px">
          <h2 class="label">行程节奏</h2>
          <div class="opts" style="grid-template-columns:repeat(3,minmax(0,1fr))">${PACES.map(([k, l, h]) => `<button type="button" class="opt" data-pace="${k}" ${pressed(f.pace === k)}>${l}<span class="s">${h}</span></button>`).join('')}</div>
        </section>

        <label class="card stack" style="gap:8px">
          <span class="label">补充要求（可选）</span>
          <textarea id="extra" class="input" rows="3" maxlength="300" placeholder="比如：带老人，少走路；想吃清真餐；第二天要早点回" style="padding:12px 14px;resize:vertical">${esc(f.extra)}</textarea>
        </label>

        ${hasKey ? '' : `<p class="note">${icon('info', 16)}<span>还没有设置 AI。现在可以先用内置的槟城、马六甲、金马伦示例行程；到「我的」填写 Claude API Key 后，任何目的地都能用 AI 规划。</span></p>`}
      </main>
      <div class="bottom">
        <button type="button" class="btn" data-go ${busy ? 'disabled' : ''}>
          ${busy ? '<span class="spinner"></span>' : icon('sparkle', 22)}
          <span style="text-align:left">${busy ? 'AI 正在规划…' : hasKey ? 'AI 生成行程' : '生成行程'}<span class="sub">${busy ? '通常需要 30–60 秒，请别关闭' : esc(`${f.dest || '目的地'} · ${nightsLabel(f.days)} · ${f.people} 人`)}</span></span>
        </button>
      </div>
    </div>`;
  }

  function refreshNumbers() {
    root.querySelector('#budgetv').textContent = `RM${money0(f.budget)}`;
    root.querySelector('#perday').textContent = `约每人每天 RM${perDay()}`;
  }

  root.oninput = (e) => {
    const t = e.target;
    if (t.id === 'dest') f.dest = t.value;
    else if (t.id === 'from') f.from = t.value;
    else if (t.id === 'extra') f.extra = t.value;
    else if (t.id === 'budget') { f.budget = Number(t.value); refreshNumbers(); }
    else return;
    save();
  };
  root.onchange = (e) => {
    if (e.target.id === 'start' && e.target.value) {
      f.start = e.target.value;
      save();
      root.querySelector('#range').textContent = dateRange();
    } else if (e.target.id === 'dest') render();
  };

  async function generate() {
    const dest = f.dest.trim();
    if (!dest) { toast('先写下想去哪里'); return; }
    const meta = {
      id: uid(), dest, from: f.from.trim() || '吉隆坡', start: f.start, people: f.people, budgetTotal: f.budget,
      mode: f.mode, created: Date.now(), checked: {},
    };
    const modeName = MODES.find((m) => m[0] === f.mode)[1];
    const paceName = PACES.find((p) => p[0] === f.pace).slice(1).join('，');

    if (!getApiKey()) {
      const preset = findPreset(dest);
      if (!preset) {
        const sheet = openSheet(`<h2 class="title">这个目的地需要 AI</h2>
          <p class="muted">内置示例只有槟城、马六甲和金马伦。到「我的」填写 Claude API Key 后，任何目的地都能规划。</p>
          <a class="btn dark" href="#/me">去设置 AI</a>
          <button type="button" class="btn ghost" data-close style="background:var(--surface-2)">先不用</button>`, { label: '需要设置 AI' });
        sheet.el.querySelector('a').addEventListener('click', () => sheet.close());
        return;
      }
      const plan = {
        ...meta, source: 'preset', title: preset.title, summary: preset.summary,
        travel: { ...preset.travel, flyFrom: preset.travel.flyTo ? (iataOf(meta.from) || preset.travel.flyFrom) : '' },
        days: preset.days, budget: presetBudget(f.budget, preset.days.length),
        packing: preset.packing.map(([name, hint]) => ({ name, hint })),
      };
      saveTrips([plan, ...loadTrips()]);
      location.hash = '#/trip/plan?id=' + plan.id;
      return;
    }

    busy = true;
    render();
    const request = describeRequest({ ...f, dest, modeName, paceName });
    try {
      const out = await askPlan([{ role: 'user', content: request }]);
      const plan = { ...meta, ...out, source: 'ai', request };
      saveTrips([plan, ...loadTrips()]);
      if (alive) location.hash = '#/trip/plan?id=' + plan.id;
      else toast('AI 行程已生成，在「AI 行程 › 我的行程」查看');
    } catch (err) {
      if (alive) toast(err.message || '生成失败，请再试一次', 4000);
    } finally {
      busy = false;
      if (alive && location.hash.startsWith('#/trip') && !location.hash.includes('plan')) render();
    }
  }

  function mine() {
    const trips = loadTrips();
    const sheet = openSheet(`<h2 class="title">我的行程</h2>
      ${trips.length ? `<ul class="list" style="padding:0 4px;background:transparent">${trips.map((t) => `<li><a class="item" href="#/trip/plan?id=${t.id}"><span class="ibox ${t.source === 'ai' ? 'accent' : ''}">${icon(t.source === 'ai' ? 'sparkle' : 'pin', 20)}</span><span class="grow stack" style="gap:2px"><span class="t">${esc(t.title)}</span><span class="s">${esc(fmtMD(parseDay(t.start)))} · ${nightsLabel(t.days.length)} · ${t.people} 人</span></span>${icon('chev', 18)}</a></li>`).join('')}</ul>`
        : '<p class="muted">生成的行程会保存在这里，最多保留 10 个。</p>'}
      <button type="button" class="btn ghost" data-close style="background:var(--surface-2)">关闭</button>`, { label: '我的行程' });
    sheet.el.addEventListener('click', (x) => { if (x.target.closest('a')) sheet.close(); });
  }

  root.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b || busy) return;
    if (b.dataset.idea) { const i = IDEAS[Number(b.dataset.idea)]; f.dest = i.dest; f.days = i.days; }
    else if (b.dataset.step) { const k = b.dataset.step; f[k] = Math.max(1, Math.min(k === 'days' ? 14 : 20, f[k] + Number(b.dataset.d))); }
    else if (b.dataset.mode) f.mode = b.dataset.mode;
    else if (b.dataset.style) { const s = b.dataset.style; f.styles = f.styles.includes(s) ? f.styles.filter((x) => x !== s) : [...f.styles, s]; }
    else if (b.dataset.pace) f.pace = b.dataset.pace;
    else if (b.hasAttribute('data-mine')) { mine(); return; }
    else if (b.hasAttribute('data-go')) { generate(); return; }
    else return;
    save();
    render();
  };

  render();
  return () => { alive = false; };
}

// ---------- plan viewer ----------
export function plan(root, params) {
  const trips = loadTrips();
  let p = trips.find((t) => t.id === params.get('id')) || trips[0];
  if (!p) { location.hash = '#/trip'; return; }
  let tab = 'days';
  let day = 0;
  let busy = false;
  let alive = true;

  const persist = () => saveTrips(loadTrips().map((t) => (t.id === p.id ? p : t)));
  const startDay = parseDay(p.start);

  // ---- booking links (Trip.com) ----
  const ext = 'target="_blank" rel="noopener noreferrer"';
  function booking() {
    const tv = p.travel || {};
    const nDays = p.days.length;
    const endDay = addDays(startDay, nDays - 1);
    const codeOk = (c) => /^[A-Za-z]{3}$/.test(c || '');
    const flight = codeOk(tv.flyFrom) && codeOk(tv.flyTo) && tv.flyFrom.toUpperCase() !== tv.flyTo.toUpperCase() && (p.source === 'ai' || p.mode === 'plane')
      ? {
        url: tripFlightUrl({ from: tv.flyFrom, to: tv.flyTo, depart: p.start, ret: nDays > 1 ? dayKey(endDay) : '', people: p.people }),
        label: `${tv.flyFrom.toUpperCase()} ${nDays > 1 ? '⇄' : '→'} ${tv.flyTo.toUpperCase()}`,
        sub: `${fmtMD(startDay)} 去${nDays > 1 ? ` · ${fmtMD(endDay)} 回` : ''} · ${p.people} 人`,
      }
      : null;
    const hotel = nDays > 1
      ? {
        ...tripHotelUrl({ city: tv.hotelCity, dest: p.dest, checkin: p.start, checkout: dayKey(endDay), adults: p.people }),
        label: tv.hotelCity || p.dest,
        sub: `${fmtMD(startDay)} 入住 · ${nDays - 1} 晚 · ${p.people} 人`,
      }
      : null;
    return { flight, hotel };
  }

  function bookingHtml() {
    const { flight, hotel } = booking();
    if (!flight && !hotel) return '';
    const row = (href, ic, title, sub) => `<li><a class="item" href="${esc(href)}" ${ext} style="min-height:62px">
        <span class="ibox">${icon(ic, 20)}</span>
        <span class="grow stack" style="gap:2px"><span class="t">${title}</span><span class="s">${sub}</span></span>
        <span class="row small muted" style="gap:4px;flex:none">Trip.com${icon('external', 16)}</span>
      </a></li>`;
    return `<section class="stack" style="gap:8px">
        <div class="section-h"><h3>预订 · 价格以 Trip.com 页面为准</h3></div>
        <ul class="list">
          ${flight ? row(flight.url, 'plane', `机票 · ${esc(flight.label)}`, esc(flight.sub)) : ''}
          ${hotel ? row(hotel.url, 'bed', `酒店 · ${esc(hotel.label)}`, esc(hotel.sub) + (hotel.exact ? '' : ' · 打开后在搜索框选城市')) : ''}
        </ul>
      </section>`;
  }

  // Map / booking chips under one itinerary stop.
  function linksHtml(it) {
    const chips = [];
    const { flight, hotel } = booking();
    if (it.place && it.kind !== 'transport' && it.kind !== 'flight') {
      chips.push(`<a class="lchip" href="${esc(gmapsUrl(it.place))}" ${ext}>${icon('pin', 14)}Google 地图</a>`);
      chips.push(`<a class="lchip" href="${esc(wazeUrl(it.place))}" ${ext}>${icon('car', 14)}Waze</a>`);
    }
    if (it.kind === 'hotel' && hotel) chips.push(`<a class="lchip on" href="${esc(hotel.url)}" ${ext}>${icon('bed', 14)}Trip.com 订酒店</a>`);
    if (flight && (it.kind === 'flight' || /航班|飞机|机场|登机|起飞/.test(it.title + it.note))) {
      chips.push(`<a class="lchip on" href="${esc(flight.url)}" ${ext}>${icon('plane', 14)}Trip.com 查机票</a>`);
    }
    return chips.length ? `<span class="lchips">${chips.join('')}</span>` : '';
  }

  function itineraryHtml() {
    const d = p.days[day] || p.days[0];
    return `<div class="seg" role="group" aria-label="选择日期" style="grid-auto-columns:minmax(0,1fr)">
        ${p.days.map((_, i) => { const dd = addDays(startDay, i); return `<button type="button" data-day="${i}" ${pressed(i === day)} style="min-height:52px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px"><span style="font-weight:700">第 ${i + 1} 天</span><span style="font-size:11px;opacity:.8">${fmtMD(dd)} ${fmtWeek(dd)}</span></button>`; }).join('')}
      </div>
      <div class="between" style="padding:0 4px;align-items:baseline"><h2 class="title">${esc(d.title)}</h2><span class="small muted">${d.items.length} 站</span></div>
      <ol class="tl">${d.items.map((it) => {
        const k = KIND[it.kind] || KIND.sight;
        return `<li><span class="time num">${esc(it.time)}</span>
          <span class="rail"><span class="ibox ${k.cls}">${icon(k.icon, 18)}</span><span class="line"></span></span>
          <span class="content"><span class="box"><span style="font-weight:600">${esc(it.title)}</span><span class="small muted" style="font-size:13px;line-height:19px">${esc(it.note)}</span>${linksHtml(it)}</span>
          ${it.travel ? `<span class="travel">↓ ${esc(it.travel)}</span>` : ''}</span></li>`;
      }).join('')}</ol>`;
  }

  function budgetHtml() {
    const total = p.budget.reduce((s, b) => s + Number(b.amount || 0), 0) || 1;
    const colors = ['var(--accent)', 'var(--hero-ink)', 'var(--hero-muted)', '#7A7A74', '#4A4A47', '#C9A227'];
    return `<section class="hero stack" style="gap:14px">
        <div class="between"><span class="muted" style="font-size:14px">${esc(p.dest)} · ${p.people} 人</span><span class="badge">${p.source === 'ai' ? 'AI 建议分配' : '建议分配'}</span></div>
        <div class="between" style="align-items:baseline"><span class="num" style="font-size:40px;line-height:46px;font-weight:700">RM${money0(total)}</span><span class="small muted">约每人 RM${money0(total / p.people)}</span></div>
        <div class="stackbar" aria-hidden="true">${p.budget.map((b, i) => `<span style="flex:${Number(b.amount) || 0};background:${colors[i % colors.length]}"></span>`).join('')}</div>
        <ul class="list" style="background:transparent;padding:0">${p.budget.map((b, i) => `<li class="item" style="min-height:52px;${i ? 'border-top:1px solid var(--hero-line)' : ''}">
          <span class="dot" style="background:${colors[i % colors.length]}"></span>
          <span class="grow stack" style="gap:1px"><span style="font-weight:600">${esc(b.name)} · ${Math.round((Number(b.amount) / total) * 100)}%</span><span class="small muted">${esc(b.note)}</span></span>
          <span class="num" style="font-weight:700">RM${money0(b.amount)}</span></li>`).join('')}</ul>
      </section>
      <div class="duo">
        <a class="mini" href="#/expense"><span class="ibox accent">${icon('wallet', 18)}</span><span style="font-weight:600">记账</span><span class="small muted">旅途花费随手记</span></a>
        <a class="mini" href="#/split"><span class="ibox dark">${icon('split', 18)}</span><span style="font-weight:600">AA 分账</span><span class="small muted">回来一键算清</span></a>
      </div>
      <a class="mini" href="#/fuel" style="flex-direction:row;align-items:center;gap:12px"><span class="ibox">${icon('fuel', 18)}</span><span class="grow"><span style="font-weight:600">算一算油费</span><br><span class="small muted">自驾出发前估算来回油钱</span></span>${icon('chev', 18)}</a>`;
  }

  function packingHtml() {
    const done = p.packing.filter((_, i) => p.checked[i]).length;
    return `<section class="card stack" style="gap:10px;padding:18px 16px 8px">
      <div class="between" style="padding:0 4px"><h2 class="title" style="font-size:16px">行李清单</h2><span class="small muted">已准备 ${done}/${p.packing.length}</span></div>
      <span class="bar" style="height:6px;margin:0 4px"><span style="width:${Math.round((done / Math.max(1, p.packing.length)) * 100)}%"></span></span>
      <ul class="list" style="padding:0;background:transparent">${p.packing.map((it, i) => `<li><label class="item" style="min-height:52px;padding:0 4px;cursor:pointer">
        <input type="checkbox" class="check" data-pack="${i}" ${p.checked[i] ? 'checked' : ''}>
        <span class="grow stack" style="gap:1px"><span style="${p.checked[i] ? 'text-decoration:line-through;color:var(--faint)' : ''}">${esc(it.name)}</span>${it.hint ? `<span class="small muted">${esc(it.hint)}</span>` : ''}</span>
      </label></li>`).join('')}</ul>
    </section>`;
  }

  function render() {
    const hasKey = !!getApiKey();
    root.innerHTML = `<div class="screen">
      ${topbar({ title: p.title, back: '#/trip', right: `<button type="button" class="round" data-share aria-label="分享行程">${icon('share', 20)}</button>` })}
      <main class="body">
        <section class="accent-card stack" style="gap:8px">
          <span class="badge dark" style="align-self:flex-start">${icon('sparkle', 14)}${p.source === 'ai' ? 'AI 生成 · 可随时调整' : '内置示例行程'}</span>
          <span style="font-size:24px;line-height:30px;font-weight:700">${esc(p.title)}</span>
          <span class="small muted" style="font-size:13px">${esc(fmtMD(startDay))} – ${esc(fmtMD(addDays(startDay, p.days.length - 1)))} · ${p.people} 人 · 从${esc(p.from)}出发</span>
          <span style="font-size:14px">${esc(p.summary)}</span>
        </section>
        <div class="seg" role="group" aria-label="内容">
          ${[['days', '行程'], ['budget', '预算'], ['pack', '清单']].map(([k, l]) => `<button type="button" data-tab="${k}" ${pressed(tab === k)}>${l}</button>`).join('')}
        </div>
        ${tab === 'days' ? bookingHtml() + itineraryHtml() : tab === 'budget' ? budgetHtml() + bookingHtml() : packingHtml()}
        <p class="note">${icon('info', 16)}<span>营业时间、票价和路况会变，出发前请再确认一次。</span></p>
      </main>
      ${tab === 'days' ? (hasKey
        ? `<div class="bottom stack" style="gap:10px">
            <div class="chips" style="margin:0 -20px">${['第二天少走路', '加个雨天备案', '换成更省钱', '多点本地美食'].map((q) => `<button type="button" class="chip" style="background:var(--surface);min-height:36px;font-size:13px" data-ask="${q}">${q}</button>`).join('')}</div>
            <form class="row" id="refine" style="gap:8px">
              <label class="search grow" style="min-height:48px"><span class="sr">告诉 AI 怎么改</span><input class="bare" id="ask" maxlength="200" placeholder="告诉 AI 想怎么改…" autocomplete="off" ${busy ? 'disabled' : ''}></label>
              <button type="submit" class="round" style="width:48px;height:48px;background:var(--accent);color:var(--on-accent)" aria-label="发送给 AI" ${busy ? 'disabled' : ''}>${busy ? '<span class="spinner"></span>' : icon('send', 20)}</button>
            </form>
            ${busy ? '<span class="small muted" role="status">AI 正在调整行程，通常需要 30–60 秒…</span>' : ''}
          </div>`
        : `<div class="bottom"><a class="btn ghost" href="#/me">${icon('key', 18)}设置 AI 后可以让它修改行程</a></div>`) : ''}
    </div>`;
  }

  async function refine(ask) {
    if (!ask || busy) return;
    if (p.source !== 'ai' && !p.request) {
      p.request = describeRequest({
        dest: p.dest, from: p.from, start: p.start, days: p.days.length, people: p.people, budget: p.budgetTotal,
        modeName: (MODES.find((m) => m[0] === p.mode) || MODES[0])[1], styles: [], paceName: '适中', extra: '',
      });
    }
    busy = true;
    render();
    const previous = { title: p.title, summary: p.summary, travel: p.travel || { flyFrom: '', flyTo: '', hotelCity: '' }, days: p.days, budget: p.budget, packing: p.packing };
    try {
      const out = await askPlan([
        { role: 'user', content: p.request },
        { role: 'assistant', content: JSON.stringify(previous) },
        { role: 'user', content: `请按这个要求调整行程，其余部分保持合理，返回完整的新行程：${ask}` },
      ]);
      p = { ...p, ...out, source: 'ai', checked: {} };
      persist();
      day = Math.min(day, p.days.length - 1);
      if (alive) toast('行程已更新');
    } catch (err) {
      if (alive) toast(err.message || '调整失败，请再试一次', 4000);
    } finally {
      busy = false;
      if (alive) render();
    }
  }

  root.onsubmit = (e) => {
    e.preventDefault();
    const v = root.querySelector('#ask').value.trim();
    if (v) refine(v);
  };
  root.onchange = (e) => {
    const i = e.target.dataset.pack;
    if (i === undefined) return;
    p.checked = { ...p.checked, [i]: e.target.checked };
    persist();
    render();
  };
  root.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.tab) { tab = b.dataset.tab; render(); }
    else if (b.dataset.day) { day = Number(b.dataset.day); render(); }
    else if (b.dataset.ask) { const input = root.querySelector('#ask'); input.value = b.dataset.ask; input.focus(); }
    else if (b.hasAttribute('data-share')) {
      const lines = [`${p.title}（${fmtMD(startDay)} 起 · ${p.days.length} 天 · ${p.people} 人）`, p.summary, ''];
      p.days.forEach((d, i) => {
        lines.push(`【第 ${i + 1} 天 · ${d.title}】`);
        d.items.forEach((it) => lines.push(`${it.time} ${it.title}`));
        lines.push('');
      });
      lines.push('—— 用口袋工具箱规划');
      shareText(lines.join('\n'), p.title);
    }
  };

  render();
  return () => { alive = false; };
}
