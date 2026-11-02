'use strict';
/* Shared field contracts for static and dynamically rendered storefront forms. */
(()=>{
 const states=new WeakMap();let serial=0;
 const tr=(ar,en)=>document.documentElement.lang==='en'?en:ar;
 const digits=s=>String(s).replace(/[٠-٩۰-۹]/g,c=>String(c.charCodeAt(0)-(c<='٩'?0x660:0x6f0))).replace(/[٫]/g,'.');
 function kind(el){
  if(!(el instanceof HTMLInputElement)||el.disabled||el.readOnly||['hidden','password','search','checkbox','radio','file','date','datetime-local','time','month','week','range','color','submit','button'].includes(el.type))return '';
  const name=el.name.toLowerCase(),auto=el.autocomplete.toLowerCase();
  if(el.classList.contains('chat-cc'))return 'country';
  if(name==='postal_code'||auto==='postal-code')return 'postal';
  if(name==='building_no')return 'integer';
  if(name==='short_address')return 'short-address';
  if(el.type==='number'||el.dataset.numericField==='true')return 'number';
  if(el.type==='tel'||auto.startsWith('tel')||name==='phone')return 'phone';
  if(el.type==='email'||auto==='email')return 'email';
  if(['name','given-name','family-name','additional-name'].includes(auto)||['name','recipient'].includes(name))return 'person';
  if(el.inputMode==='numeric')return 'integer';
  return '';
 }
 function configure(el){
  const type=kind(el);if(!type)return '';
  if(!states.has(el))states.set(el,{id:'field-error-'+(++serial),node:null,touched:false});
  if(el.type==='number'){
   // Native number controls discard Arabic digits before input events; retain text with equivalent numeric constraints.
   el.dataset.numericField='true';el.type='text';el.inputMode=el.step==='1'||!el.hasAttribute('step')?'numeric':'decimal';
  }
  if(['integer','postal'].includes(type))el.inputMode='numeric';
  if(type==='email')el.inputMode='email';
  if(['phone','country'].includes(type))el.inputMode='tel';
  return type;
 }
 const characterMessage=type=>type==='person'?tr('اكتب الاسم بالحروف؛ الأرقام غير مسموحة.','Use letters for the name; numbers are not allowed.'):
  ['phone','country'].includes(type)?tr('اكتب رقمًا فقط، ويمكن استخدام + في البداية.','Use a phone number, with an optional leading +.'):
  type==='short-address'?tr('استخدم حروفًا إنجليزية وأرقامًا فقط.','Use English letters and numbers only.'):
  tr('هذه الخانة تقبل أرقامًا فقط.','This field accepts numbers only.');
 function characters(type,value){
  if(type==='person')return /^[\p{L}\p{M}\s.'’\-]*$/u.test(value);
  if(['integer','postal'].includes(type))return /^\d*$/.test(value);
  if(['phone','country'].includes(type))return /^\+?[\d ()\-]*$/.test(value);
  if(type==='short-address')return /^[a-z\d]*$/i.test(value);
  if(type==='number')return /^-?\d*(?:\.\d*)?$/.test(value);
  return true;
 }
 function message(el,type){
  const v=el.value.trim();
  if(!v)return el.required?tr('هذه الخانة مطلوبة.','This field is required.'):'';
  if(!characters(type,v))return characterMessage(type);
  if(el.minLength>0&&v.length<el.minLength)return tr('أقل عدد حروف مطلوب: ','Minimum length: ')+el.minLength;
  if(el.maxLength>=0&&el.value.length>el.maxLength)return tr('أكبر عدد حروف مسموح: ','Maximum length: ')+el.maxLength;
  if(type==='person'&&!/\p{L}/u.test(v))return tr('اكتب اسمًا صحيحًا.','Enter a valid name.');
  if(type==='phone'&&!/^\+?\d{8,15}$/.test(v.replace(/[ ()\-]/g,'')))return tr('أدخل رقم هاتف صحيحًا من 8 إلى 15 رقمًا.','Enter a valid phone number containing 8 to 15 digits.');
  if(type==='country'&&!/^\+?\d{1,4}$/.test(v))return tr('أدخل رمز دولة صحيحًا مثل +966.','Enter a valid country code, such as +966.');
  if(type==='postal'&&!/^\d{5}$/.test(v))return tr('الرمز البريدي يتكون من 5 أرقام.','The postal code must contain 5 digits.');
  if(type==='short-address'&&!/^[A-Z]{4}\d{4}$/i.test(v))return tr('العنوان المختصر: 4 حروف إنجليزية ثم 4 أرقام، مثل ABCD1234.','Use 4 English letters followed by 4 digits, such as ABCD1234.');
  if(type==='email'&&el.validity.typeMismatch)return tr('أدخل بريدًا إلكترونيًا صحيحًا مثل name@example.com.','Enter a valid email address, such as name@example.com.');
  if(type==='number'){
   const n=Number(v);if(!Number.isFinite(n)||!/-?\d/.test(v))return characterMessage(type);
   if(el.hasAttribute('min')&&n<Number(el.min))return tr('أقل قيمة مسموحة: ','Minimum value: ')+el.min;
   if(el.hasAttribute('max')&&n>Number(el.max))return tr('أكبر قيمة مسموحة: ','Maximum value: ')+el.max;
   const step=el.getAttribute('step')||'1',base=Number(el.getAttribute('min')||0);
   if(step!=='any'&&Number(step)>0&&Math.abs((n-base)/Number(step)-Math.round((n-base)/Number(step)))>1e-7)return Number(step)===1?tr('اكتب عددًا صحيحًا بدون كسور.','Enter a whole number without decimals.'):tr('استخدم زيادة مقدارها ','Use increments of ')+step;
  }
  return '';
 }
 function show(el,text){
  const state=states.get(el);if(!state)return;
  if(!state.node?.isConnected){state.node=document.createElement('span');state.node.id=state.id;state.node.className='input-error';state.node.dataset.noTranslate='';state.node.setAttribute('aria-live','polite');el.insertAdjacentElement('afterend',state.node);const refs=(el.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean);if(!refs.includes(state.id))refs.push(state.id);el.setAttribute('aria-describedby',refs.join(' '));}
  state.node.textContent=text;state.node.hidden=!text;
 }
 function validate(el,reveal=false){
  const type=configure(el);if(!type)return el.checkValidity();
  // Normalize equivalent numeral glyphs, never remove arbitrary invalid input.
  if(type!=='person'&&type!=='email'){
   const normalized=digits(el.value);if(normalized!==el.value)el.value=normalized;
   if(type==='short-address')el.value=el.value.toUpperCase();
  }
  el.setCustomValidity('');const error=message(el,type);el.setCustomValidity(error);el.setAttribute('aria-invalid',String(Boolean(error)));
  if(reveal||states.get(el).touched){states.get(el).touched=true;show(el,error);}
  return !error&&el.validity.valid;
 }
 function scan(root=document){
  if(root instanceof HTMLInputElement)configure(root);
  root.querySelectorAll?.('input').forEach(configure);
 }
 document.addEventListener('beforeinput',event=>{
  const el=event.target,type=configure(el);if(!type||event.isComposing||!event.inputType?.startsWith('insert')||typeof event.data!=='string'||type==='email')return;
  const data=type==='person'?event.data:digits(event.data),start=el.selectionStart??el.value.length,end=el.selectionEnd??start;
  const candidate=el.value.slice(0,start)+data+el.value.slice(end);
  if(!characters(type,candidate)||(type==='number'&&candidate.startsWith('-')&&el.hasAttribute('min')&&Number(el.min)>=0)){
   event.preventDefault();show(el,characterMessage(type));return;
  }
  if(data!==event.data){event.preventDefault();el.setRangeText(data,start,end,'end');el.dispatchEvent(new Event('input',{bubbles:true}));}
 },true);
 document.addEventListener('paste',event=>{
  const el=event.target,type=configure(el);if(!type||type==='email')return;
  const data=event.clipboardData?.getData('text');if(data==null)return;
  const normalized=type==='person'?data:digits(data),start=el.selectionStart??el.value.length,end=el.selectionEnd??start;
  if(!characters(type,el.value.slice(0,start)+normalized+el.value.slice(end))){event.preventDefault();show(el,characterMessage(type));}
 },true);
 document.addEventListener('input',event=>{if(event.target instanceof HTMLInputElement)validate(event.target);},true);
 document.addEventListener('focusin',event=>{configure(event.target);},true);
 document.addEventListener('focusout',event=>{if(event.target instanceof HTMLInputElement)validate(event.target,true);},true);
 document.addEventListener('invalid',event=>{if(kind(event.target))show(event.target,event.target.validationMessage);},true);
 document.addEventListener('submit',event=>{
  const form=event.target;if(!(form instanceof HTMLFormElement))return;
  let first=null;for(const el of form.elements){if(!(el instanceof HTMLInputElement)||el.disabled||el.type==='hidden')continue;if(!validate(el,true)&&!first)first=el;}
  if(!form.checkValidity()||first){event.preventDefault();event.stopImmediatePropagation();(first||form.querySelector(':invalid'))?.focus();}
 },true);
 const start=()=>{scan();new MutationObserver(list=>list.forEach(m=>m.addedNodes.forEach(node=>{if(node.nodeType===1)scan(node);}))).observe(document.body,{subtree:true,childList:true});};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 document.addEventListener('click',event=>{if(event.target.closest?.('#languageButton'))queueMicrotask(()=>document.querySelectorAll('input').forEach(el=>{if(states.has(el))validate(el);}));});
})();
