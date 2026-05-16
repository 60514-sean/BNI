// ===== SETTINGS PAGE =====
function toggleSection(id) {
  const el = document.getElementById(id);
  const arrow = document.getElementById(id + 'Arrow');
  if (!el) return;
  const hidden = el.style.display === 'none';
  el.style.display = hidden ? '' : 'none';
  if (arrow) arrow.textContent = hidden ? '▲' : '▼';
  // 配對段落展開時顯示浮動新增鈕
  if (id === 'pairsSection') {
    const fab = document.getElementById('fabAddPair');
    if (fab) fab.classList.toggle('visible', hidden);
  }
}

async function addConsultant() {
  const input = document.getElementById('newConsultantInput');
  const name = input?.value.trim();
  if (!name) return;
  const cfg = readFormIntoCfg();
  if (!cfg.consultants) cfg.consultants = [];
  if (cfg.consultants.includes(name)) { showToast('已存在相同名稱'); return; }
  cfg.consultants.push(name);
  cache['__config__'] = cfg;
  _lsSave();
  await saveConfig(cfg);
  while (_saveQueue.size > 0 || _saveRunning) {
    await new Promise(r => setTimeout(r, 50));
  }
  showSettings();
  const sec = document.getElementById('consultantSection');
  const arrow = document.getElementById('consultantSectionArrow');
  if (sec) { sec.style.display = ''; if (arrow) arrow.textContent = '▲'; }
  const newRow = document.getElementById(`consultantRow_${cfg.consultants.length - 1}`);
  if (newRow) { newRow.style.border = '2px solid #c0392b'; newRow.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
}

async function removeConsultant(i) {
  const cfg = readFormIntoCfg();
  if (!cfg.consultants) return;
  const name = cfg.consultants[i];
  const keys = (cfg.pairs || [])
    .filter(p => p.consultant === name && p.speaker)
    .map(p => progressKey(p.consultant, p.speaker));
  if (keys.length) apiDelete(keys);
  cfg.consultants.splice(i, 1);
  cache['__config__'] = cfg;
  _lsSave();
  await saveConfig(cfg);
  while (_saveQueue.size > 0 || _saveRunning) {
    await new Promise(r => setTimeout(r, 50));
  }
  showSettings();
  const sec = document.getElementById('consultantSection');
  const arrow = document.getElementById('consultantSectionArrow');
  if (sec) { sec.style.display = ''; if (arrow) arrow.textContent = '▲'; }
}

function showSettings() {
  document.getElementById('headerTitle').textContent = '系統設定';
  const cfg = getConfig();
  const consultants = cfg.consultants || [];

  // 依簡報時間升序排列（近的在上面，沒日期的排最後）
  cfg.pairs.sort((a, b) => {
    const da = a.presentationTime || '9999/99/99';
    const db = b.presentationTime || '9999/99/99';
    return da.localeCompare(db);
  });

  // 簡報顧問名單
  const consultantListHtml = consultants.length
    ? consultants.map((c, i) => {
        const myPairs = cfg.pairs.filter(p => p.consultant === c && p.speaker);
        const speakerTags = myPairs.map(p => {
          const color = getActivityColor(p.activityType);
          const cntBadge = (p.activityType === '主題簡報' || !p.activityType) && p.presentationCount
            ? `<span style="font-size:11px;opacity:0.75;margin-left:4px;">${p.presentationCount}</span>` : '';
          return `<span style="padding:3px 10px;border-radius:12px;font-size:12px;background:${color}18;color:${color};border:1px solid ${color}40;">${p.speaker}${cntBadge}</span>`;
        }).join('');
        return `<div id="consultantRow_${i}" style="border:1px solid #c0392b;border-radius:8px;padding:12px;margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:${myPairs.length?'8px':'0'};">
            <span style="flex:1;font-size:14px;font-weight:bold;">${c}</span>
            <span style="font-size:12px;color:#888;background:#f5f5f5;padding:2px 10px;border-radius:12px;">共 ${myPairs.length} 位</span>
            <button class="btn btn-sm btn-danger" onclick="removeConsultant(${i})">刪除</button>
          </div>
          ${myPairs.length ? `<div style="display:flex;flex-wrap:wrap;gap:6px;">${speakerTags}</div>` : ''}
        </div>`;
      }).join('')
    : '<div style="color:#bbb;font-size:13px;margin-bottom:8px;">尚未新增顧問</div>';

  // 顧問與講者配對
  let pairsHtml = cfg.pairs.map((p, i) => {
    const act = p.activityType || '主題簡報';
    const color = getActivityColor(act);
    const simple = isSimpleType(act);
    const pData = getData(p.consultant, p.speaker);
    const { total: pTotal, done: pDone } = calcProgress(act, pData);
    const isDone = pTotal > 0 && pDone === pTotal;
    const conOptions = consultants.map(c =>
      `<option value="${c}" ${p.consultant === c ? 'selected' : ''}>${c}</option>`
    ).join('');
    const conSelectOpts = `<option value="" ${p.consultant ? '' : 'selected'}>選擇顧問</option>${conOptions}` +
      (p.consultant && !consultants.includes(p.consultant) ? `<option value="${p.consultant}" selected>${p.consultant}</option>` : '');
    const conSelectHtml = `<select id="con_${i}" style="flex:1;min-width:90px;padding:6px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px;outline:none;cursor:pointer;">${conSelectOpts}</select>`;
    const cnt = p.presentationCount || '';
    const cntSelectHtml = `<select id="cnt_${i}" style="min-width:90px;padding:6px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px;outline:none;cursor:pointer;display:${act==='主題簡報'?'':'none'};">
      <option value="">選擇次數</option>
      ${PRESENTATION_COUNTS.map(c => `<option value="${c}" ${cnt===c?'selected':''}>${c}</option>`).join('')}
    </select>`;
    return `
    <div style="border:${isDone?'2px solid '+color:'1px solid '+color};border-radius:8px;padding:12px;margin-bottom:10px;" id="pairRow_${i}">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
        <select id="act_${i}" onchange="onActivityChange(${i})" style="padding:5px 8px;border:1px solid #ddd;border-radius:6px;font-size:13px;color:${color};font-weight:bold;outline:none;cursor:pointer;">
          ${ACTIVITY_TYPES.map(t => `<option value="${t}" ${act===t?'selected':''}>${t}</option>`).join('')}
        </select>
        ${conSelectHtml}
        <span style="color:#c0392b;font-weight:bold;">↔</span>
        ${cntSelectHtml}
        <input type="text" placeholder="講者姓名" value="${p.speaker||''}" id="spk_${i}" style="flex:1;min-width:90px;padding:6px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px;outline:none;" />
        <button class="btn btn-sm btn-danger" onclick="removePair(${i})">刪除</button>
      </div>
      ${makeDatePicker(i, 1, DATE_LABELS[0], p.submitDate1||'', !simple)}
      ${makeDatePicker(i, 2, DATE_LABELS[1], p.submitDate2||'', !simple)}
      ${makeDatePicker(i, 3, DATE_LABELS[2], p.presentationTime||'', false)}
    </div>`;
  }).join('');

  document.getElementById('mainContent').innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
      <button class="btn btn-sm btn-gray" onclick="renderApp()">← 回主頁</button>
    </div>
    <button id="fabAddPair" class="fab-add-pair" onclick="addPair()" title="新增配對">＋</button>
    <div class="card">
      <div class="card-title" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;" onclick="toggleSection('adminPwSection')">
        <span>負責人登入密碼</span><span id="adminPwSectionArrow">▼</span>
      </div>
      <div id="adminPwSection" style="display:none;">
        <div class="settings-section">
          <div class="admin-pw-row">
            <input type="text" id="adminPw" value="${cfg.adminPassword}" placeholder="負責人姓名／密碼" />
          </div>
          <p class="hint">負責人用這個名稱登入系統</p>
        </div>
        <div style="margin-top:12px;">
          <button class="btn btn-sm" onclick="saveSettings()">儲存設定</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;" onclick="toggleSection('consultantSection')">
        <span>簡報顧問名單</span><span id="consultantSectionArrow">▼</span>
      </div>
      <div id="consultantSection" style="display:none;">
        <div class="settings-section">
          ${consultantListHtml}
          <div style="display:flex;gap:8px;margin-top:8px;">
            <input type="text" id="newConsultantInput" placeholder="輸入顧問姓名" style="flex:1;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;outline:none;" onkeydown="if(event.key==='Enter')addConsultant()" />
            <button class="btn btn-sm btn-green" onclick="addConsultant()">新增</button>
          </div>
        </div>
        <div style="margin-top:12px;">
          <button class="btn btn-sm" onclick="saveSettings()">儲存設定</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;" onclick="toggleSection('pairsSection')">
        <span>顧問與講者配對</span><span id="pairsSectionArrow">▼</span>
      </div>
      <div id="pairsSection" style="display:none;">
        <div class="settings-section">
          <p class="hint" style="margin-bottom:12px;">左側選擇顧問，右側輸入講者姓名，姓名即為登入密碼</p>
          <div id="pairsContainer">${pairsHtml}</div>
        </div>
        <div style="margin-top:12px;">
          <button class="btn btn-sm" onclick="saveSettings()">儲存設定</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;" onclick="toggleSection('casesSettingSection')">
        <span>簡報案例管理</span><span id="casesSettingSectionArrow">▼</span>
      </div>
      <div id="casesSettingSection" style="display:none;">
        <div id="casesSection">${showCasesSettings()}</div>
      </div>
    </div>

    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <button class="btn btn-sm" onclick="saveSettings()">儲存設定</button>
      <button class="btn btn-sm btn-gray" onclick="renderApp()">取消</button>
    </div>
  `;

}

function readFormIntoCfg() {
  const cfg = getConfig();
  cfg.adminPassword = document.getElementById('adminPw')?.value.trim() || cfg.adminPassword;
  // sync YMD selects to hidden inputs before reading
  cfg.pairs.forEach((_, i) => { syncYMD(i, 1); syncYMD(i, 2); });
  cfg.pairs = cfg.pairs.map((_, i) => {
    const act = document.getElementById(`act_${i}`)?.value || '主題簡報';
    const simple = isSimpleType(act);
    return {
      activityType: act,
      consultant: document.getElementById(`con_${i}`)?.value.trim() || '',
      speaker: document.getElementById(`spk_${i}`)?.value.trim() || '',
      submitDate1: simple ? (document.getElementById(`time1_${i}`)?.value.trim() || '') : '',
      submitDate2: simple ? (document.getElementById(`time2_${i}`)?.value.trim() || '') : '',
      presentationTime: document.getElementById(`time3_${i}`)?.value.trim() || '',
      presentationCount: document.getElementById(`cnt_${i}`)?.value || '',
    };
  });
  return cfg;
}

async function addPair() {
  const cfg = readFormIntoCfg();
  cfg.pairs.push({ activityType: '主題簡報', consultant: '', speaker: '' });
  cache['__config__'] = cfg;
  _lsSave();
  // 立即 push 到 GAS 並等完成，避免連按 + 時 race condition 造成資料覆蓋
  await saveConfig(cfg);
  while (_saveQueue.size > 0 || _saveRunning) {
    await new Promise(r => setTimeout(r, 50));
  }
  showSettings();
  const sec = document.getElementById('pairsSection');
  const arrow = document.getElementById('pairsSectionArrow');
  if (sec) { sec.style.display = ''; if (arrow) arrow.textContent = '▲'; }
  const fab = document.getElementById('fabAddPair');
  if (fab) fab.classList.add('visible');
  const newRow = document.getElementById(`pairRow_${cfg.pairs.length - 1}`);
  if (newRow) { newRow.style.border = '2px solid #c0392b'; newRow.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
}

function removePair(i) {
  const cfg = readFormIntoCfg();
  const pair = cfg.pairs[i];
  if (pair && pair.consultant && pair.speaker) {
    apiDelete([progressKey(pair.consultant, pair.speaker)]);
  }
  cfg.pairs.splice(i, 1);
  cache['__config__'] = cfg;
  _lsSave();
  showSettings();
  const sec = document.getElementById('pairsSection');
  const arrow = document.getElementById('pairsSectionArrow');
  if (sec) { sec.style.display = ''; if (arrow) arrow.textContent = '▲'; }
  const fab = document.getElementById('fabAddPair');
  if (fab) fab.classList.add('visible');
}

async function saveSettings() {
  const cfg = readFormIntoCfg();
  // 不再激進過濾空白列（使用者反映「第二筆消失」的根因）
  // 改用：所有列都保留儲存，由使用者按「刪除」按鈕主動移除
  await saveConfig(cfg);
  // 等 push queue 完全清空（避免 alert 跳出後使用者重整時 GAS 還沒收到）
  while (_saveQueue.size > 0 || _saveRunning) {
    await new Promise(r => setTimeout(r, 50));
  }

  // 必填欄位提醒（僅提示，不擋儲存；完全空白列略過提示）
  const issues = [];
  cfg.pairs.forEach((p, i) => {
    const isAllEmpty = !p.consultant && !p.speaker && !p.submitDate1 && !p.submitDate2 && !p.presentationTime && !p.presentationCount;
    if (isAllEmpty) return;
    const missing = [];
    if (!p.consultant) missing.push('顧問');
    if (!p.speaker) missing.push('講者姓名');
    if (p.activityType === '主題簡報') {
      if (!p.presentationCount) missing.push('簡報次數');
    } else {
      // 主題日、共識會議、BOD 都要繳交簡報 / 線上 RE 稿
      if (!p.submitDate1) missing.push(DATE_LABELS[0]);
      if (!p.submitDate2) missing.push(DATE_LABELS[1]);
    }
    if (!p.presentationTime) missing.push(DATE_LABELS[2]);
    if (missing.length) issues.push({ idx: i, missing });
  });

  if (issues.length) {
    const lines = issues.map(x => `第 ${x.idx + 1} 組：${x.missing.join('、')}`);
    alert(`資料已暫存，但以下配對尚有欄位未填：\n\n${lines.join('\n')}\n\n請補齊後再次儲存。`);
    const firstRow = document.getElementById(`pairRow_${issues[0].idx}`);
    if (firstRow) firstRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showSettings();
    return;
  }

  showToast('設定已儲存！');
  showSettings();
}


