// Tool registry: what shows up in 全部工具 / 收藏 / search, and which module renders it.

export const CATS = ['计算 · 换算', '生活', '出行', '设备'];

export const TOOLS = [
  { id: 'calc', name: '计算器', icon: 'calc', cat: '计算 · 换算', mod: 'calc', keys: 'jisuan calculator sst' },
  { id: 'convert', name: '单位换算', icon: 'convert', cat: '计算 · 换算', mod: 'convert', keys: '长度 重量 温度 面积 斤 英尺 unit' },
  { id: 'fx', name: '汇率', icon: 'coins', cat: '计算 · 换算', mod: 'fx', keys: '货币 新币 美元 人民币 currency myr' },
  { id: 'split', name: 'AA 分账', icon: 'split', cat: '计算 · 换算', mod: 'split', keys: '分账 sst 服务费 bill' },
  { id: 'discount', name: '折扣计算', icon: 'tag', cat: '计算 · 换算', mod: 'money', fn: 'discount', keys: '打折 sale' },
  { id: 'loan', name: '贷款计算', icon: 'house', cat: '计算 · 换算', mod: 'money', fn: 'loan', keys: '房贷 车贷 月供 loan' },
  { id: 'countdown', name: '倒数日', icon: 'calendar', cat: '生活', mod: 'countdown', keys: '假期 公共假期 纪念日 holiday' },
  { id: 'expense', name: '记账', icon: 'wallet', cat: '生活', mod: 'expense', keys: '支出 预算 花费' },
  { id: 'todo', name: '待办清单', icon: 'todo', cat: '生活', mod: 'life', fn: 'todo', keys: '待办 清单 todo' },
  { id: 'random', name: '随机决定', icon: 'dice', cat: '生活', mod: 'life', fn: 'random', keys: '吃什么 抛硬币 random' },
  { id: 'trip', name: 'AI 行程', icon: 'sparkle', cat: '出行', mod: 'trip', keys: '旅行 行程 规划 ai trip' },
  { id: 'fuel', name: '油费计算', icon: 'fuel', cat: '出行', mod: 'money', fn: 'fuel', keys: '油钱 ron95 petrol' },
  { id: 'parking', name: '停车计时', icon: 'parking', cat: '出行', mod: 'life', fn: 'parking', keys: '停车 parking' },
  { id: 'clock', name: '世界时钟', icon: 'globe', cat: '出行', mod: 'life', fn: 'clock', keys: '时区 时间 time' },
  { id: 'compass', name: '指南针', icon: 'compass', cat: '出行', mod: 'sensors', fn: 'compass', keys: '方向 kiblat' },
  { id: 'scan', name: '扫一扫', icon: 'scan', cat: '设备', mod: 'scan', keys: '二维码 qr wifi' },
  { id: 'torch', name: '补光灯', icon: 'torch', cat: '设备', mod: 'sensors', fn: 'torch', keys: '手电筒 灯 light' },
  { id: 'level', name: '水平仪', icon: 'level', cat: '设备', mod: 'sensors', fn: 'level', keys: '水平 level' },
  { id: 'ruler', name: '尺子', icon: 'ruler', cat: '设备', soon: true, keys: '量 cm ruler' },
];

export const toolById = (id) => TOOLS.find((t) => t.id === id);
export const LIVE_COUNT = TOOLS.length;
