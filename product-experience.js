'use strict';
/* Product presentation only. Existing purchase, enquiry and measurement handlers remain authoritative. */
(() => {
 const en=()=>document.documentElement.lang==='en';
 const t=(ar,english)=>en()?english:ar;
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const selectionSteps=new Map(),timers=new Map();
 let current=null,pendingFrame=0,cleanup=()=>{},lastButton=null,lastClick=0;
 function node(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!=null)el.textContent=text;el.dataset.noTranslate='';return el;}
 function label(ar,english){const el=node('span');el.dataset.osAr=ar;el.dataset.osEn=english;el.textContent=t(ar,english);return el;}
 function button(ar,english,className){const el=node('button',className);el.type='button';el.append(label(ar,english));return el;}
 function field(value){return typeof value==='string'?value:(value?.[en()?'en':'ar']||'');}
 function readable(value){const text=String(value||'').trim();if(!text)return '';return (/[\u0600-\u06ff]/.test(text)&&en())?'':text;}
 function rich(parent,value){if(window.OrthoCommerce?.renderRich)window.OrthoCommerce.renderRich(parent,value);else parent.textContent=new DOMParser().parseFromString(String(value),'text/html').body.textContent;}
 function url(value){const s=String(value||'');return s&&!/[\x00-\x1f\\]/.test(s)&&!s.startsWith('//')&&!/^(?!https?:)[a-z][a-z\d+.-]*:/i.test(s)?s:'';}
 function addPanel(host,ar,english,fill){const panel=node('details','os-p-panel');const summary=node('summary');summary.append(label(ar,english));const body=node('div','os-p-panel-body');fill(body);if(!body.textContent.trim()&&!body.querySelector('img,a'))return null;panel.append(summary,body);host.append(panel);return panel;}
 function details(root,p){
  root.querySelector('.os-p-content')?.remove();
  const extra=node('section','os-p-content');const info=p.commerce||{};
  const about=field(info.description)||readable(p.description);
  addPanel(extra,'عن المنتج','About the product',body=>{if(about)rich(body,about);const features=info.features?.[en()?'en':'ar']||[];if(features.length){const list=node('ul');features.filter(Boolean).forEach(v=>list.append(node('li',null,v)));body.append(list);}});
  addPanel(extra,'المواصفات والتجهيز','Specifications & configuration',body=>{const dl=node('dl','os-p-specs');if(p.model)dl.append(node('dt',null,t('الموديل','Model')),node('dd',null,p.model));for(const row of info.specifications||[]){const name=field(row.name),value=field(row.value);if(name&&value)dl.append(node('dt',null,name),node('dd',null,value));}body.append(dl);});
  addPanel(extra,'الاستخدامات','Applications',body=>{if(field(info.applications))rich(body,field(info.applications));});
  addPanel(extra,'الملحقات والملفات','Accessories & documents',body=>{
   if(field(info.accessories))rich(body,field(info.accessories));
   const links=[...(info.attachments||[])];if(p.source?.document)links.push({file:p.source.document,label:{ar:'كتالوج المنتج',en:'Product catalogue'}});
   if(info.videoUrl)links.push({file:info.videoUrl,label:{ar:'فيديو المنتج',en:'Product video'}});
   for(const item of links){const href=url(item.file);if(!href)continue;const a=node('a','os-p-document',field(item.label)||t('فتح الملف','Open document'));a.href=href;if(!href.startsWith('#')){a.target='_blank';a.rel='noopener noreferrer';}a.append(document.createTextNode(' ↗'));body.append(a);}
  });
  addPanel(extra,'الخدمات والتوريد','Services & delivery',body=>{for(const [key,ar,english] of [['warranty','الضمان','Warranty'],['leadTime','مدة التوريد','Lead time'],['origin','المنشأ','Origin'],['certifications','الاعتمادات','Certifications']]){const value=field(info[key]);if(value){body.append(node('h3',null,t(ar,english)));rich(body,value);}}});
  if(extra.children.length){extra.firstElementChild.open=true;const nav=node('nav','os-p-detail-nav');nav.setAttribute('aria-label',t('تفاصيل المنتج','Product information'));[...extra.children].forEach((panel,i)=>{panel.id='os-product-info-'+i;const b=button(panel.querySelector('summary').textContent,panel.querySelector('summary').textContent,'os-p-detail-link');b.onclick=()=>{panel.open=true;panel.scrollIntoView({block:'start',behavior:reduced()?'instant':'smooth'});panel.querySelector('summary').focus({preventScroll:true});};nav.append(b);});extra.prepend(nav);root.append(extra);}
 }
 function configure(root,p,copy){
  const groups=[...copy.querySelectorAll('.jzp-group')];const colour=copy.querySelector(':scope>.jz-options');
  if(!groups.length&&!colour)return null;
  const config=node('section','os-p-config');config.setAttribute('aria-label',t('اختيارات المنتج','Product configuration'));
  const top=node('div','os-p-config-heading');top.append(label('اختَر قطعتك','Configure your garment'));
  const nav=node('div','os-p-step-nav');nav.setAttribute('role','group');nav.setAttribute('aria-label',t('خطوات الاختيار','Configuration steps'));
  const steps=[],pressure=groups.filter(g=>g.querySelector('.jzp-pressure-row'));
  function step(id,ar,english,nodes){if(!nodes.length)return;const panel=node('div','os-p-step');panel.dataset.step=id;nodes.forEach(el=>panel.append(el));config.append(panel);steps.push({id,ar,english,panel});}
  const first=copy.querySelector('.jzp-options')||colour;first.before(config);config.append(top,nav);
  step('pressure','الضغط','Compression',pressure);
  step('fit','المقاس والطول','Size & length',groups.filter(g=>!pressure.includes(g)));
  if(colour)step('colour','اللون','Colour',[colour]);
  const review=node('div','os-p-review');const reviewTitle=node('h2');reviewTitle.append(label('راجع اختياراتك','Review your choices'));const summary=node('dl','os-p-review-values');review.append(reviewTitle,summary);
  step('review','المراجعة','Review',[review]);
  const footer=node('div','os-p-step-footer'),back=button('السابق','Back','os-p-back'),next=button('التالي','Continue','button os-p-next'),error=node('p','os-p-error');error.setAttribute('role','alert');error.hidden=true;
  footer.append(back,next);config.append(error,footer);
  const actions=copy.querySelector('.jz-detail-actions');if(actions)steps.at(-1).panel.append(actions);
  const empty=copy.querySelector(':scope>.jzp-options');if(empty&&!empty.children.length)empty.remove();
  let index=Math.min(selectionSteps.get(p.id)||0,steps.length-1);
  function missing(i){return [...steps[i].panel.querySelectorAll('select')].find(s=>!s.disabled&&s.options.length&&!s.value);}
  function refresh(){
   summary.replaceChildren();
   groups.forEach(group=>{const title=group.querySelector('h2')?.cloneNode(true);title?.querySelector('.jzp-selected-value')?.remove();const select=group.querySelector('select');const selected=select?.selectedOptions[0];if(title&&selected?.value)summary.append(node('dt',null,title.textContent.trim()),node('dd',null,selected.textContent));});
   const color=copy.querySelector('#jzColorName')?.textContent;if(color)summary.append(node('dt',null,t('اللون','Colour')),node('dd',null,color));
   root.querySelector('.os-p-selection')?.replaceChildren(summary.cloneNode(true));
  }
  function show(nextIndex,focus=false){
   index=nextIndex;selectionSteps.set(p.id,index);error.hidden=true;
   steps.forEach((s,i)=>{s.panel.hidden=i!==index;s.button.setAttribute('aria-current',i===index?'step':'false');s.button.setAttribute('aria-pressed',String(i===index));});
   back.hidden=index===0;next.hidden=index===steps.length-1;refresh();
   if(focus){config.scrollIntoView({block:'nearest',behavior:reduced()?'instant':'smooth'});steps[index].button.focus({preventScroll:true});}
   root.dispatchEvent(new Event('os-product-step'));
  }
  function advance(to=index+1){for(let i=0;i<to;i++){const select=missing(i);if(select){show(i);error.textContent=t('اختر ','Choose ')+(select.getAttribute('aria-label')||t('الخيار المطلوب','the required option'));error.hidden=false;steps[i].panel.querySelector('[data-jzp-group],[data-jzp-fit]')?.focus({preventScroll:true});return false;}}show(Math.min(to,steps.length-1),true);return true;}
  steps.forEach((s,i)=>{const b=button(s.ar,s.english,'os-p-step-button');b.prepend(node('b',null,String(i+1)));b.onclick=()=>i<=index?show(i,true):advance(i);nav.append(b);s.button=b;});
  next.onclick=()=>advance();back.onclick=()=>show(Math.max(0,index-1),true);
  const onChoice=()=>queueMicrotask(refresh);config.addEventListener('change',onChoice);config.addEventListener('click',onChoice);show(index);
  return {continue:()=>index<steps.length-1?advance():copy.querySelector('#jzAddInquiry')?.click(),get reviewing(){return index===steps.length-1;},refresh};
 }
 function feedback(kind,id,selected){
  const b=lastButton;if(!b?.isConnected||performance.now()-lastClick>2000)return;
  const same=(b.dataset.save||b.dataset.add||b.dataset.quote||b.dataset.jzPurchase||current?.p.id)===id;
  if(id&&!same)return;
  if(kind==='favorite'&&!b.hasAttribute('data-save'))return;
  if(kind==='cart'&&!b.matches('[data-add],[data-jz-purchase],#jzAddInquiry'))return;
  clearTimeout(timers.get(b));b.classList.remove('os-action-pop','os-action-done','os-fav-pending');
  if(kind==='favorite'){
   if(selected&&!reduced())b.classList.add('os-fav-pending');
   if(!reduced()){void b.offsetWidth;b.classList.add('os-action-pop');}
   timers.set(b,setTimeout(()=>{b.classList.remove('os-action-pop','os-fav-pending');timers.delete(b);},260));return;
  }
  if(kind==='cart'){
   const old=b.getAttribute('aria-label'),hint=t('تمت الإضافة','Added');b.dataset.osResult=hint;b.setAttribute('aria-label',hint);b.classList.add('os-action-done');
   timers.set(b,setTimeout(()=>{b.classList.remove('os-action-done');delete b.dataset.osResult;if(old)b.setAttribute('aria-label',old);else b.removeAttribute('aria-label');timers.delete(b);},1000));
  }else if(kind==='quote'&&!reduced()){
   b.classList.add('os-action-pop');document.querySelector('#formDialog[open]')?.classList.add('os-quote-opening');
   timers.set(b,setTimeout(()=>{b.classList.remove('os-action-pop');document.querySelector('#formDialog')?.classList.remove('os-quote-opening');timers.delete(b);},260));
  }
 }
 function renderNow(){
  pendingFrame=0;if(!current)return;const {p}=current;
  const root=document.querySelector('.jz-product')||document.querySelector('section.detail');if(!root||root.dataset.osProduct===p.id)return;
  cleanup();root.dataset.osProduct=p.id;root.classList.add('os-p-product');document.body.classList.add('os-product-open');
  const juzo=root.classList.contains('jz-product'),copy=root.querySelector(juzo?'.jz-product-copy':'.detail-copy'),gallery=root.querySelector(juzo?'.jz-gallery':'.detail-grid>div:first-child');if(!copy||!gallery)return;
  gallery.classList.add('os-p-gallery');copy.classList.add('os-p-copy');
  const favorite=copy.querySelector('[data-save]');if(favorite){favorite.classList.add('os-p-gallery-heart');gallery.append(favorite);}
  let wizard=null;
  if(juzo){wizard=configure(root,p,copy);const accordionHost=node('section','os-p-juzo-info');copy.querySelectorAll(':scope>details.jz-accordion').forEach(d=>accordionHost.append(d));if(accordionHost.children.length)root.querySelector('.jz-detail-grid').after(accordionHost);const support=copy.querySelector(':scope>.jzp-support');if(support){support.classList.add('os-p-support');accordionHost.after(support);}}
  else{
   root.querySelector('.detail-extra')?.classList.add('os-p-legacy-info');
   const intro=copy.querySelector('.subtitle');if(intro){const description=field(p.commerce?.shortDescription)||readable(p.description);intro.textContent=description;intro.dataset.noTranslate='';intro.hidden=!description;}
   const notes=copy.querySelector('.detail-notes');if(notes)notes.hidden=true;
   const priceNote=copy.querySelector('.detail-price p');if(priceNote&&p.method!=='buy'){priceNote.replaceChildren(label('ناقش التجهيز والتوفر مع الفريق.','Discuss configuration and availability with our team.'));}
   const title=copy.querySelector('h1');if(title){title.textContent=en()?(p.nameEn||p.name):(p.titleAr||p.name);title.dataset.noTranslate='';}
   const priceValue=copy.querySelector('.detail-price>strong');
   if(priceValue){if(p.method==='buy'&&typeof p.price==='number'&&window.OrthoJuzoStore?.money){priceValue.innerHTML=(p.regularPrice>p.price?'<del class="cms-old-price">'+window.OrthoJuzoStore.money(p.regularPrice)+'</del> ':'')+window.OrthoJuzoStore.money(p.price);}else if(p.method!=='buy')priceValue.replaceChildren(label('سعر حسب التجهيز','Price on request'));}
   const thumbs=[...gallery.querySelectorAll('[data-photo]')];thumbs.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===0)));gallery.addEventListener('click',event=>{const b=event.target.closest('[data-photo]');if(b)thumbs.forEach(el=>el.setAttribute('aria-pressed',String(el===b)));});
   const stage=gallery.querySelector('#detailStage');if(stage){stage.setAttribute('aria-label',t('صور المنتج','Product gallery'));stage.tabIndex=0;stage.setAttribute('role','button');const zoom=()=>{const image=stage.querySelector('img');if(!image)return;const dialog=node('dialog','os-p-lightbox');const close=button('إغلاق','Close','os-p-close');const photo=image.cloneNode();photo.removeAttribute('style');dialog.append(close,photo);document.body.append(dialog);close.onclick=()=>dialog.close();dialog.onclick=e=>{if(e.target===dialog)dialog.close();};dialog.addEventListener('close',()=>{dialog.remove();stage.focus({preventScroll:true});},{once:true});dialog.showModal();};stage.onclick=zoom;stage.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();zoom();}};}
   details(root,p);
  }
  const action=copy.querySelector(juzo?'#jzAddInquiry':'.detail-actions>[data-add],.detail-actions>[data-quote]');
  const bar=node('aside','os-p-mobile-action');bar.setAttribute('aria-label',t('إجراء المنتج','Product action'));const amount=node('div','os-p-mobile-price');const source=copy.querySelector(juzo?'.jza-price':'.detail-price strong');if(source)amount.append(source.cloneNode(true));else amount.textContent=t('اختيارات المنتج','Product options');const go=button('','', 'button os-p-mobile-button');bar.append(amount,go);document.body.append(bar);
  const update=()=>{go.firstChild.textContent=wizard&&!wizard.reviewing?t('تابع الاختيارات','Continue options'):(action?.textContent.trim()||t('عرض المنتج','View product'));go.disabled=Boolean(action?.disabled);};update();root.addEventListener('os-product-step',update);
  go.onclick=()=>{if(wizard&&!wizard.reviewing)wizard.continue();else action?.click();};
  const observer=window.IntersectionObserver&&action?new IntersectionObserver(([entry])=>{bar.classList.toggle('is-visible',!entry.isIntersecting);},{threshold:0}):null;if(action)observer?.observe(action);
  cleanup=()=>{observer?.disconnect();bar.remove();root.removeEventListener('os-product-step',update);document.querySelectorAll('.os-p-lightbox').forEach(d=>{d.close();d.remove();});document.body.classList.remove('os-product-open');};
 }
 function render(p){current={p};cancelAnimationFrame(pendingFrame);pendingFrame=requestAnimationFrame(renderNow);}
 function stop(){cancelAnimationFrame(pendingFrame);cleanup();cleanup=()=>{};current=null;}
 document.addEventListener('click',event=>{const b=event.target.closest('button,a');if(b?.matches('[data-add],[data-save],[data-quote],[data-business],[data-demo-request],[data-jz-purchase],#jzAddInquiry')){lastButton=b;lastClick=performance.now();}},true);
 new MutationObserver(()=>{document.querySelectorAll('[data-os-ar]').forEach(el=>{el.textContent=en()?el.dataset.osEn:el.dataset.osAr;});if(current){const root=document.querySelector('[data-os-product]');if(root&&!root.classList.contains('jz-product')){const title=root.querySelector('h1');if(title)title.textContent=en()?(current.p.nameEn||current.p.name):(current.p.titleAr||current.p.name);details(root,current.p);}}}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 window.OrthoProductExperience={render,stop,feedback};
})();
