(() => {
  if (!window.IntersectionObserver) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const selectors = [
    '.intro-department', '.intro-category-card', '.intro-collections-heading h2',
    '.intro-collections-rail > .intro-collection-card', '.intro-collaboration-copy',
    '.intro-collage', '.intro-consultation-photo', '.intro-consultation-copy > h2',
    '.intro-footer-lead'
  ];
  const seen = new Set(), waiting = new Map(), active = new Set();
  let frame;
  function finish(el) {
    el.classList.remove('os-rv', 'os-rv-pending');
    el.style.removeProperty('--os-rv-delay');
    active.delete(el);
  }
  const observer = new IntersectionObserver(entries => {
    for (const {target, isIntersecting, intersectionRatio} of entries) {
      const item = waiting.get(target);
      if (!item || !isIntersecting || intersectionRatio < .1) continue;
      observer.unobserve(target);
      waiting.delete(target);
      seen.add(item.key);
      if (motion.matches || active.size >= 12 || target.contains(document.activeElement)) { finish(target); continue; }
      active.add(target);
      document.documentElement.classList.add('os-reveal-on');
      target.style.setProperty('--os-rv-delay', item.delay + 'ms');
      target.classList.remove('os-rv-pending');
      target.classList.add('os-rv');
    }
  }, {rootMargin: '80px 0px 80px 0px', threshold: .1});
  function stop() {
    cancelAnimationFrame(frame);
    observer.disconnect();
    waiting.forEach((_, el) => finish(el));
    waiting.clear();
    active.forEach(finish);
    document.documentElement.classList.remove('os-reveal-on');
  }
  function scan() {
    if (motion.matches || !document.body.classList.contains('intro-open')) return;
    document.documentElement.classList.add('os-reveal-on');
    selectors.forEach((selector, group) => {
      document.querySelectorAll(selector).forEach((el, i) => {
        const key = group + ':' + i;
        if (seen.has(key)) return;
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        if (rect.top < innerHeight && rect.bottom > 0 && rect.left < innerWidth && rect.right > 0) {
          seen.add(key);
          return;
        }
        waiting.set(el, {key, delay: group === 1 || group === 3 ? Math.min(i, 3) * 70 : 0});
        el.classList.add('os-rv-pending');
        observer.observe(el);
      });
    });
  }
  function start() {
    stop();
    frame = requestAnimationFrame(() => { frame = requestAnimationFrame(scan); });
  }
  function ended(event) {
    if (event.animationName !== 'os-rv-slide') return;
    const target = event.target.closest('.os-rv');
    if (target && active.has(target)) finish(target);
  }
  document.addEventListener('focusin', event => {
    const target = event.target.closest('.os-rv-pending');
    if (target) { observer.unobserve(target); waiting.delete(target); finish(target); }
  });
  document.addEventListener('animationend', ended);
  document.addEventListener('animationcancel', ended);
  motion.addEventListener('change', start);
  addEventListener('pagehide', stop);
  addEventListener('pageshow', event => { if (event.persisted) start(); });
  window.OrthoReveal = {start, stop};
  if (document.body.classList.contains('intro-open')) start();
})();
