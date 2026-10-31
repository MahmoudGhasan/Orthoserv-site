'use strict';
/* Website account summary. No browser-stored roles or fabricated commerce data. */
(() => {
  const esc=value=>String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const api=(path,options)=>window.OrthoAuth.accountRequest(path,options);
  const paths={orders:'M3 4h2l3 12h11l3-9H6M9 21h.01M18 21h.01',new:'M7 3h10v18H7zM10 7h4M10 11h4',progress:'M12 8v4l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',alert:'M12 3 2 21h20L12 3ZM12 9v5M12 17h.01',sales:'M4 20V12M10 20V8M16 20V3M22 20V10',refund:'M4 8a9 9 0 1 1-1 8M4 3v5h5',bell:'M5 17h14l-2-4V9a5 5 0 0 0-10 0v4l-2 4ZM10 21h4',ticket:'M3 5h18v14H8l-5 3V5ZM7 9h10M7 13h7',lock:'M6 10h12v12H6zM9 10V6a3 3 0 0 1 6 0v4',team:'M8 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 21v-4a6 6 0 0 1 12 0v4M17 4a3 3 0 0 1 0 6M17 13a5 5 0 0 1 5 5v3'};
  const icon=key=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[key] || paths.ticket}"/></svg>`;
  const unavailable=text=>`<div class="mg-empty"><strong>${esc(text)}</strong><p>A verified data source is not connected yet.</p></div>`;
  const stamp=value=>{const d=new Date(value);return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('en-SA',{dateStyle:'medium',timeStyle:'short'}).format(d);};
  const alive=(root,state)=>root.isConnected && window.OrthoAuth.state().user?.uid===state.user.uid;
  function dialog(root,title,html) {
    const box=document.createElement('dialog');box.className='mg-dialog';box.dir='ltr';
    box.innerHTML=`<div class="mg-section-head"><h2>${esc(title)}</h2><button type="button" data-close aria-label="Close">×</button></div>${html}`;
    root.append(box);box.querySelector('[data-close]').onclick=()=>box.close();
    box.addEventListener('close',()=>box.remove(),{once:true});box.showModal();return box;
  }
  function today(root,section='Dashboard') {
    dialog(root,'Continue in TODAY',`<p>Open the TODAY desktop application, then go to <strong>${esc(section)}</strong> for detailed management.</p><p class="mg-muted">A desktop launch link has not been configured.</p>`);
  }
  function orderTable(superAdmin) {
    return `<article class="mg-card"><div class="mg-section-head"><h2>${superAdmin?'Latest store orders':'Latest store orders'}</h2><button data-tab="orders" class="mg-text">View all orders →</button></div><div class="mg-table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead><tbody><tr><td colspan="4"><div class="mg-empty"><strong>Loading orders…</strong></div></td></tr></tbody></table></div></article>`;
  }
  function stats(superAdmin) {
    const items=superAdmin?[['orders','All orders','blue'],['sales','Revenue (SAR)','green'],['refund','Cancelled orders','red'],['alert','Needs attention','amber']]:[['orders','All store orders','blue'],['new','Awaiting payment','blue'],['progress','Paid / Processing','amber'],['alert','Needs attention','red']];
    return `<div class="mg-stats">${items.map(([key,label,color])=>`<article class="mg-stat mg-${color}"><div>${icon(key)}<span>${label}</span></div><strong aria-label="Unavailable">—</strong></article>`).join('')}</div>`;
  }
  function overview(root,superAdmin) {
    return `${stats(superAdmin)}${superAdmin?`<article class="mg-card"><div class="mg-section-head"><h2>${icon('sales')}Store performance</h2><span class="mg-muted">Last 7 days</span></div><div class="mg-chart"><div class="mg-empty"><strong>Loading sales…</strong></div></div></article>`:''}${orderTable(superAdmin)}<div class="mg-bottom"><article class="mg-card"><h2>${icon(superAdmin?'team':'bell')}${superAdmin?'Team overview':'Follow-ups'}</h2>${superAdmin?'<p data-team-count>Loading team…</p><p class="mg-muted">Manage team members, roles and access in TODAY.</p><button class="mg-text" data-today="Settings → Team & access">Open team settings in TODAY ↗</button>':'<div data-staff-followups><p>Loading follow-ups…</p></div>'}<button data-tab="tickets" class="mg-follow">${icon('ticket')}<span data-ticket-count>Tickets · loading…</span><span>›</span></button></article><article class="mg-card"><h2>${icon(superAdmin?'bell':'lock')}Store alerts</h2><div data-store-alerts><p>Loading updates…</p></div>${superAdmin?'':'<p class="mg-muted">All store orders are available. Support tickets are read-only for Admin.</p>'}<button class="mg-text" data-tab="tickets">View support tickets →</button></article></div>`;
  }
  async function counts(root,state,superAdmin) {
    try {
      const result=await api('/v1/tickets');
      if(!alive(root,state))return;
      if(!Number.isSafeInteger(result.open) || result.open<0)throw new Error();
      root.querySelectorAll('[data-ticket-count]').forEach(el=>{el.textContent=`${result.open} open ticket${result.open===1?'':'s'}`;});

    } catch { if(alive(root,state))root.querySelectorAll('[data-ticket-count]').forEach(el=>{el.textContent='Tickets unavailable';}); }
    if(superAdmin && root.querySelector('[data-team-count]')){
      try {
        const result=await api('/v1/team');if(!alive(root,state))return;
        if(!Array.isArray(result.members))throw new Error();
        const el=root.querySelector('[data-team-count]');
        if(el)el.textContent=`${result.members.filter(m=>m.role==='admin').length} Admins · ${result.members.filter(m=>m.role==='super-admin').length} Super Admins${result.members.length===200?' (loaded members)':''}`;
      } catch {if(alive(root,state)){const el=root.querySelector('[data-team-count]');if(el)el.textContent='Team unavailable';}}
    }
  }
  async function thread(root,state,id,onChange) {
    const box=dialog(root,'Ticket details','<p role="status">Loading ticket…</p>');
    try {
      const result=await api('/v1/tickets/'+id);if(!alive(root,state)||!box.isConnected)return;
      const ticket=result.ticket;if(!ticket || !Array.isArray(result.replies))throw new Error();
      box.innerHTML=`<div class="mg-section-head"><h2>${esc(ticket.subject)}</h2><button data-close aria-label="Close">×</button></div><p class="mg-muted">${esc(ticket.owner_name)} · ${esc(stamp(ticket.created_at))} · ${esc(ticket.status)}</p><div class="mg-message">${esc(ticket.message)}</div><h3>Replies</h3>${result.replies.map(r=>`<article class="mg-message"><strong>${esc(r.author_name)}</strong><small>${esc(stamp(r.created_at))}</small><p>${esc(r.message)}</p></article>`).join('') || '<p class="mg-muted">No replies yet.</p>'}${state.role==='super-admin'?'<form data-reply><label>Reply<textarea name="message" maxlength="5000" required rows="4"></textarea></label><p data-error role="alert"></p><div class="mg-section-head"><button class="mg-primary" type="submit">Send reply</button><button class="mg-danger" type="button" data-delete>Delete ticket</button></div></form>':`<p class="mg-muted">${state.role==='admin'?'Read-only access. Only Super Admin can reply or delete.':'The support team will reply here.'}</p>`}`;
      box.querySelector('[data-close]').onclick=()=>box.close();
      const form=box.querySelector('[data-reply]');
      if(form)form.onsubmit=async event=>{event.preventDefault();const button=form.querySelector('[type=submit]');button.disabled=true;try{await api('/v1/tickets/'+id+'/reply',{method:'POST',body:{message:form.elements.message.value}});if(!alive(root,state))return;box.close();onChange();await thread(root,state,id,onChange);}catch{form.querySelector('[data-error]').textContent='Reply could not be sent. Check your access and try again.';}finally{button.disabled=false;}};
      box.querySelector('[data-delete]')?.addEventListener('click',async()=>{
        if(!window.confirm('Permanently delete this ticket and all replies?'))return;
        const button=box.querySelector('[data-delete]');button.disabled=true;
        try{await api('/v1/tickets/'+id+'/delete',{method:'POST',body:{}});if(!alive(root,state))return;box.close();onChange();}catch{box.querySelector('[data-error]').textContent='Ticket could not be deleted. Check your access and try again.';button.disabled=false;}
      });
    }catch{if(box.isConnected){box.querySelector('[role=status]').textContent='Ticket unavailable. Close and retry.';}}
  }
  function tickets(container,state,customer=false,onCount=()=>{}) {
    container.innerHTML=`<article class="mg-card"><div class="mg-section-head"><h2>${icon('ticket')}${customer?'My tickets':'Support tickets'}</h2><button class="mg-text" data-reload>Refresh</button></div>${customer?'<form class="mg-ticket-form" data-new-ticket><label>Subject<input name="subject" maxlength="160" required></label><label>How can we help?<textarea name="message" maxlength="5000" rows="4" required></textarea></label><button class="mg-primary" type="submit">Create ticket</button><p data-create-status role="status"></p></form>':`<p class="mg-muted">${state.role==='admin'?'Read-only access to store tickets.':'Review customer tickets, send replies or delete tickets.'}</p>`}<div data-ticket-list role="status">Loading tickets…</div><button data-more class="mg-text" hidden>Show more</button></article>`;
    const list=container.querySelector('[data-ticket-list]');let entries=[],offset=0,loading=false;
    async function load(more=false){if(loading)return;loading=true;try{
      const result=await api('/v1/tickets?offset='+(more?offset:0));if(!alive(container,state))return;
      if(!Array.isArray(result.tickets))throw new Error();entries=more?entries.concat(result.tickets):result.tickets;offset=entries.length;
      list.innerHTML=entries.length?`<div class="mg-table-wrap"><table><thead><tr><th>Ticket / Subject</th>${customer?'':'<th>Customer</th>'}<th>Updated</th><th>Status</th><th></th></tr></thead><tbody>${entries.map(ticket=>`<tr><td><strong>${esc(ticket.subject)}</strong><small>#${esc(ticket.id.slice(0,8))}</small></td>${customer?'':`<td>${esc(ticket.owner_name)}</td>`}<td>${esc(stamp(ticket.updated_at))}</td><td><span class="mg-pill ${ticket.status==='replied'?'mg-fulfilled':'mg-new'}">${ticket.status==='replied'?'Replied':'Open'}</span></td><td><button class="mg-text" data-ticket="${esc(ticket.id)}">View →</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="mg-empty"><strong>No tickets yet</strong><p>New support tickets will appear here.</p></div>';
      container.querySelector('[data-more]').hidden=!result.hasMore;onCount();
      list.querySelectorAll('[data-ticket]').forEach(button=>{button.onclick=()=>thread(container,state,button.dataset.ticket,()=>load());});
    }catch{if(alive(container,state))list.innerHTML='<div class="mg-empty"><strong>Tickets unavailable</strong><p>Unable to load the support service. Use Refresh to retry.</p></div>';}finally{loading=false;}}
    container.querySelector('[data-reload]').onclick=()=>load();container.querySelector('[data-more]').onclick=()=>load(true);
    const create=container.querySelector('[data-new-ticket]');
    if(create)create.onsubmit=async event=>{event.preventDefault();const button=create.querySelector('[type=submit]');button.disabled=true;try{await api('/v1/tickets',{method:'POST',body:{subject:create.elements.subject.value,message:create.elements.message.value}});if(!alive(container,state))return;create.reset();create.querySelector('[data-create-status]').textContent='Ticket created. Our team will reply here.';await load();}catch{create.querySelector('[data-create-status]').textContent='Ticket could not be created. Please try again.';}finally{button.disabled=false;}};
    load();
  }
  const metric=value=>typeof value==='number' && Number.isFinite(value)?new Intl.NumberFormat('en-SA',{maximumFractionDigits:2}).format(value):'—';
  const sar=minor=>typeof minor==='number' && Number.isFinite(minor)?new Intl.NumberFormat('en-SA',{minimumFractionDigits:2,maximumFractionDigits:2}).format(minor/100):'—';
  function summaryOrders(summary) {
    return `<div class="mg-table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Total (SAR)</th><th>Status</th></tr></thead><tbody>${summary.orders.length?summary.orders.map(o=>`<tr><td>${esc(o.number || o.id)}</td><td>${esc(o.customer)}</td><td>${sar(o.total)}</td><td>${esc(o.status?.replaceAll('_',' ') || '—')}</td></tr>`).join(''):'<tr><td colspan="4">No orders yet.</td></tr>'}</tbody></table></div>`;
  }
  async function commerceSummary(root,panel,state,view) {
    if(state.role!=='super-admin')return;
    const generation=(root._summaryGeneration||0)+1;root._summaryGeneration=generation;
    const current=()=>alive(root,state) && root._summaryGeneration===generation && root.querySelector('[data-view][aria-current="page"]')?.dataset.view===view;
    const note=root.querySelector('.mg-sync');if(note)note.textContent='Loading store summary…';
    try {
      const s=await api('/v1/orders/summary');if(!current())return;
      if(!s || !s.kpis || !Array.isArray(s.orders) || !Array.isArray(s.daily))throw new Error();
      if(note)note.textContent=`Live website orders · ${s.start} – ${s.end} · Updated ${stamp(s.generated_at)}`;
      if(view==='overview'){
        const cards=panel.querySelectorAll('.mg-stat strong');
        [['orders',metric],['revenue',sar],['cancelled',metric],['attention',metric]].forEach(([key,format],i)=>{if(cards[i]){cards[i].textContent=format(s.kpis[key]);cards[i].setAttribute('aria-label',key+' '+format(s.kpis[key]));}});
        const chart=panel.querySelector('.mg-chart');
        if(chart){chart.classList.add('si-chart');chart.closest('.mg-card').querySelector('.mg-section-head > span')?.remove();window.OrthoStoreInsights.render(root,chart,state,'performance');}
        const wrapper=panel.querySelector('[data-tab="orders"]')?.closest('.mg-card')?.querySelector('.mg-table-wrap');
        if(wrapper)wrapper.outerHTML=summaryOrders(s);
      }else if(view==='sales'){
        panel.innerHTML=`<article class="mg-card"><h2>Sales summary</h2><p>Revenue (SAR): <strong>${sar(s.kpis.revenue)}</strong></p><p>Cancelled orders: <strong>${metric(s.kpis.cancelled)}</strong></p><p class="mg-muted">Revenue counts orders that are Paid, Processing, Shipped or Delivered.</p></article>`;
      }
    }catch{if(current() && note)note.textContent='Summary could not be loaded. Check your connection and account permissions; retry Refresh summary.';}
  }

  function render(target,state){
    if(!['admin','super-admin'].includes(state.role))return false;
    const superAdmin=state.role==='super-admin',name=state.user.displayName || state.user.email || 'there';
    const tabs=[['overview','Overview'],['orders','Orders'],['inquiries','Inquiries'],...(superAdmin?[['sales','Sales'],['team','Team']]:[]),['tickets','Tickets'],['notifications','Notifications']];
    target.innerHTML=`<section class="mg-shell wrap" lang="en" dir="ltr" data-no-translate><div class="mg-topbar"><a href="#home" class="mg-wordmark">ORTHOSERV</a><a href="#catalog">Shop</a><a href="#account" aria-current="page">My account</a><div class="mg-profile"><button data-tab="notifications" aria-label="Open notifications" class="mg-notification">${icon('bell')}<span data-badge hidden></span></button><span class="mg-avatar">${esc(name.slice(0,1).toUpperCase())}</span><span>${esc(name.split(' ')[0])}</span><button id="authLogout" class="mg-text">Sign out</button></div></div><div class="mg-content"><div class="mg-breadcrumb"><a href="#home">Home</a> / My account</div><div class="mg-section-head mg-welcome"><div><h1>Welcome back, ${esc(name.split(' ')[0])}<span class="mg-role">${superAdmin?'Super Admin':'Admin'}</span></h1><p>${superAdmin?"Here's what's happening across your store today.":'Review store orders, track progress and follow up on support tickets.'}</p></div><div><button class="mg-text" data-refresh-summary>Refresh summary</button><button class="mg-primary" data-today="Dashboard">More in TODAY ↗</button></div></div><nav class="mg-tabs" aria-label="Account sections">${tabs.map(([key,label])=>`<button data-view="${key}" aria-current="${key==='overview'?'page':'false'}">${label}</button>`).join('')}</nav><div data-panel></div><p class="mg-sync">Loading current store activity…</p></div></section>`;
    const root=target.querySelector('.mg-shell'),panel=root.querySelector('[data-panel]');
    function select(view){
      root._summaryGeneration=(root._summaryGeneration||0)+1;
      if(!tabs.some(([key])=>key===view))return;
      root.querySelectorAll('[data-view]').forEach(button=>button.setAttribute('aria-current',button.dataset.view===view?'page':'false'));
      if(view==='overview'){panel.innerHTML=overview(root,superAdmin);counts(root,state,superAdmin);window.OrthoStaffOverview.overview(root,panel,state);}
      else if(view==='inquiries'){root.querySelector('.mg-sync').textContent='';window.OrthoStoreInsights.render(root,panel,state,'inquiries');}
      else if(view==='sales'){root.querySelector('.mg-sync').textContent='';window.OrthoStoreInsights.render(root,panel,state,'performance');}
      else if(view==='notifications'){root.querySelector('.mg-sync').textContent='';window.OrthoStaffOverview.center(root,panel,state);}
      else if(view==='tickets'){tickets(panel,state,false,()=>counts(root,state,false));}
      else if(view==='orders'&&window.OrthoOrders){window.OrthoOrders.staffPanel(panel,state);}
      else if(view==='team'){panel.innerHTML='<article class="mg-card"><h2>Team overview</h2><p data-team-count>Loading team…</p><p class="mg-muted">Member creation, role changes and removal are managed in TODAY.</p><button class="mg-primary" data-today="Settings → Team & access">Open team settings in TODAY ↗</button></article>';counts(root,state,true);}
      else{const title={orders:superAdmin?'Store orders':'All store orders',inquiries:'Inquiries',sales:'Sales summary'}[view];panel.innerHTML=`<article class="mg-card"><h2>${title}</h2>${unavailable(title+' unavailable')}<button class="mg-text" data-today="Dashboard → ${view==='sales'?'Recent sales':title}">More in TODAY ↗</button></article>`;}
    }
    const baseSelect=select;
    const show=view=>{baseSelect(view);if(['overview',...(window.OrthoOrders?[]:['orders'])].includes(view))commerceSummary(root,panel,state,view);};
    root.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;if(button.hasAttribute('data-refresh-summary'))show(root.querySelector('[data-view][aria-current="page"]')?.dataset.view || 'overview');else if(button.dataset.view)show(button.dataset.view);else if(button.dataset.tab)show(button.dataset.tab);else if(button.dataset.today)today(root,button.dataset.today);});
    show('overview');window.OrthoStaffOverview.monitor(root,state);return true;
  }
  function customerTickets(target,state){const root=document.createElement('section');root.className='mg-customer';root.lang='en';root.dir='ltr';root.dataset.noTranslate='';target.querySelector('section').append(root);tickets(root,state,true);}
  window.OrthoManagement={render,customerTickets};
})();
