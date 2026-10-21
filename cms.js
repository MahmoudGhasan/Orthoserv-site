'use strict';
/* Content configuration only. No credentials, checkout or customer data live here. */
const cmsBase=new URL('.',document.currentScript.src);
window.OrthoCMS={settings:{},overrides:[],
 text(original,lang){const s=original.trim(),matches=this.overrides.filter(x=>x.original===s),entry=matches.find(x=>x.scope&&location.pathname.includes(x.scope))||matches.find(x=>!x.scope);if(!entry)return null;return original.replace(s,String(entry[lang]??entry.ar??entry.original));},
 prepareProducts(items){const now=Date.now();return items.filter(p=>p.visible!==false).map(p=>{const valid=typeof p.salePrice==='number'&&p.salePrice>=0&&p.salePrice<p.price;const start=p.saleStart?Date.parse(p.saleStart):-Infinity,end=p.saleEnd?Date.parse(p.saleEnd):Infinity;return valid&&now>=start&&now<=end?{...p,regularPrice:p.price,price:p.salePrice}:p;});},
 apply(){
  const s=this.settings;if(!s.hero||!document.getElementById('searchForm'))return;const lang=window.OrthoLang==='en'?'en':'ar';
  const set=(selector,value)=>{const el=document.querySelector(selector);if(el&&value!=null&&el.textContent!==String(value)){el.dataset.noTranslate='';el.textContent=String(value);}};
  const url=value=>{const text=String(value??'');return /^(?:https?:|mailto:|tel:|#)/i.test(text)||(!/^[a-z][a-z0-9+.-]*:/i.test(text)&&!text.startsWith('//'))?text:'#';};
  const hero=document.querySelector('.hero-slide[data-slide="0"]');
  if(hero){set('.hero-slide[data-slide="0"] h1',lang==='en'?s.hero.titleEn:s.hero.titleAr);set('.hero-slide[data-slide="0"] .hero-copy>p',lang==='en'?s.hero.descriptionEn:s.hero.descriptionAr);set('.hero-slide[data-slide="0"] .hero-actions .button',lang==='en'?s.hero.buttonEn:s.hero.buttonAr);hero.querySelector('.hero-actions .button').href=url(s.hero.href);hero.querySelector('.hero-visual>img').src=url(s.hero.image);}
  for(const [key,index] of [['showJuzo',1],['showShockwave',2]]){for(const el of document.querySelectorAll(`[data-slide="${index}"],[data-hero-go="${index}"]`))el.hidden=s.hero[key]===false;}
  const selectors={selectedEquipment:'#selectedEquipment',recommendations:'.recommendations',essentials:'.store-essentials',trust:'.trust-section',business:'#business'};
  for(const [key,selector] of Object.entries(selectors)){const el=document.querySelector(selector);if(el)el.hidden=s.sections?.[key]===false;}
  const c=s.contact||{};set('.legal-name',c.legalName);set('.company-address',c.address);set('.company-building',c.building);set('.footer-grid>div:first-child>p',c.footerText);
  ['registration','vat','shortAddress','postalCode'].forEach((key,i)=>set(`.company-records>div:nth-child(${i+1}) dd`,c[key]));
  let links=document.getElementById('cmsContactLinks');if(!links){links=document.createElement('div');links.id='cmsContactLinks';links.className='cms-contact-links';document.querySelector('.company-identity')?.append(links);}
  const contacts=[['phone','tel:','الهاتف','Phone'],['email','mailto:','البريد','Email'],['whatsapp','https://wa.me/','واتساب','WhatsApp']];
  const key=JSON.stringify([lang,c.phone,c.email,c.whatsapp]);if(links.dataset.version!==key){links.replaceChildren();for(const [field,prefix,ar,en] of contacts){const value=String(c[field]||'');if(!value)continue;const a=document.createElement('a');a.dataset.noTranslate='';a.textContent=lang==='en'?en:ar;a.href=url(prefix+value.replace(/[\r\n]/g,''));if(field==='whatsapp'){a.target='_blank';a.rel='noopener';}links.append(a);}links.dataset.version=key;}
  if(/^#[0-9a-f]{6}$/i.test(s.appearance?.accent||'')){document.documentElement.style.setProperty('--blue',s.appearance.accent);document.documentElement.style.setProperty('--cms-accent',s.appearance.accent);}
  if(s.appearance?.logo)for(const img of document.querySelectorAll('header img.logo,footer .footer-grid>div:first-child img'))img.src=url(s.appearance.logo);
  const ad=document.getElementById('juzoAd');if(ad)ad.hidden=s.ad?.enabled===false;
  const all=[...document.querySelectorAll('header a,footer a')].filter(a=>!a.closest('#cmsContactLinks'));const keyed=new Map(all.filter(a=>a.hasAttribute('data-link-key')).map(a=>[a.getAttribute('data-link-key'),a]));(s.links||[]).forEach((entry,i)=>{const anchor=Object.prototype.hasOwnProperty.call(entry,'key')?keyed.get(entry.key):all[i];if(anchor)anchor.href=url(entry.href);});
  const description=document.querySelector('meta[name="description"]');if(description)description.content=lang==='en'?s.seo?.descriptionEn||'':s.seo?.descriptionAr||'';
  if(!location.hash||location.hash==='#home')document.title=lang==='en'?s.seo?.titleEn||'OrthoServ':s.seo?.titleAr||'OrthoServ';
 }
};
window.OrthoCMSReady=Promise.all([fetch(new URL('site-settings.json',cmsBase)).then(r=>{if(!r.ok)throw Error('settings');return r.json();}),fetch(new URL('content-overrides.json',cmsBase)).then(r=>{if(!r.ok)throw Error('text');return r.json();})]).then(([settings,content])=>{window.OrthoCMS.settings=settings;window.OrthoCMS.overrides=content.overrides||[];window.dispatchEvent(new Event('orthocms:ready'));});

// The embedded experiences use their own layout and language controls.
// Apply their editable copy without changing the layout or event handlers.
window.OrthoCMSReady.then(()=>{
 if(document.getElementById('searchForm'))return;
 const cache=new WeakMap();
 const apply=()=>{
  const lang=document.documentElement.lang==='en'?'en':'ar';
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){
   const node=walker.currentNode;if(node.parentElement?.closest('script,style,input,textarea'))continue;
   let r=cache.get(node);if(!r||node.nodeValue!==r.last)r={original:node.nodeValue,last:node.nodeValue};
   const next=window.OrthoCMS.text(r.original,lang);if(next!=null&&node.nodeValue!==next)node.nodeValue=next;
   r.last=node.nodeValue;cache.set(node,r);
  }
 };
 apply();const observer=new MutationObserver(apply);observer.observe(document.body,{childList:true,subtree:true,characterData:true});observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
});
