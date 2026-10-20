'use strict';
(()=>{
const ad=document.querySelector('#juzoAd'),canvas=document.querySelector('#adLeg'),img=new Image(),button=document.querySelector('#adMotion'),reduce=matchMedia('(prefers-reduced-motion:reduce)');
let paused=reduce.matches,visible=true,last=0,clock=0,ready=false,raf=0;
const renderLeg=window.createOrthoLegRenderer(canvas,img);
function draw(){if(ready&&visible)renderLeg(clock,reduce.matches)}
function tick(t){if(!visible||document.hidden){last=t;raf=requestAnimationFrame(tick);return}if(t-last>40){if(!paused)clock+=Math.min(60,t-last);last=t;if(!paused)draw()}raf=requestAnimationFrame(tick)}
function label(){button.textContent=paused?'تشغيل الحركة ▷':'إيقاف الحركة Ⅱ';button.setAttribute('aria-label',paused?'تشغيل حركة الإعلان':'إيقاف حركة الإعلان');button.setAttribute('aria-pressed',String(paused))}
button.onclick=()=>{paused=!paused;label();draw()};reduce.addEventListener('change',()=>{paused=reduce.matches;label();draw()});document.querySelector('#adClose').onclick=()=>{visible=false;ad.hidden=true;document.body.classList.remove('with-juzo-ad');cancelAnimationFrame(raf)};new ResizeObserver(draw).observe(canvas);img.onload=()=>{ready=true;draw();raf=requestAnimationFrame(tick)};img.src='experiences/juzo/assets/leg-concept.png';document.body.classList.add('with-juzo-ad');label();
})();
