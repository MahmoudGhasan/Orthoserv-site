'use strict';
(() => {
 if (document.getElementById('osScrollTop')) return;
 const button=document.createElement('button');
 button.id='osScrollTop';button.className='os-scroll-top';button.type='button';button.hidden=true;
 button.dataset.noTranslate='';
 button.innerHTML='<svg class="os-scroll-ring" viewBox="0 0 52 52" aria-hidden="true"><circle class="os-scroll-track" cx="26" cy="26" r="23"/><circle class="os-scroll-progress" cx="26" cy="26" r="23" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100" transform="rotate(-90 26 26)"/></svg><svg class="os-scroll-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 18V6m-5 5 5-5 5 5"/></svg>';
 document.body.append(button);
 const ring=button.querySelector('.os-scroll-progress');
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 let frame=0,lastOffset=-1,lastLift=-1,lastLabel='';
 function update(){
  frame=0;
  const root=document.scrollingElement||document.documentElement;
  const height=root.clientHeight||innerHeight;
  const range=Math.max(0,root.scrollHeight-height);
  const y=Math.max(0,root.scrollTop);
  const visible=range>120&&y>120;
  if(!visible&&!button.hidden&&document.activeElement===button)document.getElementById('main')?.focus({preventScroll:true});
  button.hidden=!visible;
  const offset=range?Math.max(0,Math.min(100,100-y/range*100)):100;
  if(offset!==lastOffset){ring.setAttribute('stroke-dashoffset',String(offset));lastOffset=offset;}
  const label=document.documentElement.lang==='en'?'Back to top':'العودة إلى أعلى الصفحة';
  if(label!==lastLabel){button.setAttribute('aria-label',label);lastLabel=label;}
  if(!visible)return;
  // Keep the existing chat in its own corner and rise above a product action bar.
  const bar=document.querySelector('.os-p-mobile-action.is-visible');
  let lift=0;
  if(bar){const a=bar.getBoundingClientRect(),b=button.getBoundingClientRect();
   if(a.height&&a.left<b.right&&a.right>b.left){const base=innerWidth<=650?14:20;lift=Math.max(0,height-a.top+12-base);}
  }
  if(lift!==lastLift){button.style.setProperty('--os-scroll-lift',lift+'px');lastLift=lift;}
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(update);}
 button.addEventListener('click',()=>scrollTo({top:0,behavior:motion.matches?'instant':'smooth'}));
 addEventListener('scroll',schedule,{passive:true});
 addEventListener('resize',schedule,{passive:true});
 addEventListener('hashchange',schedule);
 window.visualViewport?.addEventListener('resize',schedule,{passive:true});
 const resize=window.ResizeObserver?new ResizeObserver(schedule):null;
 let observedBar=null;
 const changes=new MutationObserver(()=>{watch();schedule();});
 function watch(){
  const next=document.querySelector('.os-p-mobile-action');
  changes.disconnect();
  changes.observe(document.documentElement,{attributes:true,attributeFilter:['lang','dir']});
  changes.observe(document.body,{childList:true});
  observedBar=next;
  if(observedBar)changes.observe(observedBar,{attributes:true,attributeFilter:['class']});
 }
 const observe=()=>{resize?.observe(document.documentElement);resize?.observe(document.body);watch();schedule();};
 addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;resize?.disconnect();changes.disconnect();});
 addEventListener('pageshow',observe);
 observe();
})();
