'use strict';

// Original console photograph and official EMS Blue handpiece photograph.
// Hose pixels are sampled from the official asset and mapped along a live curve.
const CONFIG = Object.freeze({
  original:{width:884,height:817},
  console:{
    original:{width:1080,height:1080},crop:{x:120,y:330,width:770,height:510},plug:{x:761,y:800},
    mask:[[214,337],[792,337],[842,414],[887,414],[879,544],[860,544],[874,738],[866,768],[831,784],[828,816],[815,838],[778,838],[760,818],[199,818],[198,837],[173,837],[162,816],[164,785],[143,779],[126,757],[122,730],[143,429]]
  },
  handpiece:{
    original:{width:848,height:548},crop:{x:330,y:0,width:518,height:548},
    inlet:{x:340,y:300},tip:{x:824,y:523},axisDeg:59,coneDeg:30,
    mask:[[330,0],[848,0],[848,548],[330,548]]
  },
  motion:{y:2.5,x:1.5,rotation:.25,period:8,pointer:2,recoil:.8,recoilDuration:.14},
  cable:{stiffness:42,damping:11,lagGain:.8,desktopBendX:.37,mobileBendX:.05},
  pulse:{delay:.6,interval:[1.4,.55],rings:[3,5],radius:[380,520],duration:1.9,stagger:.12,segments:28,alpha:.32,alphaBoost:.15,line:[2,.5],flashDuration:.16,flashRadius:17,glowBoost:.4},
  mobile:{breakpoint:640,interval:1.8,rings:2,radius:260},
  scroll:{distanceVh:160,scrub:.6,handpieceTravel:{x:10,y:-6,rotation:.6}},dprCap:2,orbitPeriod:90
});

(() => {
  const $=s=>document.querySelector(s),root=document.documentElement;
  const canvas=$('#pulseCanvas'),ctx=canvas.getContext('2d',{alpha:true});
  const art=$('#artwork'),hand=$('#handpieceMotion'),cable=$('#cableCanvas'),hoseCtx=cable.getContext('2d',{alpha:true});
  const debug=new URLSearchParams(location.search).get('debug')==='1';
  const forceReduced=new URLSearchParams(location.search).get('motion')==='reduce';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width: 639px)');
  const ar={};document.querySelectorAll('[data-copy]').forEach(el=>ar[el.dataset.copy]=el.textContent);ar.scroll='مرّر لاكتشاف الموديلات';
  Object.assign(ar,{resume:'تشغيل الحركة',static:'عرض ثابت · تمرير عادي',reduced:'عرض ثابت حسب تفضيل الحركة',mobile:'استكشف الجهاز بالتمرير',quoteTitle:'طلب عرض سعر — EMS DolorClast',quoteBody:'نقطة طلب عرض السعر للمراجعة. مسار الاستفسار الكامل يُبنى بعد اعتماد المشهد.',destination:'هذه الصفحة مخصصة لأجهزة الشوك ويف.',close:'إغلاق',modelsTitle:'أربع وحدات. عالم واحد من الدقّة.',modelsIntro:'اكتشف موديلات الشوك ويف لدى أورثوسيرف، واختر الجهاز المناسب لتجهيز عيادتك.',modelsNote:'التجهيزات والتوافر والضمان تُؤكَّد عند طلب عرض السعر.'});
  const en={skipContent:'Skip to content',products:'Products',services:'Services',business:'Business solutions',quote:'Request a quote',skipAnimation:'Skip animation',resume:'Enable animation',static:'Static view · native scrolling',reduced:'Static view · reduced motion',mobile:'Scroll to explore the device',headline1:'Radial shock wave therapy.',headline2:'Built for the clinic.',body:'EMS radial shock wave technology for physiotherapy clinics and rehabilitation centers.',explore:'Explore the device',authorized:'[Authorized distributor: to be confirmed]',registration:'[SFDA/MDMA No.: to be confirmed]',warranty:'[Warranty & service included: to be confirmed]',pulseCaption:'Illustration of radial pulses',demoNote:'Animation illustrates device movement; it is not a treatment simulation.',scroll:'Scroll to explore the collection',deviceName:'Device',specifications:'Specifications',unconfirmed:'[To be confirmed]',availability:'Availability in Saudi Arabia',noSubmission:'Request submission is not connected. No requests are sent or data collected.',return:'Return to the scene',quoteTitle:'Request a quote — EMS DolorClast',quoteBody:'Quote entry for scene review. The full enquiry journey follows scene approval.',destination:'This page is dedicated to shock wave equipment.',close:'Close',modelsTitle:'Four devices. One world of precision.',modelsIntro:'Explore the OrthoServ shock wave collection and find the device for your clinic.',modelsNote:'Configuration, availability and warranty are confirmed with your quotation.'};
  let products=[];
  const s={lang:'ar',ready:false,inView:false,running:false,skipped:false,mobile:mobile.matches,reduced:reduced.matches||forceReduced,clock:0,next:.6,progress:{value:0},intensity:0,pulses:[],flash:-100,width:1,height:1,dpr:1,hp:null,body:null,pose:{x:0,y:0,r:-18},spring:{x:0,y:0,vx:0,vy:0},pointer:{x:0,y:0},timeline:null,dialog:'quote',debugAt:0};
  const t=k=>(s.lang==='ar'?ar:en)[k]||ar[k]||k;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const mix=(a,b,p)=>a+(b-a)*p;
  const axis=CONFIG.handpiece.axisDeg*Math.PI/180,cone=CONFIG.handpiece.coneDeg*Math.PI/180;

  function maskPhoto(id,part){
    const image=$(id),c=part.crop,original=part.original||CONFIG.original;
    image.style.inlineSize=`${original.width/c.width*100}%`;
    image.style.insetInlineStart=`${-c.x/c.width*100}%`;
    image.style.insetBlockStart=`${-c.y/c.height*100}%`;
    image.style.clipPath=`polygon(${part.mask.map(p=>`${p[0]/original.width*100}% ${p[1]/original.height*100}%`).join(',')})`;
  }
  maskPhoto('#consoleImage',CONFIG.console);maskPhoto('#handpieceImage',CONFIG.handpiece);

  function anchor(box,part,point,pose={x:0,y:0,r:0}){
    const px=(point.x-part.crop.x)/part.crop.width*box.w-box.w/2;
    const py=(point.y-part.crop.y)/part.crop.height*box.h-box.h/2;
    const rad=pose.r*Math.PI/180;
    return{x:box.x+box.w/2+(px*Math.cos(rad)-py*Math.sin(rad))*(pose.scale??1)+pose.x,y:box.y+box.h/2+(px*Math.sin(rad)+py*Math.cos(rad))*(pose.flipY??1)*(pose.scale??1)+pose.y};
  }
  function measure(){
    const a=art.getBoundingClientRect(),hp=$('#handpieceBox').getBoundingClientRect(),body=$('#consoleBox').getBoundingClientRect();
    if(!a.width||!a.height)return;
    s.width=a.width;s.height=a.height;s.dpr=Math.min(devicePixelRatio||1,CONFIG.dprCap);
    s.hp={x:hp.x-a.x,y:hp.y-a.y,w:hp.width,h:hp.height};s.body={x:body.x-a.x,y:body.y-a.y,w:body.width,h:body.height};
    canvas.width=Math.round(a.width*s.dpr);canvas.height=Math.round(a.height*s.dpr);
    s.travelDistance=$('#shockwave-models').getBoundingClientRect().top-a.top+40;
    cable.width=canvas.width;cable.height=Math.round((s.height+Math.max(430,s.travelDistance))*s.dpr);cable.style.height=`${s.height+Math.max(430,s.travelDistance)}px`;
    drawCable();if(!s.running)staticFrame();
  }
  // Photograph-derived hose: each strip retains the manufacturer's real
  // transverse shading. Only its path changes; no synthetic metallic strokes.
  const hoseSource=new Image();hoseSource.src='assets/ems-blue-handpiece-official.png';hoseSource.addEventListener('load',()=>{if(s.ready&&!s.running)staticFrame();});
  const hoseCenters=[[0,442],[30,438],[60,434],[90,429],[120,422],[150,414],[180,403],[210,390],[240,375],[270,356],[300,334],[330,309],[340,300]];
  function sourcePoint(u){const f=u*(hoseCenters.length-1),i=Math.min(hoseCenters.length-2,Math.floor(f)),v=f-i;return{x:mix(hoseCenters[i][0],hoseCenters[i+1][0],v),y:mix(hoseCenters[i][1],hoseCenters[i+1][1],v)};}
  function bezier(a,c,d,b,t){const v=1-t;return{x:v*v*v*a.x+3*v*v*t*c.x+3*v*t*t*d.x+t*t*t*b.x,y:v*v*v*a.y+3*v*v*t*c.y+3*v*t*t*d.y+t*t*t*b.y};}
  function drawCable(){
    if(!s.hp||!s.body||!hoseCtx||!hoseSource.complete)return;
    hoseCtx.setTransform(1,0,0,1,0,0);hoseCtx.clearRect(0,0,cable.width,cable.height);
    const a=anchor(s.body,CONFIG.console,CONFIG.console.plug),b=anchor(s.hp,CONFIG.handpiece,CONFIG.handpiece.inlet,s.pose);
    const mid={x:s.width*mix(s.mobile?.09:.37,s.mobile?.40:.67,s.intensity)+s.spring.x,y:mix(s.height*.51,s.hp.y+s.travelDistance+s.hp.h*.7,s.intensity)+s.spring.y};
    const first=[a,{x:a.x-s.width*.055,y:a.y+s.height*.09},{x:mid.x+s.width*.13,y:mid.y+s.height*.22},mid];
    // Match the original hose tangent, transformed with the handpiece pose.
    const tangent=(-42+s.pose.r)*Math.PI/180*(s.pose.flipY<0?-1:1),lead=Math.min(95,s.width*.075);
    const second=[mid,{x:mid.x-s.width*.06,y:mid.y-s.height*.13},{x:b.x-Math.cos(tangent)*lead,y:b.y-Math.sin(tangent)*lead},b];
    const landing=[a,{x:a.x+s.width*.045,y:a.y+s.height*.25},{x:b.x-Math.cos(tangent)*lead,y:b.y-Math.sin(tangent)*lead},b];
    const point=t=>{const q=t<.53?bezier(...first,t/.53):bezier(...second,(t-.53)/.47),r=bezier(...landing,t),blend=s.intensity*s.intensity*(3-2*s.intensity);return{x:mix(q.x,r.x,blend),y:mix(q.y,r.y,blend)};};
    const thickness=Math.max(6,Math.min(14,s.body.w/770*15));
    const count=260;
    for(let i=0;i<count;i++){
      const t=i/count,q=point(t),next=point((i+1)/count),src=sourcePoint(t),src2=sourcePoint(Math.min(1,t+.003));
      const angle=Math.atan2(next.y-q.y,next.x-q.x),sourceAngle=Math.atan2(src2.y-src.y,src2.x-src.x),length=Math.hypot(next.x-q.x,next.y-q.y);
      hoseCtx.save();hoseCtx.scale(s.dpr,s.dpr);hoseCtx.translate(q.x,q.y);hoseCtx.rotate(angle);
      hoseCtx.beginPath();hoseCtx.rect(-.6,-thickness*.8,length+1.2,thickness*1.6);hoseCtx.clip();
      const blend=clamp((t-.72)/.28),endThickness=22*s.hp.w/CONFIG.handpiece.crop.width*(s.pose.scale??1);
      const scale=mix(thickness,endThickness,blend)/22;hoseCtx.scale(scale,scale);hoseCtx.rotate(-sourceAngle);hoseCtx.translate(-src.x,-src.y);hoseCtx.drawImage(hoseSource,0,0);hoseCtx.restore();
    }
  }
  function clear(){if(!ctx)return;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.setTransform(s.dpr,0,0,s.dpr,0,0);}
  function arc(origin,radius,alpha,width,u=0){
    if(!ctx)return;
    const direction=axis+s.pose.r*Math.PI/180;
    const red=Math.round(mix(21,191,u)),green=Math.round(mix(156,227,u)),blue=Math.round(mix(205,242,u));
    ctx.lineCap='round';ctx.lineWidth=width;
    for(let i=0;i<CONFIG.pulse.segments;i++){
      const v=(i+.5)/CONFIG.pulse.segments,angle=direction-cone+cone*2*v;
      const x=origin.x+Math.cos(angle)*radius,y=origin.y+Math.sin(angle)*radius;
      const edge=clamp(Math.min(s.width-x,s.height-y,x,y)/30);
      const opacity=alpha*Math.pow(Math.sin(v*Math.PI),1.35)*edge;if(opacity<.005)continue;
      ctx.strokeStyle=`rgba(${red},${green},${blue},${opacity})`;
      ctx.beginPath();ctx.arc(origin.x,origin.y,radius,direction-cone+cone*2*i/CONFIG.pulse.segments,direction-cone+cone*2*(i+1.06)/CONFIG.pulse.segments);ctx.stroke();
    }
  }
  function debugDraw(origin){
    if(!debug||!ctx)return;
    const direction=axis+s.pose.r*Math.PI/180;
    ctx.save();ctx.fillStyle='#d52163';ctx.strokeStyle='#d52163';ctx.lineWidth=1.3;ctx.setLineDash([4,5]);
    ctx.beginPath();ctx.moveTo(origin.x,origin.y);ctx.lineTo(origin.x+Math.cos(direction)*130,origin.y+Math.sin(direction)*130);ctx.stroke();
    [direction-cone,direction+cone].forEach(a=>{ctx.beginPath();ctx.moveTo(origin.x,origin.y);ctx.lineTo(origin.x+Math.cos(a)*160,origin.y+Math.sin(a)*160);ctx.stroke();});
    ctx.setLineDash([]);[origin,anchor(s.body,CONFIG.console,CONFIG.console.plug),anchor(s.hp,CONFIG.handpiece,CONFIG.handpiece.inlet,s.pose)].forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,3.5,0,Math.PI*2);ctx.fill();});ctx.restore();
  }
  function staticFrame(){
    if(!s.hp||!s.body)return;
    s.pose={x:0,y:0,r:-18};hand.style.transform='rotate(-18deg)';$('#consoleBox').style.opacity='1';s.spring={x:0,y:0,vx:0,vy:0};drawCable();clear();
    const tip=anchor(s.hp,CONFIG.handpiece,CONFIG.handpiece.tip),scale=s.hp.w/CONFIG.handpiece.crop.width;
    if(s.reduced||s.skipped)[24,46,70].forEach((r,i)=>arc(tip,r*scale,.28-i*.05,1.4));debugDraw(tip);
  }
  function emit(){const p=CONFIG.pulse;s.pulses.push({born:s.clock,rings:s.mobile?CONFIG.mobile.rings:Math.round(mix(...p.rings,s.intensity)),radius:s.mobile?CONFIG.mobile.radius:mix(...p.radius,s.intensity),alpha:p.alpha*(1+p.alphaBoost*s.intensity)});s.flash=s.clock;}
  function frame(_time,delta){
    if(!s.hp)return;const dt=Math.min(delta/1000,.05);s.clock+=dt;
    const target=clamp(s.progress.value);s.intensity+=(target-s.intensity)*(1-Math.exp(-6*dt));
    if(s.clock>=s.next){emit();s.next=s.clock+(s.mobile?CONFIG.mobile.interval:mix(...CONFIG.pulse.interval,s.intensity));}
    const m=CONFIG.motion,p=CONFIG.pulse,travel=CONFIG.scroll.handpieceTravel;
    const age=s.clock-s.flash,recoil=age>=0&&age<m.recoilDuration?Math.sin(Math.PI*age/m.recoilDuration)*m.recoil:0;
    const amplitude=s.mobile?.28:1;
    s.pose={x:(Math.sin(s.clock*.73)*m.x+s.pointer.x*m.pointer)*amplitude-Math.cos(axis)*recoil+travel.x*s.intensity+(s.mobile?0:s.width*.14)*s.intensity,y:(Math.sin(s.clock*Math.PI*2/m.period)*m.y+s.pointer.y*2)*amplitude-Math.sin(axis)*recoil+travel.y*s.intensity+s.travelDistance*s.intensity,r:-18+Math.sin(s.clock*.65)*m.rotation*amplitude+139*s.intensity};
    const flipProgress=clamp((s.intensity-.45)/.4);s.pose.flipY=Math.cos(Math.PI*flipProgress*flipProgress*(3-2*flipProgress));s.pose.scale=mix(1,.88,s.intensity);
    $('#consoleBox').style.opacity=String(1-clamp((s.intensity-.12)/.6));
    hand.style.transform=`translate3d(${s.pose.x}px,${s.pose.y}px,0) scale(${s.pose.scale}) scaleY(${s.pose.flipY}) rotate(${s.pose.r}deg)`;
    const spring=s.spring,k=CONFIG.cable.stiffness,damping=CONFIG.cable.damping;
    spring.vx+=(((s.pose.x-(travel.x+(s.mobile?0:s.width*.14))*s.intensity)*CONFIG.cable.lagGain-spring.x)*k-spring.vx*damping)*dt;spring.vy+=(((s.pose.y-(travel.y+s.travelDistance)*s.intensity)*CONFIG.cable.lagGain-spring.y)*k-spring.vy*damping)*dt;spring.x+=spring.vx*dt;spring.y+=spring.vy*dt;
    drawCable();if(!s.mobile)$('#orbit').style.transform=`rotate(${s.clock*360/CONFIG.orbitPeriod}deg)`;clear();
    const tip=anchor(s.hp,CONFIG.handpiece,CONFIG.handpiece.tip,s.pose),scale=s.hp.w/CONFIG.handpiece.crop.width;
    s.pulses=s.pulses.filter(pulse=>s.clock-pulse.born<p.duration+(pulse.rings-1)*p.stagger);
    s.pulses.forEach(pulse=>{for(let ring=0;ring<pulse.rings;ring++){const elapsed=s.clock-pulse.born-ring*p.stagger;if(elapsed<0||elapsed>p.duration)continue;const u=elapsed/p.duration,ease=1-Math.pow(1-u,3);arc(tip,mix(12,pulse.radius,ease)*scale,pulse.alpha*(1-u),mix(...p.line,ease)*scale,ease);}});
    if(ctx&&age>=0&&age<p.flashDuration){const alpha=Math.sin(Math.PI*age/p.flashDuration)*p.alpha*(1+p.glowBoost*s.intensity),r=p.flashRadius*scale;const g=ctx.createRadialGradient(tip.x,tip.y,0,tip.x,tip.y,r);g.addColorStop(0,`rgba(245,254,255,${alpha})`);g.addColorStop(.3,`rgba(21,156,205,${alpha*.8})`);g.addColorStop(1,'rgba(21,156,205,0)');ctx.fillStyle=g;ctx.fillRect(tip.x-r,tip.y-r,r*2,r*2);}
    debugDraw(tip);
    if(debug&&s.clock-s.debugAt>.25){root.dataset.scrollProgress=s.progress.value.toFixed(3);root.dataset.pulseIntensity=s.intensity.toFixed(3);s.debugAt=s.clock;}
  }
  function sync(){
    const run=s.ready&&s.inView&&!document.hidden&&!s.skipped&&!s.reduced&&!!window.gsap&&!!ctx;
    root.dataset.animationRunning=String(run);if(run===s.running)return;s.running=run;
    if(run){s.next=s.clock+.6;gsap.ticker.add(frame);}else{if(window.gsap)gsap.ticker.remove(frame);s.pulses.length=0;staticFrame();}
  }
  function motionLabels(){const plain=s.reduced||s.skipped;root.classList.toggle('motion-static',plain);root.dataset.motionMode=s.reduced?'reduced':s.skipped?'skipped':s.mobile?'mobile':'desktop';$('#skipAnimation').disabled=s.reduced;$('#skipAnimation').setAttribute('aria-pressed',String(plain));$('#skipLabel').textContent=t(s.reduced?'reduced':s.skipped?'resume':'skipAnimation');$('#scrollLabel').textContent=t(plain?'static':s.mobile?'mobile':'scroll');}
  function setup(){
    if(s.timeline){s.timeline.scrollTrigger?.kill(true);s.timeline.kill();s.timeline=null;}
    s.mobile=mobile.matches;s.reduced=reduced.matches||forceReduced;s.progress.value=0;s.intensity=0;s.pulses.length=0;
    const hh=$('#header').getBoundingClientRect().height;root.style.setProperty('--header-size',`${hh}px`);measure();
    const canPin=false;
    root.dataset.scrollPinned=String(canPin&&!s.skipped&&!s.reduced);
    if(!s.reduced&&!s.skipped&&window.gsap&&window.ScrollTrigger){gsap.registerPlugin(ScrollTrigger);s.timeline=gsap.to(s.progress,{value:1,ease:'none',duration:1,scrollTrigger:{id:'dolorclast-layered',trigger:'#scene-1',start:()=>`top top+=${$('#header').getBoundingClientRect().height}`,end:()=>`+=${$('#scene-1').offsetHeight*.88}`,scrub:s.mobile?.35:.65,invalidateOnRefresh:true}});}
    motionLabels();sync();if(!s.running)staticFrame();
  }
  function renderProducts(){
    $('#modelsGrid').innerHTML=products.map((p,i)=>`<article class="model-card"><div class="model-media"><span class="model-number" aria-hidden="true">0${i+1}</span><img src="${p.image}" width="${p.width}" height="${p.height}" loading="lazy" decoding="async" style="max-width:${p.width}px" alt="${p.name} — ${s.lang==='ar'?'منظر الجهاز / Product view':'Product view / منظر الجهاز'}"></div><div class="model-info"><span class="model-type" lang="en">${p.type}</span><h3 lang="en" dir="ltr">${p.name}</h3><p>${p[s.lang]}</p><button class="model-link" data-model="${p.id}">${t('explore')} <span aria-hidden="true">↗</span></button></div></article>`).join('');
  }
  fetch('products.json').then(r=>{if(!r.ok)throw Error('Products unavailable');return r.json();}).then(data=>{products=data.filter(p=>p.visible!==false);renderProducts();}).catch(()=>{$('#modelsGrid').textContent='تعذّر تحميل الموديلات. يرجى تحديث الموقع. / Please refresh to load the models.';});
  function showDialog(kind){s.dialog=kind;$('#dialogTitle').textContent=kind==='device'?'EMS DolorClast':kind==='quote'?t('quoteTitle'):kind==='juzo'?'Juzo':t('services');$('#dialogBody').textContent=t(kind==='device'?'body':kind==='quote'?'quoteBody':'destination');$('#deviceDetails').hidden=kind!=='device';$('#deviceDetails dd[lang]').textContent='EMS DolorClast Radial';if(!$('#infoDialog').open)$('#infoDialog').showModal();}
  function translate(){renderProducts();root.lang=s.lang;root.dir=s.lang==='ar'?'rtl':'ltr';document.title=s.lang==='ar'?'OrthoServ — EMS DolorClast':'OrthoServ — DolorClast';document.querySelectorAll('[data-copy]').forEach(el=>el.textContent=t(el.dataset.copy));$('#language').setAttribute('aria-label',s.lang==='ar'?'Switch to English':'التبديل للعربية');$('#navigation').setAttribute('aria-label',s.lang==='ar'?'التنقل الرئيسي':'Main navigation');$('#trustRow').setAttribute('aria-label',s.lang==='ar'?'بيانات بانتظار التأكيد':'Information awaiting confirmation');$('#closeDialog').setAttribute('aria-label',t('close'));motionLabels();if(s.ready)setup();}
  $('#language').addEventListener('click',()=>{s.lang=s.lang==='ar'?'en':'ar';translate();});
  $('#skipAnimation').addEventListener('click',()=>{if(s.reduced)return;s.skipped=!s.skipped;setup();if(s.skipped)$('#scene-1').scrollIntoView({block:'start',behavior:'instant'});});
  document.addEventListener('click',e=>{const modelButton=e.target.closest('[data-model]');if(modelButton){const product=products.find(p=>p.id===modelButton.dataset.model);showDialog('device');$('#dialogTitle').textContent=product.name;$('#dialogBody').textContent=product[s.lang];$('#deviceDetails dd[lang]').textContent=product.name;}if(e.target.closest('[data-quote]'))showDialog('quote');if(e.target.closest('[data-details]'))showDialog('device');const d=e.target.closest('[data-destination]');if(d)showDialog(d.dataset.destination);});
  $('#closeDialog').addEventListener('click',()=>$('#infoDialog').close());$('#returnButton').addEventListener('click',()=>$('#infoDialog').close());
  $('#scene-1').addEventListener('pointermove',e=>{if(s.mobile)return;s.pointer.x=clamp(e.clientX/innerWidth*2-1,-1,1);s.pointer.y=clamp(e.clientY/innerHeight*2-1,-1,1);});$('#scene-1').addEventListener('pointerleave',()=>{s.pointer={x:0,y:0};});
  new IntersectionObserver(entries=>{s.inView=entries[0].isIntersecting;sync();},{threshold:.01}).observe($('#main'));
  new ResizeObserver(()=>measure()).observe(art);
  document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',setup);mobile.addEventListener('change',setup);
  let timer;addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(()=>{if(s.ready)setup();},160);});
  if(debug){$('#debugReadout').hidden=false;$('#debugReadout').textContent='Official EMS Blue: tip 824,523 · axis 59° / pose −18° · photo-textured hose';}
  Promise.all([$('#consoleImage'),$('#handpieceImage')].map(i=>i.decode?i.decode().catch(()=>{}):Promise.resolve())).then(()=>{s.ready=true;translate();if(!window.gsap||!window.ScrollTrigger||!ctx){s.skipped=true;setup();}if(document.fonts)document.fonts.ready.then(()=>{measure();if(window.ScrollTrigger)ScrollTrigger.refresh();});});
})();
