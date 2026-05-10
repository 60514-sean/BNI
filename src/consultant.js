// ===== CONSULTANT GUIDE (一頁式介紹：會員為什麼要做主題簡報) =====
// 配色：BNI 紅為主、深灰 DARK 給深底卡片、米白/白交錯、灰階文字
// 卡片用 CARD_FX：圓角 12 + 淺陰影，對齊顧問系統 .card / .guide-section 風格
function renderConsultantGuide() {
  const NAVY = '#c0392b';      // 主色（原深藍替換為 BNI 紅，所有 NAVY 引用自動套用）
  const RED = '#c0392b';       // 強調色（同主色）
  const DARK = '#1a1a2e';      // 深底卡片背景色（給顧問提問、9981 工具、還是不確定）
  const CREAM = '#f8f5f0';
  const INK = '#222';
  const MUTE = '#888';
  const LINE = '#e8e8e8';
  const CARD_FX = 'border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);';

  // 章節指示器：已停用（取消顯示中文章節標）
  // 為了向後相容既有呼叫，保留函式但回傳空字串
  const chapterMark = (num, title, dark) => '';

  // 條列小區塊（給方向選擇卡用）
  const listSection = (label, items) => `
    <div style="margin-bottom:24px;">
      <div style="font-size:13px;color:${NAVY};font-weight:800;margin-bottom:12px;letter-spacing:.5px;">${label}</div>
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:9px;">
        ${items.map(t => `<li style="font-size:14px;color:${INK};line-height:1.75;padding-left:18px;position:relative;"><span style="position:absolute;left:0;top:.75em;width:8px;height:1px;background:${MUTE};"></span>${t}</li>`).join('')}
      </ul>
    </div>`;

  // SVG icon helper：線稿風，stroke 1.6，回傳完整 svg 字串
  // viewBox 24 24，stroke 套色。只保留實際使用中的 icon
  const icon = (name, size = 40, color = NAVY) => {
    const paths = {
      target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2.2" fill="' + color + '"/>',
      mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
      ear: '<path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7-3"/><path d="M9 9a3 3 0 0 1 6 0"/>',
      chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    };
    const p = paths[name] || '';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  };

  // 圓形 icon 容器（icon 包在圓內，給卡片頂部用）
  const iconCircle = (name, size = 70) => `
    <div style="width:${size}px;height:${size}px;border-radius:50%;background:${CREAM};display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">
      ${icon(name, Math.round(size * 0.5))}
    </div>`;

  // 規範 banner：講者要遵守的字數/數量規則
  const ruleBanner = (text) => `
    <div style="margin-top:46px;padding:14px 22px;background:${CREAM};border-left:3px solid ${RED};display:flex;align-items:center;gap:14px;border-radius:0 8px 8px 0;">
      <div style="font-size:11px;color:${RED};font-weight:700;letter-spacing:3px;flex-shrink:0;">規範</div>
      <div style="width:1px;height:14px;background:${LINE};flex-shrink:0;"></div>
      <div style="font-size:14px;color:${NAVY};font-weight:700;line-height:1.6;">${text}</div>
    </div>`;

  // 顧問提問區（可收合，紅色框）
  const consultantPrompt = (qs) => `
    <div class="consultant-prompt" style="margin-top:40px;border:1.5px solid ${RED};border-radius:8px;overflow:hidden;background:white;">
      <div onclick="toggleConsultantPrompt(this)" style="padding:14px 20px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;color:${RED};">
        <span style="font-size:13px;font-weight:700;letter-spacing:3px;">給顧問・引導提問</span>
        <span class="cp-toggle" style="font-size:20px;font-weight:300;line-height:1;transition:transform .2s;">+</span>
      </div>
      <div class="cp-body" style="display:none;padding:6px 22px 22px;border-top:1px solid #fdecea;">
        <ul style="list-style:none;padding:0;margin:14px 0 0;display:flex;flex-direction:column;gap:12px;">
          ${qs.map(q => `<li style="font-size:14px;line-height:1.85;color:${INK};padding-left:20px;position:relative;">
            <span style="position:absolute;left:0;top:.5em;color:${RED};font-weight:700;">→</span>${q}
          </li>`).join('')}
        </ul>
      </div>
    </div>`;

  // 步驟章節 section header（共用）
  const stepHeader = (chapNum, chapShort, lead, subtitle) => `
    ${chapterMark(chapNum, chapShort)}
    <div style="text-align:center;margin-bottom:50px;">
      <h2 style="font-size:30px;color:${NAVY};margin:0 0 14px;font-weight:800;letter-spacing:-1px;line-height:1.5;">${lead}</h2>
      ${subtitle ? `<p style="font-size:15px;color:${MUTE};margin:0;line-height:1.85;">${subtitle}</p>` : ''}
    </div>`;

  // 下一章引導（章節結尾，1-indexed，第 9 章後沒有下一章）
  const chapterLabels = ['誠實面對','為了誰','行動','選方向','主題','對象','架構','禮物','上台'];
  const nextHint = (n) => n >= 9 ? '' : `
    <div style="text-align:center;margin-top:60px;padding-top:30px;border-top:1px solid ${LINE};">
      <button onclick="scrollToChapter(${n+1})"
        style="background:none;border:none;color:${RED};font-size:13px;font-weight:700;cursor:pointer;letter-spacing:2px;padding:8px 20px;">
        下一章 ・ ${chapterLabels[n]} →
      </button>
    </div>`;

  // 三份禮物（直式排列）
  const gifts = [
    {
      num: '01',
      title: '送給夥伴',
      sub: '讓夥伴真的會引薦你',
      iconName: 'handover',
      body: `夥伴不是不想引薦你，是不知道怎麼介紹你。<br>
        主題簡報就是你親手寫好的「推薦腳本」，讓夥伴拿著就能賣。`,
      compare: [
        { tag: '沒做好', text: '「他是做保險的啦，你要不要找他？」', muted: true },
        { tag: '做好了', text: '「我認識一個保險顧問，專門幫科技業老闆規劃稅務，我朋友找他省了 80 萬。」', muted: false },
      ],
      quote: '30 秒讓人記得，5 分鐘讓人相信',
      bg: 'white',
    },
    {
      num: '02',
      title: '送給來賓',
      sub: '展現分會的專業門面',
      iconName: 'badge',
      body: `來賓那天看到的分會，就是「他想不想加入」的全部判斷。30 秒簡報像名片，主題簡報像作品集。`,
      compare: null,
      quote: '你的簡報，就是分會的門面',
      bg: CREAM,
    },
    {
      num: '03',
      title: '送給自己',
      sub: '我獨自升級',
      iconName: 'growth',
      body: `老闆們每天忙著做生意，但有多久沒好好整理過自己的事業了？<br>
        主題簡報是 BNI 半強迫送你的禮物——<br>
        一年一兩次，逼自己停下來想：我的核心價值是什麼？我的客戶是誰？`,
      compare: null,
      quote: '講得清楚的人，事業才走得遠',
      bg: 'white',
    },
  ];

  const giftSections = gifts.map(g => {
    const compareHtml = g.compare ? `
      <div style="margin-top:36px;display:flex;flex-direction:column;gap:14px;">
        ${g.compare.map(c => `
          <div style="display:flex;gap:16px;align-items:flex-start;">
            <div style="flex-shrink:0;font-size:10px;letter-spacing:2px;font-weight:700;color:${c.muted ? MUTE : RED};padding-top:4px;width:50px;">${c.tag}</div>
            <div style="flex:1;font-size:15px;line-height:1.8;color:${c.muted ? MUTE : INK};${c.muted ? 'text-decoration:line-through;text-decoration-color:#ccc;' : 'font-weight:600;'}">${c.text}</div>
          </div>
        `).join('')}
      </div>` : '';
    return `
    <section style="background:${g.bg};padding:90px 24px;">
      <div style="max-width:640px;margin:0 auto;">
        <div style="display:flex;align-items:baseline;gap:18px;margin-bottom:30px;">
          <div style="font-size:48px;font-weight:800;color:${NAVY};line-height:1;letter-spacing:-2px;">${g.num}</div>
          <div style="height:1px;flex:1;background:${LINE};"></div>
        </div>
        <h3 style="font-size:32px;color:${NAVY};margin:0 0 8px;font-weight:800;letter-spacing:-1px;">${g.title}</h3>
        <p style="color:${MUTE};font-size:14px;margin:0 0 28px;font-weight:600;letter-spacing:1px;">${g.sub}</p>
        <p style="font-size:16px;line-height:2;color:${INK};margin:0;">${g.body}</p>
        ${compareHtml}
        <div style="margin-top:50px;padding:30px 0 0;border-top:1px solid ${LINE};text-align:center;">
          <div style="font-size:20px;color:${NAVY};font-weight:700;line-height:1.6;letter-spacing:.5px;">「${g.quote}」</div>
        </div>
        <!-- 預留位置：之後可填入會員真實案例 / 引薦數據 -->
        <div style="margin-top:24px;padding:14px 16px;border:1px dashed #d8d8d8;border-radius:6px;background:#fafafa;text-align:center;font-size:11px;color:#bbb;letter-spacing:.5px;line-height:1.6;">
          ＋ 此處可填入會員真實案例 / 引薦數據
        </div>
      </div>
    </section>`;
  }).join('');

  // 兩個行動（聽眾的「簡報當下」+「散會後」合併在第 2 點）
  const actions = [
    {
      num: '01',
      when: '當你是講者',
      iconName: 'mic',
      text: '把主題簡報當成「寫給夥伴的銷售腳本」來準備，不是「介紹我的公司」。'
    },
    {
      num: '02',
      when: '當你是聽眾',
      iconName: 'ear',
      text: `<strong style="color:${NAVY};">簡報當下：</strong>手機收起來，筆記拿出來。寫下「這個情境我可以幫他引薦」的那一刻。<br><br><strong style="color:${NAVY};">散會後：</strong>走過去跟今天的講者說：<br>「你剛剛講的那個 ___，我想到一個人可以介紹給你。」`
    },
  ];
  const actionRows = actions.map((a, i) => `
    <div style="display:flex;gap:20px;align-items:flex-start;padding:30px 0;${i < actions.length - 1 ? `border-bottom:1px solid ${LINE};` : ''}">
      ${iconCircle(a.iconName, 56)}
      <div style="flex:1;">
        <div style="font-size:11px;color:${MUTE};font-weight:700;letter-spacing:3px;margin-bottom:4px;">${a.num}</div>
        <div style="font-size:16px;color:${NAVY};font-weight:800;margin-bottom:10px;">${a.when}</div>
        <div style="font-size:15px;color:${INK};line-height:1.9;">${a.text}</div>
      </div>
    </div>
  `).join('');

  return `
  <style>
    @media (max-width: 380px) {
      #simguide h1 { font-size: 24px !important; line-height: 1.5 !important; }
      #simguide h2 { font-size: 22px !important; }
      #simguide h3 { font-size: 19px !important; }
      #guideDots { padding: 10px 12px !important; gap: 12px !important; }
    }
    /* 目錄手機緊湊版：2 欄、隱藏副標、縮 padding */
    @media (max-width: 540px) {
      .toc-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
      .toc-item { padding: 18px 14px !important; }
      .toc-item .toc-num { font-size: 22px !important; }
      .toc-item .toc-title { font-size: 17px !important; }
      .toc-item .toc-desc { display: none !important; }
    }
  </style>
  <div id="simguide" style="margin:-16px -20px 0;color:${INK};font-family:inherit;">

    <!-- ============ 區塊 1：Hero ============ -->
    <section style="background:${NAVY};padding:90px 30px 80px;text-align:center;">
      <div style="width:32px;height:1px;background:white;opacity:.4;margin:0 auto 30px;"></div>
      <h1 style="color:white;font-size:32px;font-weight:800;line-height:1.5;margin:0 0 22px;letter-spacing:-.5px;">
        主題簡報不只是<br>「上台 5 分鐘」
      </h1>
      <div style="width:32px;height:1px;background:white;opacity:.3;margin:28px auto;"></div>
      <p style="color:white;opacity:.85;font-size:15px;margin:0;line-height:2;font-weight:300;letter-spacing:.5px;">
        是送給夥伴、來賓、自己的<br>
        <span style="font-weight:700;opacity:1;">三份禮物</span>
      </p>
      <!-- 預留：金句 / 個人故事引言 -->
      <!-- 預留：CTA 按鈕（例如「往下看」「立刻準備我的主題簡報」） -->
    </section>

    <!-- ============ 區塊 2：開場提問（章節 1，序章性質，放在目錄前）============ -->
    <section id="gchap1" data-chap="1" style="padding:80px 30px 60px;background:white;border-top:4px solid ${RED};scroll-margin-top:120px;">
      ${chapterMark('一', '思考')}
      <div style="max-width:540px;margin:0 auto;text-align:center;">
        <p style="font-size:26px;color:${NAVY};font-weight:700;line-height:2.2;margin:0;letter-spacing:.5px;">
          上週做主題簡報的是誰？<br>
          他講了什麼？<br>
          那再上一週呢？
        </p>
      </div>
    </section>

    <!-- ============ 目錄（章節 1 之後、章節 2 之前；列出章節 2-9 共 8 項）============ -->
    <section style="background:white;padding:30px 24px 70px;">
      <div class="toc-grid" style="max-width:880px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;">
        ${[
          { chap: 2, t: '為了誰',   d: '上台 5 分鐘，到底為了誰？' },
          { chap: 3, t: '行動',     d: '從今天起，做這兩件事' },
          { chap: 4, t: '選方向',   d: '引薦或合作，先選一個' },
          { chap: 5, t: '主題',     d: '怎麼設定吸引人的主題' },
          { chap: 6, t: '對象',     d: '把引薦對象說清楚' },
          { chap: 7, t: '架構',     d: '怎麼安排你的 5 分鐘' },
          { chap: 8, t: '禮物',     d: '別忘了你的抽獎禮物' },
          { chap: 9, t: '上台',     d: '上台前記住這 7 件事' },
        ].map((item, i) => `
          <button class="toc-item" onclick="scrollToChapter(${item.chap})" onmouseover="this.style.borderColor='${RED}';this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='${LINE}';this.style.transform=''"
            style="background:white;padding:26px 24px;border:1px solid ${LINE};border-radius:10px;cursor:pointer;text-align:left;transition:all .2s;font-family:inherit;${CARD_FX}">
            <div style="display:flex;align-items:baseline;gap:16px;margin-bottom:10px;">
              <div class="toc-num" style="font-size:30px;color:${NAVY};font-weight:800;line-height:1;letter-spacing:-1.5px;">0${i+1}</div>
              <div class="toc-title" style="font-size:21px;color:${NAVY};font-weight:800;line-height:1.3;letter-spacing:-.5px;">${item.t}</div>
            </div>
            <div class="toc-desc" style="font-size:15px;color:${MUTE};line-height:1.7;">${item.d}</div>
          </button>
        `).join('')}
      </div>
    </section>

    <!-- ============ 區塊 3：三份禮物（章節 2）============ -->
    <section id="gchap2" data-chap="2" style="padding:80px 30px 60px;background:${CREAM};text-align:center;border-top:4px solid ${RED};scroll-margin-top:120px;">
      ${chapterMark('二', '為什麼')}
      <h2 style="font-size:30px;color:${NAVY};margin:0 0 16px;font-weight:800;letter-spacing:-1px;line-height:1.5;">
        上台 5 分鐘，<br>到底為了誰？
      </h2>
      <p style="font-size:15px;color:${MUTE};margin:0;line-height:1.85;max-width:480px;margin-left:auto;margin-right:auto;">
        答案是：你、夥伴、來賓 — 三個人。
      </p>
      <div style="width:32px;height:1px;background:${NAVY};opacity:.3;margin:30px auto 0;"></div>
    </section>
    ${giftSections}
    <!-- 章節 2 結尾下一章引導 -->
    <section style="background:white;padding:0 24px 70px;">
      <div style="max-width:640px;margin:0 auto;">${nextHint(2)}</div>
    </section>

    <!-- ============ 區塊 4：行動呼籲（章節 3）============ -->
    <section id="gchap3" data-chap="3" style="padding:90px 30px;background:white;border-top:4px solid ${RED};scroll-margin-top:120px;">
      <div style="max-width:600px;margin:0 auto;">
        ${chapterMark('三', '行動')}
        <div style="text-align:center;margin-bottom:50px;">
          <h2 style="font-size:30px;color:${NAVY};margin:0;font-weight:800;letter-spacing:-1px;">從今天起，做這兩件事</h2>
          <div style="width:32px;height:1px;background:${RED};margin:24px auto 0;"></div>
        </div>
        <div>
          ${actionRows}
        </div>
        <!-- 預留：行動檢核表 / 下載資源按鈕 -->
        ${nextHint(3)}
      </div>
    </section>

    <!-- ============ 區塊 6：Footer 金句段（轉折，串接後面的步驟旅程）============ -->
    <section style="background:${CREAM};padding:90px 30px;text-align:center;">
      <div style="max-width:520px;margin:0 auto;">
        <p style="font-size:26px;color:${NAVY};font-weight:800;line-height:1.8;margin:0;letter-spacing:-.5px;">
          這三件事做到，<br>
          分會的引薦量<span style="color:${RED};">絕對翻倍</span>。
        </p>
        <div style="width:32px;height:1px;background:${NAVY};opacity:.3;margin:36px auto 24px;"></div>
        <p style="font-size:13px;color:${MUTE};margin:0;line-height:1.85;font-weight:600;letter-spacing:1px;">
          那如果輪到你上台講主題簡報？<br>
          往下看，七個步驟把你帶到上場
        </p>
      </div>
    </section>

    <!-- ============ 區塊 7：方向選擇（章節 4）============ -->
    <section id="gchap4" data-chap="4" style="padding:90px 30px;background:white;border-top:4px solid ${RED};scroll-margin-top:120px;">
      ${chapterMark('四', '選方向')}
      <div style="max-width:880px;margin:0 auto;">

        <h2 style="text-align:center;font-size:30px;color:${NAVY};margin:0;font-weight:800;letter-spacing:-1px;line-height:1.5;">
          開始做簡報前<br>先選一個方向
        </h2>

        <!-- 強調語：一次只選一個（純紅字大字，無框）-->
        <div style="max-width:560px;margin:38px auto 56px;text-align:center;">
          <p style="font-size:24px;color:${RED};font-weight:800;margin:0 0 14px;line-height:1.6;letter-spacing:-.3px;">
            一次只選一個。
          </p>
          <p style="font-size:15px;color:${MUTE};margin:0;line-height:1.95;letter-spacing:.5px;">
            兩個都想要，結果通常是兩個都做不好。
          </p>
        </div>

        <!-- A vs B 對照卡（直式上下排列） -->
        <div style="display:flex;flex-direction:column;gap:24px;">

          <!-- 方向一：引薦 -->
          <div style="background:white;padding:38px 30px;display:flex;flex-direction:column;border-top:6px solid ${NAVY};${CARD_FX}">
            <div style="margin-bottom:22px;">
              <div style="font-size:11px;letter-spacing:5px;color:${NAVY};font-weight:700;">方向一</div>
              <h3 style="font-size:23px;color:${NAVY};margin:6px 0 0;font-weight:800;letter-spacing:-.5px;">我想要「引薦」</h3>
            </div>

            <div style="background:${CREAM};padding:20px 22px;margin-bottom:30px;border-radius:8px;">
              <div style="font-size:11px;color:${MUTE};font-weight:700;letter-spacing:2px;margin-bottom:8px;">核心目的</div>
              <div style="font-size:18px;color:${NAVY};font-weight:700;line-height:1.6;">讓夥伴幫我把客戶帶來</div>
            </div>

            ${listSection('適合的人', [
              '服務對象是 C 端或小型 B 端',
              '需要源源不絕的新客戶',
              '服務屬於一次性或短週期',
            ])}
            ${listSection('準備簡報前要先想清楚', [
              '我的理想客戶長什麼樣？',
              '客戶在什麼情境下會需要我？',
              '夥伴聽到什麼關鍵字，該想到我？',
            ])}
            ${listSection('簡報重點', [
              '講「客戶的痛點」而不是「我的服務」',
              '給「具體的引薦觸發場景」',
              '讓夥伴聽完知道「什麼時候要把我推出去」',
            ])}

            <div style="margin-top:auto;padding-top:28px;border-top:1px solid ${LINE};text-align:center;">
              <div style="font-size:11px;color:${MUTE};letter-spacing:2px;font-weight:600;margin-bottom:14px;">範例金句</div>
              <div style="font-size:15px;color:${NAVY};font-weight:600;line-height:1.95;letter-spacing:.3px;">「下次你聽到朋友說『我家要裝潢』，請想到我——因為很多人裝潢時忘了規劃消防，事後拆掉重做很貴。」</div>
            </div>
            <!-- 預留：講者個人的引薦案例或數據 -->
          </div>

          <!-- 方向二：合作夥伴（樣式跟方向一一致） -->
          <div style="background:white;padding:38px 30px;display:flex;flex-direction:column;border-top:6px solid ${NAVY};${CARD_FX}">
            <div style="margin-bottom:22px;">
              <div style="font-size:11px;letter-spacing:5px;color:${NAVY};font-weight:700;">方向二</div>
              <h3 style="font-size:23px;color:${NAVY};margin:6px 0 0;font-weight:800;letter-spacing:-.5px;">我想要「合作夥伴」</h3>
            </div>

            <div style="background:${CREAM};padding:20px 22px;margin-bottom:30px;border-radius:8px;">
              <div style="font-size:11px;color:${MUTE};font-weight:700;letter-spacing:2px;margin-bottom:8px;">核心目的</div>
              <div style="font-size:18px;color:${NAVY};font-weight:700;line-height:1.6;">讓夥伴成為我的長期合作對象</div>
            </div>

            ${listSection('適合的人', [
              '服務對象是 B 端，客戶開發成本高',
              '需要的是長期通路而非單次客戶',
              '服務可以跟其他行業綁在一起賣（異業結盟）',
            ])}
            ${listSection('準備簡報前要先想清楚', [
              '我需要什麼樣的合作對象？',
              '我可以提供合作對象什麼價值？',
              '我跟誰結合會是 1+1>2？',
            ])}
            ${listSection('簡報重點', [
              '講「我的專業強項與資源」',
              '給「具體的合作模式或案例」',
              '讓夥伴聽完知道「我們可以怎麼一起賺錢」',
            ])}

            <div style="margin-top:auto;padding-top:28px;border-top:1px solid ${LINE};text-align:center;">
              <div style="font-size:11px;color:${MUTE};letter-spacing:2px;font-weight:600;margin-bottom:14px;">範例金句</div>
              <div style="font-size:15px;color:${NAVY};font-weight:600;line-height:1.95;letter-spacing:.3px;">「如果你是室內設計師，我們的淨水系統可以變成你的加值服務，讓你的設計案多一個賣點，我們也多一個通路——這就是雙贏。」</div>
            </div>
            <!-- 預留：講者個人的合作案例或數據 -->
          </div>
        </div>

        <!-- 還是不確定？用一個問題反推 -->
        <div style="margin-top:60px;background:${RED};color:white;padding:50px 30px;text-align:center;${CARD_FX}">
          <div style="display:inline-flex;width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,.08);align-items:center;justify-content:center;margin-bottom:22px;">
            ${icon('target', 32, 'white')}
          </div>
          <p style="font-size:13px;color:white;opacity:.6;margin:0 0 18px;letter-spacing:3px;font-weight:600;">還是不確定？</p>
          <p style="font-size:20px;font-weight:700;line-height:1.85;margin:0 0 36px;letter-spacing:.5px;">
            我的事業現在最缺的，<br>
            是「更多客戶」還是「更好的夥伴」？
          </p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;max-width:480px;margin:0 auto;">
            <div style="border:1px solid rgba(255,255,255,.25);padding:18px 16px;">
              <div style="font-size:13px;color:white;opacity:.7;margin-bottom:6px;">缺客戶</div>
              <div style="font-size:16px;font-weight:700;color:white;">→ 選引薦</div>
            </div>
            <div style="border:1px solid rgba(255,255,255,.25);padding:18px 16px;">
              <div style="font-size:13px;color:white;opacity:.7;margin-bottom:6px;">缺通路</div>
              <div style="font-size:16px;font-weight:700;color:white;">→ 選合作</div>
            </div>
          </div>
          <!-- 預留：更詳細的自我檢測題或互動小測驗 -->
        </div>
        ${nextHint(4)}
      </div>
    </section>

    <!-- ============ 區塊 8：步驟六・主題設定（章節 5）============ -->
    <section id="gchap5" data-chap="5" style="background:white;padding:90px 30px;border-top:4px solid ${RED};scroll-margin-top:120px;">
      ${stepHeader('五', '主題', '怎麼設定吸引人的主題？', '好的主題，從「對的角度」開始')}
      <div style="max-width:780px;margin:0 auto;">

        <!-- 4 個角度卡（上下排列） -->
        <div style="display:flex;flex-direction:column;gap:18px;">
          ${[
            { num: '01', title: '對引薦／合作對象有吸引力', examples: ['用制服，為你的專業形象再加分（受眾：多人公司團隊）', '用品牌設計，提升餐飲體驗（受眾：餐飲業）'] },
            { num: '02', title: '你最想分享的產品／品牌優勢', examples: ['小坪數創造大收益！維繫顧客關係的秘密（受眾：小規模經營者）'] },
            { num: '03', title: '讓人秒懂其價值', examples: ['設立公司還是行號？會計師來告訴你（受眾：一人公司、工作室）'] },
            { num: '04', title: '你想分享的價值', examples: ['創業要翻倍，從學習開始（受眾：創業者）'] },
          ].map(a => `
            <div style="background:${CREAM};padding:26px 28px;display:flex;gap:22px;align-items:flex-start;border-radius:12px;">
              <div style="font-size:32px;font-weight:200;color:${NAVY};line-height:1;letter-spacing:-1px;flex-shrink:0;">${a.num}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:17px;color:${NAVY};font-weight:800;margin-bottom:14px;line-height:1.5;">${a.title}</div>
                ${a.examples.map(e => `<div style="font-size:13px;color:${INK};line-height:1.85;padding-left:14px;position:relative;margin-bottom:6px;"><span style="position:absolute;left:0;top:.7em;width:6px;height:1px;background:${RED};"></span>${e}</div>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>

        ${ruleBanner('標題字數：18 字以內')}
        ${consultantPrompt([
          '你想要在簡報後得到什麼樣的引薦？',
          '你的目標客群有什麼共通的痛點？',
          '4 個角度裡哪一個最容易讓你的目標客群想再多聽一些？',
        ])}
        ${nextHint(5)}
      </div>
    </section>

    <!-- ============ 區塊 9：步驟七・引薦對象（章節 6）============ -->
    <section id="gchap6" data-chap="6" style="background:${CREAM};padding:90px 30px;border-top:4px solid ${RED};scroll-margin-top:120px;">
      ${stepHeader('六', '對象', '你想要誰？<br>把引薦對象說清楚', '講者越具體，夥伴越好幫忙')}
      <div style="max-width:780px;margin:0 auto;">

        <!-- 3 種引薦對象 -->
        <div style="display:flex;flex-direction:column;gap:18px;">
          ${[
            { num: '01', title: '合作對象', desc: '有組成產業服務鏈的機會、一對一表的業務人脈圈' },
            { num: '02', title: '理想引薦', desc: '目前已有且多多益善的客源、A 級客戶' },
            { num: '03', title: '夢幻引薦', desc: '超想要的！在外面比較難得到的重要資源' },
          ].map(t => `
            <div style="background:white;padding:26px 28px;display:flex;gap:22px;align-items:center;border-left:3px solid ${NAVY};${CARD_FX}">
              <div style="font-size:32px;font-weight:200;color:${NAVY};line-height:1;letter-spacing:-1px;flex-shrink:0;">${t.num}</div>
              <div style="flex:1;">
                <div style="font-size:18px;color:${NAVY};font-weight:800;margin-bottom:6px;letter-spacing:-.3px;">${t.title}</div>
                <div style="font-size:14px;color:${INK};line-height:1.8;">${t.desc}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- 工具引導：9981 宮格（白底紅左線，跟規範 banner 同 family）-->
        <div style="margin-top:36px;padding:14px 22px;background:white;border-left:3px solid ${RED};display:flex;align-items:center;gap:14px;border-radius:0 8px 8px 0;${CARD_FX}">
          <div style="font-size:11px;color:${RED};letter-spacing:3px;font-weight:700;flex-shrink:0;">工具</div>
          <div style="width:1px;height:14px;background:${LINE};flex-shrink:0;"></div>
          <div style="font-size:14px;color:${INK};font-weight:700;line-height:1.6;">把 9981 宮格攤開來，你就知道自己想要哪些行業的引薦了</div>
        </div>

        ${ruleBanner('每項描述：16 字以內')}
        ${consultantPrompt([
          '你最近一筆賺最多的客戶長什麼樣？',
          '你有沒有想合作但一直沒機會接觸的對象？',
          '你能否在 16 個字內說清楚理想引薦長什麼樣？',
        ])}
        ${nextHint(6)}
      </div>
    </section>

    <!-- ============ 區塊 10：步驟八・簡報架構（章節 7，Tab 切換）============ -->
    <section id="gchap7" data-chap="7" style="background:white;padding:90px 30px;border-top:4px solid ${RED};scroll-margin-top:120px;">
      ${stepHeader('七', '架構', '怎麼安排你的 5 分鐘？', '第一次跟老手節奏不同')}
      <div style="max-width:780px;margin:0 auto;">

        <!-- 第一次（333 架構） -->
        <div>
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;background:${RED};color:white;font-size:11px;letter-spacing:3px;font-weight:700;padding:5px 14px;border-radius:99px;margin-bottom:10px;">第一次上台</div>
            <div style="font-size:18px;color:${NAVY};font-weight:800;letter-spacing:.5px;">333 架構</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
            ${['封面','我在做什麼','我為什麼做這個事業','成功案例 1','成功案例 2','成功案例 3','總結','要求引薦 CTA','記憶口號']
              .map((t, i) => `
                <div style="background:${CREAM};padding:22px 12px;text-align:center;display:flex;flex-direction:column;justify-content:center;min-height:80px;border-radius:8px;">
                  <div style="font-size:11px;color:${RED};font-weight:700;letter-spacing:2px;margin-bottom:6px;">0${i+1}</div>
                  <div style="font-size:13px;color:${NAVY};font-weight:700;line-height:1.5;">${t}</div>
                </div>
              `).join('')}
          </div>
        </div>

        <!-- 第二次以上（DanceCard 架構） -->
        <div style="margin-top:60px;padding-top:50px;border-top:1px solid ${LINE};">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;background:${RED};color:white;font-size:11px;letter-spacing:3px;font-weight:700;padding:5px 14px;border-radius:99px;margin-bottom:10px;">第二次以上</div>
            <div style="font-size:18px;color:${NAVY};font-weight:800;letter-spacing:.5px;">主題簡報架構（呼應 DanceCard）</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
            ${[
              { t: '封面', sub: '' },
              { t: '自我介紹／我在做什麼', sub: '' },
              { t: '獨特銷售主張', sub: '針對目標客群' },
              { t: '最佳 LCD', sub: '描述 + 案例 + 總結' },
              { t: '如何開啟交易對話', sub: '聽到 xxx，告訴他 ooo' },
              { t: '如何掌握引薦流程', sub: '常見 QA 2~3 個' },
              { t: '整體總結', sub: '' },
              { t: '要求引薦 CTA', sub: '' },
              { t: '記憶口號', sub: '' },
            ].map((s, i) => `
              <div style="background:${CREAM};padding:18px 10px;text-align:center;display:flex;flex-direction:column;justify-content:center;min-height:90px;border-radius:8px;">
                <div style="font-size:11px;color:${RED};font-weight:700;letter-spacing:2px;margin-bottom:6px;">0${i+1}</div>
                <div style="font-size:13px;color:${NAVY};font-weight:700;line-height:1.45;">${s.t}</div>
                ${s.sub ? `<div style="font-size:10px;color:${MUTE};margin-top:4px;line-height:1.5;">${s.sub}</div>` : ''}
              </div>
            `).join('')}
          </div>
          <!-- LCD 科普（白底紅左線，跟規範/工具 banner 同 family）-->
          <div style="margin-top:30px;background:white;border-left:3px solid ${RED};padding:22px 26px;border-radius:0 8px 8px 0;${CARD_FX}">
            <div style="font-size:11px;color:${RED};letter-spacing:3px;font-weight:700;margin-bottom:14px;">LCD 科普</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px 22px;">
              ${['產品與服務項目','目標市場','客戶特定利潤','公司傲人事蹟','成功案例'].map(t => `
                <div style="font-size:13px;color:${INK};line-height:1.7;padding-left:14px;position:relative;font-weight:600;">
                  <span style="position:absolute;left:0;top:.55em;width:6px;height:1px;background:${RED};"></span>${t}
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        ${consultantPrompt([
          '這是你第幾次做主題簡報？',
          '哪些 LCD 元素是你最強的？',
          '哪段你覺得最難講、需要先練？',
        ])}
        ${nextHint(7)}
      </div>
    </section>

    <!-- ============ 區塊 11：步驟九・抽獎禮物（章節 8）============ -->
    <section id="gchap8" data-chap="8" style="background:${CREAM};padding:90px 30px;border-top:4px solid ${RED};scroll-margin-top:120px;">
      ${stepHeader('八', '禮物', '別忘了你的抽獎禮物', '主題簡報禮物準備技巧')}
      <div style="max-width:780px;margin:0 auto;">

        ${ruleBanner('兩份禮物，價值抓 500 元以上')}

        <!-- 3 個方向卡 -->
        <div style="display:flex;flex-direction:column;gap:18px;margin-top:36px;">
          ${[
            { num: '01', title: '自家商品', desc: '容易被使用、被接受。順便讓會員試用後幫你口碑擴散。' },
            { num: '02', title: '其他容易被使用、被接受的禮物', desc: '生活用品、餐券、實用小物。降低中獎人「拿到不知道幹嘛」的尷尬。' },
            { num: '03', title: '小心機策略', desc: '交關想邀約的來賓的商品，藉此開啟對話、建立連結。' },
          ].map(d => `
            <div style="background:white;padding:26px 28px;display:flex;gap:22px;align-items:flex-start;border-left:3px solid ${NAVY};${CARD_FX}">
              <div style="font-size:32px;font-weight:200;color:${NAVY};line-height:1;letter-spacing:-1px;flex-shrink:0;">${d.num}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:17px;color:${NAVY};font-weight:800;margin-bottom:8px;letter-spacing:-.3px;white-space:nowrap;">${d.title}</div>
                <div style="font-size:14px;color:${INK};line-height:1.85;">${d.desc}</div>
              </div>
            </div>
          `).join('')}
        </div>

        ${consultantPrompt([
          '你有沒有合適自家商品可以當禮物？',
          '你有沒有想邀約的來賓？他可能在做什麼產業？',
          '500 元以上的禮物你的預算 OK 嗎？',
        ])}
        ${nextHint(8)}
      </div>
    </section>

    <!-- ============ 區塊 12：步驟十・上台技巧（章節 9）============ -->
    <section id="gchap9" data-chap="9" style="background:white;padding:90px 30px;border-top:4px solid ${RED};scroll-margin-top:120px;">
      ${stepHeader('九', '上台', '上台前，記住這 7 件事', '在台上，你就是最棒的')}
      <div style="max-width:680px;margin:0 auto;">

        <!-- 7 件事條列 -->
        <div style="display:flex;flex-direction:column;">
          ${[
            { t: '私下練習 20~30 次以上', d: '站起來模擬真實情境，不是坐著默念。試試對著鏡子練、錄手機影片回看、或找夥伴當聽眾給你回饋。' },
            { t: '當天提早到場', d: '至少提早 30 分鐘。確認麥克風、投影機、簡報順序、雷射筆，並適應台上的視角與光線。' },
            { t: '會議前多跟會員／來賓互動', d: '握手、寒暄、聊近況。建立連結，上台時看到熟悉的眼神會大幅降低緊張感。' },
            { t: '看著友善的眼神', d: '掃描全場找出 3~5 個認真聆聽、熟悉、支持你的人，把他們當你的「主要觀眾」。' },
            { t: '提升穩定感', d: '站定位再講話，不邊走邊講。雙腳穩定站定、雙手自然在腰側或胸前，避免亂晃。' },
            { t: '面向觀眾', d: '不要背對觀眾、不要照著簡報念。簡報只是輔助，你的眼神跟手勢才是主角。' },
            { t: '分享你的專業', d: '在台上，你就是最棒的。記得：你是在分享你最熟的事，會員都是來支持你的。' },
          ].map((s, i, arr) => `
            <div style="display:flex;gap:22px;align-items:flex-start;padding:24px 0;${i < arr.length - 1 ? `border-bottom:1px solid ${LINE};` : ''}">
              <div style="font-size:24px;font-weight:200;color:${NAVY};line-height:1;letter-spacing:-1px;width:36px;flex-shrink:0;text-align:right;">${String(i+1).padStart(2,'0')}</div>
              <div style="flex:1;">
                <div style="font-size:16px;color:${NAVY};font-weight:800;margin-bottom:6px;line-height:1.5;">${s.t}</div>
                <div style="font-size:14px;color:${INK};line-height:1.85;">${s.d}</div>
              </div>
            </div>
          `).join('')}
        </div>

        ${consultantPrompt([
          '你打算在簡報前練習幾次？',
          '你會議前會跟誰互動？',
          '台下哪些人是你最熟悉、最支持你的？',
        ])}
      </div>
    </section>

    <!-- ============ 區塊 13：Footer 鼓勵段（紅底，BNI 給予者文化）============ -->
    <section style="background:${RED};color:white;padding:80px 30px 60px;text-align:center;">
      <div style="max-width:560px;margin:0 auto;">
        <div style="font-size:11px;color:white;opacity:.7;letter-spacing:5px;font-weight:700;margin-bottom:24px;">給予者・收獲者</div>
        <p style="font-size:30px;font-weight:800;line-height:1.6;margin:0 0 26px;letter-spacing:-.5px;">
          你給出去的，<br>會回到你身上。
        </p>
        <div style="width:32px;height:1px;background:white;opacity:.5;margin:30px auto;"></div>
        <p style="font-size:15px;line-height:2;margin:0 0 14px;opacity:.92;letter-spacing:.5px;font-weight:500;">
          講好這場主題簡報——<br>引薦，會自然找上你。
        </p>
        <p style="font-size:13px;line-height:1.85;margin:30px 0 0;opacity:.7;font-weight:400;">
          現在輪到你了。
        </p>
      </div>
    </section>

  </div>`;
}

// 章節進度 dot 指示器 + 回到頂部按鈕 + active dot tooltip
// 三者都動態 append 到 document.body（避開 tabConsultantGuide display:none 的影響）
function setupGuideScroll() {
  if (window._guideScrollAttached) return;
  window._guideScrollAttached = true;
  const RED = '#c0392b';
  const GREY = '#d8d8d8';
  const labels = ['誠實面對','為了誰','行動','選方向','主題','對象','架構','禮物','上台'];

  // 1) 底部 dots 指示器
  const dotsBar = document.createElement('div');
  dotsBar.id = 'guideDots';
  dotsBar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:rgba(255,255,255,0.96);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);padding:14px 20px;border-top:1px solid #eee;z-index:88;display:none;justify-content:center;gap:18px;box-shadow:0 -2px 12px rgba(0,0,0,0.04);';
  dotsBar.innerHTML = labels.map((label, i) => `
    <button class="gd-dot" data-chap="${i+1}" onclick="scrollToChapter(${i+1})" title="${label}"
      style="width:9px;height:9px;border-radius:50%;background:${GREY};border:none;cursor:pointer;padding:0;transition:background .25s, transform .25s;"></button>
  `).join('');
  document.body.appendChild(dotsBar);

  // 2) active dot tooltip（顯示當前章節名）
  const tip = document.createElement('div');
  tip.id = 'gdTip';
  tip.style.cssText = 'position:fixed;background:rgba(0,0,0,0.85);color:white;padding:5px 14px;border-radius:14px;font-size:12px;font-weight:700;letter-spacing:2px;pointer-events:none;z-index:89;opacity:0;transition:opacity .25s, left .2s;transform:translateX(-50%);white-space:nowrap;';
  document.body.appendChild(tip);

  // 3) 回到頂部按鈕
  const topBtn = document.createElement('button');
  topBtn.id = 'guideBackToTop';
  topBtn.setAttribute('aria-label', '回到頂部');
  topBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  topBtn.style.cssText = `position:fixed;bottom:74px;right:24px;width:48px;height:48px;border-radius:50%;background:${RED};color:white;border:none;box-shadow:0 4px 14px rgba(192,57,43,0.4);cursor:pointer;display:none;align-items:center;justify-content:center;z-index:88;`;
  topBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`;
  document.body.appendChild(topBtn);

  // 4) scroll listener
  const onScroll = () => {
    if (dotsBar.style.display === 'none') return;
    topBtn.style.display = window.scrollY > 400 ? 'flex' : 'none';
    const sections = document.querySelectorAll('[data-chap]');
    if (!sections.length) return;
    let activeChap = 1;
    const threshold = 200;
    sections.forEach(s => {
      const top = s.getBoundingClientRect().top;
      if (top < threshold) activeChap = parseInt(s.dataset.chap, 10);
    });
    document.querySelectorAll('.gd-dot').forEach(d => {
      const isActive = parseInt(d.dataset.chap, 10) === activeChap;
      d.style.background = isActive ? RED : GREY;
      d.style.transform = isActive ? 'scale(1.5)' : 'scale(1)';
    });
    // 更新 tooltip：定位在 active dot 正上方
    const activeDot = document.querySelector(`.gd-dot[data-chap="${activeChap}"]`);
    if (activeDot) {
      const rect = activeDot.getBoundingClientRect();
      tip.style.left = (rect.left + rect.width / 2) + 'px';
      tip.style.bottom = (window.innerHeight - rect.top + 12) + 'px';
      tip.textContent = labels[activeChap - 1];
      tip.style.opacity = '1';
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
}

// 顯示/隱藏 dots + backToTop + tip（在 switchConsultantTab 切換 tab 時呼叫）
function setGuideUiVisible(visible) {
  const dots = document.getElementById('guideDots');
  const btn = document.getElementById('guideBackToTop');
  const tip = document.getElementById('gdTip');
  if (dots) dots.style.display = visible ? 'flex' : 'none';
  if (btn) btn.style.display = 'none';  // 由 onScroll 在捲動時決定要不要顯示
  if (tip) tip.style.opacity = visible ? '1' : '0';
}

// 自動隱藏：偵測任何 simguide section（[data-chap]）是否可見，否則強制隱藏 dots/btn/tip
// 通用偵測，不綁定特定 ID（顧問首頁 #tabConsultantGuide、講者畫面 #tabGuide 都能 cover）
function setupGuideUiAutoHide() {
  if (window._guideAutoHide) return;
  window._guideAutoHide = true;
  let raf = null;
  const check = () => {
    raf = null;
    const sections = document.querySelectorAll('[data-chap]');
    let anyVisible = false;
    for (const s of sections) {
      if (s.offsetParent !== null) { anyVisible = true; break; }
    }
    if (!anyVisible) setGuideUiVisible(false);
  };
  const observer = new MutationObserver(() => {
    if (raf) return;
    raf = requestAnimationFrame(check);
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
}

// 點擊章節 dot 跳轉
function scrollToChapter(n) {
  const el = document.getElementById('gchap' + n);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 顧問提問區收合切換
function toggleConsultantPrompt(headerEl) {
  const body = headerEl.parentElement.querySelector('.cp-body');
  const toggle = headerEl.querySelector('.cp-toggle');
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : '';
  if (toggle) toggle.textContent = isOpen ? '+' : '−';
}


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
      <button id="tabBtn_guide" class="speaker-tab-btn" onclick="switchConsultantTab('guide')">簡報攻略</button>
      <button id="tabBtn_cases" class="speaker-tab-btn" onclick="switchConsultantTab('cases')">簡報案例</button>
    </div>
    <div id="tabTracking">${cardsHtml}</div>
    <div id="tabConsultantGuide" style="display:none;">${renderConsultantGuide()}</div>
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
    ${!isConsultantView ? `<div id="tabGuide" style="display:none;">${renderConsultantGuide()}</div>` : ''}
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
  const tg = document.getElementById('tabConsultantGuide');
  const tc = document.getElementById('tabConsultantCases');
  if (tt) tt.style.display = tab === 'tracking' ? '' : 'none';
  if (tg) tg.style.display = tab === 'guide' ? '' : 'none';
  if (tc) tc.style.display = tab === 'cases' ? '' : 'none';
  document.querySelectorAll('.speaker-tab-btn').forEach(b => {
    b.classList.toggle('active', b.id === 'tabBtn_' + tab);
  });
  // 切到簡報攻略時：建立 dots/btn（一次）、顯示 dots、立刻跑一次 scroll 偵測
  if (tab === 'guide') {
    if (typeof setupGuideScroll === 'function') setupGuideScroll();
    if (typeof setupGuideUiAutoHide === 'function') setupGuideUiAutoHide();
    setGuideUiVisible(true);
    setTimeout(() => window.dispatchEvent(new Event('scroll')), 50);
  } else {
    setGuideUiVisible(false);
  }
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
  // 切到簡報攻略時：建立 dots/btn（一次）、顯示 dots、立刻跑一次 scroll 偵測
  if (tab === 'guide') {
    if (typeof setupGuideScroll === 'function') setupGuideScroll();
    if (typeof setupGuideUiAutoHide === 'function') setupGuideUiAutoHide();
    if (typeof setGuideUiVisible === 'function') setGuideUiVisible(true);
    setTimeout(() => window.dispatchEvent(new Event('scroll')), 50);
  } else {
    if (typeof setGuideUiVisible === 'function') setGuideUiVisible(false);
  }
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

