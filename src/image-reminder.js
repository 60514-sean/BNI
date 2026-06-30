// ===== IMAGE REMINDER =====

const IMG_COLLAB = {
  0: [],
  1: ['麥莉', '網管'],
  2: ['大群'],
  3: ['秘財', '網管'],
  4: ['雲端'],
  5: []
};

// 每周進度內容（對應 PPTX，weekIdx 0=倒數5周…5=簡報當周）
const IMG_WEEK_CONTENT = [
  { items: [ // 倒數5周
    { t: '主題簡報輔導(簡報)' },
    { t: '構思EDM資訊，包含:', subs: ['1. 訂出主題', '2. 合作、理想、夢幻對象', '3. 提供形象照'] },
    { t: '與簡報者做過1次121' },
    { t: '報名「簡報工作坊」' },
    { t: '構思來賓名單', red: true }
  ]},
  { items: [ // 倒數4周
    { t: '周二前提供以下資訊', subs: ['1. EDM資訊', '2. 億展粉專貼文內容'] },
    { t: '製作簡報' },
    { t: '確認賓名單', red: true },
    { t: '每周40秒鋪成', red: true }
  ]},
  { items: [ // 倒數3周
    { t: '確認自己的EDM行銷海報' },
    { t: '發出行銷海報邀約來賓' },
    { t: '簡報完成與顧問做第一次re稿' },
    { t: '群組邀約適合的來賓', red: true },
    { t: '每週40秒舖陳', red: true }
  ]},
  { items: [ // 倒數2周
    { t: '與秘書財務約RE稿' },
    { t: '給貼文文案' },
    { t: '邀約來賓', red: true },
    { t: '每週40秒舖陳', red: true }
  ]},
  { items: [ // 倒數1周
    { t: '繳交最後定稿簡報' },
    { t: '確認出席來賓', red: true },
    { t: '每週40秒舖陳', red: true }
  ]},
  { items: [ // 簡報當周
    { t: '準備價值500$禮物 一人X1' },
    { t: '週五提早到場熟悉環境' },
    { t: '確認來賓出席', red: true },
    { t: '每週40秒舖陳', red: true }
  ]}
];

function _imgCutoffDate(presentationTime) {
  const p = presentationTime.split('/');
  if (p.length < 3) return null;
  const d = new Date(+p[0], +p[1]-1, +p[2]);
  d.setDate(d.getDate() - 10);
  return { m: d.getMonth()+1, d: d.getDate() };
}

function buildImageReminderCard() {
  const cfg = getConfig();
  const pairs = cfg.pairs
    .filter(p => p.consultant && p.speaker && p.presentationTime)
    .sort((a, b) => (a.presentationTime||'').localeCompare(b.presentationTime||''));

  if (pairs.length === 0) {
    return '<p style="color:#888;padding:20px;text-align:center;">尚未設定配對或簡報日期</p>';
  }

  // 同日合併
  const dateGroups = {};
  const dateOrder = [];
  pairs.forEach(p => {
    if (!dateGroups[p.presentationTime]) { dateGroups[p.presentationTime] = []; dateOrder.push(p.presentationTime); }
    dateGroups[p.presentationTime].push(p);
  });

  const RED = '#c0392b';
  const DARK = '#1a1a1a';
  const GRAY = '#b0b0b0';
  const weekLabels = ['倒數5周', '倒數4周', '倒數3周', '倒數2周', '倒數1周', '簡報當周'];

  const dateBlock = (m, d, color) =>
    `<div style="font-size:32px;font-weight:900;color:${color};line-height:1.2;text-align:center;letter-spacing:-0.5px;">
       <div>${m}</div><div>${d}</div>
     </div>`;

  let rows = '';
  dateOrder.forEach(dateKey => {
    const group = dateGroups[dateKey];
    const { currentWeekIdx, weeksDiff } = getPresentationInfo(dateKey);
    // 超過5週（weekIdx=-1）仍顯示為倒數5周
    const effectiveWeekIdx = currentWeekIdx >= 0 ? currentWeekIdx : (weeksDiff >= 0 ? 0 : -1);
    const isActive = effectiveWeekIdx >= 0;
    const isPast = weeksDiff < 0;

    const act = group[0].activityType || '主題簡報';
    const isSimple = isSimpleType(act);

    const dp = dateKey.split('/');
    const presM = dp.length >= 3 ? String(+dp[1]).padStart(2,'0') : '';
    const presD = dp.length >= 3 ? String(+dp[2]).padStart(2,'0') : '';

    let cutM = '', cutD = '';
    if (!isSimple) {
      const cut = _imgCutoffDate(dateKey);
      if (cut) { cutM = String(cut.m).padStart(2,'0'); cutD = String(cut.d).padStart(2,'0'); }
    }

    // 簡報日/講者/顧問/截稿日：只有 isPast 才轉灰，isSimple 維持原色
    const tc = isPast ? GRAY : DARK;
    // 倒數週數/任務：isPast 或 isSimple 都灰化
    const weekGray = isPast || isSimple;

    const weekLabel = isActive ? weekLabels[effectiveWeekIdx] : '已結束';
    const content = isActive ? IMG_WEEK_CONTENT[effectiveWeekIdx] : null;
    const collab = (isActive && !isSimple) ? (IMG_COLLAB[effectiveWeekIdx] || []) : [];

    const weekLabelColor = weekGray ? GRAY : RED;

    const speakerStr = group.map(p => p.speaker).join('\n');
    const consultantStr = group.map(p => '▶' + p.consultant).join('\n');

    let taskHtml = '';
    if (content) {
      taskHtml = content.items.map(item => {
        const ic = weekGray ? GRAY : (item.red ? RED : DARK);
        let h = `<div style="font-size:18px;font-weight:600;color:${ic};line-height:1.5;white-space:nowrap;">．${item.t}</div>`;
        if (item.subs) {
          h += item.subs.map(s =>
            `<div style="font-size:18px;font-weight:500;color:${ic};line-height:1.5;padding-left:18px;white-space:nowrap;">　${s}</div>`
          ).join('');
          h += `<div style="height:8px;"></div>`;
        }
        return h;
      }).join('');
    }

    const collabHtml = collab.map(c =>
      `<div style="font-size:18px;font-weight:700;color:${isPast ? GRAY : '#444'};white-space:nowrap;line-height:2;">→${c}</div>`
    ).join('');

    const BR = '1px solid #e2e2e2';
    const actColor = isPast ? GRAY : getActivityColor(act);

    // 每列前都插入活動名稱分隔列
    rows += `
      <tr>
        <td colspan="6" style="padding:10px 16px 5px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:18px;font-weight:800;color:${actColor};letter-spacing:0.5px;">${act}</span>
            <div style="flex:1;height:1.5px;background:${actColor};opacity:0.5;"></div>
          </div>
        </td>
      </tr>`;

    const rowTop = 'none';

    rows += `
      <tr>
        <td style="border-top:${rowTop};text-align:center;vertical-align:middle;padding:16px 4px;">
          ${presM ? dateBlock(presM, presD, tc) : ''}
        </td>
        <td style="border-top:${rowTop};text-align:center;vertical-align:middle;padding:16px 6px;">
          <div style="font-size:22px;font-weight:800;color:${tc};white-space:pre-line;line-height:1.45;">${speakerStr}</div>
        </td>
        <td style="border-top:${rowTop};text-align:center;vertical-align:middle;padding:16px 4px;font-size:22px;font-weight:700;color:${tc};white-space:pre-line;line-height:1.45;">${consultantStr}</td>
        <td style="border-top:${rowTop};text-align:center;vertical-align:middle;padding:16px 4px;">
          ${cutM ? dateBlock(cutM, cutD, RED) : ''}
        </td>
        <td style="border-top:${rowTop};vertical-align:top;padding:12px 14px 10px;">
          <div style="font-size:22px;font-weight:900;color:${weekLabelColor};margin-bottom:4px;-webkit-text-stroke:0.5px ${weekLabelColor};">${weekLabel}</div>
          ${taskHtml}
        </td>
        <td style="border-top:${rowTop};text-align:center;vertical-align:middle;padding:16px 6px;">
          ${collabHtml}
        </td>
      </tr>`;
  });

  const today = new Date();
  const todayStr = `${today.getFullYear()}/${String(today.getMonth()+1).padStart(2,'0')}/${String(today.getDate()).padStart(2,'0')}`;

  return `
    <div id="imageReminderCard" style="background:white;padding:22px 22px 0;font-family:'Microsoft JhengHei','PingFang TC','Noto Sans TC',sans-serif;width:900px;box-sizing:border-box;transform-origin:top left;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:0px;">
        <div style="font-size:25px;font-weight:900;color:#C00000;-webkit-text-stroke:0.4px #C00000;">未來6周主題簡報</div>
        <div style="font-size:25px;font-weight:900;color:#C00000;-webkit-text-stroke:0.4px #C00000;">億展白金分會</div>
      </div>
      <div style="font-size:48px;font-weight:900;color:#8E0000;line-height:1;margin-bottom:14px;letter-spacing:-1.5px;-webkit-text-stroke:0.4px #8E0000;">本周進度</div>

      <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
        <colgroup>
          <col style="width:10%">
          <col style="width:14%">
          <col style="width:15%">
          <col style="width:10%">
          <col style="width:40%">
          <col style="width:11%">
        </colgroup>
        <thead>
          <tr style="background:${RED};color:white;">
            <th style="padding:10px 4px;font-size:15px;font-weight:700;text-align:center;">簡報日</th>
            <th style="padding:10px 4px;font-size:15px;font-weight:700;text-align:center;">講者</th>
            <th style="padding:10px 4px;font-size:15px;font-weight:700;text-align:center;">顧問</th>
            <th style="padding:10px 4px;font-size:15px;font-weight:700;text-align:center;">截稿日</th>
            <th style="padding:10px 16px;font-size:15px;font-weight:700;text-align:left;">倒數週數/每周進度</th>
            <th style="padding:10px 4px;font-size:15px;font-weight:700;text-align:center;">協作</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="background:${RED};color:white;padding:12px 22px;font-size:15px;font-weight:700;letter-spacing:0.3px;margin:0 -22px;">
        ＊主題簡報檢核表-每周更新　${todayStr}
      </div>
    </div>`;
}

function _scaleImageReminderCard() {
  const card = document.getElementById('imageReminderCard');
  const body = document.getElementById('imageReminderBody');
  if (!card || !body) return;
  const CARD_W = 900;
  const availW = body.clientWidth || body.offsetWidth || window.innerWidth - 40;
  const scale = availW >= CARD_W ? 1 : availW / CARD_W;
  card.style.transform = scale < 1 ? `scale(${scale})` : '';
  card.style.transformOrigin = 'top left';
  // 9:16 最小高度（未縮放），body 高度配合縮放後尺寸
  const minH = Math.round(CARD_W * 16 / 9);
  card.style.minHeight = minH + 'px';
  body.style.height = Math.ceil(Math.max(card.offsetHeight, minH) * scale) + 'px';
}

function showImageReminder() {
  const body = document.getElementById('imageReminderBody');
  body.innerHTML = buildImageReminderCard();
  document.getElementById('imageReminderModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  // 雙 rAF 確保 DOM 完全 layout 後再計算 scale
  requestAnimationFrame(() => requestAnimationFrame(_scaleImageReminderCard));
}

function closeImageReminderModal() {
  document.getElementById('imageReminderModal').classList.remove('open');
  document.body.style.overflow = '';
}

async function exportImageReminderJPG() {
  const card = document.getElementById('imageReminderCard');
  if (!card) return;
  if (typeof html2canvas === 'undefined') { showToast('匯出模組載入中，請稍後再試'); return; }
  const btn = document.getElementById('imgExportBtn');
  if (btn) { btn.textContent = '匯出中...'; btn.disabled = true; }
  // 暫時移除 scale 以確保截圖為原始 900px 尺寸
  const prevTransform = card.style.transform;
  card.style.transform = '';
  await new Promise(r => requestAnimationFrame(r));
  try {
    const canvas = await html2canvas(card, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      width: card.offsetWidth,
      height: card.offsetHeight
    });
    const link = document.createElement('a');
    const today = new Date();
    const ds = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`;
    link.download = `BNI本周進度_${ds}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.93);
    link.click();
    showToast('JPG 已下載');
  } catch(e) {
    showToast('匯出失敗，請重試');
  }
  card.style.transform = prevTransform;
  if (btn) { btn.textContent = '另存JPG'; btn.disabled = false; }
}
