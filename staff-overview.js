'use strict';
(()=>{
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const t=(en,ar)=>document.documentElement.lang==='ar'?ar:en;
 const active=(root,state)=>root.isConnected&&window.OrthoAuth.state().user?.uid===state.user.uid&&window.OrthoAuth.state().role===state.role;
 const sar=n=>Number.isSafeInteger(n)?(n/100).toLocaleString('en-SA',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';
 const localStamp=(v,customer)=>new Intl.DateTimeFormat(customer&&document.documentElement.lang==='ar'?'ar-SA':'en-SA',{timeZone:'Asia/Riyadh',dateStyle:'medium',timeStyle:'short'}).format(new Date(v));
 const key=state=>'ortho-notification-read:'+state.user.uid;
 const cursor=state=>{try{const n=Number(localStorage.getItem(key(state))||0);return Number.isSafeInteger(n)&&n>=0&&n<=Date.now()?n:0;}catch{return 0;}};
 const names={pending_payment:'Awaiting payment',paid:'Paid',processing:'Processing',shipped:'Shipped',delivered:'Delivered',cancelled:'Cancelled',open:'Open',replied:'Replied'};
 const namesAr={pending_payment:'بانتظار الدفع',paid:'مدفوع',processing:'قيد التجهيز',shipped:'تم الشحن',delivered:'تم التسليم',cancelled:'ملغي',open:'مفتوحة',replied:'تم الرد'};
 const read=state=>window.OrthoAuth.accountRequest('/v1/notifications?since='+cursor(state));
 async function overview(root,panel,state){
  const version=(root._staffVersion||0)+1;root._staffVersion=version;
  const current=()=>active(root,state)&&root._staffVersion===version&&root.querySelector('[data-view][aria-current="page"]')?.dataset.view==='overview';
  try{
   const data=await window.OrthoAuth.accountRequest('/v1/staff-overview');if(!current())return;
   if(!data.kpis||!Array.isArray(data.orders)||!Number.isSafeInteger(data.openTickets))throw Error();
   if(state.role==='admin'){
    const cards=panel.querySelectorAll('.mg-stat strong');
    ['orders','newOrders','inProgress','attention'].forEach((k,i)=>{if(!Number.isSafeInteger(data.kpis[k]))throw Error();cards[i].textContent=data.kpis[k];cards[i].setAttribute('aria-label',k+' '+data.kpis[k]);});
    const wrap=panel.querySelector('[data-tab="orders"]')?.closest('.mg-card')?.querySelector('.mg-table-wrap');
    if(wrap)wrap.innerHTML=`<table><thead><tr><th>Order</th><th>Customer</th><th>Total (SAR)</th><th>Status</th></tr></thead><tbody>${data.orders.map(o=>`<tr><td>${esc(o.number)}</td><td dir="auto">${esc(o.customer)}</td><td>${sar(o.total)}</td><td>${esc(names[o.status]||o.status)}</td></tr>`).join('')||'<tr><td colspan="4">No orders yet.</td></tr>'}</tbody></table>`;
    const note=root.querySelector('.mg-sync');if(note)note.textContent=`All store orders · Updated ${localStamp(data.generatedAt)} · Riyadh time`;
   }
   const follow=panel.querySelector('[data-staff-followups]');if(follow)follow.innerHTML=`<p><strong>${data.kpis.newOrders}</strong> awaiting payment</p><p><strong>${data.kpis.inProgress}</strong> paid / processing</p><p><strong>${data.kpis.shipped}</strong> awaiting delivery</p><p><strong>${data.openTickets}</strong> open support tickets</p>`;
   const alerts=panel.querySelector('[data-store-alerts]');if(alerts)alerts.innerHTML=`<p><strong>${data.kpis.attention}</strong> orders need attention</p><p><strong>${data.openTickets}</strong> open support tickets</p><button class="mg-text" data-tab="orders">Review orders →</button><button class="mg-text" data-tab="notifications">View notifications →</button>`;
  }catch{
   if(!current())return;
   panel.querySelectorAll('[data-staff-followups],[data-store-alerts]').forEach(el=>el.textContent='Could not load updates. Use Refresh summary to retry.');
   if(state.role==='admin'){root.querySelector('.mg-sync').textContent='Could not load store orders. Use Refresh summary to retry.';}
  }
 }
 function center(root,target,state,customer=false){
  let generation=0;const label=(en,ar)=>customer?t(en,ar):en;
  target.innerHTML=`<article class="mg-card staff-notification-center" data-no-translate><div class="mg-section-head"><h2>${label('Notifications','الإشعارات')}</h2><button class="mg-text" data-n-refresh>${label('Refresh','تحديث')}</button></div><p class="mg-muted">${label('Latest 50 updates · last 30 days · Riyadh time','آخر ٥٠ تحديثًا خلال ٣٠ يومًا · بتوقيت الرياض')}</p><p data-n-status role="status"></p><div data-n-list></div><button class="mg-text" data-n-read>${label('Mark all as read on this device','تحديد الكل كمقروء على هذا الجهاز')}</button></article>`;
  const host=target.querySelector('article');let latest=0;
  const current=version=>active(root,state)&&target.contains(host)&&version===generation;
  async function load(){const version=++generation;host.querySelector('[data-n-status]').textContent=label('Loading…','جارٍ التحميل…');
   try{const data=await read(state);if(!current(version))return;if(!Array.isArray(data.notifications)||!Number.isSafeInteger(data.unread)||!Number.isSafeInteger(data.cursor))throw Error();latest=data.cursor;
    host.querySelector('[data-n-status]').textContent=label(data.unread+' unread updates',data.unread+' تحديثات غير مقروءة');
    host.querySelector('[data-n-list]').innerHTML=data.notifications.map(n=>`<article class="staff-notification-item"><span class="mg-pill mg-new">${label(n.kind==='order'?'Order':'Ticket',n.kind==='order'?'طلب':'تذكرة')}</span><strong dir="auto">${esc(n.title)}</strong><span>${esc((customer&&document.documentElement.lang==='ar'?namesAr:names)[n.status]||n.status)}</span><small>${esc(localStamp(n.at,customer))}</small></article>`).join('')||`<p>${label('No updates in the last 30 days.','لا توجد تحديثات خلال آخر ٣٠ يومًا.')}</p>`;
    root.querySelectorAll('[data-badge]').forEach(b=>{b.hidden=data.unread===0;b.textContent=data.unread;});
   }catch{if(current(version)){host.querySelector('[data-n-status]').textContent=label('Could not load notifications. Try Refresh.','تعذّر تحميل الإشعارات. اضغط تحديث.');host.querySelector('[data-n-list]').replaceChildren();}}
  }
  host.querySelector('[data-n-refresh]').onclick=load;
  host.querySelector('[data-n-read]').onclick=()=>{if(latest){try{localStorage.setItem(key(state),String(latest));}catch{host.querySelector('[data-n-status]').textContent=label('Read state could not be saved on this device.','تعذّر حفظ حالة القراءة على هذا الجهاز.');return;}load();}};
  load();
 }
 function monitor(root,state){
  let latestId=null,stopped=false,busy=false;
  const tick=async()=>{
   if(stopped||!active(root,state)){stopped=true;return;}
   if(document.hidden||busy)return;
   busy=true;
   try{const data=await read(state);if(!active(root,state))return;if(!Array.isArray(data.notifications)||!Number.isSafeInteger(data.unread))throw Error();
    root.querySelectorAll('[data-badge]').forEach(b=>{b.textContent=data.unread;b.hidden=data.unread===0;});
    const id=data.notifications[0]?.id||'';
    if(latestId!==null&&id&&id!==latestId&&typeof window.notify==='function')window.notify(state.role==='customer'?t('New account update. Open Notifications.','تحديث جديد لحسابك. افتح الإشعارات.'):'New store update. Open Notifications.');
    latestId=id;
   }catch{if(active(root,state))root.querySelectorAll('[data-badge]').forEach(b=>{b.hidden=true;});}finally{busy=false;}
  };
  const timer=setInterval(()=>{if(!active(root,state)){clearInterval(timer);stopped=true;}else tick();},30000);tick();
 }
 function customer(target,state){
  const host=target.querySelector('.customer-orders');if(!host)return;
  const section=document.createElement('section');section.className='customer-notifications';section.lang=document.documentElement.lang;section.dir=document.documentElement.dir;
  host.after(section);center(section,section,state,true);monitor(section,state);
 }
 window.OrthoStaffOverview={overview,center,monitor,customer};
})();
