// ===== API =====
const API_URL = 'https://script.google.com/macros/s/AKfycbzBdCa_GQlxwxXa4LHsYSlhDlEXI6xoJQfRgJXL3uepbgcz4V-R9Oxrx7dAQvDJ4wiZ/exec';
const LS_KEY = 'bni_cache_v1';
const LS_TIME_KEY = 'bni_cache_time_v1';
const BG_REFRESH_TTL = 120000; // cache 2 分鐘內不重打 API

let cache = {};

// 頁面載入：從 localStorage 還原（毫秒級）
try { const s = localStorage.getItem(LS_KEY); if (s) cache = JSON.parse(s); } catch {}

// 比較基準：記錄上次 doRefresh 後的狀態，_bgRefresh 不動它
// 跨帳號切換時，比對基準依舊是「上次看過的資料」
let _refreshBaseline = JSON.parse(JSON.stringify(cache));

function _lsSave() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cache));
    localStorage.setItem(LS_TIME_KEY, Date.now().toString());
  } catch {}
}

// 儲存佇列：Map 以 key 去重複，只保留最新值
const _saveQueue = new Map();
let _saveRunning = false;
// 最近寫過的 key（避免 doRefresh / _bgRefresh 用 GAS 舊版覆蓋本地剛改的）
const _recentSaves = new Map();
const _SAVE_GRACE_MS = 30000;

// 背景從 server 取得最新資料（防止重複同時觸發）
let _bgRefreshing = false;
function _bgRefresh() {
  if (_bgRefreshing) return Promise.resolve();
  // 有待送出或處理中的儲存時跳過，避免 server 舊資料覆蓋本地未送出的變更
  if (_saveQueue.size > 0 || _saveRunning) return Promise.resolve();
  _bgRefreshing = true;
  return fetch(API_URL).then(r => r.json()).then(json => {
    if (json?.data) {
      // 抓資料期間若又有人 queue 新儲存，先不覆蓋
      if (_saveQueue.size > 0 || _saveRunning) return;
      cache = json.data;
      _lsSave();
    }
  }).catch(() => {}).finally(() => { _bgRefreshing = false; });
}

// 頁面載入時，只有 cache 過期才打 API
const _cacheAge = Date.now() - (parseInt(localStorage.getItem(LS_TIME_KEY) || '0'));
if (_cacheAge > BG_REFRESH_TTL) _bgRefresh();

async function _drainSaveQueue() {
  if (_saveRunning || _saveQueue.size === 0) return;
  _saveRunning = true;
  const [[key, data]] = _saveQueue;
  _saveQueue.delete(key);
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ key, data })
    });
  } catch {
    showToast('儲存失敗，請重試');
  }
  _saveRunning = false;
  _drainSaveQueue();
}

async function apiSave(key, data) {
  cache[key] = data;
  _lsSave();
  _saveQueue.set(key, data);
  _recentSaves.set(key, Date.now());
  _drainSaveQueue();
}

async function apiDelete(keys) {
  keys.forEach(k => delete cache[k]);
  _lsSave();
  fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'delete', keys }) }).catch(() => {});
}

// ===== WEEKS DATA =====
const WEEKS = [
  { label: '倒數5週', theme: '定出主題', tasks: [
    '主題簡報輔導',
    '演講題目',
    '形象照傳到簡報準備群',
    '社群貼文文案內容構想',
    '合作對象',
    '理想引薦',
    '夢幻引薦',
    '列出潛在來賓名單',
    '與主講者第一次一對一',
    '參加簡報工作坊'
  ]},
  { label: '倒數4週', theme: '邀請來賓', tasks: [
    '週二前提供EDM資訊及社群貼文文案',
    '參考公版PPT，開始製作簡報',
    '每週25秒舖陳',
    '確認來賓名單'
  ]},
  { label: '倒數3週', theme: '請求資源', tasks: [
    '確認EDM行銷海報',
    '發出行銷海報邀約來賓',
    '於群組告知適合邀約之來賓',
    '每週25秒舖陳',
    '簡報完成並與顧問第一次RE稿'
  ]},
  { label: '倒數2週', theme: '簡報演練', tasks: [
    '最終簡報RE稿',
    '邀約來賓／每週25秒舖陳'
  ]},
  { label: '倒數1週', theme: '跟進來賓', tasks: [
    '繳交最後定稿簡報',
    '確認來賓出席',
    '每週25秒舖陳'
  ]},
  { label: '當週', theme: '尊榮時刻', tasks: [
    '確認來賓出席',
    '每週25秒舖陳',
    '準備獎品',
    '當天上台前彩排'
  ]}
];

const WEEK_HINTS = [
  [ // W1 倒數5週
    '熟悉主題簡報架構、一般引薦、理想引薦、夢幻引薦',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '不強迫，但有助於簡報輔導與呈現',
    '培訓日期'
  ],
  [ // W2 倒數4週
    '週二前po在「準備群」讓EDM手跟網管組確認',
    '輔導333架構，提醒不要放動畫、影片',
    '需要被引薦的專業別',
    '分享如何邀約來賓'
  ],
  [ // W3 倒數3週
    'EDM手會於週二上傳，並請主講者確認',
    '回報來賓進度',
    '主講者於交流群告知適合邀約之來賓',
    '說明需要被引薦的專業別',
    '簡報顧問輔導簡報內容'
  ],
  [ // W4 倒數2週
    '需自行演練至5分鐘內，當週四晚上9:00與秘財RE稿',
    '回報來賓進度'
  ],
  [ // W5 倒數1週
    '星期二前在群組提供給DJ手',
    '至少3位來賓',
    '需要被引薦的專業別'
  ],
  [ // W6 當週
    '群組來賓接龍',
    '讓人期待您的主題簡報',
    '準備1份價值500元以上的獎品',
    '走位／確認簡報／簡報筆'
  ]
];

// ===== ACTIVITY TYPES =====
const ACTIVITY_TYPES = ['主題簡報', '主題日', '共識會議', 'BOD'];
const PRESENTATION_COUNTS = ['第1次', '第2次', '第2次+'];
const ACTIVITY_COLORS = { '主題簡報': '#c0392b', '主題日': '#e67e22', '共識會議': '#2980b9', 'BOD': '#8e44ad' };
const getActivityColor = act => ACTIVITY_COLORS[act || '主題簡報'] || '#c0392b';
const LOCKED_COLOR = '#aaaaaa';
const LOCK_WEEKS_THRESHOLD = 6;
const getDisplayColor = (act, locked) => locked ? LOCKED_COLOR : getActivityColor(act);
const DONE_COLOR = '#c0392b';
const SIMPLE_TASKS = ['主題名稱確認', '一般引薦確認', '理想引薦確認', '夢幻引薦確認', '簡報繳交', 'RE稿完成'];
// BOD 不需要一般 / 理想 / 夢幻引薦確認
const _BOD_HIDDEN_SIMPLE_TI = new Set([1, 2, 3]);
function visibleSimpleTaskIndices(act) {
  return SIMPLE_TASKS.map((_, ti) => ti).filter(ti => !(act === 'BOD' && _BOD_HIDDEN_SIMPLE_TI.has(ti)));
}
const DATE_LABELS = ['繳交簡報', '線上RE稿', '簡報時間'];

function simpleTaskKey(ti) { return `s_t${ti}`; }
function simpleNoteKey(ti) { return `s_t${ti}_note`; }

function activityBadge(type, color) {
  const c = color || ACTIVITY_COLORS[type] || '#888';
  return `<span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:bold;background:${c};color:white;margin-left:8px;">${type || '主題簡報'}</span>`;
}

function isSimpleType(type) { return type && type !== '主題簡報'; }

function countBadge(pair, color) {
  if (isSimpleType(pair.activityType)) return '';
  if (!pair.presentationCount) return '';
  const c = color || '#c0392b';
  return `<span style="display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;border:1px solid ${c}40;color:${c};margin-left:6px;">${pair.presentationCount}</span>`;
}

// ===== CONFIG =====
function getConfig() {
  const data = cache['__config__'];
  if (data && data.adminPassword) return data;
  return {
    adminPassword: '負責人',
    consultants: [],
    pairs: [
      { consultant: 'A', speaker: '講者A' },
      { consultant: 'B', speaker: '講者B' },
      { consultant: 'C', speaker: '講者C' },
      { consultant: 'D', speaker: '講者D' },
      { consultant: 'E', speaker: '講者E' },
      { consultant: 'F', speaker: '講者F' },
    ]
  };
}

async function saveConfig(cfg) {
  await apiSave('__config__', cfg);
}

// ===== PROGRESS DATA =====
function progressKey(ck, speaker) { return `progress_${ck}_${speaker}`; }
function getData(ck, speaker) { return cache[progressKey(ck, speaker)] || {}; }
async function saveData(ck, speaker, data) { await apiSave(progressKey(ck, speaker), data); }
function getPairByKeys(ck, speaker) { return getConfig().pairs.find(p => p.consultant === ck && p.speaker === speaker) || {}; }

function taskKey(wi, ti) { return `w${wi}_t${ti}`; }
function noteKey(wi, ti) { return `w${wi}_t${ti}_note`; }

// ===== USER MAP =====
function buildUserMap() {
  const cfg = getConfig();
  const map = {};
  map[cfg.adminPassword] = { role: 'admin' };
  const consultantSet = new Set(cfg.pairs.map(p => p.consultant).filter(Boolean));
  cfg.pairs.forEach(p => {
    if (p.consultant && !map[p.consultant])
      map[p.consultant] = { role: 'consultant', consultantKey: p.consultant };
    if (p.speaker) {
      if (consultantSet.has(p.speaker)) {
        if (!map[p.speaker]) map[p.speaker] = { role: 'both', consultantKey: p.speaker };
        map[p.speaker].role = 'both';
        map[p.speaker].speakerConsultantKey = p.consultant;
        map[p.speaker].speakerName = p.speaker;
      } else {
        map[p.speaker] = { role: 'speaker', consultantKey: p.consultant, speaker: p.speaker };
      }
    }
  });
  return map;
}

let currentUser = null;
let currentRole = null;
let currentConsultantKey = null;
let currentSpeaker = null;
let _pendingUserEntry = null;

