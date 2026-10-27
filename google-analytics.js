'use strict';
/* Public GTM IDs only. No report credentials, form contents or account events. */
(()=>{
 const site=new URL('.',document.currentScript.src);
 const views=new Set(['home','catalog','product','offers','business','brand','partners']);
 const validId=v=>typeof v==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,179}$/.test(v);
 let started=false,config,current=null,lastPage='',lastTitle='',referrer='';
 const route=()=>{const [view='home',id='']=(location.hash.slice(1)||'home').split('/');return {view,id};};
 const safePage=r=>site.href+'#'+r.view+(validId(r.id)?'/'+r.id:'');
 function push(name,params={}){
  window.dataLayer.push({event:'ortho_analytics',ga_event_name:name,page_location:lastPage,page_referrer:referrer,
   page_title:lastTitle,product_id:'',visible_seconds:0,inquiry_method:'',...params});
 }
 function flush(){
  if(!current)return;
  const now=performance.now();
  const seconds=document.visibilityState==='visible'?Math.max(0,Math.min(60,(now-current.tick)/1000,1800-current.total)):0;
  current.tick=now;
  if(seconds<.1)return;
  current.total+=seconds;
  push('ortho_product_dwell',{product_id:current.id,visible_seconds:Math.round(seconds*1000)/1000});
 }
 function changed(){
  const r=route();if(current&&r.view==='product'&&r.id===current.id)return;
  flush();current=null;
  const allowed=views.has(r.view)&&(r.view!=='product'||validId(r.id));
  window['ga-disable-'+config.measurementId]=!allowed;
  if(!allowed){lastPage='';return;}
  const page=safePage(r);if(page===lastPage)return;
  referrer=lastPage||referrer;lastPage=page;lastTitle='ORTHOSERV / '+r.view;
  push('page_view');
  if(r.view==='product'){
   current={id:r.id,tick:performance.now(),total:0};
   push('ortho_product_view',{product_id:r.id});
  }
 }
 function boot(){
  if(started)return;
  const c=window.OrthoCMS?.settings?.googleAnalytics;
  if(!c?.enabled||!/^GTM-[A-Z0-9]+$/.test(c.containerId||'')||!/^G-[A-Z0-9]+$/.test(c.measurementId||''))return;
  if(location.protocol!=='https:'||location.origin!==site.origin||location.hostname==='localhost'||/^127\./.test(location.hostname))return;
  if(navigator.doNotTrack==='1'||navigator.globalPrivacyControl===true)return;
  if(!views.has(route().view))return;
  if(window.dataLayer&&!Array.isArray(window.dataLayer))return;
  started=true;config=c;window.dataLayer=window.dataLayer||[];
  try{if(document.referrer){const r=new URL(document.referrer);if(r.protocol==='https:')referrer=r.origin+'/';}}catch{}
  // Advertising permissions remain denied; this integration sends analytics only.
  function gtag(){window.dataLayer.push(arguments);}
  gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'granted'});
  window.dataLayer.push({page_location:safePage(route()),page_referrer:referrer,page_title:'ORTHOSERV / '+route().view});
  window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});
  const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtm.js?id='+c.containerId;script.referrerPolicy='origin';document.head.appendChild(script);
  changed();window.addEventListener('hashchange',changed);setInterval(flush,15000);
  document.addEventListener('visibilitychange',()=>{
   if(!current)return;
   if(document.visibilityState==='hidden'){
    const now=performance.now();const seconds=Math.max(0,Math.min(60,(now-current.tick)/1000,1800-current.total));current.tick=now;
    if(seconds>=.1){current.total+=seconds;push('ortho_product_dwell',{product_id:current.id,visible_seconds:Math.round(seconds*1000)/1000});}
   }else current.tick=performance.now();
  });
  window.addEventListener('pagehide',flush);
  document.addEventListener('click',e=>{
   if(!lastPage)return;const button=e.target.closest('[data-quote],[data-demo-request]');if(!button)return;
   const id=button.dataset.quote||button.dataset.demoRequest;
   if(validId(id))push('ortho_inquiry_click',{product_id:id,inquiry_method:button.dataset.quote?'quote':'demo'});
  });
 }
 document.addEventListener('DOMContentLoaded',boot);window.addEventListener('orthocms:ready',boot);
 // An initial account/login route must not permanently suppress public-page tracking.
 window.addEventListener('hashchange',boot);boot();
})();
