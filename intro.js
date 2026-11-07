'use strict';
(() => {
 const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const text=(ar,en)=>`<span class="intro-ar" data-no-translate>${escape(ar)}</span><span class="intro-en" data-no-translate>${escape(en)}</span>`;
 const categoryNames={rehab:['العلاج الطبيعي والتأهيل','Physiotherapy & rehabilitation'],gym:['اللياقة والتمارين','Fitness & exercise'],compression:['الضغط الطبي','Medical compression'],consumables:['المستلزمات الطبية','Medical supplies'],medical:['المنتجات الطبية المتخصصة','Specialist medical products']};
 const picker=(name,ar,en)=>`<div class="intro-filter" data-intro-filter="${name}"><span class="intro-filter-label" id="intro-${name}-label">${text(ar,en)}</span><select name="${name}" hidden aria-hidden="true" tabindex="-1"></select><button type="button" class="intro-filter-trigger" aria-haspopup="listbox" aria-expanded="false" aria-controls="intro-${name}-panel" aria-labelledby="intro-${name}-label intro-${name}-value"><span id="intro-${name}-value" class="intro-filter-value" data-no-translate></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m8 10 4 4 4-4"/></svg></button><div class="intro-picker" id="intro-${name}-panel" hidden><div class="intro-picker-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg><input type="search" class="intro-picker-input" autocomplete="off" maxlength="80" data-no-translate aria-controls="intro-${name}-list"></div><div class="intro-picker-list" role="listbox" id="intro-${name}-list" aria-labelledby="intro-${name}-label"></div><p class="intro-picker-empty" data-no-translate hidden></p></div></div>`;
 window.renderOrthoIntro=(main,{products,categories,clientsMarkup,statsMarkup,featuredMarkup,onSearch})=>{
  window.orthoIntroCleanup?.();
  document.body.classList.add('intro-open');
  const categoryCards=[
   ['rehab','العلاج الطبيعي والتأهيل','Physiotherapy & rehabilitation','اكتشف الأجهزة العلاجية وحلول الحركة والتأهيل.','Explore therapy equipment and solutions for movement and rehabilitation.','assets/category-banners/rehab-01.jpg','assets/campaigns/centre-equipment.webp','#catalog/rehab','20% center','center'],
   ['fitness','اللياقة والتمارين','Fitness & exercise','تجهيزات للقوة والحركة والتمرين، حسب احتياجك.','Equipment for strength, movement and exercise, tailored to your needs.','assets/category-banners/gym-01.jpg','assets/category-banners/gym-02.jpg','#catalog/gym','20% center','20% center'],
   ['compression','الضغط الطبي — Juzo','Medical compression — Juzo','استكشف القطعة المناسبة، وخياراتها ودليل قياسها.','Explore compression garments, available options and measurement guides.','assets/campaigns/juzo-lifestyle-hero.jpg','assets/campaigns/juzo-fitting-banner.jpg','#brand/juzo','75% center','75% center'],
   ['supplies','المستلزمات الطبية','Medical supplies','احتياجات العناية والتجهيز الطبي في مكان واحد.','Everyday care and medical equipment essentials in one place.','assets/category-banners/consumables-01.jpg','assets/category-banners/consumables-02.jpg','#catalog/consumables','20% center','20% center']
  ];
  const categoryCardsMarkup=`<article class="intro-category-section" id="introCategories" role="region" aria-label="${escape('تسوّق حسب احتياجك / Shop by your needs')}"><div class="wrap intro-category-grid">${categoryCards.map(([id,ar,en,descriptionAr,descriptionEn,first,second,href,firstPosition,secondPosition])=>`<article class="intro-category-card" id="intro-category-${id}"><a class="intro-category-link" href="${escape(href)}"><img class="intro-category-first" src="${escape(first)}" loading="lazy" alt="" style="object-position:${escape(firstPosition)}"><img class="intro-category-second" src="${escape(second)}" loading="lazy" alt="" style="object-position:${escape(secondPosition)}"><div class="intro-category-copy"><h2>${text(ar,en)}</h2><div class="intro-category-details"><p>${text(descriptionAr,descriptionEn)}</p><span class="intro-category-explore">${text('استكشف القسم','Explore the collection')} <span aria-hidden="true">↗</span></span></div></div></a><button type="button" class="intro-category-toggle" aria-pressed="false" aria-controls="intro-category-${id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5M6 8a7 7 0 0 1 12-2l2 2M4 16l2 2a7 7 0 0 0 12-2"/></svg>${text('تبديل الصورة','Switch image')}</button></article>`).join('')}</div></article>`;

  const closingSections=`<article class="intro-collaboration" id="introCollaboration" role="region" aria-labelledby="introCollaborationTitle"><div class="wrap intro-collaboration-layout"><div class="intro-collaboration-copy"><h2 id="introCollaborationTitle">${text('حلول مترابطة،','Connected solutions,')}<br><span>${text('لتجهيز طبي متكامل.','for complete medical spaces.')}</span></h2><p>${text('احتياجات مركزك مترابطة. نجمع أجهزة العلاج الطبيعي والتأهيل، وتجهيزات التمرين والمستلزمات الطبية في اختيارات تناسب طبيعة عملك والمساحة المتاحة.','Your centre’s needs are connected. We bring together physiotherapy and rehabilitation equipment, exercise solutions and medical supplies to suit your work and available space.')}</p><button type="button" class="button" data-business>${text('ناقش تجهيز مركزك','Discuss your centre’s equipment')} <span aria-hidden="true">↗</span></button></div><div class="intro-collage" aria-hidden="true"><img src="assets/category-banners/rehab-02.jpg" loading="lazy" alt="" class="intro-collage-one"><img src="assets/category-banners/gym-02.jpg" loading="lazy" alt="" class="intro-collage-two"><img src="assets/category-banners/consumables-02.jpg" loading="lazy" alt="" class="intro-collage-three"></div></div></article>
  <article class="intro-consultation" id="introConsultation" role="region" aria-labelledby="introConsultationTitle"><div class="wrap intro-consultation-card"><div class="intro-consultation-photo"><img src="assets/category-banners/rehab-03.jpg" loading="lazy" alt="${escape(document.documentElement.lang==='en'?'Medical centre equipment':'تجهيزات مركز طبي')}" data-no-translate></div><div class="intro-consultation-copy"><h2 id="introConsultationTitle">${text('تخطّط لتجهيز مركزك؟','Planning your medical centre?')}<br><span>${text('خلّينا نبدأ معك.','Let’s start together.')}</span></h2><p>${text('شاركنا نوع المنشأة، والمساحة، والأجهزة التي تحتاجها. يساعدك فريق أورثو سيرف على مناقشة الاختيارات وتجميع احتياجات التجهيز في طلب واضح.','Tell us about your facility, available space and the equipment you need. The OrthoServ team will help you discuss the options and bring your requirements into one clear request.')}</p><span class="intro-consultation-label">${text('ابدأ باختيار احتياجك','Start with what you need')}</span><div class="intro-consultation-tags">${[['العلاج الطبيعي','Physiotherapy'],['التأهيل والحركة','Rehabilitation & movement'],['اللياقة والتمارين','Fitness & exercise'],['المستلزمات الطبية','Medical supplies'],['تجهيز قسم متكامل','Complete department equipment']].map(([ar,en])=>`<button type="button" data-consult-ar="${escape(ar)}" data-consult-en="${escape(en)}">${text(ar,en)}</button>`).join('')}</div><button type="button" class="button" data-business>${text('اطلب استشارة تجهيز','Request an equipment consultation')} <span aria-hidden="true">↗</span></button></div></div></article>`;
  main.innerHTML=`<section class="ortho-intro" aria-labelledby="introTitle">
   <video class="intro-video" muted loop playsinline preload="none" poster="assets/intro/orthoserv-hero-poster.jpg" aria-hidden="true" tabindex="-1"></video>
   <div class="intro-shade" aria-hidden="true"></div>
   <div class="intro-content wrap"><p class="intro-kicker" data-no-translate>ORTHOSERV / MOVE FORWARD</p>
    <h1 id="introTitle">${text('من جهاز متخصص','From specialist equipment')}<br>${text('إلى قسم متكامل','to complete departments')}</h1>
    <p class="intro-description">${text('حلول التأهيل والتجهيز الطبي، للمستشفيات والمراكز في السعودية.','Rehabilitation and medical equipment solutions for hospitals and clinics across Saudi Arabia.')}</p>
    <form class="intro-search" id="introSearch" role="search">
     ${picker('category','القسم','Category')}
     ${picker('brand','العلامة التجارية','Brand')}
     <label class="intro-term"><span>${text('اسم المنتج','Product name')}</span><input name="term" type="search" autocomplete="off" maxlength="160" aria-label="اسم المنتج"></label>
     <button type="submit" class="intro-submit">${text('اعرض المنتجات','Find products')}<span aria-hidden="true">↗</span></button>
    </form>
    <div class="intro-links"><a href="#store">${text('استعرض المتجر','Explore the store')} <span aria-hidden="true">↗</span></a><button type="button" data-business>${text('اطلب عرض تجهيز','Request an equipment quote')} <span aria-hidden="true">↗</span></button></div>
   </div>
   <button class="intro-motion" type="button" aria-pressed="false"></button>
  </section>${clientsMarkup?`<section class="intro-clients" aria-labelledby="introClientsTitle"><div class="wrap">${statsMarkup||''}
   <p class="intro-clients-label">${text('مستشفيات ومراكز طبية نعمل معها','Hospitals and medical centres we work with')}</p>
   <div class="intro-clients-logos" role="region" tabindex="0" aria-label="شعارات المستشفيات والمراكز الطبية">${clientsMarkup}</div>
   <div class="intro-department"><div class="intro-department-image"><img src="assets/campaigns/centre-equipment.webp" width="1536" height="1024" loading="lazy" alt="${escape(document.documentElement.lang==='en'?'Rehabilitation department equipment':'تجهيزات قسم تأهيل وعلاج طبيعي')}" data-no-translate></div>
   <div class="intro-clients-copy"><h2 id="introClientsTitle">${text('نجهّز أقسامًا متكاملة،','We equip complete departments,')}<br><span class="intro-clients-emphasis">${text('لتكون الرعاية في أفضل حالاتها.','so care can be at its best.')}</span></h2>
   <p>${text('من اختيار الأجهزة إلى تجهيز القسم، نعمل مع المستشفيات والمراكز الطبية لتوفير حلول تناسب احتياجاتها.','From selecting equipment to outfitting departments, we work with hospitals and medical centres to deliver solutions suited to their needs.')}</p>
   <ul class="intro-department-points">${[
    ['M4 21V7l8-4 8 4v14ZM8 10h2m4 0h2M8 14h2m4 0h2m-6 7v-4h4v4','تجهيز حسب احتياجك','Equipment tailored to your needs','من جهاز متخصص إلى قسم متكامل.','From specialist equipment to complete departments.'],
    ['M9 3h6v5h5v6h-5v7H9v-7H4V8h5Z','اختيارات طبية متخصصة','Specialist medical solutions','أجهزة التأهيل والعلاج الطبيعي وحلول الضغط الطبي.','Rehabilitation, physiotherapy and medical compression solutions.'],
    ['M4 20l1-4a8 8 0 1 1 4 3ZM8 10h8m-8 4h5','تواصل مباشر مع فريقنا','Talk directly with our team','لمناقشة التجهيز والمنتجات والتوفّر.','Discuss your equipment needs, products and availability.']
   ].map(([icon,ar,en,descriptionAr,descriptionEn],index)=>`<li><a class="intro-department-link" href="${['#business','#catalog','#contact'][index]}"><span class="intro-department-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="${icon}"/></svg></span><div><h3>${text(ar,en)}</h3><p>${text(descriptionAr,descriptionEn)}</p></div><span class="intro-department-arrow" aria-hidden="true">↗</span></a></li>`).join('')}</ul></div></div>

  </div></section>`:''}${categoryCardsMarkup}${featuredMarkup||''}${closingSections}`;
  main.querySelectorAll('.intro-category-toggle').forEach(button=>button.addEventListener('click',()=>{const active=button.closest('.intro-category-card').classList.toggle('is-alternate');button.setAttribute('aria-pressed',String(active));}));
  main.querySelectorAll('[data-consult-ar]').forEach(button=>button.addEventListener('click',()=>{
   main.querySelector('.intro-consultation-copy>[data-business]').click();
   const note=document.querySelector('#quoteForm textarea[name="note"]');
   if(note){note.value=(document.documentElement.lang==='en'?'Equipment consultation: '+button.dataset.consultEn:'استشارة تجهيز: '+button.dataset.consultAr);note.dispatchEvent(new Event('input',{bubbles:true}));}
  }));
  const icons=['M12 3 4 7v14h16V7ZM8 9v2m8-2v2m-8 3v2m8-2v2m-6 5v-4h4v4','M3 21V8l9-5 9 5v13ZM7 10h2m6 0h2M7 14h2m6 0h2m-7 7v-4h4v4','M9 4h6l2 4v4l-5 3-5-3V8ZM9 14l-1 7 4-2 4 2-1-7'];
  main.querySelectorAll('.intro-clients .trust-strip dl>div').forEach((card,index)=>{
   card.insertAdjacentHTML('beforeend',`<svg class="intro-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[index%icons.length]}"></path></svg>`);
  });
  const form=main.querySelector('#introSearch'),category=form.elements.category,brand=form.elements.brand,term=form.elements.term;
  const video=main.querySelector('video'),motion=main.querySelector('.intro-motion');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const saving=Boolean(navigator.connection?.saveData);
  const clientRail=main.querySelector('.intro-clients-logos');
  let clientResize=null,clientMotion=null,clientPaused=false;
  const updateClientMotion=()=>{if(!clientMotion)return;clientMotion.setAttribute('aria-pressed',String(clientPaused));clientMotion.textContent=document.documentElement.lang==='en'?(clientPaused?'Play logos ▷':'Pause logos Ⅱ'):(clientPaused?'تشغيل الشعارات ▷':'إيقاف الشعارات Ⅱ');};
  if(clientRail){
   const track=document.createElement('div'),group=document.createElement('div');track.className='intro-client-track';group.className='intro-client-group';
   while(clientRail.firstChild)group.appendChild(clientRail.firstChild);
   group.querySelectorAll('img').forEach(img=>img.loading='eager');
   const clone=group.cloneNode(true);clone.classList.add('intro-client-copy');clone.setAttribute('aria-hidden','true');clone.inert=true;
   track.append(group,clone);clientRail.append(track);clientRail.classList.add('is-moving');
   clientMotion=document.createElement('button');clientMotion.type='button';clientMotion.className='intro-client-motion';clientMotion.dataset.noTranslate='';
   main.querySelector('.intro-clients-label').append(clientMotion);
   clientMotion.addEventListener('click',()=>{clientPaused=!clientPaused;clientRail.classList.toggle('is-paused',clientPaused);updateClientMotion();});
   const sizeClients=()=>{const distance=group.getBoundingClientRect().width;clientRail.style.setProperty('--client-distance',distance+'px');clientRail.style.setProperty('--client-duration',Math.max(80,distance/12)+'s');};
   clientResize=new ResizeObserver(sizeClients);clientResize.observe(group);sizeClients();updateClientMotion();
  }

  let userPaused=false,disposed=false;
  const rail=main.querySelector('.intro-collections-rail');
  const previous=main.querySelector('[data-collection-prev]'),next=main.querySelector('[data-collection-next]');
  const updateRail=()=>{if(!rail)return;const offset=Math.abs(rail.scrollLeft),max=rail.scrollWidth-rail.clientWidth;previous.disabled=offset<2;next.disabled=offset>=max-2;};
  const moveRail=step=>{if(!rail)return;const card=rail.firstElementChild,dir=getComputedStyle(rail).direction==='rtl'?-1:1;rail.scrollBy({left:step*dir*(card.getBoundingClientRect().width+24),behavior:reduce.matches?'instant':'smooth'});};
  previous?.addEventListener('click',()=>moveRail(-1));next?.addEventListener('click',()=>moveRail(1));
  rail?.addEventListener('scroll',updateRail,{passive:true});
  const railResize=new ResizeObserver(updateRail);if(rail)railResize.observe(rail);
  updateRail();
  const en=()=>document.documentElement.lang==='en';
  const names=()=>Object.keys(categoryNames).filter(key=>products.some(p=>p.category===key));
  const pickers=[...form.querySelectorAll('[data-intro-filter]')];
  let openPicker=null;
  const closePicker=(restore=false)=>{if(!openPicker)return;const field=openPicker;field.querySelector('.intro-picker').hidden=true;field.querySelector('button').setAttribute('aria-expanded','false');field.classList.remove('is-open');openPicker=null;if(restore)field.querySelector('button').focus({preventScroll:true});};
  const positionPicker=()=>{
   if(!openPicker)return;
   const panel=openPicker.querySelector('.intro-picker'),rect=openPicker.getBoundingClientRect();
   const space=Math.max(90,Math.min(320,rect.top-22));
   panel.classList.remove('opens-below');
   panel.style.width=rect.width+'px';panel.style.left=(-openPicker.clientLeft)+'px';panel.style.top='auto';panel.style.bottom='calc(100% + 6px)';panel.style.setProperty('--picker-height',space+'px');
  };
  const renderPicker=field=>{
   const select=field.querySelector('select'),input=field.querySelector('.intro-picker-input'),list=field.querySelector('.intro-picker-list'),empty=field.querySelector('.intro-picker-empty');
   const selected=select.selectedOptions[0],needle=input.value.trim().toLocaleLowerCase();
   field.querySelector('.intro-filter-value').textContent=selected?.textContent||'';
   input.placeholder=en()?'Search…':'ابحث…';input.setAttribute('aria-label',en()?(select.name==='category'?'Search categories':'Search brands'):(select.name==='category'?'ابحث في الأقسام':'ابحث في العلامات التجارية'));
   const rows=[...select.options].filter(option=>!needle||option.textContent.toLocaleLowerCase().includes(needle));
   list.innerHTML=rows.map(option=>`<button type="button" class="intro-picker-option" role="option" tabindex="-1" aria-selected="${option.selected}" data-value="${escape(option.value)}"><span class="intro-picker-radio" aria-hidden="true"></span><span data-no-translate>${escape(option.textContent)}</span></button>`).join('');
   empty.hidden=rows.length>0;empty.textContent=en()?'No matching options':'لا توجد خيارات مطابقة';
  };
  for(const field of pickers){
   const trigger=field.querySelector('.intro-filter-trigger'),input=field.querySelector('.intro-picker-input'),list=field.querySelector('.intro-picker-list'),select=field.querySelector('select');
   trigger.addEventListener('click',()=>{if(openPicker===field){closePicker();return;}closePicker();input.value='';renderPicker(field);openPicker=field;field.querySelector('.intro-picker').hidden=false;field.classList.add('is-open');trigger.setAttribute('aria-expanded','true');positionPicker();input.focus({preventScroll:true});});
   input.addEventListener('input',()=>renderPicker(field));
   list.addEventListener('click',event=>{const option=event.target.closest('[role="option"]');if(!option)return;select.value=option.dataset.value;select.dispatchEvent(new Event('change',{bubbles:true}));renderPicker(field);closePicker(true);});
   field.addEventListener('keydown',event=>{
    if(!openPicker)return;
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closePicker(true);return;}
    if(event.key==='Enter'&&event.target===input){event.preventDefault();list.querySelector('[role="option"]')?.click();return;}
    if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key)||(['Home','End'].includes(event.key)&&event.target===input))return;
    event.preventDefault();const rows=[...list.querySelectorAll('[role="option"]')];if(!rows.length)return;
    let index=rows.indexOf(document.activeElement);index=event.key==='Home'?0:event.key==='End'?rows.length-1:event.key==='ArrowDown'?(index+1)%rows.length:(index-1+rows.length)%rows.length;rows[index].focus({preventScroll:true});const itemRect=rows[index].getBoundingClientRect(),listRect=list.getBoundingClientRect();if(itemRect.top<listRect.top)list.scrollTop-=listRect.top-itemRect.top;else if(itemRect.bottom>listRect.bottom)list.scrollTop+=itemRect.bottom-listRect.bottom;
   });
  }
  const closeOutside=event=>{if(openPicker&&!openPicker.contains(event.target))closePicker();};
  document.addEventListener('pointerdown',closeOutside);document.addEventListener('focusin',closeOutside);
  window.addEventListener('resize',positionPicker);window.visualViewport?.addEventListener('resize',positionPicker);
  const options=(rows,selected)=>rows.map(([value,label])=>`<option value="${escape(value)}"${value===selected?' selected':''}>${escape(label)}</option>`).join('');
  const updateBrands=()=>{
   const selected=brand.value;
   const brands=[...new Set(products.filter(p=>!category.value||p.category===category.value).map(p=>p.brand).filter(name=>typeof name==='string'&&name.trim()&&!/^[-–—]+$/.test(name.trim())))].sort((a,b)=>a.localeCompare(b));
   brand.innerHTML=options([['',en()?'All brands':'كل العلامات'],...brands.map(name=>[name,name])],selected);
   renderPicker(brand.closest('[data-intro-filter]'));
  };
  const updateMotion=()=>{
   const paused=video.paused;
   motion.setAttribute('aria-pressed',String(!paused));
   motion.textContent=en()?(paused?'Play background video ▷':'Pause background video Ⅱ'):(paused?'تشغيل فيديو الخلفية ▷':'إيقاف فيديو الخلفية Ⅱ');
   motion.setAttribute('aria-label',motion.textContent);
  };
  const language=()=>{
   const selected=category.value;
   category.innerHTML=options([['',en()?'All categories':'كل الأقسام'],...names().map(key=>[key,categoryNames[key][en()?1:0]||categories[key]])],selected);
   updateBrands();
   category.setAttribute('aria-label',en()?'Category':'القسم');
   brand.setAttribute('aria-label',en()?'Brand':'العلامة التجارية');
   term.setAttribute('aria-label',en()?'Product name':'اسم المنتج');
   term.placeholder=en()?'Device, product or model…':'ابحث عن جهاز أو منتج…';
   term.dataset.noTranslate='';
   document.title=en()?'OrthoServ | Medical equipment & rehabilitation':'أورثو سيرف | حلول التأهيل والتجهيز الطبي';
   main.querySelector('.intro-clients-logos')?.setAttribute('aria-label',en()?'Hospital and medical centre logos':'شعارات المستشفيات والمراكز الطبية');
   main.querySelector('.intro-department-image img')?.setAttribute('alt',en()?'Rehabilitation department equipment':'تجهيزات قسم تأهيل وعلاج طبيعي');
   main.querySelector('.intro-consultation-photo img')?.setAttribute('alt',en()?'Medical centre equipment':'تجهيزات مركز طبي');
   closePicker();pickers.forEach(renderPicker);updateMotion();updateRail();updateClientMotion();
  };
  category.addEventListener('change',updateBrands);
  form.addEventListener('submit',event=>{
   event.preventDefault();
   onSearch({category:category.value||'all',brand:brand.value,term:term.value.trim()});
  });
  const play=()=>{
   if(disposed)return;
   if(!video.getAttribute('src')){video.src='assets/intro/orthoserv-hero.mp4';video.muted=true;}
   video.play().catch(updateMotion);
  };
  motion.addEventListener('click',()=>{userPaused=!video.paused;if(userPaused)video.pause();else play();});
  video.addEventListener('play',updateMotion);
  video.addEventListener('pause',updateMotion);
  video.addEventListener('error',()=>{video.removeAttribute('src');video.load();updateMotion();},{once:true});
  const motionChange=()=>{if(reduce.matches)video.pause();else if(!userPaused&&!document.hidden&&!saving)play();};
  const visibility=()=>{if(document.hidden)video.pause();else if(!userPaused&&!reduce.matches&&!saving)play();};
  reduce.addEventListener('change',motionChange);
  document.addEventListener('visibilitychange',visibility);
  const observer=new MutationObserver(language);
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  language();
  if(!reduce.matches&&!saving)play();
  const loadReveal = () => {
   import('./reveal.js?v=rebase-20261107').catch(() => {});
  };
  if (window.OrthoReveal) window.OrthoReveal.start();
  else window.addEventListener('scroll', loadReveal, {once:true, passive:true});
  window.orthoIntroCleanup=()=>{
   window.removeEventListener('scroll', loadReveal);
   window.OrthoReveal?.stop();
   disposed=true;clientResize?.disconnect();closePicker();document.removeEventListener('pointerdown',closeOutside);document.removeEventListener('focusin',closeOutside);window.removeEventListener('resize',positionPicker);window.visualViewport?.removeEventListener('resize',positionPicker);railResize.disconnect();observer.disconnect();reduce.removeEventListener('change',motionChange);
   document.removeEventListener('visibilitychange',visibility);
   video.pause();video.removeAttribute('src');video.load();
   document.body.classList.remove('intro-open');window.orthoIntroCleanup=null;
  };
 };
})();
