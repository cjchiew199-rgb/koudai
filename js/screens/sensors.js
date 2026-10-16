// Phone sensors: 指南针, 水平仪, and the screen 补光灯.
import { icon, topbar } from '../lib.js';

// iOS asks for motion permission once, and only from a tap.
async function askMotionPermission() {
  const D = window.DeviceOrientationEvent;
  if (D && typeof D.requestPermission === 'function') {
    const res = await D.requestPermission();
    return res === 'granted';
  }
  return !!D;
}

const DIRS = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];

export function compass(root) {
  let listening = false;
  let last = null;

  function shell(body) {
    root.innerHTML = `<div class="screen">${topbar({ title: '指南针', fav: 'compass' })}<main class="body" style="align-items:stretch">${body}</main></div>`;
  }

  function idle(msg = '') {
    shell(`<div class="card stack" style="gap:12px;align-items:center;text-align:center;padding:28px 20px">
      <span class="ibox accent" style="width:56px;height:56px;border-radius:18px">${icon('compass', 28)}</span>
      <span style="font-weight:600">需要使用手机的方向传感器</span>
      <span class="small muted">点下面的按钮，iPhone 会问你是否允许「运动与方向」权限。</span>
      ${msg ? `<span class="small danger">${msg}</span>` : ''}
      <button type="button" class="btn dark" data-start style="margin-top:6px">开启指南针</button>
    </div>`);
  }

  function live() {
    shell(`<div class="dial" aria-hidden="true">
        <div class="rose" id="rose">
          <span class="mark" style="color:var(--danger)">北</span>
          <span class="mark" style="left:auto;right:14px;top:50%;transform:translateY(-50%)">东</span>
          <span class="mark" style="top:auto;bottom:10px">南</span>
          <span class="mark" style="left:14px;top:50%;transform:translateY(-50%)">西</span>
        </div>
        <span class="needle"></span>
      </div>
      <div class="stack" style="align-items:center;gap:2px" aria-live="polite">
        <span class="num" id="deg" style="font-size:56px;line-height:60px;font-weight:700">--°</span>
        <span id="dir" class="muted" style="font-size:17px">转动手机看看</span>
      </div>
      <p class="note">${icon('info', 16)}<span>请把手机平放，远离磁铁和电器。如果读数不准，按 8 字形挥动手机来校准。</span></p>`);
  }

  function onOrient(e) {
    let heading = null;
    if (typeof e.webkitCompassHeading === 'number') heading = e.webkitCompassHeading;
    else if (e.absolute && typeof e.alpha === 'number') heading = 360 - e.alpha;
    if (heading == null) return;
    heading = (heading + 360) % 360;
    if (last != null && Math.abs(heading - last) < 0.5) return;
    last = heading;
    const rose = root.querySelector('#rose');
    if (!rose) return;
    rose.style.transform = `rotate(${-heading}deg)`;
    root.querySelector('#deg').textContent = Math.round(heading) + '°';
    root.querySelector('#dir').textContent = DIRS[Math.round(heading / 45) % 8];
  }

  root.onclick = async (e) => {
    if (!e.target.closest('[data-start]')) return;
    try {
      if (!(await askMotionPermission())) { idle('没有获得权限。可以在 设置 › Safari › 运动与方向访问 中开启。'); return; }
    } catch { idle('这个浏览器不支持方向传感器。'); return; }
    live();
    const evt = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
    window.addEventListener(evt, onOrient);
    listening = evt;
  };

  idle();
  return () => { if (listening) window.removeEventListener(listening, onOrient); };
}

export function level(root) {
  let listening = false;

  function shell(body) {
    root.innerHTML = `<div class="screen">${topbar({ title: '水平仪', fav: 'level' })}<main class="body">${body}</main></div>`;
  }
  function idle(msg = '') {
    shell(`<div class="card stack" style="gap:12px;align-items:center;text-align:center;padding:28px 20px">
      <span class="ibox accent" style="width:56px;height:56px;border-radius:18px">${icon('level', 28)}</span>
      <span style="font-weight:600">需要使用手机的方向传感器</span>
      <span class="small muted">把手机平放在要测的表面上，挂画、放柜子都能用。</span>
      ${msg ? `<span class="small danger">${msg}</span>` : ''}
      <button type="button" class="btn dark" data-start style="margin-top:6px">开启水平仪</button>
    </div>`);
  }
  function live() {
    shell(`<div class="levelbox" aria-hidden="true"><span class="ring"></span><span class="bubble" id="bubble"></span></div>
      <div class="duo">
        <div class="card stack" style="gap:2px;align-items:center"><span class="small muted">前后</span><span class="num" id="b" style="font-size:32px;font-weight:700">0.0°</span></div>
        <div class="card stack" style="gap:2px;align-items:center"><span class="small muted">左右</span><span class="num" id="g" style="font-size:32px;font-weight:700">0.0°</span></div>
      </div>
      <div class="badge" id="ok" style="align-self:center;font-size:14px;padding:6px 14px;visibility:hidden">${icon('check', 16)}已经水平</div>`);
  }
  function onOrient(e) {
    if (typeof e.beta !== 'number' || typeof e.gamma !== 'number') return;
    const bubble = root.querySelector('#bubble');
    if (!bubble) return;
    const b = e.beta, g = e.gamma;
    const clamp = (v) => Math.max(-20, Math.min(20, v));
    const size = bubble.parentElement.clientWidth / 2 - 30;
    bubble.style.transform = `translate(${(-clamp(g) / 20) * size}px, ${(-clamp(b) / 20) * size}px)`;
    const ok = Math.abs(b) < 1 && Math.abs(g) < 1;
    bubble.classList.toggle('ok', ok);
    root.querySelector('#b').textContent = b.toFixed(1) + '°';
    root.querySelector('#g').textContent = g.toFixed(1) + '°';
    root.querySelector('#ok').style.visibility = ok ? 'visible' : 'hidden';
  }
  root.onclick = async (e) => {
    if (!e.target.closest('[data-start]')) return;
    try {
      if (!(await askMotionPermission())) { idle('没有获得权限。可以在 设置 › Safari › 运动与方向访问 中开启。'); return; }
    } catch { idle('这个浏览器不支持方向传感器。'); return; }
    live();
    window.addEventListener('deviceorientation', onOrient);
    listening = true;
  };
  idle();
  return () => { if (listening) window.removeEventListener('deviceorientation', onOrient); };
}

export function torch(root) {
  const COLORS = [['#FFFFFF', '白光'], ['#FFE7B8', '暖光'], ['#FFC4C4', '柔红']];
  let idx = 0;
  let on = false;
  let wakeLock = null;

  async function keepAwake() {
    try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch { /* not supported */ }
  }
  function release() { try { if (wakeLock) wakeLock.release(); } catch { /* ignore */ } wakeLock = null; }

  function render() {
    if (on) {
      root.innerHTML = `<div class="torch" style="background:${COLORS[idx][0]};color:#141414">
        <span style="font-size:14px;opacity:.6">把亮度调到最大效果最好</span>
        <div class="row" style="gap:10px">
          <button type="button" class="pill" data-color style="background:rgba(0,0,0,.08)">换颜色 · ${COLORS[idx][1]}</button>
          <button type="button" class="pill" data-off style="background:#141414;color:#FFFFFF">关闭</button>
        </div>
      </div>`;
      return;
    }
    root.innerHTML = `<div class="screen">${topbar({ title: '补光灯', fav: 'torch' })}<main class="body">
      <div class="card stack" style="gap:12px;align-items:center;text-align:center;padding:28px 20px">
        <span class="ibox accent" style="width:56px;height:56px;border-radius:18px">${icon('torch', 28)}</span>
        <span style="font-weight:600">用屏幕当补光灯</span>
        <span class="small muted">iPhone 不允许网页控制相机闪光灯，所以这里把整个屏幕变成亮光，适合找东西、自拍补光。要用闪光灯手电筒，请从控制中心打开。</span>
        <button type="button" class="btn" data-on style="margin-top:6px">${icon('sun', 20)}打开补光灯</button>
      </div>
    </main></div>`;
  }

  root.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-on')) { on = true; keepAwake(); render(); }
    else if (b.hasAttribute('data-off')) { on = false; release(); render(); }
    else if (b.hasAttribute('data-color')) { idx = (idx + 1) % COLORS.length; render(); }
  };
  render();
  return release;
}
