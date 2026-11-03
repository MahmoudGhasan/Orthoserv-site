'use strict';
(() => {
 const selections=new Map();let disposers=[],latest=null;
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const english=()=>document.documentElement.lang==='en';
 const tr=(ar,en)=>english()?en:ar;
 const pair=(ar,en)=>({ar,en});
 const text=v=>typeof v==='string'?v:v?.[english()?'en':'ar']||v?.ar||'';
 const label=v=>`<span class="oc-ar">${escape(v?.ar||v)}</span><span class="oc-en">${escape(v?.en||v)}</span>`;
 const settings=()=>window.OrthoCMS?.settings.catalogueNavigation||{};
 const handles=(cat,brand='')=>!brand&&['rehab','gym','consumables','medical'].includes(cat);
 const isCurrent=()=>{const [view,cat]=(location.hash.slice(1)||'home').split('/');return view==='catalog'&&handles(cat);};
 function infer(p,cat=p.category){
  const n=[p.name,p.nameEn,p.titleAr,p.model].join(' ').toLowerCase(),g=p.group;
  if(cat==='medical')return {section:['catheters','guidewires','stents','needles','dilators'].includes(g)?g:'other',type:''};
  if(cat==='consumables')return {section:g==='wound-care'?'wound-care':g==='needles'?'needles':/gel|electrode|جل توصيل|أقطاب/.test(n)?'gel-electrodes':'clinical-tools',type:''};
  if(cat==='gym')return {section:/pilates|reformer|بيلاتس/.test(n)?'pilates':/bike|cycle|treadmill|ergometer|دراجة|مشاية/.test(n)?'cardio':g==='accessories'?'accessories':'strength',type:''};
  if(cat!=='rehab')return {section:'other',type:''};
  if(g==='assessment')return {section:'assessment',type:/inbody/.test(n)?'body-composition':/humac|microfet|myoton/.test(n)?'strength-assessment':/balance/.test(n)?'balance-assessment':/quark|cpet/.test(n)?'cardiopulmonary':'diagnostic-ultrasound'};
  if(/treatment table|clinical stool|clinical steps/.test(n))return {section:'tables',type:/stool|steps/.test(n)?'clinic-furniture':'treatment-tables'};
  if(g==='shockwave')return {section:'devices',type:'shockwave'};
  if(/laser|lightforce/.test(n))return {section:'devices',type:'laser'};
  if(/tecar|tcare|tr.?therapy|indiba|winback/.test(n))return {section:'devices',type:'radiofrequency'};
  if(/normatec|lymphastim|compression boots/.test(n))return {section:'devices',type:'compression-therapy'};
  if(g==='thermal'||/game.?ready|grpro|med4|hydrocollator|cryo/.test(n))return {section:'devices',type:'thermal'};
  if(/triton.*dts|traction/.test(n))return {section:'devices',type:'traction'};
  if(/hypervolt|fixx/.test(n))return {section:'devices',type:'massage'};
  if(g==='electro')return {section:'devices',type:'electro-magnetic'};
  if(g==='accessories')return {section:'accessories',type:''};
  if(/artromot|cpm|spectra/.test(n))return {section:'movement',type:'passive-motion'};
  if(/amadeo|diego/.test(n))return {section:'movement',type:'robotic-rehab'};
  if(/rehamoto|5100p|motomed|motolife|ergometer|exercise cycle|recumbent bike/.test(n))return {section:'movement',type:'exercise-cycles'};
  if(/work table|occupational|ergo |laces|buckles|clips and buttons|spiral|activity board|pronation.*supination|rolling wheel/.test(n))return {section:'movement',type:'occupational'};
  if(/balance|balancing|sensory|rompa/.test(n))return {section:'movement',type:'balance-sensory'};
  if(/stand|struzzo|walker|walking|parallel bars|stair|treadmill|alulift/.test(n))return {section:'movement',type:'walking-standing'};
  if(g==='mobility')return {section:'movement',type:'exercise-tools'};
  return {section:'other',type:''};
 }
 function classify(p,cat=p.category){const a=settings().assignments?.[p.id];return a&&p.category===cat?a:infer(p,cat);}
 function cleanup(){disposers.splice(0).forEach(fn=>fn());}
 function reset(cat){selections.delete(cat);}
 function hero(cat,definition,state){
  const slides=definition.slides||[];if(!slides.length)return `<div class="oc-heading"><h1>${label(definition.title)}</h1><p>${label(definition.subtitle)}</p></div>`;
  state.slide=Math.min(state.slide||0,slides.length-1);
  return `<section class="oc-hero" aria-label="${escape(text(definition.title))}"><div class="oc-slides">${slides.map((s,i)=>`<img class="oc-slide ${i===state.slide?'active':''}" src="${escape(s.file)}" width="2400" height="448" alt="${escape(text(s.alt))}" ${i?'loading="lazy"':'fetchpriority="high"'} aria-hidden="${i!==state.slide}">`).join('')}</div><div class="oc-shade"></div><div class="oc-hero-copy"><span class="oc-eyebrow">ORTHOSERV COLLECTION</span><h1>${label(definition.title)}</h1><p>${label(definition.subtitle)}</p><button type="button" class="oc-browse">${label(pair('استعرض المنتجات','Explore products'))}<span aria-hidden="true">←</span></button></div><div class="oc-carousel-controls"><div class="oc-dots" role="group" aria-label="${tr('مشاهد القسم','Category scenes')}">${slides.map((s,i)=>`<button type="button" data-oc-slide="${i}" aria-label="${tr('عرض المشهد ','Show scene ')+(i+1)}" aria-pressed="${i===state.slide}"><span></span></button>`).join('')}</div><button type="button" class="oc-motion" aria-pressed="${!!state.paused}"></button></div></section>`;
 }
 function startHero(root,state){
  const hero=root.querySelector('.oc-hero');if(!hero)return;const slides=[...hero.querySelectorAll('.oc-slide')],dots=[...hero.querySelectorAll('[data-oc-slide]')],motion=hero.querySelector('.oc-motion');
  let visible=true,timer,disposed=false;const reduce=matchMedia('(prefers-reduced-motion:reduce)');if(state.paused==null)state.paused=reduce.matches;
  function updateMotion(){motion.innerHTML=label(state.paused?pair('تشغيل','Play'):pair('إيقاف','Pause'));motion.setAttribute('aria-pressed',String(state.paused));motion.setAttribute('aria-label',state.paused?tr('تشغيل البانر','Play banner'):tr('إيقاف البانر','Pause banner'));}
  async function show(index){const image=slides[index];image.loading='eager';if(!image.complete)await image.decode().catch(()=>{});if(disposed||!image.naturalWidth)return;state.slide=index;slides.forEach((s,i)=>{s.classList.toggle('active',i===index);s.setAttribute('aria-hidden',String(i!==index));});dots.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));}
  const tick=()=>{if(!state.paused&&visible&&!document.hidden&&!hero.contains(document.activeElement)&&!(matchMedia('(hover:hover)').matches&&hero.matches(':hover')))show((state.slide+1)%slides.length);};
  function schedule(){clearInterval(timer);timer=setInterval(tick,6000);}
  dots.forEach((b,i)=>b.onclick=()=>{show(i);schedule();});motion.onclick=()=>{state.paused=!state.paused;updateMotion();schedule();};updateMotion();schedule();
  const observe=new IntersectionObserver(es=>visible=es[0].isIntersecting);observe.observe(hero);
  const reduced=()=>{if(reduce.matches){state.paused=true;updateMotion();}};reduce.addEventListener('change',reduced);
  disposers.push(()=>{disposed=true;clearInterval(timer);observe.disconnect();reduce.removeEventListener('change',reduced);});
 }
 function render(main,cat,ctx){
  cleanup();latest={main,cat,ctx};const definition=settings().categories?.[cat];if(!definition)return false;
  const state=selections.get(cat)||{section:'',type:'',slide:0};selections.set(cat,state);
  const all=ctx.products.filter(p=>p.category===cat||cat==='rehab'&&p.id==='spirit');
  const sections=definition.sections.filter(s=>all.some(p=>classify(p,cat).section===s.id));
  if(state.section&&!sections.some(s=>s.id===state.section)){state.section='';state.type='';}
  const needle=ctx.query.trim().toLocaleLowerCase(),base=all.filter(p=>(!needle||[p.name,p.nameEn,p.titleAr,p.brand,p.model].join(' ').toLocaleLowerCase().includes(needle))&&(!ctx.brand||p.brand===ctx.brand)&&(!ctx.method||p.method===ctx.method));
  let list=base.filter(p=>!state.section||classify(p,cat).section===state.section).filter(p=>!state.type||classify(p,cat).type===state.type);
  if(ctx.sort==='price-asc')list.sort((a,b)=>(a.price??Infinity)-(b.price??Infinity));
  if(ctx.sort==='price-desc')list.sort((a,b)=>(b.price??-1)-(a.price??-1));
  if(ctx.sort==='name')list.sort((a,b)=>text(english()?a.nameEn||a.name:a.titleAr||a.name).localeCompare(text(english()?b.nameEn||b.name:b.titleAr||b.name)));
  const pages=Math.ceil(list.length/12),page=Math.max(1,Math.min(ctx.page,pages||1)),active=sections.find(s=>s.id===state.section),types=(active?.types||[]).filter(t=>all.some(p=>classify(p,cat).section===state.section&&classify(p,cat).type===t.id));
  const tab=(id,title,count)=>`<button type="button" id="oc-tab-${id||'all'}" role="tab" data-oc-section="${id}" aria-controls="ocProducts" aria-selected="${state.section===id}">${label(title)}<span class="oc-count">${count}</span></button>`;
  const select=(id,caption,options,value)=>`<label class="oc-filter"><span>${label(caption)}</span><select id="${id}">${options.map(([v,t])=>`<option value="${escape(v)}" ${v===value?'selected':''}>${escape(text(t))}</option>`).join('')}</select></label>`;
  main.innerHTML=`<section class="wrap oc-catalogue" data-no-translate data-category="${cat}"><div class="oc-breadcrumb"><a href="#home">${label(pair('الرئيسية','Home'))}</a><span>/</span><span>${label(definition.title)}</span></div>${hero(cat,definition,state)}<div class="oc-tabs" role="tablist" aria-label="${tr('أقسام المنتجات','Product categories')}">${tab('',pair('الكل','All'),base.length)}${sections.map(s=>tab(s.id,s.title,base.filter(p=>classify(p,cat).section===s.id).length)).join('')}</div>${types.length>1?`<div class="oc-types" role="group" aria-label="${tr('نوع المنتج','Product type')}"><button type="button" data-oc-type="" aria-pressed="${!state.type}">${label(pair('الكل','All'))}</button>${types.map(t=>`<button type="button" data-oc-type="${t.id}" aria-pressed="${state.type===t.id}">${label(t.title)}</button>`).join('')}</div>`:''}<div class="oc-toolbar">${select('ocBrand',pair('العلامة التجارية','Brand'),[['',pair('كل العلامات','All brands')],...[...new Set(all.map(p=>p.brand))].sort().map(b=>[b,b])],ctx.brand)}${select('ocMethod',pair('طريقة الطلب','Order method'),[['',pair('كل الطرق','All methods')],['buy',pair('شراء مباشر','Buy online')],['quote',pair('طلب عرض سعر','Request a quote')]],ctx.method)}${select('ocSort',pair('الترتيب','Sort'),[['featured',pair('المختارات أولًا','Featured first')],['name',pair('الاسم','Name')],['price-asc',pair('السعر: الأقل أولًا','Price: low to high')],['price-desc',pair('السعر: الأعلى أولًا','Price: high to low')]],ctx.sort)}<button type="button" class="oc-clear">${label(pair('مسح الفلاتر','Clear filters'))}</button><span class="oc-result" role="status" aria-live="polite">${list.length} ${label(pair('منتج','products'))}</span></div><div id="ocProducts" role="tabpanel" aria-labelledby="oc-tab-${state.section||'all'}">${list.length?`<div class="product-grid">${list.slice((page-1)*12,page*12).map(ctx.card).join('')}</div>`:`<div class="empty"><h2>${label(pair('لا توجد منتجات مطابقة','No matching products'))}</h2><p>${label(pair('جرّب اختيارًا آخر أو امسح الفلاتر.','Try a different selection or clear the filters.'))}</p><button type="button" class="button oc-clear">${label(pair('مسح الفلاتر','Clear filters'))}</button></div>`}</div>${pages>1?`<div class="pagination" aria-label="${tr('صفحات المنتجات','Product pages')}">${Array.from({length:pages},(_,i)=>`<button type="button" data-oc-page="${i+1}" aria-current="${i+1===page?'page':'false'}" class="${i+1===page?'active':''}">${i+1}</button>`).join('')}</div>`:''}</section>`;
  const root=main.querySelector('.oc-catalogue');
  function update(key,value,focus){const position={top:scrollY,left:scrollX};ctx.change(key,value);window.OrthoCMS.apply();window.scrollTo({...position,behavior:'instant'});if(focus)main.querySelector(focus)?.focus({preventScroll:true});}
  root.querySelectorAll('[data-oc-section]').forEach(b=>b.onclick=()=>{state.section=b.dataset.ocSection;state.type='';update('page',1,`[data-oc-section="${state.section}"]`);});
  root.querySelectorAll('[data-oc-type]').forEach(b=>b.onclick=()=>{state.type=b.dataset.ocType;update('page',1,`[data-oc-type="${state.type}"]`);});
  root.querySelectorAll('.oc-clear').forEach(b=>b.onclick=()=>{reset(cat);ctx.clear();window.OrthoCMS.apply();});
  for(const [id,key] of [['ocBrand','brand'],['ocMethod','method'],['ocSort','sort']])root.querySelector('#'+id).onchange=e=>update(key,e.target.value,'#'+id);
  root.querySelectorAll('[data-oc-page]').forEach(b=>b.onclick=()=>{ctx.change('page',Number(b.dataset.ocPage));main.querySelector('.oc-tabs').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});});
  root.querySelector('.oc-browse')?.addEventListener('click',()=>root.querySelector('.oc-tabs').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'}));
  root.querySelector('.oc-tabs').onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;const bs=[...root.querySelectorAll('[data-oc-section]')],index=bs.indexOf(document.activeElement);if(index<0)return;e.preventDefault();const rtl=document.documentElement.dir==='rtl',delta=e.key==='ArrowLeft'?(rtl?1:-1):(rtl?-1:1),next=e.key==='Home'?0:e.key==='End'?bs.length-1:(index+delta+bs.length)%bs.length;bs[next].click();};
  startHero(root,state);return true;
 }
 window.OrthoCatalogue={handles,isCurrent,render,cleanup,reset,infer,classify};
 document.addEventListener('click',e=>{if(e.target.closest('#languageButton')&&isCurrent()&&latest){const {ctx}=latest;queueMicrotask(()=>ctx.refresh());}});
})();
