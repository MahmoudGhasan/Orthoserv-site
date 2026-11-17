/* Public-section name transition: product content remains immediately visible. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!Element.prototype.animate) return;
  const preview = new URLSearchParams(location.search).get('motion-preview') === '1';
  const stylesheet = new URL('section-motion.css?v=20261116-title-prototype', document.currentScript.src);
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
  function showTitle(title) {
    return new Promise(resolve => {
      const element = document.createElement('div');
      element.className = 'os-page-cover';
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
      element.append(heading);
      document.body.append(element);
      state.animations.push(element.animate([{opacity: 0}, {opacity: 1}], {duration: 90}));
      state.timer = setTimeout(() => {
        if (cover !== state) return;
        const exit = element.animate([{opacity: 1}, {opacity: 0}],
          {duration: 240, easing: 'ease-out', fill: 'forwards'});
        state.animations.push(exit);
        exit.finished.then(() => { if (cover === state) closeCover(true); }, () => {});
      }, 580);
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
      const title = root.innerText.trim();
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
