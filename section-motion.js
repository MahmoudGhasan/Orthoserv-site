/* Public-section name transition: product content remains immediately visible. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!Element.prototype.animate) return;
  const preview = new URLSearchParams(location.search).get('motion-preview') === '1';
  const stylesheet = new URL('section-motion.css?v=20261117-composed', document.currentScript.src);
  let cssReady;
  function loadStyles() {
    return cssReady ||= new Promise(resolve => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = stylesheet.href;
      link.onload = () => resolve(true);
      link.onerror = () => resolve(false);
      document.head.append(link);
    });
  }
  let root = null, generation = 0, cover = null;
  function closeCover(completed = false) {
    const state = cover;
    if (!state) return;
    cover = null;
    clearTimeout(state.timer);
    state.animations.forEach(animation => animation.cancel());
    state.element.remove();
    state.resolve(completed);
  }
  const sectionArt = hash => /^#(?:catalog\/(?:rehab|gym|consumables|medical)|brand\/juzo)$/.test(hash)
    ? hash.split('/').pop() : null;
  const artUrl = section => new URL('assets/transitions/'+section+'.webp', stylesheet).href;
  const warmed = new Set();
  const warmArt = event => {
    const link = event.target.closest?.('a[href]');
    if (!link) return;
    const section = sectionArt(new URL(link.href, location.href).hash);
    if (!section || warmed.has(section) || reduced.matches) return;
    warmed.add(section);
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
  function showTitle(title) {
    return new Promise(resolve => {
      const element = document.createElement('div');
      element.className = 'os-page-cover';
      element.dataset.section = sectionArt(location.hash);
      element.setAttribute('aria-hidden', 'true');
      element.dataset.noTranslate = '';
      element.dir = document.documentElement.dir;
      const heading = document.createElement('div');
      heading.className = 'os-page-cover-title';
      const state = {element, animations: [], resolve, timer: null};
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
      state.animations.push(element.animate([{opacity: 0}, {opacity: 1}], {duration: 90}));
      state.timer = setTimeout(() => {
        if (cover !== state) return;
        const exit = element.animate([{opacity: 1}, {opacity: 0}],
          {duration: 240, easing: 'ease-out', fill: 'forwards'});
        state.animations.push(exit);
        exit.finished.then(() => { if (cover === state) closeCover(true); }, () => {});
      }, 760);
    });
  }
  function stop() {
    generation++;
    closeCover();
    root = null;
  }
  function sectionHeading() {
    if (!/^#(?:catalog\/(?:rehab|gym|consumables|medical)|brand\/juzo)$/.test(location.hash)) return null;
    const scope = document.getElementById('main');
    return [...(scope?.querySelectorAll('h1') || []), ...(scope?.querySelectorAll('h2') || [])]
      .find(heading => heading.getClientRects().length && heading.innerText.trim());
  }
  function routeChanged() {
    stop();
    const current = generation;
    queueMicrotask(async () => {
      if (current !== generation || reduced.matches) return;
      root = sectionHeading();
      if (!root) return;
      if (!await loadStyles() || current !== generation || !root?.isConnected) return;
      const title = location.hash === '#brand/juzo' ? (document.documentElement.lang === 'en' ? 'World of Juzo' : 'عالم جوزو') : root.innerText.trim();
      if (!title || !await showTitle(title) || current !== generation || !root?.isConnected) return;

    });
  }
  addEventListener('hashchange', routeChanged);
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
      if (sectionHeading()) routeChanged();
      else location.hash = 'catalog/rehab';
    });
    document.body.append(replay);
    loadStyles().then(loaded => { replay.hidden = !loaded; });
    document.addEventListener('click', event => {
      if (event.target.closest('#languageButton')) queueMicrotask(label);
    });
    const main = document.getElementById('main');
    const ready = () => {
      if (!sectionHeading()) return false;
      observer.disconnect();
      routeChanged();
      return true;
    };
    const observer = new MutationObserver(() => { if (ready()) observer.disconnect(); });
    if (!ready() && main) observer.observe(main, {childList: true});
    addEventListener('pagehide', () => observer.disconnect(), {once: true});
  }
})();
