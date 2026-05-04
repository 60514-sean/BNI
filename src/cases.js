// ===== CASES =====
function getCases() { return cache['__cases__'] || []; }
async function saveCases(list) { await apiSave('__cases__', list); }

function getCaseType(act, count) {
  if (act === '主題日') return '主題日';
  if (act === 'BOD') return 'BOD';
  if (!count || count === '第1次') return '第1次';
  return '第2次+';
}

// 將 Drive 分享連結轉為可嵌入圖片 URL（加 =w1200 限制寬度，加速載入）
function driveImgUrl(url) {
  url = url.trim();
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return `https://lh3.googleusercontent.com/d/${m[1]}=w1200`;
  if (/^[a-zA-Z0-9_-]{25,}$/.test(url)) return `https://lh3.googleusercontent.com/d/${url}=w1200`;
  return url;
}

const _carouselData = {};
const _driveUrlCache = {};
const _caseDataMap = new Map();

function driveUrlMemo(id) {
  if (!_driveUrlCache[id]) _driveUrlCache[id] = `https://lh3.googleusercontent.com/d/${id}=w1200`;
  return _driveUrlCache[id];
}

function preloadAdjacent(images, idx) {
  [-1, 1, 2].forEach(d => {
    const i = (idx + d + images.length) % images.length;
    const url = driveUrlMemo(images[i]);
    if (!_driveUrlCache['_loaded_' + images[i]]) {
      const img = new Image(); img.src = url;
      _driveUrlCache['_loaded_' + images[i]] = true;
    }
  });
}

function renderCarousel(images, uid) {
  if (!images || images.length === 0) return '';
  _carouselData[uid] = { images, idx: 0 };
  if (images.length > 1) setTimeout(() => setupCarouselSwipe(uid), 50);
  setTimeout(() => preloadAdjacent(images, 0), 200);
  const total = images.length;
  const src = driveUrlMemo(images[0]);
  return `
    <div style="margin-top:10px;">
      <div id="carWrap_${uid}" style="background:#111;border-radius:10px;overflow:hidden;touch-action:pan-y;">
        <img id="carImg_${uid}" src="${src}" alt="投影片"
          style="width:100%;max-height:340px;object-fit:contain;display:block;transition:opacity 0.15s;"
          onerror="this.style.minHeight='120px';" />
      </div>
      ${total > 1 ? `<div style="text-align:center;padding:6px 0 0;"><span id="carCount_${uid}" style="color:#888;font-size:13px;font-weight:500;">1 / ${total}</span></div>` : ''}
    </div>`;
}

const _carouselSetup = new Set();
function setupCarouselSwipe(uid) {
  if (_carouselSetup.has(uid)) return;
  const wrap = document.getElementById('carWrap_' + uid);
  if (!wrap) return;
  _carouselSetup.add(uid);
  let startX = 0;
  wrap.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  wrap.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) carouselNav(uid, dx < 0 ? 1 : -1);
  }, { passive: true });
  wrap.addEventListener('click', e => {
    const rect = wrap.getBoundingClientRect();
    carouselNav(uid, e.clientX >= rect.left + rect.width / 2 ? 1 : -1);
  });
  wrap.style.cursor = 'pointer';
}

function carouselNav(uid, dir) {
  const d = _carouselData[uid];
  if (!d) return;
  d.idx = (d.idx + dir + d.images.length) % d.images.length;
  const img = document.getElementById(`carImg_${uid}`);
  const cnt = document.getElementById(`carCount_${uid}`);
  if (img) { img.style.opacity = '0.5'; img.src = driveUrlMemo(d.images[d.idx]); img.onload = () => img.style.opacity = '1'; }
  if (cnt) cnt.textContent = `${d.idx + 1} / ${d.images.length}`;
  setTimeout(() => preloadAdjacent(d.images, d.idx), 100);
}

function caseImgList(cs) {
  if (!cs.images) return [];
  if (!Array.isArray(cs.images)) return cs.images.split('\n').map(u => u.trim()).filter(Boolean);
  // 支援 {id, name} 物件或純字串 id
  const list = cs.images.map(img => typeof img === 'object' ? img : { id: img, name: '' });
  list.sort((a, b) => {
    const na = parseInt((a.name.match(/(\d+)(?=\D*$)/) || [0])[0]);
    const nb = parseInt((b.name.match(/(\d+)(?=\D*$)/) || [0])[0]);
    return na - nb;
  });
  return list.map(img => img.id);
}

function makeCaseCard(cs, key, c) {
  const imgList = caseImgList(cs);
  const thumb = imgList.length > 0 ? driveUrlMemo(imgList[0]) : '';
  _caseDataMap.set(key, { cs, imgList, c, key });
  return `
    <div onclick="openCaseModal('${key}')" style="cursor:pointer;border-radius:10px;overflow:hidden;background:#f5f5f5;position:relative;aspect-ratio:16/9;box-shadow:0 1px 6px rgba(0,0,0,0.08);">
      ${thumb ? `<img src="${thumb}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none'" />` : '<div style="width:100%;height:100%;background:#eee;"></div>'}
      <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.65));padding:10px 8px 8px;">
        <div style="color:white;font-size:12px;font-weight:700;line-height:1.5;">${(cs.speaker || cs.topic || '（未填）').replace(/\//g, '<br>')}</div>
      </div>
      ${imgList.length > 1 ? `<div style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,0.5);color:white;font-size:10px;padding:2px 6px;border-radius:10px;">${imgList.length}張</div>` : ''}
    </div>`;
}

function makeSplitCard(cs1, key1, cs2, key2, label, c) {
  const img1 = caseImgList(cs1); const img2 = caseImgList(cs2);
  const t1 = img1.length > 0 ? driveUrlMemo(img1[0]) : '';
  const t2 = img2.length > 0 ? driveUrlMemo(img2[0]) : '';
  _caseDataMap.set(key1, { cs: cs1, imgList: img1, c, key: key1 });
  _caseDataMap.set(key2, { cs: cs2, imgList: img2, c, key: key2 });
  return `
    <div style="border-radius:10px;overflow:hidden;background:#f5f5f5;position:relative;aspect-ratio:16/9;box-shadow:0 1px 6px rgba(0,0,0,0.08);">
      <div onclick="openCaseModal('${key1}')" style="cursor:pointer;position:absolute;left:0;top:0;width:50%;height:100%;overflow:hidden;">
        ${t1 ? `<img src="${t1}" loading="lazy" style="width:200%;height:100%;object-fit:cover;display:block;" />` : '<div style="width:100%;height:100%;background:#ddd;"></div>'}
      </div>
      <div onclick="openCaseModal('${key2}')" style="cursor:pointer;position:absolute;right:0;top:0;width:50%;height:100%;overflow:hidden;">
        ${t2 ? `<img src="${t2}" loading="lazy" style="width:200%;height:100%;object-fit:cover;display:block;margin-left:-100%;" />` : '<div style="width:100%;height:100%;background:#ccc;"></div>'}
      </div>
      <div style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(255,255,255,0.6);pointer-events:none;"></div>
      <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.65));padding:8px 8px 6px;pointer-events:none;">
        <div style="color:white;font-size:11px;font-weight:700;line-height:1.4;">${label || ''}</div>
      </div>
    </div>`;
}

function renderCasesTab(act, pair, color) {
  const c = color || '#c0392b';
  const caseType = getCaseType(act, pair.presentationCount);
  const cases = getCases().filter(cs => cs.type === caseType).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  if (cases.length === 0) {
    return `<div style="padding:40px 20px;text-align:center;color:#bbb;font-size:14px;">尚無「${caseType}」的簡報案例</div>`;
  }

  let cards = '';
  if (caseType === '主題日') {
    const grouped = {}, singles = [];
    cases.forEach((cs, i) => {
      const name = (cs.themeDayName || '').trim();
      if (name) {
        if (!grouped[name]) grouped[name] = [];
        grouped[name].push({ cs, i });
      } else {
        singles.push({ cs, i });
      }
    });
    Object.entries(grouped).forEach(([name, items]) => {
      if (items.length >= 2) {
        const k1 = `caseModal_主題日_${items[0].i}`, k2 = `caseModal_主題日_${items[1].i}`;
        cards += makeSplitCard(items[0].cs, k1, items[1].cs, k2, name, c);
        items.slice(2).forEach(({ cs, i }) => { cards += makeCaseCard(cs, `caseModal_主題日_${i}`, c); });
      } else {
        cards += makeCaseCard(items[0].cs, `caseModal_主題日_${items[0].i}`, c);
      }
    });
    singles.forEach(({ cs, i }) => { cards += makeCaseCard(cs, `caseModal_主題日_${i}`, c); });
  } else {
    cards = cases.map((cs, i) => makeCaseCard(cs, `caseModal_${caseType}_${i}`, c)).join('');
  }

  return `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;padding:4px 0;">${cards}</div>
    <div id="caseModalOverlay" onclick="closeCaseModal()" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:3000;align-items:center;justify-content:center;">
      <div id="caseModalBox" onclick="event.stopPropagation()" style="background:white;border-radius:14px;width:92%;max-width:480px;max-height:88vh;overflow-y:auto;padding:18px;">
        <div id="caseModalContent"></div>
        <button onclick="closeCaseModal()" style="margin-top:12px;width:100%;padding:10px;border:none;border-radius:8px;background:#eee;color:#555;font-size:14px;cursor:pointer;">關閉</button>
      </div>
    </div>`;
}

function openCaseModal(key) {
  const d = _caseDataMap.get(key);
  if (!d) return;
  logAction('view_case_detail');
  const { cs, imgList, c } = d;
  const uid = 'cm_' + key;
  document.getElementById('caseModalContent').innerHTML = `
    <div style="font-size:15px;font-weight:700;color:${c};margin-bottom:4px;line-height:1.6;">${(cs.topic || '（未填主題）').replace(/[,，]/g, '<br>')}</div>
    ${cs.speaker ? `<div style="font-size:12px;color:#aaa;margin-bottom:8px;">${cs.speaker}</div>` : ''}
    ${cs.note ? `<div style="font-size:13px;color:#555;line-height:1.7;white-space:pre-wrap;margin-bottom:10px;">${cs.note}</div>` : ''}
    ${imgList.length > 0 ? renderCarousel(imgList, uid) : ''}`;
  const ov = document.getElementById('caseModalOverlay');
  ov.style.display = 'flex';
}

function closeCaseModal() {
  const ov = document.getElementById('caseModalOverlay');
  if (ov) { ov.style.display = 'none'; document.getElementById('caseModalContent').innerHTML = ''; }
}

function showCasesSettings() {
  const cases = getCases();
  const CASE_TYPES = ['第1次', '第2次+', '主題日', 'BOD'];

  const groupHtml = CASE_TYPES.map(type => {
    const group = cases.map((cs, i) => ({ cs, i })).filter(({ cs }) => cs.type === type);
    const itemsHtml = group.length
      ? group.map(({ cs, i }) => {
          const imgCount = caseImgList(cs).length;
          return `
          <div id="caseItem_${i}" style="border:1px solid #c0392b;border-radius:8px;padding:12px;margin-bottom:8px;">
            <div style="display:flex;gap:8px;margin-bottom:8px;">
              <div style="flex:1;min-width:0;">
                <input id="editTopic_${i}" value="${(cs.topic||'').replace(/"/g,'&quot;')}" placeholder="簡報主題" style="width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-size:13px;font-weight:600;outline:none;margin-bottom:4px;" />
                <input id="editSpeaker_${i}" value="${(cs.speaker||'').replace(/"/g,'&quot;')}" placeholder="講者姓名" style="width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-size:12px;color:#888;outline:none;margin-bottom:4px;" />
                <input id="editDate_${i}" type="date" value="${cs.date||''}" style="width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-size:12px;color:#555;outline:none;margin-bottom:4px;" />
                ${type === '主題日' ? `<input id="editThemeDayName_${i}" value="${(cs.themeDayName||'').replace(/"/g,'&quot;')}" placeholder="主題日名稱（群組用）" style="width:100%;padding:6px 8px;border:1px solid #e0a0a0;border-radius:6px;font-size:12px;color:#c0392b;outline:none;" />` : ''}
              </div>
              <button class="btn btn-sm btn-danger" onclick="removeCase(${i})" style="flex-shrink:0;align-self:flex-start;">刪除</button>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
              ${imgCount ? `<span style="font-size:11px;color:#1a73e8;">${imgCount} 張圖</span>` : ''}
              <input id="refreshFolder_${i}" type="text" placeholder="資料夾連結（選填，重新整理圖片）" style="flex:1;min-width:0;padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-size:12px;outline:none;" />
              <button class="btn btn-sm btn-danger" onclick="saveCaseEdit(${i})" style="flex-shrink:0;">儲存</button>
            </div>
          </div>`;
        }).join('')
      : `<div style="color:#bbb;font-size:13px;padding:8px 0;">尚無案例</div>`;

    const gid = 'caseGroup_' + type.replace(/[^a-z0-9]/gi,'');
    return `
      <div style="margin-bottom:12px;border:1px solid #f0d0d0;border-radius:8px;overflow:hidden;">
        <div onclick="toggleCaseGroup('${gid}')" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#fdecea;">
          <span style="font-size:13px;font-weight:700;color:#c0392b;">${type}</span>
          <span id="${gid}_arrow" style="color:#c0392b;font-size:12px;">▼</span>
        </div>
        <div id="${gid}" style="padding:10px 10px 2px;display:none;">
          ${itemsHtml}
        </div>
      </div>`;
  }).join('');

  const typeOpts = CASE_TYPES.map(t => `<option value="${t}">${t}</option>`).join('');
  return `
    <div style="margin-bottom:12px;">${groupHtml}</div>
    <div style="border:1px dashed #c0392b;border-radius:8px;padding:14px;">
      <div style="font-size:13px;font-weight:600;color:#c0392b;margin-bottom:10px;">新增案例</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
        <select id="newCaseType" onchange="document.getElementById('themeDayNameRow').style.display=this.value==='主題日'?'':'none'" style="padding:7px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px;outline:none;">${typeOpts}</select>
        <input type="text" id="newCaseSpeaker" placeholder="講者姓名" style="flex:1;min-width:100px;padding:7px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px;outline:none;" />
        <input type="text" id="newCaseTopic" placeholder="簡報主題" style="flex:2;min-width:140px;padding:7px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px;outline:none;" />
      </div>
      <div id="themeDayNameRow" style="display:none;margin-bottom:8px;">
        <input type="text" id="newCaseThemeDayName" placeholder="主題日名稱（相同名稱的兩位講者會合併為群組）" style="width:100%;padding:7px 10px;border:1px solid #e0a0a0;border-radius:6px;font-size:13px;outline:none;" />
      </div>
      <input type="date" id="newCaseDate" style="width:100%;padding:7px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px;outline:none;margin-bottom:8px;color:#555;" />
      <textarea id="newCaseNote" placeholder="案例說明（可留空）" style="width:100%;padding:7px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px;outline:none;resize:vertical;min-height:50px;font-family:inherit;margin-bottom:8px;"></textarea>
      <input type="text" id="newCaseFolderLink" placeholder="Google Drive 資料夾連結" style="width:100%;padding:7px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px;outline:none;font-family:monospace;" />
      <button class="btn btn-sm btn-green" style="margin-top:8px;" onclick="addCase()">新增</button>
    </div>`;
}

async function saveCaseEdit(i) {
  const topic = document.getElementById(`editTopic_${i}`)?.value.trim();
  const speaker = document.getElementById(`editSpeaker_${i}`)?.value.trim();
  const folderLink = document.getElementById(`refreshFolder_${i}`)?.value.trim();
  const cases = getCases();
  if (!cases[i]) return;
  const themeDayName = document.getElementById(`editThemeDayName_${i}`)?.value.trim() || '';
  const date = document.getElementById(`editDate_${i}`)?.value || '';
  cases[i].topic = topic;
  cases[i].speaker = speaker;
  cases[i].date = date;
  if (cases[i].type === '主題日') cases[i].themeDayName = themeDayName;
  if (folderLink) {
    const folderId = extractFolderId(folderLink);
    if (!folderId) { showToast('資料夾連結格式不正確'); return; }
    showToast('正在讀取圖片...');
    try {
      const res = await fetch(`${API_URL}?action=listFolder&folderId=${folderId}`);
      const data = JSON.parse(await res.text());
      if (data.error) { showToast('GAS錯誤：' + data.error); return; }
      cases[i].images = (data.files || []).map(f => ({ id: f.id, name: f.name }));
    } catch(e) { showToast('讀取失敗：' + e.message); return; }
  }
  cache['__cases__'] = cases;
  saveCases(cases);
  showToast('已儲存');
  const el = document.getElementById('casesSection');
  if (el) {
    const CASE_TYPES = ['第1次', '第2次+', '主題日'];
    const openGroups = CASE_TYPES.map(t => {
      const gid = 'caseGroup_' + t.replace(/[^a-z0-9]/gi,'');
      const g = document.getElementById(gid);
      return g && g.style.display !== 'none';
    });
    el.innerHTML = showCasesSettings();
    CASE_TYPES.forEach((t, idx) => {
      if (openGroups[idx]) {
        const gid = 'caseGroup_' + t.replace(/[^a-z0-9]/gi,'');
        const g = document.getElementById(gid);
        const arrow = document.getElementById(gid + '_arrow');
        if (g) g.style.display = '';
        if (arrow) arrow.textContent = '▲';
      }
    });
  }
}

function toggleCaseGroup(id) {
  const el = document.getElementById(id);
  const arrow = document.getElementById(id + '_arrow');
  if (!el) return;
  const collapsed = el.style.display === 'none';
  el.style.display = collapsed ? '' : 'none';
  if (arrow) arrow.textContent = collapsed ? '▲' : '▼';
}

function extractFolderId(url) {
  const m = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

async function addCase() {
  const type = document.getElementById('newCaseType')?.value;
  const speaker = document.getElementById('newCaseSpeaker')?.value.trim();
  const topic = document.getElementById('newCaseTopic')?.value.trim();
  const note = document.getElementById('newCaseNote')?.value.trim();
  const themeDayName = document.getElementById('newCaseThemeDayName')?.value.trim() || '';
  const date = document.getElementById('newCaseDate')?.value || '';
  const folderLink = document.getElementById('newCaseFolderLink')?.value.trim();
  if (!topic) { showToast('請填寫簡報主題'); return; }
  let images = [];
  if (folderLink) {
    const folderId = extractFolderId(folderLink);
    if (!folderId) { showToast('資料夾連結格式不正確'); return; }
    showToast('正在讀取資料夾圖片...');
    try {
      const res = await fetch(`${API_URL}?action=listFolder&folderId=${folderId}`);
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch(pe) { showToast('回應格式錯誤：' + text.slice(0,80)); return; }
      if (data.error) { showToast('GAS錯誤：' + data.error); return; }
      images = (data.files || []).map(f => ({ id: f.id, name: f.name }));
    } catch(e) { showToast('網路失敗：' + e.message); return; }
  }
  const cases = getCases();
  const newIdx = cases.length;
  cases.push({ type, speaker, topic, note, themeDayName, date, images });
  cache['__cases__'] = cases;
  saveCases(cases);
  showToast(`案例已新增！共 ${images.length} 張圖`);
  const el = document.getElementById('casesSection');
  if (el) {
    el.innerHTML = showCasesSettings();
    const gid = 'caseGroup_' + type.replace(/[^a-z0-9]/gi,'');
    const grp = document.getElementById(gid);
    const grpArrow = document.getElementById(gid + '_arrow');
    if (grp) { grp.style.display = ''; if (grpArrow) grpArrow.textContent = '▲'; }
    const newItem = document.getElementById(`caseItem_${newIdx}`);
    if (newItem) { newItem.style.border = '2px solid #c0392b'; newItem.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }
}

function removeCase(i) {
  const cases = getCases();
  cases.splice(i, 1);
  cache['__cases__'] = cases;
  saveCases(cases);
  showToast('已刪除');
  const el = document.getElementById('casesSection');
  if (el) el.innerHTML = showCasesSettings();
}

async function refreshCaseImages(i) {
  const folderLink = document.getElementById(`refreshFolder_${i}`)?.value.trim();
  if (!folderLink) { showToast('請貼上資料夾連結'); return; }
  const folderId = extractFolderId(folderLink);
  if (!folderId) { showToast('資料夾連結格式不正確'); return; }
  showToast('正在讀取...');
  try {
    const res = await fetch(`${API_URL}?action=listFolder&folderId=${folderId}`);
    const text = await res.text();
    const data = JSON.parse(text);
    if (data.error) { showToast('GAS錯誤：' + data.error); return; }
    const images = (data.files || []).map(f => ({ id: f.id, name: f.name }));
    const cases = getCases();
    cases[i].images = images;
    cache['__cases__'] = cases;
    saveCases(cases);
    showToast(`已更新，共 ${images.length} 張圖`);
    const el = document.getElementById('casesSection');
    if (el) el.innerHTML = showCasesSettings();
  } catch(e) { showToast('讀取失敗：' + e.message); }
}

function renderGuide(act, color, pair) {
  const c = color || '#c0392b';

  function gCard(title, sub, body) {
    const id = 'gc_' + Math.random().toString(36).slice(2,8);
    return `<div class="guide-section">
      <div class="guide-header" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'':'none'">
        <div><h4 style="color:${c}">${title}</h4>${sub?`<div class="guide-sub">${sub}</div>`:''}</div>
        <span style="color:#bbb;font-size:12px;">▼</span>
      </div>
      <div class="guide-body" style="display:none;">${body}</div>
    </div>`;
  }

  function gItem(title, desc) {
    return `<div class="guide-item">
      <div class="guide-item-title">${title}</div>
      ${desc?`<div class="guide-item-desc">${desc}</div>`:''}
    </div>`;
  }

  function gGrid(...cells) {
    return `<div class="guide-grid">${cells.map(t=>`<div class="guide-cell">${t}</div>`).join('')}</div>`;
  }

  if (act === '主題日') {
    return gCard('攻略三-4', '主題日 5 分鐘架構',
      gGrid('封面','我在做什麼','簡述自家產業') +
      gGrid('最佳 LCD<br><small style="color:#888">描述、案例、小總結</small>','目前在 BNI 億展分會<br>產業鏈的連結','接下來期待<br>發展的方向') +
      gGrid('總結','要求引薦 CTA','記憶口號')
    );
  }

  if (act !== '主題簡報') {
    return `<div style="padding:30px;text-align:center;color:#bbb;font-size:14px;">此活動類型尚無攻略內容</div>`;
  }

  // 主題簡報
  const body1 =
    gItem('1. 對引薦 / 合作對象有吸引力', '主題與內容針對引薦與合作對象設計<br>EX. 用制服，為你的專業形象再加分 → 受眾：多人公司團隊<br>EX. 用品牌設計，提升餐飲體驗 → 受眾：餐飲業') +
    gItem('2. 你最想分享的產品 / 品牌優勢', 'EX. 小坪數創造大收益！維繫顧客關係的秘密 → 受眾：小規模經營者') +
    gItem('3. 秒懂其價值', 'EX. 設立公司還是行號？會計師來告訴你 → 受眾：一人公司、工作室') +
    gItem('4. 你想分享的價值', 'EX. 創業要翻倍，從學習開始 → 受眾：創業者') +
    `<div class="guide-tip" style="background:${c}10;color:${c};">標題字數規範：18 字以內</div>`;

  const body2 =
    gItem('合作對象', '有組成產業服務鏈的機會、一對一表的業務人脈圈') +
    gItem('理想引薦', '目前已有且多多益善的客源、A 級客戶') +
    gItem('夢幻引薦', '超想要的！在外面比較難得到的重要資源<br>9981 宮格攤開來，你就知道了') +
    `<div class="guide-tip" style="background:${c}10;color:${c};">以上三項每項字數規範：16 字以內</div>`;

  const body31 =
    `<div style="font-size:12px;color:#888;margin-bottom:6px;">第 1 次簡報使用</div>` +
    gGrid('封面','我在做什麼','我為什麼做這個事業') +
    gGrid('成功案例 1','成功案例 2','成功案例 3') +
    gGrid('總結','要求引薦 CTA','記憶口號');

  const body32 =
    `<div style="font-size:12px;color:#888;margin-bottom:6px;">第2次+簡報使用，呼應 DanceCard</div>` +
    gGrid('封面','自我介紹 /<br>我在做什麼','獨特銷售主張<br><small style="color:#888">針對目標客群</small>') +
    gGrid('最佳 LCD<br><small style="color:#888">描述 + 案例 + 總結</small>','如何開啟交易對話<br><small style="color:#888">聽到xxx，告訴他ooo</small>','如何掌握引薦流程<br><small style="color:#888">常見 QA 2~3 個</small>') +
    gGrid('整體總結','要求引薦 CTA','記憶口號') +
    `<div class="guide-tip" style="background:#f5f5f5;color:#888;">LCD 科普：產品與服務項目 / 目標市場 / 客戶特定利潤 / 公司傲人事蹟 / 成功案例</div>`;

  const cnt = pair ? pair.presentationCount : '';
  const body3 = (!cnt || cnt === '第1次')
    ? gCard('攻略三-1', '333 架構（第 1 次簡報）', body31)
    : gCard('攻略三-2', '主題簡報架構（第2次+）', body32);
  return gCard('攻略一', '主題設定參考', body1) +
    gCard('攻略二', '引薦對象', body2) +
    body3;
}

const _TOTAL_TASKS = WEEKS.reduce((s, w) => s + w.tasks.length, 0);
const _TOTAL_SIMPLE = SIMPLE_TASKS.length;

function calcProgress(act, data) {
  if (isSimpleType(act)) {
    const tis = visibleSimpleTaskIndices(act);
    const done = tis.filter(ti => data[simpleTaskKey(ti)]).length;
    return { total: tis.length, done };
  }
  const done = WEEKS.reduce((s, w, wi) => s + w.tasks.filter((_, ti) => data[taskKey(wi, ti)]).length, 0);
  return { total: _TOTAL_TASKS, done };
}

async function toggleTask(ck, speaker, wi, ti, cb) {
  const data = getData(ck, speaker);
  data[taskKey(wi, ti)] = cb.checked;
  const pair2 = getPairByKeys(ck, speaker);
  const dynColor = getActivityColor(pair2.activityType);
  const lbl = document.getElementById(`lbl_${wi}_${ti}`);
  if (lbl) { lbl.className = 'task-label' + (cb.checked ? ' checked' : ''); lbl.style.textDecorationColor = cb.checked ? dynColor : ''; }
  const { done } = calcProgress(pair2.activityType || '主題簡報', data);
  const pct = Math.round(done / _TOTAL_TASKS * 100);
  const fill = document.querySelector('.overall-bar-fill');
  const txt = document.querySelector('.overall-pct-text');
  if (fill) { fill.style.width = pct + '%'; fill.style.background = dynColor; }
  if (txt) { txt.textContent = pct + '%'; txt.style.color = dynColor; }
  const weekDone = WEEKS[wi].tasks.filter((_, ti2) => data[taskKey(wi, ti2)]).length;
  const wcount = document.getElementById(`wcount_${wi}`);
  if (wcount) wcount.textContent = `${weekDone}/${WEEKS[wi].tasks.length}`;
  saveData(ck, speaker, data);
  logAction('task_check');
  showToast(cb.checked ? '已勾選' : '已取消勾選');
}

async function toggleTaskSimple(ck, speaker, ti, cb) {
  const data = getData(ck, speaker);
  data[simpleTaskKey(ti)] = cb.checked;
  const pair = getPairByKeys(ck, speaker);
  const color = getActivityColor(pair.activityType);
  const lbl = document.getElementById(`slbl_${ti}`);
  if (lbl) { lbl.className = 'task-label' + (cb.checked ? ' checked' : ''); lbl.style.textDecorationColor = cb.checked ? color : ''; }
  const { done } = calcProgress(pair.activityType || '主題簡報', data);
  const pct = Math.round(done / _TOTAL_SIMPLE * 100);
  const fill = document.querySelector('.overall-bar-fill');
  const txt = document.querySelector('.overall-pct-text');
  if (fill) { fill.style.width = pct + '%'; fill.style.background = color; }
  if (txt) { txt.textContent = pct + '%'; txt.style.color = color; }
  saveData(ck, speaker, data);
  logAction('task_check');
  showToast(cb.checked ? '已勾選' : '已取消勾選');
}

async function saveNote(ck, speaker, wi, ti, val) {
  const data = getData(ck, speaker);
  data[noteKey(wi, ti)] = val;
  saveData(ck, speaker, data);
  logAction('note_save');
}

async function saveNoteSimple(ck, speaker, ti, val) {
  const data = getData(ck, speaker);
  data[simpleNoteKey(ti)] = val;
  saveData(ck, speaker, data);
  logAction('note_save');
}

async function saveAllTasks(ck, speaker) {
  const data = getData(ck, speaker);
  const act = getPairByKeys(ck, speaker).activityType;
  if (isSimpleType(act)) {
    visibleSimpleTaskIndices(act).forEach(ti => {
      const cb = document.getElementById(`scb_${ti}`);
      const note = document.getElementById(`snote_${ti}`);
      if (cb) data[simpleTaskKey(ti)] = cb.checked;
      if (note) data[simpleNoteKey(ti)] = note.value;
    });
  } else {
    WEEKS.forEach((w, wi) => {
      w.tasks.forEach((_, ti) => {
        const cb = document.getElementById(`cb_${wi}_${ti}`);
        const note = document.getElementById(`note_${wi}_${ti}`);
        if (cb) data[taskKey(wi, ti)] = cb.checked;
        if (note) data[noteKey(wi, ti)] = note.value;
      });
    });
  }
  saveData(ck, speaker, data);
  logAction('save_all');
  showToast('已儲存！');
}

