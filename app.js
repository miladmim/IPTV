/* Parto TV - 100% Client-Side Static Edition (No PHP / No Backend required)
   Runs on GitHub Pages, GitLab Pages, local files, and Smart TVs. */
(function () {
'use strict';

// ------------------------------------------------------------------ helpers
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
function esc(s) {
  return String(s || '').replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function fmt(n) { return Number(n || 0).toLocaleString('en-US'); }
function ic(name, cls) { return '<svg class="ic' + (cls ? ' ' + cls : '') + '"><use href="#i-' + name + '" xlink:href="#i-' + name + '"/></svg>'; }

var store = {
  get: function (k, d) { try { var v = localStorage.getItem('parto.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set: function (k, v) { try { localStorage.setItem('parto.' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  remove: function (k) { try { localStorage.removeItem('parto.' + k); } catch (e) {} }
};

var BASE = location.pathname.replace(/[^\/]*$/, '');

function getJson(url, opts) {
  return fetch(url, opts).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  });
}

// ------------------------------------------------------------------ i18n
var I18N = {
  fa: {
    search: 'جستجوی کانال…', fOnline: 'فعال', fAll: 'همه', fOffline: 'قطع', sort: 'مرتب‌سازی',
    sNum: 'شماره', sName: 'نام', sPing: 'پینگ', analyze: 'تحلیل پلی‌لیست', settings: 'تنظیمات',
    favorites: 'علاقه‌مندی‌ها', recent: 'اخیراً دیده‌شده', allCh: 'همه کانال‌ها', sources: 'پلی‌لیست‌ها', categories: 'دسته‌بندی', countries: 'کشورها',
    channelsN: '{n} کانال', scanning: 'در حال بررسی کانال‌ها: {done} از {total}', scanDone: 'بررسی کامل شد: {on} کانال فعال',
    emptyTitle: 'کانالی پیدا نشد', emptyScan: 'کانال‌ها در حال بررسی‌اند و به‌زودی اینجا نمایش داده می‌شوند.',
    emptyHint: 'عبارت جستجو یا فیلتر را تغییر دهید.', emptyFav: 'روی ستاره‌ی کنار هر کانال بزنید تا اینجا ذخیره شود.', emptyRecent: 'هنوز کانالی تماشا نکرده‌اید.',
    emptyOn: 'در این دسته کانال فعالی نیست. «همه» را انتخاب کنید.',
    resume: 'ادامه: {name}', live: 'زنده', buffering: 'بافر', loading: 'در حال اتصال…', retrying: 'در حال اتصال مجدد…',
    noSignal: 'سیگنال دریافت نمی‌شود', noSignalHint: 'این کانال الان پاسخ نمی‌دهد. دوباره امتحان کنید، حالت پروکسی را تغییر دهید یا کانال دیگری را انتخاب کنید.',
    retry: 'تلاش دوباره', nextCh: 'کانال بعدی', direct: 'پخش مستقیم', close: 'بستن', unsupported: 'این نوع کانال در مرورگر پخش نمی‌شود',
    noChannel: 'کانالی با این شماره نیست', quality: 'کیفیت', auto: 'خودکار', chList: 'فهرست کانال‌ها', fullscreen: 'تمام‌صفحه', pip: 'تصویر در تصویر',
    mute: 'بی‌صدا', fav: 'علاقه‌مندی', info: 'اطلاعات', ping: 'پینگ', serverPing: 'تأخیر CDN', noHls: 'مرورگر شما پخش HLS را پشتیبانی نمی‌کند.',
    anTitle: 'تحلیل پلی‌لیست‌ها', anParsed: '{n} کانال در سیستم آماده است', anSource: 'پلی‌لیست', anChannels: 'کانال', anOn: 'فعال', anOff: 'قطع',
    anUnsup: 'ناسازگار', anUnk: 'بررسی‌نشده', anMedian: 'پینگ میانه', anFastest: 'سریع‌ترین کانال‌ها', anDist: 'توزیع پینگ کانال‌های فعال',
    anRescan: 'بررسی آنلاین کانال‌ها', anRescanned: 'بررسی آغاز شد', anWait: 'در حال بررسی…', anServer: 'وضعیت استقرار',
    anViewers: 'میزبانی', anCache: 'ذخیره‌سازی', anCacheSize: 'کانال‌های بررسی‌شده', anLastCron: 'موتور استاتیک', anTraffic: 'ترافیک', anUptime: 'پلتفرم', anKinds: 'کانال‌های نیازمند پلیر خارجی',
    anHint: 'این نسخه بدون سرور و هاست کار می‌کند. پینگ و بررسی زنده با سرعت بالا مستقیم از طریق مرورگر شما انجام می‌شود.',
    setTitle: 'تنظیمات', setLang: 'زبان', setTv: 'حالت تلویزیون (رابط بزرگ‌تر)', setAuto: 'خودکار', setOn: 'روشن', setOff: 'خاموش',
    setProxy: 'حالت اتصال به استریم', proxyDirect: 'مستقیم (سریع)', proxyCors: 'پروکسی CORS عمومی', proxyCustom: 'پروکسی اختصاصی',
    customProxyUrl: 'آدرس پروکسی سفارشی (مثلاً Cloudflare Worker):',
    addM3u: 'افزودن پلی‌لیست دلخواه', addM3uHint: 'آدرس اینترنتی فایل M3U یا انتخاب فایل:', addM3uBtn: 'بارگذاری پلی‌لیست',
    clearCache: 'پاک‌سازی داده‌ها و علاقه‌مندی‌ها', clearCacheDone: 'داده‌ها پاک شد',
    setInstall: 'نصب به‌عنوان اپ', keys: 'کلیدها', kZap: 'تغییر کانال', kList: 'فهرست', kNum: 'رفتن به شماره', kInfo: 'اطلاعات', kFav: 'علاقه‌مندی (فهرست)', kBack: 'بازگشت', kVol: 'صدا',
    kinds: { dash: 'DASH', flv: 'FLV', proto: 'RTMP/MMS', drm: 'DRM', file: 'فایل مستقیم' },
    rStat: 'وضعیت', statRes: 'وضوح', statRate: 'نرخ بیت', statBuf: 'بافر', statDrop: 'فریم افتاده', statLat: 'تأخیر از زنده', statOrigin: 'پینگ استریم', statMode: 'حالت اتصال',
    modeProxy: 'از طریق پروکسی', modeDirect: 'مستقیم'
  },
  en: {
    search: 'Search channels…', fOnline: 'Online', fAll: 'All', fOffline: 'Offline', sort: 'Sort',
    sNum: 'Number', sName: 'Name', sPing: 'Ping', analyze: 'Playlist analysis', settings: 'Settings',
    favorites: 'Favorites', recent: 'Recently watched', allCh: 'All channels', sources: 'Playlists', categories: 'Categories', countries: 'Countries',
    channelsN: '{n} channels', scanning: 'Checking channels: {done} of {total}', scanDone: 'Scan complete: {on} channels online',
    emptyTitle: 'No channels found', emptyScan: 'Channels are still being checked and will appear here shortly.',
    emptyHint: 'Change the search or the filter.', emptyFav: 'Tap the star next to a channel to save it here.', emptyRecent: 'You have not watched anything yet.',
    emptyOn: 'No online channels in this category. Choose "All".',
    resume: 'Resume: {name}', live: 'LIVE', buffering: 'BUFFERING', loading: 'Connecting…', retrying: 'Reconnecting…',
    noSignal: 'No signal', noSignalHint: 'This channel is not responding right now. Try again, toggle proxy, or pick another channel.',
    retry: 'Try again', nextCh: 'Next channel', direct: 'Play directly', close: 'Close', unsupported: 'This channel type cannot play in a browser',
    noChannel: 'No channel with that number', quality: 'Quality', auto: 'Auto', chList: 'Channel list', fullscreen: 'Fullscreen', pip: 'Picture in picture',
    mute: 'Mute', fav: 'Favorite', info: 'Info', ping: 'Ping', serverPing: 'CDN Latency', noHls: 'Your browser cannot play HLS streams.',
    anTitle: 'Playlist analysis', anParsed: '{n} channels loaded in browser', anSource: 'Playlist', anChannels: 'Channels', anOn: 'Online', anOff: 'Offline',
    anUnsup: 'Unsupported', anUnk: 'Unchecked', anMedian: 'Median ping', anFastest: 'Fastest channels', anDist: 'Ping distribution of online channels',
    anRescan: 'Test channels online', anRescanned: 'Scan started', anWait: 'Scanning…', anServer: 'Deployment Info',
    anViewers: 'Hosting', anCache: 'Storage', anCacheSize: 'Checked channels', anLastCron: 'Static Engine', anTraffic: 'Traffic', anUptime: 'Platform', anKinds: 'Streams requiring external player',
    anHint: 'This edition runs serverless on GitHub/GitLab Pages. Live stream checks and pings run directly in your browser.',
    setTitle: 'Settings', setLang: 'Language', setTv: 'TV mode (larger interface)', setAuto: 'Auto', setOn: 'On', setOff: 'Off',
    setProxy: 'Stream connection mode', proxyDirect: 'Direct (Fast)', proxyCors: 'Public CORS proxy', proxyCustom: 'Custom proxy',
    customProxyUrl: 'Custom proxy URL (e.g. Cloudflare Worker):',
    addM3u: 'Add custom playlist', addM3uHint: 'Enter M3U URL or select file:', addM3uBtn: 'Load Playlist',
    clearCache: 'Reset cache & favorites', clearCacheDone: 'Data reset done',
    setInstall: 'Install as app', keys: 'Keys', kZap: 'Change channel', kList: 'List', kNum: 'Go to number', kInfo: 'Info', kFav: 'Favorite (list)', kBack: 'Back', kVol: 'Volume',
    kinds: { dash: 'DASH', flv: 'FLV', proto: 'RTMP/MMS', drm: 'DRM', file: 'Direct file' },
    rStat: 'Status', statRes: 'Resolution', statRate: 'Bitrate', statBuf: 'Buffer', statDrop: 'Dropped', statLat: 'Live latency', statOrigin: 'Stream ping', statMode: 'Mode',
    modeProxy: 'via proxy', modeDirect: 'direct'
  }
};

var GROUP_FA = {
  General: 'عمومی', News: 'خبری', Sports: 'ورزشی', Music: 'موسیقی', Movies: 'فیلم',
  Kids: 'کودک', Entertainment: 'سرگرمی', Religious: 'مذهبی', Series: 'سریال',
  Legislative: 'پارلمانی', Education: 'آموزشی', Culture: 'فرهنگی', Documentary: 'مستند',
  Lifestyle: 'سبک زندگی', Shop: 'فروشگاهی', Comedy: 'کمدی', Business: 'اقتصادی',
  Animation: 'انیمیشن', Family: 'خانواده', Outdoor: 'طبیعت', Classic: 'کلاسیک',
  Travel: 'سفر', Cooking: 'آشپزی', Science: 'علمی', Public: 'همگانی', Auto: 'خودرو',
  Weather: 'هواشناسی', Relax: 'آرامش'
};

var S = {
  lang: store.get('lang', 'fa'),
  tvMode: store.get('tv', 'auto'),
  status: store.get('status', 'on'),
  sort: store.get('sort', 'num'),
  proxyMode: store.get('proxy_mode', 'direct'), // 'direct', 'cors', 'custom'
  customProxy: store.get('custom_proxy', ''),
  cat: store.get('cat', { type: 'all', val: null }),
  q: '',
  ch: [],
  byId: {},
  groups: [],
  sources: [],
  ver: 0,
  view: [],
  favs: store.get('favs', {}),
  recent: store.get('recent', []),
  prog: null,
  ctyOpen: false,
  cnt: null,
  statusOverrides: store.get('status_overrides', {})
};

function t(k, v) {
  var s = (I18N[S.lang] && I18N[S.lang][k]) || I18N.en[k] || k;
  if (v && typeof s === 'string') Object.keys(v).forEach(function (n) { s = s.replace('{' + n + '}', v[n]); });
  return s;
}
function rtl() { return S.lang === 'fa'; }

// ------------------------------------------------------------------ text normalisation / names
function norm(s) {
  s = String(s || '').toLowerCase();
  try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (e) { /* old engines */ }
  return s.replace(/[\u064a\u0649]/g, '\u06cc').replace(/\u0643/g, '\u06a9').replace(/[\u200c\u200d]/g, '')
    .replace(/[\u0660-\u0669]/g, function (c) { return c.charCodeAt(0) - 0x660; })
    .replace(/[\u06f0-\u06f9]/g, function (c) { return c.charCodeAt(0) - 0x6f0; });
}

var regionNames = {};
function regionName(cc) {
  if (!cc) return '';
  var key = S.lang + cc;
  if (regionNames[key]) return regionNames[key];
  var n = cc.toUpperCase();
  try { n = new Intl.DisplayNames([S.lang], { type: 'region' }).of(cc.toUpperCase()) || n; } catch (e) { /* keep code */ }
  regionNames[key] = n;
  return n;
}

function gName(i) { var g = S.groups[i] || ''; return S.lang === 'fa' ? (GROUP_FA[g] || g) : g; }
function srcName(i) { var s = S.sources[i]; return s ? (S.lang === 'fa' ? s.fa : s.en) : ''; }
function hue(str) { var h = 0; for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360; return h; }
function initials(name) {
  var m = String(name).replace(/[^A-Za-z0-9\u00C0-\u024F\u0400-\u04FF\u0590-\u06FF ]/g, ' ').trim().split(/\s+/);
  if (!m[0]) return '?';
  return (m.length > 1 ? m[0].charAt(0) + m[1].charAt(0) : m[0].slice(0, 2)).toUpperCase();
}

function sigLevel(ms) { return ms < 250 ? 4 : ms < 600 ? 3 : ms < 1200 ? 2 : 1; }
function sigHtml(ch, big) {
  if (ch.s === 1) return '<span class="sg l' + sigLevel(ch.ms) + '"><i></i><i></i><i></i><i></i></span>' + (big ? '' : '<em>' + ch.ms + ' ms</em>');
  return '<span class="sg l0"><i></i><i></i><i></i><i></i></span>' + (big ? '' : '<em>' + (ch.s === 2 ? '\u2715' : ch.s === 3 ? 'n/a' : '\u2026') + '</em>');
}

// ------------------------------------------------------------------ toast
var toastTimer = 0;
function toast(msg, ms) {
  var el = $('#ptoast');
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.hidden = true; }, ms || 1800);
}

// ------------------------------------------------------------------ language / tv mode / static text
function isTvDevice() {
  var ua = navigator.userAgent || '';
  return /Tizen|Web0S|WebOS|SmartTV|SMART-TV|HbbTV|NetCast|AFT[A-Z]|Android.*\bTV\b|BRAVIA|CrKey|Roku|VIDAA|Hisense/i.test(ua);
}

function applyMode() {
  var tv = S.tvMode === 'on' || (S.tvMode === 'auto' && isTvDevice());
  document.documentElement.classList.toggle('tv', tv);
  document.documentElement.lang = S.lang;
  document.documentElement.dir = rtl() ? 'rtl' : 'ltr';
  $$('[data-i18n]').forEach(function (e) { e.textContent = t(e.getAttribute('data-i18n')); });
  $$('[data-i18n-ph]').forEach(function (e) { e.placeholder = t(e.getAttribute('data-i18n-ph')); });
  $$('[data-i18n-title]').forEach(function (e) { var s = t(e.getAttribute('data-i18n-title')); e.title = s; e.setAttribute('aria-label', s); });
  $('#brandName').textContent = S.lang === 'fa' ? 'پرتو' : 'Parto';
  $('#sortBtn').textContent = t('sort') + ': ' + t({ num: 'sNum', name: 'sName', ping: 'sPing' }[S.sort]);
  $('#bPrev').title = $('#bNext').title = t('nextCh');
  $('#bList').title = t('chList'); $('#bQual').title = t('quality'); $('#bInfo').title = t('info');
  $('#bDirect').title = t('direct'); $('#bPip').title = t('pip'); $('#bMute').title = t('mute'); $('#bFull').title = t('fullscreen'); $('#bFav').title = t('fav');
  $$('#statusSeg button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-s') === S.status); });
  measure();
}

// ------------------------------------------------------------------ data
function build(d) {
  S.ver = d.v || 4;
  S.groups = d.groups || [];
  S.sources = d.sources || [];
  S.byId = {};
  var overrides = S.statusOverrides || {};

  S.ch = (d.ch || []).map(function (a, i) {
    var id = a[0];
    var ov = overrides[id];
    var s = ov && ov.s !== undefined ? ov.s : (a[10] || 0);
    var ms = ov && ov.ms !== undefined ? ov.ms : (a[11] || 0);

    var c = {
      i: i,
      id: id,
      n: i + 1,
      name: a[1],
      url: a[2],
      logo: a[3] || '',
      g: a[4] || [],
      c: a[5] || '',
      q: a[6] || 0,
      src: a[7] !== undefined ? a[7] : 0,
      fl: a[8] || 0,
      kind: a[9] || 'hls',
      s: s,
      ms: ms,
      nk: norm(a[1]),
      key: ''
    };
    S.byId[c.id] = c;
    return c;
  });
  buildKeys();
}

function buildKeys() {
  S.ch.forEach(function (c) {
    var extra = [];
    c.g.forEach(function (gi) { extra.push(S.groups[gi], GROUP_FA[S.groups[gi]] || ''); });
    if (c.c) extra.push(c.c, regionName(c.c));
    extra.push(srcName(c.src));
    c.key = c.nk + ' ' + norm(extra.join(' '));
  });
}

function loadAll() {
  var url = BASE + 'data/channels.json';
  return getJson(url).catch(function () {
    return getJson(BASE + 'channels.json');
  }).then(function (d) {
    build(d);
    buildSide();
    refresh(true);
    updateProgressSummary();
  });
}

function updateProgressSummary() {
  var on = 0, off = 0, unsup = 0, unk = 0;
  S.ch.forEach(function (c) {
    if (c.s === 1) on++;
    else if (c.s === 2) off++;
    else if (c.s === 3) unsup++;
    else unk++;
  });
  S.prog = {
    scanning: false,
    done: on + off + unsup,
    total: S.ch.length,
    online: on,
    offline: off,
    unsupported: unsup,
    unknown: unk
  };
  drawProgress();
}

function drawProgress() {
  var p = S.prog, box = $('#scan');
  if (!p) return;
  if (p.scanning && p.total) {
    box.classList.add('on');
    $('#scanFill').style.width = Math.round(p.done / p.total * 100) + '%';
    $('#scanText').textContent = t('scanning', { done: fmt(p.done), total: fmt(p.total) });
  } else if (box.classList.contains('on')) {
    $('#scanText').textContent = t('scanDone', { on: fmt(p.online) });
    $('#scanFill').style.width = '100%';
    setTimeout(function () { if (!(S.prog && S.prog.scanning)) box.classList.remove('on'); }, 3500);
  }
}

// ------------------------------------------------------------------ client-side channel scanner
var scanner = { running: false, index: 0, abortCtrl: null };

function startClientScan() {
  if (scanner.running) return;
  scanner.running = true;
  scanner.index = 0;
  if (!S.prog) updateProgressSummary();
  S.prog.scanning = true;
  drawProgress();
  scanNextBatch();
}

function stopClientScan() {
  scanner.running = false;
  if (scanner.abortCtrl) {
    try { scanner.abortCtrl.abort(); } catch (e) {}
    scanner.abortCtrl = null;
  }
  if (S.prog) S.prog.scanning = false;
  drawProgress();
}

function scanNextBatch() {
  if (!scanner.running) return;
  if (scanner.index >= S.ch.length) {
    scanner.running = false;
    updateProgressSummary();
    drawProgress();
    toast(t('scanDone', { on: fmt(S.prog.online) }));
    return;
  }

  var batchSize = 12;
  var batch = [];
  while (batch.length < batchSize && scanner.index < S.ch.length) {
    var c = S.ch[scanner.index++];
    if (c.kind === 'hls') batch.push(c);
  }

  if (!batch.length) {
    setTimeout(scanNextBatch, 50);
    return;
  }

  var promises = batch.map(function (ch) {
    return probeChannel(ch);
  });

  Promise.all(promises).then(function () {
    if (S.prog) {
      S.prog.done = Math.min(S.ch.length, scanner.index);
      drawProgress();
    }
    if (scanner.running) {
      setTimeout(scanNextBatch, 150);
    }
  });
}

function probeChannel(ch) {
  var t0 = performance.now();
  var ctrl = new AbortController();
  var timer = setTimeout(function () { ctrl.abort(); }, 4000);

  return fetch(ch.url, {
    method: 'GET',
    headers: { 'Range': 'bytes=0-1024' },
    signal: ctrl.signal,
    mode: 'cors',
    cache: 'no-store'
  }).then(function (res) {
    clearTimeout(timer);
    var ms = Math.round(performance.now() - t0);
    if (res.ok || res.status === 206 || res.status === 302 || res.status === 301) {
      setChannelStatus(ch, 1, ms);
    } else {
      setChannelStatus(ch, 2, 0);
    }
  }).catch(function () {
    clearTimeout(timer);
    // Note: Some streams succeed via video element even if fetch CORS blocks it
    // Keep as unknown or previous state if it was online
    if (ch.s === 0) setChannelStatus(ch, 0, 0);
  });
}

function setChannelStatus(ch, status, ms) {
  ch.s = status;
  if (ms) ch.ms = ms;
  S.statusOverrides[ch.id] = { s: status, ms: ch.ms };
  store.set('status_overrides', S.statusOverrides);
}

// ------------------------------------------------------------------ view (filter / search / sort)
function computeView() {
  var toks = norm(S.q).split(/\s+/).filter(Boolean);
  var cat = S.cat, st = S.status, out = [], scores = {};
  var pool = S.ch;
  if (cat.type === 'recent') pool = S.recent.map(function (id) { return S.byId[id]; }).filter(Boolean);
  var num = toks.length === 1 && /^\d+$/.test(toks[0]) ? +toks[0] : 0;
  for (var j = 0; j < pool.length; j++) {
    var ch = pool[j];
    if (st === 'on' ? ch.s !== 1 : st === 'off' ? ch.s !== 2 : false) continue;
    if (cat.type === 'fav' && !S.favs[ch.id]) continue;
    if (cat.type === 'src' && ch.src !== cat.val) continue;
    if (cat.type === 'grp' && ch.g.indexOf(cat.val) < 0) continue;
    if (cat.type === 'cty' && ch.c !== cat.val) continue;
    if (toks.length) {
      var sc = 0, ok = true;
      for (var k = 0; k < toks.length; k++) {
        var tk = toks[k];
        if (ch.nk.indexOf(tk) === 0) sc += 0;
        else if ((' ' + ch.nk).indexOf(' ' + tk) >= 0) sc += 1;
        else if (ch.nk.indexOf(tk) >= 0) sc += 2;
        else if (ch.key.indexOf(tk) >= 0) sc += 4;
        else { ok = false; break; }
      }
      if (!ok) continue;
      if (num && ch.n === num) sc = -1;
      scores[ch.i] = sc;
    }
    out.push(ch.i);
  }
  if (toks.length) out.sort(function (a, b) { return scores[a] - scores[b] || a - b; });
  else if (S.sort === 'name') out.sort(function (a, b) { return S.ch[a].nk < S.ch[b].nk ? -1 : S.ch[a].nk > S.ch[b].nk ? 1 : a - b; });
  else if (S.sort === 'ping') out.sort(function (a, b) {
    var x = S.ch[a], y = S.ch[b];
    var px = x.s === 1 ? x.ms : 1e9, py = y.s === 1 ? y.ms : 1e9;
    return px - py || a - b;
  });
  return out;
}

function catTitle() {
  var c = S.cat;
  if (c.type === 'fav') return t('favorites');
  if (c.type === 'recent') return t('recent');
  if (c.type === 'src') return srcName(c.val);
  if (c.type === 'grp') return gName(c.val);
  if (c.type === 'cty') return regionName(c.val);
  return t('allCh');
}

function refresh(resetScroll) {
  var focusedCh = G.f >= 0 && document.activeElement && document.activeElement.closest && document.activeElement.closest('#rows') ? S.view[G.f] : -1;
  S.view = computeView();
  $('#title').textContent = catTitle();
  $('#count').textContent = t('channelsN', { n: fmt(S.view.length) });
  var last = store.get('last', null), lc = last && S.byId[last];
  var rb = $('#resume');
  if (lc && lc.s !== 3) { rb.hidden = false; rb.textContent = t('resume', { name: lc.name }); rb.setAttribute('dir', 'auto'); } else rb.hidden = true;
  var e = $('#empty');
  if (!S.view.length) {
    var msg = S.q ? t('emptyHint') : S.cat.type === 'fav' ? t('emptyFav') : S.cat.type === 'recent' ? t('emptyRecent') : (S.prog && S.prog.scanning) ? t('emptyScan') : S.status === 'on' ? t('emptyOn') : t('emptyHint');
    e.innerHTML = '<b>' + esc(t('emptyTitle')) + '</b>' + esc(msg);
    e.hidden = false;
  } else e.hidden = true;
  if (resetScroll) $('#list').scrollTop = 0;
  updateCounts();
  layout(true);
  if (focusedCh >= 0) { var p = S.view.indexOf(focusedCh); if (p >= 0) G.f = p; }
}

// ------------------------------------------------------------------ sidebar
var itemEls = {};
function catKey(c) { return c.type + (c.val === null || c.val === undefined ? '' : ':' + c.val); }
function itemHtml(key, icon, label, cls) {
  return '<button type="button" class="item ' + (cls || '') + '" data-k="' + key + '">' + ic(icon) + '<span dir="auto">' + esc(label) + '</span><em></em></button>';
}

function buildSide() {
  var h = itemHtml('all', 'all', t('allCh')) + itemHtml('fav', 'star', t('favorites')) + itemHtml('recent', 'clock', t('recent'));
  h += '<div class="sec-h">' + ic('stack') + esc(t('sources')) + '</div>';
  S.sources.forEach(function (s, i) { h += itemHtml('src:' + i, 'stack', srcName(i)); });
  h += '<div class="sec-h">' + ic('tag') + esc(t('categories')) + '</div>';
  var totals = {};
  S.ch.forEach(function (c) { c.g.forEach(function (g) { totals[g] = (totals[g] || 0) + 1; }); });
  Object.keys(totals).map(Number).sort(function (a, b) { return totals[b] - totals[a]; }).forEach(function (g) { h += itemHtml('grp:' + g, 'tag', gName(g)); });
  var ctot = {};
  S.ch.forEach(function (c) { if (c.c) ctot[c.c] = (ctot[c.c] || 0) + 1; });
  h += '<button type="button" class="sec-h cty" id="ctyToggle">' + ic('globe') + '<span>' + esc(t('countries')) + '</span></button>';
  Object.keys(ctot).sort(function (a, b) { return ctot[b] - ctot[a]; }).forEach(function (c) { h += itemHtml('cty:' + c, 'globe', regionName(c) + ' (' + c.toUpperCase() + ')', 'cty'); });
  $('#side').innerHTML = h;
  itemEls = {};
  $$('#side .item').forEach(function (b) { itemEls[b.getAttribute('data-k')] = { el: b, em: $('em', b) }; });
  ctyVisibility();
}

function ctyVisibility() {
  $$('#side .item.cty').forEach(function (b) { b.style.display = S.ctyOpen ? '' : 'none'; });
}

function updateCounts() {
  var c = { all: 0, fav: 0, src: {}, grp: {}, cty: {} }, st = S.status;
  S.ch.forEach(function (ch) {
    if (st === 'on' ? ch.s !== 1 : st === 'off' ? ch.s !== 2 : false) return;
    c.all++;
    if (S.favs[ch.id]) c.fav++;
    c.src[ch.src] = (c.src[ch.src] || 0) + 1;
    ch.g.forEach(function (g) { c.grp[g] = (c.grp[g] || 0) + 1; });
    if (ch.c) c.cty[ch.c] = (c.cty[ch.c] || 0) + 1;
  });
  S.cnt = c;
  var cur = catKey(S.cat);
  Object.keys(itemEls).forEach(function (k) {
    var p = k.split(':'), n;
    if (k === 'all') n = c.all; else if (k === 'fav') n = c.fav; else if (k === 'recent') n = S.recent.length;
    else n = (c[p[0]] && c[p[0]][p[1]]) || 0;
    var e = itemEls[k];
    e.em.textContent = n ? fmt(n) : '0';
    e.el.classList.toggle('z', !n && k !== 'fav' && k !== 'recent' && k !== 'all');
    e.el.classList.toggle('on', k === cur);
  });
}

function selectCat(key) {
  var p = key.split(':');
  S.cat = { type: p[0], val: p.length > 1 ? (p[0] === 'cty' ? p[1] : +p[1]) : null };
  store.set('cat', S.cat);
  refresh(true);
}

// ------------------------------------------------------------------ virtual list
var G = { cols: 1, rowH: 80, cardH: 70, gap: 10, rows: {}, f: -1, raf: 0 };
var listEl, rowsEl;

function measure() {
  var rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  G.cardH = Math.round(rem * 5.4); G.gap = Math.round(rem * 0.6); G.rowH = G.cardH + G.gap;
  if (rowsEl) { rowsEl.style.setProperty('--cardh', G.cardH + 'px'); rowsEl.style.setProperty('--gap', G.gap + 'px'); }
}

function layout(force) {
  if (!listEl) return;
  measure();
  var w = listEl.clientWidth - 0;
  var remPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  var minW = Math.round(remPx * 23);
  var cols = Math.max(1, Math.floor((w + G.gap) / (minW + G.gap)));
  if (cols !== G.cols) force = true;
  G.cols = cols;
  var total = Math.ceil(S.view.length / cols);
  rowsEl.style.height = Math.max(0, total * G.rowH - G.gap) + 'px';
  if (force) { rowsEl.innerHTML = ''; G.rows = {}; }
  renderRows();
}

function cardHtml(ch, p) {
  var chips = '';
  if (ch.g.length) chips += '<span class="gp">' + esc(gName(ch.g[0])) + '</span>';
  if (ch.c) chips += '<i class="chip">' + ch.c.toUpperCase() + '</i>';
  if (ch.q) chips += '<i class="chip q">' + ch.q + 'p</i>';
  if (ch.fl & 1) chips += '<i class="chip geo">Geo</i>';

  var logoHtml = ch.logo
    ? '<img alt="" decoding="async" loading="lazy" src="' + esc(ch.logo) + '" onerror="this.style.display=\'none\'">'
    : '';

  return '<button type="button" class="card' + (S.favs[ch.id] ? ' fav' : '') + '" data-p="' + p + '" data-i="' + ch.i + '" data-s="' + ch.s + '" role="option" tabindex="-1">' +
    '<span class="n">' + ch.n + '</span>' +
    '<span class="lg"><b style="background:hsl(' + hue(ch.name) + ',38%,34%)">' + esc(initials(ch.name)) + '</b>' + logoHtml + '</span>' +
    '<span class="mt" dir="auto"><span class="nm">' + esc(ch.name) + '</span><span class="sb">' + chips + '</span></span>' +
    '<span class="st">' + sigHtml(ch) + '</span>' +
    '<span class="fv" data-act="fav" title="' + esc(t('fav')) + '">' + ic('star') + '</span></button>';
}

function renderRows() {
  var top = listEl.scrollTop, vh = listEl.clientHeight;
  var total = Math.ceil(S.view.length / G.cols);
  var r0 = Math.max(0, Math.floor(top / G.rowH) - 2), r1 = Math.min(total - 1, Math.ceil((top + vh) / G.rowH) + 2);
  Object.keys(G.rows).forEach(function (k) {
    if (+k < r0 || +k > r1) { rowsEl.removeChild(G.rows[k]); delete G.rows[k]; }
  });
  for (var r = r0; r <= r1; r++) {
    if (G.rows[r]) continue;
    var div = document.createElement('div');
    div.className = 'row';
    div.style.top = r * G.rowH + 'px';
    div.style.height = G.cardH + 'px';
    div.style.gridTemplateColumns = 'repeat(' + G.cols + ',minmax(0,1fr))';
    var h = '';
    for (var c = 0; c < G.cols; c++) {
      var p = r * G.cols + c;
      if (p >= S.view.length) break;
      h += cardHtml(S.ch[S.view[p]], p);
    }
    div.innerHTML = h;
    rowsEl.appendChild(div);
    G.rows[r] = div;
  }
}

function focusPos(p) {
  if (!S.view.length) return false;
  p = clamp(p, 0, S.view.length - 1);
  G.f = p;
  var row = Math.floor(p / G.cols), top = row * G.rowH;
  if (top < listEl.scrollTop) listEl.scrollTop = top;
  else if (top + G.cardH > listEl.scrollTop + listEl.clientHeight) listEl.scrollTop = top + G.cardH - listEl.clientHeight + G.gap;
  renderRows();
  var el = rowsEl.querySelector('[data-p="' + p + '"]');
  if (el) el.focus({ preventScroll: true });
  return true;
}

function onScroll() {
  if (G.raf) return;
  G.raf = requestAnimationFrame(function () { G.raf = 0; renderRows(); });
}

// ------------------------------------------------------------------ favorites / recent
function toggleFav(id) {
  if (S.favs[id]) delete S.favs[id]; else S.favs[id] = 1;
  store.set('favs', S.favs);
  var c = S.byId[id];
  $$('#rows .card[data-i="' + (c ? c.i : -1) + '"]').forEach(function (el) { el.classList.toggle('fav', !!S.favs[id]); });
  if (S.cat.type === 'fav') refresh(false); else updateCounts();
  if (P.open && P.idx >= 0 && S.ch[P.idx].id === id) { $('#bFav').classList.toggle('on', !!S.favs[id]); toast(S.favs[id] ? '\u2605 ' + t('favorites') : t('favorites') + ' \u2715'); }
}

function pushRecent(id) {
  S.recent = [id].concat(S.recent.filter(function (x) { return x !== id; })).slice(0, 40);
  store.set('recent', S.recent);
}

// ------------------------------------------------------------------ 7-segment display
var SEGP = { a: '5,3 8,0 28,0 31,3 28,6 8,6', b: '32,4 35,7 35,28 32,31 29,28 29,7', c: '32,33 35,36 35,57 32,60 29,57 29,36', d: '5,61 8,58 28,58 31,61 28,64 8,64', e: '4,33 7,36 7,57 4,60 1,57 1,36', f: '4,4 7,7 7,28 4,31 1,28 1,7', g: '5,32 8,29 28,29 31,32 28,35 8,35' };
var SEGM = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };

function lcd(text, digits) {
  var s = String(text);
  while (s.length < digits) s = ' ' + s;
  var svg = '<svg viewBox="0 0 ' + (digits * 44 - 2) + ' 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g transform="translate(6 0) skewX(-5)">';
  for (var i = 0; i < digits; i++) {
    var lit = SEGM[s.charAt(i)] || '';
    svg += '<g transform="translate(' + i * 44 + ' 0)">';
    'abcdefg'.split('').forEach(function (k) { svg += '<polygon class="' + (lit.indexOf(k) >= 0 ? 'on' : 'off') + '" points="' + SEGP[k] + '"/>'; });
    svg += '</g>';
  }
  return svg + '</g></svg>';
}
function digitsFor() { return Math.max(3, String(S.ch.length).length); }

// ------------------------------------------------------------------ player
var P = {
  open: false, idx: -1, hls: null, zap: [], retries: 0, netR: 0, mediaR: 0,
  direct: true, state: '', uiTimer: 0, drawer: false, qmenu: false,
  numBuf: '', numTimer: 0, lastT: 0, stall: 0, loadT: 0, watch: 0,
  spinTimer: 0, statOn: false, statTimer: 0, engineId: 0, tuneT0: 0
};
var video;
var isApple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;

function loadScript(src) {
  return new Promise(function (res, rej) {
    var s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

function ensureHls() {
  if (window.Hls) return Promise.resolve();
  return loadScript(BASE + 'vendor/hls.min.js')
    .catch(function () { return loadScript('https://cdn.jsdelivr.net/npm/hls.js@1.5/dist/hls.min.js'); })
    .catch(function () {});
}

function openPlayer() {
  P.open = true;
  $('#player').hidden = false;
  $('#app').style.visibility = 'hidden';
  startWatch();
  try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(function (l) { P.wake = l; }, function () {}); } catch (e) { /* ignore */ }
}

function closePlayer() {
  stopEngine();
  P.open = false; P.idx = -1; closeDrawer(); closeQMenu();
  $('#player').hidden = true;
  $('#app').style.visibility = '';
  clearInterval(P.watch);
  try { if (P.wake) P.wake.release(); } catch (e) { /* ignore */ }
  if (document.fullscreenElement && document.exitFullscreen) { try { document.exitFullscreen(); } catch (e) { /* ignore */ } }
  refresh(false);
  var lc = S.byId[store.get('last', '')];
  if (lc) { var p = S.view.indexOf(lc.i); if (p >= 0) focusPos(p); }
}

function tune(idx, o) {
  o = o || {};
  var ch = S.ch[idx];
  if (!ch) return;
  if (ch.s === 3) { if (P.open) toast(t('unsupported')); else alert(t('unsupported')); return; }
  if (!P.open) openPlayer();
  if (o.zap) P.zap = o.zap;
  else if (!P.zap.length) P.zap = S.view.slice();
  P.idx = idx;
  if (ch.src === 0) {
    P.direct = true; // Iranian channels are never filtered inside Iran and geo-block foreign proxies
  } else {
    P.direct = o.direct !== undefined ? o.direct : (S.proxyMode === 'direct');
  }
  P.retries = 0; P.netR = 0; P.mediaR = 0; P.stall = 0; P.loadT = 0;
  P.tuneT0 = performance.now();
  pushRecent(ch.id); store.set('last', ch.id);
  closeDrawer(); closeQMenu();
  $('#perr').hidden = true;
  renderOSD(); showUI();
  setState('loading');
  startEngine();
  try {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: ch.name, artist: 'Parto TV' });
      navigator.mediaSession.setActionHandler('nexttrack', function () { zap(1); });
      navigator.mediaSession.setActionHandler('previoustrack', function () { zap(-1); });
    }
  } catch (e) { /* ignore */ }
}

function zap(dir) {
  var list = P.zap.length ? P.zap : S.view;
  if (!list.length) return;
  var pos = list.indexOf(P.idx);
  if (pos < 0) pos = dir > 0 ? -1 : 0;
  for (var n = 1; n <= list.length; n++) {
    var cand = list[(pos + dir * n + list.length * 2) % list.length];
    var c = S.ch[cand];
    if (c && c.s !== 3 && (c.s !== 2 || n === list.length)) return tune(cand);
  }
}

function setState(s) {
  P.state = s;
  clearTimeout(P.spinTimer);
  var spin = $('#pspin');
  if (s === 'loading') { spin.hidden = false; }
  else if (s === 'buffering') { P.spinTimer = setTimeout(function () { if (P.state === 'buffering') spin.hidden = false; }, 500); }
  else spin.hidden = true;
  var live = $('.live', $('#posd'));
  if (live) { live.classList.toggle('buf', s !== 'playing'); live.textContent = s === 'playing' ? t('live') : s === 'error' ? '\u2715' : s === 'paused' ? '\u275A\u275A' : t('buffering'); }
}

function stopEngine() {
  P.engineId++;
  if (P.hls) { try { P.hls.destroy(); } catch (e) { /* ignore */ } P.hls = null; }
  if (video) { try { video.pause(); video.removeAttribute('src'); video.load(); } catch (e) { /* ignore */ } }
}

function resolveStreamUrl(rawUrl, direct) {
  if (!rawUrl) return '';
  if (direct || S.proxyMode === 'direct') return rawUrl;
  if (rawUrl.indexOf('corsproxy.io') >= 0 || (S.customProxy && rawUrl.indexOf(S.customProxy) >= 0)) return rawUrl;
  if (S.proxyMode === 'custom' && S.customProxy) {
    var base = S.customProxy.replace(/\/+$/, '');
    return base + (base.indexOf('?') >= 0 ? '&url=' : '/?url=') + encodeURIComponent(rawUrl);
  }
  // Public CORS proxy fallback
  return 'https://corsproxy.io/?' + encodeURIComponent(rawUrl);
}

function startEngine() {
  stopEngine();
  var id = P.engineId, ch = S.ch[P.idx];
  var streamUrl = resolveStreamUrl(ch.url, P.direct);

  ensureHls().then(function () {
    if (id !== P.engineId) return;
    attach(streamUrl, id);
  }).catch(function () {
    if (id === P.engineId) fail('src');
  });
}

function attach(src, id) {
  var v = video;
  var native = v.canPlayType('application/vnd.apple.mpegurl');
  if (window.Hls && Hls.isSupported() && !(native && isApple && /iPhone|iPod/.test(navigator.userAgent))) {
    var hlsConfig = {
      enableWorker: true,
      lowLatencyMode: false,
      backBufferLength: 20,
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
      maxBufferSize: 60 * 1000 * 1000,
      liveSyncDurationCount: 3,
      liveMaxLatencyDurationCount: 10,
      startLevel: -1,
      capLevelToPlayerSize: !document.documentElement.classList.contains('tv'),
      manifestLoadPolicy: { default: { maxTimeToFirstByteMs: 12000, maxLoadTimeMs: 20000, timeoutRetry: { maxNumRetry: 3, retryDelayMs: 800, maxRetryDelayMs: 4000 }, errorRetry: { maxNumRetry: 3, retryDelayMs: 800, maxRetryDelayMs: 4000 } } },
      playlistLoadPolicy: { default: { maxTimeToFirstByteMs: 10000, maxLoadTimeMs: 20000, timeoutRetry: { maxNumRetry: 4, retryDelayMs: 600, maxRetryDelayMs: 4000 }, errorRetry: { maxNumRetry: 4, retryDelayMs: 600, maxRetryDelayMs: 4000 } } },
      fragLoadPolicy: { default: { maxTimeToFirstByteMs: 15000, maxLoadTimeMs: 60000, timeoutRetry: { maxNumRetry: 4, retryDelayMs: 500, maxRetryDelayMs: 4000 }, errorRetry: { maxNumRetry: 5, retryDelayMs: 700, maxRetryDelayMs: 5000 } } }
    };

    if (Hls.DefaultConfig && Hls.DefaultConfig.loader) {
      var BaseLoader = Hls.DefaultConfig.loader;
      function StreamProxyLoader(config) {
        BaseLoader.call(this, config);
        var origLoad = this.load.bind(this);
        this.load = function (context, config, callbacks) {
          if (!P.direct && context && context.url) {
            context.url = resolveStreamUrl(context.url, false);
          }
          return origLoad(context, config, callbacks);
        };
      }
      StreamProxyLoader.prototype = Object.create(BaseLoader.prototype);
      hlsConfig.pLoader = StreamProxyLoader;
      hlsConfig.fLoader = StreamProxyLoader;
    }

    var hls = new Hls(hlsConfig);
    P.hls = hls;
    hls.on(Hls.Events.MANIFEST_PARSED, function () { if (id === P.engineId) playVideo(); });
    hls.on(Hls.Events.LEVEL_SWITCHED, function () { renderOSD(); });
    hls.on(Hls.Events.ERROR, function (ev, data) {
      if (id !== P.engineId || !data.fatal) return;
      if (data.type === Hls.ErrorTypes.NETWORK_ERROR && P.netR < 3) {
        P.netR++;
        setTimeout(function () { if (P.hls === hls) hls.startLoad(); }, 800 * P.netR);
      } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR && P.mediaR < 3) {
        P.mediaR++;
        if (P.mediaR === 2) hls.swapAudioCodec();
        hls.recoverMediaError();
      } else {
        recover('fatal');
      }
    });
    hls.loadSource(src);
    hls.attachMedia(v);
  } else if (native) {
    v.src = src;
    playVideo();
  } else {
    fail('nohls');
  }
}

function playVideo() {
  var p = video.play();
  if (p && p.catch) {
    p.catch(function (e) {
      if (e && e.name === 'NotAllowedError') {
        setState('paused');
        toast('\u25B6');
      }
    });
  }
}

function recover(reason) {
  if (!P.open || P.idx < 0) return;
  P.retries++;
  if (P.retries > 3) return fail(reason);
  toast(t('retrying'));
  setState('loading');
  var id = P.engineId;
  setTimeout(function () {
    if (id === P.engineId && P.open) {
      P.netR = 0; P.mediaR = 0;
      startEngine();
    }
  }, 600 * P.retries);
}

function fail(reason) {
  if (!P.open) return;
  stopEngine();
  setState('error');
  $('#perr').hidden = false;
  $('#eDirect').textContent = P.direct ? t('modeProxy') : t('direct');
  showUI();
  setTimeout(function () { var b = $('#eRetry'); if (b && !$('#perr').hidden) b.focus(); }, 30);
  var ch = S.ch[P.idx];
  if (ch && reason !== 'nohls') {
    setChannelStatus(ch, 2, 0);
  }
  if (reason === 'nohls') $('.perr-box p').textContent = t('noHls');
  else $('.perr-box p').textContent = t('noSignalHint');
}

function startWatch() {
  clearInterval(P.watch);
  P.watch = setInterval(function () {
    if (!P.open) return;
    if (P.state === 'playing' && !video.paused) {
      if (video.currentTime === P.lastT) { P.stall += 1.5; } else { P.stall = 0; P.lastT = video.currentTime; }
      if (P.stall >= 12) { P.stall = 0; recover('stall'); }
    } else if (P.state === 'loading') {
      P.loadT += 1.5;
      if (P.loadT > 25) { P.loadT = 0; recover('timeout'); }
    }
  }, 1500);
}

// ------------------------------------------------------------------ OSD banner
function renderOSD() {
  var ch = S.ch[P.idx];
  if (!ch) return;
  var res = video && video.videoWidth ? video.videoWidth + '\u00D7' + video.videoHeight : (ch.q ? ch.q + 'p' : '');
  var chips = '';
  if (ch.g.length) chips += '<span>' + esc(gName(ch.g[0])) + '</span>';
  if (ch.c) chips += '<i class="chip">' + ch.c.toUpperCase() + '</i>';
  if (res) chips += '<i class="chip q" dir="ltr">' + res + '</i>';

  var logoHtml = ch.logo
    ? '<img alt="" src="' + esc(ch.logo) + '" onerror="this.style.display=\'none\'">'
    : '';

  $('#posd').innerHTML =
    '<div class="lcd">' + lcd(ch.n, digitsFor()) + '</div>' +
    '<div class="o-logo"><b style="background:hsl(' + hue(ch.name) + ',38%,34%)">' + esc(initials(ch.name)) + '</b>' + logoHtml + '</div>' +
    '<div class="o-m" dir="auto"><div class="o-name">' + esc(ch.name) + '</div><div class="o-sub">' + chips + '</div></div>' +
    '<div class="o-r"><span class="live' + (P.state === 'playing' ? '' : ' buf') + '">' + (P.state === 'playing' ? esc(t('live')) : esc(t('buffering'))) + '</span>' + sigHtml(ch, true) + '<em>' + (ch.s === 1 ? ch.ms + ' ms' : '') + '</em></div>';

  $('#ptopName').textContent = ch.name;
  $('#bFav').classList.toggle('on', !!S.favs[ch.id]);
  $('#bDirect').classList.toggle('on', P.direct);
}

function showUI(keep) {
  var pl = $('#player');
  pl.classList.add('ui'); pl.classList.remove('idle');
  clearTimeout(P.uiTimer);
  if (keep) return;
  P.uiTimer = setTimeout(function () {
    if (P.drawer || P.qmenu || P.state === 'error') return;
    pl.classList.remove('ui'); pl.classList.add('idle');
    if (document.activeElement && document.activeElement.blur && document.activeElement.closest && document.activeElement.closest('#pbar')) document.activeElement.blur();
  }, 4200);
}

// ------------------------------------------------------------------ channel drawer
function openDrawer() {
  var list = P.zap.length ? P.zap : S.view, pos = Math.max(0, list.indexOf(P.idx));
  var from = Math.max(0, pos - 60), to = Math.min(list.length, pos + 80), h = '';
  for (var i = from; i < to; i++) {
    var c = S.ch[list[i]];
    h += '<button type="button" class="item' + (c.i === P.idx ? ' cur' : '') + '" data-i="' + c.i + '"><b>' + c.n + '</b><span dir="auto">' + esc(c.name) + '</span>' + sigHtml(c, true) + '</button>';
  }
  var d = $('#pdrawer');
  d.innerHTML = h; d.hidden = false; P.drawer = true; $('#player').classList.add('side-open'); showUI(true);
  var cur = $('.item.cur', d) || $('.item', d);
  if (cur) { cur.focus(); cur.scrollIntoView({ block: 'center' }); }
}
function closeDrawer() { P.drawer = false; $('#pdrawer').hidden = true; $('#player').classList.remove('side-open'); if (P.open) showUI(); }

// ------------------------------------------------------------------ quality menu
function openQMenu() {
  var hls = P.hls;
  if (!hls || !hls.levels || hls.levels.length < 2) { toast(t('auto')); return; }
  var h = '<button type="button" class="item' + (hls.autoLevelEnabled ? ' cur' : '') + '" data-l="-1"><span>' + esc(t('auto')) + '</span></button>';
  hls.levels.map(function (l, i) { return { l: l, i: i }; }).sort(function (a, b) { return b.l.height - a.l.height; }).forEach(function (o) {
    h += '<button type="button" class="item' + (!hls.autoLevelEnabled && hls.currentLevel === o.i ? ' cur' : '') + '" data-l="' + o.i + '"><span>' + (o.l.height ? o.l.height + 'p' : Math.round(o.l.bitrate / 1000) + ' kbps') + '</span><em>' + Math.round(o.l.bitrate / 1000) + ' kbps</em></button>';
  });
  var q = $('#pq');
  q.innerHTML = h; q.hidden = false; P.qmenu = true; showUI(true);
  var cur = $('.item.cur', q) || $('.item', q);
  if (cur) cur.focus();
}
function closeQMenu() { P.qmenu = false; $('#pq').hidden = true; if (P.open) showUI(); }

// ------------------------------------------------------------------ number entry
function numKey(d) {
  P.numBuf = (P.numBuf + d).slice(-String(S.ch.length).length);
  var box = $('#pnum');
  box.innerHTML = '<div class="lcd">' + lcd(P.numBuf, digitsFor()) + '</div>';
  box.hidden = false;
  clearTimeout(P.numTimer);
  P.numTimer = setTimeout(commitNum, 1800);
}
function commitNum() {
  clearTimeout(P.numTimer);
  var n = parseInt(P.numBuf, 10);
  P.numBuf = '';
  $('#pnum').hidden = true;
  if (!n) return;
  var c = S.ch[n - 1];
  if (!c) return toast(t('noChannel'));
  tune(c.i);
}

// ------------------------------------------------------------------ stats popup
function toggleStats() {
  P.statOn = !P.statOn;
  var box = $('#pstat');
  box.hidden = !P.statOn;
  clearInterval(P.statTimer);
  if (!P.statOn) return;
  var draw = function () {
    var ch = S.ch[P.idx], hls = P.hls, lvl = hls && hls.levels && hls.levels[hls.currentLevel];
    var buf = 0;
    try { if (video.buffered.length) buf = video.buffered.end(video.buffered.length - 1) - video.currentTime; } catch (e) { /* ignore */ }
    var q = video.getVideoPlaybackQuality ? video.getVideoPlaybackQuality() : null;
    var rows = [
      [t('statMode'), P.direct ? t('modeDirect') : t('modeProxy')],
      [t('statRes'), video.videoWidth ? video.videoWidth + '\u00D7' + video.videoHeight : '-'],
      [t('statRate'), lvl ? Math.round(lvl.bitrate / 1000) + ' kbps' : '-'],
      [t('statBuf'), buf.toFixed(1) + ' s'],
      [t('statDrop'), q ? q.droppedVideoFrames + ' / ' + q.totalVideoFrames : '-'],
      [t('statLat'), hls && hls.latency ? hls.latency.toFixed(1) + ' s' : '-'],
      [t('statOrigin'), ch && ch.s === 1 ? ch.ms + ' ms' : '-'],
      [t('serverPing'), net.ms ? net.ms + ' ms' : '-']
    ];
    box.innerHTML = rows.map(function (r) { return '<div><b>' + esc(r[0]) + '</b>' + esc(r[1]) + '</div>'; }).join('');
  };
  draw();
  P.statTimer = setInterval(draw, 1000);
}

function toggleFullscreen() {
  var d = document, el = document.documentElement;
  if (d.fullscreenElement || d.webkitFullscreenElement) { (d.exitFullscreen || d.webkitExitFullscreen).call(d); }
  else { var f = el.requestFullscreen || el.webkitRequestFullscreen; if (f) { try { f.call(el); } catch (e) { /* ignore */ } } else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen(); }
}

function setVolume(v) {
  video.muted = false; video.volume = clamp(v, 0, 1);
  store.set('vol', video.volume); store.set('muted', false);
  toast('\uD83D\uDD0A ' + Math.round(video.volume * 100) + '%');
  syncMute();
}

function toggleMute() {
  video.muted = !video.muted; store.set('muted', video.muted);
  toast(video.muted ? '\uD83D\uDD07' : '\uD83D\uDD0A ' + Math.round(video.volume * 100) + '%');
  syncMute();
}

function syncMute() {
  var use = $('#bMute use'), n = video.muted || video.volume === 0 ? 'mute' : 'vol';
  use.setAttribute('href', '#i-' + n); use.setAttribute('xlink:href', '#i-' + n);
}

function bindPlayer() {
  video = $('#pv');
  video.volume = store.get('vol', 1); video.muted = store.get('muted', false); syncMute();
  video.addEventListener('playing', function () {
    setState('playing');
    var ch = S.ch[P.idx];
    if (ch) {
      var latency = P.tuneT0 ? Math.round(performance.now() - P.tuneT0) : ch.ms;
      setChannelStatus(ch, 1, latency || ch.ms || 250);
    }
    renderOSD();
    clearTimeout(P.okTimer); P.okTimer = setTimeout(function () { P.retries = 0; P.netR = 0; }, 10000);
  });
  video.addEventListener('waiting', function () { if (P.state === 'playing') { setState('buffering'); renderOSD(); } });
  video.addEventListener('canplay', function () { if (P.state === 'buffering' && !video.paused) setState('playing'); });
  video.addEventListener('resize', function () { renderOSD(); });
  video.addEventListener('error', function () { if (P.open && P.state !== 'error') recover('video'); });
  video.addEventListener('pause', function () { if (P.state === 'playing' && !video.ended) { /* user pause keeps state */ } });

  var pl = $('#player');
  pl.addEventListener('mousemove', function () { if (P.open) showUI(); });
  pl.addEventListener('touchstart', function () { if (P.open) showUI(); }, { passive: true });
  video.addEventListener('click', function () { if (pl.classList.contains('ui')) { pl.classList.remove('ui'); pl.classList.add('idle'); } else showUI(); });
  video.addEventListener('dblclick', toggleFullscreen);
  $('#pBack').onclick = closePlayer;
  $('#bPrev').onclick = function () { zap(-1); };
  $('#bNext').onclick = function () { zap(1); };
  $('#bList').onclick = openDrawer;
  $('#bFav').onclick = function () { if (P.idx >= 0) toggleFav(S.ch[P.idx].id); };
  $('#bQual').onclick = openQMenu;
  $('#bInfo').onclick = toggleStats;
  $('#bDirect').onclick = function () {
    P.direct = !P.direct;
    tune(P.idx, { direct: P.direct });
    toast(P.direct ? t('modeDirect') : t('modeProxy'));
  };
  $('#bPip').onclick = function () { try { if (document.pictureInPictureElement) document.exitPictureInPicture(); else video.requestPictureInPicture(); } catch (e) { /* unsupported */ } };
  $('#bMute').onclick = toggleMute;
  $('#bFull').onclick = toggleFullscreen;
  if (!document.pictureInPictureEnabled) $('#bPip').hidden = true;
  $('#eRetry').onclick = function () { $('#perr').hidden = true; P.retries = 0; setState('loading'); startEngine(); };
  $('#eDirect').onclick = function () { P.direct = !P.direct; tune(P.idx, { direct: P.direct }); };
  $('#eNext').onclick = function () { zap(1); };
  $('#pdrawer').addEventListener('click', function (e) {
    var b = e.target.closest('.item'); if (!b) return;
    var i = +b.getAttribute('data-i'); closeDrawer(); if (i !== P.idx) tune(i);
  });
  $('#pq').addEventListener('click', function (e) {
    var b = e.target.closest('.item'); if (!b || !P.hls) return;
    P.hls.currentLevel = +b.getAttribute('data-l'); closeQMenu(); renderOSD();
  });
}

// ------------------------------------------------------------------ modals
var modalOn = false;
function openModal(html) {
  $('#sheet').innerHTML = html;
  $('#modal').hidden = false; modalOn = true;
  var b = $('#sheet button, #sheet input'); if (b) b.focus();
}
function closeModal() {
  $('#modal').hidden = true; modalOn = false;
  if (!P.open) { var b = $('#btnSettings'); if (b) b.focus(); }
}

function median(a) {
  if (!a || !a.length) return 0;
  var s = a.slice().sort(function (x, y) { return x - y; });
  return s[Math.floor(s.length / 2)];
}

function openAnalysis() {
  var on = 0, off = 0, unsup = 0, unk = 0;
  var pings = [];
  var buckets = [0, 0, 0, 0, 0, 0]; // <150, <300, <600, <1000, <2000, 2000+
  var fastest = [];
  var srcStats = S.sources.map(function (s, i) {
    return { fa: s.fa, en: s.en, total: 0, online: 0, offline: 0, unsupported: 0, unknown: 0, pings: [] };
  });
  var kinds = { hls: 0, dash: 0, flv: 0, proto: 0, drm: 0, file: 0 };

  S.ch.forEach(function (c) {
    var sStat = srcStats[c.src] || srcStats[0];
    if (sStat) sStat.total++;
    kinds[c.kind] = (kinds[c.kind] || 0) + 1;

    if (c.s === 1) {
      on++;
      if (sStat) sStat.online++;
      if (c.ms > 0) {
        pings.push(c.ms);
        if (sStat) sStat.pings.push(c.ms);
        if (c.ms < 150) buckets[0]++;
        else if (c.ms < 300) buckets[1]++;
        else if (c.ms < 600) buckets[2]++;
        else if (c.ms < 1000) buckets[3]++;
        else if (c.ms < 2000) buckets[4]++;
        else buckets[5]++;
        fastest.push([c.i, c.ms]);
      }
    } else if (c.s === 2) {
      off++;
      if (sStat) sStat.offline++;
    } else if (c.s === 3) {
      unsup++;
      if (sStat) sStat.unsupported++;
    } else {
      unk++;
      if (sStat) sStat.unknown++;
    }
  });

  fastest.sort(function (a, b) { return a[1] - b[1]; });
  fastest = fastest.slice(0, 10);

  var maxBucket = Math.max.apply(null, buckets.concat([1]));
  var labels = ['<150', '<300', '<600', '<1000', '<2000', '2000+'];

  var h = '<h2><span>' + esc(t('anTitle')) + '</span><button type="button" class="pbtn" id="mClose">' + ic('close') + '</button></h2>';
  h += '<p class="lead">' + esc(t('anParsed', { n: fmt(S.ch.length) })) + '</p>';
  h += '<div class="kpis">' +
    '<div class="kpi"><b style="color:var(--good)">' + fmt(on) + '</b><small>' + esc(t('anOn')) + '</small></div>' +
    '<div class="kpi"><b style="color:var(--bad)">' + fmt(off) + '</b><small>' + esc(t('anOff')) + '</small></div>' +
    '<div class="kpi"><b>' + fmt(unsup) + '</b><small>' + esc(t('anUnsup')) + '</small></div>' +
    '<div class="kpi"><b>' + fmt(unk) + '</b><small>' + esc(t('anUnk')) + '</small></div></div>';

  h += '<h3>' + esc(t('anSource')) + '</h3><div class="tblwrap"><table class="tbl"><tr>' +
    '<th>' + esc(t('anSource')) + '</th><th>' + esc(t('anChannels')) + '</th>' +
    '<th>' + esc(t('anOn')) + '</th><th>' + esc(t('anOff')) + '</th>' +
    '<th>' + esc(t('anUnsup')) + '</th><th>' + esc(t('anUnk')) + '</th>' +
    '<th>' + esc(t('anMedian')) + '</th></tr>';

  srcStats.forEach(function (s) {
    var med = median(s.pings);
    h += '<tr><td>' + esc(S.lang === 'fa' ? s.fa : s.en) + '</td><td>' + fmt(s.total) + '</td>' +
      '<td class="g">' + fmt(s.online) + '</td><td class="r">' + fmt(s.offline) + '</td>' +
      '<td>' + fmt(s.unsupported) + '</td><td>' + fmt(s.unknown) + '</td>' +
      '<td>' + (med ? med + ' ms' : '-') + '</td></tr>';
  });
  h += '</table></div>';

  h += '<h3>' + esc(t('anDist')) + '</h3><div class="hist">' +
    buckets.map(function (b, i) {
      return '<div><i style="height:' + Math.round(b / maxBucket * 80) + '%"></i>' + fmt(b) + '<br>' + labels[i] + '</div>';
    }).join('') + '</div>';

  if (fastest.length) {
    h += '<h3>' + esc(t('anFastest')) + '</h3><div class="fast">' +
      fastest.map(function (f) {
        var c = S.ch[f[0]];
        return c ? '<button type="button" data-play="' + c.i + '"><span dir="auto">' + esc(c.name) + '</span><em>' + f[1] + ' ms</em></button>' : '';
      }).join('') + '</div>';
  }

  var unsupportedKinds = Object.keys(kinds).filter(function (k) { return k !== 'hls' && kinds[k] > 0; });
  if (unsupportedKinds.length) {
    h += '<h3>' + esc(t('anKinds')) + '</h3><p class="lead">' +
      unsupportedKinds.map(function (k) {
        return esc((I18N[S.lang].kinds[k] || k) + ': ' + kinds[k]);
      }).join(' \u2022 ') + '</p>';
  }

  h += '<h3>' + esc(t('anServer')) + '</h3><div class="kpis">' +
    '<div class="kpi"><b>Static</b><small>' + esc(t('anViewers')) + '</small></div>' +
    '<div class="kpi"><b>Pages</b><small>' + esc(t('anUptime')) + '</small></div>' +
    '<div class="kpi"><b>' + fmt(Object.keys(S.statusOverrides).length) + '</b><small>' + esc(t('anCacheSize')) + '</small></div>' +
    '<div class="kpi"><b>Zero Host</b><small>' + esc(t('anLastCron')) + '</small></div></div>';

  h += '<p class="lead" style="margin-top:1rem">' + esc(t('anHint')) + '</p>';
  h += '<div style="margin-top:1rem;display:flex;gap:.5rem;flex-wrap:wrap">' +
    '<button type="button" class="tbtn pri" id="mRescan">' + ic('refresh') + '<span style="margin:0 .5rem">' + esc(scanner.running ? t('anWait') : t('anRescan')) + '</span></button>' +
    '</div>';

  openModal(h);
  $('#mClose').onclick = closeModal;

  $('#mRescan').onclick = function () {
    if (scanner.running) {
      stopClientScan();
      $('#mRescan').lastChild.textContent = t('anRescan');
    } else {
      startClientScan();
      $('#mRescan').lastChild.textContent = t('anWait');
    }
  };

  $$('#sheet [data-play]').forEach(function (b) {
    b.onclick = function () {
      closeModal();
      tune(+b.getAttribute('data-play'), { zap: S.view.slice() });
    };
  });
}

var deferredInstall = null;
window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredInstall = e; });

function openSettings() {
  var seg = function (id, opts, cur) {
    return '<div class="seg" id="' + id + '">' + opts.map(function (o) {
      return '<button type="button" data-v="' + o[0] + '" class="' + (o[0] === cur ? 'on' : '') + '">' + esc(o[1]) + '</button>';
    }).join('') + '</div>';
  };

  var h = '<h2><span>' + esc(t('setTitle')) + '</span><button type="button" class="pbtn" id="mClose">' + ic('close') + '</button></h2>';
  h += '<div class="setrow"><span>' + esc(t('setLang')) + '</span>' + seg('setLang', [['fa', 'فارسی'], ['en', 'English']], S.lang) + '</div>';
  h += '<div class="setrow"><span>' + esc(t('setTv')) + '</span>' + seg('setTv', [['auto', t('setAuto')], ['on', t('setOn')], ['off', t('setOff')]], S.tvMode) + '</div>';
  h += '<div class="setrow"><span>' + esc(t('setProxy')) + '</span>' + seg('setProxy', [
    ['direct', t('proxyDirect')],
    ['cors', t('proxyCors')],
    ['custom', t('proxyCustom')]
  ], S.proxyMode) + '</div>';

  if (S.proxyMode === 'custom') {
    h += '<div class="setrow setrow-col">' +
      '<span>' + esc(t('customProxyUrl')) + '</span>' +
      '<input type="text" id="customProxyInput" class="setinput" placeholder="https://your-worker.workers.dev" value="' + esc(S.customProxy) + '">' +
      '</div>';
  }

  h += '<div class="setrow setrow-col">' +
    '<span>' + esc(t('addM3u')) + '</span>' +
    '<p class="lead">' + esc(t('addM3uHint')) + '</p>' +
    '<div style="display:flex;gap:.5rem;margin-top:.4rem;flex-wrap:wrap">' +
    '<input type="url" id="m3uUrlInput" class="setinput" style="flex:1" placeholder="https://example.com/playlist.m3u">' +
    '<button type="button" class="tbtn pri" id="btnLoadM3u">' + esc(t('addM3uBtn')) + '</button>' +
    '<label class="tbtn" style="cursor:pointer"><input type="file" id="m3uFileInput" accept=".m3u,.m3u8" style="display:none"><span>\uD83D\uDCC1</span></label>' +
    '</div></div>';

  h += '<div class="setrow"><span>' + esc(t('clearCache')) + '</span><button type="button" class="tbtn" id="btnClearCache">' + esc(t('clearCache')) + '</button></div>';

  if (deferredInstall) {
    h += '<div class="setrow"><span>' + esc(t('setInstall')) + '</span><button type="button" class="tbtn pri" id="mInstall">' + esc(t('setInstall')) + '</button></div>';
  }

  h += '<h3>' + esc(t('keys')) + '</h3><div class="keys">' +
    '<span><kbd>\u2191 \u2193</kbd>' + esc(t('kZap')) + '</span><span><kbd>OK</kbd>' + esc(t('kList')) + '</span><span><kbd>0-9</kbd>' + esc(t('kNum')) + '</span>' +
    '<span><kbd>\u2190 \u2192</kbd>' + esc(t('kVol')) + '</span><span><kbd>I</kbd>' + esc(t('kInfo')) + '</span><span><kbd>Space</kbd>' + esc(t('kFav')) + '</span><span><kbd>Esc</kbd>' + esc(t('kBack')) + '</span></div>';

  openModal(h);
  $('#mClose').onclick = closeModal;

  $$('#setLang button').forEach(function (b) {
    b.onclick = function () {
      S.lang = b.getAttribute('data-v');
      store.set('lang', S.lang);
      regionNames = {};
      applyMode();
      buildKeys();
      buildSide();
      refresh(false);
      openSettings();
    };
  });

  $$('#setTv button').forEach(function (b) {
    b.onclick = function () {
      S.tvMode = b.getAttribute('data-v');
      store.set('tv', S.tvMode);
      applyMode();
      layout(true);
      openSettings();
    };
  });

  $$('#setProxy button').forEach(function (b) {
    b.onclick = function () {
      S.proxyMode = b.getAttribute('data-v');
      store.set('proxy_mode', S.proxyMode);
      openSettings();
    };
  });

  var cpi = $('#customProxyInput');
  if (cpi) {
    cpi.onchange = function () {
      S.customProxy = cpi.value.trim();
      store.set('custom_proxy', S.customProxy);
    };
  }

  var btnM3u = $('#btnLoadM3u');
  if (btnM3u) {
    btnM3u.onclick = function () {
      var url = $('#m3uUrlInput').value.trim();
      if (!url) return;
      toast(t('loading'));
      fetch(url).then(function (r) { return r.text(); }).then(function (text) {
        parseAndAppendM3U(text, 'Custom');
        closeModal();
      }).catch(function (err) {
        toast('Error loading playlist: ' + err.message);
      });
    };
  }

  var fileInput = $('#m3uFileInput');
  if (fileInput) {
    fileInput.onchange = function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        parseAndAppendM3U(ev.target.result, file.name.replace(/\.m3u8?$/i, ''));
        closeModal();
      };
      reader.readAsText(file);
    };
  }

  $('#btnClearCache').onclick = function () {
    localStorage.clear();
    S.favs = {}; S.recent = []; S.statusOverrides = {};
    toast(t('clearCacheDone'));
    setTimeout(function () { location.reload(); }, 600);
  };

  var ib = $('#mInstall');
  if (ib) ib.onclick = function () { deferredInstall.prompt(); closeModal(); };
}

// ------------------------------------------------------------------ client-side M3U parser
function parseAndAppendM3U(text, sourceLabel) {
  var lines = text.split(/\r?\n/);
  var newChs = [];
  var curName = '', curLogo = '', curGroup = '', curUrl = '';

  var srcIdx = S.sources.length;
  S.sources.push({ k: 'custom_' + srcIdx, fa: sourceLabel, en: sourceLabel, n: 0 });

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    if (line.indexOf('#EXTINF:') === 0) {
      var logoM = line.match(/tvg-logo="([^"]*)"/i);
      curLogo = logoM ? logoM[1] : '';
      var groupM = line.match(/group-title="([^"]*)"/i);
      curGroup = groupM ? groupM[1] : '';
      var nameIdx = line.lastIndexOf(',');
      curName = nameIdx >= 0 ? line.slice(nameIdx + 1).trim() : 'Channel';
    } else if (line.indexOf('#') !== 0 && /^https?:\/\//i.test(line)) {
      curUrl = line;
      var gIdx = -1;
      if (curGroup) {
        gIdx = S.groups.indexOf(curGroup);
        if (gIdx < 0) {
          gIdx = S.groups.length;
          S.groups.push(curGroup);
        }
      }
      var cid = 'c_' + (S.ch.length + newChs.length + 1);
      newChs.push({
        i: S.ch.length + newChs.length,
        id: cid,
        n: S.ch.length + newChs.length + 1,
        name: curName || 'Channel',
        url: curUrl,
        logo: curLogo,
        g: gIdx >= 0 ? [gIdx] : [],
        c: '',
        q: 0,
        src: srcIdx,
        fl: 0,
        kind: 'hls',
        s: 1,
        ms: 180,
        nk: norm(curName),
        key: ''
      });
      curName = ''; curLogo = ''; curGroup = ''; curUrl = '';
    }
  }

  if (newChs.length) {
    S.sources[srcIdx].n = newChs.length;
    S.ch = S.ch.concat(newChs);
    newChs.forEach(function (c) { S.byId[c.id] = c; });
    buildKeys();
    buildSide();
    refresh(true);
    toast(newChs.length + ' channels added!');
  }
}

// ------------------------------------------------------------------ server/CDN ping meter
var net = { ms: 0 };
function pingServer() {
  var t0 = performance.now();
  fetch(BASE + 'favicon.svg?t=' + Date.now(), { cache: 'no-store' }).then(function () {
    var ms = Math.round(performance.now() - t0);
    net.ms = ms;
    $('#netMs').textContent = ms + ' ms';
    $('#netBars').className = 'sg l' + sigLevel(ms);
    $('#net').title = t('serverPing');
  }).catch(function () {
    $('#netMs').textContent = '--';
    $('#netBars').className = 'sg l0';
  });
}

// ------------------------------------------------------------------ keyboard / remote
function keyOf(e) {
  var k = e.key, c = e.keyCode;
  if (k === 'ArrowUp' || c === 38) return 'up';
  if (k === 'ArrowDown' || c === 40) return 'down';
  if (k === 'ArrowLeft' || c === 37) return 'left';
  if (k === 'ArrowRight' || c === 39) return 'right';
  if (k === 'Enter' || c === 13 || k === 'Select') return 'ok';
  if (k === 'Escape' || c === 27 || c === 10009 || c === 461 || k === 'GoBack' || k === 'BrowserBack') return 'back';
  if (k === 'Backspace' || c === 8) return 'bksp';
  if (k === 'ChannelUp' || c === 427 || k === 'PageUp' || c === 33) return 'chup';
  if (k === 'ChannelDown' || c === 428 || k === 'PageDown' || c === 34) return 'chdown';
  if (c === 405 || k === 'ColorF2Yellow') return 'fav';
  if (c === 457 || k === 'Info') return 'info';
  if (c === 415 || c === 19 || c === 10252 || k === 'MediaPlayPause') return 'playpause';
  if (k === 'AudioVolumeMute') return 'mute';
  if (/^[0-9]$/.test(k)) return 'd' + k;
  if (c >= 96 && c <= 105) return 'd' + (c - 96);
  if (k === ' ' || c === 32) return 'space';
  if (k && k.length === 1) return 'ch:' + k.toLowerCase();
  return '';
}

function zoneOf(el) {
  if (!el || !el.closest) return '';
  return el.closest('#top') ? 'top' : el.closest('#side') ? 'side' : el.closest('#list') ? 'grid' : '';
}
function visibleButtons(root) { return $$('button', root).filter(function (b) { return b.offsetParent !== null && !b.disabled; }); }
function step(list, cur, d) { var i = list.indexOf(cur); return list[clamp(i + d, 0, list.length - 1)]; }
function hstep(k) { return (rtl() ? -1 : 1) * (k === 'right' ? 1 : -1); }

function topControls() { return [$('#q')].concat(visibleButtons($('#top')).filter(function (b) { return b.id !== 'q'; })); }
function focusTop() { $('#q').focus(); }
function focusGrid() { if (!focusPos(G.f >= 0 ? G.f : 0)) { var b = $('#side .item.on') || $('#side .item'); if (b) b.focus(); } }
function focusSide() { var b = $('#side .item.on') || visibleButtons($('#side'))[0]; if (b) b.focus(); }

function browseKey(e) {
  var k = keyOf(e), ae = document.activeElement, zone = zoneOf(ae), inInput = ae && ae.tagName === 'INPUT';

  if (k === 'ch:/' && !inInput) { e.preventDefault(); focusTop(); return; }
  if (!inInput && (/^ch:[a-z]$/.test(k) || /^d\d$/.test(k))) { $('#q').focus(); return; }
  if (inInput) {
    var q = $('#q');
    if (k === 'down') { e.preventDefault(); focusGrid(); return; }
    if (k === 'ok') { e.preventDefault(); if (S.view.length) focusGrid(); return; }
    if (k === 'back') { e.preventDefault(); if (q.value) { q.value = ''; S.q = ''; refresh(true); } else { q.blur(); focusGrid(); } return; }
    if ((k === 'left' || k === 'right') && !q.value) { e.preventDefault(); var ctl = topControls(); var nx = step(ctl, q, hstep(k)); if (nx) nx.focus(); return; }
    return;
  }
  if (!ae || ae === document.body || !zone) {
    if (k === 'up' || k === 'down' || k === 'left' || k === 'right' || k === 'ok') { e.preventDefault(); focusGrid(); }
    return;
  }
  if (k === 'back' || k === 'bksp') { e.preventDefault(); if (zone !== 'grid') focusGrid(); return; }

  if (zone === 'grid') {
    var p = +ae.getAttribute('data-p');
    if (k === 'space' || k === 'fav') { e.preventDefault(); toggleFav(S.ch[S.view[p]].id); return; }
    if (k === 'ok') { e.preventDefault(); tune(S.view[p], { zap: S.view.slice() }); return; }
    if (k === 'left' || k === 'right') {
      e.preventDefault();
      var d = hstep(k);
      if (d < 0 && p % G.cols === 0) focusSide(); else focusPos(p + d);
      return;
    }
    if (k === 'down') { e.preventDefault(); if (p + G.cols < S.view.length) focusPos(p + G.cols); else if (Math.floor(p / G.cols) < Math.floor((S.view.length - 1) / G.cols)) focusPos(S.view.length - 1); return; }
    if (k === 'up') { e.preventDefault(); if (p - G.cols >= 0) focusPos(p - G.cols); else focusTop(); return; }
    if (k === 'chdown') { e.preventDefault(); focusPos(p + G.cols * 5); return; }
    if (k === 'chup') { e.preventDefault(); focusPos(p - G.cols * 5); return; }
    return;
  }
  if (zone === 'side') {
    var items = visibleButtons($('#side'));
    if (k === 'up' || k === 'down') { e.preventDefault(); if (k === 'up' && items[0] === ae) return focusTop(); var n = step(items, ae, k === 'down' ? 1 : -1); if (n) { n.focus(); } return; }
    if (k === 'left' || k === 'right') { if (hstep(k) > 0) { e.preventDefault(); focusGrid(); } else e.preventDefault(); return; }
    return;
  }
  if (zone === 'top') {
    var ctl2 = topControls();
    if (k === 'left' || k === 'right') { e.preventDefault(); var n2 = step(ctl2, ae, hstep(k)); if (n2) n2.focus(); return; }
    if (k === 'down') { e.preventDefault(); if (document.documentElement.clientWidth <= 880) focusGrid(); else focusSide(); return; }
    if (k === 'up') { e.preventDefault(); return; }
  }
}

function overlayKey(e, box, closeFn) {
  var k = keyOf(e), items = visibleButtons(box), ae = document.activeElement;
  if (k === 'back' || k === 'bksp') { e.preventDefault(); closeFn(); return true; }
  if (k === 'up' || k === 'left') { e.preventDefault(); var a = step(items, ae, -1); if (a) a.focus(); return true; }
  if (k === 'down' || k === 'right') { e.preventDefault(); var b = step(items, ae, 1); if (b) b.focus(); return true; }
  return false;
}

function playerKey(e) {
  var k = keyOf(e), ae = document.activeElement;
  if (P.state === 'error' && !$('#perr').hidden) {
    if (k === 'back' || k === 'bksp') { e.preventDefault(); closePlayer(); return; }
    if (k === 'left' || k === 'right' || k === 'up' || k === 'down') { e.preventDefault(); var bs = visibleButtons($('#perr')); var nb = step(bs, ae, (k === 'left' || k === 'up') ? -1 : 1); if (nb) nb.focus(); return; }
    return;
  }
  if (P.drawer) { if (overlayKey(e, $('#pdrawer'), closeDrawer)) return; if (k === 'ok') return; }
  if (P.qmenu) { if (overlayKey(e, $('#pq'), closeQMenu)) return; if (k === 'ok') return; }
  var onBar = ae && ae.closest && ae.closest('#pbar');
  if (onBar) {
    if (k === 'left' || k === 'right') { e.preventDefault(); var bt = visibleButtons($('#pbar')); var nx = step(bt, ae, hstep(k)); if (nx) nx.focus(); showUI(); return; }
    if (k === 'down' || k === 'up' || k === 'back' || k === 'bksp') { e.preventDefault(); ae.blur(); showUI(); if (k === 'up') zap(1); else if (k === 'down') zap(-1); else if (k === 'back') closePlayer(); return; }
    if (k === 'ok') { showUI(); return; }
  }
  if (/^d\d$/.test(k)) { e.preventDefault(); numKey(k.slice(1)); showUI(); return; }
  if (k === 'ok' && P.numBuf) { e.preventDefault(); commitNum(); return; }
  if (k === 'up' || k === 'chup') { e.preventDefault(); zap(1); return; }
  if (k === 'down' || k === 'chdown') { e.preventDefault(); zap(-1); return; }
  if (k === 'left') { e.preventDefault(); setVolume(video.volume - 0.05); showUI(); return; }
  if (k === 'right') { e.preventDefault(); setVolume(video.volume + 0.05); showUI(); return; }
  if (k === 'ok') { e.preventDefault(); openDrawer(); return; }
  if (k === 'back' || k === 'bksp') { e.preventDefault(); closePlayer(); return; }
  if (k === 'info' || k === 'ch:i') { e.preventDefault(); toggleStats(); return; }
  if (k === 'fav' || k === 'ch:s') { e.preventDefault(); if (P.idx >= 0) toggleFav(S.ch[P.idx].id); return; }
  if (k === 'space' || k === 'playpause') { e.preventDefault(); if (video.paused) playVideo(); else video.pause(); showUI(); return; }
  if (k === 'ch:m' || k === 'mute') { e.preventDefault(); toggleMute(); return; }
  if (k === 'ch:f') { e.preventDefault(); toggleFullscreen(); return; }
  if (k === 'ch:l') { e.preventDefault(); openDrawer(); return; }
  if (k === 'ch:q') { e.preventDefault(); openQMenu(); return; }
  if (k === 'ch:n') { e.preventDefault(); zap(1); return; }
  if (k === 'ch:p') { e.preventDefault(); zap(-1); return; }
}

function onKey(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (modalOn) { overlayKey(e, $('#sheet'), closeModal); return; }
  if (P.open) return playerKey(e);
  browseKey(e);
}

// ------------------------------------------------------------------ boot
function boot() {
  listEl = $('#list'); rowsEl = $('#rows');
  bindPlayer();
  applyMode();

  listEl.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { clearTimeout(boot.rt); boot.rt = setTimeout(function () { layout(true); }, 120); });
  rowsEl.addEventListener('error', function (e) { if (e.target && e.target.tagName === 'IMG') e.target.style.display = 'none'; }, true);
  rowsEl.addEventListener('click', function (e) {
    var card = e.target.closest('.card'); if (!card) return;
    var i = +card.getAttribute('data-i');
    if (e.target.closest('[data-act="fav"]')) { toggleFav(S.ch[i].id); return; }
    G.f = +card.getAttribute('data-p');
    tune(i, { zap: S.view.slice() });
  });
  rowsEl.addEventListener('focusin', function (e) { var c = e.target.closest && e.target.closest('.card'); if (c) G.f = +c.getAttribute('data-p'); });
  $('#side').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.id === 'ctyToggle') { S.ctyOpen = !S.ctyOpen; ctyVisibility(); return; }
    var k = b.getAttribute('data-k'); if (k) { selectCat(k); if (document.documentElement.clientWidth > 880) b.focus(); }
  });
  var qt = 0;
  $('#q').addEventListener('input', function () {
    clearTimeout(qt);
    qt = setTimeout(function () { S.q = $('#q').value; refresh(true); }, 70);
  });
  $$('#statusSeg button').forEach(function (b) {
    b.onclick = function () {
      S.status = b.getAttribute('data-s'); store.set('status', S.status);
      $$('#statusSeg button').forEach(function (x) { x.classList.toggle('on', x === b); });
      refresh(true);
    };
  });
  $('#sortBtn').onclick = function () {
    S.sort = { num: 'name', name: 'ping', ping: 'num' }[S.sort]; store.set('sort', S.sort);
    $('#sortBtn').textContent = t('sort') + ': ' + t({ num: 'sNum', name: 'sName', ping: 'sPing' }[S.sort]);
    refresh(true);
  };
  $('#btnAnalyze').onclick = openAnalysis;
  $('#btnSettings').onclick = openSettings;
  $('#resume').onclick = function () { var c = S.byId[store.get('last', '')]; if (c) tune(c.i, { zap: S.view.slice() }); };
  $('#modal').addEventListener('click', function (e) { if (e.target === $('#modal')) closeModal(); });
  document.addEventListener('keydown', onKey, true);

  loadAll().then(function () {
    var focusStart = document.documentElement.clientWidth > 880 && isTvDevice();
    if (focusStart) focusGrid();
  }).catch(function (err) {
    $('#empty').hidden = false;
    $('#empty').innerHTML = '<b>' + esc(t('emptyTitle')) + '</b>' + esc(String(err && err.message));
  });

  pingServer(); setInterval(pingServer, 12000);

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register(BASE + 'sw.js').catch(function () {});
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
