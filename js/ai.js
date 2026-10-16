// AI 行程: calls Claude straight from the phone with the user's own API key.
// The key lives only in this device's localStorage (see 我的 → AI 设置).
import { store } from './lib.js';

// Bundled copy of @anthropic-ai/sdk (see scripts/vendor.mjs), so no code is fetched from a CDN.
const SDK_URL = new URL('../vendor/anthropic.mjs', import.meta.url).href;
const MODEL = 'claude-opus-5-5';

export const getApiKey = () => store.get('apiKey', '');
export const setApiKey = (k) => (k ? store.set('apiKey', k) : store.remove('apiKey'));

const PLAN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'summary', 'travel', 'days', 'budget', 'packing'],
  properties: {
    title: { type: 'string' },
    summary: { type: 'string' },
    travel: {
      type: 'object',
      additionalProperties: false,
      required: ['flyFrom', 'flyTo', 'hotelCity'],
      properties: {
        flyFrom: { type: 'string' },
        flyTo: { type: 'string' },
        hotelCity: { type: 'string' },
      },
    },
    days: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'items'],
        properties: {
          title: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['time', 'kind', 'title', 'note', 'place', 'travel'],
              properties: {
                time: { type: 'string' },
                kind: { type: 'string', enum: ['transport', 'flight', 'food', 'sight', 'hotel'] },
                title: { type: 'string' },
                note: { type: 'string' },
                place: { type: 'string' },
                travel: { type: 'string' },
              },
            },
          },
        },
      },
    },
    budget: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'amount', 'note'],
        properties: { name: { type: 'string' }, amount: { type: 'number' }, note: { type: 'string' } },
      },
    },
    packing: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'hint'],
        properties: { name: { type: 'string' }, hint: { type: 'string' } },
      },
    },
  },
};

const SYSTEM = `你是「口袋工具箱」App 里的旅行规划助手。用户主要是马来西亚华人，请用简体中文回答，金额用马币（RM）。

规划原则：
- 只推荐真实存在、适合这次旅行的地点和美食。不确定的营业时间、票价、是否需要预约，就在 note 里提醒用户出发前确认；不要编造具体价格、电话或网址。
- 每天按时间顺序安排。如果目的地和出发地不同，第一天从出发地出发，最后一天安排回程。
- time 用 24 小时制「HH:MM」。kind 只能是 transport（陆路交通）、flight（搭飞机）、food（餐饮）、sight（景点活动）、hotel（住宿）。
- note 写一两句实用、具体的提示。travel 写去下一站大约多久、怎么去，比如「开车约 15 分钟」；当天最后一站写空字符串。
- place 是给地图搜索用的地点名，用英文或当地文字写出真实地名并带上城市，比如「Kek Lok Si Temple, Penang」「Gurney Drive Hawker Centre, Penang」。如果推荐的是一类美食而不是某一家店，写「菜名 + 区域」，比如「Char Kway Teow, George Town, Penang」。路上交通和搭飞机写空字符串；住宿可以写区域，比如「Hotels near Armenian Street, George Town」。
- travel 对象：如果这次需要搭飞机（用户选了飞机，或者路程远到通常要飞），flyFrom 和 flyTo 填出发地和目的地的 IATA 城市或机场代码，比如 KUL、PEN、BKK；不用搭飞机就都填空字符串。hotelCity 填要住的城市英文名，比如「George Town」「Bangkok」；一日游填空字符串。
- 按用户选的节奏控制每天的站数，路线顺路，不要来回折返。
- budget 按类别分配（住宿、交通、餐饮、门票活动、机动），amount 是马币数字，总和等于用户的总预算；一日游不需要住宿。note 简单说明这笔钱花在哪里。
- packing 列 6 到 10 样这次旅行真正需要带的东西，hint 说明原因，没有就写空字符串。
- title 简短，比如「槟城 · 美食与老城」；summary 用一句话概括这次行程。`;

export function describeRequest(f) {
  const nights = f.days === 1 ? '一日游' : `${f.days}天${f.days - 1}夜`;
  return [
    '请为我规划一次旅行，返回完整行程。',
    `- 目的地：${f.dest}`,
    `- 出发地：${f.from}`,
    `- 出发日期：${f.start}，共 ${f.days} 天（${nights}）`,
    `- 人数：${f.people} 人`,
    `- 总预算：RM${f.budget}（包含交通、住宿、餐饮、门票）`,
    `- 出行方式：${f.modeName}`,
    `- 旅行风格：${f.styles.length ? f.styles.join('、') : '没有特别偏好'}`,
    `- 节奏：${f.paceName}`,
    f.extra ? `- 补充要求：${f.extra}` : '',
  ].filter(Boolean).join('\n');
}

let sdkPromise = null;
async function loadSdk() {
  if (!sdkPromise) sdkPromise = import(SDK_URL).catch((e) => { sdkPromise = null; throw e; });
  return (await sdkPromise).default;
}

// history: [{ role, content }] so far (user request, previous plan JSON, ...). Returns the parsed plan.
export async function askPlan(history) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('还没有填写 API Key。');
  let Anthropic;
  try {
    Anthropic = await loadSdk();
  } catch {
    throw new Error('AI 组件加载失败，请检查网络后再试。');
  }
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 1 });
  let res;
  try {
    res = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: PLAN_SCHEMA } },
      system: SYSTEM,
      messages: history,
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new Error('API Key 不正确，请到「我的」重新填写。');
    if (err instanceof Anthropic.PermissionDeniedError) throw new Error('这个 API Key 没有使用该模型的权限。');
    if (err instanceof Anthropic.RateLimitError) throw new Error('请求太频繁，请稍等一下再试。');
    if (err instanceof Anthropic.APIConnectionError) throw new Error('网络连接失败，请检查网络后再试。');
    if (err instanceof Anthropic.APIError) throw new Error(`AI 服务暂时出错（${err.status ?? '未知'}）：${err.message}`);
    throw err;
  }
  if (res.stop_reason === 'refusal') throw new Error('AI 没有完成这个请求，换个说法再试试。');
  if (res.stop_reason === 'max_tokens') throw new Error('行程内容太长了，试试减少天数。');
  const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('AI 返回的内容无法读取，请再试一次。');
  }
}
