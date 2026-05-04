// ===== LOADER =====
function showLoader(show, text) {
  const el = document.getElementById('loader');
  if (show) {
    el.classList.add('show');
    document.getElementById('loaderText').textContent = text || '載入中...';
  } else {
    el.classList.remove('show');
  }
}

// ===== LOGIN =====
async function doLogin() {
  const name = document.getElementById('nameInput').value.trim();
  if (!name) return;

  if (Object.keys(cache).length === 0) {
    showLoader(true, '連線中...');
    try {
      const res = await fetch(API_URL);
      const json = await res.json();
      cache = json.data || {};
      _lsSave();
    } catch {
      document.getElementById('loginError').textContent = '無法連線，請檢查網路後重試';
      showLoader(false);
      return;
    }
    showLoader(false);
  }

  const users = buildUserMap();
  if (!users[name]) {
    document.getElementById('loginError').textContent = '找不到此姓名，請確認後重試';
    return;
  }

  const entry = { name, ...users[name] };
  if (entry.role === 'both') {
    _pendingUserEntry = entry;
    document.getElementById('roleSelectName').textContent = name;
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('roleSelectPage').style.display = 'flex';
    return;
  }
  enterApp(entry.role, entry);
}

function enterApp(role, entry) {
  entry = entry || _pendingUserEntry;
  _pendingUserEntry = null;
  document.getElementById('roleSelectPage').style.display = 'none';

  currentUser = entry.name;
  currentRole = role;
  if (role === 'consultant') {
    currentConsultantKey = entry.consultantKey;
    currentSpeaker = null;
  } else if (role === 'speaker') {
    currentConsultantKey = entry.speakerConsultantKey || entry.consultantKey;
    currentSpeaker = entry.speakerName || entry.speaker || entry.name;
  } else {
    currentConsultantKey = entry.consultantKey || null;
    currentSpeaker = null;
  }

  fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'log', name: currentUser, role: currentRole, event: 'login' }) }).catch(() => {});

  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('appPage').style.display = 'block';
  document.getElementById('userBadge').textContent = currentUser;
  document.getElementById('refreshBtn').style.display = 'block';
  document.getElementById('settingsBtn').style.display = currentRole === 'admin' ? 'block' : 'none';
  renderApp();
  _refreshBaseline = JSON.parse(JSON.stringify(cache));
  doRefresh(true);
  _startAutoPoll();
}

let _autoPollTimer = null;
function _startAutoPoll() {
  if (_autoPollTimer) clearInterval(_autoPollTimer);
  _autoPollTimer = setInterval(() => { if (currentUser) doRefresh(true); }, 30000);
}

function doLogout() {
  currentUser = null; currentRole = null; currentConsultantKey = null;
  currentSpeaker = null; _pendingUserEntry = null;
  if (_autoPollTimer) { clearInterval(_autoPollTimer); _autoPollTimer = null; }
  document.getElementById('refreshBtn').style.display = 'none';
  document.getElementById('roleSelectPage').style.display = 'none';
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('appPage').style.display = 'none';
  document.getElementById('nameInput').value = '';
  document.getElementById('loginError').textContent = '';
}

let _updatedPairs = new Set();
let _viewingCk = null;
let _viewingSpeaker = null;

function _countLeafUpdates() {
  let count = 0;
  for (const k of _updatedPairs) {
    const parts = k.split('\t');
    if (parts.length < 3) continue;
    const type = parts[2];
    if (type === 'simple' || type === 'slides' || type.startsWith('week_')) continue;
    count++;
  }
  return count;
}

function _pairHasAnyUpdate(ck, speaker) {
  const prefix = `${ck}\t${speaker}\t`;
  for (const k of _updatedPairs) { if (k.startsWith(prefix)) return true; }
  return false;
}
function _clearPairDotIfDone(ck, speaker) {
  if (_pairHasAnyUpdate(ck, speaker)) return;
  _updatedPairs.delete(`${ck}\t${speaker}`);
  const pi = _adminPairs.findIndex(p => p.consultant === ck && p.speaker === speaker);
  if (pi >= 0) { const d = document.getElementById(`updDot_${pi}`); if (d) d.remove(); }
  const d2 = document.getElementById(`covDot_${speaker}`);
  if (d2) d2.remove();
}

async function doRefresh(silent = false) {
  if (!silent) showLoader(true, '更新中...');
  // silent 模式（定時 polling）若有未完成 push 直接跳過，避免覆蓋本地剛改的修改
  if (silent && (_saveQueue.size > 0 || _saveRunning)) return;
  const oldCache = _refreshBaseline;
  _updatedPairs = new Set();
  try {
    const res = await fetch(API_URL);
    const json = await res.json();
    if (json?.data) {
      const newData = json.data;
      const pairs = (oldCache['__config__'] || newData['__config__'] || {}).pairs || [];
      pairs.forEach(p => {
        const pairId = `${p.consultant}\t${p.speaker}`;
        const act = p.activityType || '主題簡報';
        // 進度資料比對
        const progKey = progressKey(p.consultant, p.speaker);
        const oldProg = oldCache[progKey] || {};
        const newProg = newData[progKey] || {};
        if (JSON.stringify(oldProg) !== JSON.stringify(newProg)) {
          _updatedPairs.add(pairId);
          if (isSimpleType(act)) {
            _updatedPairs.add(`${pairId}\tsimple`);
            SIMPLE_TASKS.forEach((_, ti) => {
              if ((oldProg[simpleNoteKey(ti)]||'') !== (newProg[simpleNoteKey(ti)]||''))
                _updatedPairs.add(`${pairId}\tsnote_${ti}`);
            });
          } else {
            WEEKS.forEach((w, wi) => {
              const oldW = w.tasks.map((_, ti) => [oldProg[taskKey(wi,ti)], oldProg[noteKey(wi,ti)]]);
              const newW = w.tasks.map((_, ti) => [newProg[taskKey(wi,ti)], newProg[noteKey(wi,ti)]]);
              if (JSON.stringify(oldW) !== JSON.stringify(newW)) {
                _updatedPairs.add(`${pairId}\tweek_${wi}`);
                w.tasks.forEach((_, ti) => {
                  if (!!oldProg[taskKey(wi,ti)] !== !!newProg[taskKey(wi,ti)])
                    _updatedPairs.add(`${pairId}\ttask_${wi}_${ti}`);
                  if ((oldProg[noteKey(wi,ti)]||'') !== (newProg[noteKey(wi,ti)]||''))
                    _updatedPairs.add(`${pairId}\tnote_${wi}_${ti}`);
                });
              }
            });
          }
        }
        // 簡報內容比對
        const sldKey = `slides_${p.consultant}_${p.speaker}`;
        const oldSld = oldCache[sldKey] || {};
        const newSld = newData[sldKey] || {};
        if (JSON.stringify(oldSld) !== JSON.stringify(newSld)) {
          _updatedPairs.add(pairId);
          _updatedPairs.add(`${pairId}\tslides`);
          const allSldKeys = new Set([...Object.keys(oldSld), ...Object.keys(newSld)]);
          allSldKeys.forEach(k => {
            if (JSON.stringify(oldSld[k]) !== JSON.stringify(newSld[k])) {
              _updatedPairs.add(`${pairId}\tslide_${k}`);
            }
          });
        }
      });
      cache = newData;
      _lsSave();
      _refreshBaseline = JSON.parse(JSON.stringify(newData));
    }
  } catch {}
  if (!silent) showLoader(false);
  if (!silent || _updatedPairs.size > 0) renderApp();
  const _leafCount = _countLeafUpdates();
  if (!silent) showToast(_leafCount ? `資料已更新（${_leafCount} 筆有變動）` : '資料已是最新');
  if (silent && _updatedPairs.size > 0) showToast(`資料已更新（${_leafCount} 筆有變動）`);
}

document.getElementById('nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

// ===== RENDER =====
function renderApp() {
  if (currentRole === 'admin') {
    document.getElementById('headerTitle').textContent = '進度總覽';
    renderAdmin();
  } else if (currentRole === 'consultant') {
    document.getElementById('headerTitle').textContent = '顧問進度回報';
    renderConsultantOverview(currentConsultantKey);
  } else {
    document.getElementById('headerTitle').textContent = '我的進度';
    renderConsultant(currentConsultantKey, currentSpeaker || currentUser, false);
  }
}

