// ===== SLIDES =====
const SLIDES_V1 = [
  { title: '封面', hint: '主題名稱（EDM標題）、講者姓名', placeholder: '參考簡報攻略一' },
  { title: '我在做什麼', hint: '', placeholder: '介紹自己的服務項目、產品、品牌' },
  { title: '我為什麼做這個事業', hint: '', placeholder: '怎樣的契機讓你開始從事這份事業' },
  { title: '你最引以為傲的服務案例 1', hint: '', placeholder: '你最引以為傲的服務案例' },
  { title: '你最引以為傲的服務案例 2', hint: '', placeholder: '你最引以為傲的服務案例' },
  { title: '你最引以為傲的服務案例 3', hint: '', placeholder: '你最引以為傲的服務案例（若有時間可放）' },
  { title: '總結', hint: '', placeholder: '替上述做一個小總結，幫助聽眾收斂' },
  { title: '要求引薦 CTA', hint: '', placeholder: '參考簡報攻略二，列出合作對象、理想引薦、夢幻引薦，各自需要的行業別' },
  { title: '記憶口號', hint: '', placeholder: '每周簡報結尾的口號' },
];
const SLIDES_V2 = [
  { title: '封面', hint: '主題名稱（EDM標題）、講者姓名' },
  { title: '自我介紹 / 我在做什麼', hint: '' },
  { title: '獨特銷售主張', hint: '針對目標客群' },
  { title: '最佳 LCD', hint: '描述 + 案例 + 總結' },
  { title: '如何開啟交易對話', hint: '聽到 xxx，告訴他 ooo' },
  { title: '如何掌握引薦流程', hint: '常見 QA 2~3 個' },
  { title: '整體總結', hint: '' },
  { title: '要求引薦 CTA', hint: '' },
  { title: '記憶口號', hint: '' },
];
const SLIDES_V3 = [
  { title: '封面', hint: '主題名稱（EDM標題）、講者姓名' },
  { title: '我在做什麼', hint: '' },
  { title: '簡述自家產業', hint: '' },
  { title: '最佳 LCD', hint: '描述、案例、小總結' },
  { title: '目前在 BNI 億展分會產業鏈的連結', hint: '' },
  { title: '接下來期待發展的方向', hint: '' },
  { title: '總結', hint: '' },
  { title: '要求引薦 CTA', hint: '' },
  { title: '記憶口號', hint: '' },
];

const SLIDE_KEYS = s => s.map((_, i) => i === 0 ? 's0' : `s${i+1}`);
const SLIDE_KEYS_V1 = SLIDE_KEYS(SLIDES_V1);
const SLIDE_KEYS_V2 = SLIDE_KEYS(SLIDES_V2);
const SLIDE_KEYS_V3 = SLIDE_KEYS(SLIDES_V3);

function hasSlides(act) { const a = act || '主題簡報'; return a === '主題簡報' || a === '主題日'; }
function renderProgressBar(pct, color) {
  return `<div style="display:flex;align-items:center;gap:10px;margin-top:8px;"><div style="flex:1;background:#eee;border-radius:10px;height:8px;"><div style="width:${pct}%;background:${color};height:8px;border-radius:10px;transition:width .3s;"></div></div><span style="font-size:13px;font-weight:bold;color:${color};min-width:36px;">${pct}%</span></div>`;
}
function getSlidesData(ck, speaker) { return cache[`slides_${ck}_${speaker}`] || {}; }
async function saveSlidesData(ck, speaker, data) { await apiSave(`slides_${ck}_${speaker}`, data); }

function renderSlidesTab(ck, speaker, pair, canWrite) {
  const act = pair.activityType || '主題簡報';
  let slides, archName, keys;
  if (act === '主題日') {
    slides = SLIDES_V3; archName = '攻略三-4（主題日）'; keys = SLIDE_KEYS_V3;
  } else {
    const cnt = pair.presentationCount || '第1次';
    slides = cnt === '第1次' ? SLIDES_V1 : SLIDES_V2;
    archName = cnt === '第1次' ? '333 架構（第1次）' : '主題簡報架構（第2次+）';
    keys = cnt === '第1次' ? SLIDE_KEYS_V1 : SLIDE_KEYS_V2;
  }
  const data = getSlidesData(ck, speaker);
  const color = getActivityColor(pair.activityType);
  const pairId = `${ck}\t${speaker}`;
  const fields = slides.map((s, i) => {
    let rawVal;
    const fieldKeys = i === 0 ? ['s0', 's1'] : [keys[i]];
    if (i === 0) {
      const v0 = data['s0'] || '';
      const v1 = data['s1'] || '';
      rawVal = (v0 && v1) ? v0 + '\n' + v1 : (v0 || v1);
    } else {
      rawVal = data[keys[i]] || '';
    }
    const val = rawVal.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const hintText = s.hint ? ` — ${s.hint}` : '';
    const hasUpdate = fieldKeys.some(k => _updatedPairs.has(`${pairId}\tslide_${k}`));
    const updBadge = hasUpdate
      ? `<span id="slideDot_${i}" style="display:inline-flex;align-items:center;gap:4px;margin-left:8px;cursor:pointer;" onclick="clearSlideDot('${ck}','${speaker}',${i},'${fieldKeys.join(',')}')">
          <span style="font-size:10px;font-weight:600;color:${color};">已更新</span>
          <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${color};animation:dotPulse 1.4s ease-in-out infinite;flex-shrink:0;"></span>
        </span>`
      : '';
    const clearDotFn = hasUpdate ? `clearSlideDot('${ck}','${speaker}',${i},'${fieldKeys.join(',')}');` : '';
    return `<div style="margin-bottom:14px;">
      <div style="font-size:13px;font-weight:600;color:${color};margin-bottom:4px;display:flex;align-items:center;flex-wrap:wrap;">${i+1}. ${s.title}<span style="font-weight:400;color:#999;font-size:12px;">${hintText}</span>${updBadge}</div>
      <textarea id="slide_${i}" ${canWrite?'':'disabled'} onchange="saveSlide('${ck}','${speaker}','${keys[i]}',this.value)" onfocus="${clearDotFn}"
        placeholder="${s.placeholder||''}"
        style="width:100%;border:1px solid ${hasUpdate?color:'#e0e0e0'};border-radius:6px;padding:8px 10px;font-size:13px;resize:vertical;min-height:60px;outline:none;font-family:inherit;${canWrite?'':'background:#fafafa;color:#888;'}">${val}</textarea>
    </div>`;
  }).join('');
  return `<div style="font-size:12px;color:#888;margin-bottom:10px;">架構：${archName}</div>
    ${fields}
    ${canWrite ? `<div style="padding-bottom:20px;"><button class="btn" style="background:${color}" onclick="saveAllSlides('${ck}','${speaker}','${keys.join(',')}')">儲存簡報內容</button></div>` : ''}`;
}

async function saveSlide(ck, speaker, key, val) {
  const data = getSlidesData(ck, speaker);
  data[key] = val;
  saveSlidesData(ck, speaker, data);
}

async function saveAllSlides(ck, speaker, keysStr) {
  const data = getSlidesData(ck, speaker);
  keysStr.split(',').forEach((key, i) => {
    const ta = document.getElementById(`slide_${i}`);
    if (ta) data[key] = ta.value;
  });
  saveSlidesData(ck, speaker, data);
  showToast('簡報內容已儲存！');
}

function clearDot(ck, speaker, keys, dotId) {
  keys.forEach(k => _updatedPairs.delete(`${ck}\t${speaker}\t${k}`));
  const dot = document.getElementById(dotId);
  if (dot) dot.remove();
  _clearPairDotIfDone(ck, speaker);
}
function clearSlideDot(ck, speaker, i, keysStr) { clearDot(ck, speaker, keysStr.split(',').map(k => `slide_${k}`), `slideDot_${i}`); }
function clearNoteDot(ck, speaker, wi, ti) { clearDot(ck, speaker, [`note_${wi}_${ti}`], `noteDot_${wi}_${ti}`); }
function clearRNoteDot(ck, speaker, wi, ti) { clearDot(ck, speaker, [`note_${wi}_${ti}`], `rnoteDot_${wi}_${ti}`); }
function clearSimpleNoteDot(ck, speaker, ti) { clearDot(ck, speaker, [`snote_${ti}`], `snoteDot_${ti}`); }
function ackSimpleNoteDot(ck, speaker, ti) { clearDot(ck, speaker, [`snote_${ti}`], `rsnoteDot_${ti}`); }

