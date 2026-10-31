'use strict';
// Uses the existing verified account session. No report tokens or copied customer data.
(()=>{
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=v=>Number.isSafeInteger(v)?new Intl.NumberFormat('en-SA',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v/100):'—';
 const stamp=ms=>new Intl.DateTimeFormat('en-SA',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Riyadh'}).format(new Date(ms));
 const day=ms=>new Date(ms+10800000).toISOString().slice(0,10);
 const choice=(option,names)=>{
  const chunks=String(option||'').split(/[·|;\n]/).map(s=>s.trim());
  for(const name of names)for(const part of chunks){const at=part.indexOf(':');if(at>0&&part.slice(0,at).trim().toLowerCase()===name)return part.slice(at+1).trim()||'—';}
  return '—';
 };
 function render(root,target,state,kind){
  if(state.role!=='super-admin'){target.innerHTML='<article class="mg-card"><h2>Inquiries</h2><p>Only Super Admin can view store-wide contact submissions.</p></article>';return;}
  const inquiry=kind==='inquiries',today=day(Date.now()),start=day(Date.now()-29*86400000);
  let rows=[],total=null,busy=false,revision=0,hasMore=false,kpis=null;
  target.classList.add('si-host');
  target.innerHTML=`<div class="si-content"><div class="si-head"><div><h2>${inquiry?'Inquiries':'Products sold'}</h2><p class="mg-muted">${inquiry?'The same contact submissions available in TODAY Leads.':'Paid orders only · quantities, recorded prices and saved product choices.'}</p></div></div><form class="si-filters"><label>From<input type="date" name="from" value="${start}" required></label><label>To<input type="date" name="to" value="${today}" required></label><button class="mg-primary" type="submit">Apply period</button><label class="si-search">${inquiry?'Search name, phone or message':'Search product or option'}<input type="search" name="search" placeholder="Search loaded records…"></label></form><div data-si-kpis></div><p data-si-status role="status">Loading…</p><div data-si-table></div><button class="mg-text" data-si-more hidden>Show more</button><p class="mg-muted si-note" data-si-source></p></div>`;
  const form=target.querySelector('form'),table=target.querySelector('[data-si-table]'),status=target.querySelector('[data-si-status]'),more=target.querySelector('[data-si-more]');
  const alive=()=>target.contains(form)&&target.isConnected&&root.isConnected&&window.OrthoAuth.state().user?.uid===state.user.uid&&window.OrthoAuth.state().role==='super-admin';
  function draw(){
   const term=form.elements.search.value.trim().toLowerCase(),shown=rows.filter(r=>Object.values(r).some(v=>String(v??'').toLowerCase().includes(term)));
   target.querySelector('[data-si-kpis]').innerHTML=inquiry?`<div class="si-kpis"><div><span>Contact submissions</span><strong>${total??'—'}</strong></div><div><span>Loaded</span><strong>${rows.length}</strong></div></div>`:`<div class="si-kpis"><div><span>Product revenue (SAR)</span><strong>${money(kpis?.revenue)}</strong></div><div><span>Paid orders</span><strong>${kpis?.orders??'—'}</strong></div><div><span>Units sold</span><strong>${kpis?.quantity??'—'}</strong></div><div><span>Returns</span><strong>—</strong></div></div>`;
   if(!shown.length){table.innerHTML=`<div class="mg-empty"><strong>${term?'No matching loaded records':inquiry?'No inquiries in this period':'No paid sales in this period'}</strong><p>${inquiry?'Change the period or refresh to check submissions.':'Awaiting-payment and cancelled orders are excluded.'}</p></div>`;return;}
   const head=inquiry?['Customer','Message','Origin','Received (Riyadh)']:['Product','Colour','Size / model','Units','Unit price (SAR)','Product revenue (SAR)','Orders'];
   table.innerHTML=`<div class="mg-table-wrap"><table class="si-table"><thead><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${shown.map(r=>inquiry?`<tr><td><strong dir="auto">${esc(r.name||'—')}</strong><span dir="ltr">${esc(r.phone||'—')}</span><span dir="ltr">${esc(r.email||'')}</span></td><td><span class="mg-pill mg-new">${r.kind==='contact_form'?'Contact form':'Chat popup'}</span><strong dir="auto">${esc(r.subject||'')}</strong><p class="si-message" dir="auto">${esc(r.message||'—')}</p></td><td><span>Page: <bdi>${esc(r.page||'—')}</bdi></span><span>Product: <bdi>${esc(r.productId||'—')}</bdi></span><span>Source: <bdi>${esc(r.sourceHost||'—')}</bdi></span><span>${esc([r.city,r.device].filter(Boolean).join(' · ')||'—')}</span></td><td>${esc(stamp(r.atMs))}</td></tr>`:`<tr><td><strong dir="auto">${esc(r.name||r.productId)}</strong><span dir="auto">${esc(r.option||'—')}</span><small>${esc(r.productId)}</small></td><td dir="auto">${esc(choice(r.option,['color','colour','اللون']))}</td><td dir="auto">${esc([choice(r.option,['size','المقاس']),choice(r.option,['model','الموديل'])].filter(v=>v!=='—').join(' / ')||'—')}</td><td>${esc(r.quantity)}</td><td>${money(r.unit)}</td><td>${money(r.revenue)}</td><td>${esc(r.orders)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  async function load(append=false){
   if(append&&busy)return;
   const version=++revision;busy=true;more.disabled=true;status.textContent='Loading…';form.querySelector('button').disabled=true;
   const offset=append?rows.length:0;
   try{
    const params=new URLSearchParams({from:form.elements.from.value,to:form.elements.to.value,offset:String(offset)});
    const data=await window.OrthoAuth.accountRequest('/v1/'+(inquiry?'inquiries':'performance')+'?'+params);
    if(!alive()||version!==revision)return;
    const incoming=inquiry?data.leads:data.rows;
    if(!Array.isArray(incoming)||!Number.isSafeInteger(data.total)||(!inquiry&&!data.kpis))throw Error('invalid_response');
    rows=append?rows.concat(incoming):incoming;total=data.total;kpis=data.kpis;hasMore=data.hasMore===true;draw();
    status.textContent=`Showing ${rows.length} of ${total} ${inquiry?'submissions':'product / option / price combinations'}`;
    target.querySelector('[data-si-source]').textContent=`${data.source} · ${data.period.start} – ${data.period.end} · Updated ${stamp(data.generatedAt)}${inquiry?'':' · Line totals exclude shipping and order-level tax. Returns are not recorded by this source.'}`;
    more.hidden=!hasMore;
   }catch(error){
    if(!alive()||version!==revision)return;
    // Never leave a stale period's totals looking current after an error.
    rows=[];total=null;kpis=null;target.querySelector('[data-si-kpis]').replaceChildren();table.replaceChildren();more.hidden=true;
    status.textContent=error.status===403?'Super Admin access is required.':'Could not load records. Check your connection and selected dates, then retry.';
    target.querySelector('[data-si-source]').textContent='';
   }finally{if(alive()&&version===revision){busy=false;more.disabled=false;form.querySelector('button').disabled=false;}}
  }
  form.onsubmit=event=>{event.preventDefault();load();};form.elements.search.oninput=draw;more.onclick=()=>load(true);load();
 }
 window.OrthoStoreInsights={render};
})();
