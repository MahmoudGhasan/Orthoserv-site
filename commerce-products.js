'use strict';
/* Optional Phase 2 fields. Legacy products without commerce metadata are unchanged.
   This remains a demo storefront: no orders, payments or stock integration. */
(() => {
 const raw=new Map();
 const lang=()=>window.OrthoLang==='en'?'en':'ar';
 const text=(pair,fallback='')=>pair?.[lang()]||fallback;
 const active=o=>o&&!o.paused&&(!o.start||Date.now()>=Date.parse(o.start))&&(!o.end||Date.now()<Date.parse(o.end));
 const safe=value=>{const v=String(value||'');return !/[\x00-\x1f\\]/.test(v)&&!v.startsWith('//')&&(/^(https?:|#)/i.test(v)||!(/^[a-z][a-z0-9+.-]*:/i.test(v)))?v:'';};
 const campaigns=()=>[...new Map([...raw.values()].map(p=>p.commerce?.appliedOffer).filter(o=>active(o)&&o.products.every(id=>raw.get(id)?.visible!==false&&!['draft','hidden'].includes(raw.get(id)?.commerce?.status))).map(o=>[o.id,o])).values()];
 const quantity=(cart,id)=>cart.filter(x=>!x.giftFor&&x.id===id).reduce((n,x)=>n+x.qty,0);
 const sets=(cart,offer)=>Math.max(0,Math.min(...offer.products.map(id=>quantity(cart,id))));
 function syncCart(cart,products){
  if(!raw.size)return cart;
  const result=cart.filter(x=>!x.giftFor);
  for(const offer of campaigns()){
   if(offer.type!=='accessory'||!offer.accessory||!products.some(p=>p.id===offer.accessory))continue;
   const count=sets(result,offer);
   if(count>0)result.push({id:offer.accessory,option:'Gift / هدية',qty:Math.min(99,count),giftFor:offer.id});
  }
  return result;
 }
 function lineTotal(product,item,cart){
  if(!product)return 0;
  if(item.giftFor)return campaigns().some(o=>o.id===item.giftFor&&o.type==='accessory'&&o.accessory===item.id&&sets(cart,o)>0)?0:(product.price||0)*item.qty;
  const offer=product.commerce?.appliedOffer;
  if(!active(offer)||offer.type!=='bundle')return Math.round((product.price||0)*item.qty*100)/100;
  const count=sets(cart,offer);if(!count)return Math.round((product.price||0)*item.qty*100)/100;
  const prices=offer.products.map(id=>Math.round((raw.get(id)?.price||0)*100)),total=prices.reduce((a,b)=>a+b,0);
  if(!total)return 0;
  const discount=Math.round(offer.value*100);let remainder=discount;
  const shares=prices.map((price,i)=>{const share=i===prices.length-1?remainder:Math.floor(discount*price/total);remainder-=share;return share;});
  const previous=cart.slice(0,cart.indexOf(item)).filter(x=>!x.giftFor&&x.id===item.id).reduce((n,x)=>n+x.qty,0);
  const eligible=Math.max(0,Math.min(item.qty,count-previous));
  return Math.max(0,Math.round((product.price||0)*item.qty*100)-shares[offer.products.indexOf(item.id)]*eligible)/100;
 }
 const prepare=window.OrthoCMS.prepareProducts.bind(window.OrthoCMS);
 window.OrthoCMS.prepareProducts=items=>{
  raw.clear();for(const item of items)raw.set(item.id,item);
  return prepare(items).filter(p=>!['draft','hidden'].includes(p.commerce?.status)).map(p=>{
   const compare=p.commerce?.compareAt;
   return typeof compare==='number'&&compare>p.price&&!p.regularPrice?{...p,regularPrice:compare}:p;
  }).sort((a,b)=>(a.commerce?.sortOrder??Number.MAX_SAFE_INTEGER)-(b.commerce?.sortOrder??Number.MAX_SAFE_INTEGER));
 };
 function element(tag,content,className){const node=document.createElement(tag);if(content!=null)node.textContent=content;if(className)node.className=className;node.dataset.noTranslate='';return node;}
 function rich(target,html){
  const parsed=new DOMParser().parseFromString(String(html||''),'text/html');
  const allowed=new Set(['B','STRONG','I','EM','UL','OL','LI','P','BR']);
  const append=(source,destination)=>{for(const child of source.childNodes){if(child.nodeType===Node.TEXT_NODE)destination.append(document.createTextNode(child.textContent));else if(child.nodeType===Node.ELEMENT_NODE&&!['SCRIPT','STYLE','HEAD'].includes(child.tagName)){const node=allowed.has(child.tagName)?document.createElement(child.tagName.toLowerCase()):document.createDocumentFragment();append(child,node);destination.append(node);}}};
  append(parsed.body,target);
 }
 function offerCard(offer){
  const card=element('article',null,'commerce-offer');
  if(safe(offer.banner)){const image=element('img');image.src=safe(offer.banner);image.alt=text(offer.name);image.loading='lazy';image.decoding='async';card.append(image);}
  card.append(element('h2',text(offer.name)));
  card.append(element('p',text(offer.badge)));
  for(const id of offer.products){const p=raw.get(id);if(!p)continue;const a=element('a',lang()==='ar'?(p.titleAr||p.name):p.name);a.href='#product/'+encodeURIComponent(id);a.style.marginInlineEnd='18px';card.append(a);}
  const rule=offer.type==='percentage'?offer.value+'%':offer.type==='fixed'?offer.value+' SAR':offer.type==='bundle'?(lang()==='ar'?'خصم باقة كاملة: ':'Complete-set discount: ')+offer.value+' SAR':(lang()==='ar'?'هدية مع المجموعة: ':'Gift with the complete set: ')+(raw.get(offer.accessory)?.name||offer.accessory);
  card.append(element('p',rule));return card;
 }
 function renderOffers(main){
  const section=element('section',null,'wrap section');section.append(element('h1',lang()==='ar'?'العروض':'Offers'));
  section.append(element('p',lang()==='ar'?'معاينة تجريبية فقط. لا تُرسل طلبات ولا تُحصّل أموال.':'Demo only. No orders are transmitted and no payments are collected.'));
  const list=campaigns().filter(o=>o.placements?.includes('offers'));
  for(const offer of list)section.append(offerCard(offer));
  if(!list.length)section.append(element('p',lang()==='ar'?'لا توجد عروض نشطة.':'No active offers.'));
  main.replaceChildren(section);document.title=(lang()==='ar'?'العروض':'Offers')+' | OrthoServ';
  main.dataset.commerceOffersLang=lang();
 }
 let scheduled=false;
 function enhance(){
  scheduled=false;const main=document.getElementById('main');if(!main)return;
  if(location.hash==='#offers'){
   if(main.dataset.commerceOffersLang!==lang())renderOffers(main);return;
  }
  delete main.dataset.commerceOffersLang;
  for(const card of main.querySelectorAll('.product-card')){
   const link=card.querySelector('a[href^="#product/"]');if(!link)continue;
   const p=raw.get(decodeURIComponent(link.hash.slice(9)));const info=p?.commerce;if(!info)continue;
   const offer=info.appliedOffer||(typeof p.salePrice==='number'&&info.manualOffer?{start:p.saleStart,end:p.saleEnd,badge:info.manualOffer.badge,placements:['cards']}:null);const badge=active(offer)&&offer.placements?.includes('cards')?text(offer.badge,text(offer.name)):null;
   let node=card.querySelector('.commerce-badge');
   if(badge){if(!node){node=element('span',null,'commerce-badge');card.querySelector('.product-info')?.prepend(node);}if(node.textContent!==badge)node.textContent=badge;}else node?.remove();
  }
  const id=location.hash.startsWith('#product/')?decodeURIComponent(location.hash.slice(9)):null,p=raw.get(id),info=p?.commerce;
  const extra=main.querySelector('.detail-extra');
  if(info&&extra){
   const signature=id+'|'+lang()+'|'+(info.updatedAt||'');let block=extra.querySelector('.commerce-details');
   if(!block||block.dataset.signature!==signature){
    block?.remove();block=element('section',null,'commerce-details');block.dataset.signature=signature;block.style.padding='18px 0';
    if(text(info.shortDescription))block.append(element('p',text(info.shortDescription)));
    rich(block,text(info.description));
    const spec=element('dl');for(const row of info.specifications||[]){spec.append(element('dt',text(row.name)),element('dd',text(row.value)));}block.append(spec);
    const features=element('ul');for(const value of info.features?.[lang()]||[])features.append(element('li',value));block.append(features);
    for(const [key,ar,en] of [['accessories','الملحقات','Accessories'],['warranty','الضمان','Warranty'],['origin','المنشأ','Origin'],['certifications','الاعتمادات','Certifications'],['applications','الاستخدامات','Applications'],['leadTime','مدة التوريد','Lead time']])if(text(info[key])){block.append(element('h3',lang()==='ar'?ar:en),element('p',text(info[key])));}
    for(const attachment of info.attachments||[]){if(!safe(attachment.file))continue;const a=element('a',text(attachment.label,attachment.file));a.href=safe(attachment.file);a.target='_blank';a.rel='noopener';block.append(a,element('br'));}
    if(/^https?:/i.test(info.videoUrl||'')){const a=element('a',lang()==='ar'?'الفيديو':'Video');a.href=safe(info.videoUrl);a.target='_blank';a.rel='noopener';block.append(a);}
    extra.prepend(block);
   }
   const title=text(info.metaTitle);if(title&&document.title!==title)document.title=title;
   const description=document.querySelector('meta[name="description"]');if(description&&text(info.metaDescription)&&description.content!==text(info.metaDescription))description.content=text(info.metaDescription);
   const heading=main.querySelector('.detail-copy h1');const name=lang()==='ar'?p.titleAr:p.name;if(heading&&name&&heading.textContent!==name){heading.dataset.noTranslate='';heading.textContent=name;}
   if(typeof info.vatIncluded==='boolean'){
    const note=main.querySelector('.detail-price p');const value=info.vatIncluded?(lang()==='ar'?'شامل الضريبة':'VAT included'):(lang()==='ar'?'غير شامل الضريبة':'VAT excluded');
    if(note&&note.textContent!==value){note.dataset.noTranslate='';note.textContent=value;}
   }
   if(info.quoteEnabled&&!main.querySelector('.commerce-quote')&&p.method==='buy'){
    const button=element('button',lang()==='ar'?'طلب عرض سعر':'Request quote','button commerce-quote');button.dataset.quote=p.id;main.querySelector('.detail-copy')?.append(button);
   }
   if(info.related?.length){
    const section=main.querySelector('.commerce-related')||element('div',null,'commerce-related');
    const signatureRelated=lang()+'|'+info.related.join(',');
    if(section.dataset.signature!==signatureRelated){section.replaceChildren(element('h3',lang()==='ar'?'منتجات مرتبطة':'Related products'));for(const pid of info.related){const other=raw.get(pid);if(!other||other.visible===false)continue;const a=element('a',lang()==='ar'?(other.titleAr||other.name):other.name);a.href='#product/'+encodeURIComponent(pid);a.style.marginInlineEnd='18px';section.append(a);}section.dataset.signature=signatureRelated;extra.append(section);}
   }
  }
  const home=!location.hash||location.hash==='#home';const offers=home?campaigns().filter(o=>o.placements?.includes('home')):[];
  const old=main.querySelector('.commerce-home-offers');const signature=lang()+'|'+offers.map(o=>o.id).join(',');
  if(offers.length){if(!old||old.dataset.signature!==signature){old?.remove();const section=element('section',null,'wrap commerce-home-offers');section.dataset.signature=signature;for(const offer of offers)section.append(offerCard(offer));const a=element('a',lang()==='ar'?'كل العروض':'All offers');a.href='#offers';section.append(a);main.append(section);}}else old?.remove();
 }
 function schedule(){if(!scheduled){scheduled=true;queueMicrotask(enhance);}}
 window.OrthoCommerce={syncCart,lineTotal,renderOffers};
 document.addEventListener('DOMContentLoaded',()=>{
  const main=document.getElementById('main');if(main)new MutationObserver(schedule).observe(main,{childList:true,subtree:true});
  const root=document.documentElement;if(root)new MutationObserver(schedule).observe(root,{attributes:true,attributeFilter:['lang']});schedule();
 });
 window.addEventListener('hashchange',schedule);
})();
