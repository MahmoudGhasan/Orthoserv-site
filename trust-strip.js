'use strict';
(() => {
 const initialized=new WeakSet();
 window.initTrustStripCountUp=()=>{
  const strip=document.querySelector('.trust-strip');
  if(strip&&initialized.has(strip))return;
  window.trustStripCleanup?.();
  if(!strip)return;
  initialized.add(strip);
  const groups=[...strip.querySelectorAll('dd')].map(dd=>[...dd.querySelectorAll('[data-count-to]')]).filter(nodes=>nodes.length);
  const frames=new Set(),timers=new Set(),reduce=matchMedia('(prefers-reduced-motion: reduce)');
  let observer=null,started=false,finished=false,disposed=false;
  const targets=groups.flat().map(node=>({node,target:Number(node.dataset.countTo)}));
  const restore=()=>targets.forEach(({node,target})=>{node.textContent=String(target);});
  function stop(){
   observer?.disconnect();observer=null;
   frames.forEach(cancelAnimationFrame);frames.clear();
   timers.forEach(clearTimeout);timers.clear();
  }
  function finish(){finished=true;stop();restore();}
  function animate(nodes){
   if(disposed||finished)return;
   const start=performance.now();
   const tick=now=>{
    if(disposed||finished)return;
    const progress=Math.min(1,Math.max(0,(now-start)/1400)),eased=1-Math.pow(1-progress,3);
    for(const node of nodes){const target=Number(node.dataset.countTo);node.textContent=String(progress===1?target:Math.round(target*eased));}
    if(progress<1)schedule(tick);
   };
   schedule(tick);
  }
  function schedule(callback){const id=requestAnimationFrame(now=>{frames.delete(id);callback(now);});frames.add(id);}
  function start(){
   if(started||finished||disposed)return;
   started=true;observer?.unobserve(strip);
   if(reduce.matches){finish();return;}
   groups.forEach((nodes,index)=>{
    if(!index){nodes.forEach(node=>{node.textContent='0';});animate(nodes);return;}
    const timer=setTimeout(()=>{timers.delete(timer);if(disposed||finished)return;nodes.forEach(node=>{node.textContent='0';});animate(nodes);},index*120);
    timers.add(timer);
   });
  }
  const onLanguage=()=>{if(!finished)finish();};
  const language=new MutationObserver(onLanguage);
  language.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  const onMotion=()=>{if(reduce.matches)finish();};reduce.addEventListener('change',onMotion);
  window.trustStripCleanup=()=>{
   disposed=true;finish();language.disconnect();reduce.removeEventListener('change',onMotion);window.trustStripCleanup=null;
  };
  if(reduce.matches){finish();return;}
  if(!('IntersectionObserver' in window)){finish();return;}
  observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting&&entry.intersectionRatio>=.4))start();},{threshold:.4});
  observer.observe(strip);
  const rect=strip.getBoundingClientRect(),height=Math.min(rect.bottom,innerHeight)-Math.max(rect.top,0),width=Math.min(rect.right,innerWidth)-Math.max(rect.left,0);
  if(rect.width>0&&rect.height>0&&Math.max(0,height)*Math.max(0,width)/(rect.width*rect.height)>=.4)start();
 };
 if(document.querySelector('.trust-strip'))window.initTrustStripCountUp();
})();
