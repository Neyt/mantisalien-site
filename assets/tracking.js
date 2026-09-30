/*
 * Mantis Alien — tracking layer (Meta Pixel + Google Analytics 4 + Google Ads)
 *
 * 1. Replace the placeholder IDs below with your real ones.
 *      META_PIXEL_ID : Meta Events Manager > Data sources > your Pixel > ID
 *      GA4_ID        : Google Analytics > Admin > Data streams > Measurement ID (G-XXXXXXXXXX)
 *      GADS_ID       : Google Ads > Tools > Conversions > tag ID (AW-XXXXXXXXX). Optional.
 *      GADS_LABELS   : conversion labels from Google Ads. Optional.
 * 2. Nothing loads until the visitor presses Accept in the consent banner.
 *    Placeholder IDs (starting with REPLACE) are skipped, so the site runs safely before setup.
 *
 * Events fired (name in Meta / name in GA4):
 *   PageView / page_view        every page, on consent
 *   ViewContent / view_item     offer page, and when the shop section scrolls into view
 *   InitiateCheckout / begin_checkout   click on any Buy button (the fake-door intent signal)
 *   Lead / generate_lead        email left on the waitlist or the signal form
 *   SubmitStory (custom) / submit_story   community submission confirmed
 *   ScrollDepth (custom) / scroll_depth   25, 50, 75, 90 percent
 */
(function () {
  var CFG = window.MA_CONFIG = {
    META_PIXEL_ID: 'REPLACE_WITH_META_PIXEL_ID',
    GA4_ID: 'G-R2T2K10EB9',
    GADS_ID: 'REPLACE_WITH_GOOGLE_ADS_ID',
    GADS_LABELS: { begin_checkout: '', generate_lead: '' },
    CURRENCY: 'USD'
  };

  var STORE_KEY = 'ma_consent';
  var loaded = false;
  var queue = [];

  function getConsent() { try { return localStorage.getItem(STORE_KEY); } catch (e) { return null; } }
  function setConsent(v) { try { localStorage.setItem(STORE_KEY, v); } catch (e) {} }
  function isReal(id) { return id && id.indexOf('REPLACE') !== 0; }

  function loadMeta() {
    if (!isReal(CFG.META_PIXEL_ID)) return;
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', CFG.META_PIXEL_ID);
    fbq('track', 'PageView');
  }

  function loadGoogle() {
    var id = isReal(CFG.GA4_ID) ? CFG.GA4_ID : (isReal(CFG.GADS_ID) ? CFG.GADS_ID : null);
    if (!id) return;
    var s = document.createElement('script'); s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    if (isReal(CFG.GA4_ID)) gtag('config', CFG.GA4_ID);
    if (isReal(CFG.GADS_ID)) gtag('config', CFG.GADS_ID);
  }

  function fire(name, d) {
    d = d || {};
    var val = typeof d.value === 'number' ? d.value : undefined;
    var cur = CFG.CURRENCY;
    if (window.fbq && isReal(CFG.META_PIXEL_ID)) {
      if (name === 'view_item') fbq('track', 'ViewContent', { content_name: d.name, content_type: 'product', value: val, currency: cur });
      else if (name === 'begin_checkout') fbq('track', 'InitiateCheckout', { content_name: d.name, value: val, currency: cur });
      else if (name === 'generate_lead') fbq('track', 'Lead', { content_name: d.name, value: val, currency: cur });
      else if (name === 'submit_story') fbq('trackCustom', 'SubmitStory', { kind: d.kind });
      else if (name === 'scroll_depth') fbq('trackCustom', 'ScrollDepth', { percent: d.percent });
    }
    if (window.gtag && (isReal(CFG.GA4_ID) || isReal(CFG.GADS_ID))) {
      var item = d.name ? [{ item_name: d.name, price: val }] : undefined;
      if (name === 'view_item') gtag('event', 'view_item', { currency: cur, value: val, items: item });
      else if (name === 'begin_checkout') gtag('event', 'begin_checkout', { currency: cur, value: val, items: item });
      else if (name === 'generate_lead') gtag('event', 'generate_lead', { currency: cur, value: val, lead_source: d.source });
      else if (name === 'submit_story') gtag('event', 'submit_story', { kind: d.kind });
      else if (name === 'scroll_depth') gtag('event', 'scroll_depth', { percent: d.percent });
      var label = CFG.GADS_LABELS && CFG.GADS_LABELS[name];
      if (label && isReal(CFG.GADS_ID)) gtag('event', 'conversion', { send_to: CFG.GADS_ID + '/' + label, value: val, currency: cur });
    }
  }

  function track(name, data) {
    var c = getConsent();
    if (c === 'denied') return;
    if (loaded) fire(name, data); else queue.push([name, data]);
  }
  window.MA = { track: track };

  function grant() {
    setConsent('granted');
    if (loaded) return;
    loaded = true;
    loadMeta(); loadGoogle();
    while (queue.length) { var q = queue.shift(); fire(q[0], q[1]); }
  }

  function banner() {
    var el = document.createElement('div');
    el.className = 'ma-consent'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Cookie consent');
    el.innerHTML = '<p>We use cookies from Meta and Google to measure our ads and see which pages work. Nothing loads unless you accept. <a href="privacy.html">Privacy</a></p>' +
      '<button type="button" class="no">Decline</button><button type="button" class="yes">Accept</button>';
    document.body.appendChild(el);
    el.querySelector('.yes').onclick = function () { grant(); el.remove(); };
    el.querySelector('.no').onclick = function () { setConsent('denied'); queue.length = 0; el.remove(); };
  }

  var c = getConsent();
  if (c === 'granted') grant(); else if (c !== 'denied') banner();

  /* ---- page events ---- */
  var page = (location.pathname.split('/').pop() || 'index.html');

  if (page === 'offer.html') track('view_item', { name: 'The Mantis Field Manual', value: 14.99 });

  var shop = document.getElementById('shop');
  if (shop && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { track('view_item', { name: 'Launch shop' }); io.disconnect(); } });
    }, { threshold: 0.2 });
    io.observe(shop);
  }

  var marks = [25, 50, 75, 90], hit = {};
  window.addEventListener('scroll', function () {
    var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
    if (max <= 0) return;
    var pct = Math.round((h.scrollTop / max) * 100);
    marks.forEach(function (m) { if (pct >= m && !hit[m]) { hit[m] = 1; track('scroll_depth', { percent: m }); } });
  }, { passive: true });

  /* Buy buttons: record intent, then continue to the waitlist with the product in the URL */
  function productFrom(a) {
    var card = a.closest('.card');
    if (card) {
      var n = card.querySelector('.pname'), p = card.querySelector('.price');
      if (n && p) return { name: n.textContent.trim(), price: p.textContent.trim() };
    }
    if (a.closest('#kit')) return { name: 'THE INITIATION KIT', price: '$79' };
    var q = new URLSearchParams(a.search);
    if (q.get('p')) return { name: q.get('p'), price: q.get('v') || '' };
    return null;
  }
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href^="waitlist.html"]');
    if (!a) return;
    var prod = productFrom(a);
    if (!prod) return;
    var href = 'waitlist.html?p=' + encodeURIComponent(prod.name) + '&v=' + encodeURIComponent(prod.price);
    var num = parseFloat(String(prod.price).replace(/[^0-9.]/g, ''));
    track('begin_checkout', { name: prod.name, value: isNaN(num) ? undefined : num });
    ev.preventDefault();
    setTimeout(function () { location.href = href; }, 150);
  });
})();
