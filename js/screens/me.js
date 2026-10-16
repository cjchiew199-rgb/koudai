import { icon, esc, store, tabbar, toast, isStandalone, isNative, money, shareText } from '../lib.js';
import { getApiKey, setApiKey } from '../ai.js';
import { getBudget } from '../data.js';

const VERSION = '1.2.0';
export const PUBLIC_URL = 'https://cjchiew199-rgb.github.io/koudai/';

export default function me(root) {
  function render() {
    const key = getApiKey();
    const masked = key ? key.slice(0, 10) + '••••' + key.slice(-4) : '';
    root.innerHTML = `<div class="screen">
      <main class="body" style="padding-top:calc(env(safe-area-inset-top) + 24px)">
        <header class="stack" style="gap:2px"><h1 class="h1">我的</h1><span class="muted" style="font-size:14px">所有数据只保存在这台手机上</span></header>

        <section class="card stack" style="gap:12px">
          <div class="row" style="gap:10px"><span class="ibox accent">${icon('sparkle', 20)}</span><span class="grow stack" style="gap:1px"><span style="font-weight:700">AI 设置</span><span class="small muted">AI 行程规划使用 Anthropic 的 Claude</span></span></div>
          ${key
            ? `<div class="between"><span class="num small" style="font-size:14px">${esc(masked)}</span><button type="button" class="link danger" data-clear-key>移除</button></div>`
            : `<label class="field"><span class="label">Claude API Key</span><input class="input" id="key" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="sk-ant-…"></label>
               <button type="button" class="btn dark small" data-save-key>保存</button>`}
          <p class="small muted">去 <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" style="text-decoration:underline">console.anthropic.com</a> 注册并建立 API Key，按用量付费，规划一次行程大约 RM0.3–1。Key 只存在这台手机里，只会发送给 Anthropic。</p>
        </section>

        <ul class="list">
          <li><label class="item" style="min-height:60px"><span class="ibox">${icon('pin', 20)}</span><span class="grow stack" style="gap:1px"><span class="small muted">常住城市（行程的默认出发地）</span><input class="bare" id="city" maxlength="20" value="${esc(store.get('homeCity', '吉隆坡'))}" style="font-size:16px;font-weight:600"></span></label></li>
          <li><a class="item" href="#/expense" style="min-height:60px"><span class="ibox">${icon('wallet', 20)}</span><span class="grow stack" style="gap:1px"><span class="small muted">每月预算</span><span style="font-weight:600">RM${money(getBudget())}</span></span>${icon('chev', 18)}</a></li>
        </ul>

        ${isNative() ? '' : `<section class="card stack" style="gap:10px">
          <div class="row" style="gap:10px"><span class="ibox">${icon('share', 20)}</span><span style="font-weight:700">${isStandalone() ? '已经装在桌面上了' : '放到 iPhone 桌面'}</span></div>
          <ol class="small muted" style="margin:0;padding-left:20px;line-height:1.8">
            <li>用 Safari 打开这个网页</li>
            <li>点底部中间的「分享」按钮</li>
            <li>往下找「添加到主屏幕」，点「添加」</li>
          </ol>
          <p class="small muted">装好后从桌面打开就是全屏的 App，没网时大部分工具照样能用（汇率和 AI 行程需要网络）。</p>
        </section>`}

        <ul class="list">
          <li><button type="button" class="item" data-share-app style="min-height:60px"><span class="ibox accent">${icon('share', 20)}</span><span class="grow stack" style="gap:1px"><span class="t">分享给朋友</span><span class="s">发送口袋工具箱的网址，朋友用 Safari 打开就能用</span></span>${icon('chev', 18)}</button></li>
        </ul>

        <ul class="list">
          <li><button type="button" class="item danger" data-wipe style="min-height:56px"><span class="ibox">${icon('trash', 20)}</span><span class="grow t">清除所有数据</span></button></li>
        </ul>
        <p class="note" style="justify-content:center">口袋工具箱 ${VERSION} · 汇率来自 ExchangeRate-API / Frankfurter</p>
      </main>
      ${tabbar('me')}
    </div>`;
  }

  root.oninput = (e) => { if (e.target.id === 'city') store.set('homeCity', e.target.value.trim() || '吉隆坡'); };
  root.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-save-key')) {
      const v = root.querySelector('#key').value.trim();
      if (!v.startsWith('sk-ant-')) { toast('API Key 一般以 sk-ant- 开头，请检查'); return; }
      setApiKey(v);
      toast('已保存');
      render();
    } else if (b.hasAttribute('data-share-app')) {
      shareText(`口袋工具箱：换算、汇率、AA 分账、记账、倒数日、AI 行程……马来西亚日常小工具都在这里。
用 iPhone 的 Safari 打开，点「分享 › 添加到主屏幕」就能装到桌面：
${PUBLIC_URL}`, '口袋工具箱');
    } else if (b.hasAttribute('data-clear-key')) {
      setApiKey('');
      render();
    } else if (b.hasAttribute('data-wipe')) {
      if (window.confirm('确定清除记账、倒数日、待办、行程和所有设置吗？这个操作不能撤销。')) {
        store.clearAll();
        toast('已清除');
        render();
      }
    }
  };
  render();
}
