(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const els = {
    body: document.body, landing: $('#landing'), editorApp: $('#editorApp'), start: $('#startJourney'), showIntro: $('#showIntro'), plane: $('#heroPlane'), backHome: $('#backHome'),
    html: $('#htmlEditor'), css: $('#cssEditor'), js: $('#jsEditor'), gutter: $('#lineGutter'), currentFileLabel: $('#currentFileLabel'), languageIndicator: $('#languageIndicator'), languageMode: $('#languageMode'),
    autoUpdate: $('#autoUpdate'), run: $('#runButton'), clear: $('#clearButton'), copy: $('#copyButton'), download: $('#downloadFileButton'), exportZip: $('#exportZip'), fileInput: $('#fileInput'), upload: $('#uploadButton'),
    previewFrame: $('#previewFrame'), browserFrame: $('#browserFrame'), fullscreen: $('#fullscreenButton'), openPreview: $('#openPreviewTab'), previewStage: $('#previewStage'), saveStatus: $('#saveStatus'), lineInfo: $('#lineInfo'), charInfo: $('#charInfo'),
    helpButton: $('#helpButton'), syntaxHelpButton: $('#syntaxHelpButton'), modal: $('#helpModal'), closeHelp: $('#closeHelp'), tryExample: $('#tryExample'), toast: $('#toast')
  };

  const FILE_META = {
    html: { name: 'index.html', label: 'هيكل الصفحة', editor: els.html },
    css: { name: 'style.css', label: 'الألوان والتنسيق', editor: els.css },
    js: { name: 'script.js', label: 'التفاعل والحركة', editor: els.js }
  };
  const STORAGE_KEY = 'wadFaisalArabicEditor.v1';
  const DEFAULTS = {
    html: '/عنوان مرحباً بيك يا عالم)\n/نص دي أول تجربة لي في ود فيصل. اكتب أوامرك بالعربي وشوف النتيجة قدامك)\n/زر اضغط هنا)\n/رابط https://open-urls.com | شوف مثال لمحرر مواقع) ',
    css: '/خلفية #f4f6ff)\n/لون #202743)\n/لون العنوان #6157d9)\n/حجم الخط 17px)\n/محاذاة وسط)\n/مسافة 20px)\n/لون الزر #6558dc)',
    js: '/عند الضغط على زر اضغط هنا اعرض تنبيه أهلاً بيك في ود فيصل)'
  };
  let activeFile = 'html';
  let toastTimer = 0;
  let renderTimer = 0;
  let latestDocument = '';

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2400);
  }

  function beginJourney() {
    if (!els.editorApp.hidden) return;
    els.body.classList.add('launching');
    els.plane?.classList.add('taking-off');
    setTimeout(() => {
      els.landing.hidden = true;
      els.editorApp.hidden = false;
      els.body.classList.remove('landing-mode', 'launching');
      els.body.classList.add('editor-mode');
      renderPreview();
      updateEditorStats();
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 760);
  }

  function goHome(event) {
    event?.preventDefault();
    els.editorApp.hidden = true;
    els.landing.hidden = false;
    els.body.classList.remove('editor-mode', 'launching');
    els.body.classList.add('landing-mode');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    els.languageIndicator.textContent = els.languageMode.value === 'arabic' ? (file === 'html' ? 'لغة ود فيصل' : 'أوامر عربية مبسطة') : (file === 'html' ? 'HTML' : file === 'css' ? 'CSS' : 'JavaScript');
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
    } catch (error) {
      els.saveStatus.textContent = 'تعذّر الحفظ';
    }
  }

  function loadProject() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (typeof saved.html === 'string') els.html.value = saved.html;
      if (typeof saved.css === 'string') els.css.value = saved.css;
      if (typeof saved.js === 'string') els.js.value = saved.js;
      if (saved.mode === 'arabic' || saved.mode === 'native') els.languageMode.value = saved.mode;
    } catch (_) { /* تجاهل بيانات الحفظ غير السليمة واستعمل المثال الافتراضي. */ }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
  }

  function splitCommandPayload(payload) {
    const divider = payload.indexOf('|');
    return divider < 0 ? [payload.trim(), ''] : [payload.slice(0, divider).trim(), payload.slice(divider + 1).trim()];
  }

  function parseArabicHtml(source) {
    const lines = source.replace(/\r/g, '').split('\n');
    const blocks = [];
    for (const original of lines) {
      const line = original.trim();
      if (!line) continue;
      // أي سطر لا يتبع صيغة الأمر يُترك كـ HTML أصلي، ما يتيح المزج بين الطريقتين.
      const match = line.match(/^\/(عنوان2|عنوان|نص|زر|رابط|صورة|فاصل|سطر جديد|قائمة|عنصر|بطاقة)\s*(.*?)\)\s*$/);
      if (!match) { blocks.push(original); continue; }
      const command = match[1];
      const payload = match[2].trim();
      const [first, second] = splitCommandPayload(payload);
      if (command === 'عنوان') blocks.push(`<h1>${escapeHtml(payload)}</h1>`);
      else if (command === 'عنوان2') blocks.push(`<h2>${escapeHtml(payload)}</h2>`);
      else if (command === 'نص') blocks.push(`<p>${escapeHtml(payload)}</p>`);
      else if (command === 'زر') blocks.push(`<button type="button" class="wf-user-button">${escapeHtml(payload || 'اضغط هنا')}</button>`);
      else if (command === 'رابط') {
        const url = safeUrl(first);
        blocks.push(`<p><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(second || first || 'افتح الرابط')}</a></p>`);
      } else if (command === 'صورة') {
        const url = safeUrl(first);
        blocks.push(`<img src="${escapeHtml(url)}" alt="${escapeHtml(second || 'صورة')}">`);
      } else if (command === 'فاصل') blocks.push('<hr>');
      else if (command === 'سطر جديد') blocks.push('<br>');
      else if (command === 'قائمة') {
        const items = payload.split(/[؛;]/).map(x => x.trim()).filter(Boolean);
        blocks.push(`<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`);
      } else if (command === 'عنصر') blocks.push(`<li>${escapeHtml(payload)}</li>`);
      else if (command === 'بطاقة') blocks.push(`<article class="wf-card">${escapeHtml(payload)}</article>`);
    }
    return blocks.join('\n');
  }

  function safeUrl(value) {
    const trimmed = String(value || '').trim();
    if (/^(https?:|mailto:|tel:|\/|#)/i.test(trimmed)) return trimmed;
    return '#';
  }

  function parseArabicCss(source) {
    const lines = source.replace(/\r/g, '').split('\n');
    const declarations = { root: [], body: [], headings: [], button: [], accent: '#6558dc' };
    let custom = [];
    const toCssLength = value => /^\d+(\.\d+)?$/.test(value) ? `${value}px` : value;
    for (const original of lines) {
      const line = original.trim();
      if (!line) continue;
      const match = line.match(/^\/(خلفية|لون العنوان|لون الزر|لون|حجم الخط|محاذاة|مسافة|استدارة)\s*(.*?)\)\s*$/);
      if (!match) { custom.push(original); continue; }
      const [, command, raw] = match;
      const value = raw.trim();
      if (!value) continue;
      switch (command) {
        case 'خلفية': declarations.body.push(`background:${value};`); break;
        case 'لون': declarations.body.push(`color:${value};`); break;
        case 'لون العنوان': declarations.headings.push(`color:${value};`); break;
        case 'لون الزر': declarations.accent = value; declarations.button.push(`background:${value};`); break;
        case 'حجم الخط': declarations.body.push(`font-size:${toCssLength(value)};`); break;
        case 'محاذاة': declarations.body.push(`text-align:${({ 'وسط':'center', 'يمين':'right', 'يسار':'left', 'توسيط':'center' })[value] || value};`); break;
        case 'مسافة': declarations.body.push(`padding:${toCssLength(value)};`); break;
        case 'استدارة': declarations.root.push(`--wf-radius:${toCssLength(value)};`); break;
      }
    }
    const generated = `:root{${declarations.root.join('')}}\nbody{${declarations.body.join('')}}\nh1,h2{${declarations.headings.join('')}}\n.wf-user-button{${declarations.button.join('')}}\n`;
    return generated + custom.join('\n');
  }

  function parseArabicJs(source) {
    const lines = source.replace(/\r/g, '').split('\n');
    const commands = [];
    const raw = [];
    for (const original of lines) {
      const line = original.trim();
      if (!line) continue;
      const match = line.match(/^\/عند الضغط على زر\s+(.+?)\s+اعرض تنبيه\s+(.+?)\)\s*$/);
      if (match) {
        const buttonText = match[1].replace(/^['"“”]|['"“”]$/g, '').trim();
        const message = match[2].replace(/^['"“”]|['"“”]$/g, '').trim();
        commands.push(`document.querySelectorAll('button').forEach(function(button){if(button.textContent.trim()===${JSON.stringify(buttonText)}){button.addEventListener('click',function(){alert(${JSON.stringify(message)});});}});`);
      } else {
        raw.push(original);
      }
    }
    return [...raw, ...commands].filter(Boolean).join('\n');
  }

  function getCompiledFiles() {
    const arabic = els.languageMode.value === 'arabic';
    const html = arabic ? parseArabicHtml(els.html.value) : els.html.value;
    const css = arabic ? parseArabicCss(els.css.value) : els.css.value;
    const js = arabic ? parseArabicJs(els.js.value) : els.js.value;
    return { html, css, js };
  }

  function makeDocument() {
    const files = getCompiledFiles();
    const htmlSource = files.html.trim() || '<main><h1>أهلاً بيك</h1><p>ابدأ الكتابة عشان تظهر النتيجة.</p></main>';
    const cssSource = `*{box-sizing:border-box}body{margin:0;min-height:100vh;font-family:Tahoma,Arial,sans-serif;line-height:1.8;padding:clamp(18px,4vw,50px);direction:rtl;overflow-wrap:anywhere}h1{font-size:clamp(1.7rem,4vw,2.8rem);line-height:1.35}h2{line-height:1.4}p{line-height:2}img{max-width:100%;height:auto;border-radius:var(--wf-radius,12px)}button,.wf-user-button{border:0;border-radius:var(--wf-radius,10px);padding:11px 18px;cursor:pointer;font:inherit;background:#6558dc;color:white}a{color:#6558dc}li{margin:5px 0}.wf-card{border:1px solid #b9bfd3;border-radius:var(--wf-radius,12px);padding:18px;margin:12px 0}\n${files.css}`;
    // يُعزل كود المعاينة داخل iframe بميزة sandbox="allow-scripts".
    return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${cssSource.replace(/<\/style/gi, '<\\/style')}</style></head><body>${htmlSource.replace(/<\/body/gi, '<\\/body').replace(/<\/html/gi, '<\\/html')}<script>${files.js.replace(/<\/script/gi, '<\\/script')}</script></body></html>`;
  }

  function renderPreview() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => {
      latestDocument = makeDocument();
      els.previewFrame.srcdoc = latestDocument;
      els.saveStatus.textContent = 'جارٍ حفظ التغييرات…';
      saveProject();
    }, 90);
  }

  function onEditorInput(event) {
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
    els.languageIndicator.textContent = arabic ? (activeFile === 'html' ? 'لغة ود فيصل' : 'أوامر عربية مبسطة') : (activeFile === 'html' ? 'HTML' : activeFile === 'css' ? 'CSS' : 'JavaScript');
    $$('.command-chip').forEach(button => { button.disabled = !arabic; });
    saveProject();
    renderPreview();
    showToast(arabic ? 'تم تفعيل الأوامر العربية' : 'تم تفعيل كتابة HTML وCSS وJavaScript');
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
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function downloadCurrentFile() {
    const meta = FILE_META[activeFile];
    downloadBlob(meta.name, new Blob([meta.editor.value], { type: 'text/plain;charset=utf-8' }));
    showToast(`بدأ تنزيل ${meta.name}`);
  }

  function downloadSingleHtml() {
    const doc = makeDocument();
    downloadBlob('wad-faisal-preview.html', new Blob([doc], { type: 'text/html;charset=utf-8' }));
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

  // إنشاء ZIP بدون مكتبات خارجية: مخزن بلا ضغط، ويدعم أسماء الملفات UTF-8.
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
        new Uint8Array(le16(0)), new Uint8Array(le16(0)), new Uint8Array(le32(0)), new Uint8Array(le32(localOffset)), name
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
      { name: 'README-AR.txt', data: 'مشروع ود فيصل\n\nالملفات: index.html وstyle.css وscript.js\nافتح index.html في متصفح حديث.\nالأوامر العربية تعمل في محرر ود فيصل عند اختيار وضع الأوامر العربية.\n' }
    ];
    downloadBlob('wad-faisal-project.zip', buildZip(files));
    showToast('جهّزنا ملفات المشروع في ملف ZIP');
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
    els.html.value = '/عنوان أهلاً بيك في ود فيصل)\n/نص هنا فكرتك بتتحول لصفحة قدامك. جرّب تغيّر الألوان من ملف التنسيق.)\n/زر جرّب الزر)\n/صورة https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1000&q=80 | منظر ليلي جميل)';
    els.css.value = '/خلفية #111827)\n/لون #e9efff)\n/لون العنوان #a69bff)\n/حجم الخط 17px)\n/محاذاة وسط)\n/مسافة 24px)\n/لون الزر #7769ef)';
    els.js.value = '/عند الضغط على زر جرّب الزر اعرض تنبيه دي أول رحلة ليك مع ود فيصل)';
    els.languageMode.value = 'arabic';
    switchFile('html'); saveProject(); updateEditorStats(); renderPreview(); closeHelpModal();
    showToast('المثال جاهز — عدّل النص والألوان براحتك');
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
      try {
        FILE_META[key].editor.value = await file.text();
        count++;
      } catch (_) { /* تجاوز أي ملف تعذّرت قراءته */ }
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
    if (!win) showToast('المتصفح منع النافذة — استخدم تنزيل HTML');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  function syncEditorScroll(event) {
    if (event.target !== FILE_META[activeFile].editor) return;
    els.gutter.scrollTop = event.target.scrollTop;
  }

  // ربط الأحداث
  els.start.addEventListener('click', beginJourney);
  els.showIntro.addEventListener('click', openHelp);
  els.backHome.addEventListener('click', goHome);
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
    const command = button.dataset.insert;
    switchFile('html');
    insertAtCursor(command);
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

  // تشغيل أولي
  els.html.value = DEFAULTS.html;
  els.css.value = DEFAULTS.css;
  els.js.value = DEFAULTS.js;
  loadProject();
  switchFile('html');
  updateEditorStats();
  renderPreview();
})();
