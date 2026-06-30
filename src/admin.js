// ===== ADMIN OVERVIEW =====
let _adminPairs = [];

function renderAdmin() {
  const cfg = getConfig();
  _adminPairs = cfg.pairs.filter(p => p.consultant || p.speaker)
    .sort((a, b) => {
      // 按簡報日期升序（早到晚），未填日期排最後
      const da = a.presentationTime || '9999/99/99';
      const db = b.presentationTime || '9999/99/99';
      return da.localeCompare(db);
    });

  if (_adminPairs.length === 0) {
    document.getElementById('mainContent').innerHTML = '<div class="card"><p style="color:#888;">尚未設定任何配對，請至設定頁面新增。</p></div>';
    return;
  }

  let html = '<div class="admin-grid">';
  _adminPairs.forEach((p, pi) => {
    const act = p.activityType || '主題簡報';
    const data = getData(p.consultant, p.speaker);
    const { total, done } = calcProgress(act, data);
    const pct = total ? Math.round(done / total * 100) : 0;
    const locked = isPairLocked(p);
    const dispColor = getDisplayColor(act, locked);
    const done100 = pct === 100;

    const weekDots = isSimpleType(act)
      ? `<div style="font-size:10px;color:${dispColor};font-weight:600;">${done}/${total} 完成</div>`
      : `<div style="display:flex;gap:3px;flex-wrap:wrap;">
          ${WEEKS.map((w, wi) => {
            const wD = w.tasks.filter((_, ti) => data[taskKey(wi, ti)]).length;
            const full = wD === w.tasks.length;
            const part = wD > 0 && !full;
            const bg = full ? dispColor : part ? dispColor + '55' : '#e8e8e8';
            return `<span style="width:9px;height:9px;border-radius:50%;background:${bg};display:inline-block;" title="${w.label}（${wD}/${w.tasks.length}）"></span>`;
          }).join('')}
        </div>`;

    const { countdown } = getPresentationInfo(p.presentationTime);
    const cdText = countdown !== null
      ? countdown > 0 ? `${countdown}天後`
        : countdown === 0 ? '今天！'
        : `已過${Math.abs(countdown)}天`
      : '';

    html += `
      <div class="admin-sq-card" id="sqCard_${pi}" onclick="openAdminModal(${pi})"
        style="${done100 ? `border:2px solid ${dispColor};` : ''}">
        <div>
          <div style="font-size:10px;font-weight:700;letter-spacing:0.3px;color:${dispColor};margin-bottom:4px;">${act}${p.presentationCount ? ' · ' + p.presentationCount : ''}</div>
          <div style="font-size:14px;font-weight:700;color:#222;line-height:1.3;">${p.speaker || '—'}</div>
          <div style="font-size:11px;color:#aaa;margin-top:2px;">顧問 ${p.consultant || '—'}</div>
          ${p.presentationTime ? `<div style="font-size:11px;color:#888;margin-top:3px;">${p.presentationTime}</div>` : ''}
        </div>
        <div>
          ${weekDots}
          <div class="admin-sq-bar" style="margin-top:8px;"><div class="admin-sq-bar-fill" style="width:${pct}%;background:${dispColor};"></div></div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:5px;">
            <div style="font-size:20px;font-weight:900;color:${dispColor};line-height:1;">${pct}%</div>
            ${cdText ? `<div style="font-size:10px;color:#bbb;">${cdText}</div>` : ''}
          </div>
        </div>
      </div>`;
  });
  html += '</div>';
  document.getElementById('mainContent').innerHTML =
    `<div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:12px;">
       <button class="btn btn-sm" onclick="showImageReminder()">周提醒/圖</button>
       <button class="btn btn-sm" onclick="showReminders()">周提醒/文</button>
       <button class="btn btn-sm" onclick="showUsageModal()">使用率</button>
     </div>` + html;
  _prefetchUsageLogs();
}

let _usageLogCache = null;
let _usageLogCacheTime = 0;
const USAGE_CACHE_TTL = 60000;

async function _prefetchUsageLogs() {
  if (_usageLogCache && (Date.now() - _usageLogCacheTime) < USAGE_CACHE_TTL) return;
  try {
    const res = await fetch(`${API_URL}?action=getLogs`);
    const json = await res.json();
    _usageLogCache = json.data || [];
    _usageLogCacheTime = Date.now();
  } catch { _usageLogCache = null; }
}

function svgCircle(count, max, color, label) {
  const r = 22, cx = 28, cy = 28, sw = 5;
  const circ = 2 * Math.PI * r;
  const fill = Math.min(count / max, 1) * circ;
  const centerText = label
    ? `<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="10" font-weight="800" fill="${color}">${label}</text>`
    : `<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="12" font-weight="800" fill="${color}">${Number.isInteger(count) ? count : count.toFixed(1)}</text>`;
  return `<svg width="56" height="56" viewBox="0 0 56 56">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#ebebeb" stroke-width="${sw}"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}"
      stroke-dasharray="${fill.toFixed(1)} ${circ.toFixed(1)}"
      stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>
    ${centerText}
  </svg>`;
}

const USAGE_MAX = 12;
const usageColor = avg => avg < 6 ? '#e74c3c' : avg <= 12 ? '#f39c12' : '#27ae60';
const usageLabel = avg => avg < 6 ? '危險' : avg <= 12 ? '一般' : '活躍';

function calcDailyAvg(d) {
  const ts = d.timestamps || [];
  if (!ts.length) return 0;
  const oldest = ts.reduce((min, t) => t < min ? t : min, ts[0]);
  const days = Math.max(1, Math.ceil((Date.now() - new Date(oldest)) / 864e5));
  return Math.round(ts.length / days * 100) / 100;
}

function fmtLastTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso), now = new Date();
  const hh = String(d.getHours()).padStart(2,'0'), mm = String(d.getMinutes()).padStart(2,'0');
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((startOfToday - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
  if (diffDays === 0) return `今天 ${hh}:${mm}`;
  if (diffDays === 1) return `昨天 ${hh}:${mm}`;
  if (diffDays === 2) return `前天 ${hh}:${mm}`;
  const yyyy = d.getFullYear(), mo = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0');
  return `${yyyy}/${mo}/${dd}`;
}

function fmtPeakHour(h) {
  if (h == null) return '—';
  if (h >= 6 && h < 12) return `早上 ${h} 點`;
  if (h >= 12 && h < 14) return `中午 ${h} 點`;
  if (h >= 14 && h < 18) return `下午 ${h - 12} 點`;
  if (h >= 18) return `晚上 ${h - 12} 點`;
  return `凌晨 ${h} 點`;
}

let _usageAllData = [];
let _usageGroups = { '顧問': [], '講者': [] };

function _speakerInWindow(pair) {
  if (!pair?.presentationTime) return false;
  const parts = pair.presentationTime.split('/');
  if (parts.length < 3) return false;
  const presDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const presMonday = new Date(presDate);
  presMonday.setDate(presDate.getDate() - ((presDate.getDay() + 6) % 7));
  const todayMonday = new Date(today);
  todayMonday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return Math.round((presMonday - todayMonday) / (7 * 864e5)) <= 5;
}

async function showUsageModal(forceRefresh) {
  const body = document.getElementById('usageModalBody');
  document.getElementById('usageModal').classList.add('open');
  document.body.style.overflow = 'hidden';

  const isFresh = _usageLogCache && (Date.now() - _usageLogCacheTime) < USAGE_CACHE_TTL && !forceRefresh;
  if (!isFresh) body.innerHTML = '<div style="text-align:center;padding:24px;color:#aaa;">載入中...</div>';

  try {
    let data;
    if (isFresh) {
      data = _usageLogCache;
    } else {
      const res = await fetch(`${API_URL}?action=getLogs`);
      const json = await res.json();
      data = json.data || [];
      _usageLogCache = data;
      _usageLogCacheTime = Date.now();
    }

    const logMap = Object.fromEntries(data.map(d => [d.name, d]));
    const consultantSet = new Set(_adminPairs.map(p => p.consultant).filter(Boolean));
    const speakerPairs = _adminPairs.filter(p => p.speaker && _speakerInWindow(p));
    const speakerSet = new Set(speakerPairs.map(p => p.speaker));

    function makeEntry(name, label) {
      const d = logMap[name] || {};
      const avg = calcDailyAvg(d);
      return { name, label, avg, color: usageColor(avg), actLabel: usageLabel(avg), last: fmtLastTime(d.lastTime), events: d.events || {}, timestamps: d.timestamps || [], lastTime: d.lastTime, peakHour: d.peakHour };
    }

    const consultants = [...consultantSet].map(n => makeEntry(n, '顧問')).sort((a, b) => b.avg - a.avg);
    const speakers = [...speakerSet].map(n => makeEntry(n, '講者')).sort((a, b) => b.avg - a.avg);

    _usageAllData = [...consultants, ...speakers];
    _usageGroups = { '顧問': consultants, '講者': speakers };

    if (_usageAllData.length === 0) {
      body.innerHTML = '<div style="padding:24px;color:#aaa;text-align:center;">無配對資料</div>';
      return;
    }
    renderUsageList();
  } catch {
    body.innerHTML = '<div style="padding:24px;color:#e74c3c;text-align:center;">載入失敗，請稍後再試</div>';
  }
}

let _usageActiveTab = '顧問';

function renderUsageList(tab) {
  if (tab) _usageActiveTab = tab;
  const body = document.getElementById('usageModalBody');
  const groupKeys = ['顧問', '講者'];

  const tabs = groupKeys.map(label => {
    const count = (_usageGroups[label] || []).length;
    const active = _usageActiveTab === label;
    return `<button onclick="renderUsageList('${label}')"
      style="flex:1;padding:9px 0;border:none;font-size:14px;font-weight:600;cursor:pointer;
        ${active ? 'background:white;color:#c0392b;border-bottom:2px solid #c0392b;' : 'background:#f5f5f5;color:#aaa;border-bottom:2px solid transparent;'}">
      ${label}（${count}）</button>`;
  }).join('');

  const items = _usageGroups[_usageActiveTab] || [];
  const cards = items.map((d, i) => {
    const globalIdx = _usageAllData.indexOf(d);
    const barW = Math.min(d.avg / USAGE_MAX * 100, 100).toFixed(1);
    return `<div onclick="renderUsageDetail(${globalIdx})"
      style="background:white;border-radius:10px;border:1px solid #f0f0f0;padding:10px 10px 8px;cursor:pointer;
        box-shadow:0 2px 6px rgba(0,0,0,0.05);display:flex;flex-direction:column;gap:6px;"
      onmouseover="this.style.boxShadow='0 4px 14px rgba(0,0,0,0.1)';this.style.transform='translateY(-1px)'"
      onmouseout="this.style.boxShadow='0 2px 6px rgba(0,0,0,0.05)';this.style.transform=''">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div style="font-size:13px;font-weight:700;color:#222;line-height:1.3;">${d.name}</div>
        <span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:8px;background:${d.color}20;color:${d.color};white-space:nowrap;margin-left:4px;">${d.actLabel}</span>
      </div>
      <div style="font-size:10px;color:#bbb;">${d.last}</div>
      <div style="height:3px;background:#eee;border-radius:2px;">
        <div style="height:3px;border-radius:2px;background:${d.color};width:${barW}%;"></div>
      </div>
    </div>`;
  }).join('');

  body.innerHTML = `
    <div style="display:flex;border-bottom:1px solid #eee;margin:-16px -20px 12px;">${tabs}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;">
      ${cards || '<div style="grid-column:1/-1;padding:16px;text-align:center;color:#bbb;">尚無資料</div>'}
    </div>`;
}

function renderUsageDetail(idx) {
  const d = _usageAllData[idx];
  if (!d) return;
  const avg = d.avg;
  const color = usageColor(avg);
  const ev = d.events || {};

  const evRows = [
    { label: '登入',     key: 'login' },
    { label: '展開週次', key: 'week_open' },
    { label: '勾選任務', key: 'task_check' },
    { label: '填寫備註', key: 'note_save' },
    { label: '點儲存',   key: 'save_all' },
    { label: '簡報攻略', key: 'view_guide' },
    { label: '簡報案例', key: 'view_cases' },
    { label: '案例詳情', key: 'view_case_detail' },
  ].filter(r => ev[r.key] > 0).map(r => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f5f5f5;">
      <span style="font-size:13px;color:#555;">${r.label}</span>
      <span style="font-size:13px;font-weight:700;color:${color};">${ev[r.key]} 次</span>
    </div>`).join('');

  document.getElementById('usageModalBody').innerHTML = `
    <button onclick="renderUsageList()"
      style="background:none;border:none;color:#c0392b;font-size:13px;cursor:pointer;padding:0;margin-bottom:16px;">← 返回</button>
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
      ${svgCircle(avg, USAGE_MAX, color, usageLabel(avg))}
      <div>
        <div style="font-size:18px;font-weight:700;color:#222;">${d.name}</div>
        <div style="font-size:12px;color:#aaa;margin-top:2px;">${d.label}</div>
        <div style="font-size:13px;font-weight:700;color:${color};margin-top:4px;">${usageLabel(avg)}・${avg} 次/天</div>
      </div>
    </div>
    <div style="background:#fafafa;border-radius:10px;padding:12px 14px;margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span style="font-size:12px;color:#aaa;">最後活躍</span>
        <span style="font-size:12px;font-weight:600;color:#333;">${fmtLastTime(d.lastTime)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span style="font-size:12px;color:#aaa;">常用時段</span>
        <span style="font-size:12px;font-weight:600;color:#333;">${fmtPeakHour(d.peakHour)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span style="font-size:12px;color:#aaa;">總操作次數</span>
        <span style="font-size:12px;font-weight:600;color:#333;">${(d.timestamps || []).length} 次</span>
      </div>
    </div>
    <div style="font-size:11px;font-weight:700;color:#aaa;letter-spacing:1px;margin-bottom:8px;">本月操作明細</div>
    ${evRows || '<div style="font-size:13px;color:#bbb;padding:8px 0;">本月尚無操作紀錄</div>'}`;
}

function closeUsageModal() {
  document.getElementById('usageModal').classList.remove('open');
  document.body.style.overflow = '';
}

function openAdminModal(pi) {
  const p = _adminPairs[pi];
  if (!p) return;
  const pairId = `${p.consultant}\t${p.speaker}`;
  _viewingCk = p.consultant;
  _viewingSpeaker = p.speaker;
  const act = p.activityType || '主題簡報';
  const dispColor = getDisplayColor(act, isPairLocked(p));
  const data = getData(p.consultant, p.speaker);
  const { total, done } = calcProgress(act, data);
  const pct = total ? Math.round(done / total * 100) : 0;
  const dates = [
    isSimpleType(act) && p.submitDate1 ? `${DATE_LABELS[0]}：${p.submitDate1}` : '',
    isSimpleType(act) && p.submitDate2 ? `${DATE_LABELS[1]}：${p.submitDate2}` : '',
    p.presentationTime ? `${DATE_LABELS[2]}：${p.presentationTime}` : '',
  ].filter(Boolean).join('　');

  const detail = isSimpleType(act)
    ? renderSimpleReadonly(p.consultant, p.speaker, dispColor, act)
    : renderWeeksReadonly(p.consultant, p.speaker, dispColor);
  const detailInner = hasSlides(act)
    ? `<div style="display:flex;gap:0;border-bottom:2px solid #f0f0f0;margin-bottom:14px;">
         <button id="adt_${pi}_p" onclick="adminTab(${pi},'p','${dispColor}')"
           style="padding:8px 16px;border:none;background:none;font-size:13px;cursor:pointer;font-weight:bold;color:${dispColor};border-bottom:2px solid ${dispColor};margin-bottom:-2px;">進度</button>
         <button id="adt_${pi}_s" onclick="adminTab(${pi},'s','${dispColor}')"
           style="padding:8px 16px;border:none;background:none;font-size:13px;cursor:pointer;color:#aaa;border-bottom:2px solid transparent;margin-bottom:-2px;">簡報內容</button>
       </div>
       <div id="adp_${pi}_p">${detail}</div>
       <div id="adp_${pi}_s" style="display:none;">${renderSlidesTab(p.consultant, p.speaker, p, false)}</div>`
    : detail;

  document.getElementById('adminModalHead').innerHTML = `
    <div style="flex:1;">
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
        <span style="font-size:17px;font-weight:700;color:#222;">${p.speaker || '—'}</span>
        ${activityBadge(act, dispColor)}${countBadge(p, dispColor)}
      </div>
      <div style="font-size:12px;color:#aaa;margin-top:3px;">顧問：${p.consultant || '—'}</div>
      ${dates ? `<div style="font-size:12px;color:#888;margin-top:4px;">${dates}</div>` : ''}
      ${countdownHtml(p.presentationTime, act, dispColor)}
      <div style="display:flex;align-items:center;gap:8px;margin-top:10px;">
        <div style="flex:1;background:#eee;border-radius:4px;height:6px;"><div style="width:${pct}%;background:${dispColor};height:6px;border-radius:4px;"></div></div>
        <span style="font-size:13px;font-weight:700;color:${dispColor};">${pct}%</span>
      </div>
    </div>
    <button class="modal-close-btn" onclick="closeAdminModal()">✕</button>
  `;
  document.getElementById('adminModalBody').innerHTML = detailInner;
  document.getElementById('adminDetailModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeAdminModal() {
  document.getElementById('adminDetailModal').classList.remove('open');
  document.body.style.overflow = '';
}

function adminTab(pi, tab, color) {
  ['p','s'].forEach(t => {
    const panel = document.getElementById(`adp_${pi}_${t}`);
    const btn = document.getElementById(`adt_${pi}_${t}`);
    if (!panel || !btn) return;
    const active = t === tab;
    panel.style.display = active ? '' : 'none';
    btn.style.color = active ? color : '#aaa';
    btn.style.fontWeight = active ? 'bold' : 'normal';
    btn.style.borderBottom = active ? `2px solid ${color}` : '2px solid transparent';
    btn.style.marginBottom = '-2px';
  });
}

function renderSimpleReadonly(ck, speaker, color, act) {
  const c = color || '#c0392b';
  const data = getData(ck, speaker);
  const rows = visibleSimpleTaskIndices(act).map(ti => {
    const t = SIMPLE_TASKS[ti];
    const checked = !!data[simpleTaskKey(ti)];
    const note = data[simpleNoteKey(ti)] || '';
    return `<div style="display:flex;gap:8px;align-items:flex-start;padding:5px 0;border-bottom:1px solid #f5f5f5;">
      <input type="checkbox" disabled ${checked?'checked':''} style="accent-color:${c};margin-top:3px;flex-shrink:0;">
      <div>
        <span style="font-size:13px;${checked?'color:#aaa;text-decoration:line-through;':'color:#333;'}">${t}</span>
        ${note?`<div style="font-size:11px;color:#888;margin-top:2px;padding-left:2px;">${note}</div>`:''}
      </div>
    </div>`;
  }).join('');
  return `<div>${rows}</div>`;
}

function renderWeeksReadonly(ck, speaker, color) {
  const c = color || '#c0392b';
  const data = getData(ck, speaker);
  return WEEKS.map((w, wi) => {
    const wD = w.tasks.filter((_,ti) => data[taskKey(wi,ti)]).length;
    const allDone = wD === w.tasks.length;
    const rows = w.tasks.map((t, ti) => {
      const checked = !!data[taskKey(wi,ti)];
      const note = data[noteKey(wi,ti)] || '';
      return `<div style="display:flex;gap:8px;align-items:flex-start;padding:4px 0;border-bottom:1px solid #f5f5f5;">
        <input type="checkbox" disabled ${checked?'checked':''} style="accent-color:${c};margin-top:3px;flex-shrink:0;">
        <div>
          <span style="font-size:13px;${checked?'color:#aaa;text-decoration:line-through;':'color:#333;'}">${t}</span>
          ${note?`<div style="font-size:11px;color:#888;margin-top:1px;">${note}</div>`:''}
        </div>
      </div>`;
    }).join('');
    return `<div style="margin-bottom:6px;border:1px solid #f0f0f0;border-radius:8px;overflow:hidden;">
      <div onclick="toggleReadonlyWeek(this)"
        style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;cursor:pointer;background:${allDone?c+'18':'#fafafa'};">
        <span style="font-size:13px;font-weight:bold;color:${allDone?c:'#555'};">${w.label}｜${w.theme}</span>
        <span style="font-size:12px;padding:2px 8px;border-radius:10px;background:${allDone?c:'#eee'};color:${allDone?'white':'#888'};">${wD}/${w.tasks.length}</span>
      </div>
      <div style="display:none;padding:6px 12px 8px;">${rows}</div>
    </div>`;
  }).join('');
}

function toggleReadonlyWeek(el) {
  const body = el.nextElementSibling;
  body.style.display = body.style.display === 'none' ? '' : 'none';
}

