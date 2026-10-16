// 扫一扫: camera QR scanning with jsQR (loaded on demand), plus scanning from a photo.
import { icon, esc, store, topbar, openSheet, copyText, toast } from '../lib.js';

const JSQR_URL = new URL('../../vendor/jsQR.js', import.meta.url).href;
let jsqrPromise = null;
function loadJsQR() {
  if (window.jsQR) return Promise.resolve();
  if (!jsqrPromise) {
    jsqrPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = JSQR_URL;
      s.onload = resolve;
      s.onerror = () => { jsqrPromise = null; reject(new Error('jsQR load failed')); };
      document.head.appendChild(s);
    });
  }
  return jsqrPromise;
}

function classify(text) {
  if (/^https?:\/\//i.test(text)) return { kind: 'url', icon: 'link', label: '网址' };
  if (/^WIFI:/i.test(text)) return { kind: 'wifi', icon: 'wifi', label: 'Wi-Fi 网络' };
  return { kind: 'text', icon: 'text', label: '文字' };
}
function parseWifi(text) {
  const get = (k) => { const m = text.match(new RegExp(`[;:]${k}:((?:\\\\.|[^;])*)`, 'i')); return m ? m[1].replace(/\\(.)/g, '$1') : ''; };
  return { ssid: get('S'), pass: get('P'), type: get('T') || '无密码' };
}

export default function scan(root) {
  let stream = null;
  let raf = 0;
  let paused = false;
  let alive = true;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const history = () => store.get('scanHistory', []);

  function render(status = '正在打开相机…') {
    const h = history();
    root.innerHTML = `<div class="screen scan-screen">
      ${topbar({ title: '扫一扫', fav: 'scan' })}
      <main class="body" style="padding-top:4px">
        <div class="viewfinder">
          <video id="video" playsinline muted autoplay aria-label="相机画面"></video>
          <span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>
          <span class="scanline" aria-hidden="true"></span>
        </div>
        <p id="status" class="small" style="text-align:center;color:#B5B5AE;font-size:14px" aria-live="polite">${esc(status)}</p>
        <label class="btn small" style="background:rgba(255,255,255,.12);color:#FFFFFF;cursor:pointer">
          ${icon('image', 20)}从相册选二维码图片
          <input type="file" accept="image/*" id="file" class="sr">
        </label>
        <section class="card stack" style="gap:6px;color:var(--ink);margin-top:6px">
          <div class="between"><h2 style="font-size:16px;font-weight:700">最近扫描</h2>${h.length ? '<button type="button" class="link" data-clear>清除</button>' : ''}</div>
          ${h.length ? `<ul class="list" style="padding:0;background:transparent">${h.slice(0, 8).map((x, i) => {
            const c = classify(x.text);
            return `<li><button type="button" class="item" data-hist="${i}"><span class="ibox">${icon(c.icon, 20)}</span><span class="grow stack" style="gap:2px;min-width:0"><span class="t">${c.label}</span><span class="s ellipsis">${esc(c.kind === 'wifi' ? parseWifi(x.text).ssid : x.text)}</span></span>${icon('chev', 18)}</button></li>`;
          }).join('')}</ul>` : '<p class="small muted">扫过的二维码会保存在这里。</p>'}
        </section>
        <p class="note" style="color:#B5B5AE">${icon('info', 16)}<span>支持二维码（网址、Wi-Fi、文字）。iPhone 自带相机也能扫码，这里的好处是会记下扫描历史。</span></p>
      </main>
    </div>`;
  }

  const setStatus = (s) => { const el = root.querySelector('#status'); if (el) el.textContent = s; };

  function showResult(text, save = true) {
    paused = true;
    if (save) {
      const list = history().filter((x) => x.text !== text);
      list.unshift({ text, at: Date.now() });
      store.set('scanHistory', list.slice(0, 20));
    }
    const c = classify(text);
    let body = `<p style="word-break:break-all;font-size:15px">${esc(text)}</p>`;
    let actions = `<button type="button" class="btn dark" data-copy>${icon('copy', 20)}复制内容</button>`;
    if (c.kind === 'url') {
      actions = `<a class="btn" href="${esc(text)}" target="_blank" rel="noopener noreferrer">${icon('link', 20)}打开网址</a>` + actions;
      body += '<p class="small muted">打开前请确认网址可信。</p>';
    } else if (c.kind === 'wifi') {
      const w = parseWifi(text);
      body = `<div class="stack" style="gap:4px"><span class="label">网络名称</span><span style="font-size:20px;font-weight:700">${esc(w.ssid)}</span>
        <span class="label" style="margin-top:8px">密码</span><span class="num" style="font-size:18px;word-break:break-all">${esc(w.pass || '（无）')}</span></div>
        <p class="small muted">复制密码后，到 设置 › Wi-Fi 选择这个网络粘贴即可。</p>`;
      actions = `<button type="button" class="btn dark" data-copy-pass>${icon('copy', 20)}复制密码</button>`;
    }
    const sheet = openSheet(`<span class="row" style="gap:10px"><span class="ibox accent">${icon(c.icon, 20)}</span><h2 class="title">${c.label}</h2></span>
      ${body}${actions}
      <button type="button" class="btn ghost" data-close style="background:var(--surface-2)">继续扫描</button>`, {
      label: '扫描结果',
      onClose: () => { paused = false; if (alive) render('把二维码放进框里'); attachVideo(); },
    });
    sheet.el.addEventListener('click', (x) => {
      if (x.target.closest('[data-copy]')) copyText(text);
      else if (x.target.closest('[data-copy-pass]')) copyText(parseWifi(text).pass);
    });
  }

  function tick() {
    if (!alive) return;
    raf = requestAnimationFrame(tick);
    const video = root.querySelector('#video');
    if (paused || !video || video.readyState < 2 || !window.jsQR) return;
    const w = Math.min(640, video.videoWidth);
    const h = Math.round((video.videoHeight / video.videoWidth) * w) || w;
    canvas.width = w; canvas.height = h;
    ctx.drawImage(video, 0, 0, w, h);
    const code = window.jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' });
    if (code && code.data) {
      if (navigator.vibrate) navigator.vibrate(40);
      showResult(code.data);
    }
  }

  function attachVideo() {
    const video = root.querySelector('#video');
    if (video && stream) { video.srcObject = stream; video.play().catch(() => {}); }
  }

  async function start() {
    try {
      await loadJsQR();
    } catch {
      setStatus('扫码组件加载失败，请关掉这个页面再打开一次。');
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('这个浏览器不能使用相机，可以改用「从相册选」。');
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      if (!alive) { stream.getTracks().forEach((t) => t.stop()); return; }
      attachVideo();
      setStatus('把二维码放进框里');
      tick();
    } catch (err) {
      setStatus(err && err.name === 'NotAllowedError'
        ? '没有相机权限。可以到 设置 › Safari › 相机 里允许，或改用「从相册选」。'
        : '打不开相机，可以改用「从相册选」。');
    }
  }

  async function scanFile(file) {
    try {
      await loadJsQR();
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      await img.decode();
      const scale = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight));
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const code = window.jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
      if (code && code.data) showResult(code.data);
      else toast('这张图片里没有找到二维码');
    } catch {
      toast('读取图片失败');
    }
  }

  root.onchange = (e) => {
    if (e.target.id === 'file' && e.target.files && e.target.files[0]) scanFile(e.target.files[0]);
    e.target.value = '';
  };
  root.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b || b.dataset.fav) return;
    if (b.dataset.hist) { const item = history()[Number(b.dataset.hist)]; if (item) showResult(item.text, false); }
    else if (b.hasAttribute('data-clear')) { store.set('scanHistory', []); render(root.querySelector('#status')?.textContent); attachVideo(); }
  };

  render();
  start();

  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    if (stream) stream.getTracks().forEach((t) => t.stop());
  };
}
