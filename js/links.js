// Outbound links for trips: maps for places, Trip.com for flights and hotels.

export const gmapsUrl = (q) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
export const wazeUrl = (q) => 'https://waze.com/ul?q=' + encodeURIComponent(q) + '&navigate=yes';

// Trip.com hotel search needs its own numeric city id; a plain city name finds nothing.
// Ids looked up on trip.com (October 2026). Short aliases only match exactly.
const TRIP_CITIES = [
  [35926, ['george town', 'georgetown', 'penang', 'pulau pinang', '槟城', '乔治市', '槟岛', '槟榔屿']],
  [62, ['melaka', 'malacca', '马六甲']],
  [315, ['kuala lumpur', 'kl', '吉隆坡']],
  [1375, ['ipoh', '怡保']],
  [35902, ['cameron highlands', 'cameron', '金马伦', '金马仑']],
  [1225, ['langkawi', '兰卡威', '浮罗交怡']],
  [1376, ['johor bahru', 'jb', '新山']],
  [64, ['genting highlands', 'genting', '云顶']],
  [1393, ['kota kinabalu', 'kk', '亚庇', '哥打京那巴鲁']],
  [1384, ['kuching', '古晋']],
  [3916, ['port dickson', 'pd', '波德申']],
  [1249, ['kuantan', '关丹']],
  [72, ['kuala terengganu', 'terengganu', '瓜拉登嘉楼', '登嘉楼']],
  [1374, ['alor setar', 'alor star', '亚罗士打']],
  [35876, ['seremban', '芙蓉']],
  [88738, ['sekinchan', '适耕庄']],
  [35940, ['taiping', '太平']],
  [1377, ['kota bharu', '哥打巴鲁']],
  [1382, ['sandakan', '山打根']],
  [3380, ['miri', '美里']],
  [35892, ['bukit tinggi', '武吉丁宜']],
  [1818, ['tioman', '刁曼岛']],
  [1710, ['redang', '热浪岛']],
  [73, ['singapore', '新加坡']],
  [359, ['bangkok', '曼谷']],
  [725, ['phuket', '普吉']],
  [1480, ['hat yai', '合艾']],
  [623, ['chiang mai', '清迈']],
  [1405, ['krabi', '甲米']],
  [622, ['pattaya', '芭提雅']],
  [723, ['bali', '巴厘岛', '峇厘岛']],
  [524, ['jakarta', '雅加达']],
  [740, ['bandung', '万隆']],
  [228, ['tokyo', '东京']],
  [219, ['osaka', '大阪']],
  [734, ['kyoto', '京都']],
  [641, ['sapporo', 'hokkaido', '札幌', '北海道']],
  [274, ['seoul', '首尔']],
  [253, ['busan', '釜山']],
  [737, ['jeju', '济州']],
  [617, ['taipei', '台北']],
  [58, ['hong kong', '香港']],
  [59, ['macau', 'macao', '澳门']],
  [2, ['shanghai', '上海']],
  [1, ['beijing', '北京']],
  [32, ['guangzhou', '广州']],
  [30, ['shenzhen', '深圳']],
  [25, ['xiamen', '厦门']],
  [301, ['ho chi minh', 'saigon', '胡志明', '西贡']],
  [286, ['hanoi', '河内']],
  [1356, ['da nang', 'danang', '岘港']],
  [364, ['manila', '马尼拉']],
  [1239, ['cebu', '宿务']],
  [501, ['sydney', '悉尼']],
  [358, ['melbourne', '墨尔本']],
  [681, ['perth', '珀斯']],
  [338, ['london', '伦敦']],
  [192, ['paris', '巴黎']],
  [220, ['dubai', '迪拜']],
];

export function tripCityId(...names) {
  for (const raw of names) {
    const name = String(raw || '').trim().toLowerCase();
    if (!name) continue;
    for (const [id, aliases] of TRIP_CITIES) {
      if (aliases.some((a) => (a.length <= 3 ? name === a : name.includes(a)))) return id;
    }
  }
  return null;
}

// IATA codes for common departure cities (used by the built-in sample trips).
const IATA = [
  ['KUL', ['吉隆坡', 'kuala lumpur', 'kl', '雪兰莪', 'selangor', '八打灵', 'petaling', '梳邦', 'subang', '莎阿南', 'shah alam', '巴生', 'klang', '加影', 'kajang', '布城', 'putrajaya']],
  ['JHB', ['新山', 'johor', 'jb']], ['PEN', ['槟城', 'penang', '乔治市']], ['BKI', ['亚庇', 'kota kinabalu', 'kk']],
  ['KCH', ['古晋', 'kuching']], ['IPH', ['怡保', 'ipoh']], ['LGK', ['兰卡威', 'langkawi']], ['KUA', ['关丹', 'kuantan']],
  ['TGG', ['登嘉楼', 'terengganu']], ['KBR', ['哥打巴鲁', 'kota bharu']], ['AOR', ['亚罗士打', 'alor setar']],
  ['MYY', ['美里', 'miri']], ['SDK', ['山打根', 'sandakan']], ['SBW', ['诗巫', 'sibu']], ['MKZ', ['马六甲', 'melaka', 'malacca']], ['SIN', ['新加坡', 'singapore']],
];
export function iataOf(city) {
  const name = String(city || '').trim().toLowerCase();
  if (!name) return '';
  const hit = IATA.find(([, aliases]) => aliases.some((a) => (a.length <= 3 ? name === a : name.includes(a))));
  return hit ? hit[0] : '';
}

// Round trip when `ret` is given. Airport/city codes are IATA, e.g. KUL → PEN.
export function tripFlightUrl({ from, to, depart, ret, people }) {
  const p = new URLSearchParams({
    dcity: from.toLowerCase(), acity: to.toLowerCase(), ddate: depart,
    triptype: ret ? 'rt' : 'ow', class: 'y', quantity: String(people || 1), locale: 'en-MY', curr: 'MYR',
  });
  if (ret) p.set('rdate', ret);
  return 'https://www.trip.com/flights/showfarefirst?' + p.toString();
}

// Returns { url, exact }: exact is false when the city id is unknown and Trip.com
// will only pre-fill the search box (the user then picks the city from its list).
export function tripHotelUrl({ city, dest, checkin, checkout, adults }) {
  const id = tripCityId(city, dest);
  const p = new URLSearchParams({
    checkin, checkout, crn: String(Math.max(1, Math.ceil((adults || 1) / 2))), adult: String(adults || 1), curr: 'MYR', locale: 'en-MY',
  });
  if (id) p.set('cityId', String(id));
  else p.set('searchWord', city || dest || '');
  return { url: 'https://www.trip.com/hotels/list?' + p.toString(), exact: !!id };
}
