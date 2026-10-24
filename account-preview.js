'use strict';
/* Optional customer UI preview. No sessions, credentials, requests or orders. */
(() => {
  const enabled = () => window.OrthoCMS?.settings?.accounts?.previewEnabled === true;
  const note = 'معاينة واجهة فقط. تسجيل الدخول والحسابات غير متصلين بخدمة، ولا تُرسل أو تُحفظ أي بيانات.';
  const roles = {
    customer: {title:'حساب العميل',label:'عميل تجريبي',href:'#account'},
    admin: {title:'حساب مسؤول المتجر',label:'مسؤول متجر تجريبي',href:'#account/admin'},
    'super-admin': {title:'حساب Super Admin',label:'Super Admin تجريبي',href:'#account/super-admin'}
  };
  function demoLinks() { return `<div class="account-demo-roles" aria-label="الحسابات التجريبية">${Object.entries(roles).map(([key,r])=>`<a class="button outline" data-demo-role="${key}" href="${r.href}">${r.label}</a>`).join('')}</div>`; }
  function sync() {
    const button = document.getElementById('accountBtn');
    if (button) {
      button.hidden = !enabled();
      button.onclick = () => { if (enabled()) location.hash = 'login'; };
    }
  }
  function render(view, main) {
    if (!enabled()) return false;
    if (view === 'login') {
      main.innerHTML = `<section class="wrap"><div class="account-preview-note">${note}</div><div class="auth-layout"><div class="auth-form"><span class="eyebrow">ORTHOSERV</span><h1>تسجيل الدخول</h1><form id="accountPreviewForm"><label>البريد الإلكتروني<input type="email" disabled autocomplete="off"></label><label>كلمة المرور<input type="password" disabled autocomplete="off"></label><button class="button wide" disabled>تسجيل الدخول غير متاح في المعاينة</button></form>${demoLinks()}</div><div class="auth-art"><h2>حساب العميل</h2><p>${note}</p><img src="assets/products/rehab/game-ready-med4-elite.webp" width="1165" height="1043" alt="Game Ready MED4 Elite"></div></div></section>`;
      document.getElementById('accountPreviewForm').onsubmit = e => e.preventDefault();
    } else {
      const requested=location.hash.split('/')[1]||'customer';
      const role=Object.hasOwn(roles,requested)?requested:'customer',persona=roles[role];
      const states = [['pending','قيد التنفيذ'],['complete','مكتملة'],['cancelled','ملغاة'],['returned','مرتجعة']];
      const labels = role==='customer'?['طلباتي','العناوين','الملف الشخصي','الدعم']:role==='admin'?['طلبات المتجر','العملاء','المنتجات','التقارير']:['كل الطلبات','المتاجر','الفريق والصلاحيات','الأمان','التقارير'];
      const messages = role==='customer'?['لا توجد بيانات طلبات متصلة في هذه المعاينة.','العناوين غير متاحة في المعاينة.','بيانات الملف الشخصي غير متاحة في المعاينة.','تواصل مع أورثو سيرف للاستفسارات. النموذج تجريبي.']:labels.map(()=> 'هذا الحساب تجريبي. لا توجد بيانات أو صلاحيات إدارية حقيقية متصلة. الإدارة والتقارير التفصيلية من برنامج TODAY.');
      main.innerHTML = `<section class="wrap"><div class="account-preview-note">${note}</div><div class="account-heading"><div class="account-profile"><span class="profile-avatar" aria-hidden="true">○</span><h1>${persona.title}</h1></div><a class="text-link" href="#catalog">العودة للتصفح ←</a></div>${demoLinks()}<p><a class="text-link" id="demoLogout" href="#login">الخروج من المعاينة ←</a></p><div class="account-tabs" role="tablist" aria-label="حسابي">${labels.map((label,i)=>`<button type="button" id="accountTab${i}" role="tab" aria-controls="accountPanel${i}" aria-selected="${i===0}" tabindex="${i===0?0:-1}" class="${i===0?'active':''}">${label}</button>`).join('')}</div><div class="account-stats">${states.map(([key,label])=>`<div class="order-stat"><span class="stat-label"><i class="status-dot ${key}"></i>${label}</span><strong>—</strong><small>بيانات الطلبات غير متصلة</small></div>`).join('')}</div>${messages.map((message,i)=>`<section class="account-panel" id="accountPanel${i}" role="tabpanel" aria-labelledby="accountTab${i}" ${i?'hidden':''}><h2>${labels[i]}</h2><div class="empty"><p>${message}</p>${i===3&&role==='customer'?'<a class="text-link" href="#contact">تواصل معنا ←</a>':''}</div></section>`).join('')}</section>`;
      main.querySelector('.wrap').dataset.demoRole=role;
      main.querySelector(`[data-demo-role="${role}"]`).setAttribute('aria-current','page');
      const buttons = [...main.querySelectorAll('[role=tab]')];
      buttons.forEach((button,i) => {
        button.onclick = () => buttons.forEach((other,j) => {
          other.classList.toggle('active', i===j);
          other.setAttribute('aria-selected',String(i===j));
          other.tabIndex=i===j?0:-1;
          document.getElementById('accountPanel'+j).hidden=i!==j;
        });
        button.onkeydown = e => {
          if(e.key==='Home'||e.key==='End'){e.preventDefault();const next=buttons[e.key==='Home'?0:buttons.length-1];next.click();next.focus();return;}
          let step=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;
          if(document.documentElement.dir==='rtl')step=-step;
          if(step){e.preventDefault();const next=buttons[(i+step+buttons.length)%buttons.length];next.click();next.focus();}
        };
      });
    }
    document.title=(view==='login'?'تسجيل الدخول التجريبي':roles[location.hash.split('/')[1]||'customer']?.title||roles.customer.title)+' | OrthoServ';
    window.OrthoRefreshLanguage?.();
    return true;
  }
  window.OrthoAccountPreview = {enabled,render,sync};
  document.addEventListener('DOMContentLoaded',sync);
  window.addEventListener('orthocms:ready',sync);
})();
