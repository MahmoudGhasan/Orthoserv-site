'use strict';
/* One Juzo experience inside the store shell. Product JSON remains authoritative. */
(() => {
 const BASE='experiences/juzo/';
 const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const en=()=>window.OrthoLang==='en';
 const t=(ar,english)=>en()?english:ar;
 const text=(ar,english)=>`<span data-no-translate>${e(t(ar,english))}</span>`;
 let palette=null,loading=null,ctx=null,host=null,current=null;
 const selections=new Map();
 const path=file=>{const s=String(file||'');return s&&!s.startsWith('/')&&!s.includes('..')&&!/^[a-z]+:/i.test(s)?BASE+s:'';};
 const legacy=p=>ctx.experienceProducts.find(x=>'juzo-'+x.id===p.id);
 const source=p=>legacy(p)||p;
 const all=()=>ctx.products.filter(p=>p.brand==='Juzo');
 const taxonomy=()=>window.OrthoCMS.settings.juzoTaxonomy||[];
 const groupTitle=id=>{const label=taxonomy().find(x=>x.id===id)?.label||'';return en()&&label?(window.OrthoTranslate?.(label)||label):label;};
 const link=id=>'#brand/juzo/'+encodeURIComponent(id);
 const family=p=>(legacy(p)?.category==='arms'||/sleeve|arm/.test(p.id))?'arms':'legs';
 function colors(p){
  const s=source(p),ways=s.colorways;
  if(Array.isArray(ways)&&ways.length)return ways.map(w=>({...palette.colors.find(c=>c.id===w.color),...w,id:w.color}));
  const custom=p.juzoOptions?.find(g=>/color|colour|اللون/i.test(g.labelAr||g.labelEn||''));
  if(custom)return custom.values.map(name=>palette.colors.find(c=>c.name.toLowerCase()===String(name).toLowerCase())||{id:String(name),name:String(name)});
  return legacy(p)?palette.colors:[];
 }
 function state(p){
  if(!selections.has(p.id)){
   const s=source(p),choices=colors(p),first=choices.find(c=>c.default===true)||choices[0];
   selections.set(p.id,{colorId:first?.id||'',model:s.category||'',fit:'help',fields:{}});
  }
  return selections.get(p.id);
 }
 function photo(p,st=state(p)){
  const s=source(p);
  if(Array.isArray(s.colorways)&&s.colorways.length){
   const choice=s.colorways.find(c=>c.color===st.colorId);
   return choice?.image?{file:path(choice.image),alt:choice.alt?.[en()?'en':'ar']||p.name}:null;
  }
  const f=p.files?.find(x=>x.role==='product')||p.files?.[0];
  return legacy(p)?{file:path(s.image),alt:s.alt||s.title||p.name}:f?{file:f.file,alt:f.alt?.[en()?'en':'ar']||p.name}:null;
 }
 function picture(p,st,lazy=true){
  const f=photo(p,st);
  const byColour=Array.isArray(source(p).colorways)&&source(p).colorways.length>0;
  return f?.file?`<img src="${e(f.file)}" alt="${e(f.alt)}" ${lazy?'loading="lazy"':''} decoding="async">`:
   `<p class="jz-unavailable" role="status">${byColour?text('الصورة غير متاحة لهذا اللون','Image unavailable for this colour'):text('الصورة غير متاحة','Image unavailable')}</p>`;
 }
 function heading(p){return en()?(window.OrthoJuzoNames?.[p.id]||p.nameEn||legacy(p)?.name||p.name):(p.titleAr||legacy(p)?.title||p.name);}
 function swatches(p,st,compact=false){
  const list=colors(p),shown=compact?list.slice(0,5):list;
  return `<div class="jz-swatches ${compact?'jz-swatches-small':''}" ${compact?'aria-hidden="true"':`role="group" aria-label="${e(t('الألوان المتاحة','Available colours'))}"`}>${shown.map(c=>{
   const hex=/^#[a-f0-9]{6}$/i.test(c.hex||'')?c.hex:'';
   return compact?`<span class="jz-swatch" ${hex?`style="--jz-swatch:${hex}"`:''}></span>`:
    `<button type="button" class="jz-swatch ${hex?'':'jz-name-swatch'}" data-jz-color="${e(c.id)}" ${hex?`style="--jz-swatch:${hex}"`:''} aria-pressed="${st.colorId===c.id}" aria-label="${e(c.name||c.id)}" title="${e(c.name||c.id)}">${hex?'':e(c.name||c.id)}</button>`;
  }).join('')}</div>`;
 }
 function productCard(p){
  const st=state(p);return `<article class="jz-card"><button class="jz-heart" data-save="${e(p.id)}" aria-label="${e(t('المفضلة','Wishlist'))}" aria-pressed="${ctx.saved.includes(p.id)}">${ctx.saved.includes(p.id)?'♥':'♡'}</button><a class="jz-card-photo" href="#product/${e(p.id)}">${picture(p,st)}</a><div class="jz-card-copy"><span class="jz-overline" data-no-translate>JUZO</span><a href="#product/${e(p.id)}"><h3 data-no-translate>${e(heading(p))}</h3></a><p data-no-translate>${e(legacy(p)?.name||p.model||groupTitle(p.group)||p.name)}</p>${swatches(p,st,true)}<a class="jz-card-link" href="#product/${e(p.id)}">${text('استعرض المنتج','View product')} <span aria-hidden="true">↗</span></a></div></article>`;
 }
 function crumb(end=''){
  return `<div class="jz-breadcrumb"><a href="#home">${text('الرئيسية','Home')}</a><span>/</span><a href="#brand/juzo" data-no-translate>Juzo</a>${end?`<span>/</span><span data-no-translate>${e(end)}</span>`:''}</div>`;
 }
 function nav(){
  // Keep the existing full taxonomy, pressure classes and garment pictograms.
  const html=ctx.navigation('compression');
  const holder=document.createElement('div');holder.innerHTML=html;
  holder.querySelectorAll('[data-juzo-nav-group]').forEach(button=>{
   const id=button.dataset.juzoNavGroup,params=new URLSearchParams();
   if(button.dataset.juzoNavPiece)params.set('piece',button.dataset.juzoNavPiece);
   if(button.dataset.juzoNavPressure)params.set('pressure',button.dataset.juzoNavPressure);
   const a=document.createElement('a');
   for(const attr of button.attributes)if(!attr.name.startsWith('data-juzo-nav')&&!['type','aria-pressed','aria-current'].includes(attr.name))a.setAttribute(attr.name,attr.value);
   const qs=params.toString();a.href=link(id)+(qs?'?'+qs:'');a.innerHTML=button.innerHTML;button.replaceWith(a);
  });
  return holder.innerHTML;
 }
 function bindNavigation(){
  const menus=[...host.querySelectorAll('.juzo-category-menu')];
  menus.forEach(menu=>{
   menu.addEventListener('toggle',()=>{if(menu.open)menus.forEach(other=>{if(other!==menu)other.open=false;});});
   menu.addEventListener('keydown',event=>{if(event.key==='Escape'){menu.open=false;menu.querySelector('summary').focus();}});
  });
 }
 function renderBrand(){
  const tail=(location.hash.split('/').slice(2).join('/')||'').split('?'),group=decodeURIComponent(tail[0]),params=new URLSearchParams(tail[1]||'');
  const isLanding=!group,known=group==='products'||taxonomy().some(x=>x.id===group);
  let items=all().filter(p=>isLanding||group==='products'||ctx.matchesGroup(p,group));
  if(params.get('piece'))items=items.filter(p=>(p.pieceTypes||[]).includes(params.get('piece')));
  if(params.get('pressure'))items=items.filter(p=>(p.compressionClasses||[]).includes(params.get('pressure')));
  if(!known&&!isLanding)items=[];
  const featured=all().filter(p=>legacy(p));
  document.title=t('جوزو | أورثو سيرف','Juzo | OrthoServ');
  host.innerHTML=`<div class="jz-store wrap">${crumb(isLanding?'':group==='products'?t('كل المنتجات','All products'):groupTitle(group))}${isLanding?`<section class="jz-hero"><div class="jz-hero-copy"><img class="jz-logo" src="${BASE}assets/juzo-logo.svg" width="147" height="42" alt="Juzo"><p class="jz-overline" data-no-translate>ORTHOSERV × JUZO</p><h1>${text('جوزو، راحة تواكب حركتك','Juzo. Comfort that moves with you.')}</h1><p>${text('جوارب وأكمام وملابس ضغط طبية. اكتشف القطعة المناسبة لك، وأكّد المقاس والتوفر مع فريقنا.','Medical stockings, sleeves and compression garments. Explore your options and confirm fit and availability with our team.')}</p><a class="button" href="${link('products')}">${text('استعرض المنتجات','Explore products')} <span aria-hidden="true">←</span></a><a class="jz-quiet-link" href="#brand/juzo/fit-guide">${text('تحتاج مساعدة في المقاس؟','Need help finding your size?')}</a></div><div class="jz-hero-photo"><img src="${BASE}assets/imported/editorial-2.jpg" width="367" height="547" alt="${e(t('جوارب جوزو الطبية أثناء الارتداء','Juzo medical stockings being worn'))}"></div></section>`:''}</div><div class="jz-navigation">${nav()}</div><div class="jz-store wrap">${isLanding?`<section class="jz-discover"><div class="jz-section-head"><div><span class="jz-overline" data-no-translate>FIND YOUR FIT</span><h2>${text('اختيارات تناسب احتياجك','Find your compression essentials')}</h2></div><a href="${link('products')}">${text('كل منتجات جوزو','All Juzo products')} ←</a></div><div class="jz-category-cards">${[['vein-care','assets/products/juzo/juzo-1.jpg','الجوارب الطبية','Medical stockings'],['lymphedema-lipedema__arm-sleeves-gloves','assets/products/juzo/juzo-3.jpg','الأكمام والقفازات','Sleeves & gloves'],['post-surgery','experiences/juzo/assets/imported/editorial-3.jpg','ملابس الضغط','Compression garments']].map(([id,img,ar,english])=>`<a class="jz-category-card" href="${link(taxonomy().some(x=>x.id===id)?id:'products')}"><img src="${img}" alt="" loading="lazy"><h3>${text(ar,english)} <span aria-hidden="true">←</span></h3></a>`).join('')}</div></section>`:`<header class="jz-catalog-head"><span class="jz-overline" data-no-translate>ORTHOSERV / JUZO</span><h1 data-no-translate>${e(group==='products'?t('منتجات جوزو','Juzo products'):groupTitle(group)||t('القسم غير موجود','Category not found'))}</h1><p>${text('تصفّح القطع حسب احتياجك، وأكّد المقاس والتوفر مع فريقنا.','Explore the range and confirm sizing and availability with our team.')}</p></header>`}<section id="jzProducts"><div class="jz-section-head"><h2>${text(isLanding?'منتجات مختارة من جوزو':'تصفح المنتجات',isLanding?'Explore the Juzo collection':'Browse products')}</h2><span class="jz-count" data-no-translate>${items.length} ${e(t('منتج','products'))}</span></div>${!isLanding?`<div class="jz-filter-bar"><input id="jzSearch" type="search" placeholder="${e(t('ابحث في منتجات جوزو…','Search Juzo products…'))}" aria-label="${e(t('بحث المنتجات','Search products'))}"><select id="jzSort" aria-label="${e(t('ترتيب المنتجات','Sort products'))}"><option value="featured">${e(t('الترتيب المميز','Featured'))}</option><option value="name">${e(t('الاسم','Name'))}</option></select></div>`:''}<div class="jz-product-grid" id="jzGrid">${(isLanding?featured.slice(0,6):items).map(productCard).join('')}</div><p id="jzEmpty" class="jz-empty" ${items.length?'hidden':''}>${text('لا توجد منتجات مطابقة. جرّب قسمًا آخر.','No matching products. Try another category.')}</p>${isLanding?`<a class="button ghost jz-all" href="${link('products')}">${text('عرض جميع منتجات جوزو','View all Juzo products')} ←</a>`:''}</section><section class="jz-fit-help"><div><span class="jz-overline" data-no-translate>THE RIGHT FIT</span><h2>${text('اختيار المقاس يبدأ بالقياس','The right fit starts with measuring')}</h2><p>${text('راجع دليل المنتج وفئة الضغط مع المختص قبل تأكيد الطلب.','Check the product sizing guide and compression class with a specialist before confirming your request.')}</p></div><a class="button ghost" href="#brand/juzo/fit-guide">${text('دليل المقاسات','Sizing guide')} ←</a></section></div>`;
  bindNavigation();
  const search=host.querySelector('#jzSearch'),sort=host.querySelector('#jzSort');
  const filter=()=>{const needle=search.value.trim().toLowerCase();let shown=items.filter(p=>[p.name,p.nameEn,p.titleAr,p.model,legacy(p)?.name,legacy(p)?.title,legacy(p)?.alt].join(' ').toLowerCase().includes(needle));if(sort.value==='name')shown.sort((a,b)=>heading(a).localeCompare(heading(b),en()?'en':'ar'));host.querySelector('#jzGrid').innerHTML=shown.map(productCard).join('');host.querySelector('#jzEmpty').hidden=shown.length>0;host.querySelector('.jz-count').textContent=shown.length+' '+t('منتج','products');};
  search?.addEventListener('input',filter);sort?.addEventListener('change',filter);
 }
 function selectionText(p,st){
  const color=colors(p).find(c=>c.id===st.colorId);
  return [color?`${t('اللون','Colour')}: ${color.name||color.id}`:'',...Object.entries(st.fields).map(([k,v])=>(en()?(window.OrthoTranslate?.(k)||k):k)+': '+v),
   st.fit==='known'?t('لدي مقاس موصوف مسبقًا','I have a prescribed size'):st.fit==='help'?t('أحتاج مساعدة في المقاس','I need sizing assistance'):''].filter(Boolean).join(' · ');
 }
 function description(p){const s=source(p),original=s.description||p.description||'';if(!en())return original;const translated=window.OrthoTranslate?.(original)||original;return /[\u0600-\u06ff]/.test(translated)?'Explore this Juzo garment and confirm the model, sizing and availability with the OrthoServ team before ordering.':translated;}
 function renderProduct(p){
  const s=source(p),st=state(p),choices=colors(p),color=choices.find(c=>c.id===st.colorId),legacyProduct=legacy(p);
  current={p,st};ctx.selectProduct(p);ctx.setSelection(selectionText(p,st));
  const optionGroups=(p.juzoOptions||[]).filter(g=>!/color|colour|اللون/i.test(g.labelAr||g.labelEn||''));
  optionGroups.forEach(g=>{if(st.fields[g.labelAr]===undefined)st.fields[g.labelAr]=g.values[0]||'';});
  const models=legacyProduct?all().filter(x=>legacy(x)?.name===s.name):[];
  document.title=heading(p)+' | Juzo · OrthoServ';
  host.innerHTML=`<section class="jz-store wrap jz-product">${crumb(heading(p))}<div class="jz-detail-grid"><div class="jz-gallery"><div id="jzPhoto" class="jz-product-photo">${picture(p,st,false)}</div><p class="jz-photo-note">${text(Array.isArray(s.colorways)&&s.colorways.length?'الصورة مرتبطة باللون المختار.':'صورة تعريفية للمنتج؛ اختيار عيّنة اللون لا يعيد تلوين الصورة.',Array.isArray(s.colorways)&&s.colorways.length?'The image is linked to the selected colour.':'Product reference image; selecting a colour does not recolour this photograph.')}</p>${!legacyProduct&&p.files?.length>1?`<div class="jz-thumbnails">${p.files.map((f,i)=>`<button data-jz-photo="${i}" aria-label="${e(t('صورة','Photo'))} ${i+1}"><img src="${e(f.file)}" alt="" loading="lazy"></button>`).join('')}</div>`:''}</div><div class="jz-product-copy"><a href="#brand/juzo"><img class="jz-logo" src="${BASE}assets/juzo-logo.svg" width="147" height="42" alt="Juzo"></a><span class="jz-overline" data-no-translate>${e(legacyProduct?.name||p.model||'JUZO COMPRESSION')}</span><h1 data-no-translate>${e(heading(p))}</h1><p class="jz-description" data-no-translate>${e(description(p))}</p><div class="jz-availability">${text('السعر والتوفر يُؤكّدان مع الفريق','Confirm pricing and availability with our team')}</div>${choices.length?`<section class="jz-options"><h2>${text('اللون','Colour')}: <span id="jzColorName" data-no-translate>${e(color?.name||color?.id||'')}</span></h2>${swatches(p,st)}</section>`:''}${models.length>1?`<section class="jz-options"><h2>${text('نوع القطعة','Garment model')}</h2><div class="jz-models">${models.map(m=>`<a class="jz-choice ${m.id===p.id?'is-selected':''}" href="#product/${e(m.id)}" ${m.id===p.id?'aria-current="page"':''} data-no-translate>${e(en()?window.OrthoJuzoNames?.[m.id]||legacy(m)?.alt||m.name:legacy(m)?.title||m.titleAr||m.name)}</a>`).join('')}</div></section>`:''}${optionGroups.length?`<div class="jz-select-grid">${optionGroups.map((g,i)=>`<label>${text(g.labelAr,g.labelEn||window.OrthoTranslate?.(g.labelAr)||g.labelAr)}<select data-jz-option="${i}">${g.values.map(v=>`<option value="${e(v)}" ${st.fields[g.labelAr]===v?'selected':''} data-no-translate>${e(v)}</option>`).join('')}</select></label>`).join('')}</div>`:legacyProduct?`<label class="jz-fit-label">${text('اختيار المقاس','Size selection')}<select class="size-select" id="jzFit"><option value="help" ${st.fit==='help'?'selected':''}>${e(t('أحتاج مساعدة في المقاس','I need help choosing my size'))}</option><option value="known" ${st.fit==='known'?'selected':''}>${e(t('لدي مقاس موصوف مسبقًا','I have a prescribed size'))}</option></select></label>`:''}<button class="jz-size-link" id="jzGuideButton">${text('دليل المقاسات','Sizing guide')} ↗</button><div class="jz-detail-actions"><button class="button" id="jzAddInquiry">${text(p.method==='buy'?'أضف إلى السلة':'أضف إلى طلب عرض السعر',p.method==='buy'?'Add to bag':'Add to quote request')} +</button><button class="jz-heart" data-save="${e(p.id)}" aria-label="${e(t('المفضلة','Wishlist'))}" aria-pressed="${ctx.saved.includes(p.id)}">${ctx.saved.includes(p.id)?'♥':'♡'}</button></div><p class="jz-support-copy">${text('أكد الموديل والمقاس وفئة الضغط مع المختص.','Confirm the model, size and compression class with a specialist.')}</p><details class="jz-accordion" open><summary>${text('تفاصيل المنتج','Product details')}</summary><p data-no-translate>${e(description(p))}</p></details><details class="jz-accordion" id="jzSizeGuide"><summary>${text('المقاسات والعناية','Sizing & care')}</summary>${window.OrthoJuzoMeasurements?.render(p,heading(p))||''}${legacyProduct?`<a class="jz-chart" href="${path(palette.charts[family(p)]?.file)}" target="_blank" rel="noopener"><img src="${path(palette.charts[family(p)]?.file)}" alt="${e(t('جدول المقاسات الرسمي من جوزو','Official Juzo size chart'))}" loading="lazy"></a>`:ctx.sizeGuide(p)}<p>${text('اتّبع تعليمات الاستخدام والعناية الخاصة بالموديل.','Follow the use and care instructions for your particular garment.')}</p><a href="https://www.juzo.com/en/products/usage-and-care-instructions" target="_blank" rel="noopener">${text('تعليمات جوزو الرسمية','Official Juzo care instructions')} ↗</a></details></div></div><section class="jz-related"><div class="jz-section-head"><h2>${text('اكتشف أيضًا من جوزو','More from Juzo')}</h2><a href="${link('products')}">${text('كل المنتجات','All products')} ←</a></div><div class="jz-product-grid">${all().filter(x=>x.id!==p.id&&legacy(x)).slice(0,3).map(productCard).join('')}</div></section></section>`;
  window.OrthoJuzoMeasurements?.bind(host);
  host.querySelectorAll('[data-jz-color]').forEach(button=>button.addEventListener('click',()=>{
   st.colorId=button.dataset.jzColor;
   // Update only the image and colour label. Never replace the model/size controls.
   host.querySelector('#jzPhoto').innerHTML=picture(p,st,false);
   host.querySelector('#jzColorName').textContent=choices.find(c=>c.id===st.colorId)?.name||st.colorId;
   host.querySelectorAll('[data-jz-color]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
   ctx.setSelection(selectionText(p,st));
  }));
  host.querySelectorAll('[data-jz-option]').forEach(select=>select.addEventListener('change',()=>{st.fields[optionGroups[Number(select.dataset.jzOption)].labelAr]=select.value;ctx.setSelection(selectionText(p,st));}));
  host.querySelector('#jzFit')?.addEventListener('change',event=>{st.fit=event.target.value;ctx.setSelection(selectionText(p,st));});
  host.querySelectorAll('[data-jz-photo]').forEach(button=>button.addEventListener('click',()=>{const f=p.files[Number(button.dataset.jzPhoto)];host.querySelector('#jzPhoto').innerHTML=`<img src="${e(f.file)}" alt="${e(f.alt?.[en()?'en':'ar']||p.name)}">`;}));
  host.querySelector('#jzGuideButton').onclick=()=>{const guide=host.querySelector('#jzSizeGuide');guide.open=true;guide.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'center'});guide.querySelector('summary').focus();};
  host.querySelector('#jzAddInquiry').onclick=()=>{
   const picked=choices.find(c=>c.id===st.colorId),row={id:p.id,qty:1,colorId:st.colorId,color:picked?.name||'',fit:st.fit,model:st.model,fields:{...st.fields},option:selectionText(p,st),kind:'juzo-enquiry'};
   if(p.method==='buy'){ctx.setSelection(row.option);ctx.addPurchase(p.id);return;}
   ctx.addEnquiry(row);ctx.toast(t('أُضيف إلى السلة ضمن طلبات عرض السعر','Added to your bag as a quote request'));
  };
 }
 function renderFit(){
  host.innerHTML=`<section class="jz-store wrap">${crumb(t('دليل المقاسات','Sizing guide'))}<header class="jz-catalog-head"><h1>${text('المقاس المناسب يبدأ هنا','Find your fit')}</h1><p>${text('اختر المنتج أولًا وراجع جدول مقاسه مع المختص. القياسات تختلف باختلاف الموديل.','Choose your garment first and confirm its size chart with a specialist. Measurements vary by model.')}</p></header><div class="jz-fit-charts">${Object.entries(palette.charts).map(([key,chart])=>`<article><h2>${text(key==='arms'?'أكمام الذراع':'الجوارب الطبية',key==='arms'?'Arm sleeves':'Medical stockings')}</h2><a href="${path(chart.file)}" target="_blank" rel="noopener"><img src="${path(chart.file)}" alt="${e(t('دليل القياس من جوزو','Juzo measurement guide'))}"></a></article>`).join('')}</div><a class="button" href="${link('products')}">${text('اختر منتجك','Choose your garment')} ←</a></section>`;
 }
 function render(){
  if(!ctx||!palette)return;
  const [view,arg,section]=(location.hash.slice(1)||'home').split('/');
  if(view==='brand'&&arg==='juzo')section==='fit-guide'?renderFit():renderBrand();
  else if(view==='product'){const p=ctx.products.find(p=>p.id===arg&&p.brand==='Juzo');if(p)renderProduct(p);}
  window.OrthoCMS?.apply();fixLinks();ctx.afterRender?.();
 }
 function canonical(url){
  try{const u=new URL(url,location.href);if(u.origin!==location.origin||! /\/experiences\/juzo\/(?:index\.html)?$/.test(u.pathname))return null;
   const hash=u.hash.slice(1);if(hash.startsWith('product/'))return '#product/juzo-'+encodeURIComponent(decodeURIComponent(hash.slice(8)));
   return hash==='fit-guide'?'#brand/juzo/fit-guide':hash==='catalog'?'#brand/juzo/products':'#brand/juzo';
  }catch{return null;}
 }
 function fixLinks(){document.querySelectorAll('a[href]').forEach(a=>{const target=canonical(a.getAttribute('href'));if(target){a.href=target;a.removeAttribute('target');}});}
 const api=window.OrthoJuzoStore={
  isEnquiry:x=>x?.kind==='juzo-enquiry',
  key:x=>JSON.stringify([x.id,x.colorId||x.color||'',x.option||'',x.fit||'']),
  route(main,view,arg,context){
   const wanted=view==='brand'&&arg==='juzo'||view==='product'&&context.products.some(p=>p.id===arg&&p.brand==='Juzo');
   document.body.classList.toggle('jz-active',wanted);
   if(!wanted){current=null;return false;}
   ctx=context;host=main;
   if(palette)render();else{
    host.innerHTML=`<div class="wrap jz-loading" role="status">${text('جارٍ تحميل جوزو…','Loading Juzo…')}</div>`;
    if(!loading)loading=fetch(BASE+'juzo-options.json').then(r=>{if(!r.ok)throw Error('options');return r.json();}).then(data=>{palette=data;}).catch(()=>{loading=null;throw Error('options');});
    const hash=location.hash;loading.then(()=>{if(location.hash===hash)render();}).catch(()=>{if(location.hash===hash)host.innerHTML=`<div class="wrap jz-empty"><p>${text('تعذّر تحميل خيارات جوزو. حدّث الصفحة للمحاولة مجددًا.','Could not load Juzo options. Refresh to retry.')}</p></div>`;});
   }
   return true;
  },
  fixLinks,
  migrate(products,cart){
   try{
    if(localStorage.getItem('ortho-juzo-unified-migration-v1'))return cart;
    const old=JSON.parse(localStorage.getItem('orthoserv-juzo-enquiry')||'[]');if(!Array.isArray(old))return cart;
    const next=cart.slice();
    for(const row of old){const p=products.find(p=>p.id==='juzo-'+row.id&&p.brand==='Juzo');if(!p)continue;
     const item={id:p.id,kind:'juzo-enquiry',qty:Number.isInteger(row.qty)?Math.max(1,Math.min(99,row.qty)):1,colorId:row.colorId||'',color:row.color||'',fit:row.fit||'help',option:row.color||'',legacyKey:JSON.stringify([row.id,row.colorId||row.color||''])};
     if(!next.some(x=>x.legacyKey===item.legacyKey))next.push(item);
    }
    try{localStorage.setItem('ortho-store-cart-v3',JSON.stringify(next));localStorage.setItem('ortho-juzo-unified-migration-v1','1');}catch{/* old key stays; the flag is only set after a successful save */}
    return next;
   }catch{return cart;}
  },
  renderCart(cart,products,helpers){
   const rows=cart.filter(api.isEnquiry);if(!rows.length)return false;
   const ordinary=cart.filter(x=>!api.isEnquiry(x));
   const line=(x,i)=>{const p=products.find(p=>p.id===x.id);if(!p)return '';return `<div class="cart-item">${helpers.media(p)}<div><a href="#product/${e(p.id)}" data-close-cart><h3 data-no-translate>${e(p.name)}</h3></a><p data-no-translate>${e(x.option||x.color||'')}</p><div class="cart-item-bottom"><div class="qty"><button data-cart-qty="${i}" data-step="-1" aria-label="${e(t('تقليل الكمية','Decrease quantity'))}">−</button><span>${x.qty}</span><button data-cart-qty="${i}" data-step="1" aria-label="${e(t('زيادة الكمية','Increase quantity'))}">+</button></div><strong>${api.isEnquiry(x)?text('بانتظار عرض السعر','Quote pending'):helpers.money(helpers.lineTotal(p,x,ordinary))}</strong><button class="remove" data-remove="${i}">${text('حذف','Remove')}</button></div></div></div>`;};
   const body=document.querySelector('#cartBody');
   body.innerHTML=`<div class="jz-bag-note">${text('سلة واحدة لاختياراتك. طلبات عرض السعر منفصلة عن إجمالي المنتجات المسعرة.','One bag for your selections. Quote requests are separate from the priced-product total.')}</div>${cart.map(line).join('')}${ordinary.length?`<div class="cart-total"><strong>${text('إجمالي المنتجات المسعرة','Priced products subtotal')}</strong><strong>${helpers.money(ordinary.reduce((n,x)=>n+helpers.lineTotal(products.find(p=>p.id===x.id),x,ordinary),0))}</strong></div><button class="button wide" id="checkoutBtn">${text('مراجعة المنتجات المسعرة','Review priced products')}</button>`:''}<button class="button ghost wide" id="jzReviewRequest">${text('مراجعة طلب عرض السعر','Review quote request')}</button>`;
   document.querySelector('#checkoutBtn')?.addEventListener('click',helpers.checkout);
   document.querySelector('#jzReviewRequest').onclick=()=>{
    document.querySelector('#cartDialog').close();
    const content=rows.map(x=>{const p=products.find(p=>p.id===x.id);return `${p?.name||x.id} × ${x.qty}\n${x.option||x.color||''}`;}).join('\n\n');
    helpers.openForm(t('طلب عرض سعر جوزو','Juzo quote request'),`<p>${text('راجع اختياراتك قبل إرسالها لفريق أورثو سيرف.','Review your selections before contacting the OrthoServ team.')}</p><pre class="jz-request-text" dir="auto">${e(content)}</pre><div id="jzRequestActions"></div><p class="small">${text('لم يُنشأ طلب شراء ولم تُنفّذ أي دفعة.','No purchase order or payment has been created.')}</p>`);
    const actions=document.querySelector('#jzRequestActions'),wa=String(window.OrthoCMS.settings.contact?.whatsapp||'').replace(/\D/g,'');
    if(wa){const a=document.createElement('a');a.className='button';a.target='_blank';a.rel='noopener';a.href='https://wa.me/'+wa+'?text='+encodeURIComponent(t('مرحبًا، أريد عرض سعر لهذه الاختيارات:\n','Hello, please quote these selections:\n')+content);a.textContent=t('إرسال عبر واتساب','Send via WhatsApp');actions.append(a);}
    else{const a=document.createElement('a');a.className='button';a.href='#contact';a.textContent=t('تواصل مع الفريق','Contact our team');a.onclick=()=>document.querySelector('#formDialog').close();actions.append(a);}
   };return true;
  }
 };
 // CMS can restore old configured hrefs; normalize them after each normal apply.
 const apply=window.OrthoCMS.apply.bind(window.OrthoCMS);
 window.OrthoCMS.apply=function(...args){const result=apply(...args);fixLinks();return result;};
 document.addEventListener('click',event=>{const a=event.target.closest('a[href]');if(!a)return;const hash=canonical(a.href);if(hash){event.preventDefault();location.hash=hash;}});
 document.addEventListener('click',event=>{if(event.target.closest('#languageButton')&&document.body.classList.contains('jz-active'))queueMicrotask(render);});
})();
