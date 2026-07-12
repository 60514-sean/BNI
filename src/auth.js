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
  currentSpeaker = null; _pendingUserEntry = null; _onSettingsPage = false;
  if (_autoPollTimer) { clearInterval(_autoPollTimer); _autoPollTimer = null; }
  document.getElementById('refreshBtn').style.display = 'none';
  document.getElementById('roleSelectPage').style.display = 'none';
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('appPage').style.display = 'none';
  document.getElementById('nameInput').value = '';
  document.getElementById('loginError').textContent = '';
}

let _viewingCk = null;
let _viewingSpeaker = null;

async function doRefresh(silent = false) {
  if (!silent) showLoader(true, '更新中...');
  // silent 模式（定時 polling）若有未完成 push 或使用者正在設定頁編輯，直接跳過，避免覆蓋本地剛改的修改
  if (silent && (_saveQueue.size > 0 || _saveRunning || _onSettingsPage)) return;
  try {
    const res = await fetch(API_URL);
    const json = await res.json();
    if (json?.data) {
      const prevStr = JSON.stringify(cache);
      cache = json.data;
      _lsSave();
      if (!silent || JSON.stringify(cache) !== prevStr) renderApp();
    }
  } catch {}
  if (!silent) showLoader(false);
  if (!silent) showToast('資料已更新');
}

document.getElementById('nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

// ===== RENDER =====
function renderApp() {
  _onSettingsPage = false;
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

