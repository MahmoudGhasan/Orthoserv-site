'use strict';
/* One 24-item append control for full catalogue lists; no observers or requests. */
(() => {
  let sequence = 0;
  function mount({grid,items,card,afterAppend}) {
    if (!grid) return null;
    if (grid.nextElementSibling?.classList.contains('os-more-controls')) grid.nextElementSibling.remove();
    const controls=document.createElement('div'),button=document.createElement('button'),status=document.createElement('p');
    controls.className='os-more-controls';controls.dataset.noTranslate='';
    grid.id ||= 'osProductBatch'+(++sequence);
    button.type='button';button.dataset.loadMore='';button.setAttribute('aria-controls',grid.id);
    status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
    controls.append(button,status);grid.after(controls);
    let shown=0;
    function append(user=false) {
      const top=scrollY,left=scrollX,start=shown;
      shown=Math.min(shown+24,items.length);
      const template=document.createElement('template');template.innerHTML=items.slice(start,shown).map(card).join('');
      const first=template.content.firstElementChild;grid.append(template.content);
      const ar=document.documentElement.lang==='ar',number=n=>new Intl.NumberFormat(ar?'ar':'en').format(n);
      button.textContent=ar?'عرض المزيد':'Show more';button.hidden=shown>=items.length;
      status.textContent=ar?`عرض ${number(shown)} من ${number(items.length)} منتج`:`Showing ${number(shown)} of ${number(items.length)} products`;
      controls.hidden=items.length<=24;
      if (user) {
        afterAppend?.();
        first?.querySelector('a[href],button')?.focus({preventScroll:true});
        window.scrollTo({top,left,behavior:'instant'});
      }
    }
    button.onclick=()=>append(true);
    const reset=next=>{items=next;shown=0;grid.replaceChildren();append();};
    reset(items);
    return {reset};
  }
  window.OrthoLoadMore={mount};
})();
