/* Public-section name transition: product content remains immediately visible. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!Element.prototype.animate) return;
  const preview = new URLSearchParams(location.search).get('motion-preview') === '1';
  const stylesheet = new URL('section-motion.css?v=20261117-department-curtain-1500', document.currentScript.src);
  let criticalStyle;
  function ensureCriticalStyle() {
    if (criticalStyle) return;
    criticalStyle=document.createElement('style');
    criticalStyle.textContent=".os-page-cover{position:fixed;inset:0;z-index:55;display:grid;place-items:center;background:var(--navy,#102c53);color:var(--paper,#fff);pointer-events:none;overflow:clip;isolation:isolate}.os-page-cover-title{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:0 .22em;max-width:calc(100vw - 40px);padding:12px;font:600 clamp(24px,3.4vw,56px)/1.5 Plex,Arial,sans-serif;text-align:center}.os-page-word-mask{display:inline-block;overflow:hidden;padding:0 .06em .12em;vertical-align:top;line-height:1.5}.os-page-word-mask>span{display:inline-block;will-change:transform}.os-cover-objects{position:absolute;inset:0;z-index:-1;pointer-events:none}.os-cover-object{position:absolute}";
    criticalStyle.textContent+="/* Click-only rehab prototype. Text is counter-translated, never stretched. */\n.os-rehab-stage .os-rehab-surface{position:absolute;inset:0;background:var(--navy,#102c53);opacity:0;transform-origin:center;z-index:0}\n.os-rehab-strip{position:absolute;left:0;right:0;top:50%;margin-top:calc(var(--os-strip-height,96px)*-.5);height:var(--os-strip-height,96px);overflow:hidden;z-index:2}\n.os-rehab-strip-inner{width:100%;height:100%;display:grid;place-items:center;background:var(--navy,#102c53)}\n.os-rehab-heading{max-width:calc(100vw - 48px);margin:0;box-sizing:border-box}\n.os-rehab-word-window{display:inline-block;overflow:hidden;line-height:1.5}\n.os-rehab-word{display:block}\n.os-rehab-stage .os-rehab-art{z-index:1;opacity:0}\n";
    document.head.append(criticalStyle);
  }
  let cssReady;
  function loadStyles() {
    ensureCriticalStyle();
    return cssReady ||= new Promise(resolve => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = stylesheet.href;
      link.onload = () => resolve(true);
      link.onerror = () => resolve(false);
      document.head.append(link);
    });
  }
  let cover = null;
  function closeCover(completed = false) {
    const state = cover;
    if (!state) return;
    cover = null;
    clearTimeout(state.timer);
    state.animations.forEach(animation => animation.cancel());
    state.element.remove();
    state.resolve(completed);
  }
  const sectionArt = hash => hash === '#catalog/compression' ? 'juzo'
    : /^#(?:catalog\/(?:rehab|gym|consumables|medical)|brand\/juzo)$/.test(hash)
      ? hash.split('/').pop() : null;
  const artUrl = section => new URL('assets/transitions/'+section+'.webp', stylesheet).href;
  const warmed = new Set();
  const warmArt = event => {
    const link = event.target.closest?.('a[href]');
    if (!link) return;
    const section = sectionArt(new URL(link.href, location.href).hash);
    if (!section || warmed.has(section) || reduced.matches) return;
    warmed.add(section);
    void loadStyles();
    const image = new Image();image.decoding='async';image.fetchPriority='low';image.src=artUrl(section);
  };
  ['pointerover','pointerdown','focusin'].forEach(type => document.addEventListener(type,warmArt,{passive:true}));
  // Source rectangles reuse the approved artwork without altering the image files.
  const objects = {
    rehab:[[55,15,170,250],[675,5,365,215],[35,325,160,165],[1200,5,170,280],[40,585,230,160],[365,575,180,175],[365,20,190,180],[660,565,175,175],[930,560,150,185],[1180,590,220,140]],
    gym:[[100,12,220,220],[585,10,285,205],[40,315,135,165],[1215,250,185,300],[95,590,160,155],[535,590,380,165],[1150,30,230,145],[1120,595,245,140]],
    consumables:[[95,38,215,150],[790,20,195,175],[30,295,215,175],[1250,275,115,235],[450,35,195,130],[805,580,155,180],[1150,50,200,135],[460,595,175,155],[1125,585,225,165],[95,590,210,155]],
    medical:[[105,40,400,135],[925,45,450,125],[35,325,185,120],[1200,300,210,175],[120,615,320,100],[740,600,550,110]],
    juzo:[[165,20,175,235],[1100,5,170,310],[15,285,245,185],[1240,275,175,230],[150,540,140,215],[1060,565,215,145]]
  };
  function artwork(section) {
    const layer = document.createElement('div');layer.className='os-cover-objects';
    for (const [x,y,w,h] of objects[section] || []) {
      const object=document.createElement('span');object.className='os-cover-object';
      object.style.setProperty('--aspect',w/h);
      object.style.backgroundSize=(144000/w)+'% '+(81000/h)+'%';
      object.style.backgroundPosition=(100*x/(1440-w))+'% '+(100*y/(810-h))+'%';
      layer.append(object);
    }
    return layer;
  }
  function showSectionCurtain(title, hash, navigate) {
    return new Promise(resolve => {
      const element=document.createElement('div');element.className='os-page-cover os-rehab-stage';
      element.dataset.section=sectionArt(hash);element.dataset.noTranslate='';element.setAttribute('aria-hidden','true');element.dir=document.documentElement.dir;
      element.style.background='transparent';
      const surface=document.createElement('div');surface.className='os-rehab-surface';
      const strip=document.createElement('div');strip.className='os-rehab-strip';
      const inner=document.createElement('div');inner.className='os-rehab-strip-inner';
      const heading=document.createElement('div');heading.className='os-page-cover-title os-rehab-heading';
      const words=title.trim().split(/\s+/).map(word=>{const mask=document.createElement('span'),text=document.createElement('span');mask.className='os-rehab-word-window';text.className='os-rehab-word';text.textContent=word;mask.append(text);heading.append(mask);return text;});
      inner.append(heading);strip.append(inner);
      const art=artwork(sectionArt(hash));art.classList.add('os-rehab-art');
      const side=document.documentElement.dir==='rtl'?1:-1;
      strip.style.transform='translateX('+(side*100)+'%)';inner.style.transform='translateX('+(-side*100)+'%)';
      element.append(surface,art,strip);
      const state={element,hash,animations:[],resolve,timer:null};cover=state;
      document.body.append(element);
      const stripHeight=Math.ceil(heading.getBoundingClientRect().height+24);
      element.style.setProperty('--os-strip-height',stripHeight+'px');
      const ratio=Math.min(1,stripHeight/element.getBoundingClientRect().height),ease='cubic-bezier(.22,.61,.36,1)';
      const animate=(node,frames,options)=>{const animation=node.animate(frames,options);state.animations.push(animation);return animation;};
      animate(strip,[{transform:'translateX('+(side*100)+'%)'},{transform:'translateX(0)'}],{duration:200,easing:ease,fill:'forwards'});
      animate(inner,[{transform:'translateX('+(-side*100)+'%)'},{transform:'translateX(0)'}],{duration:200,easing:ease,fill:'forwards'});
      const expand=animate(surface,[{transform:'scaleY('+ratio+')',opacity:1},{transform:'scaleY(1)',opacity:1}],{delay:200,duration:220,easing:ease,fill:'forwards'});
      expand.finished.then(()=>{if(cover!==state)return;inner.style.background='transparent';navigate?.();},()=>{});
      animate(art,[{opacity:0},{opacity:1}],{delay:420,duration:100,easing:'ease-out',fill:'forwards'});
      words.forEach((word,i)=>animate(word,[{transform:'translateY(0)'},{transform:'translateY(-110%)'}],{delay:1000+Math.min(i,3)*30,duration:200,easing:ease,fill:'forwards'}));
      const exit=animate(element,[{transform:'translateY(0)'},{transform:'translateY(-100%)'}],{delay:1220,duration:280,easing:ease,fill:'forwards'});
      exit.finished.then(()=>{if(cover===state)closeCover(true);},()=>{});
    });
  }

  function showTitle(title, section, hash) {
    return new Promise(resolve => {
      const element = document.createElement('div');
      element.className = 'os-page-cover';
      element.dataset.section = section;
      element.setAttribute('aria-hidden', 'true');
      element.dataset.noTranslate = '';
      element.dir = document.documentElement.dir;
      const heading = document.createElement('div');
      heading.className = 'os-page-cover-title';
      const state = {element, hash, animations: [], resolve, timer: null};
      cover = state;
      title.trim().split(/\s+/).forEach((word, i) => {
        const mask = document.createElement('span'), inner = document.createElement('span');
        mask.className = 'os-page-word-mask';
        inner.textContent = word;
        mask.append(inner);
        heading.append(mask);
        state.animations.push(inner.animate([
          {transform: 'translateY(115%)', opacity: 0},
          {transform: 'translateY(0)', opacity: 1}
        ], {duration: 320, delay: 55 + Math.min(i, 3) * 50,
          easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'backwards'}));
      });
      element.append(artwork(element.dataset.section),heading);
      document.body.append(element);
      state.timer = setTimeout(() => {
        if (cover !== state) return;
        const exit = element.animate([{opacity: 1}, {opacity: 0}],
          {duration: 240, easing: 'ease-out', fill: 'forwards'});
        state.animations.push(exit);
        exit.finished.then(() => { if (cover === state) closeCover(true); }, () => {});
      }, 760);
    });
  }
  function stop() { closeCover(); }
  const titles = {
    rehab:{ar:'العلاج الطبيعي والتأهيل',en:'Physiotherapy & Rehabilitation'},
    gym:{ar:'اللياقة والتمارين',en:'Fitness & Exercise'},
    consumables:{ar:'المستلزمات الطبية',en:'Medical consumables'},
    medical:{ar:'المنتجات الطبية المتخصصة',en:'Specialist medical products'},
    juzo:{ar:'عالم جوزو',en:'World of Juzo'}
  };
  function sectionTitle(hash = location.hash) {
    const section=sectionArt(hash);
    if (!section) return '';
    const lang=document.documentElement.lang === 'en' ? 'en' : 'ar';
    const title=window.OrthoCMS?.settings?.catalogueNavigation?.categories?.[section]?.title;
    return (typeof title === 'string' ? title : title?.[lang] || title?.ar) || titles[section][lang];
  }
  function beginTransition(hash, navigate) {
    stop();
    if (reduced.matches) return;
    const title=sectionTitle(hash);
    if (!title) return;
    ensureCriticalStyle();
    if(navigate||preview)showSectionCurtain(title,hash,navigate);
    else showTitle(title,sectionArt(hash),hash);
    void loadStyles();
  }
  function routeChanged() {
    if (cover?.hash !== location.hash) beginTransition(location.hash);
  }
  // Cover a normal link activation before its default hash navigation renders content.
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link=event.target.closest?.('a[href]');
    if (!link || link.hasAttribute('download') || link.target && link.target !== '_self') return;
    const next=new URL(link.href,location.href);
    if (next.origin !== location.origin || next.pathname !== location.pathname || next.search !== location.search || next.hash === location.hash || !sectionArt(next.hash)) return;
    if(!reduced.matches){event.preventDefault();beginTransition(next.hash,()=>{location.hash=next.hash;});return;}
    beginTransition(next.hash);
    queueMicrotask(() => { if (event.defaultPrevented && location.hash !== next.hash && cover?.hash === next.hash) stop(); });
  }, {capture:true});
  // Synchronous fallback also handles back/forward and programmatic hash changes.
  addEventListener('hashchange', routeChanged, {capture:true});
  addEventListener('pagehide', stop);
  addEventListener('pageshow', event => { if (event.persisted) stop(); });
  reduced.addEventListener('change', () => { if (reduced.matches) stop(); });
  // Opt-in review mode makes the prototype visible on a direct preview link.
  // It is never enabled on the ordinary storefront or its first paint.
  if (preview) {
    const replay = document.createElement('button');
    replay.type = 'button';
    replay.className = 'os-motion-preview';
    replay.hidden = true;
    replay.dataset.noTranslate = '';
    const label = () => { replay.textContent = document.documentElement.lang === 'en'
      ? 'Replay section transition' : 'إعادة عرض حركة القسم'; };
    label();
    replay.addEventListener('click', () => {
      if (sectionTitle()) routeChanged();
      else document.querySelector('a[href="#catalog/rehab"]')?.click();
    });
    document.body.append(replay);
    loadStyles().then(loaded => { replay.hidden = !loaded; });
    document.addEventListener('click', event => {
      if (event.target.closest('#languageButton')) queueMicrotask(label);
    });
    const main = document.getElementById('main');
    const ready = () => {
      if (!sectionTitle() || !main?.querySelector('h1')) return false;
      observer.disconnect();
      routeChanged();
      return true;
    };
    const observer = new MutationObserver(() => { if (ready()) observer.disconnect(); });
    if (!ready() && main) observer.observe(main, {childList: true});
    addEventListener('pagehide', () => observer.disconnect(), {once: true});
  }
})();
