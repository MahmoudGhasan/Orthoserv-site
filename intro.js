'use strict';
(() => {
 const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const text=(ar,en)=>`<span class="intro-ar" data-no-translate>${escape(ar)}</span><span class="intro-en" data-no-translate>${escape(en)}</span>`;
 const categoryNames={rehab:['العلاج الطبيعي والتأهيل','Physiotherapy & rehabilitation'],gym:['اللياقة والتمارين','Fitness & exercise'],compression:['الضغط الطبي','Medical compression'],consumables:['المستلزمات الطبية','Medical supplies'],medical:['المنتجات الطبية المتخصصة','Specialist medical products']};
 window.renderOrthoIntro=(main,{products,categories,clientsMarkup,statsMarkup,featuredMarkup,onSearch})=>{
  window.orthoIntroCleanup?.();
  document.body.classList.add('intro-open');
  main.innerHTML=`<section class="ortho-intro" aria-labelledby="introTitle">
   <video class="intro-video" muted loop playsinline preload="none" poster="assets/intro/orthoserv-hero-poster.jpg" aria-hidden="true" tabindex="-1"></video>
   <div class="intro-shade" aria-hidden="true"></div>
   <div class="intro-content wrap"><p class="intro-kicker" data-no-translate>ORTHOSERV / MOVE FORWARD</p>
    <h1 id="introTitle">${text('من جهاز متخصص','From specialist equipment')}<br>${text('إلى قسم متكامل','to complete departments')}</h1>
    <p class="intro-description">${text('حلول التأهيل والتجهيز الطبي، للمستشفيات والمراكز في السعودية.','Rehabilitation and medical equipment solutions for hospitals and clinics across Saudi Arabia.')}</p>
    <form class="intro-search" id="introSearch" role="search">
     <label><span>${text('القسم','Category')}</span><select name="category" aria-label="القسم"></select></label>
     <label><span>${text('العلامة التجارية','Brand')}</span><select name="brand" aria-label="العلامة التجارية"></select></label>
     <label class="intro-term"><span>${text('اسم المنتج','Product name')}</span><input name="term" type="search" autocomplete="off" maxlength="160" aria-label="اسم المنتج"></label>
     <button type="submit" class="intro-submit">${text('اعرض المنتجات','Find products')}<span aria-hidden="true">↗</span></button>
    </form>
    <div class="intro-links"><a href="#store">${text('استعرض المتجر','Explore the store')} <span aria-hidden="true">↗</span></a><button type="button" data-business>${text('اطلب عرض تجهيز','Request an equipment quote')} <span aria-hidden="true">↗</span></button></div>
   </div>
   <button class="intro-motion" type="button" aria-pressed="false"></button>
  </section>${clientsMarkup?`<section class="intro-clients" aria-labelledby="introClientsTitle"><div class="wrap">${statsMarkup||''}
   <p class="intro-clients-label">${text('مستشفيات ومراكز طبية نعمل معها','Hospitals and medical centres we work with')}</p>
   <div class="intro-clients-logos" role="region" tabindex="0" aria-label="شعارات المستشفيات والمراكز الطبية">${clientsMarkup}</div>
   <div class="intro-clients-copy"><h2 id="introClientsTitle">${text('نجهّز أقسامًا متكاملة،','We equip complete departments,')}<br><span class="intro-clients-emphasis">${text('لتكون الرعاية في أفضل حالاتها.','so care can be at its best.')}</span></h2>
   <p>${text('من اختيار الأجهزة إلى تجهيز القسم، نعمل مع المستشفيات والمراكز الطبية لتوفير حلول تناسب احتياجاتها.','From selecting equipment to outfitting departments, we work with hospitals and medical centres to deliver solutions suited to their needs.')}</p>
   <a href="#business">${text('اكتشف حلول تجهيز الأقسام','Explore department equipment solutions')} <span aria-hidden="true">↗</span></a></div>
  </div></section>`:''}${featuredMarkup||''}`;
  const icons=['M12 3 4 7v14h16V7ZM8 9v2m8-2v2m-8 3v2m8-2v2m-6 5v-4h4v4','M3 21V8l9-5 9 5v13ZM7 10h2m6 0h2M7 14h2m6 0h2m-7 7v-4h4v4','M9 4h6l2 4v4l-5 3-5-3V8ZM9 14l-1 7 4-2 4 2-1-7'];
  main.querySelectorAll('.intro-clients .trust-strip dl>div').forEach((card,index)=>{
   card.insertAdjacentHTML('beforeend',`<svg class="intro-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[index%icons.length]}"></path></svg>`);
  });
  const form=main.querySelector('#introSearch'),category=form.elements.category,brand=form.elements.brand,term=form.elements.term;
  const video=main.querySelector('video'),motion=main.querySelector('.intro-motion');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const saving=Boolean(navigator.connection?.saveData);
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
  const options=(rows,selected)=>rows.map(([value,label])=>`<option value="${escape(value)}"${value===selected?' selected':''}>${escape(label)}</option>`).join('');
  const updateBrands=()=>{
   const selected=brand.value;
   const brands=[...new Set(products.filter(p=>!category.value||p.category===category.value).map(p=>p.brand).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
   brand.innerHTML=options([['',en()?'All brands':'كل العلامات'],...brands.map(name=>[name,name])],selected);
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
   updateMotion();updateRail();
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
  window.orthoIntroCleanup=()=>{
   disposed=true;railResize.disconnect();observer.disconnect();reduce.removeEventListener('change',motionChange);
   document.removeEventListener('visibilitychange',visibility);
   video.pause();video.removeAttribute('src');video.load();
   document.body.classList.remove('intro-open');window.orthoIntroCleanup=null;
  };
 };
})();
