'use strict';
/* Optional customer UI preview. No sessions, credentials, requests or orders. */
(() => {
  const enabled = () => window.OrthoCMS?.settings?.accounts?.previewEnabled === true;
  const note = 'البيانات المعروضة ليست طلبات أو حسابات فعلية. لا يُرسل أو يُحفظ أي طلب.';
  const roles = {
    customer: {title:'حساب العميل',label:'اسم العميل',href:'#account'},
    admin: {title:'حساب مسؤول المتجر',label:'مسؤول متجر',href:'#account/admin'},
    'super-admin': {title:'حساب Super Admin',label:'Super Admin',href:'#account/super-admin'}
  };
  function demoLinks() { return `<div class="account-demo-roles" aria-label="الحسابات">${Object.entries(roles).map(([key,r])=>`<a class="button outline" data-demo-role="${key}" href="${r.href}">${r.label}</a>`).join('')}</div>`; }
  // Fictional fixtures only: never merged into the catalogue, customers or orders.
  const demoCustomers=[
    {id:'customer',name:'أحمد',email:'customer@example.test'},
    {id:'clinic',name:'عيادة الأمل',email:'clinic@example.test'},
    {id:'sara',name:'سارة',email:'sara@example.test'}
  ];
  const demoOrders=[
    {id:'DEMO-1048',customer:'customer',store:'main',date:'2026-10-24',state:'pending',item:'طقم تمارين',qty:1,total:350},
    {id:'DEMO-1043',customer:'customer',store:'main',date:'2026-10-21',state:'complete',item:'حزمة مستلزمات',qty:2,total:420},
    {id:'DEMO-1037',customer:'customer',store:'main',date:'2026-10-18',state:'cancelled',item:'جورب ضغط',qty:1,total:280},
    {id:'DEMO-1029',customer:'customer',store:'main',date:'2026-10-12',state:'returned',item:'شريط مقاومة',qty:2,total:180},
    {id:'DEMO-1047',customer:'clinic',store:'main',date:'2026-10-24',state:'pending',item:'حزمة تجهيز',qty:1,total:2400},
    {id:'DEMO-1041',customer:'sara',store:'main',date:'2026-10-20',state:'complete',item:'طقم تمارين',qty:1,total:350},
    {id:'DEMO-1046',customer:'clinic',store:'branch',date:'2026-10-23',state:'pending',item:'حزمة مستلزمات',qty:3,total:630},
    {id:'DEMO-1032',customer:'sara',store:'branch',date:'2026-10-15',state:'returned',item:'جورب ضغط',qty:1,total:280}
  ];
  const demoStates={pending:'قيد التنفيذ',complete:'مكتملة',cancelled:'ملغاة',returned:'مرتجعة'};
  const demoStore=id=>id==='main'?'OrthoServ — متجر رئيسي':'OrthoServ — فرع';
  const demoMoney=value=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(value)+' ر.س';
  const demoScope=role=>demoOrders.filter(o=>role==='customer'?o.customer==='customer':role==='admin'?o.store==='main':true);
  const demoEscape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function demoTable(headers,rows){return `<div class="account-demo-table-wrap"><table class="account-demo-table"><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;}
  function demoOrderTable(role,status='all'){
    const items=demoScope(role).filter(o=>status==='all'||o.state===status);
    return `<div class="account-demo-section-head"><p class="account-demo-badge">الطلبات</p><button type="button" class="button outline" data-demo-clear>عرض كل الطلبات</button></div>`+demoTable(['الطلب','التاريخ','العميل','الحالة','الإجمالي','التفاصيل'],items.map(o=>`<tr data-demo-order="${o.id}"><td><strong>${o.id.replace(/^-/, '')}</strong></td><td>${o.date}</td><td>${demoCustomers.find(c=>c.id===o.customer).name}</td><td><span class="account-demo-status ${o.state}">${demoStates[o.state]}</span></td><td>${demoMoney(o.total)}</td><td><details><summary>ملخص الطلب</summary><p>${o.item}</p><p>الكمية: ${o.qty}</p><p>الشحن: مراجعة</p><p>${demoStore(o.store)}</p></details></td></tr>`));
  }
  function demoProfile(){return `<div class="account-demo-card"><h3>أحمد</h3><dl><dt>البريد الإلكتروني</dt><dd>customer@example.test</dd><dt>الهاتف</dt><dd dir="ltr">05X XXX XXXX</dd><dt>عضو منذ</dt><dd>2026-03-01</dd><dt>نوع الحساب</dt><dd>اسم العميل</dd></dl></div>`;}
  function demoAddresses(){return `<div class="account-demo-grid">${['عنوان المنزل','عنوان العيادة'].map((title,i)=>`<article class="account-demo-card"><h3>${title}</h3><p>${i?'جدة — حي':'الرياض — حي'}</p><p>شارع العرض ، مبنى ${i+1}</p><p class="account-demo-badge">عنوان غير حقيقي</p></article>`).join('')}</div>`;}
  function demoSupport(){return demoTable(['التذكرة','الموضوع','الحالة'],['<tr><td>S12</td><td>استفسار عن المقاس</td><td>مفتوحة</td></tr>','<tr><td>S09</td><td>استفسار عن الشحن</td><td>مغلقة</td></tr>'])+'<p><a class="text-link" href="#contact">تواصل معنا ←</a></p>';}
  function demoCustomerTable(role){const orders=demoScope(role);return demoTable(['العميل','البريد الإلكتروني','الطلبات','إجمالي الطلبات'],demoCustomers.map(c=>{const own=orders.filter(o=>o.customer===c.id);return `<tr><td>${c.name}</td><td>${c.email}</td><td>${own.length}</td><td>${demoMoney(own.reduce((sum,o)=>sum+o.total,0))}</td></tr>`;}));}
  function demoProducts(){return demoTable(['المنتج','الرمز','رصيد','السعر يحتاج تأكيدًا'],[['طقم تمارين','DEMO-P01',18,350],['جورب ضغط','DEMO-P02',12,280],['شريط مقاومة','DEMO-P03',30,90]].map(([name,id,stock,price])=>`<tr><td>${name}</td><td>${id.replace(/^-/, '')}</td><td>${stock}</td><td>${demoMoney(price)}</td></tr>`))+'<p class="readonly-note">هذه الأمثلة منفصلة عن كتالوج المنتجات الحقيقي.</p>';}
  function demoReports(role){const orders=demoScope(role),sum=state=>orders.filter(o=>o.state===state).reduce((n,o)=>n+o.total,0);return `<div class="account-demo-grid"><article class="account-demo-card"><h3>قيمة الطلبات المكتملة</h3><strong>${demoMoney(sum('complete'))}</strong></article><article class="account-demo-card"><h3>قيمة الطلبات قيد التنفيذ</h3><strong>${demoMoney(sum('pending'))}</strong></article><article class="account-demo-card"><h3>قيمة الطلبات المرتجعة</h3><strong>${demoMoney(sum('returned'))}</strong></article><article class="account-demo-card"><h3>عدد الطلبات</h3><strong>${orders.length}</strong></article></div><p class="readonly-note">ملخص فقط. التقارير التفصيلية والإدارة من برنامج TODAY.</p>`;}
  function demoStores(){return demoTable(['المتجر','الطلبات','طلبات مكتملة','الحالة'],['main','branch'].map(id=>{const own=demoOrders.filter(o=>o.store===id);return `<tr><td>${demoStore(id)}</td><td>${own.length}</td><td>${own.filter(o=>o.state==='complete').length}</td><td>متجر</td></tr>`;}));}
  function demoTeam(){return demoTable(['الاسم','البريد الإلكتروني','الدور','الحالة'],[['مالك','owner@example.test','Super Admin'],['مدير','admin@example.test','مسؤول متجر'],['دعم','support@example.test','خدمة العملاء']].map(([name,email,role])=>`<tr><td>${name}</td><td>${email}</td><td>${role}</td><td>عضو</td></tr>`))+'<p class="readonly-note">أدوار للعرض فقط؛ لا تمنح صلاحيات حقيقية.</p>';}
  function demoSecurity(){return `<p class="account-demo-badge">سجل</p>`+demoTable(['الوقت','الحدث','الحساب'],['<tr><td>2026-10-24 10:30</td><td>دخول</td><td>owner@example.test</td></tr>','<tr><td>2026-10-24 10:15</td><td>مراجعة تقرير</td><td>admin@example.test</td></tr>'])+'<p class="readonly-note">لا توجد مصادقة أو مراقبة أمنية حقيقية متصلة بهذا الموقع.</p>';}
  function fillDemo(role){
    const orders=demoScope(role),keys=Object.keys(demoStates),cards=[...document.querySelectorAll('.account-stats .order-stat')];
    const body=role==='customer'?[demoOrderTable(role),demoAddresses(),demoProfile(),demoSupport()]:role==='admin'?[demoOrderTable(role),demoCustomerTable(role),demoProducts(),demoReports(role)]:[demoOrderTable(role),demoStores(),demoTeam(),demoSecurity(),demoReports(role)];
    body.forEach((html,i)=>{const panel=document.getElementById('accountPanel'+i);panel.querySelector('.empty').outerHTML=`<div class="account-demo-content">${html}</div>`;});
    const first=document.getElementById('accountPanel0');
    function showStatus(status){document.getElementById('accountTab0').click();first.querySelector('.account-demo-content').innerHTML=demoOrderTable(role,status);cards.forEach((card,i)=>card.setAttribute('aria-pressed',String(keys[i]===status)));}
    first.onclick=e=>{if(e.target.closest('[data-demo-clear]'))showStatus('all');};
    cards.forEach((card,i)=>{
      card.querySelector('strong').textContent=orders.filter(o=>o.state===keys[i]).length;card.querySelector('small').textContent='طلبات';
      card.dataset.demoStatus=keys[i];card.setAttribute('role','button');card.tabIndex=0;card.setAttribute('aria-pressed','false');
      card.onclick=()=>showStatus(keys[i]);card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showStatus(keys[i]);}};
    });
  }

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
      main.innerHTML = `<section class="wrap"><div class="account-preview-note">${note}</div><div class="auth-layout"><div class="auth-form"><span class="eyebrow">ORTHOSERV</span><h1>تسجيل الدخول</h1><form id="accountPreviewForm"><label>البريد الإلكتروني<input type="email" disabled autocomplete="off"></label><label>كلمة المرور<input type="password" disabled autocomplete="off"></label><button class="button wide" disabled>تسجيل الدخول غير متاح حاليًا</button></form>${demoLinks()}</div><div class="auth-art"><h2>حساب العميل</h2><p>${note}</p><img src="assets/products/rehab/game-ready-med4-elite.webp" width="1165" height="1043" alt="Game Ready MED4 Elite"></div></div></section>`;
      document.getElementById('accountPreviewForm').onsubmit = e => e.preventDefault();
    } else {
      const requested=location.hash.split('/')[1]||'customer';
      const role=Object.hasOwn(roles,requested)?requested:'customer',persona=roles[role];
      const states = [['pending','قيد التنفيذ'],['complete','مكتملة'],['cancelled','ملغاة'],['returned','مرتجعة']];
      const labels = role==='customer'?['طلباتي','العناوين','الملف الشخصي','الدعم']:role==='admin'?['طلبات المتجر','العملاء','المنتجات','التقارير']:['كل الطلبات','المتاجر','الفريق والصلاحيات','الأمان','التقارير'];
      const messages = role==='customer'?['لا توجد بيانات طلبات متصلة حاليًا.','العناوين غير متاحة حاليًا.','بيانات الملف الشخصي غير متاحة حاليًا.','تواصل مع أورثو سيرف للاستفسارات.']:labels.map(()=> 'لا توجد بيانات أو صلاحيات إدارية متصلة بهذا الحساب. الإدارة والتقارير التفصيلية من برنامج TODAY.');
      main.innerHTML = `<section class="wrap"><div class="account-preview-note">${note}</div><div class="account-heading"><div class="account-profile"><span class="profile-avatar" aria-hidden="true">○</span><h1>${persona.title}</h1></div><a class="text-link" href="#catalog">العودة للتصفح ←</a></div>${demoLinks()}<p><a class="text-link" id="demoLogout" href="#login">الخروج ←</a></p><div class="account-tabs" role="tablist" aria-label="حسابي">${labels.map((label,i)=>`<button type="button" id="accountTab${i}" role="tab" aria-controls="accountPanel${i}" aria-selected="${i===0}" tabindex="${i===0?0:-1}" class="${i===0?'active':''}">${label}</button>`).join('')}</div><div class="account-stats">${states.map(([key,label])=>`<div class="order-stat"><span class="stat-label"><i class="status-dot ${key}"></i>${label}</span><strong>—</strong><small>بيانات الطلبات غير متصلة</small></div>`).join('')}</div>${messages.map((message,i)=>`<section class="account-panel" id="accountPanel${i}" role="tabpanel" aria-labelledby="accountTab${i}" ${i?'hidden':''}><h2>${labels[i]}</h2><div class="empty"><p>${message}</p>${i===3&&role==='customer'?'<a class="text-link" href="#contact">تواصل معنا ←</a>':''}</div></section>`).join('')}</section>`;
      fillDemo(role);
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
    document.title=(view==='login'?'الدخول إلى الحساب':roles[location.hash.split('/')[1]||'customer']?.title||roles.customer.title)+' | OrthoServ';
    window.OrthoRefreshLanguage?.();
    return true;
  }
  window.OrthoAccountPreview = {enabled,render,sync};
  document.addEventListener('DOMContentLoaded',sync);
  window.addEventListener('orthocms:ready',sync);
})();
