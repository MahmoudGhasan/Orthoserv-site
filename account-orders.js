'use strict';
/* Orders UI: real checkout, customer "My orders", staff Orders tab. All data comes from the account service. */
(() => {
  const ar = () => document.documentElement.lang === 'ar';
  const t = (en, a) => ar() ? a : en;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const api = (path, options) => window.OrthoAuth.accountRequest(path, options);
  const money = (n, lang) => ((n || 0) / 100).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', {minimumFractionDigits:2, maximumFractionDigits:2}) + (lang === 'ar' ? ' ر.س' : ' SAR');
  const STATUS = {pending_payment:['Awaiting payment','بانتظار الدفع'], paid:['Paid','مدفوع'], processing:['Processing','قيد التجهيز'], shipped:['Shipped','تم الشحن'], delivered:['Delivered','تم التسليم'], cancelled:['Cancelled','ملغي']};
  const NEXT = {pending_payment:['paid','cancelled'], paid:['processing','cancelled'], processing:['shipped','cancelled'], shipped:['delivered'], delivered:[], cancelled:[]};
  const label = (s, lang) => STATUS[s]?.[lang === 'ar' ? 1 : 0] || s;
  const date = (v, lang) => { const d = new Date(v); return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA' : 'en-SA', {dateStyle:'medium', timeStyle:'short'}).format(d); };
  const addressLine = a => [a.street, a.building_no, a.district, a.city, a.postal_code].filter(Boolean).map(esc).join('، ');
  const itemsTable = (o, lang) => `<div class="od-scroll"><table class="od-table"><tbody>${o.items.map(i => `<tr><td>${esc(i.name)}${i.option ? ' · ' + esc(i.option) : ''}</td><td dir="ltr">× ${i.qty}</td><td dir="ltr">${money(i.line, lang)}</td></tr>`).join('')}</tbody></table></div>
    <p class="od-totals">${lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}: <bdi>${money(o.subtotal, lang)}</bdi>${o.vat !== null ? ` · VAT: <bdi>${money(o.vat, lang)}</bdi>` : ''}${o.shipping !== null ? ` · ${lang === 'ar' ? 'الشحن' : 'Shipping'}: <bdi>${money(o.shipping, lang)}</bdi>` : ''}<br><strong>${lang === 'ar' ? 'الإجمالي' : 'Total'}: <bdi>${money(o.total, lang)}</bdi></strong></p>`;

  /* ---------- guest checkout (no account) ---------- */
  function guestForm(box, items, opts, key) {
    const input = (name, en, a, extra = '') => `<label class="field">${t(en, a)}<input name="${name}" ${extra}></label>`;
    box.dir = ar() ? 'rtl' : 'ltr';
    box.innerHTML = `<form class="od-form od-guest" novalidate>
      <fieldset><legend>${t('Your details', 'بياناتك')}</legend>
        ${input('name', 'Full name *', 'الاسم الكامل *', 'required maxlength="100" autocomplete="name"')}
        ${input('phone', 'Mobile *', 'الجوال *', 'required inputmode="tel" maxlength="20" autocomplete="tel" placeholder="05xxxxxxxx" dir="ltr"')}
        ${input('email', 'Email (optional)', 'البريد الإلكتروني (اختياري)', 'type="email" maxlength="254" autocomplete="email" dir="ltr"')}</fieldset>
      <fieldset><legend>${t('Delivery address', 'عنوان التوصيل')}</legend>
        ${input('city', 'City *', 'المدينة *', 'required maxlength="80" autocomplete="address-level2"')}
        ${input('district', 'District', 'الحي', 'maxlength="80"')}
        ${input('street', 'Street', 'الشارع', 'maxlength="120" autocomplete="address-line1"')}
        ${input('building_no', 'Building no.', 'رقم المبنى', 'maxlength="20"')}
        ${input('short_address', 'Short address (e.g. ABCD1234)', 'العنوان المختصر (مثل ABCD1234)', 'maxlength="8" dir="ltr"')}
        ${input('postal_code', 'Postal code', 'الرمز البريدي', 'maxlength="5" inputmode="numeric" dir="ltr"')}
        ${input('notes', 'Delivery notes', 'ملاحظات التوصيل', 'maxlength="300"')}</fieldset>
      <label class="field">${t('Order note (optional)', 'ملاحظات على الطلب (اختياري)')}<textarea name="note" maxlength="500" rows="2"></textarea></label>
      <div style="position:absolute;left:-9999px" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div>
      <div class="form-summary">${opts.total != null && opts.money ? `${t('Estimated total', 'الإجمالي التقديري')}: <strong>${opts.money(opts.total)}</strong><p class="small">${t('The final total is calculated by the server and shown after you place the order.', 'يحسب الخادم الإجمالي النهائي ويظهر بعد إرسال الطلب.')}</p>` : ''}
      <p class="small">${t('Our team will call you to confirm the order and arrange payment.', 'سيتصل بك فريقنا لتأكيد الطلب وترتيب الدفع.')}</p></div>
      <p class="od-error" role="alert" hidden></p>
      <button class="button wide" type="submit">${t('Place order', 'إرسال الطلب')}</button></form>`;
    const form = box.querySelector('form'), error = form.querySelector('.od-error'), submit = form.querySelector('[type=submit]');
    form.onsubmit = async e => {
      e.preventDefault(); error.hidden = true;
      const d = Object.fromEntries(new FormData(form));
      if (!d.name.trim() || !d.phone.trim() || !d.city.trim()) { error.hidden = false; error.textContent = t('Please fill your name, mobile and city.', 'أدخل الاسم والجوال والمدينة.'); return; }
      submit.disabled = true;
      try {
        const api0 = window.OrthoCMS?.settings?.accounts?.apiUrl;
        const response = await fetch(new URL('/v1/guest-orders', api0), {method:'POST', headers:{'Content-Type':'application/json'}, credentials:'omit', cache:'no-store', signal:AbortSignal.timeout(20000),
          body:JSON.stringify({items, idempotency_key:key, website:d.website || '', note:d.note || '', guest:{name:d.name, phone:d.phone, email:d.email}, address:{city:d.city, district:d.district, street:d.street, building_no:d.building_no, short_address:d.short_address, postal_code:d.postal_code, notes:d.notes}})});
        const r = await response.json().catch(() => ({}));
        if (!response.ok) { const x = new Error('guest_order'); x.status = response.status; throw x; }
        opts.onPlaced?.(r);
        box.innerHTML = `<div class="success"><b>✓</b><h3>${t('Order received', 'تم استلام طلبك')}</h3><p>${t('Order number', 'رقم الطلب')}: <strong dir="ltr">${esc(r.number)}</strong></p><p>${t('Total', 'الإجمالي')}: <strong>${money(r.total, ar() ? 'ar' : 'en')}</strong></p><p class="small">${t('Keep your order number. We will call you to confirm and arrange payment.', 'احتفظ برقم الطلب. سنتصل بك للتأكيد وترتيب الدفع.')}</p></div>`;
      } catch (err) {
        submit.disabled = false; error.hidden = false;
        error.textContent = err.status === 422 ? t('One of the products is no longer available for online ordering. Review your cart.', 'أحد المنتجات لم يعد متاحًا للطلب الإلكتروني. راجع سلتك.')
          : err.status === 429 ? t('Too many orders from this contact. Please try again later or contact us.', 'طلبات كثيرة من نفس بيانات التواصل. حاول لاحقًا أو تواصل معنا.')
          : err.status === 400 ? t('Please check your name, mobile number (05xxxxxxxx), email and address.', 'راجع الاسم ورقم الجوال (05xxxxxxxx) والبريد والعنوان.')
          : t('Could not place the order. Please try again.', 'تعذر إرسال الطلب. حاول مرة أخرى.');
      }
    };
  }

  /* ---------- checkout ---------- */
  async function checkout(box, items, opts = {}) {
    const key = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)) + '';
    const close = () => document.querySelector('dialog[open]')?.close();
    const goto = hash => { close(); location.hash = hash; };
    const withGuest = html => {
      box.innerHTML = html + `<button type="button" class="button outline wide" data-guest>${t('Continue as guest', 'المتابعة كضيف')}</button>`;
      box.querySelector('[data-go]')?.addEventListener('click', () => goto('account'));
      box.querySelector('[data-guest]').addEventListener('click', () => guestForm(box, items, opts, key));
    };
    box.dir = ar() ? 'rtl' : 'ltr';
    // Accounts off: guests can still order.
    if (!window.OrthoAuth?.enabled?.()) { guestForm(box, items, opts, key); return; }
    // The auth SDK only starts when asked, so start it here and wait with a timeout. The guest button is available immediately.
    box.innerHTML = `<p role="status">${t('Checking your account…', 'جارٍ التحقق من حسابك…')}</p><button type="button" class="button outline wide" data-guest>${t('Continue as guest', 'المتابعة كضيف')}</button>`;
    let guestChosen = false;
    box.querySelector('[data-guest]').onclick = () => { guestChosen = true; guestForm(box, items, opts, key); };
    const state = await new Promise(resolve => {
      let done = false, stop = () => {};
      const finish = s => { if (done) return; done = true; clearTimeout(timer); stop(); resolve(s); };
      const timer = setTimeout(() => finish({ready:true, user:null, role:'customer'}), 10000);
      stop = window.OrthoAuth.subscribe(s => { if (s.ready) finish(s); });
      if (done) stop();
      window.OrthoAuth.load().catch(() => finish({ready:true, user:null, role:'customer'}));
    });
    if (guestChosen || !box.isConnected) return;
    if (!state.user) { withGuest(`<div class="notice">${t('Sign in to place your order, or continue as a guest. Your cart is saved.', 'سجّل الدخول لإتمام طلبك، أو تابع كضيف. سلتك محفوظة.')}</div><button class="button wide" data-go>${t('Sign in / Create account', 'تسجيل الدخول / إنشاء حساب')}</button>`); return; }
    if (state.role !== 'customer') { box.innerHTML = `<div class="notice">${t('Staff accounts cannot place customer orders.', 'حسابات الفريق لا يمكنها إنشاء طلبات عملاء.')}</div>`; return; }
    if (!state.user.emailVerified) { withGuest(`<div class="notice">${t('Verify your email first (from My account), then return to your cart. Or continue as a guest.', 'فعّل بريدك الإلكتروني أولًا (من حسابي) ثم ارجع إلى السلة. أو تابع كضيف.')}</div><button class="button wide" data-go>${t('Go to My account', 'الذهاب إلى حسابي')}</button>`); return; }
    box.innerHTML = `<p role="status">${t('Loading your addresses…', 'جارٍ تحميل عناوينك…')}</p>`;
    let list;
    try { list = (await api('/v1/addresses')).addresses; } catch { box.innerHTML = `<div class="notice">${t('Could not load your addresses. Try again.', 'تعذر تحميل العناوين. حاول مرة أخرى.')}</div>`; return; }
    if (!list.length) { withGuest(`<div class="notice">${t('Add a delivery address (and mobile number) in My account first, or continue as a guest. Your cart is saved.', 'أضف عنوان توصيل ورقم جوال من حسابي أولًا، أو تابع كضيف. سلتك محفوظة.')}</div><button class="button wide" data-go>${t('Add address', 'إضافة عنوان')}</button>`); return; }
    const chosenDefault = list.find(a => a.is_default) || list[0];
    box.innerHTML = `<form class="od-form" novalidate>
      <fieldset><legend>${t('Delivery address', 'عنوان التوصيل')}</legend>${list.map(a => `<label class="od-addr"><input type="radio" name="address_id" value="${esc(a.id)}" ${a.id === chosenDefault.id ? 'checked' : ''}><span><b>${esc(a.label || a.city)}</b> — ${esc(a.recipient)} · <bdi dir="ltr">${esc(a.phone)}</bdi><br>${addressLine(a)}</span></label>`).join('')}</fieldset>
      <label class="field">${t('Order note (optional)', 'ملاحظات على الطلب (اختياري)')}<textarea name="note" maxlength="500" rows="2"></textarea></label>
      <div class="form-summary">${opts.total != null && opts.money ? `${t('Estimated total', 'الإجمالي التقديري')}: <strong>${opts.money(opts.total)}</strong><p class="small">${t('The final total is calculated by the server and shown after you place the order.', 'يحسب الخادم الإجمالي النهائي ويظهر بعد إرسال الطلب.')}</p>` : ''}
      <p class="small">${t('Our team will contact you to confirm the order and arrange payment.', 'سيتواصل معك فريقنا لتأكيد الطلب وترتيب الدفع.')}</p></div>
      <p class="od-error" role="alert" hidden></p>
      <button class="button wide" type="submit">${t('Place order', 'إرسال الطلب')}</button></form>`;
    const form = box.querySelector('form'), error = form.querySelector('.od-error'), submit = form.querySelector('[type=submit]');
    form.onsubmit = async e => {
      e.preventDefault(); error.hidden = true; submit.disabled = true;
      try {
        const d = Object.fromEntries(new FormData(form));
        const r = await api('/v1/orders', {method:'POST', body:{items, address_id:d.address_id, note:d.note || '', idempotency_key:key}});
        opts.onPlaced?.(r);
        box.innerHTML = `<div class="success"><b>✓</b><h3>${t('Order received', 'تم استلام طلبك')}</h3><p>${t('Order number', 'رقم الطلب')}: <strong dir="ltr">${esc(r.number)}</strong></p><p>${t('Total', 'الإجمالي')}: <strong>${money(r.total, ar() ? 'ar' : 'en')}</strong></p><p class="small">${t('We will contact you to confirm and arrange payment. Track it from My account.', 'سنتواصل معك للتأكيد وترتيب الدفع. تابع الطلب من حسابي.')}</p><button class="button" data-go>${t('View my orders', 'عرض طلباتي')}</button></div>`;
        box.querySelector('[data-go]').onclick = () => goto('account');
      } catch (err) {
        submit.disabled = false; error.hidden = false;
        error.textContent = err.status === 422 ? t('One of the products is no longer available for online ordering. Review your cart.', 'أحد المنتجات لم يعد متاحًا للطلب الإلكتروني. راجع سلتك.') : err.status === 403 ? t('Verify your email before ordering.', 'فعّل بريدك الإلكتروني قبل الطلب.') : t('Could not place the order. Please try again.', 'تعذر إرسال الطلب. حاول مرة أخرى.');
      }
    };
  }

  /* ---------- shared detail dialog ---------- */
  function showDetail(root, id, lang, staffState, refresh) {
    const box = document.createElement('dialog'); box.className = 'od-dialog'; box.dir = lang === 'ar' ? 'rtl' : 'ltr'; box.dataset.noTranslate = '';
    box.innerHTML = `<p role="status">…</p>`; root.append(box); box.addEventListener('close', () => box.remove(), {once:true}); box.showModal();
    const load = async () => {
      try {
        const o = await api('/v1/orders/' + id), a = o.address;
        const next = staffState ? NEXT[o.status] : [];
        box.innerHTML = `<div class="od-head"><h2 dir="ltr">${esc(o.number)} <span class="od-badge">${esc(label(o.status, lang))}</span></h2><button type="button" data-close aria-label="Close">×</button></div>
          ${staffState ? `<p>${esc(o.customer)}${o.guest ? ' <span class="od-badge">Guest</span>' : ''} · <bdi dir="ltr">${esc(o.customer_email)}</bdi></p>` : ''}
          <p class="small">${esc(date(o.created_at, lang))}</p>${itemsTable(o, lang)}
          <h3>${lang === 'ar' ? 'التوصيل' : 'Delivery'}</h3><p>${esc(a.recipient)} · <bdi dir="ltr">${esc(a.phone)}</bdi><br>${addressLine(a)}${a.short_address ? `<br><bdi dir="ltr">${esc(a.short_address)}</bdi>` : ''}</p>
          ${o.note ? `<p class="od-note">${esc(o.note)}</p>` : ''}
          ${o.tracking.number ? `<p>${lang === 'ar' ? 'تتبع الشحنة' : 'Tracking'}: ${esc(o.tracking.carrier)} <bdi dir="ltr">${esc(o.tracking.number)}</bdi></p>` : ''}
          <h3>${lang === 'ar' ? 'السجل' : 'History'}</h3><ul class="od-events">${o.events.map(e => `<li><b>${esc(label(e.status, lang))}</b> · ${esc(date(e.created_at, lang))}${e.note ? ' · ' + esc(e.note) : ''}</li>`).join('')}</ul>
          <p class="od-error" role="alert" hidden></p>
          ${staffState && next.length ? `<form class="od-staff"><label>${next.length > 1 ? 'Next status' : 'Next status'}<select name="status">${next.map(s => `<option value="${s}">${esc(label(s, 'en'))}</option>`).join('')}</select></label><label>Carrier (when shipped)<input name="tracking_carrier" maxlength="60"></label><label>Tracking no.<input name="tracking_number" maxlength="80" dir="ltr"></label><label>Note<input name="note" maxlength="300"></label><button class="button" type="submit">Update status</button></form>` : ''}
          ${!staffState && o.status === 'pending_payment' ? `<button type="button" class="button outline" data-cancel>${lang === 'ar' ? 'إلغاء الطلب' : 'Cancel order'}</button>` : ''}`;
        const err = box.querySelector('.od-error');
        const fail = () => { err.hidden = false; err.textContent = lang === 'ar' ? 'تعذر تنفيذ العملية. حدّث الصفحة وحاول مرة أخرى.' : 'Action failed. Refresh and try again.'; };
        box.querySelector('[data-close]').onclick = () => box.close();
        box.querySelector('[data-cancel]')?.addEventListener('click', async () => { if (!confirm(lang === 'ar' ? 'إلغاء هذا الطلب؟' : 'Cancel this order?')) return; try { await api('/v1/orders/' + id + '/cancel', {method:'POST', body:{}}); await load(); refresh(); } catch { fail(); } });
        box.querySelector('.od-staff')?.addEventListener('submit', async e => { e.preventDefault(); try { await api('/v1/orders/' + id + '/status', {method:'POST', body:Object.fromEntries(new FormData(e.target))}); await load(); refresh(); } catch { fail(); } });
      } catch { box.innerHTML = `<p>${lang === 'ar' ? 'تعذر تحميل الطلب.' : 'Could not load the order.'}</p><button type="button" data-close>OK</button>`; box.querySelector('[data-close]').onclick = () => box.close(); }
    };
    load();
  }

  /* ---------- list (customer + staff) ---------- */
  function list(root, state, staff) {
    const lang = staff ? 'en' : ar() ? 'ar' : 'en';
    const alive = () => root.isConnected && window.OrthoAuth.state().user?.uid === state.user.uid;
    let rows = [], offset = 0, more = false, busy = false, total = null, failed = false;
    const draw = () => {
      if (!alive()) return;
      const head = staff ? ['Order', 'Customer', 'Date', 'Total', 'Status'] : lang === 'ar' ? ['الطلب', 'التاريخ', 'الإجمالي', 'الحالة'] : ['Order', 'Date', 'Total', 'Status'];
      root.querySelector('.od-list').innerHTML = failed ? `<p>${lang === 'ar' ? 'تعذر تحميل الطلبات.' : 'Could not load orders.'}</p>` : !rows.length && total !== null ? `<p>${staff ? 'No orders yet.' : t('You have no orders yet.', 'ليس لديك طلبات بعد.')}</p>` : `<div class="od-scroll"><table class="od-table"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr data-id="${esc(r.id)}" tabindex="0" role="button"><td dir="ltr">${esc(r.number)}</td>${staff ? `<td>${esc(r.customer)}${r.guest ? ' <span class="od-badge">Guest</span>' : ''}</td>` : ''}<td>${esc(date(r.created_at, lang))}</td><td dir="ltr">${money(r.total, lang)}</td><td><span class="od-badge">${esc(label(r.status, lang))}</span></td></tr>`).join('')}</tbody></table></div>${more ? `<button type="button" class="button outline" data-more>${lang === 'ar' ? 'عرض المزيد' : 'Show more'}</button>` : ''}`;
    };
    async function load(append) {
      if (busy) return; busy = true;
      try { const d = await api('/v1/orders' + (append ? '?offset=' + offset : '')); if (!alive()) return; rows = append ? rows.concat(d.orders) : d.orders; offset = rows.length; more = d.hasMore; total = d.total; failed = false; }
      catch { failed = true; }
      busy = false; draw();
    }
    root.addEventListener('click', e => {
      if (e.target.closest('[data-more]')) { load(true); return; }
      const row = e.target.closest('tr[data-id]'); if (row) showDetail(root, row.dataset.id, lang, staff ? state : null, () => { offset = 0; load(false); });
    });
    root.addEventListener('keydown', e => { if (e.key === 'Enter') e.target.closest?.('tr[data-id]')?.click(); });
    draw(); load(false);
  }
  function customerPanel(target, state) {
    const host = target.querySelector('section'); if (!host || !state.user) return;
    const root = document.createElement('section'); root.className = 'ad-book od-book'; root.dir = ar() ? 'rtl' : 'ltr'; root.dataset.noTranslate = '';
    root.innerHTML = `<h2>${t('My orders', 'طلباتي')}</h2><div class="od-list"><p>${t('Loading…', 'جارٍ التحميل…')}</p></div>`;
    host.append(root); list(root, state, false);
  }
  function staffPanel(panel, state) {
    panel.innerHTML = '<article class="mg-card od-staff-card"><h2>Store orders</h2><p class="mg-muted">All website orders. Open an order to update its status.</p><div class="od-list"><p>Loading…</p></div></article>';
    list(panel.querySelector('.od-staff-card'), state, true);
  }
  window.OrthoOrders = {checkout, customerPanel, staffPanel};
})();
