// ===== DATE PICKER HELPER =====
function getPresentationInfo(presentationTime) {
  if (!presentationTime) return { countdown: null, currentWeekIdx: -1 };
  const parts = presentationTime.split('/');
  if (parts.length < 3) return { countdown: null, currentWeekIdx: -1 };
  const presDate = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
  const today = new Date(); today.setHours(0,0,0,0); presDate.setHours(0,0,0,0);
  const diffDays = Math.round((presDate - today) / (1000*60*60*24));
  // 依日曆週（週一起、週日終）計算週次差
  const presWeekStart = new Date(presDate);
  presWeekStart.setDate(presDate.getDate() - ((presDate.getDay() + 6) % 7));
  const todayWeekStart = new Date(today);
  todayWeekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const weeksDiff = Math.round((presWeekStart - todayWeekStart) / (1000*60*60*24*7));
  let weekIdx = -1;
  if (weeksDiff === 0) weekIdx = 5;      // 當週
  else if (weeksDiff === 1) weekIdx = 4; // 倒數1週
  else if (weeksDiff === 2) weekIdx = 3; // 倒數2週
  else if (weeksDiff === 3) weekIdx = 2; // 倒數3週
  else if (weeksDiff === 4) weekIdx = 1; // 倒數4週
  else if (weeksDiff === 5) weekIdx = 0; // 倒數5週
  return { countdown: diffDays, currentWeekIdx: weekIdx, weeksDiff };
}

function isPairLocked(pair) {
  if (!pair.presentationTime) return false;
  const { weeksDiff } = getPresentationInfo(pair.presentationTime);
  return weeksDiff > LOCK_WEEKS_THRESHOLD;
}

function countdownHtml(presentationTime, act, color) {
  const { countdown, currentWeekIdx } = getPresentationInfo(presentationTime);
  if (countdown === null) return '';
  const c = color || '#c0392b';
  let cdText, cdStyle;
  if (countdown > 0) {
    cdText = `倒數 ${countdown} 天`;
    cdStyle = `background:${c}15;color:${c};border:1px solid ${c}40;`;
  } else if (countdown === 0) {
    cdText = '就是今天！';
    cdStyle = `background:${c};color:white;border:1px solid ${c};`;
  } else {
    cdText = `已過 ${Math.abs(countdown)} 天`;
    cdStyle = `background:#f5f5f5;color:#999;border:1px solid #ddd;`;
  }
  const wkHtml = (!isSimpleType(act) && currentWeekIdx >= 0)
    ? `<span style="padding:2px 8px;border-radius:10px;font-size:11px;background:${c};color:white;">當前：${WEEKS[currentWeekIdx].label}</span>`
    : '';
  return `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">
    <span style="padding:2px 8px;border-radius:10px;font-size:11px;${cdStyle}">${cdText}</span>
    ${wkHtml}
  </div>`;
}

function getUpcomingFridays(count) {
  const dates = [], d = new Date();
  d.setHours(0,0,0,0);
  const diff = (5 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  for (let k = 0; k < count; k++) {
    dates.push(`${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`);
    d.setDate(d.getDate() + 7);
  }
  return dates;
}

function makeDatePicker(i, field, label, value, hidden) {
  if (field === 3) {
    // Friday quick-select for 簡報時間
    const fridays = getUpcomingFridays(10);
    return `<div style="display:${hidden?'none':'block'};margin-top:10px;" id="dateRow_${i}_${field}">
      <label style="font-size:12px;color:#555;display:block;margin-bottom:4px;">${label}</label>
      <div style="position:relative;">
        <button type="button" onclick="toggleDatePanel(${i},${field})" id="dateBtn_${i}_${field}"
          style="width:100%;text-align:left;padding:6px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px;background:white;cursor:pointer;color:${value?'#333':'#bbb'};">
          ${value||'選擇日期'}
        </button>
        <div id="datePanel_${i}_${field}" style="display:none;position:absolute;top:34px;left:0;background:white;border:1px solid #ddd;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.12);z-index:300;padding:12px;min-width:240px;">
          <div style="font-size:11px;color:#888;margin-bottom:6px;font-weight:bold;">快速選擇（週五）</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;">
            ${fridays.map(d=>`<button type="button" onclick="quickSelectDate(${i},${field},'${d}')" style="padding:4px 8px;border:1px solid #ddd;border-radius:4px;font-size:12px;cursor:pointer;background:white;" onmouseover="this.style.background='#fdf0f0';this.style.borderColor='#c0392b'" onmouseout="this.style.background='white';this.style.borderColor='#ddd'">${d}</button>`).join('')}
          </div>
        </div>
      </div>
      <input type="hidden" id="time${field}_${i}" value="${value||''}" />
    </div>`;
  } else {
    // Year/Month/Day dropdowns for 繳交簡報 and 線上RE稿
    const curYear = new Date().getFullYear();
    const parts = value ? value.split('/') : [];
    const selYear = parts[0] ? parseInt(parts[0]) : curYear;
    const selMonth = parts[1] ? parseInt(parts[1]) : 0;
    const selDay = parts[2] ? parseInt(parts[2]) : 0;
    const years = [curYear, curYear+1];
    const months = Array.from({length:12}, (_,k) => k+1);
    const days = Array.from({length:31}, (_,k) => k+1);
    return `<div style="display:${hidden?'none':'block'};margin-top:10px;" id="dateRow_${i}_${field}">
      <label style="font-size:12px;color:#555;display:block;margin-bottom:4px;">${label}</label>
      <div style="display:flex;gap:6px;align-items:center;">
        <select id="yr_${i}_${field}" onchange="syncYMD(${i},${field})" style="padding:5px 6px;border:1px solid #ddd;border-radius:6px;font-size:13px;flex:2;">
          ${years.map(y=>`<option value="${y}" ${selYear===y?'selected':''}>${y}年</option>`).join('')}
        </select>
        <select id="mo_${i}_${field}" onchange="syncYMD(${i},${field})" style="padding:5px 6px;border:1px solid #ddd;border-radius:6px;font-size:13px;flex:1.5;">
          <option value="0" ${selMonth===0?'selected':''}>月</option>
          ${months.map(m=>`<option value="${m}" ${selMonth===m?'selected':''}>${m}月</option>`).join('')}
        </select>
        <select id="dy_${i}_${field}" onchange="syncYMD(${i},${field})" style="padding:5px 6px;border:1px solid #ddd;border-radius:6px;font-size:13px;flex:1.5;">
          <option value="0" ${selDay===0?'selected':''}>日</option>
          ${days.map(d=>`<option value="${d}" ${selDay===d?'selected':''}>${d}日</option>`).join('')}
        </select>
      </div>
      <input type="hidden" id="time${field}_${i}" value="${value||''}" />
    </div>`;
  }
}

function syncYMD(i, field) {
  const yr = document.getElementById(`yr_${i}_${field}`)?.value || '';
  const mo = document.getElementById(`mo_${i}_${field}`)?.value || '0';
  const dy = document.getElementById(`dy_${i}_${field}`)?.value || '0';
  const hidden = document.getElementById(`time${field}_${i}`);
  if (hidden) {
    if (mo !== '0' && dy !== '0') {
      const mm = mo.padStart(2,'0');
      const dd = dy.padStart(2,'0');
      hidden.value = `${yr}/${mm}/${dd}`;
    } else {
      hidden.value = '';
    }
  }
}

function toggleDatePanel(i, field) {
  const id = `datePanel_${i}_${field}`;
  document.querySelectorAll('[id^="datePanel_"]').forEach(el => { if (el.id !== id) el.style.display = 'none'; });
  const panel = document.getElementById(id);
  if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function quickSelectDate(i, field, date) {
  document.getElementById(`time${field}_${i}`).value = date;
  const btn = document.getElementById(`dateBtn_${i}_${field}`);
  if (btn) { btn.textContent = date; btn.style.color = '#333'; }
  const parts = date.split('/');
  const yr = document.getElementById(`yr_${i}_${field}`);
  const mo = document.getElementById(`mo_${i}_${field}`);
  const dy = document.getElementById(`dy_${i}_${field}`);
  if (yr) yr.value = parts[0];
  if (mo) mo.value = parts[1];
  if (dy) dy.value = parts[2];
  document.getElementById(`datePanel_${i}_${field}`).style.display = 'none';
}


document.addEventListener('click', e => {
  if (!e.target.closest('[id^="datePanel_"]') && !e.target.closest('[id^="dateBtn_"]')) {
    document.querySelectorAll('[id^="datePanel_"]').forEach(el => el.style.display = 'none');
  }
});

function onActivityChange(i) {
  const act = document.getElementById(`act_${i}`)?.value || '主題簡報';
  const sel = document.getElementById(`act_${i}`);
  if (sel) sel.style.color = getActivityColor(act);
  const simple = isSimpleType(act);
  [1, 2].forEach(f => {
    const row = document.getElementById(`dateRow_${i}_${f}`);
    if (row) row.style.display = simple ? 'block' : 'none';
  });
  const row3 = document.getElementById(`dateRow_${i}_3`);
  if (row3) row3.style.display = 'block';
  const cntSel = document.getElementById(`cnt_${i}`);
  if (cntSel) cntSel.style.display = act === '主題簡報' ? '' : 'none';
}

