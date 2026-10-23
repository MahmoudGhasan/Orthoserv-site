'use strict';
/* OrthoVisualLayer v1
   Applies visual-edits.json: replacement images, element sizes and hidden elements for parts of the
   page that have no data field of their own. Managed by TODAY; edit through Settings > Storefront. */
(()=>{
 const FIXED='header,footer,.topline,.store-navigation,.mega-panel';
 const CSS={width:'width',height:'height',maxWidth:'max-width',fontSize:'font-size',objectFit:'object-fit'};
 const base=new URL('.',document.currentScript?document.currentScript.src:location.href);
 let edits={images:[],styles:[]},frame=0;
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
 const inScope=entry=>!entry.route||entry.route==='*'||entry.route===route();
 function apply(){
  frame=0;
  for(const entry of edits.images||[]){
   if(!inScope(entry))continue;
   const el=find(entry.key);
   if(el&&el.tagName==='IMG'&&el.getAttribute('src')!==entry.src){el.setAttribute('src',entry.src);el.removeAttribute('srcset');}
  }
  for(const entry of edits.styles||[]){
   if(!inScope(entry))continue;
   const el=find(entry.key);if(!el)continue;
   for(const name of Object.keys(CSS))if(entry[name])el.style.setProperty(CSS[name],entry[name],'important');
   if(entry.hidden){
    if(window.__orthoEditing){el.style.setProperty('opacity','.3','important');el.style.setProperty('outline','2px dashed #e11d48','important');}
    else el.style.setProperty('display','none','important');
   }
  }
 }
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(apply);};
 window.OrthoVisual={keyFor,find,route,scopeFor,apply};
 fetch(new URL('visual-edits.json',base),{cache:'no-store'}).then(r=>r.ok?r.json():null).then(data=>{
  if(!data)return;
  edits=data;apply();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('hashchange',schedule);
 }).catch(()=>{});
})();
