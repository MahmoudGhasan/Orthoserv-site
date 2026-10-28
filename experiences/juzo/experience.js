"use strict";
(()=>{
const $=s=>document.querySelector(s),reduced=matchMedia('(prefers-reduced-motion:reduce)');let options=null,products=[],scene='legs',selected='soft-knee',color='',flight=0,selectionRun=0;
const meta={legs:{title:'جوارب تناسب يومك.',image:'assets/products/juzo-0.jpg',alt:'جوارب Juzo Soft / Juzo Soft stockings',caption:'صورة Juzo الأصلية · اللون المعروض لا يتبدّل بتغيير العيّنة'},arms:{title:'تفاصيل تناسب ذراعك.',image:'assets/products/juzo-3.jpg',alt:'كمّ Juzo Soft للذراع / Juzo Soft sleeve',caption:'صورة Juzo الرسمية للكمّ أثناء الارتداء'},fit:{title:'المقاس يبدأ بالقياس.',image:'assets/imported/size-stockings.jpg',alt:'دليل قياس جوارب Juzo Soft / Official stocking size chart',caption:'دليل Juzo Soft الرسمي · افتح الصورة للاطّلاع على الأرقام بوضوح'}};
// Optional per-product colorways. The legacy branch below remains unchanged.
const colorwayChoices=new Map(),colorwayImages=new WeakMap();
const hasColorways=p=>Array.isArray(p?.colorways)&&p.colorways.length>0;
const cwEscape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function colorwayEntry(p,prefix){
 const key=prefix+'/'+p.id;
 return p.colorways.find(entry=>entry.color===colorwayChoices.get(key))||p.colorways.find(entry=>entry.default===true);
}
function colorwaySwatches(prefix,p){
 const current=colorwayEntry(p,prefix),palette=options.colors.find(c=>c.id===current?.color);
 if(current)colorwayChoices.set(prefix+'/'+p.id,current.color);
 return `<div class="juzo-cw-controls" id="${prefix}Colorways" data-cw-product="${cwEscape(p.id)}" data-cw-prefix="${prefix}"><div class="color-heading">ألوان هذا المنتج <strong id="${prefix}ColorName">${cwEscape(palette?.name||'اختَر لونًا')}</strong></div><div class="color-swatches" role="group" aria-label="ألوان هذا المنتج">${p.colorways.map(entry=>{const c=options.colors.find(c=>c.id===entry.color);return c?`<button type="button" class="juzo-cw-choice" data-juzo-colorway="${cwEscape(c.id)}" style="--swatch:${cwEscape(c.hex)}" aria-label="${cwEscape(c.name)}" title="${cwEscape(c.name)}" aria-pressed="${current?.color===c.id}"><span></span></button>`:''}).join('')}</div><p class="color-note">اختر لونًا لعرض صورته الخاصة بهذا المنتج.</p><input type="hidden" id="${prefix}DesiredColor" value="${cwEscape(palette?.name||'')}"><input type="hidden" id="${prefix}DesiredColorId" value="${cwEscape(current?.color||'')}"></div>`;
}
function resetColorwayImage(image){
 const state=image&&colorwayImages.get(image);if(!state)return;
 state.request++;state.message?.remove();image.onerror=null;
 for(const [name,value] of Object.entries(state.original))value===null?image.removeAttribute(name):image.setAttribute(name,value);
 image.classList.remove('juzo-cw-hidden');colorwayImages.delete(image);
}
function showColorwayImage(image,entry,caption,withMessage=true){
 if(!image)return;
 let state=colorwayImages.get(image);
 if(!state){state={original:Object.fromEntries(['src','alt','width','height','style','hidden'].map(name=>[name,image.getAttribute(name)])),request:0,message:image.nextElementSibling?.classList.contains('juzo-cw-image-status')?image.nextElementSibling:null};colorwayImages.set(image,state);}
 const request=++state.request;
 image.onerror=null;image.classList.add('juzo-cw-hidden');image.removeAttribute('src');image.hidden=true;
 const status=text=>{
  if(!withMessage)return;
  if(!state.message?.isConnected){state.message=document.createElement('p');state.message.className='juzo-cw-image-status';state.message.setAttribute('role','status');image.after(state.message);}
  state.message.textContent=text;
 };
 let source=entry?.image||'',decoded='';try{decoded=decodeURIComponent(source)}catch{}
 if(!decoded||/[\u0000-\u001f\u007f\\:?#]/u.test(decoded)||decoded.startsWith('/')||decoded.split('/').some(part=>part==='..'||part==='.')||decoded!==decoded.trim()){
  status('الصورة غير متاحة لهذا اللون');return;
 }
 status('جار تحميل صورة اللون…');
 const preload=new Image();
 const current=()=>image.isConnected&&colorwayImages.get(image)===state&&state.request===request;
 const unavailable=()=>{if(!current())return;image.classList.add('juzo-cw-hidden');image.hidden=true;image.removeAttribute('src');status('الصورة غير متاحة لهذا اللون');};
 preload.onload=()=>{
  if(!current())return;
  state.message?.remove();image.src=source;image.alt=caption;
  image.width=entry.width;image.height=entry.height;image.style.maxWidth=`min(100%,${entry.width}px)`;
  image.hidden=false;image.classList.remove('juzo-cw-hidden');image.onerror=unavailable;
 };
 preload.onerror=unavailable;preload.src=source;
}
function applyColorway(p,prefix){
 const entry=colorwayEntry(p,prefix),palette=options.colors.find(c=>c.id===entry?.color);
 const name=palette?.name||'',alt=typeof entry?.alt==='object'?(entry.alt.ar||entry.alt.en||p.title):p.title;
 const holder=document.getElementById(prefix+'Colorways');if(!holder)return;
 holder.querySelectorAll('[data-juzo-colorway]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.juzoColorway===entry?.color)));
 document.getElementById(prefix+'ColorName').textContent=name;
 document.getElementById(prefix+'DesiredColor').value=name;
 document.getElementById(prefix+'DesiredColorId').value=entry?.color||'';
 if(prefix==='detail'){
  showColorwayImage($('#productPage .detail-photo>img'),entry,alt);
  const caption=$('#productPage .detail-photo>span');if(caption)caption.textContent=entry?.image?name:'';
 }else{
  showColorwayImage($('#selectionImage'),entry,alt);
  showColorwayImage($('#heroChoiceImage'),entry,alt,false);
  $('#selectionCaption').textContent=entry?.image?name:'';
 }
}
function swatches(prefix,p){if(hasColorways(p))return colorwaySwatches(prefix,p);return `<div class="color-heading">ألوان مجموعة Juzo Soft <strong id="${prefix}ColorName">${color||'اختَر لونًا'}</strong></div><div class="color-swatches" role="group" aria-label="ألوان مجموعة Juzo Soft">${options.colors.map(c=>`<button data-juzo-color="${c.name}" style="--swatch:${c.hex}" aria-label="${c.name}" title="${c.name}" aria-pressed="${color===c.name}"><span></span></button>`).join('')}</div><p class="color-note">عيّنات الألوان مستوردة من Juzo. اللون لا يعيد تلوين الصورة؛ تأكيد توافره للقطعة المختارة يتم مع الفريق.</p><input type="hidden" id="${prefix}DesiredColor" value="${color}">`;}
function choices(){
 const m=meta[scene],p=products.find(p=>p.id===selected);
 $('#selectionOptions').innerHTML=`<p class="eyebrow" lang="en">${scene==='fit'?'OFFICIAL SIZE GUIDES':'JUZO SOFT / YOUR OPTIONS'}</p><h2 id="selectionTitle">${m.title}</h2>`+(scene==='fit'?`<p>اختَر دليل القطعة، وراجعه مع مختص مدرَّب. لا يُحدَّد مقاس طبي تلقائيًا هنا.</p><div class="model-options"><button data-chart="legs" class="active">قياس الجوارب</button><button data-chart="arms">قياس الأكمام</button></div><a class="shop-cta" id="openChart" href="assets/imported/size-stockings.jpg" target="_blank" rel="noopener">افتح الدليل بحجمه الأصلي ↗</a><div class="measure-facts"><p><strong>المجموعة:</strong> Juzo Soft</p><p><strong>خيارات الشركة:</strong> مقاسات قياسية وحسب القياس.</p><p><strong>الخطوة التالية:</strong> تأكيد القياسات ودرجة الضغط مع المختص.</p></div>`:`<p>${scene==='arms'?'كمّ للذراع من مجموعة Soft، مع استعراض ألوان المجموعة.':'حدّد طول القطعة، ثم أضف اللون الذي ترغب في السؤال عنه.'}</p><div class="model-options">${products.filter(p=>p.category===scene).map(p=>`<button data-choice-model="${p.id}" class="${p.id===selected?'active':''}" aria-pressed="${p.id===selected}">${p.title}</button>`).join('')}</div>${scene==='legs'?'<p class="model-extra">تذكر Juzo أيضًا طول نصف الفخذ ضمن خيارات المجموعة؛ لا توجد له صورة أو قطعة مستقلة في هذا الموقع.</p>':''}${swatches('selection',p)}<a class="shop-cta" id="selectionProductLink" href="#product/${p.id}">تفاصيل ${p.title} ↗</a><button class="selection-enquire" data-add="${p.id}">أضف لقائمة الاستفسار +</button><p class="local-availability">خيارات الشركة للعرض؛ التوافر في السعودية يُؤكّد مع أورثوسيرف.</p>`);
 document.querySelectorAll('[data-scene]').forEach(b=>{b.classList.toggle('active',b.dataset.scene===scene);b.setAttribute('aria-pressed',String(b.dataset.scene===scene));});
}
function updateImage(src,alt){const i=$('#selectionImage');i.src=src;i.alt=alt;i.style.maxWidth=scene==='fit'?'min(100%,1200px)':'min(100%,367px)';$('#selectionCaption').textContent=meta[scene].caption;}
async function select(next){if(!options)return;$('#selectionImage').style.opacity='1';const sectionBox=$('#selectionSection').getBoundingClientRect(),alreadyHere=!$('#selectionSection').hidden&&sectionBox.top<220&&sectionBox.bottom>300;cancelAnimationFrame(flight);document.querySelector('.flying-product')?.remove();const run=++selectionRun;scene=next;selected=next==='arms'?'soft-sleeve':'soft-knee';color='';document.dispatchEvent(new CustomEvent('juzo:select'));document.body.dataset.sceneChoice=scene;$('#legScene').classList.add('has-scene');const hero=$('#heroChoiceImage');resetColorwayImage($('#selectionImage'));resetColorwayImage(hero);hero.src=meta[scene].image;hero.alt=meta[scene].alt;hero.hidden=false;hero.style.maxWidth='367px';if(scene==='fit')hero.style.maxWidth='100%';$('#selectionSection').hidden=false;choices();updateImage(meta[scene].image,meta[scene].alt);
 if(scene!=='fit'&&hasColorways(products.find(p=>p.id===selected))){applyColorway(products.find(p=>p.id===selected),'selection');if(!alreadyHere)$('#selectionSection').scrollIntoView();return;}
 if(alreadyHere){$('#selectionImage').animate([{opacity:.1},{opacity:1}],{duration:350});return;}
 if(reduced.matches){$('#selectionSection').scrollIntoView();return;}
 await hero.decode().catch(()=>{});if(run!==selectionRun)return;
 hero.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:360,fill:'none'});
 await new Promise(resolve=>setTimeout(resolve,420));if(run!==selectionRun)return;
 const from=hero.getBoundingClientRect(),target=$('#selectionImage'),clone=hero.cloneNode();clone.removeAttribute('id');clone.className='flying-product';clone.hidden=false;clone.style.maxWidth='none';document.body.append(clone);target.style.opacity='0';
 const start=performance.now(),initialScroll=scrollY,destination=$('#selectionSection').getBoundingClientRect().top+scrollY-document.querySelector('header').offsetHeight;
 function step(now){if(run!==selectionRun){clone.remove();target.style.opacity='1';return;}const t=Math.min(1,(now-start)/1150),u=t*t*(3-2*t);window.scrollTo(0,initialScroll+(destination-initialScroll)*u);const to=target.getBoundingClientRect();clone.style.left=(from.left+(to.left-from.left)*u)+'px';clone.style.top=(from.top+(to.top-from.top)*u)+'px';clone.style.width=(from.width+(to.width-from.width)*u)+'px';clone.style.height=(from.height+(to.height-from.height)*u)+'px';if(t<1)flight=requestAnimationFrame(step);else{target.style.opacity='1';clone.remove();history.replaceState(null,'','#selectionSection');}}
 flight=requestAnimationFrame(step);
}
function detailColors(e){if(!options)return;const p=e.detail;if(!p||(p.name!=='Juzo Soft'&&!hasColorways(p)))return;$('#detailColors')?.remove();const holder=document.createElement('div');holder.id='detailColors';holder.innerHTML=swatches('detail',p);$('.size-select')?.before(holder);if(hasColorways(p))applyColorway(p,'detail');}
document.addEventListener('juzo:product',detailColors);
document.addEventListener('error',e=>{if(e.target.matches?.('.juzo-cw-default-image'))showColorwayImage(e.target,null,'');},true);
function cancelFlight(){cancelAnimationFrame(flight);selectionRun++;document.querySelector('.flying-product')?.remove();$('#selectionImage').style.opacity='1';}
addEventListener('wheel',cancelFlight,{passive:true});addEventListener('touchstart',cancelFlight,{passive:true});
document.addEventListener('click',e=>{const s=e.target.closest('[data-scene]');if(s){e.preventDefault();select(s.dataset.scene);return;}const m=e.target.closest('[data-choice-model]');if(m){selected=m.dataset.choiceModel;const p=products.find(p=>p.id===selected);resetColorwayImage($('#selectionImage'));resetColorwayImage($('#heroChoiceImage'));updateImage(p.image,p.title+' / '+p.alt);choices();if(hasColorways(p))applyColorway(p,'selection');return;}const variant=e.target.closest('[data-juzo-colorway]');if(variant){const holder=variant.closest('.juzo-cw-controls'),p=products.find(p=>p.id===holder?.dataset.cwProduct),prefix=holder?.dataset.cwPrefix;if(p&&hasColorways(p)&&p.colorways.some(entry=>entry.color===variant.dataset.juzoColorway)){colorwayChoices.set(prefix+'/'+p.id,variant.dataset.juzoColorway);applyColorway(p,prefix);}return;}const c=e.target.closest('[data-juzo-color]');if(c){color=c.dataset.juzoColor;document.querySelectorAll('[data-juzo-color]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.juzoColor===color)));document.querySelectorAll('[id$="ColorName"]').forEach(e=>e.textContent=color);document.querySelectorAll('[id$="DesiredColor"]').forEach(i=>i.value=color);return;}const chart=e.target.closest('[data-chart]');if(chart){const d=options.charts[chart.dataset.chart];updateImage(d.file,'دليل قياس Juzo Soft / Official size chart');$('#openChart').href=d.file;document.querySelectorAll('[data-chart]').forEach(b=>b.classList.toggle('active',b===chart));}});
Promise.all([fetch('juzo-options.json').then(r=>r.json()),fetch('products.json').then(r=>r.json())]).then(([o,p])=>{options=o;products=p.filter(p=>p.visible!==false);const id=location.hash.startsWith('#product/')?location.hash.slice(9):'';if(id)detailColors({detail:products.find(p=>p.id===id)});}).catch(()=>{document.querySelectorAll('[data-scene]').forEach(b=>b.disabled=true);});
})();
