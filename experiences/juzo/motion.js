"use strict";
(()=>{
const $=s=>document.querySelector(s),canvas=$('#leg'),ctx=canvas.getContext('2d'),image=new Image(),reduce=matchMedia('(prefers-reduced-motion:reduce)');
const state={p:0,auto:false,start:0,raf:0,w:1,h:1,dpr:1,ready:false};
const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t,smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
function size(){const b=canvas.getBoundingClientRect();state.w=b.width;state.h=b.height;state.dpr=Math.min(devicePixelRatio||1,2);canvas.width=b.width*state.dpr;canvas.height=b.height*state.dpr;render();}
function map(x,y,step){
 let bend=smooth((y-955)/280),angle=step*.48*bend,dx=x-700,dy=y-1080;
 let nx=700+dx*Math.cos(angle)-dy*Math.sin(angle),ny=1080+dx*Math.sin(angle)+dy*Math.cos(angle);
 const calf=-.025*step,px=nx-500,py=ny-240;
 return{x:500+px*Math.cos(calf)-py*Math.sin(calf),y:240+px*Math.sin(calf)+py*Math.cos(calf)};
}
function triangle(src,dst){
 const [a,b,c]=src,[A,B,C]=dst,det=(b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y);if(Math.abs(det)<.01)return;
 const m11=((B.x-A.x)*(c.y-a.y)-(C.x-A.x)*(b.y-a.y))/det,m21=((B.y-A.y)*(c.y-a.y)-(C.y-A.y)*(b.y-a.y))/det;
 const m12=((C.x-A.x)*(b.x-a.x)-(B.x-A.x)*(c.x-a.x))/det,m22=((C.y-A.y)*(b.x-a.x)-(B.y-A.y)*(c.x-a.x))/det;
 const center={x:(A.x+B.x+C.x)/3,y:(A.y+B.y+C.y)/3},expand=q=>{const dx=q.x-center.x,dy=q.y-center.y,n=Math.hypot(dx,dy)||1;return{x:q.x+dx/n*.8,y:q.y+dy/n*.8}},aa=expand(A),bb=expand(B),cc=expand(C);
 ctx.save();ctx.beginPath();ctx.moveTo(aa.x,aa.y);ctx.lineTo(bb.x,bb.y);ctx.lineTo(cc.x,cc.y);ctx.closePath();ctx.clip();ctx.transform(m11,m21,m12,m22,A.x-m11*a.x-m12*a.y,A.y-m21*a.x-m22*a.y);ctx.drawImage(image,0,0);ctx.restore();
}
function render(){
 if(!state.ready)return;const p=state.p,step=smooth(p/.52),exit=smooth((p-.58)/.35),mobile=innerWidth<=700;
 $('#intro').style.opacity=String(1-smooth((p-.40)/.26));$('#intro').style.translate=`0 ${-65*smooth((p-.40)/.28)}px`;
 $('#legScene').style.transform=`translate(${exit*(mobile?65:130)}px,${-exit*(mobile?75:75)}px) scale(${mix(1,mobile?.54:.68,exit)})`;
 $('#collection').inert=!reduce.matches&&exit<.8;$('#collection').style.pointerEvents=reduce.matches||exit>.8?'auto':'none';
 $('#collection').style.opacity=String(exit);$('#collection').style.transform=`translateY(${(1-exit)*75}px)`;
 $('#shadow').style.opacity=String(mix(.25,.6,step)*(1-exit*.5));$('#shadow').style.transform=`scaleX(${mix(.72,1.08,step)})`;
 $('#phase').textContent=p<.25?'01 / بداية الخطوة':p<.58?'02 / استقرار القدم':'03 / اكتشف المجموعة';$('#bar').style.transform=`scaleX(${p})`;
 if(document.body.dataset.sceneChoice)return;
 ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.scale(state.dpr,state.dpr);
 const scale=Math.min(state.w/1024,state.h/1536)*.98,baseX=(state.w-1024*scale)/2,baseY=mix((state.h-1536*scale)/2-18,state.h-18-Math.max(map(320,1460,step).y,map(880,1220,step).y)*scale,step);
 const cols=7,rows=25,point=(x,y)=>{const q=map(x,y,step);return{x:q.x*scale+baseX,y:q.y*scale+baseY}};
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
 const a={x:x*1024/cols,y:y*1536/rows},b={x:(x+1)*1024/cols,y:a.y},c={x:b.x,y:(y+1)*1536/rows},d={x:a.x,y:c.y};
 triangle([a,b,c],[point(a.x,a.y),point(b.x,b.y),point(c.x,c.y)]);triangle([a,c,d],[point(a.x,a.y),point(c.x,c.y),point(d.x,d.y)]);
 }
}
function tick(now){
 if($('#story').hidden){if(state.auto){state.auto=false;label();}state.raf=requestAnimationFrame(tick);return;}
 const hh=document.querySelector('header').offsetHeight;
 if(state.auto){const elapsed=(now-state.start)/11500,p=clamp(elapsed);const distance=$('#story').offsetHeight-$('#stage').offsetHeight;window.scrollTo(0,$('#story').offsetTop-hh+distance*p);if(p>=1){state.auto=false;label();}}
 const distance=Math.max(1,$('#story').offsetHeight-$('#stage').offsetHeight),target=reduce.matches?0:clamp((scrollY-$('#story').offsetTop+hh)/distance);
 const previous=state.p;state.p+= (target-state.p)*.16;if(Math.abs(state.p-target)<.0001)state.p=target;
 if(Math.abs(state.p-previous)>.00001||state.auto)render();
 state.raf=requestAnimationFrame(tick);
}
function label(){$('#play').textContent=state.auto?'إيقاف مؤقت Ⅱ':'شغّل المشهد ▷';}
$('#play').addEventListener('click',()=>{if(reduce.matches){$('#phase').textContent='عرض ثابت حسب تفضيل الحركة';return;}if(state.auto){state.auto=false;}else{state.start=performance.now()-state.p*11500;if(state.p>.98){state.p=0;state.start=performance.now();}state.auto=true;}label();});
$('#replay').addEventListener('click',()=>{state.auto=false;state.p=0;window.scrollTo(0,0);render();label();});
addEventListener('wheel',()=>{state.auto=false;label();},{passive:true});addEventListener('touchstart',()=>{state.auto=false;label();},{passive:true});
document.addEventListener('juzo:select',()=>{state.auto=false;label();});
new ResizeObserver(size).observe(canvas);reduce.addEventListener('change',()=>{state.auto=false;state.p=0;label();render();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(state.raf);state.auto=false;label();}else state.raf=requestAnimationFrame(tick);});
image.onload=()=>{state.ready=true;size();state.raf=requestAnimationFrame(tick);};image.src='assets/leg-concept.png';
})();
