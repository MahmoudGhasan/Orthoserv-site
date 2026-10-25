'use strict';
/* OrthoVisualLayer v2.0
   Applies visual-edits.json: replacement images, element sizes, positions (moveX/moveY), hidden elements, fonts and
   colours, uploaded fonts and added widgets for parts of the page that have no data field of their own.
   Managed by TODAY; edit through Settings > Storefront.
   Widgets are <ortho-widget id="w-..."> elements: their own tag name, so they never shift the tag:index keys of the
   template's other elements, and an id, so the keys of everything inside them stay stable.
   Positions: every screen size, kept inside the screen sideways and inside the element's own section vertically.
   Mobile fit: phones only (<=599px), nothing may stick out sideways, so the browser never zooms the page out. */
(()=>{
 const FIXED='header,footer,.topline,.store-navigation,.mega-panel';
 const CSS={width:'width',height:'height',maxWidth:'max-width',fontSize:'font-size',objectFit:'object-fit',
  color:'color',fontFamily:'font-family',fontWeight:'font-weight',fontStyle:'font-style',textAlign:'text-align',
  lineHeight:'line-height',letterSpacing:'letter-spacing',textDecoration:'text-decoration',textTransform:'text-transform',
  backgroundColor:'background-color',opacity:'opacity',borderRadius:'border-radius',padding:'padding'};
 const base=new URL('.',document.currentScript?document.currentScript.src:location.href);
 let edits={images:[],styles:[],widgets:[],fonts:[]},frame=0,lastDevice='';
 // the editor sets window.__orthoDevice to the screen size chosen in its toolbar, so a narrow preview panel still shows the Desktop edits
 const device=()=>window.__orthoDevice||(innerWidth<=599?'mobile':innerWidth<=1023?'tablet':'desktop');
 const isMobile=()=>device()==='mobile';
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

 // ---- uploaded fonts -------------------------------------------------------------------------------------------------
 const safeSrc=s=>typeof s==='string'&&/^[\w\-./]+$/.test(s)&&s[0]!=='/'&&!s.includes('..');
 function loadFonts(){
  const css=(edits.fonts||[]).filter(f=>f&&/^[\w-]{1,40}$/.test(f.family||'')&&safeSrc(f.src))
   .map(f=>"@font-face{font-family:'"+f.family+"';src:url('"+new URL(f.src,base).href+"');font-display:swap}").join('');
  let st=document.querySelector('style[data-ortho-fonts]');
  if(!css){if(st)st.remove();return;}
  if(!st){st=document.createElement('style');st.setAttribute('data-ortho-fonts','');document.head.appendChild(st);}
  if(st.textContent!==css)st.textContent=css;
 }
 // ---- widgets --------------------------------------------------------------------------------------------------------
 const WIDGET_CSS=[
  'ortho-widget{display:block;box-sizing:border-box;max-width:100%;overflow-wrap:anywhere}',
  'ortho-widget.wrap{width:min(1240px,calc(100% - 56px));margin-inline:auto}@media(max-width:650px){ortho-widget.wrap{width:calc(100% - 32px)}}',
  // the inner element inherits everything, so a font or colour set on the widget itself reaches the text
  'ortho-widget>[data-w]:not(.button){font:inherit;color:inherit;letter-spacing:inherit;line-height:inherit;text-align:inherit;text-transform:inherit;text-decoration:inherit;margin:0}',
  'ortho-widget[data-type=heading]{font-size:32px;font-weight:700;line-height:1.3;margin-block:24px 8px}',
  'ortho-widget[data-type=text]{font-size:17px;line-height:1.8;margin-block:8px;white-space:pre-line}',
  'ortho-widget[data-type=button]{margin-block:16px}ortho-widget[data-type=button]>.button{display:inline-flex;flex:none;text-decoration:none}',
  'ortho-widget[data-type=image]{margin-block:16px;object-fit:contain}ortho-widget[data-type=image]>img{display:block;width:100%;height:100%;max-width:100%;object-fit:inherit}',
  'ortho-widget[data-type=divider]{margin-block:24px}ortho-widget[data-type=divider]>hr{border:0;border-top:1px solid currentColor;opacity:.25;margin:0}',
  'ortho-widget[data-type=spacer]{height:40px}'
 ].join('');
 function widgetCss(){
  if(document.querySelector('style[data-ortho-widgets]'))return;
  const st=document.createElement('style');st.setAttribute('data-ortho-widgets','');st.textContent=WIDGET_CSS;document.head.appendChild(st);
 }
 const safeHref=h=>typeof h==='string'&&h!==''&&!/^\s*(javascript|data|vbscript):/i.test(h);
 const langNow=()=>document.documentElement.lang==='en'?'en':'ar';
 // Content is built with textContent / setAttribute only (never innerHTML) and only when something changed, so rendering is idempotent
 function buildWidget(el,w){
  const lang=langNow(),text=w[lang]||w.ar||w.en||'';
  const sig=[w.type,lang,text,w.href||'',w.src||'',w.alt||''].join('\u0001');
  if(el.getAttribute('data-sig')===sig)return;
  el.setAttribute('data-sig',sig);el.setAttribute('data-type',w.type);
  while(el.firstChild)el.removeChild(el.firstChild);
  let inner=null;
  if(w.type==='heading'){inner=document.createElement('div');inner.setAttribute('role','heading');inner.setAttribute('aria-level','2');inner.textContent=text;}
  else if(w.type==='text'){inner=document.createElement('div');inner.textContent=text;}
  else if(w.type==='button'){inner=document.createElement('a');inner.className='button';inner.textContent=text;if(safeHref(w.href))inner.setAttribute('href',w.href);}
  else if(w.type==='image'){if(safeSrc(w.src)){inner=document.createElement('img');inner.setAttribute('src',w.src);inner.setAttribute('alt',w.alt||'');inner.setAttribute('loading','lazy');}}
  else if(w.type==='divider'){inner=document.createElement('hr');}
  if(inner){inner.setAttribute('data-w','');el.appendChild(inner);}
 }
 const grpOf=n=>n.getAttribute&&n.getAttribute('data-grp');
 // Several widgets can hang off one element: they keep the order of the widgets list, and a position that is already
 // right is never touched (moving a node would wake the observer again and loop).
 function place(el,anchor,w,last){
  const where=w.where==='before'||w.where==='end'?w.where:'after',k=w.anchor+'|'+where,prev=last.get(k);
  if(grpOf(el)!==k)el.setAttribute('data-grp',k);
  if(where==='after'){
   const ref=prev||anchor;if(ref.nextElementSibling!==el)ref.after(el);
  }else if(where==='before'){
   if(prev){if(prev.nextElementSibling!==el)prev.after(el);}
   else{
    let ref=anchor.previousElementSibling;while(ref&&grpOf(ref)===k)ref=ref.previousElementSibling;
    const ok=ref?ref.nextElementSibling===el:anchor.parentNode&&anchor.parentNode.firstElementChild===el;
    if(!ok){if(ref)ref.after(el);else anchor.parentNode.prepend(el);}
   }
  }else{
   if(prev){if(prev.nextElementSibling!==el)prev.after(el);}
   else{
    let ok=el.parentElement===anchor;
    for(let n=ok?el.nextElementSibling:null;n;n=n.nextElementSibling)if(grpOf(n)!==k){ok=false;break;}
    if(!ok)anchor.append(el);
   }
  }
  last.set(k,el);
 }
 function renderWidgets(){
  const last=new Map();
  for(const w of edits.widgets||[]){
   if(!w||!/^w-[a-z0-9]{6,12}$/.test(w.id||'')||!['heading','text','image','button','spacer','divider'].includes(w.type))continue;
   let el=document.getElementById(w.id);
   if(w.route&&w.route!=='*'&&w.route!==route()){if(el)el.remove();continue;}
   const anchor=find(w.anchor);
   if(!anchor||anchor===el)continue; // the page is still rendering, or the anchor is gone
   widgetCss();
   if(!el){el=document.createElement('ortho-widget');el.id=w.id;el.setAttribute('data-ortho-widget','');el.setAttribute('data-no-translate','');}
   buildWidget(el,w);
   place(el,anchor,w,last);
   el.classList.toggle('wrap',el.parentElement===document.getElementById('main'));
  }
 }
 const inScope=entry=>(!entry.route||entry.route==='*'||entry.route===route())&&(!entry.device||entry.device===device());
 function apply(){
  frame=0;
  if(lastDevice!==device()){lastDevice=device();undoStyles();}
  loadFonts();renderWidgets(); // widgets first: styles and images below may target elements inside them
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
   }else if(entry.moveX||entry.moveY){setStyle(el,'translate','0px 0px');moved.push([el,num(entry.moveX),num(entry.moveY)]);}
  }
  // phones only: a size set on a wider screen is squeezed until the element ends exactly at the screen edge (as the editor does
  // while dragging), so an edit made at 390px can never push a 360px phone sideways or make the browser zoom the page out
  if(mobile)for(const entry of edits.styles||[]){
   if(!inScope(entry)||entry.hidden||!(entry.width||entry.maxWidth))continue; // colours, fonts and moves never force a width
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
  edits=Object.assign({images:[],styles:[],widgets:[],fonts:[]},data);apply();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang']}); // widget text follows the language switch
  window.addEventListener('hashchange',schedule);window.addEventListener('resize',schedule);
 }).catch(()=>{});
})();
