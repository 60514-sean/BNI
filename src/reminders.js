// ===== REMINDERS =====
const REMINDER_FOOTER = '祝~今天順心優~❤️';

function buildReminderText(p) {
  const act = p.activityType || '主題簡報';
  const data = getData(p.consultant, p.speaker);
  const { currentWeekIdx } = getPresentationInfo(p.presentationTime);
  const givenName = speakerGivenName(p.consultant);

  const { total, done } = calcProgress(act, data);
  const pct = total ? Math.round(done / total * 100) : 0;

  const lines = [];
  lines.push(`☀️ ${givenName} 早安~`);
  lines.push(`這週幫你整理一下 ${p.speaker} 的進度`);
  lines.push('');

  if (pct === 100) {
    lines.push(`目前已全部完成 100%，${p.speaker} 做得很棒！`);
  } else {
    lines.push(`目前完成 ${pct}%了，不過還有一些項目需要處理，我幫你都整理好了，提供給你方便追蹤~`);
    lines.push('');

    if (isSimpleType(act)) {
      const incompleteCount = visibleSimpleTaskIndices(act).filter(ti => !data[simpleTaskKey(ti)]).length;
      if (incompleteCount > 0) lines.push(`${act} → 還差 ${incompleteCount} 項`);
    } else {
      // 只列當週之前（wi < currentWeekIdx）；未設日期則列全部
      const limit = currentWeekIdx >= 0 ? currentWeekIdx : WEEKS.length;
      WEEKS.forEach((w, wi) => {
        if (wi >= limit) return;
        const incompleteCount = w.tasks.filter((_, ti) => !data[taskKey(wi, ti)]).length;
        if (incompleteCount === 0) return;
        lines.push(`${w.label}｜${w.theme} → 還差 ${incompleteCount} 項`);
      });
    }
  }

  lines.push('');
  lines.push(REMINDER_FOOTER);
  return lines.join('\n');
}

function speakerGivenName(name) {
  return name && name.length >= 2 ? name.slice(-2) : name;
}

function getPct(p) {
  const act = p.activityType || '主題簡報';
  const { total, done } = calcProgress(act, getData(p.consultant, p.speaker));
  return total ? Math.round(done / total * 100) : 0;
}

function isPrevWeeksDone(p, currentWeekIdx, data) {
  const act = p.activityType || '主題簡報';
  if (isSimpleType(act)) return getPct(p) === 100;
  if (currentWeekIdx === 0) return false;
  const limit = currentWeekIdx >= 0 ? currentWeekIdx : WEEKS.length;
  for (let wi = 0; wi < limit; wi++) {
    if (WEEKS[wi].tasks.some((_, ti) => !data[taskKey(wi, ti)])) return false;
  }
  return true;
}

function buildGroupReminderText(consultant, pairs) {
  const givenName = speakerGivenName(consultant);
  const lines = [];
  lines.push(`☀️${givenName}早安~`);

  const enriched = pairs.map(p => ({
    p,
    act: p.activityType || '主題簡報',
    data: getData(p.consultant, p.speaker),
    weekIdx: getPresentationInfo(p.presentationTime).currentWeekIdx,
  }));

  const newGroup      = enriched.filter(e => e.weekIdx === 0);
  const praiseGroup   = enriched.filter(e => e.weekIdx !== 0 && isPrevWeeksDone(e.p, e.weekIdx, e.data));
  const incompleteGroup = enriched.filter(e => e.weekIdx !== 0 && !isPrevWeeksDone(e.p, e.weekIdx, e.data));

  if (praiseGroup.length > 0) {
    const names = praiseGroup.map(e => speakerGivenName(e.p.speaker)).join('、');
    lines.push(`感謝您上周的協助！${names}上週的進度都完成了，這週的進度也再麻煩您`);
  }

  if (incompleteGroup.length > 0) {
    if (praiseGroup.length > 0) {
      lines.push('');
      lines.push('【講者】上周還有一些內容沒完成，我列出來，方便您追蹤，如下:');
    } else {
      const introName = incompleteGroup.length === 1 ? speakerGivenName(incompleteGroup[0].p.speaker) + '的' : '講者的';
      lines.push(`感謝您上周的協助！這週幫你整理${introName}進度，提供給你方便追蹤~`);
    }
    lines.push('');
    incompleteGroup.forEach(({ p, act, data, weekIdx }, idx) => {
      lines.push(`【講者】${speakerGivenName(p.speaker)}`);
      if (isSimpleType(act)) {
        const cnt = visibleSimpleTaskIndices(act).filter(ti => !data[simpleTaskKey(ti)]).length;
        if (cnt > 0) lines.push(`${act} → 還差 ${cnt} 項`);
      } else {
        const limit = weekIdx >= 0 ? weekIdx : WEEKS.length;
        WEEKS.forEach((w, wi) => {
          if (wi >= limit) return;
          const cnt = w.tasks.filter((_, ti) => !data[taskKey(wi, ti)]).length;
          if (cnt > 0) lines.push(`${w.label} → 還差 ${cnt} 項`);
        });
      }
      if (idx < incompleteGroup.length - 1) lines.push('');
    });
  }

  if (newGroup.length > 0) {
    const names = newGroup.map(e => `【${speakerGivenName(e.p.speaker)}】`).join('');
    const hasOthers = praiseGroup.length > 0 || incompleteGroup.length > 0;
    if (hasOthers) {
      lines.push('');
      lines.push(`另外，這禮拜有分配新的講者${names}，這邊也提供追蹤網址，方便您來追蹤~`);
    } else {
      lines.push(`這禮拜有分配新的講者${names}給您，再麻煩您了，這邊也提供追蹤網址，方便您來追蹤~`);
    }
  }

  lines.push('');
  lines.push('追蹤網址：https://bni-navy.vercel.app/');
  lines.push(REMINDER_FOOTER);
  return lines.join('\n').replace(/\n{3,}/g, '\n\n');
}

function showReminders() {
  const pairs = _adminPairs.filter(p => {
    if (!p.consultant || !p.speaker) return false;
    const { currentWeekIdx } = getPresentationInfo(p.presentationTime);
    return currentWeekIdx !== -1;
  });
  if (pairs.length === 0) { showToast('尚未設定配對'); return; }

  // 依顧問分組
  const groups = {};
  const order = [];
  pairs.forEach(p => {
    if (!groups[p.consultant]) { groups[p.consultant] = []; order.push(p.consultant); }
    groups[p.consultant].push(p);
  });

  let html = '';
  order.forEach((consultant, gi) => {
    const gPairs = groups[consultant];
    const text = buildGroupReminderText(consultant, gPairs);
    const speakerLabels = gPairs.map(p => p.speaker).join('、');
    html += `
      <div style="border:1px solid #f0f0f0;border-radius:10px;padding:14px;margin-bottom:14px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <div>
            <span style="font-size:14px;font-weight:700;color:#222;">顧問 ${consultant}</span>
            <span style="font-size:12px;color:#aaa;margin-left:6px;">${speakerLabels}</span>
          </div>
          <button onclick="copyReminder(${gi},this)"
            style="padding:5px 14px;border:1px solid #c0392b;border-radius:6px;font-size:12px;cursor:pointer;background:white;color:#c0392b;font-weight:600;white-space:nowrap;">
            複製
          </button>
        </div>
        <pre id="reminderText_${gi}" style="font-family:inherit;font-size:12px;color:#444;background:#f8f8f8;border-radius:6px;padding:10px;white-space:pre-wrap;word-break:break-word;margin:0;">${text}</pre>
      </div>`;
  });
  document.getElementById('reminderModalBody').innerHTML = html;
  document.getElementById('reminderModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function copyReminder(i, btn) {
  const el = document.getElementById(`reminderText_${i}`);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).then(() => {
    const orig = btn.textContent;
    btn.textContent = '已複製！';
    btn.style.background = '#c0392b';
    btn.style.color = 'white';
    setTimeout(() => { btn.textContent = orig; btn.style.background = 'white'; btn.style.color = '#c0392b'; }, 1800);
  });
}

function closeReminderModal() {
  document.getElementById('reminderModal').classList.remove('open');
  document.body.style.overflow = '';
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 2500);
}
