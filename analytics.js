'use strict';
/* Anonymous, opt-in analytics. No report token, form text, account data or full URLs. */
(()=>{
 const base=new URL('.',document.currentScript.src);
 const allowedViews=new Set(['home','catalog','product','offers','business','brand','partners']);
 let config=null,visitor='',session='',visitSent=false,current=null,started=false,sourceHost='(direct)';
 const uuid=()=>crypto.randomUUID();
 const route=()=>{const [view='home',id='']=(location.hash.slice(1)||'home').split('/');return {view,id};};
 const device=()=>innerWidth<=599?'mobile':innerWidth<=1023?'tablet':'desktop';
 const validProduct=id=>typeof id==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,179}$/.test(id);
 function persistentId(store,key){try{const old=store.getItem(key);if(old&&/^[0-9a-f-]{36}$/i.test(old))return old;const id=uuid();store.setItem(key,id);return id;}catch{return uuid();}}
 function send(kind,id,productId='',seconds=0){
  if(!config||!visitor||!session)return;
  const body=JSON.stringify({id,visitor,session,kind,device:device(),path:location.pathname,sourceHost,...(productId?{productId}:{}),...(kind==='view'?{seconds:Math.round(seconds*10)/10}:{})});
  fetch(config.endpoint,{method:'POST',body,headers:{'Content-Type':'text/plain'},credentials:'omit',keepalive:true,referrerPolicy:'no-referrer'}).catch(()=>{});
 }
 function accountTime(){if(current&&document.visibilityState==='visible'){const now=performance.now();current.seconds=Math.min(1800,current.seconds+Math.max(0,Math.min(60,(now-current.tick)/1000)));current.tick=now;}}
 function flush(){if(!current)return;accountTime();send('view',current.id,current.productId,current.seconds);}
 function changedRoute(){
  const next=route();if(current&&next.view==='product'&&next.id===current.productId)return;
  flush();current=null;
  if(!allowedViews.has(next.view))return;
  if(!visitSent){send('visit',uuid());visitSent=true;}
  if(next.view==='product'&&validProduct(next.id)){current={id:uuid(),productId:next.id,seconds:0,tick:performance.now()};send('view',current.id,current.productId,0);}
 }
 function start(){
  if(started)return;const value=window.OrthoCMS?.settings?.analytics;
  if(!value?.enabled||typeof value.endpoint!=='string')return;
  if(navigator.doNotTrack==='1'||navigator.globalPrivacyControl===true)return;
  let endpoint;try{endpoint=new URL(value.endpoint);}catch{return;}
  if(location.protocol!=='https:'||location.hostname==='localhost'||/^127\./.test(location.hostname))return;
  if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||endpoint.search||endpoint.hash||endpoint.pathname!=='/collect')return;
  config={endpoint:endpoint.href};visitor=persistentId(localStorage,'ortho-analytics-visitor-v1');session=persistentId(sessionStorage,'ortho-analytics-session-v1');started=true;
  try{
   const saved=sessionStorage.getItem('ortho-analytics-source-v1');
   if(saved&&saved.length<=253&&/^(?:\(direct\)|\(other\)|[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?)$/.test(saved))sourceHost=saved;
   else{
    if(document.referrer){const ref=new URL(document.referrer);if(['http:','https:'].includes(ref.protocol)&&ref.hostname!==location.hostname)sourceHost=/^[a-z0-9.-]+$/.test(ref.hostname)&&!/^\d[\d.]*$/.test(ref.hostname)?ref.hostname:'(other)';}
    sessionStorage.setItem('ortho-analytics-source-v1',sourceHost);
   }
  }catch{}
  changedRoute();window.addEventListener('hashchange',changedRoute);
  setInterval(flush,15000);
  document.addEventListener('visibilitychange',()=>{if(!current)return;if(document.visibilityState==='hidden'){const now=performance.now();current.seconds=Math.min(1800,current.seconds+Math.max(0,Math.min(60,(now-current.tick)/1000)));send('view',current.id,current.productId,current.seconds);}else current.tick=performance.now();});
  window.addEventListener('pagehide',flush);
  document.addEventListener('click',event=>{
   if(!allowedViews.has(route().view))return;
   const button=event.target.closest('[data-quote],[data-demo-request]');if(!button)return;
   const productId=button.dataset.quote||button.dataset.demoRequest;if(validProduct(productId))send('inquiry',uuid(),productId);
  });
 }
 document.addEventListener('DOMContentLoaded',start);window.addEventListener('orthocms:ready',start);start();
})();
