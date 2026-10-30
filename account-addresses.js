'use strict';
/* Customer phone + address book. Own data only; the account service scopes every request to the verified uid. */
(() => {
  const ar = () => document.documentElement.lang === 'ar';
  const t = (en, a) => ar() ? a : en;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const api = (path, options) => window.OrthoAuth.accountRequest(path, options);
  const errors = {invalid_phone:['Enter a valid mobile number, e.g. 05xxxxxxxx.','أدخل رقم جوال صحيح مثل 05xxxxxxxx.'],invalid_address:['Check the required fields, phone, short address (e.g. ABCD1234) and postal code (5 digits).','راجع الحقول المطلوبة والجوال والعنوان المختصر (مثل ABCD1234) والرمز البريدي (5 أرقام).'],address_limit:['You can save up to 10 addresses.','يمكنك حفظ 10 عناوين كحد أقصى.']};
  async function failure(error) {
    return error.status === 400 || error.status === 409 ? null : t('Something went wrong. Please try again.', 'حدث خطأ. حاول مرة أخرى.');
  }
  function render(target, state) {
    const host = target.querySelector('section');
    if (!host || !state.user) return;
    const root = document.createElement('section');
    root.className = 'ad-book';
    root.dir = ar() ? 'rtl' : 'ltr';
    root.dataset.noTranslate = '';
    host.append(root);
    let phone = '', list = [], editing = null, message = '', loaded = false;
    const alive = () => root.isConnected && window.OrthoAuth.state().user?.uid === state.user.uid;
    const field = (name, label, value = '', extra = '') => `<label>${label}<input name="${name}" value="${esc(value)}" ${extra}></label>`;
    function form(a = {}) {
      return `<form class="ad-form" novalidate>
        ${field('recipient', t('Recipient name *', 'اسم المستلم *'), a.recipient, 'required maxlength="100" autocomplete="name"')}
        ${field('phone', t('Mobile *', 'الجوال *'), a.phone, 'required inputmode="tel" maxlength="20" autocomplete="tel" placeholder="05xxxxxxxx"')}
        ${field('city', t('City *', 'المدينة *'), a.city, 'required maxlength="80" autocomplete="address-level2"')}
        ${field('district', t('District', 'الحي'), a.district, 'maxlength="80"')}
        ${field('street', t('Street', 'الشارع'), a.street, 'maxlength="120" autocomplete="address-line1"')}
        ${field('building_no', t('Building no.', 'رقم المبنى'), a.building_no, 'maxlength="20"')}
        ${field('short_address', t('Short address', 'العنوان المختصر'), a.short_address, 'maxlength="8" placeholder="ABCD1234" dir="ltr"')}
        ${field('postal_code', t('Postal code', 'الرمز البريدي'), a.postal_code, 'maxlength="5" inputmode="numeric" autocomplete="postal-code" dir="ltr"')}
        ${field('label', t('Label (Home, Work)', 'اسم العنوان (المنزل، العمل)'), a.label, 'maxlength="60"')}
        ${field('notes', t('Delivery notes', 'ملاحظات التوصيل'), a.notes, 'maxlength="300"')}
        <label class="ad-check"><input type="checkbox" name="is_default" ${a.is_default || (!list.length && !a.id) ? 'checked' : ''}> ${t('Default address', 'العنوان الافتراضي')}</label>
        <div class="ad-actions"><button type="submit" class="button">${t('Save address', 'حفظ العنوان')}</button><button type="button" class="button outline" data-cancel>${t('Cancel', 'إلغاء')}</button></div>
      </form>`;
    }
    function draw() {
      if (!alive()) return;
      const cards = list.map(a => `<article class="ad-card" data-id="${esc(a.id)}">
        <h3>${esc(a.label || a.city)} ${a.is_default ? `<span class="ad-badge">${t('Default', 'افتراضي')}</span>` : ''}</h3>
        <p>${esc(a.recipient)} · <bdi dir="ltr">${esc(a.phone)}</bdi></p>
        <p>${[a.street, a.building_no, a.district, a.city, a.postal_code].filter(Boolean).map(esc).join('، ')}</p>
        ${a.short_address ? `<p><bdi dir="ltr">${esc(a.short_address)}</bdi></p>` : ''}${a.notes ? `<p class="ad-note">${esc(a.notes)}</p>` : ''}
        <div class="ad-actions"><button type="button" class="button outline" data-edit>${t('Edit', 'تعديل')}</button>${a.is_default ? '' : `<button type="button" class="button outline" data-default>${t('Make default', 'اجعله افتراضيًا')}</button>`}<button type="button" class="button outline" data-delete>${t('Delete', 'حذف')}</button></div>
      </article>`).join('');
      root.innerHTML = `<h2>${t('Mobile number', 'رقم الجوال')}</h2>
        <form class="ad-phone" novalidate><input name="phone" value="${esc(phone)}" inputmode="tel" maxlength="20" placeholder="05xxxxxxxx" dir="ltr" aria-label="${t('Mobile number', 'رقم الجوال')}"><button class="button" type="submit">${t('Save', 'حفظ')}</button></form>
        <h2>${t('Addresses', 'العناوين')}</h2>
        <p role="status" class="ad-msg">${esc(message)}</p>
        ${!loaded ? `<p>${t('Loading…', 'جارٍ التحميل…')}</p>` : cards || `<p>${t('No saved addresses yet.', 'لا توجد عناوين محفوظة بعد.')}</p>`}
        ${editing ? form(editing === 'new' ? {} : list.find(a => a.id === editing)) : loaded && list.length < 10 ? `<button type="button" class="button" data-new>${t('Add address', 'إضافة عنوان')}</button>` : ''}`;
    }
    async function load() {
      try {
        const [p, a] = await Promise.all([api('/v1/profile'), api('/v1/addresses')]);
        phone = p.phone; list = a.addresses; loaded = true; message = '';
      } catch { loaded = true; message = t('Could not load your addresses.', 'تعذر تحميل العناوين.'); }
      draw();
    }
    async function run(job) {
      try { await job(); message = t('Saved.', 'تم الحفظ.'); editing = null; await load(); }
      catch (e) {
        const code = e.status === 400 ? 'invalid' : e.status === 409 ? 'address_limit' : '';
        message = (await failure(e)) || (errors[code]?.[ar() ? 1 : 0]) || t('Please check the entered data.', 'راجع البيانات المدخلة.');
        draw();
      }
    }
    root.addEventListener('submit', e => {
      e.preventDefault();
      const f = e.target, d = Object.fromEntries(new FormData(f));
      if (f.classList.contains('ad-phone')) {
        run(() => api('/v1/profile', {method:'POST', body:{phone:d.phone}}));
        return;
      }
      const body = {...d, is_default: f.elements.is_default?.checked === true};
      run(() => api(editing === 'new' ? '/v1/addresses' : '/v1/addresses/' + editing, {method:'POST', body}));
    });
    root.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const id = b.closest('.ad-card')?.dataset.id;
      if (b.hasAttribute('data-new')) { editing = 'new'; message = ''; draw(); }
      else if (b.hasAttribute('data-cancel')) { editing = null; draw(); }
      else if (b.hasAttribute('data-edit')) { editing = id; message = ''; draw(); }
      else if (b.hasAttribute('data-default')) run(() => api('/v1/addresses/' + id + '/default', {method:'POST', body:{}}));
      else if (b.hasAttribute('data-delete') && confirm(t('Delete this address?', 'حذف هذا العنوان؟'))) run(() => api('/v1/addresses/' + id + '/delete', {method:'POST', body:{}}));
    });
    draw(); load();
  }
  window.OrthoAddresses = {render};
})();
