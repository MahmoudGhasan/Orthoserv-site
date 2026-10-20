'use strict';
(()=>{
const pairs=[['shopMenuButton','shopMenu'],['brandMenuButton','brandMenu']].map(([b,p])=>({button:document.getElementById(b),panel:document.getElementById(p)}));
function closeAll(restore=false){pairs.forEach(({button,panel})=>{if(restore&&!panel.hidden)button.focus();panel.hidden=true;button.setAttribute('aria-expanded','false')})}
pairs.forEach(({button,panel})=>{button.onclick=()=>{const open=panel.hidden;closeAll();panel.hidden=!open;button.setAttribute('aria-expanded',String(open))};button.onkeydown=e=>{if(e.key==='ArrowDown'){e.preventDefault();closeAll();panel.hidden=false;button.setAttribute('aria-expanded','true');panel.querySelector('a')?.focus()}};panel.addEventListener('click',e=>{if(e.target.closest('a'))closeAll()})});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAll(true)});
document.addEventListener('click',e=>{if(!e.target.closest('.mega-panel,.nav-trigger'))closeAll()});
document.addEventListener('focusin',e=>{if(!e.target.closest('.mega-panel,.nav-trigger'))closeAll()});
window.addEventListener('hashchange',()=>closeAll());
})();
