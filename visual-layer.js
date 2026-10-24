'use strict';
/* OrthoVisualLayer v1.1
   Applies visual-edits.json: replacement images, element sizes, positions (moveX/moveY) and hidden elements for
   parts of the page that have no data field of their own. Managed by TODAY; edit through Settings > Storefront.
   Positions: every screen size, kept inside the screen sideways and inside the element's own section vertically.
   Mobile fit: phones only (<=599px), nothing may stick out sideways, so the browser never zooms the page out. */
(()=>{
 const FIXED='header,footer,.topline,.store-navigation,.mega-panel';
 const CSS={width:'width',height:'height',maxWidth:'max-width',fontSize:'font-size',objectFit:'object-fit'};
 const base=new URL('.',document.currentScript?document.currentScript.src:location.href);
 let edits={images:[],styles:[]},frame=0,lastDevice='';
 const device=()=>innerWidth<=599?'mobile':innerWidth<=1023?'tablet':'desktop';
 const isMobile=()=>innerWidth<=599;
 const HOST='section,header,footer,article,.hero-slide,main'; // an element may be moved around inside its own section only
 const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0;};
 const shiftOf=el=>{const t=getComputedStyle(el).translate;if(!t||t==='none')return[0,0];const p=t.split(/\s+/).map(parseFloat);return[p[0]||0,p[1]||0];};
 // Where a moved element may go: not past the screen edges, not out of its section. Same rule as the editor's drag.
 function clampShift(el,dx,dy){
  const [cx,cy]=shiftOf(el),r=el.getBoundingClientRect(),W=document.documentElement.clientWidth;
  const L=r.left-cx,R=r.right-cx,T=r.top-cy,B=r.bottom-cy;
  let minX=-L,maxX=W-R;if(maxX<minX)maxX=minX;
  let minY=-Infinity,maxY=Infinity;
  const host=el.parentElement&&el.parentElement.closest(HOST);
  if(host){const h=host.getBoundingClientRect();minY=h.top-T;maxY=h.bottom-B;if(maxY<minY){minY=0;maxY=0;}}
  return[Math.min(Math.max(dx,minX),maxX),Math.min(Math.max(dy,minY),maxY)];
 }
 function mobileFit(){
  if(document.querySelector('style[data-ortho-mobile-fit]'))return;
  const st=document.createElement('style');st.setAttribute('data-ortho-mobile-fit','');
  st.textContent='@media (max-width:599px){html,body{max-width:100%;overflow-x:clip}}';
  document.head.appendChild(st);
 }
 const touched=new Map(); // element -> original inline values, so a screen-size change can undo what was applied
 function setStyle(el,name,value){
  let saved=touched.get(el);if(!saved){saved={};touched.set(el,saved);}
  if(!(name in saved))saved[name]=[el.style.getPropertyValue(name),el.style.getPropertyPriority(name)];
  el.style.setProperty(name,value,'important');
 }
 function undoStyles(){
  for(const [el,saved] of touched){if(el.hasAttribute('data-ortho-live'))continue;for(const name of Object.keys(saved)){const [v,p]=saved[name];if(v)el.style.setProperty(name,v,p);else el.style.removeProperty(name);}touched.delete(el);}
 }
 function route(){const h=(location.hash||'#home').split('?')[0].split('/')[0];return h&&h!=='#'?h:'#home';}
 function scopeFor(el){return el.closest(FIXED)?'*':route();}
 function keyFor(el){
  const parts=[];
  for(let n=el;n&&n.nodeType===1&&n!==document.documentElement;n=n.parentElement){
   if(n.id){parts.unshift('#'+n.id);break;}
   let i=1;for(let s=n.previousElementSibling;s;s=s.previousElementSibling)if(s.tagName===n.tagName)i++;
   parts.unshift(n.tagName.toLowerCase()+':'+i);
  }
  return parts.join('>');
 }
 function find(key){
  const segs=String(key).split('>');let cur=document.documentElement;
  for(let i=0;i<segs.length;i++){
   const seg=segs[i];
   if(seg[0]==='#'){cur=document.getElementById(seg.slice(1));}
   else{
    const at=seg.lastIndexOf(':'),tag=seg.slice(0,at).toUpperCase(),want=Number(seg.slice(at+1));
    let next=null,n=0;
    for(const child of cur.children)if(child.tagName===tag&&++n===want){next=child;break;}
    cur=next;
   }
   if(!cur)return null;
  }
  return cur;
 }
 const inScope=entry=>(!entry.route||entry.route==='*'||entry.route===route())&&(!entry.device||entry.device===device());
 function apply(){
  frame=0;
  if(lastDevice!==device()){lastDevice=device();undoStyles();}
  for(const entry of edits.images||[]){
   if(!inScope(entry))continue;
   const el=find(entry.key);
   if(el&&el.tagName==='IMG'&&el.getAttribute('src')!==entry.src){el.setAttribute('src',entry.src);el.removeAttribute('srcset');}
  }
  const mobile=isMobile();
  if(mobile)mobileFit();
  const moved=[];
  for(const entry of edits.styles||[]){
   if(!inScope(entry))continue;
   const el=find(entry.key);if(!el||el.hasAttribute('data-ortho-live'))continue; // being dragged in the editor
   for(const name of Object.keys(CSS))if(entry[name])setStyle(el,CSS[name],entry[name]);
   if(entry.hidden){
    if(window.__orthoEditing){setStyle(el,'opacity','.3');setStyle(el,'outline','2px dashed #e11d48');}
    else setStyle(el,'display','none');
   }else if(entry.moveX||entry.moveY){if(getComputedStyle(el).display==='inline')setStyle(el,'display','inline-block');setStyle(el,'translate','0px 0px');moved.push([el,num(entry.moveX),num(entry.moveY)]);}
  }
  // phones only: a size set on a wider screen is squeezed until the element ends exactly at the screen edge (as the editor does
  // while dragging), so an edit made at 390px can never push a 360px phone sideways or make the browser zoom the page out
  if(mobile)for(const entry of edits.styles||[]){
   if(!inScope(entry)||entry.hidden)continue;
   const el=find(entry.key);if(!el||el.hasAttribute('data-ortho-live'))continue;
   let slope=1,prev=null; // px the overflowing edge moves per px of width: 1 when anchored on one side, .5 when centred
   for(let i=0;i<6;i++){
    const r=el.getBoundingClientRect(),W=document.documentElement.clientWidth,over=Math.max(r.right-W,-r.left,0);
    if(!r.width||over<0.5)break;
    const w=parseFloat(getComputedStyle(el).width)||r.width;
    if(prev&&prev.w-w>0.5&&prev.over>over)slope=Math.min(1,Math.max(.25,(prev.over-over)/(prev.w-w)));
    prev={w,over};
    setStyle(el,'width',Math.max(12,w-over/slope)+'px');
   }
  }
  // positions last: sizes change where an element sits, and the clamp needs the final layout
  for(const [el,dx,dy] of moved){
   const [x,y]=clampShift(el,dx,dy);
   setStyle(el,'translate',x+'px '+y+'px');
  }
 }
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(apply);};
 window.OrthoVisual={keyFor,find,route,scopeFor,apply};
 fetch(new URL('visual-edits.json',base),{cache:'no-store'}).then(r=>r.ok?r.json():null).then(data=>{
  if(!data)return;
  edits=data;apply();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('hashchange',schedule);window.addEventListener('resize',schedule);
 }).catch(()=>{});
})();
