// Shared data: Malaysian public holidays, exchange rates, expenses.
import { store, today, parseDay, daysBetween } from './lib.js';

// ---------- Malaysian public holidays ----------
// est: Islamic-calendar dates, confirmed by official announcement closer to the day.
// note: holidays observed only in some states.
export const HOLIDAYS = [
  { date: '2026-11-08', name: '屠妖节', en: 'Deepavali' },
  { date: '2026-12-25', name: '圣诞节', en: 'Christmas' },
  { date: '2027-01-01', name: '元旦', en: 'New Year', note: '部分州属' },
  { date: '2027-01-22', name: '大宝森节', en: 'Thaipusam', note: '部分州属' },
  { date: '2027-02-06', name: '农历新年', en: 'Chinese New Year', note: '初一、初二' },
  { date: '2027-03-10', name: '开斋节', en: 'Hari Raya Aidilfitri', est: true },
  { date: '2027-05-01', name: '劳动节', en: 'Labour Day' },
  { date: '2027-05-17', name: '哈芝节', en: 'Hari Raya Haji', est: true },
  { date: '2027-06-07', name: '最高元首诞辰', en: 'Agong’s Birthday' },
  { date: '2027-08-31', name: '国庆日', en: 'Hari Merdeka' },
  { date: '2027-09-16', name: '马来西亚日', en: 'Malaysia Day' },
  { date: '2027-12-25', name: '圣诞节', en: 'Christmas' },
];

export function upcomingHolidays(from = today()) {
  return HOLIDAYS.map((h) => ({ ...h, day: parseDay(h.date), days: daysBetween(from, parseDay(h.date)) }))
    .filter((h) => h.days >= 0);
}
export const nextHoliday = (from) => upcomingHolidays(from)[0] || null;

// ---------- exchange rates (base MYR) ----------
export const CURRENCIES = {
  MYR: ['马来西亚令吉', 'RM'], SGD: ['新加坡元', 'S$'], USD: ['美元', 'US$'], CNY: ['人民币', '¥'],
  THB: ['泰铢', '฿'], IDR: ['印尼盾', 'Rp'], JPY: ['日元', '¥'], KRW: ['韩元', '₩'], HKD: ['港币', 'HK$'],
  TWD: ['新台币', 'NT$'], EUR: ['欧元', '€'], GBP: ['英镑', '£'], AUD: ['澳元', 'A$'], PHP: ['菲律宾比索', '₱'],
  VND: ['越南盾', '₫'], INR: ['印度卢比', '₹'], BND: ['文莱元', 'B$'], NZD: ['纽西兰元', 'NZ$'],
};

// Offline reference values (MYR base), mid-market on 2026-10-12.
const OFFLINE_RATES = {
  rates: { MYR: 1, SGD: 0.31347, USD: 0.24486, CNY: 1.6388, THB: 8.231 },
  updated: Date.UTC(2026, 9, 12),
  source: '离线参考',
  sample: true,
};

export const cachedRates = () => store.get('rates', null);

export async function getRates({ force = false } = {}) {
  const cached = cachedRates();
  if (!force && cached && Date.now() - cached.fetched < 6 * 3600 * 1000) return cached;
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/MYR', { cache: 'no-store' });
    const j = await res.json();
    if (j.result === 'success' && j.rates) {
      const v = { rates: j.rates, updated: j.time_last_update_unix * 1000, fetched: Date.now(), source: 'ExchangeRate-API' };
      store.set('rates', v);
      return v;
    }
  } catch { /* try the next source */ }
  try {
    const res = await fetch('https://api.frankfurter.dev/v1/latest?base=MYR', { cache: 'no-store' });
    const j = await res.json();
    if (j.rates) {
      const v = { rates: { ...j.rates, MYR: 1 }, updated: new Date(j.date + 'T16:00:00Z').getTime(), fetched: Date.now(), source: 'Frankfurter (ECB)' };
      store.set('rates', v);
      return v;
    }
  } catch { /* offline */ }
  return cached || OFFLINE_RATES;
}

// ---------- expenses ----------
export const EXP_CATS = {
  food: { name: '餐饮', icon: 'food' },
  ride: { name: '交通', icon: 'car' },
  shop: { name: '购物', icon: 'bag' },
  bill: { name: '账单', icon: 'receipt' },
  fun: { name: '娱乐', icon: 'film' },
  other: { name: '其他', icon: 'more' },
};
export const CAT_COLORS = {
  food: 'var(--ink)', shop: 'var(--accent)', ride: 'var(--faint)', bill: 'var(--surface-3)', fun: 'var(--muted)', other: '#C9A227',
};
export const loadExpenses = () => store.get('expenses', []);
export const saveExpenses = (list) => store.set('expenses', list);
export const getBudget = () => store.get('budget', 2000);

export function monthItems(list, y, m) {
  return list.filter((e) => {
    const d = parseDay(e.date);
    return d.getFullYear() === y && d.getMonth() === m;
  });
}
export function monthTotal(y, m) {
  return monthItems(loadExpenses(), y, m).reduce((s, e) => s + Number(e.amount || 0), 0);
}
