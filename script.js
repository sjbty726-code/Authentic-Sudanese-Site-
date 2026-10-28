(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const els = {
    body: document.body,
    landing: $('#landing'),
    editorApp: $('#editorApp'),
    apkWorkspace: $('#apkWorkspace'),
    start: $('#startJourney'),
    showIntro: $('#showIntro'),
    plane: $('#heroPlane'),
    backHome: $('#backHome'),
    backToEditor: $('#backToEditor'),
    apkButton: $('#apkButton'),
    prepareApkProject: $('#prepareApkProject'),
    githubRepoUrl: $('#githubRepoUrl'),
    checkBuildStatus: $('#checkBuildStatus'),
    openGithubActions: $('#openGithubActions'),
    buildStatus: $('#buildStatus'),
    buildDetails: $('#buildDetails'),
    html: $('#htmlEditor'),
    css: $('#cssEditor'),
    js: $('#jsEditor'),
    gutter: $('#lineGutter'),
    currentFileLabel: $('#currentFileLabel'),
    languageIndicator: $('#languageIndicator'),
    languageMode: $('#languageMode'),
    autoUpdate: $('#autoUpdate'),
    run: $('#runButton'),
    clear: $('#clearButton'),
    copy: $('#copyButton'),
    download: $('#downloadFileButton'),
    exportZip: $('#exportZip'),
    fileInput: $('#fileInput'),
    upload: $('#uploadButton'),
    previewFrame: $('#previewFrame'),
    browserFrame: $('#browserFrame'),
    fullscreen: $('#fullscreenButton'),
    openPreview: $('#openPreviewTab'),
    saveStatus: $('#saveStatus'),
    lineInfo: $('#lineInfo'),
    charInfo: $('#charInfo'),
    helpButton: $('#helpButton'),
    syntaxHelpButton: $('#syntaxHelpButton'),
    modal: $('#helpModal'),
    closeHelp: $('#closeHelp'),
    tryExample: $('#tryExample'),
    toast: $('#toast')
  };

  const FILE_META = {
    html: { name: 'index.html', label: 'هيكل الصفحة', editor: els.html },
    css: { name: 'style.css', label: 'الألوان والتنسيق', editor: els.css },
    js: { name: 'script.js', label: 'التفاعل والحركة', editor: els.js }
  };
  const STORAGE_KEY = 'wadFaisalArabicEditor.v2';
  const LEGACY_STORAGE_KEY = 'wadFaisalArabicEditor.v1';
  const DEFAULTS = {
    html: 'عنوان مرحباً بيك يا عالم\nنص دي أول تجربة لي في ود فيصل. اكتب بالعربي وشوف النتيجة قدامك\nزر اضغط هنا\nرابط افتح مثال لمحرر مواقع https://open-urls.com',
    css: 'خلي الخلفية #f4f6ff\nلون النص #202743\nلون العنوان #6157d9\nحجم الخط 17\nمحاذاة وسط\nمسافة 20\nلون الزر #6558dc',
    js: 'عند الضغط على زر اضغط هنا اعرض رسالة أهلاً بيك في ود فيصل'
  };
  let activeFile = 'html';
  let toastTimer = 0;
  let renderTimer = 0;
  let latestDocument = '';
  let lastGithubRunUrl = '';

  const COLOR_NAMES = new Map(Object.entries({
    'احمر':'#e53935','أحمر':'#e53935','حمراء':'#e53935','احمر فاتح':'#ff7777','أحمر فاتح':'#ff7777','حمراء فاتحة':'#ff7777','خمري':'#7f1d35','نبيتي':'#7f1d35',
    'ازرق':'#168cff','أزرق':'#168cff','زرقاء':'#168cff','ازرق فاتح':'#70c7ff','أزرق فاتح':'#70c7ff','زرقاء فاتحة':'#70c7ff','سماوي':'#26c6da','سماوية':'#26c6da','لبني':'#8ed8ff','كحلي':'#13264b','نيلي':'#3431a7',
    'اخضر':'#159b62','أخضر':'#159b62','خضراء':'#159b62','اخضر فاتح':'#78dfad','أخضر فاتح':'#78dfad','خضراء فاتحة':'#78dfad','زيتي':'#687b2b','تركواز':'#20bca8','فيروزي':'#20cbb4',
    'اصفر':'#ffd43b','أصفر':'#ffd43b','صفراء':'#ffd43b','ذهبي':'#e5ad35','ذهبية':'#e5ad35','برتقالي':'#ff8a30','برتقالية':'#ff8a30','بنفسجي':'#7769ef','بنفسجية':'#7769ef','موف':'#9867ca','ليلكي':'#b6a4ff','وردي':'#ef70a5','وردية':'#ef70a5','زهري':'#ef70a5','زهرية':'#ef70a5',
    'اسود':'#111827','أسود':'#111827','سوداء':'#111827','ابيض':'#ffffff','أبيض':'#ffffff','بيضاء':'#ffffff','ابيض ثلجي':'#f4f6ff','أبيض ثلجي':'#f4f6ff','رمادي':'#80889b','رمادية':'#80889b','رصاصي':'#657085','فضي':'#c8d0df','فضية':'#c8d0df',
    'بني':'#8b5e3c','بنية':'#8b5e3c','بيج':'#e8d8bd','كريمي':'#fff2d8','شفاف':'transparent','transparent':'transparent',
    'red':'red','blue':'blue','lightblue':'lightblue','skyblue':'skyblue','navy':'navy','green':'green','lime':'lime','yellow':'yellow','gold':'gold','orange':'orange','purple':'purple','violet':'violet','pink':'pink','black':'black','white':'white','gray':'gray','grey':'gray','teal':'teal','cyan':'cyan'
  }));

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2800);
  }

  function setView(view) {
    els.landing.hidden = view !== 'landing';
    els.editorApp.hidden = view !== 'editor';
    els.apkWorkspace.hidden = view !== 'apk';
    els.body.classList.toggle('landing-mode', view === 'landing');
    els.body.classList.toggle('editor-mode', view === 'editor');
    els.body.classList.toggle('apk-mode', view === 'apk');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function beginJourney() {
    if (!els.editorApp.hidden) return;
    els.body.classList.add('launching');
    setTimeout(() => {
      setView('editor');
      els.body.classList.remove('launching');
      renderPreview();
      updateEditorStats();
    }, 560);
  }

  function goHome(event) {
    event?.preventDefault();
    setView('landing');
  }

  function openApkWorkspace() {
    if (els.editorApp.hidden) return;
    setView('apk');
    const savedRepo = safeLocalGet('wadFaisalGithubRepo');
    if (savedRepo && !els.githubRepoUrl.value) els.githubRepoUrl.value = savedRepo;
  }

  function returnToEditor() {
    setView('editor');
    renderPreview();
  }

  function safeLocalGet(key) {
    try { return localStorage.getItem(key) || ''; } catch (_) { return ''; }
  }

  function currentText() { return FILE_META[activeFile].editor.value; }

  function switchFile(file) {
    if (!FILE_META[file]) return;
    activeFile = file;
    Object.entries(FILE_META).forEach(([key, meta]) => {
      const isActive = key === file;
      meta.editor.hidden = !isActive;
      meta.editor.classList.toggle('active', isActive);
      const tab = $(`.file-item[data-file="${key}"]`);
      if (tab) tab.classList.toggle('active', isActive);
    });
    els.currentFileLabel.textContent = FILE_META[file].name;
    els.languageIndicator.textContent = els.languageMode.value === 'arabic'
      ? (file === 'html' ? 'لغة ود فيصل الطبيعية' : 'أوامر عربية مبسطة')
      : (file === 'html' ? 'HTML' : file === 'css' ? 'CSS' : 'JavaScript');
    updateEditorStats();
    FILE_META[file].editor.focus({ preventScroll: true });
  }

  function updateEditorStats() {
    const editor = FILE_META[activeFile].editor;
    const text = editor.value;
    const caret = editor.selectionStart;
    const before = text.slice(0, caret);
    const line = before.split('\n').length;
    const col = before.length - before.lastIndexOf('\n');
    const lines = text.split('\n').length;
    els.gutter.textContent = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
    els.gutter.scrollTop = editor.scrollTop;
    els.lineInfo.textContent = `السطر ${line}، العمود ${col}`;
    els.charInfo.textContent = `${text.length.toLocaleString('ar')} حرف`;
  }

  function saveProject() {
    try {
      const state = { html: els.html.value, css: els.css.value, js: els.js.value, mode: els.languageMode.value, savedAt: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      els.saveStatus.textContent = 'تم الحفظ محلياً';
    } catch (_) {
      els.saveStatus.textContent = 'تعذّر الحفظ';
    }
  }

  function loadProject() {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (typeof saved.html === 'string') els.html.value = saved.html;
      if (typeof saved.css === 'string') els.css.value = saved.css;
      if (typeof saved.js === 'string') els.js.value = saved.js;
      if (saved.mode === 'arabic' || saved.mode === 'native') els.languageMode.value = saved.mode;
    } catch (_) { /* تجاهل بيانات الحفظ التالفة */ }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
  }

  function cleanDslLine(line) {
    let cleaned = String(line || '').trim();
    const legacySyntax = cleaned.startsWith('/');
    if (legacySyntax) cleaned = cleaned.slice(1).trim();
    if (legacySyntax && cleaned.endsWith(')')) cleaned = cleaned.slice(0, -1).trim();
    return cleaned;
  }

  function stripQuotes(value) {
    return String(value || '').trim().replace(/^["'“”«»]+|["'“”«»]+$/g, '').trim();
  }

  function isColorToken(value) {
    const v = stripQuotes(value).toLowerCase();
    return COLOR_NAMES.has(v) || /^#[0-9a-f]{3,8}$/i.test(v) || /^(?:rgb|rgba|hsl|hsla)\([^\n;{}]+\)$/i.test(v) || /^[a-z-]{3,24}$/i.test(v);
  }

  function isStyleLine(line) {
    const value = cleanDslLine(line).replace(/^(?:لو سمحت\s+|من فضلك\s+|خلي\s+|خلّي\s+|خل\s+|اجعل(?: لي)?\s+|غيّر\s+|غير\s+|اضبط\s+|أريد\s+|عايز\s+|عاوز\s+|داير\s+)+/i, '').trim();
    return /^(?:لون الخلفية|لون خلفية|خلفية الصفحة|الخلفية|لون الواجهة|الواجهة|لون النص|لون الكتابة|لون الخط|لون العنوان|لون الزر|الزر بلون|حجم الخط|حجم النص|حجم الكتابة|محاذاة|المحاذاة|وسط|يمين|يسار|توسيط|مسافة|الحشو|استدارة|الاستدارة|حواف دائرية|ظل|اللون|لون)(?:\s|$)/i.test(value) || isColorToken(value);
  }

  function styleCommand(line) {
    let value = cleanDslLine(line).replace(/[.!،؛]+$/g, '').trim();
    value = value.replace(/^(?:لو سمحت\s+|من فضلك\s+|خلي\s+|خلّي\s+|خل\s+|اجعل(?: لي)?\s+|غيّر\s+|غير\s+|اضبط\s+|أريد\s+|عايز\s+|عاوز\s+|داير\s+)+/i, '').trim();
    const pairs = [
      [/^(?:لون الخلفية|لون خلفية|خلفية الصفحة|الخلفية|لون الواجهة|الواجهة)\s*(?:بلون|لون|إلى|الى|هو|يساوي)?\s+(.+)$/i, 'background'],
      [/^(?:لون النص|لون الكتابة|لون الخط)\s*(?:بلون|لون|إلى|الى|هو|يساوي)?\s+(.+)$/i, 'text'],
      [/^لون العنوان\s*(?:بلون|لون|إلى|الى|هو|يساوي)?\s+(.+)$/i, 'heading'],
      [/^(?:لون الزر|الزر بلون)\s*(?:بلون|لون|إلى|الى|هو|يساوي)?\s+(.+)$/i, 'button'],
      [/^(?:اللون|لون)\s*(?:بلون|إلى|الى|هو|يساوي)?\s+(.+)$/i, 'background'],
      [/^(?:حجم الخط|حجم النص|حجم الكتابة)\s*(?:يساوي|هو|:)??\s*([\d.]+\s*(?:px|rem|em|%|vw|vh)?)$/i, 'fontSize'],
      [/^(?:محاذاة|المحاذاة)\s*(?:المحتوى|النص)?\s*(?:إلى|الى)?\s*(وسط|توسيط|يمين|يسار|center|right|left)$/i, 'align'],
      [/^(?:مسافة|الحشو)\s*([\d.]+\s*(?:px|rem|em|%|vw|vh)?)$/i, 'padding'],
      [/^(?:استدارة|الاستدارة|حواف دائرية)\s*([\d.]+\s*(?:px|rem|em|%)?)$/i, 'radius'],
      [/^ظل\s*(خفيف|متوسط|قوي|بدون|none)$/i, 'shadow']
    ];
    for (const [regex, kind] of pairs) {
      const match = value.match(regex);
      if (!match) continue;
      const raw = match[1].trim();
      if (['background', 'text', 'heading', 'button'].includes(kind)) {
        const color = resolveColor(raw);
        if (color) return { kind, value: color };
        return null;
      }
      if (kind === 'align') {
        const alignMap = { 'وسط':'center', 'توسيط':'center', 'يمين':'right', 'يسار':'left', 'center':'center', 'right':'right', 'left':'left' };
        return { kind, value: alignMap[raw] || raw };
      }
      if (kind === 'fontSize' || kind === 'padding' || kind === 'radius') return { kind, value: toCssLength(raw) };
      if (kind === 'shadow') return { kind, value: ({ 'خفيف':'0 3px 12px #0002', 'متوسط':'0 8px 25px #0003', 'قوي':'0 12px 35px #0005', 'بدون':'none', 'none':'none' })[raw] || 'none' };
    }
    if (isColorToken(value)) return { kind: 'background', value: resolveColor(value) };
    return null;
  }

  function resolveColor(value) {
    const raw = stripQuotes(value).trim();
    if (!raw) return null;
    if (COLOR_NAMES.has(raw.toLowerCase())) return COLOR_NAMES.get(raw.toLowerCase());
    if (COLOR_NAMES.has(raw)) return COLOR_NAMES.get(raw);
    if (/^#[0-9a-f]{3,8}$/i.test(raw)) return raw;
    if (/^(?:rgb|rgba|hsl|hsla)\([^\n;{}]+\)$/i.test(raw)) return raw;
    if (/^[a-z-]{3,24}$/i.test(raw)) return raw;
    return null;
  }

  function toCssLength(value) {
    const raw = String(value).trim();
    return /^\d+(?:\.\d+)?$/.test(raw) ? `${raw}px` : raw;
  }

  function isInteractionLine(line) {
    const s = cleanDslLine(line);
    return /^(?:(?:عند|لما|عندما|اذا|إذا)\s*(?:الضغط|النقر|أضغط|اضغط|أكبس|اكبس)|(?:عند الضغط على زر|عند النقر على زر|لما أضغط على زر|لما اضغط على زر|إذا ضغطت على زر|اذا ضغطت على زر|عندما أضغط على زر))/i.test(s) || /^(?:لما|عند)\s+(?:تضغط|أضغط|اضغط)\s+(?:على\s+)?(?:الزر|زر)\b/i.test(s);
  }

  function isHtmlCommand(line) {
    const s = cleanDslLine(line);
    return /^(?:عنوان(?:\s+رئيسي)?|عنوان كبير|عنوان فرعي|عنوان ثانوي|عنوان صغير|عنوان ثالث|عنوان2|عنوان3|نص|فقرة|اكتب نص|زر|أضف زر|اضف زر|رابط|صورة|فاصل|سطر جديد|قائمة|عنصر|بطاقة|كرت|صفحة|نهاية الصفحة)$/i.test(s) || /^(?:عنوان(?:\s+رئيسي)?|عنوان كبير|عنوان فرعي|عنوان ثانوي|عنوان صغير|عنوان ثالث|عنوان2|عنوان3|نص\s+|فقرة\s+|اكتب نص\s+|زر\s*|أضف زر\s+|اضف زر\s+|رابط\s+|صورة\s+|قائمة\s+|عنصر\s+|بطاقة\s+|كرت\s+|صفحة\s+|فاصل\s*$|سطر جديد\s*$|نهاية الصفحة\s*$)/i.test(s);
  }

  function splitCommandPayload(payload) {
    const divider = payload.indexOf('|');
    return divider < 0 ? [payload.trim(), ''] : [payload.slice(0, divider).trim(), payload.slice(divider + 1).trim()];
  }

  function safeUrl(value) {
    const trimmed = String(value || '').trim();
    if (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(trimmed)) return trimmed;
    return '#';
  }

  function parseLinkPayload(payload) {
    const legacy = splitCommandPayload(payload);
    if (legacy[1]) return { url: safeUrl(legacy[0]), label: legacy[1] || legacy[0] };
    const urlMatch = payload.match(/(?:https?:\/\/|mailto:|tel:)[^\s<>"']+/i);
    if (urlMatch) {
      const url = urlMatch[0].replace(/[،؛,.]+$/g, '');
      const before = payload.slice(0, urlMatch.index).trim().replace(/^(?:افتح|زيارة|زور|اذهب إلى|اذهب الى|الرابط)\s+/i, '');
      const after = payload.slice(urlMatch.index + urlMatch[0].length).trim();
      return { url: safeUrl(url), label: after || before || 'افتح الرابط' };
    }
    return { url: '#', label: payload || 'افتح الرابط' };
  }

  function parseImagePayload(payload) {
    const [first, second] = splitCommandPayload(payload);
    if (second) return { url: safeUrl(first), alt: second };
    const urlMatch = payload.match(/https?:\/\/[^\s<>"']+/i);
    if (!urlMatch) return { url: '#', alt: payload || 'صورة' };
    const url = urlMatch[0].replace(/[،؛,.]+$/g, '');
    const alt = (payload.slice(0, urlMatch.index) + ' ' + payload.slice(urlMatch.index + urlMatch[0].length)).trim();
    return { url: safeUrl(url), alt: alt || 'صورة' };
  }

  function parseArabicHtml(source) {
    const lines = source.replace(/\r/g, '').split('\n');
    const blocks = [];
    let pageNumber = 0;
    let pageOpen = false;
    const closePage = () => { if (pageOpen) { blocks.push('</section>'); pageOpen = false; } };

    for (const original of lines) {
      const line = cleanDslLine(original);
      if (!line) continue;

      if (/^(?:نهاية الصفحة|اغلاق الصفحة|إغلاق الصفحة)$/i.test(line)) { closePage(); continue; }
      const pageMatch = line.match(/^صفحة\s+(.+)$/i);
      if (pageMatch) {
        closePage();
        pageNumber++;
        const pageName = stripQuotes(pageMatch[1]);
        blocks.push(`<section class="wf-page${pageNumber === 1 ? ' active' : ''}" data-wf-page="${pageNumber}" data-wf-title="${escapeHtml(pageName)}">`);
        pageOpen = true;
        continue;
      }

      if (isStyleLine(line) || isInteractionLine(line)) continue;
      if (/^(?:<!doctype|<\/?[a-z][^>]*>|<!--|<style\b|<script\b)/i.test(line)) {
        blocks.push(original);
        continue;
      }

      let match;
      if ((match = line.match(/^(?:عنوان فرعي|عنوان ثانوي|عنوان صغير|عنوان2)\s*(.*)$/i))) {
        blocks.push(`<h2>${escapeHtml(match[1] || '')}</h2>`);
      } else if ((match = line.match(/^(?:عنوان ثالث|عنوان3)\s*(.*)$/i))) {
        blocks.push(`<h3>${escapeHtml(match[1] || '')}</h3>`);
      } else if ((match = line.match(/^(?:عنوان كبير|عنوان رئيسي|عنوان)\s*(.*)$/i))) {
        blocks.push(`<h1>${escapeHtml(match[1] || '')}</h1>`);
      } else if ((match = line.match(/^(?:اكتب نص|فقرة|نص)\s*(.*)$/i))) {
        blocks.push(`<p>${escapeHtml(match[1] || '')}</p>`);
      } else if ((match = line.match(/^(?:أضف زر|اضف زر|زر)\s*(.*)$/i))) {
        blocks.push(`<button type="button" class="wf-user-button">${escapeHtml(match[1] || 'اضغط هنا')}</button>`);
      } else if ((match = line.match(/^رابط\s*(.*)$/i))) {
        const link = parseLinkPayload(match[1]);
        blocks.push(`<p><a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a></p>`);
      } else if ((match = line.match(/^صورة\s*(.*)$/i))) {
        const image = parseImagePayload(match[1]);
        blocks.push(`<img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.alt)}" loading="lazy">`);
      } else if (/^فاصل$/i.test(line)) {
        blocks.push('<hr>');
      } else if (/^سطر جديد$/i.test(line)) {
        blocks.push('<br>');
      } else if ((match = line.match(/^قائمة\s+(.+)$/i))) {
        const items = match[1].split(/[؛;,،]/).map(x => x.trim()).filter(Boolean);
        blocks.push(`<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`);
      } else if ((match = line.match(/^عنصر\s+(.+)$/i))) {
        blocks.push(`<li>${escapeHtml(match[1])}</li>`);
      } else if ((match = line.match(/^(?:بطاقة|كرت)\s*(.*)$/i))) {
        blocks.push(`<article class="wf-card">${escapeHtml(match[1])}</article>`);
      } else {
        blocks.push(`<p>${escapeHtml(line)}</p>`);
      }
    }
    closePage();
    return blocks.join('\n');
  }

  function parseArabicCss(cssSource, otherSources = []) {
    const declarations = { body: [], headings: [], button: [], root: [], custom: [], shadow: '' };
    const allSources = [{ text: cssSource, allowRaw: true }, ...otherSources.map(text => ({ text, allowRaw: false }))];
    for (const source of allSources) {
      for (const original of String(source.text || '').replace(/\r/g, '').split('\n')) {
        const line = cleanDslLine(original);
        if (!line) continue;
        const style = styleCommand(line);
        if (style) {
          switch (style.kind) {
            case 'background': declarations.body.push(`background-color:${style.value};`); break;
            case 'text': declarations.body.push(`color:${style.value};`); break;
            case 'heading': declarations.headings.push(`color:${style.value};`); break;
            case 'button': declarations.button.push(`background:${style.value};`); break;
            case 'fontSize': declarations.body.push(`font-size:${style.value};`); break;
            case 'align': declarations.body.push(`text-align:${style.value};`); break;
            case 'padding': declarations.body.push(`padding:${style.value};`); break;
            case 'radius': declarations.root.push(`--wf-radius:${style.value};`); break;
            case 'shadow': declarations.shadow = style.value; break;
          }
          continue;
        }
        if (!source.allowRaw) continue;
        if (isHtmlCommand(line) || isInteractionLine(line)) continue;
        declarations.custom.push(original);
      }
    }
    const generated = `:root{${declarations.root.join('')}}\nbody{${declarations.body.join('')}}\nh1,h2,h3{${declarations.headings.join('')}}\n.wf-user-button,button{${declarations.button.join('')}${declarations.shadow ? `box-shadow:${declarations.shadow};` : ''}}\n`;
    return generated + declarations.custom.join('\n');
  }

  function parseArabicJs(jsSource, otherSources = []) {
    const generated = [];
    const raw = [];
    const allSources = [...otherSources.map(text => ({ text, allowRaw: false })), { text: jsSource, allowRaw: true }];
    let serial = 0;

    function quote(value) { return JSON.stringify(stripQuotes(value)); }
    function findUrl(value) {
      const match = String(value).match(/(?:https?:\/\/|mailto:|tel:)[^\s<>"']+/i);
      return match ? safeUrl(match[0].replace(/[،؛,.]+$/g, '')) : '';
    }

    for (const source of allSources) {
      for (const original of String(source.text || '').replace(/\r/g, '').split('\n')) {
        const line = cleanDslLine(original);
        if (!line) continue;

        let match = line.match(/^(?:عند الضغط على|عند النقر على|لما أضغط على|لما اضغط على|عندما أضغط على|إذا ضغطت على|اذا ضغطت على)\s+(?:زر|الزر)\s+(.+?)\s+(?:انتقل(?:ي)?\s*(?:(?:إلى|الى)\s*الصفحة|للصفحة)|افتح الصفحة|روح للصفحة)\s+(.+)$/i);
        if (match) {
          const buttonText = stripQuotes(match[1]);
          const pageTarget = stripQuotes(match[2]);
          const ordinal = pageNumberFromArabic(pageTarget);
          if (ordinal > 0) generated.push(makeButtonHandler(buttonText, `window.__wfGoToPage(${ordinal});`));
          continue;
        }

        match = line.match(/^(?:عند الضغط على|عند النقر على|لما أضغط على|لما اضغط على|عندما أضغط على|إذا ضغطت على|اذا ضغطت على)\s+(?:زر|الزر)\s+(.+?)\s+(?:افتح الرابط|افتح|انتقل للرابط|اذهب للرابط)\s+(.+)$/i);
        if (match) {
          const buttonText = stripQuotes(match[1]);
          const url = findUrl(match[2]);
          if (url) generated.push(makeButtonHandler(buttonText, `window.open(${JSON.stringify(url)}, '_blank', 'noopener');`));
          else generated.push(makeButtonHandler(buttonText, `alert('أضف رابطاً يبدأ بـ https://');`));
          continue;
        }

        match = line.match(/^(?:عند الضغط على|عند النقر على|لما أضغط على|لما اضغط على|عندما أضغط على|إذا ضغطت على|اذا ضغطت على)\s+(?:زر|الزر)\s+(.+?)\s+(?:اعرض رسالة|أعرض رسالة|اظهر رسالة|أظهر رسالة|اعرض تنبيه|أظهر تنبيه|اظهر تنبيه|قول لي|قل لي)\s+(.+)$/i);
        if (match) {
          const buttonText = stripQuotes(match[1]);
          const message = stripQuotes(match[2]);
          generated.push(makeButtonHandler(buttonText, `alert(${quote(message)});`));
          continue;
        }
        match = line.match(/^(?:لما|عند|إذا|اذا)\s+(?:تضغط|أضغط|اضغط|أكبس|اكبس)\s+(?:على\s+)?(?:الزر|زر)\s+(?:اعرض رسالة|أعرض رسالة|اظهر رسالة|أظهر رسالة|اعرض تنبيه|اظهر تنبيه)\s+(.+)$/i);
        if (match) {
          generated.push(makeButtonHandler('*', `alert(${quote(match[1])});`));
          continue;
        }
        if (isStyleLine(line) || isHtmlCommand(line)) continue;
        if (source.allowRaw) raw.push(original);
      }
    }
    const pageRuntime = `\n(function(){const pages=[...document.querySelectorAll('.wf-page')];if(!pages.length)return;window.__wfGoToPage=function(n){const target=Math.max(1,Math.min(pages.length,Number(n)||1));pages.forEach((p,i)=>{p.classList.toggle('active',i===target-1);p.setAttribute('aria-hidden',i===target-1?'false':'true');});window.scrollTo({top:0,behavior:'smooth'});};window.__wfGoToPage(1);})();\n`;
    return [...raw, ...generated, pageRuntime].filter(Boolean).join('\n');

    function makeButtonHandler(label, action) {
      const id = `wf-handler-${++serial}`;
      return `(function(){document.querySelectorAll('button').forEach(function(b){var t=(b.textContent||'').trim();if(${JSON.stringify(label)}==='*'||t===${JSON.stringify(label)}||t.includes(${JSON.stringify(label)})){b.addEventListener('click',function(){${action}});}});})();`;
    }
  }

  function pageNumberFromArabic(value) {
    const v = stripQuotes(value).trim();
    const map = {
      'الأولى':1,'اولى':1,'أولى':1,'واحدة':1,'واحد':1,'1':1,'الرئيسية':1,'الرئيسيه':1,'رئيسية':1,
      'الثانية':2,'الثانيه':2,'ثانية':2,'اثنين':2,'اتنين':2,'2':2,
      'الثالثة':3,'الثالثه':3,'ثالثة':3,'ثلاثة':3,'تلاتة':3,'3':3,
      'الرابعة':4,'الرابعه':4,'رابعة':4,'4':4,
      'الخامسة':5,'الخامسه':5,'خامسة':5,'5':5
    };
    return map[v] || map[v.replace(/^ال/, '')] || Number(v) || 0;
  }

  function getCompiledFiles() {
    if (els.languageMode.value !== 'arabic') return { html: els.html.value, css: els.css.value, js: els.js.value };
    const othersForCss = [els.html.value, els.js.value];
    const othersForJs = [els.html.value, els.css.value];
    return {
      html: parseArabicHtml(els.html.value),
      css: parseArabicCss(els.css.value, othersForCss),
      js: parseArabicJs(els.js.value, othersForJs)
    };
  }

  function makeDocument() {
    const files = getCompiledFiles();
    const htmlSource = files.html.trim() || '<main><h1>أهلاً بيك</h1><p>ابدأ الكتابة عشان تظهر النتيجة.</p></main>';
    const cssSource = `*{box-sizing:border-box}body{margin:0;min-height:100vh;font-family:Tahoma,Arial,sans-serif;line-height:1.8;padding:clamp(18px,4vw,50px);direction:rtl;overflow-wrap:anywhere}h1{font-size:clamp(1.7rem,4vw,2.8rem);line-height:1.35}h2,h3{line-height:1.4}p{line-height:2}img{max-width:100%;height:auto;border-radius:var(--wf-radius,12px)}button,.wf-user-button{border:0;border-radius:var(--wf-radius,10px);padding:11px 18px;cursor:pointer;font:inherit;background:#6558dc;color:white}a{color:#6558dc}li{margin:5px 0}.wf-card{border:1px solid #b9bfd3;border-radius:var(--wf-radius,12px);padding:18px;margin:12px 0}.wf-page{display:none;min-height:45vh}.wf-page.active{display:block}.wf-page+.wf-page{margin-top:12px}\n${files.css}`;
    return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><style>${cssSource.replace(/<\/style/gi, '<\\/style')}</style></head><body>${htmlSource.replace(/<\/body/gi, '<\\/body').replace(/<\/html/gi, '<\\/html')}<script>${files.js.replace(/<\/script/gi, '<\\/script')}</script></body></html>`;
  }

  function renderPreview() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => {
      latestDocument = makeDocument();
      els.previewFrame.srcdoc = latestDocument;
      saveProject();
    }, 100);
  }

  function onEditorInput() {
    updateEditorStats();
    saveProject();
    if (els.autoUpdate.checked) renderPreview();
  }

  function insertAtCursor(text) {
    const editor = FILE_META[activeFile].editor;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const prefix = editor.value.slice(0, start);
    const suffix = editor.value.slice(end);
    const needsNewlineBefore = prefix.length > 0 && !prefix.endsWith('\n');
    const needsNewlineAfter = suffix.length > 0 && !suffix.startsWith('\n');
    const inserted = `${needsNewlineBefore ? '\n' : ''}${text}${needsNewlineAfter ? '\n' : ''}`;
    editor.value = prefix + inserted + suffix;
    const cursor = (prefix + inserted).length;
    editor.focus();
    editor.setSelectionRange(cursor, cursor);
    onEditorInput();
  }

  function switchLanguageMode() {
    const arabic = els.languageMode.value === 'arabic';
    els.languageIndicator.textContent = arabic
      ? (activeFile === 'html' ? 'لغة ود فيصل الطبيعية' : 'أوامر عربية مبسطة')
      : (activeFile === 'html' ? 'HTML' : activeFile === 'css' ? 'CSS' : 'JavaScript');
    $$('.command-chip').forEach(button => { button.disabled = !arabic; });
    saveProject();
    renderPreview();
    showToast(arabic ? 'الأوامر العربية الطبيعية شغّالة' : 'اكتب HTML وCSS وJavaScript كما هي');
  }

  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2500);
  }

  function downloadCurrentFile() {
    const meta = FILE_META[activeFile];
    downloadBlob(meta.name, new Blob([meta.editor.value], { type: 'text/plain;charset=utf-8' }));
    showToast(`بدأ تنزيل ${meta.name}`);
  }

  function downloadSingleHtml() {
    downloadBlob('wad-faisal-preview.html', new Blob([makeDocument()], { type: 'text/html;charset=utf-8' }));
  }

  async function copyCurrentFile() {
    try {
      await navigator.clipboard.writeText(currentText());
      showToast('تم نسخ محتوى الملف');
    } catch (_) {
      const editor = FILE_META[activeFile].editor;
      editor.focus(); editor.select();
      const okay = document.execCommand('copy');
      editor.setSelectionRange(editor.value.length, editor.value.length);
      showToast(okay ? 'تم نسخ محتوى الملف' : 'حدّد النص وانسخه يدوياً');
    }
  }

  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c >>> 0;
    }
    return table;
  })();
  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }
  function le16(value) { return [value & 255, (value >>> 8) & 255]; }
  function le32(value) { return [value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]; }
  function concatBytes(chunks) {
    const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    chunks.forEach(chunk => { result.set(chunk, offset); offset += chunk.length; });
    return result;
  }
  function buildZip(entries) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let localOffset = 0;
    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
    const dosDate = ((Math.max(1980, now.getFullYear()) - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    for (const entry of entries) {
      const name = encoder.encode(entry.name);
      const data = encoder.encode(entry.data);
      const crc = crc32(data);
      const local = concatBytes([
        new Uint8Array([0x50,0x4b,0x03,0x04]), new Uint8Array(le16(20)), new Uint8Array(le16(0x0800)),
        new Uint8Array(le16(0)), new Uint8Array(le16(dosTime)), new Uint8Array(le16(dosDate)), new Uint8Array(le32(crc)),
        new Uint8Array(le32(data.length)), new Uint8Array(le32(data.length)), new Uint8Array(le16(name.length)), new Uint8Array(le16(0)), name, data
      ]);
      localParts.push(local);
      const central = concatBytes([
        new Uint8Array([0x50,0x4b,0x01,0x02]), new Uint8Array(le16(20)), new Uint8Array(le16(20)), new Uint8Array(le16(0x0800)),
        new Uint8Array(le16(0)), new Uint8Array(le16(dosTime)), new Uint8Array(le16(dosDate)), new Uint8Array(le32(crc)),
        new Uint8Array(le32(data.length)), new Uint8Array(le32(data.length)), new Uint8Array(le16(name.length)), new Uint8Array(le16(0)),
        new Uint8Array(le16(0)), new Uint8Array(le16(0)), new Uint8Array(le16(0)), new Uint8Array(le32(0)), new Uint8Array(le32(localOffset)), name
      ]);
      centralParts.push(central);
      localOffset += local.length;
    }
    const centralDirectory = concatBytes(centralParts);
    const end = concatBytes([
      new Uint8Array([0x50,0x4b,0x05,0x06]), new Uint8Array(le16(0)), new Uint8Array(le16(0)),
      new Uint8Array(le16(entries.length)), new Uint8Array(le16(entries.length)), new Uint8Array(le32(centralDirectory.length)),
      new Uint8Array(le32(localOffset)), new Uint8Array(le16(0))
    ]);
    return new Blob([concatBytes([...localParts, centralDirectory, end])], { type: 'application/zip' });
  }

  function exportProject() {
    const files = [
      { name: 'index.html', data: els.html.value },
      { name: 'style.css', data: els.css.value },
      { name: 'script.js', data: els.js.value },
      { name: 'README-AR.txt', data: 'مشروع ود فيصل\n\nالملفات: index.html وstyle.css وscript.js\nافتح index.html في متصفح حديث.\nفي محرر ود فيصل، أوامر اللغة العربية لا تحتاج / أو ).\n' }
    ];
    downloadBlob('wad-faisal-project.zip', buildZip(files));
    showToast('تم تجهيز ملفات الموقع في ZIP');
  }

  function buildAndroidProjectEntries() {
    const compiledPage = makeDocument();
    const originalName = 'WadFaisalAndroid';
    const manifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <application
        android:allowBackup="false"
        android:label="ود فيصل"
        android:supportsRtl="true"
        android:usesCleartextTraffic="false"
        android:theme="@android:style/Theme.Material.Light.NoActionBar">
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`;
    const activity = `package com.woodfaisal.app

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast

class MainActivity : Activity() {
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.rgb(8, 12, 25)
        window.navigationBarColor = Color.rgb(8, 12, 25)
        webView = WebView(this)
        webView.setBackgroundColor(Color.rgb(8, 12, 25))
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.allowFileAccess = true
        webView.settings.allowContentAccess = true
        webView.settings.javaScriptCanOpenWindowsAutomatically = false
        webView.webChromeClient = WebChromeClient()
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val uri: Uri = request.url
                val scheme = uri.scheme?.lowercase()
                if (scheme == "http" || scheme == "https" || scheme == "mailto" || scheme == "tel") {
                    return try {
                        startActivity(Intent(Intent.ACTION_VIEW, uri))
                        true
                    } catch (_: Exception) {
                        Toast.makeText(this@MainActivity, "ما قدرنا نفتح الرابط على الجهاز", Toast.LENGTH_SHORT).show()
                        true
                    }
                }
                return scheme != "file" && scheme != "about"
            }
        }
        setContentView(webView)
        if (savedInstanceState == null) {
            webView.loadUrl("file:///android_asset/index.html")
        } else {
            webView.restoreState(savedInstanceState)
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        webView.saveState(outState)
        super.onSaveInstanceState(outState)
    }

    @Deprecated("Deprecated by Android in favour of dispatcher APIs")
    override fun onBackPressed() {
        if (::webView.isInitialized && webView.canGoBack()) webView.goBack()
        else super.onBackPressed()
    }

    override fun onDestroy() {
        if (::webView.isInitialized) {
            (webView.parent as? android.view.ViewGroup)?.removeView(webView)
            webView.destroy()
        }
        super.onDestroy()
    }
}
`;
    const workflow = `name: Build Android APK

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

permissions:
  contents: read

jobs:
  build:
    name: Build debug APK
    runs-on: ubuntu-latest
    steps:
      - name: Checkout project
        uses: actions/checkout@v7

      - name: Set up JDK 17
        uses: actions/setup-java@v6
        with:
          distribution: temurin
          java-version: '17'
          cache: gradle

      - name: Set up Android SDK
        uses: android-actions/setup-android@v4
        with:
          packages: 'platform-tools platforms;android-36 build-tools;36.0.0'

      - name: Set up Gradle 8.13
        uses: gradle/actions/setup-gradle@v6
        with:
          gradle-version: '8.13'

      - name: Build APK
        run: gradle --no-daemon --stacktrace assembleDebug

      - name: Verify APK exists
        run: test -s app/build/outputs/apk/debug/app-debug.apk

      - name: Upload APK artifact
        uses: actions/upload-artifact@v7
        with:
          name: wad-faisal-debug-apk
          path: app/build/outputs/apk/debug/app-debug.apk
          if-no-files-found: error
          retention-days: 14
`;
    const rootBuild = `plugins {
    id("com.android.application") version "8.13.2" apply false
    id("org.jetbrains.kotlin.android") version "2.2.21" apply false
}
`;
    const settings = `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "${originalName}"
include(":app")
`;
    const appBuild = `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.woodfaisal.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.woodfaisal.app"
        minSdk = 23
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}
`;
    const readme = `مشروع ود فيصل إلى APK\n\nالمحتويات:\n- app/src/main/assets/index.html: النتيجة المدمجة الحالية من المعاينة.\n- web-source/: ملفات الأوامر الثلاثة الأصلية لحفظها وتعديلها.\n- .github/workflows/android-apk.yml: بناء تلقائي لملف APK عبر GitHub Actions.\n\nطريقة البناء من الهاتف:\n1. أنشئ مستودع GitHub جديداً.\n2. فك ضغط هذا الملف وارفع كل المحتويات (بما فيها الملفات المخفية مثل .github) إلى جذر المستودع.\n3. افتح Actions وانتظر نجاح Build Android APK أو شغّله من Run workflow.\n4. افتح تشغيل البناء الناجح ثم Artifacts ونزّل wad-faisal-debug-apk.\n\nإعداد البناء: Android Gradle Plugin 8.13.2، Gradle 8.13، JDK 17، Android SDK 36.\nهذا Debug APK للاختبار؛ النشر الرسمي يحتاج إعداد توقيع Release منفصل.\n`;
    return [
      { name: 'settings.gradle.kts', data: settings },
      { name: 'build.gradle.kts', data: rootBuild },
      { name: 'gradle.properties', data: 'org.gradle.jvmargs=-Xmx3g -Dfile.encoding=UTF-8\norg.gradle.parallel=true\nandroid.useAndroidX=true\nkotlin.code.style=official\n' },
      { name: 'app/build.gradle.kts', data: appBuild },
      { name: 'app/src/main/AndroidManifest.xml', data: manifest },
      { name: 'app/src/main/java/com/woodfaisal/app/MainActivity.kt', data: activity },
      { name: 'app/src/main/assets/index.html', data: compiledPage },
      { name: '.github/workflows/android-apk.yml', data: workflow },
      { name: 'web-source/index.html', data: els.html.value },
      { name: 'web-source/style.css', data: els.css.value },
      { name: 'web-source/script.js', data: els.js.value },
      { name: 'README-AR.txt', data: readme }
    ];
  }

  function prepareApkProject() {
    try {
      const entries = buildAndroidProjectEntries();
      downloadBlob('wad-faisal-android-project.zip', buildZip(entries));
      showToast('جهّزنا مشروع Android وGitHub Actions داخل ZIP');
    } catch (error) {
      console.error(error);
      showToast('تعذّر تجهيز ZIP: ' + (error?.message || 'خطأ غير معروف'));
    }
  }

  function parseGithubRepo(value) {
    let url;
    try { url = new URL(value.trim()); } catch (_) { return null; }
    if (url.hostname.toLowerCase() !== 'github.com') return null;
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/i, '');
    if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) return null;
    return { owner, repo, htmlUrl: `https://github.com/${owner}/${repo}`, actionsUrl: `https://github.com/${owner}/${repo}/actions` };
  }

  function setBuildStatus(state, title, message) {
    els.buildStatus.dataset.state = state;
    els.buildStatus.innerHTML = `<span class="status-bullet"></span><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p></div>`;
  }

  async function checkBuildStatus() {
    const repo = parseGithubRepo(els.githubRepoUrl.value);
    els.buildDetails.hidden = true;
    els.buildDetails.textContent = '';
    if (!repo) {
      setBuildStatus('failure', 'رابط المستودع غير صحيح', 'الصق رابطاً بالشكل https://github.com/username/repository');
      return;
    }
    try { localStorage.setItem('wadFaisalGithubRepo', repo.htmlUrl); } catch (_) { /* اختياري */ }
    els.checkBuildStatus.disabled = true;
    setBuildStatus('running', 'جارٍ فحص GitHub Actions', 'يتم طلب حالة أحدث عملية بناء للمستودع العام.');
    try {
      const apiHeaders = { 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
      const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/actions/workflows/android-apk.yml/runs?per_page=1`, { headers: apiHeaders });
      if (response.status === 404 || response.status === 403) throw new Error('لم نتمكن من قراءة المستودع. قد يكون خاصاً أو أن حد الطلبات العام انتهى. افتح Actions من GitHub وتحقق من صلاحية الوصول.');
      if (!response.ok) throw new Error(`GitHub API ردّ بالحالة ${response.status}. افتح رابط Actions للمراجعة.`);
      const data = await response.json();
      if (!Array.isArray(data.workflow_runs) || data.workflow_runs.length === 0) {
        setBuildStatus('failure', 'ما في تشغيل بناء لحد الآن', 'تأكد أنك رفعت ZIP وفككت ملفاته في جذر المستودع وأن مجلد .github/workflows موجود.');
        showBuildDetails(`<p>رابط المستودع: <a href="${repo.htmlUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(repo.htmlUrl)}</a></p><p>بعد رفع الملفات، افتح تبويب Actions وشغّل Build Android APK إذا لم يبدأ تلقائياً.</p>`);
        return;
      }
      const run = data.workflow_runs[0];
      lastGithubRunUrl = run.html_url || `${repo.actionsUrl}`;
      const runName = run.name || run.display_title || 'GitHub Actions';
      const branch = run.head_branch || 'غير معروف';
      const started = run.run_started_at ? new Date(run.run_started_at).toLocaleString('ar') : 'لم يبدأ بعد';
      const status = run.status;
      if (status !== 'completed') {
        setBuildStatus('running', 'البناء ما زال جارياً', `${runName} — الفرع ${branch} — الحالة: ${status}. وقت البدء: ${started}`);
        showBuildDetails(`<p>تابع نفس التشغيل هنا: <a href="${escapeHtml(lastGithubRunUrl)}" target="_blank" rel="noopener noreferrer">فتح سجل البناء ↗</a></p>`);
        return;
      }
      if (run.conclusion === 'success') {
        setBuildStatus('success', 'نجح البناء ✅', `${runName} اكتمل بنجاح على الفرع ${branch}. افتح Artifacts في صفحة التشغيل لتنزيل APK.`);
        showBuildDetails(`<p>البناء الناجح: <a href="${escapeHtml(lastGithubRunUrl)}" target="_blank" rel="noopener noreferrer">فتح التشغيل والتنزيل من Artifacts ↗</a></p><p>اسم الملف المتوقع: <code>wad-faisal-debug-apk</code></p>`);
        return;
      }
      const summary = `انتهى التشغيل بنتيجة: ${run.conclusion || 'غير معروفة'} — الفرع ${branch} — ${started}`;
      setBuildStatus('failure', 'فشل آخر بناء', `${runName}. ${summary}`);
      let details = `<p>رابط سجل الخطأ الكامل: <a href="${escapeHtml(lastGithubRunUrl)}" target="_blank" rel="noopener noreferrer">فتح سجل GitHub Actions ↗</a></p>`;
      try {
        const jobsResponse = await fetch(`https://api.github.com/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/actions/runs/${encodeURIComponent(run.id)}/jobs?per_page=100`, { headers: apiHeaders });
        if (jobsResponse.ok) {
          const jobsData = await jobsResponse.json();
          const failedJobs = (jobsData.jobs || []).filter(job => job.conclusion === 'failure');
          if (failedJobs.length) {
            details += '<p><strong>المهام الفاشلة والخطوات التي ظهر فيها الفشل:</strong></p><ul>';
            for (const job of failedJobs) {
              const failedSteps = (job.steps || []).filter(step => step.conclusion === 'failure');
              details += `<li><strong>${escapeHtml(job.name || 'مهمة بناء')}</strong>`;
              if (failedSteps.length) details += `<ul>${failedSteps.map(step => `<li>${escapeHtml(step.name || 'خطوة فاشلة')}</li>`).join('')}</ul>`;
              details += '</li>';
            }
            details += '</ul><p>اسم الخطوة يساعدك تحدد مكان الخلل. نص رسالة الخطأ بالتفصيل موجود في سجل التشغيل.</p>';
          } else {
            details += '<p>لم ترجع واجهة GitHub أسماء خطوات فاشلة لهذا التشغيل. افتح السجل الكامل لرؤية الخطأ.</p>';
          }
        } else {
          details += '<p>تعذّر قراءة قائمة الخطوات عبر API العام؛ افتح سجل التشغيل مباشرة.</p>';
        }
      } catch (_) {
        details += '<p>تعذّر قراءة تفاصيل الخطوات. افتح سجل التشغيل مباشرة.</p>';
      }
      showBuildDetails(details, true);
    } catch (error) {
      setBuildStatus('failure', 'تعذّر فحص البناء', error.message || 'تحقق من اتصال الإنترنت ورابط GitHub.');
      const repoLink = parseGithubRepo(els.githubRepoUrl.value);
      if (repoLink) showBuildDetails(`<p>يمكنك فتح GitHub Actions مباشرة: <a href="${repoLink.actionsUrl}" target="_blank" rel="noopener noreferrer">${repoLink.actionsUrl}</a></p><p>المستودعات الخاصة لا يمكن فحصها من صفحة عامة من دون مصادقة. لا تضع رمز GitHub الشخصي داخل هذه الصفحة.</p>`);
    } finally {
      els.checkBuildStatus.disabled = false;
    }
  }

  function showBuildDetails(html, isHtml = true) {
    els.buildDetails.hidden = false;
    if (isHtml) els.buildDetails.innerHTML = html;
    else els.buildDetails.textContent = html;
  }

  function openGithubActionsPage() {
    const repo = parseGithubRepo(els.githubRepoUrl.value);
    if (!repo) {
      window.open('https://github.com/', '_blank', 'noopener,noreferrer');
      showToast('افتح مستودعك على GitHub أولاً والصق رابطه');
      return;
    }
    window.open(repo.actionsUrl, '_blank', 'noopener,noreferrer');
  }

  function clearProject() {
    if (!window.confirm('متأكد داير تمسح محتوى الملفات الثلاثة؟')) return;
    els.html.value = ''; els.css.value = ''; els.js.value = '';
    saveProject(); updateEditorStats(); renderPreview();
    showToast('تم مسح محتوى الملفات');
  }

  function openHelp() { els.modal.hidden = false; els.closeHelp.focus(); }
  function closeHelpModal() { els.modal.hidden = true; }

  function useExample() {
    els.html.value = 'صفحة الرئيسية\nعنوان أهلاً بيك في ود فيصل\nنص هنا فكرتك بتتحول لصفحة قدامك. جرّب تغيّر الألوان من ملف التنسيق.\nزر التالي\nصفحة الثانية\nعنوان الصفحة الثانية\nنص وصلت للصفحة الثانية بالساهل.\nزر السابق\nزر جرّب الزر';
    els.css.value = 'خلي الخلفية #111827\nلون النص #e9efff\nلون العنوان #a69bff\nحجم الخط 17\nمحاذاة وسط\nمسافة 24\nلون الزر #7769ef';
    els.js.value = 'عند الضغط على زر التالي انتقل للصفحة الثانية\nعند الضغط على زر السابق انتقل للصفحة الأولى\nعند الضغط على زر جرّب الزر اعرض رسالة دي أول رحلة ليك مع ود فيصل';
    els.languageMode.value = 'arabic';
    switchFile('html'); saveProject(); updateEditorStats(); renderPreview(); closeHelpModal();
    showToast('المثال جاهز — جرّب الصفحات والألوان والتفاعل');
  }

  async function importFiles(fileList) {
    const files = [...fileList];
    if (!files.length) return;
    let count = 0;
    for (const file of files) {
      const lower = file.name.toLowerCase();
      let key = null;
      if (lower.endsWith('.html') || lower.endsWith('.htm')) key = 'html';
      else if (lower.endsWith('.css')) key = 'css';
      else if (lower.endsWith('.js')) key = 'js';
      if (!key) continue;
      try { FILE_META[key].editor.value = await file.text(); count++; }
      catch (_) { /* تجاوز الملف الذي تعذرت قراءته */ }
    }
    if (count) {
      els.languageMode.value = 'native';
      switchFile(files.some(f => /\.html?$/i.test(f.name)) ? 'html' : files.some(f => /\.css$/i.test(f.name)) ? 'css' : 'js');
      saveProject(); renderPreview(); updateEditorStats();
      showToast(`تم استيراد ${count} ملف`);
    } else showToast('اختار ملفات HTML أو CSS أو JS');
    els.fileInput.value = '';
  }

  function openPreviewInTab() {
    const blob = new Blob([latestDocument || makeDocument()], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) showToast('المتصفح منع النافذة — استخدم تنزيل الملف من المحرر');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  function syncEditorScroll(event) {
    if (event.target !== FILE_META[activeFile].editor) return;
    els.gutter.scrollTop = event.target.scrollTop;
  }

  els.start.addEventListener('click', beginJourney);
  els.showIntro.addEventListener('click', openHelp);
  els.backHome.addEventListener('click', goHome);
  els.apkButton.addEventListener('click', openApkWorkspace);
  els.backToEditor.addEventListener('click', returnToEditor);
  els.prepareApkProject.addEventListener('click', prepareApkProject);
  els.checkBuildStatus.addEventListener('click', checkBuildStatus);
  els.openGithubActions.addEventListener('click', openGithubActionsPage);
  els.githubRepoUrl.addEventListener('change', () => {
    try { localStorage.setItem('wadFaisalGithubRepo', els.githubRepoUrl.value.trim()); } catch (_) { /* اختياري */ }
  });
  $$('.file-item').forEach(button => button.addEventListener('click', () => switchFile(button.dataset.file)));
  Object.values(FILE_META).forEach(meta => {
    meta.editor.addEventListener('input', onEditorInput);
    meta.editor.addEventListener('keyup', updateEditorStats);
    meta.editor.addEventListener('click', updateEditorStats);
    meta.editor.addEventListener('select', updateEditorStats);
    meta.editor.addEventListener('scroll', syncEditorScroll);
    meta.editor.addEventListener('keydown', event => {
      if (event.key === 'Tab') {
        event.preventDefault();
        const textarea = event.currentTarget;
        const start = textarea.selectionStart, end = textarea.selectionEnd;
        textarea.setRangeText('  ', start, end, 'end');
        onEditorInput(event);
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); renderPreview(); showToast('تم تحديث المعاينة'); }
    });
  });
  $$('.command-chip').forEach(button => button.addEventListener('click', () => {
    if (els.languageMode.value !== 'arabic') { showToast('فعّل الأوامر العربية أولاً'); return; }
    switchFile('html');
    insertAtCursor(button.dataset.insert);
  }));
  els.languageMode.addEventListener('change', switchLanguageMode);
  els.autoUpdate.addEventListener('change', () => showToast(els.autoUpdate.checked ? 'التحديث التلقائي شغّال' : 'التحديث التلقائي متوقف — اضغط تشغيل النتيجة'));
  els.run.addEventListener('click', () => { renderPreview(); showToast('تم طلب تحديث المعاينة'); });
  els.clear.addEventListener('click', clearProject);
  els.copy.addEventListener('click', copyCurrentFile);
  els.download.addEventListener('click', downloadCurrentFile);
  els.exportZip.addEventListener('click', exportProject);
  els.upload.addEventListener('click', () => els.fileInput.click());
  els.fileInput.addEventListener('change', event => importFiles(event.target.files));
  els.fullscreen.addEventListener('click', async () => {
    try { await els.browserFrame.requestFullscreen(); }
    catch (_) { showToast('ملء الشاشة غير مدعوم هنا'); }
  });
  els.openPreview.addEventListener('click', openPreviewInTab);
  $$('.device-button').forEach(button => button.addEventListener('click', () => {
    $$('.device-button').forEach(item => item.classList.toggle('active', item === button));
    els.browserFrame.classList.remove('device-tablet', 'device-mobile');
    if (button.dataset.device === 'tablet') els.browserFrame.classList.add('device-tablet');
    if (button.dataset.device === 'mobile') els.browserFrame.classList.add('device-mobile');
  }));
  els.helpButton.addEventListener('click', openHelp);
  els.syntaxHelpButton.addEventListener('click', openHelp);
  els.closeHelp.addEventListener('click', closeHelpModal);
  els.modal.addEventListener('click', event => { if (event.target === els.modal) closeHelpModal(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeHelpModal(); });
  els.tryExample.addEventListener('click', useExample);

  window.WadFaisalBuildZip = buildZip;

  els.html.value = DEFAULTS.html;
  els.css.value = DEFAULTS.css;
  els.js.value = DEFAULTS.js;
  loadProject();
  switchFile('html');
  updateEditorStats();
  renderPreview();
})();


/* ============================================================
   ميزة مستقلة: تحليل صور واجهات المستخدم وتوليد HTML/CSS/JS عبر Gemini.
   ============================================================ */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const page = {
    body: document.body,
    editor: $('#editorApp'),
    apk: $('#apkWorkspace'),
    workspace: $('#imageCodeWorkspace'),
    open: $('#imageToCodeButton'),
    back: $('#backToEditorFromImage'),
    newTask: $('#imageCodeNewTask'),
    input: $('#imageCodeInput'),
    dropzone: $('#imageCodeDropzone'),
    images: $('#imageCodeImages'),
    prompt: $('#imageCodePrompt'),
    generate: $('#generateFromImages'),
    status: $('#imageCodeStatus'),
    tabs: $$('.image-code-file-tab'),
    html: $('#generatedHtml'),
    css: $('#generatedCss'),
    js: $('#generatedJs'),
    copy: $('#copyGeneratedFile'),
    download: $('#downloadGeneratedFile'),
    zip: $('#downloadGeneratedZip'),
    preview: $('#generatedPreview'),
    refresh: $('#refreshGeneratedPreview')
  };
  if (!page.workspace || !page.generate) return;

  // المفتاح المحدث والمعدل الذي تم تجربته بنجاح
  const GEMINI_API_KEYS = [
    'AQ.Ab8RN6JYPMQSFtP4e4hDbB9UPjQKAZ4psBSc2m57mj-CNZkX1g'
  ];

  const GEMINI_MODELS = [
    'gemini-3.5-flash',
    'gemini-3.8-flash',
    'gemini-2.5-flash'
  ];

  const FILES = {
    html: { name: 'index.html', element: page.html },
    css: { name: 'style.css', element: page.css },
    js: { name: 'script.js', element: page.js }
  };
  let activeFile = 'html';
  let selectedImages = [];
  let lastPreview = '';

  function imageStatus(state, title, message) {
    page.status.dataset.state = state;
    const strong = document.createElement('strong');
    strong.textContent = title;
    const p = document.createElement('p');
    p.textContent = message;
    const body = document.createElement('div');
    body.append(strong, p);
    const dot = document.createElement('span');
    dot.className = 'image-code-status-dot';
    page.status.replaceChildren(dot, body);
  }

  function showImageWorkspace() {
    if (page.editor) page.editor.hidden = true;
    if (page.apk) page.apk.hidden = true;
    const landing = $('#landing');
    if (landing) landing.hidden = true;
    page.workspace.hidden = false;
    page.body.classList.remove('landing-mode', 'editor-mode', 'apk-mode');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function backToEditor() {
    page.workspace.hidden = true;
    if (page.editor) page.editor.hidden = false;
    if (page.apk) page.apk.hidden = true;
    const landing = $('#landing');
    if (landing) landing.hidden = true;
    page.body.classList.remove('landing-mode', 'apk-mode');
    page.body.classList.add('editor-mode');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setActiveFile(key) {
    if (!FILES[key]) return;
    activeFile = key;
    for (const [name, file] of Object.entries(FILES)) file.element.hidden = name !== key;
    page.tabs.forEach(tab => {
      const active = tab.dataset.generatedFile === key;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function renderSelectedImages() {
    page.images.replaceChildren();
    if (!selectedImages.length) {
      const empty = document.createElement('div');
      empty.className = 'image-code-empty';
      empty.textContent = 'ما رفعت صور لحد الآن.';
      page.images.append(empty);
      return;
    }
    selectedImages.forEach((file, index) => {
      const card = document.createElement('div');
      card.className = 'image-code-image-item';
      const img = document.createElement('img');
      img.alt = file.name || `الصورة ${index + 1}`;
      img.src = URL.createObjectURL(file);
      img.onload = () => URL.revokeObjectURL(img.src);
      const name = document.createElement('span');
      name.textContent = file.name || `image-${index + 1}`;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `إزالة ${file.name || 'الصورة'}`);
      remove.addEventListener('click', () => {
        selectedImages.splice(index, 1);
        renderSelectedImages();
        imageStatus('idle', 'جاهز', selectedImages.length ? `تم اختيار ${selectedImages.length} صورة.` : 'ارفع الصور أولاً ثم اضغط زر التوليد.');
      });
      card.append(img, name, remove);
      page.images.append(card);
    });
  }

  function addImages(list) {
    const incoming = [...(list || [])].filter(file => file.type && file.type.startsWith('image/'));
    if (!incoming.length) {
      imageStatus('error', 'ما لقينا صور', 'اختار ملفات صور من نوع PNG أو JPG أو WEBP.');
      return;
    }
    const total = selectedImages.length + incoming.length;
    if (total > 5) {
      imageStatus('error', 'عدد الصور كبير', 'المسموح 5 صور في كل طلب. أزل بعض الصور ثم حاول مرة ثانية.');
      return;
    }
    const oversized = incoming.find(file => file.size > 8 * 1024 * 1024);
    if (oversized) {
      imageStatus('error', 'حجم الصورة كبير', `الصورة ${oversized.name} أكبر من 8 ميغابايت. صغّرها ثم ارفعها مرة ثانية.`);
      return;
    }
    selectedImages = selectedImages.concat(incoming);
    renderSelectedImages();
    imageStatus('idle', 'الصور جاهزة', `تم اختيار ${selectedImages.length} صورة. اكتب طلبك الإضافي ثم اضغط التوليد.`);
  }

  async function imageToJpegData(file) {
    if (typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(file);
      const maxSide = 1600;
      const ratio = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * ratio));
      const height = Math.max(1, Math.round(bitmap.height * ratio));
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error('متصفحك لا يدعم تجهيز الصور. جرّب متصفحاً أحدث.');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height);
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close?.();
      const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('فشل ضغط الصورة')), 'image/jpeg', 0.86));
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('تعذرت قراءة الصورة'));
        reader.readAsDataURL(blob);
      });
      return { mimeType: 'image/jpeg', data: dataUrl.split(',')[1] || '' };
    }
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('تعذرت قراءة الصورة'));
      reader.readAsDataURL(file);
    });
    const comma = dataUrl.indexOf(',');
    return { mimeType: file.type || 'image/png', data: comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl };
  }

  function extractJson(response) {
    const parts = response?.candidates?.[0]?.content?.parts || [];
    let text = parts.map(part => part.text || '').join('\n').trim();
    if (!text) {
      const finishReason = response?.candidates?.[0]?.finishReason;
      if (finishReason === 'SAFETY') {
        throw new Error('Gemini رفض المحتوى لأسباب أمان. جرب وصف مختلف أو صور أقل.');
      }
      throw new Error('Gemini رجع نتيجة فارغة. جرب وصف أوضح أو صور أقل.');
    }
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first >= 0 && last > first) text = text.slice(first, last + 1);
    let result;
    try { result = JSON.parse(text); }
    catch (_) {
      try {
        const fixed = text.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']').replace(/\n/g, '\\n').replace(/\r/g, '');
        result = JSON.parse(fixed);
      } catch (_2) {
        throw new Error('تنسيق JSON غير مكتمل. جرب التوليد مرة أخرى — أحياناً Gemini يقطع الرد لو الصور كبيرة.');
      }
    }
    const html = typeof result.html === 'string' ? result.html : (typeof result['index.html'] === 'string' ? result['index.html'] : '');
    const css = typeof result.css === 'string' ? result.css : (typeof result['style.css'] === 'string' ? result['style.css'] : '');
    const js = typeof result.js === 'string' ? result.js : (typeof result['script.js'] === 'string' ? result['script.js'] : '');
    if (!html.trim() || !css.trim()) throw new Error('النتيجة ما فيها HTML وCSS كاملين. جرب صور أوضح أو وصف أقل.');
    return { html, css, js };
  }

  async function callGemini(parts) {
    let lastError = null;
    let triedModels = [];

    for (let modelIndex = 0; modelIndex < GEMINI_MODELS.length; modelIndex++) {
      const model = GEMINI_MODELS[modelIndex];
      triedModels.push(model);

      for (let keyIndex = 0; keyIndex < GEMINI_API_KEYS.length; keyIndex++) {
        const apiKey = GEMINI_API_KEYS[keyIndex];
        if (!apiKey || apiKey === 'ضع_المفتاح_الجديد_هنا') {
          lastError = new Error('مفتاح API غير مضبوط. ضع مفتاحك من AI Studio.');
          continue;
        }

        try {
          // التعديل هنا: تمرير المفتاح في الرابط ?key= بدلاً من الهيدر
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                contents: [{ role: 'user', parts }],
                generationConfig: {
                  responseMimeType: 'application/json',
                  temperature: 0.2
                }
              })
            }
          );

          const data = await response.json().catch(() => ({}));

          if (!response.ok) {
            const detail = data?.error?.message || `HTTP ${response.status}`;
            lastError = new Error(`[${model}] ${detail}`);
            if (response.status === 404) break;
            if ([400, 401, 403, 429].includes(response.status)) continue;
            throw lastError;
          }

          return extractJson(data);
        } catch (error) {
          lastError = error;
          if (error.message.includes('404')) break;
        }
      }
    }

    const message = lastError?.message || 'تعذر الاتصال بخدمة Gemini.';
    const triedList = triedModels.join(' → ');

    if (/API key|authentication|unauthenticated|credential|permission|access token|401|403/i.test(message)) {
      throw new Error(
        'مفتاح API لم يُقبل. الأسباب المحتملة:\n' +
        '1. المفتاح ملغي أو محظور (احصل على مفتاح جديد من aistudio.google.com/apikey)\n' +
        '2. المفتاح غير مقيّد — Gemini يرفض المفاتيح غير المقيّدة. قيّده على Generative Language API\n' +
        '3. المشروع ما عليه تفعيل Gemini API\n' +
        `الموديلات اللي جربناها: ${triedList}`
      );
    }

    if (/quota|rate|429|resource exhausted/i.test(message)) {
      throw new Error('وصلت حد الاستخدام. جرّب بعد دقيقة أو استخدم مفتاح ثاني. الموديلات المجربة: ' + triedList);
    }

    if (/fetch|network|failed to fetch|load failed/i.test(message)) {
      throw new Error('الاتصال فشل. تأكد من الإنترنت وافتح الموقع عبر HTTPS.');
    }

    if (/model_not_found|not found|404/i.test(message)) {
      throw new Error(`الموديل غير متاح لمفتاحك. جربنا: ${triedList}. راجع الموديلات المتاحة في AI Studio.`);
    }

    throw new Error(message.slice(0, 400));
  }

  async function generateFromImages() {
    if (!selectedImages.length) {
      imageStatus('error', 'ارفع صورة أولاً', 'اضغط «اختيار الصور» وحدد صورة واجهة واحدة على الأقل.');
      return;
    }
    if (selectedImages.length > 5) {
      imageStatus('error', 'عدد الصور كبير', 'المسموح 5 صور في كل طلب.');
      return;
    }
    page.generate.disabled = true;
    page.generate.textContent = 'جارٍ تحليل الصور وإنشاء الملفات…';
    imageStatus('working', 'جارٍ تحليل الواجهة', 'نرسل الصور والوصف إلى Gemini. قد تحتاج النتيجة بعض الوقت حسب عدد الصور وحجمها.');
    try {
      const prompt = [
        'You are an expert front-end developer. Analyze the attached screenshot(s) of a website or app UI and recreate the visible design as three separate production-quality files.',
        'Return ONLY a valid JSON object with exactly these string keys: "html", "css", "js". Do not use markdown fences.',
        'html must be a complete standalone index.html document in Arabic-friendly UTF-8 where appropriate. Link to style.css and script.js using relative paths.',
        'css must be the complete style.css, responsive for mobile and desktop, closely matching the screenshots.',
        'js must be the complete script.js, implementing visible interactions where reasonably inferable.',
        `Additional user instructions (Arabic): ${page.prompt.value.trim() || 'أعد إنشاء الواجهة الظاهرة بأقرب شكل ممكن.'}`,
        `Current image count: ${selectedImages.length}.`
      ].join('\n\n');
      const parts = [{ text: prompt }];
      for (const file of selectedImages) {
        const image = await imageToJpegData(file);
        if (!image.data) throw new Error(`تعذّر تجهيز الصورة ${file.name || ''}.`);
        parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
      }
      const result = await callGemini(parts);
      page.html.value = result.html;
      page.css.value = result.css;
      page.js.value = result.js;
      setActiveFile('html');
      renderGeneratedPreview();
      imageStatus('success', 'اكتملت الملفات', 'تم إنشاء index.html وstyle.css وscript.js. راجع المعاينة ثم انسخ الملفات أو نزّلها ZIP.');
    } catch (error) {
      console.error('Image-to-code error:', error);
      imageStatus('error', 'ما قدرنا نكمل التوليد', error?.message || 'حدث خطأ غير معروف. جرّب مرة ثانية.');
    } finally {
      page.generate.disabled = false;
      page.generate.innerHTML = '<span>✦</span> حلّل الصور وأنشئ الملفات';
    }
  }

  function makePreviewDocument() {
    let html = page.html.value.trim();
    const css = page.css.value.replace(/<\/style/gi, '<\\/style');
    const js = page.js.value.replace(/<\/script/gi, '<\\/script');
    if (!html) html = '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main><h1>معاينة الكود الناتج</h1><p>اكتب HTML ثم حدّث المعاينة.</p></main></body></html>';
    html = html.replace(/<link\b[^>]*href\s*=\s*(["'])style\.css\1[^>]*>/gi, '');
    html = html.replace(/<script\b[^>]*src\s*=\s*(["'])script\.js\1[^>]*>\s*<\/script\s*>/gi, '');
    const styleTag = `<style>\n${css}\n</style>`;
    const scriptTag = `<script>\n${js}\n<\/script>`;
    if (/<\/head\s*>/i.test(html)) html = html.replace(/<\/head\s*>/i, `${styleTag}</head>`);
    else if (/<html\b[^>]*>/i.test(html)) html = html.replace(/<html\b[^>]*>/i, match => `${match}<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${styleTag}</head>`);
    else html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${styleTag}</head><body>${html}</body></html>`;
    if (/<\/body\s*>/i.test(html)) html = html.replace(/<\/body\s*>/i, `${scriptTag}</body>`);
    else html += scriptTag;
    return html;
  }

  function renderGeneratedPreview() {
    lastPreview = makePreviewDocument();
    page.preview.srcdoc = lastPreview;
  }

  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = filename; anchor.style.display = 'none';
    document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }
  function downloadCurrentGeneratedFile() {
    const file = FILES[activeFile];
    downloadBlob(file.name, new Blob([file.element.value], { type: 'text/plain;charset=utf-8' }));
  }
  async function copyCurrentGeneratedFile() {
    const text = FILES[activeFile].element.value;
    try {
      await navigator.clipboard.writeText(text);
      imageStatus('success', 'تم النسخ', `تم نسخ محتوى ${FILES[activeFile].name}.`);
    } catch (_) {
      const editor = FILES[activeFile].element;
      editor.focus(); editor.select();
      const ok = document.execCommand('copy');
      imageStatus(ok ? 'success' : 'idle', ok ? 'تم النسخ' : 'انسخ يدوياً', ok ? `تم نسخ ${FILES[activeFile].name}.` : 'حدّد النص وانسخه من لوحة المفاتيح.');
    }
  }
  function downloadGeneratedZip() {
    const entries = Object.entries(FILES).map(([key, file]) => ({ name: file.name, data: file.element.value }));
    entries.push({ name: 'README-AR.txt', data: 'مشروع مولد من الصور عبر ود فيصل.\n\nالملفات: index.html وstyle.css وscript.js\nافتح index.html في متصفح حديث، وتأكد من اختبار الكود قبل النشر.\n' });
    if (typeof window.WadFaisalBuildZip !== 'function') {
      imageStatus('error', 'ميزة ZIP غير جاهزة', 'حدّث script.js إلى النسخة الجديدة ثم أعد تحميل الصفحة.');
      return;
    }
    downloadBlob('wad-faisal-image-to-code.zip', window.WadFaisalBuildZip(entries));
    imageStatus('success', 'تم تجهيز ZIP', 'حمّل الملف المضغوط وافتحه لتحصل على الملفات الثلاثة المستقلة.');
  }

  page.open.addEventListener('click', showImageWorkspace);
  page.back.addEventListener('click', backToEditor);
  page.input.addEventListener('change', event => { addImages(event.target.files); page.input.value = ''; });
  page.dropzone.addEventListener('click', () => page.input.click());
  page.dropzone.addEventListener('dragover', event => { event.preventDefault(); page.dropzone.classList.add('dragover'); });
  page.dropzone.addEventListener('dragleave', () => page.dropzone.classList.remove('dragover'));
  page.dropzone.addEventListener('drop', event => { event.preventDefault(); page.dropzone.classList.remove('dragover'); addImages(event.dataTransfer?.files); });
  page.newTask.addEventListener('click', () => {
    selectedImages = [];
    page.prompt.value = 'أنشئ واجهة قريبة جداً من الصور المرفوعة. التزم بترتيب العناصر والألوان والمسافات والخطوط الظاهرة. اجعلها متجاوبة مع الهاتف والكمبيوتر، وأضف التفاعلات المنطقية للعناصر الواضحة. اللغة العربية واتجاه RTL إذا كانت الصورة عربية.';
    for (const file of Object.values(FILES)) file.element.value = '';
    renderSelectedImages(); setActiveFile('html'); renderGeneratedPreview();
    imageStatus('idle', 'مشروع جديد', 'ارفع صوراً جديدة ثم ابدأ التوليد.');
  });
  page.generate.addEventListener('click', generateFromImages);
  page.tabs.forEach(tab => tab.addEventListener('click', () => setActiveFile(tab.dataset.generatedFile)));
  Object.values(FILES).forEach(file => file.element.addEventListener('input', renderGeneratedPreview));
  page.copy.addEventListener('click', copyCurrentGeneratedFile);
  page.download.addEventListener('click', downloadCurrentGeneratedFile);
  page.zip.addEventListener('click', downloadGeneratedZip);
  page.refresh.addEventListener('click', renderGeneratedPreview);
  renderSelectedImages();
  renderGeneratedPreview();
})();
