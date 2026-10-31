'use strict';
/* Invoice view. ONE renderer for everybody: customers ("My orders", checkout confirmation), Admin and Super Admin
   (Orders tab). The data always comes from the account service (GET /v1/orders/:id/invoice, or the invoice returned
   at checkout, which is the same object), so every viewer sees the same invoice. The invoice itself is bilingual
   and does not change with the site language; only the dialog buttons do. */
(() => {
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dash = v => v === null || v === undefined || v === '' ? '—' : esc(v);
  const money = minor => ((Number(minor) || 0) / 100).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
  const STATUS = {pending_payment:'Awaiting payment / بانتظار الدفع', paid:'Paid / مدفوع', processing:'Processing / قيد التجهيز', shipped:'Shipped / تم الشحن', delivered:'Delivered / تم التسليم', cancelled:'Cancelled / ملغي'};
  const ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6 3h9l4 4v14H6zM15 3v4h4M9 12h6M9 16h6"/></svg>';
  const words = lang => lang === 'ar'
    ? {title:'الفاتورة', button:'الفاتورة', print:'طباعة / حفظ PDF', close:'إغلاق', loading:'جارٍ تحميل الفاتورة…', unavailable:'الفاتورة غير متاحة لهذا الطلب. تواصل معنا.', failed:'تعذر تحميل الفاتورة. حاول مرة أخرى.'}
    : {title:'Invoice', button:'Invoice', print:'Print / Save as PDF', close:'Close', loading:'Loading invoice…', unavailable:'An invoice is not available for this order. Please contact us.', failed:'Could not load the invoice. Please try again.'};

  /* Complete, self-contained document (shown in the preview and printed from the very same iframe). */
  function page(inv) {
    const s = inv.seller || {}, c = inv.customer || {};
    const th = 'border:1px solid #333;background:#eef2f7;padding:5px;font-size:9pt;', td = 'border:1px solid #999;padding:5px;font-size:9.5pt;';
    const rows = inv.lines.map((l, n) => `<tr><td style="${td}" align="center">${n + 1}</td><td style="${td}"><bdi>${esc(l.name)}</bdi>${l.option ? ' · <bdi>' + esc(l.option) + '</bdi>' : ''}</td><td style="${td}" align="center">${esc(l.qty)}</td><td style="${td}" align="right">${money(l.unit)}</td><td style="${td}" align="center">${esc(l.rate)}%</td><td style="${td}" align="right">${money(l.net)}</td><td style="${td}" align="right">${money(l.vat)}</td><td style="${td}" align="right">${money(l.gross)}</td></tr>`).join('');
    const breakdown = inv.by_rate.map(r => `<tr><td style="${td}" align="center">${esc(r.rate)}%</td><td style="${td}" align="right">${money(r.net)}</td><td style="${td}" align="right">${money(r.vat)}</td><td style="${td}" align="right">${money(r.gross)}</td></tr>`).join('');
    const seller = [['VAT No. / الرقم الضريبي', 'vat_number'], ['CR No. / السجل التجاري', 'cr_number'], ['Address / العنوان', 'address'], ['Short address / العنوان المختصر', 'short_address'], ['Postal code / الرمز البريدي', 'postal_code'], ['Phone / الهاتف', 's_phone'], ['Email / البريد', 's_email']]
      .map(([label, key]) => { const v = key === 's_phone' ? s.phone : key === 's_email' ? s.email : s[key]; return v ? `<div>${label}: ${esc(v)}</div>` : ''; }).join('');
    const banner = inv.status === 'cancelled' ? '<div style="border:2px solid #b42318;color:#b42318;padding:6px;text-align:center;font-weight:bold;margin-bottom:10px;">CANCELLED ORDER<br>طلب ملغي</div>' : '';
    return `<!doctype html><html dir="ltr"><head><meta charset="utf-8"><title>${esc(inv.number)}</title><style>@page{size:A4;margin:14mm}body{font-family:Tahoma,Arial,'DejaVu Sans',sans-serif;font-size:10pt;color:#1a1a1a;margin:14px}table{border-collapse:collapse}</style></head><body>
${banner}<table width="100%" cellspacing="0" cellpadding="0" style="border:0"><tr><td width="55%" valign="top"><div style="font-size:14pt;font-weight:bold">${dash(s.name_ar)}</div><div style="font-weight:bold">${dash(s.name_en)}</div><div style="font-size:8.5pt;color:#333">${seller}</div></td>
<td width="45%" valign="top" align="right"><div style="font-size:18pt;font-weight:bold">Invoice / فاتورة</div><div>No. / الرقم: <b>${dash(inv.number)}</b></div><div>Date / التاريخ: <b>${dash(inv.date)}</b></div><div>Order / الطلب: ${dash(inv.order_number)}</div><div>Status / الحالة: ${dash(STATUS[inv.status] || inv.status)}</div></td></tr></table>
<p style="margin:10px 0 2px;font-weight:bold">Bill to / العميل</p><div>Name / الاسم: <bdi>${dash(c.name)}</bdi></div><div>Email / البريد: <bdi>${dash(c.email)}</bdi></div><div>Phone / الجوال: <bdi>${dash(c.phone)}</bdi></div><div>City / المدينة: <bdi>${dash(c.city)}</bdi></div><p></p>
<table width="100%" cellspacing="0" cellpadding="0"><tr><th style="${th}">#</th><th style="${th}">Item<br>البند</th><th style="${th}">Qty<br>الكمية</th><th style="${th}">Unit price incl. VAT<br>سعر الوحدة شامل</th><th style="${th}">VAT %<br>الضريبة</th><th style="${th}">Amount excl. VAT<br>قبل الضريبة</th><th style="${th}">VAT<br>الضريبة</th><th style="${th}">Amount incl. VAT<br>بعد الضريبة</th></tr>${rows}</table><p></p>
<table width="100%" cellspacing="0" cellpadding="0" style="border:0"><tr><td width="50%" valign="top"><table cellspacing="0" cellpadding="0"><tr><th style="${th}">VAT rate<br>النسبة</th><th style="${th}">Taxable<br>الخاضع</th><th style="${th}">VAT<br>الضريبة</th><th style="${th}">Total<br>الإجمالي</th></tr>${breakdown}</table></td>
<td width="50%" valign="top" align="right"><table cellspacing="0" cellpadding="0" align="right"><tr><td style="${td}">Total excl. VAT / الإجمالي قبل الضريبة</td><td style="${td}" align="right">SAR ${money(inv.net)}</td></tr><tr><td style="${td}">VAT / ضريبة القيمة المضافة</td><td style="${td}" align="right">SAR ${money(inv.vat)}</td></tr><tr><td style="${td}background:#eef2f7;font-weight:bold">Total incl. VAT / الإجمالي شامل الضريبة</td><td style="${td}background:#eef2f7;font-weight:bold" align="right">SAR ${money(inv.gross)}</td></tr></table></td></tr></table>
<p style="font-size:8pt;color:#555">Medical devices are zero-rated (0%); all other products 15%. Prices shown on the store include VAT.<br>الأجهزة الطبية بنسبة 0% وباقي المنتجات 15%. الأسعار المعروضة في المتجر شاملة الضريبة.</p></body></html>`;
  }

  /* source: an order id (fetched from the account service) or an invoice object already returned by it. */
  function open(host, source, lang = 'en') {
    const w = words(lang);
    const box = document.createElement('dialog'); box.className = 'od-dialog od-inv-dialog'; box.dir = lang === 'ar' ? 'rtl' : 'ltr'; box.dataset.noTranslate = '';
    box.innerHTML = `<p role="status">${esc(w.loading)}</p>`; host.append(box); box.addEventListener('close', () => box.remove(), {once:true}); box.showModal();
    const fail = text => { box.innerHTML = `<p class="od-error" role="alert">${esc(text)}</p><button type="button" class="button outline" data-close>${esc(w.close)}</button>`; box.querySelector('[data-close]').onclick = () => box.close(); };
    const show = inv => {
      box.innerHTML = `<div class="od-head"><h2 dir="ltr">${esc(w.title)} ${esc(inv.number)}</h2><button type="button" data-close aria-label="${esc(w.close)}">×</button></div>
        <iframe class="od-inv-frame" title="${esc(w.title)} ${esc(inv.number)}" sandbox="allow-same-origin allow-modals"></iframe>
        <div class="od-inv-actions"><button type="button" class="button" data-print>${esc(w.print)}</button></div>`;
      const frame = box.querySelector('iframe'); frame.srcdoc = page(inv);
      box.querySelector('[data-close]').onclick = () => box.close();
      box.querySelector('[data-print]').onclick = () => { frame.contentWindow.focus(); frame.contentWindow.print(); };
    };
    if (source && typeof source === 'object') { show(source); return; }
    window.OrthoAuth.accountRequest('/v1/orders/' + encodeURIComponent(source) + '/invoice')
      .then(inv => { if (box.isConnected) show(inv); })
      .catch(err => { if (box.isConnected) fail(err?.status === 409 ? w.unavailable : w.failed); });
  }
  const button = (id, lang = 'en', labelled = false) => labelled
    ? `<button type="button" class="button outline od-inv-open" data-invoice="${esc(id)}">${ICON}<span>${esc(words(lang).button)}</span></button>`
    : `<button type="button" class="od-inv-btn" data-invoice="${esc(id)}" title="${esc(words(lang).button)} / فاتورة" aria-label="${esc(words(lang).button)}">${ICON}</button>`;
  window.OrthoInvoice = {open, button, page, words};
})();
