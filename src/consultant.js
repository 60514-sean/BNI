// ===== CONSULTANT OVERVIEW =====
function renderConsultantOverview(ck) {
  const cfg = getConfig();
  const myPairs = cfg.pairs.filter(p => p.consultant === ck && (p.consultant || p.speaker));
  if (myPairs.length === 0) {
    document.getElementById('mainContent').innerHTML = '<div class="card"><p style="color:#888;">目前尚未配對任何講者。</p></div>';
    return;
  }
  let cardsHtml = '<div class="weeks-container">';
  myPairs.forEach(p => {
    const act = p.activityType || '主題簡報';
    const color = getDisplayColor(act, isPairLocked(p));
    const data = getData(ck, p.speaker);
    const { total, done } = calcProgress(act, data);
    const pct = total ? Math.round(done / total * 100) : 0;
    const dates = [
      isSimpleType(act) && p.submitDate1 ? `${DATE_LABELS[0]}：${p.submitDate1}` : '',
      isSimpleType(act) && p.submitDate2 ? `${DATE_LABELS[1]}：${p.submitDate2}` : '',
      p.presentationTime ? `${DATE_LABELS[2]}：${p.presentationTime}` : '',
    ].filter(Boolean).join('　');
    const _hasUpd2 = _updatedPairs.has(`${ck}\t${p.speaker}`);
    cardsHtml += `
      <div class="pair-card" style="cursor:pointer;${pct === 100 ? `border:2px solid ${color};background:white;` : ''}" onclick="renderConsultant('${ck}','${p.speaker}',true)">
        ${_hasUpd2 ? `<div class="update-dot" id="covDot_${p.speaker}" style="background:${color};box-shadow:0 0 6px ${color}80;top:12px;right:12px;"></div>` : ''}
        <div class="pair-header">
          <span class="pair-title">${p.speaker||'—'}${activityBadge(act, color)}${countBadge(p, color)}</span>
        </div>
        ${dates ? `<div style="font-size:12px;color:#888;margin-top:6px;">${dates}</div>` : ''}
        ${countdownHtml(p.presentationTime, act, color)}
        ${renderProgressBar(pct, color)}
        <div style="font-size:13px;color:${color};margin-top:8px;">點擊查看詳細進度 →</div>
      </div>`;
  });
  cardsHtml += '</div>';
  document.getElementById('mainContent').innerHTML = `
    <div class="speaker-tabs" style="--tab-color:#c0392b">
      <button id="tabBtn_tracking" class="speaker-tab-btn active" onclick="switchConsultantTab('tracking')">講者追蹤</button>
      <button id="tabBtn_cases" class="speaker-tab-btn" onclick="switchConsultantTab('cases')">簡報案例</button>
    </div>
    <div id="tabTracking">${cardsHtml}</div>
    <div id="tabConsultantCases" style="display:none;">${renderCasesAllTypes('#c0392b')}</div>`;
}

// ===== CONSULTANT DETAIL =====
function renderConsultant(ck, speaker, canEdit) {
  _viewingCk = ck;
  _viewingSpeaker = speaker;
  const cfg = getConfig();
  const myPairs = cfg.pairs.filter(p => p.consultant === ck);
  const pair = cfg.pairs.find(p => p.consultant === ck && p.speaker === speaker) || {};
  const act = pair.activityType || '主題簡報';
  const { weeksDiff: _presWeeksDiff } = pair.presentationTime ? getPresentationInfo(pair.presentationTime) : { weeksDiff: -Infinity };
  const locked = _presWeeksDiff > LOCK_WEEKS_THRESHOLD;
  if (locked) canEdit = false;
  const color = getDisplayColor(act, locked);
  const data = getData(ck, speaker);

  const { total, done } = calcProgress(act, data);
  const pct = total ? Math.round(done / total * 100) : 0;
  const progressColor = color;

  const dates = [
    isSimpleType(act) && pair.submitDate1 ? `${DATE_LABELS[0]}：${pair.submitDate1}` : '',
    isSimpleType(act) && pair.submitDate2 ? `${DATE_LABELS[1]}：${pair.submitDate2}` : '',
    pair.presentationTime ? `${DATE_LABELS[2]}：${pair.presentationTime}` : '',
  ].filter(Boolean);

  let html = '';
  if (currentRole === 'consultant') {
    html += `<div style="margin-bottom:16px;"><button class="btn btn-sm btn-outline" onclick="renderConsultantOverview('${ck}')">← 返回</button></div>`;
  }
  if (locked) {
    const weeksLeft = _presWeeksDiff - LOCK_WEEKS_THRESHOLD;
    html += `<div style="background:#f7f7f7;border:1.5px dashed #ccc;border-radius:10px;padding:10px 16px;margin-bottom:14px;text-align:center;color:#999;font-size:13px;">目前為預覽模式，約 ${weeksLeft} 週後（倒數${LOCK_WEEKS_THRESHOLD}週起）開放編輯</div>`;
  }
  const _slidesUpd = _updatedPairs.has(`${ck}\t${speaker}\tslides`);
  const _slideDot = `<span id="slidesDot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-left:5px;vertical-align:middle;animation:dotPulse 1.4s ease-in-out infinite;"></span>`;
  if (!canEdit) {
    const isConsultantView = currentRole === 'consultant';
    html += `<div class="speaker-tabs" style="--tab-color:${color}">
      <button id="tabBtn_progress" class="speaker-tab-btn active" onclick="switchSpeakerTab('progress')">我的進度</button>
      ${hasSlides(act) ? `<button id="tabBtn_slides" class="speaker-tab-btn" onclick="switchSpeakerTab('slides')">我的簡報${_slidesUpd ? _slideDot : ''}</button>` : ''}
      ${!isConsultantView ? `<button id="tabBtn_guide" class="speaker-tab-btn" onclick="switchSpeakerTab('guide')">簡報攻略</button>` : ''}
      ${!isConsultantView ? `<button id="tabBtn_cases" class="speaker-tab-btn" onclick="switchSpeakerTab('cases')">簡報案例</button>` : ''}
    </div>
    ${!isConsultantView ? `<div id="tabGuide" style="display:none;">${renderGuide(act, color, pair)}</div>` : ''}
    ${!isConsultantView ? `<div id="tabCases" style="display:none;">${renderCasesTab(act, pair, color)}</div>` : ''}
    ${hasSlides(act) ? `<div id="tabSlides" style="display:none;">${renderSlidesTab(ck, speaker, pair, !locked)}</div>` : ''}
    <div id="tabProgress">`;
  }
  html += `<div class="speaker-info">
    <p>輔導講者：<strong>${speaker}</strong>${activityBadge(act, color)}${countBadge(pair, color)}</p>
    ${dates.length ? `<p style="font-size:13px;color:#888;margin-top:6px;">${dates.join('　')}</p>` : ''}
    ${countdownHtml(pair.presentationTime, act, color)}
    ${renderProgressBar(pct, progressColor)}
  </div>`;
  if (canEdit) {
    html += `<div id="tabTracking">
      ${hasSlides(act) ? `
        <div style="display:flex;gap:0;border-bottom:2px solid #f0f0f0;margin-bottom:12px;">
          <button id="tabBtn_progress" data-color="${color}" onclick="switchSpeakerTab('progress')"
            style="padding:8px 16px;border:none;background:none;font-size:13px;cursor:pointer;font-weight:bold;color:${color};border-bottom:2px solid ${color};margin-bottom:-2px;">進度</button>
          <button id="tabBtn_slides" data-color="${color}" onclick="switchSpeakerTab('slides')"
            style="padding:8px 16px;border:none;background:none;font-size:13px;cursor:pointer;color:#aaa;border-bottom:2px solid transparent;margin-bottom:-2px;">簡報內容${_slidesUpd ? _slideDot : ''}</button>
        </div>
        <div id="tabSlides" style="display:none;">${renderSlidesTab(ck, speaker, pair, true)}</div>
      ` : ''}
      <div id="tabProgress">`;
  }

  if (isSimpleType(act)) {
    // 簡化清單
    const _simpleUpd = _updatedPairs.has(`${ck}\t${speaker}\tsimple`);
    html += `<div class="week-card"><div class="week-header" style="background:${color}" onclick="toggleWeek('simple-body')"><div><h3>進度清單</h3><div class="week-sub">${act}</div></div><div style="display:flex;align-items:center;gap:6px;"><span>${done}/${total}</span>${_simpleUpd ? `<span id="weekDot_simple" class="week-update-dot" style="background:white;"></span>` : ''}</div></div><div class="week-body" id="simple-body">`;
    html += visibleSimpleTaskIndices(act).map(ti => {
      const t = SIMPLE_TASKS[ti];
      const checked = data[simpleTaskKey(ti)] ? 'checked' : '';
      const note = data[simpleNoteKey(ti)] || '';
      const cls = data[simpleTaskKey(ti)] ? 'checked' : '';
      const dis = canEdit ? '' : 'disabled';
      const noteUpd = _updatedPairs.has(`${ck}\t${speaker}\tsnote_${ti}`);
      const noteDot = noteUpd ? `<span id="snoteDot_${ti}" style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${color};margin-left:5px;flex-shrink:0;animation:dotPulse 1.4s ease-in-out infinite;vertical-align:middle;"></span>` : '';
      const noteFocus = noteUpd ? `clearSimpleNoteDot('${ck}','${speaker}',${ti});` : '';
      return `<div class="task-item">
        <input type="checkbox" class="task-check" id="scb_${ti}" ${checked} ${dis} style="accent-color:${color}" onchange="toggleTaskSimple('${ck}','${speaker}',${ti},this)">
        <div class="task-content">
          <div class="task-label ${cls}" id="slbl_${ti}" style="${cls ? `text-decoration-color:${color}` : ''}">${t}</div>
          ${noteUpd ? `<div style="display:flex;align-items:center;gap:3px;margin-top:2px;"><span style="font-size:10px;color:${color};font-weight:600;">備註更新</span>${noteDot}</div>` : ''}
          <textarea class="task-note" id="snote_${ti}" placeholder=""
            onchange="saveNoteSimple('${ck}','${speaker}',${ti},this.value)"
            onfocus="${noteFocus}this.style.borderColor='${color}'" onblur="this.style.borderColor=''">${note}</textarea>
        </div>
      </div>`;
    }).join('');
    html += `</div></div>`;
    if (canEdit) html += `<div style="margin-top:20px;padding-bottom:20px;"><button class="btn" style="background:${color}" onclick="saveAllTasks('${ck}','${speaker}')">儲存</button></div></div></div>`;
    if (!canEdit && !locked) html += `<div style="margin-top:16px;padding-bottom:20px;"><button class="btn" style="background:${color}" onclick="saveAllTasks('${ck}','${speaker}')">儲存備註</button></div>`;
  } else {
    // 6週進度
    const { currentWeekIdx } = getPresentationInfo(pair.presentationTime);
    html += `<div class="weeks-container">`;
    WEEKS.forEach((w, wi) => {
      const wT = w.tasks.length;
      const wD = w.tasks.filter((_, ti) => data[taskKey(wi, ti)]).length;
      const isCurWeek = wi === currentWeekIdx;
      const tasks = w.tasks.map((t, ti) => {
        const checked = data[taskKey(wi, ti)] ? 'checked' : '';
        const note = data[noteKey(wi, ti)] || '';
        const cls = data[taskKey(wi, ti)] ? 'checked' : '';
        const dis = canEdit ? '' : 'disabled';
        const taskUpd2 = _updatedPairs.has(`${ck}\t${speaker}\ttask_${wi}_${ti}`);
        const taskDot2 = taskUpd2 ? `<span id="taskDot_${wi}_${ti}" style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${color};margin-left:5px;flex-shrink:0;animation:dotPulse 1.4s ease-in-out infinite;vertical-align:middle;"></span>` : '';
        const noteUpd = _updatedPairs.has(`${ck}\t${speaker}\tnote_${wi}_${ti}`);
        const noteDot = noteUpd ? `<span id="noteDot_${wi}_${ti}" style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${color};margin-left:5px;flex-shrink:0;animation:dotPulse 1.4s ease-in-out infinite;vertical-align:middle;"></span>` : '';
        const noteFocus = noteUpd ? `clearNoteDot('${ck}','${speaker}',${wi},${ti});` : '';
        return `<div class="task-item">
          <input type="checkbox" class="task-check" id="cb_${wi}_${ti}" ${checked} ${dis} style="accent-color:${color}" onchange="toggleTask('${ck}','${speaker}',${wi},${ti},this)">
          <div class="task-content">
            <div class="task-label ${cls}" id="lbl_${wi}_${ti}" style="${cls ? `text-decoration-color:${color}` : ''}">${t}${taskDot2}</div>
            ${noteUpd ? `<div style="display:flex;align-items:center;gap:3px;margin-top:2px;"><span style="font-size:10px;color:${color};font-weight:600;">備註更新</span>${noteDot}</div>` : ''}
            <textarea class="task-note" id="note_${wi}_${ti}" placeholder="${WEEK_HINTS[wi]?.[ti] || ''}"
              onchange="saveNote('${ck}','${speaker}',${wi},${ti},this.value)"
              onfocus="${noteFocus}this.style.borderColor='${color}'" onblur="this.style.borderColor=''">${note}</textarea>
          </div>
        </div>`;
      }).join('');
      const _wkUpd = _updatedPairs.has(`${ck}\t${speaker}\tweek_${wi}`);
      html += `<div class="week-card" ${isCurWeek ? `style="border:2px solid ${color};"` : ''}>
        <div class="week-header" style="background:${color}" onclick="toggleWeek('wb_${wi}')">
          <div>
            <h3>${w.label}${isCurWeek ? ` <span style="font-size:11px;background:white;color:${color};border:1px solid ${color};border-radius:8px;padding:1px 7px;vertical-align:middle;">本週</span>` : ''}</h3>
            <div class="week-sub">${w.theme}</div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span id="wcount_${wi}">${wD}/${wT}</span>
            ${_wkUpd ? `<span id="weekDot_${wi}" class="week-update-dot" style="background:white;"></span>` : ''}
          </div>
        </div>
        <div class="week-body" id="wb_${wi}">${tasks}</div>
      </div>`;
    });
    html += `</div>`;
    if (canEdit) html += `<div style="margin-top:20px;padding-bottom:20px;"><button class="btn" onclick="saveAllTasks('${ck}','${speaker}')">儲存</button></div></div></div>`;
    if (!canEdit && !locked) html += `<div style="margin-top:16px;padding-bottom:20px;"><button class="btn" style="background:${color}" onclick="saveAllTasks('${ck}','${speaker}')">儲存備註</button></div>`;

    document.getElementById('mainContent').innerHTML = html;
    return;
  }

  document.getElementById('mainContent').innerHTML = html;
}

function logAction(event) {
  if (!currentUser) return;
  fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'log', name: currentUser, role: currentRole, event }) }).catch(() => {});
}

function toggleWeek(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('open');
  if (el.classList.contains('open')) {
    logAction('week_open');
    if (_viewingCk && _viewingSpeaker) {
      let dotId, dotKey;
      if (id === 'simple-body') {
        dotId = 'weekDot_simple';
        dotKey = `${_viewingCk}\t${_viewingSpeaker}\tsimple`;
      } else {
        const m = id.match(/^wb_(\d+)$/);
        if (m) { dotId = `weekDot_${m[1]}`; dotKey = `${_viewingCk}\t${_viewingSpeaker}\tweek_${m[1]}`; }
      }
      if (dotKey && _updatedPairs.has(dotKey)) {
        _updatedPairs.delete(dotKey);
        const dot = document.getElementById(dotId);
        if (dot) dot.remove();
        _clearPairDotIfDone(_viewingCk, _viewingSpeaker);
      }
    }
  } else {
    if (_viewingCk && _viewingSpeaker) {
      const m = id.match(/^wb_(\d+)$/);
      if (m) {
        const wi = parseInt(m[1]);
        WEEKS[wi]?.tasks.forEach((_, ti) => {
          const k = `${_viewingCk}\t${_viewingSpeaker}\ttask_${wi}_${ti}`;
          if (_updatedPairs.has(k)) {
            _updatedPairs.delete(k);
            const d = document.getElementById(`taskDot_${wi}_${ti}`);
            if (d) d.remove();
          }
        });
        _clearPairDotIfDone(_viewingCk, _viewingSpeaker);
      }
    }
  }
}

function switchConsultantTab(tab) {
  const tt = document.getElementById('tabTracking');
  const tc = document.getElementById('tabConsultantCases');
  if (tt) tt.style.display = tab === 'tracking' ? '' : 'none';
  if (tc) tc.style.display = tab === 'cases' ? '' : 'none';
  document.querySelectorAll('.speaker-tab-btn').forEach(b => {
    b.classList.toggle('active', b.id === 'tabBtn_' + tab);
  });
}

function switchCaseType(idx) {
  const CASE_TYPES = ['第1次', '第2次+', '主題日', 'BOD'];
  CASE_TYPES.forEach((_, i) => {
    const panel = document.getElementById('caseTypePanel_' + i);
    const btn = document.getElementById('caseTypeBtn_' + i);
    if (panel) panel.style.display = i === idx ? '' : 'none';
    if (btn) {
      const active = i === idx;
      btn.style.background = active ? 'var(--case-color, #c0392b)' : '#eee';
      btn.style.color = active ? 'white' : '#666';
    }
  });
}

function renderCasesAllTypes(color) {
  const c = color || '#c0392b';
  const CASE_TYPES = ['第1次', '第2次+', '主題日', 'BOD'];

  const btnHtml = CASE_TYPES.map((t, i) => `
    <button id="caseTypeBtn_${i}" onclick="switchCaseType(${i})"
      style="padding:7px 16px;border:none;border-radius:20px;cursor:pointer;font-size:13px;font-weight:600;transition:background 0.15s;
        ${i === 0 ? `background:${c};color:white;` : 'background:#eee;color:#666;'}">${t}</button>`
  ).join('');

  const panelsHtml = CASE_TYPES.map((type, i) => {
    const cases = getCases().filter(cs => cs.type === type)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    let cards = '';
    if (type === '主題日') {
      const grouped = {}, singles = [];
      cases.forEach((cs, idx) => {
        const name = (cs.themeDayName || '').trim();
        if (name) { if (!grouped[name]) grouped[name] = []; grouped[name].push({ cs, i: idx }); }
        else singles.push({ cs, i: idx });
      });
      Object.entries(grouped).forEach(([name, items]) => {
        if (items.length >= 2) {
          cards += makeSplitCard(items[0].cs, `caseAll_主題日_${items[0].i}_a`, items[1].cs, `caseAll_主題日_${items[1].i}_b`, name, c);
          items.slice(2).forEach(({ cs, i: idx }) => { cards += makeCaseCard(cs, `caseAll_主題日_${idx}`, c); });
        } else { cards += makeCaseCard(items[0].cs, `caseAll_主題日_${items[0].i}`, c); }
      });
      singles.forEach(({ cs, i: idx }) => { cards += makeCaseCard(cs, `caseAll_主題日s_${idx}`, c); });
    } else {
      cards = cases.map((cs, idx) => makeCaseCard(cs, `caseAll_${type}_${idx}`, c)).join('');
    }
    const content = cases.length
      ? `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;padding:4px 0;">${cards}</div>`
      : `<div style="padding:40px 20px;text-align:center;color:#bbb;font-size:14px;">尚無「${type}」的簡報案例</div>`;
    return `<div id="caseTypePanel_${i}" style="${i > 0 ? 'display:none;' : ''}">${content}</div>`;
  }).join('');

  return `
    <div style="--case-color:${c};display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">${btnHtml}</div>
    ${panelsHtml}
    <div id="caseModalOverlay" onclick="closeCaseModal()" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:3000;align-items:center;justify-content:center;">
      <div id="caseModalBox" onclick="event.stopPropagation()" style="background:white;border-radius:14px;width:92%;max-width:480px;max-height:88vh;overflow-y:auto;padding:18px;">
        <div id="caseModalContent"></div>
        <button onclick="closeCaseModal()" style="margin-top:12px;width:100%;padding:10px;border:none;border-radius:8px;background:#eee;color:#555;font-size:14px;cursor:pointer;">關閉</button>
      </div>
    </div>`;
}

function switchSpeakerTab(tab) {
  document.getElementById('tabProgress').style.display = tab === 'progress' ? '' : 'none';
  const tg = document.getElementById('tabGuide');
  if (tg) tg.style.display = tab === 'guide' ? '' : 'none';
  const ts = document.getElementById('tabSlides');
  if (ts) ts.style.display = tab === 'slides' ? '' : 'none';
  const tc = document.getElementById('tabCases');
  if (tc) tc.style.display = tab === 'cases' ? '' : 'none';
  document.querySelectorAll('.speaker-tab-btn').forEach(b => {
    b.classList.toggle('active', b.id === 'tabBtn_' + tab);
  });
  // 更新 inline-style 內層分頁按鈕（進度/簡報內容）
  ['progress', 'slides'].forEach(t => {
    const btn = document.getElementById('tabBtn_' + t);
    if (!btn || btn.classList.contains('speaker-tab-btn')) return;
    const active = t === tab;
    const color = btn.dataset.color || '#c0392b';
    btn.style.fontWeight = active ? 'bold' : 'normal';
    btn.style.color = active ? color : '#aaa';
    btn.style.borderBottom = active ? `2px solid ${color}` : '2px solid transparent';
  });
  if (tab === 'slides' && _viewingCk && _viewingSpeaker) {
    const sKey = `${_viewingCk}\t${_viewingSpeaker}\tslides`;
    if (_updatedPairs.has(sKey)) {
      _updatedPairs.delete(sKey);
      const dot = document.getElementById('slidesDot');
      if (dot) dot.remove();
      _clearPairDotIfDone(_viewingCk, _viewingSpeaker);
    }
  }
  if (tab === 'guide') logAction('view_guide');
  if (tab === 'cases') logAction('view_cases');
}

