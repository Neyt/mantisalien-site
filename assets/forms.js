/*
 * Mantis Alien — forms
 * Waitlist and signal forms post by AJAX to FormSubmit, which emails each entry to the inbox below.
 * The community form is a normal multipart POST (needed for file attachments) and returns to community.html?sent=1.
 * First submission: FormSubmit sends one activation email to the inbox. Click it once, then entries arrive.
 * After activation, swap INBOX for the random alias FormSubmit gives you, so your address is not public.
 */
(function () {
  var INBOX = 'ney123456789@gmail.com';
  var AJAX = 'https://formsubmit.co/ajax/' + INBOX;
  var POST = 'https://formsubmit.co/' + INBOX;

  var params = new URLSearchParams(location.search);
  var attribution = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
    var v = params.get(k);
    try {
      if (v) sessionStorage.setItem('ma_' + k, v);
      v = sessionStorage.getItem('ma_' + k);
    } catch (e) {}
    if (v) attribution[k] = v;
  });

  function addHidden(form, name, value) {
    var i = document.createElement('input');
    i.type = 'hidden'; i.name = name; i.value = value;
    form.appendChild(i);
    return i;
  }
  function msgEl(id) { return document.getElementById(id); }
  function say(el, text, cls) { if (!el) return; el.textContent = text; el.className = 'form-msg ' + (cls || ''); }

  /* ---- waitlist page: read the product from the URL ---- */
  var prodName = params.get('p'), prodPrice = params.get('v');
  var wlTitle = document.getElementById('wlTitle'), wlMsg = document.getElementById('wlMsg');
  if (wlTitle && prodName) wlTitle.textContent = prodName.toUpperCase() + ' IS NOT RELEASED YET.';
  if (wlMsg && prodPrice) wlMsg.textContent = 'You have not been charged and nothing was ordered. Leave your email and you will be first to receive it, at the launch price of ' + prodPrice + '.';

  /* ---- AJAX forms ---- */
  document.querySelectorAll('form[data-form]').forEach(function (form) {
    var kind = form.getAttribute('data-form');
    var msg = msgEl(form.getAttribute('data-msg'));
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var fd = new FormData(form);
      var email = (fd.get('email') || '').toString().trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { say(msg, 'Enter a valid email address.', 'err'); return; }
      var interests = fd.getAll('interest');
      var product = prodName || fd.get('product') || '';
      fd.set('_subject', 'Mantis Alien — ' + (kind === 'waitlist' ? 'Waitlist: ' + (product || 'general') : 'Signal signup'));
      fd.set('_template', 'table');
      fd.set('_captcha', 'false');
      fd.set('_honey', '');
      fd.set('form', kind);
      fd.set('page', location.pathname);
      if (product) fd.set('product', product);
      if (prodPrice) fd.set('price_shown', prodPrice);
      if (interests.length) fd.set('interests', interests.join(', '));
      Object.keys(attribution).forEach(function (k) { fd.set(k, attribution[k]); });
      say(msg, 'Sending…');
      fetch(AJAX, { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j && (j.success === 'true' || j.success === true)) {
            say(msg, 'You are on the list. Check your inbox for one confirmation.', 'ok');
            form.reset();
            var num = parseFloat(String(prodPrice || '').replace(/[^0-9.]/g, ''));
            if (window.MA) MA.track('generate_lead', { name: product || 'Signal', source: kind, value: isNaN(num) ? undefined : num });
          } else {
            say(msg, 'Could not send. Please try again in a moment.', 'err');
          }
        })
        .catch(function () { say(msg, 'Could not send. Check your connection and try again.', 'err'); });
    });
  });

  /* ---- community form (multipart POST, returns to ?sent=1) ---- */
  var cf = document.getElementById('communityForm');
  if (cf) {
    cf.setAttribute('action', POST);
    cf.setAttribute('method', 'POST');
    cf.setAttribute('enctype', 'multipart/form-data');
    addHidden(cf, '_subject', 'Mantis Alien — Community submission');
    addHidden(cf, '_template', 'table');
    addHidden(cf, '_captcha', 'false');
    addHidden(cf, '_honey', '');
    addHidden(cf, '_next', location.origin + location.pathname.replace(/[^/]*$/, '') + 'community.html?sent=1');
    Object.keys(attribution).forEach(function (k) { addHidden(cf, k, attribution[k]); });
    var file = cf.querySelector('input[type=file]');
    var cmsg = msgEl('communityMsg');
    cf.addEventListener('submit', function (ev) {
      if (file && file.files && file.files[0] && file.files[0].size > 5 * 1024 * 1024) {
        ev.preventDefault();
        say(cmsg, 'That file is over 5 MB. Please send a smaller image.', 'err');
        return;
      }
      say(cmsg, 'Sending…');
    });
  }
  if (params.get('sent') === '1') {
    var ok = document.getElementById('sentNotice');
    if (ok) ok.style.display = 'block';
    var f = document.getElementById('communityFormWrap');
    if (f) f.style.display = 'none';
    if (window.MA) MA.track('submit_story', { kind: 'community' });
  }
})();
