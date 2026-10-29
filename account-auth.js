'use strict';
/* Real account views. Permissions always come from the account API. */
(() => {
  let main, view, mode = 'login', started = false, busy = false;
  const t = (en, ar) => document.documentElement.lang === 'ar' ? ar : en;
  const esc = value => String(value || '').replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const active = () => main?.isConnected && ['login','account'].includes(location.hash.slice(1).split('/')[0]);
  const apple = '<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M16.4 1.4c.2 1.5-.5 3-1.4 4-.9 1-2.3 1.7-3.7 1.6-.2-1.4.5-2.9 1.4-3.9.9-1 2.4-1.7 3.7-1.7ZM20.5 17.4c-.5 1.2-.8 1.7-1.5 2.7-1 1.4-2.3 3.1-4 3.1-1.5 0-1.9-1-4-1s-2.6 1-4 1c-1.6 0-2.8-1.5-3.8-2.9C.4 16.3.8 10.8 3.8 8.7c1.5-1 3.8-1.2 5.7-.5 1.4.5 1.7.5 3.2 0 1.7-.6 3.9-.5 5.3.3.5.3 1 .7 1.4 1.2-3.7 2-3.1 6.9 1.1 7.7Z"/></svg>';
  const google = '<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.5Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.6c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.7A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.4H3a10 10 0 0 0 0 9.2l3.4-2.7Z"/><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.6 9.6 0 0 0 12 2a10 10 0 0 0-9 5.4l3.4 2.7C7.2 7.8 9.4 6 12 6Z"/></svg>';
  function message(text, error = false) {
    if (!active()) return;
    const el = main.querySelector('#authMessage');
    if (el) { el.textContent = text; el.classList.toggle('auth-v1-error',error); }
  }
  function errorText(error) {
    const code = error?.code || error?.message || '';
    const values = {
      'auth/invalid-credential':['Email or password is incorrect.','البريد الإلكتروني أو كلمة المرور غير صحيحة.'],
      'auth/email-already-in-use':['Unable to create this account. Try signing in or resetting your password.','تعذّر إنشاء الحساب. جرّب تسجيل الدخول أو استعادة كلمة المرور.'],
      'auth/weak-password':['Use a stronger password.','استخدم كلمة مرور أقوى.'],
      'auth/too-many-requests':['Too many attempts. Please try again later.','محاولات كثيرة. يرجى المحاولة لاحقًا.'],
      'auth/popup-closed-by-user':['Sign-in was cancelled.','تم إلغاء تسجيل الدخول.'],
      'auth/popup-blocked':['Allow the Google sign-in popup, then try again.','اسمح بنافذة Google ثم حاول مرة أخرى.'],
      'auth/account-exists-with-different-credential':['Sign in with the method originally used for this email.','سجّل الدخول بالطريقة المستخدمة سابقًا لهذا البريد.'],
      'auth/unauthorized-domain':['This website domain is not authorised for sign-in.','نطاق الموقع غير معتمد لتسجيل الدخول.'],
      'auth/profile-unavailable':['Account verification is unavailable. Please try again.','تعذّر التحقق من الحساب. يرجى المحاولة مرة أخرى.']
    };
    return values[code] ? t(...values[code]) : t('Unable to complete the request. Please try again.','تعذّر إكمال الطلب. يرجى المحاولة مرة أخرى.');
  }
  async function run(action, success) {
    if (busy) return;
    busy = true;
    const controls = main?.querySelectorAll('button:not([data-apple]),input') || [];
    controls.forEach(el => { el.disabled = true; });
    try { const result = await action(); if (success) message(success(result)); }
    catch (error) { message(errorText(error),true); }
    finally { busy = false; controls.forEach(el => { if (el.isConnected) el.disabled = false; }); }
  }
  function form() {
    const register = mode === 'register', reset = mode === 'reset';
    main.innerHTML = `<section class="wrap auth-v1" data-no-translate><div class="auth-layout"><div class="auth-form"><span class="eyebrow">ORTHOSERV</span><h1>${reset?t('Reset password','استعادة كلمة المرور'):register?t('Create account','إنشاء حساب'):t('Welcome back','هلا فيك')}</h1><p>${t('One account for your ORTHOSERV experience.','حساب واحد لتجربتك مع أورثو سيرف.')}</p>${reset?'':`<div class="auth-v1-social"><button type="button" class="button outline" id="authGoogle">${google}<span>${t('Continue with Google','المتابعة باستخدام Google')}</span></button><button type="button" class="button outline" data-apple disabled aria-describedby="appleUnavailable">${apple}<span>${t('Continue with Apple','المتابعة باستخدام Apple')}</span></button><small id="appleUnavailable">${t('Apple sign-in is not available yet.','تسجيل الدخول باستخدام Apple غير متاح حاليًا.')}</small></div><div class="auth-v1-divider">${t('or use your email','أو استخدم بريدك الإلكتروني')}</div>`}<form id="authForm">${register?`<label for="authName">${t('Full name','الاسم الكامل')}<input id="authName" name="name" required maxlength="100" autocomplete="name"></label>`:''}<label for="authEmail">${t('Email address','البريد الإلكتروني')}<input id="authEmail" name="email" type="email" required autocomplete="email" dir="ltr" maxlength="254"></label>${reset?'':`<label for="authPassword">${t('Password','كلمة المرور')}<input id="authPassword" name="password" type="password" required ${register?'minlength="8"':''} autocomplete="${register?'new-password':'current-password'}"></label><label class="auth-v1-remember"><input id="authRemember" type="checkbox">${t('Remember me on this device','تذكرني على هذا الجهاز')}</label>`}<button type="submit" class="button wide">${reset?t('Send reset email','إرسال رابط الاستعادة'):register?t('Create account','إنشاء حساب'):t('Sign in','تسجيل الدخول')}</button></form><p id="authMessage" role="status" aria-live="polite"></p><div class="auth-v1-links"><button type="button" class="text-link" id="authMode">${mode==='login'?t('Create an account','إنشاء حساب جديد'):t('Back to sign in','العودة لتسجيل الدخول')}</button>${mode==='login'?`<button type="button" class="text-link" id="authReset">${t('Forgot password?','نسيت كلمة المرور؟')}</button>`:''}</div></div><div class="auth-art"><img src="assets/orthoserv-logo-symbol.png" alt="ORTHOSERV" width="160" height="160"><h2>${t('Care that moves with you.','رعاية تواكب حركتك.')}</h2><p>${t('Sign in securely to your account.','سجّل دخولك إلى حسابك بأمان.')}</p><a class="text-link" href="#catalog">${t('Continue shopping','متابعة التسوق')}</a></div></div></section>`;
    main.querySelector('#authMode').onclick = () => { mode = mode==='login'?'register':'login'; draw(); };
    main.querySelector('#authReset')?.addEventListener('click',() => { mode='reset'; draw(); });
    const remember = () => !!main.querySelector('#authRemember')?.checked;
    main.querySelector('#authGoogle')?.addEventListener('click',() => { const keep=remember(); run(() => window.OrthoAuth.google(keep)); });
    main.querySelector('#authForm').onsubmit = event => {
      event.preventDefault();
      const email = main.querySelector('#authEmail').value.trim();
      if (reset) { run(() => window.OrthoAuth.reset(email),() => t('If this email can receive a reset link, an email will be sent.','إذا كان البريد مؤهلًا لاستعادة الحساب فسيصلك رابط الاستعادة.')); return; }
      const password = main.querySelector('#authPassword').value, keep=remember();
      if (register) { const name=main.querySelector('#authName').value; run(() => window.OrthoAuth.signUp(name,email,password,keep)); }
      else run(() => window.OrthoAuth.signIn(email,password,keep));
    };
  }
  function account(state) {
    const role = state.role, privileged = role === 'admin' || role === 'super-admin';
    if (privileged && window.OrthoManagement) {
      window.OrthoManagement.render(main,state);
      main.querySelector('#authLogout').onclick = () => run(() => window.OrthoAuth.logout());
      return;
    }
    const title = role === 'super-admin'?'Super Admin':role==='admin'?t('Store administrator','مسؤول المتجر'):t('My account','حسابي');
    main.innerHTML = `<section class="wrap auth-v1" data-no-translate><div class="account-heading"><div><span class="eyebrow">ORTHOSERV</span><h1>${title}</h1><p>${esc(state.user.displayName || state.user.email)}</p></div><button type="button" class="button outline" id="authLogout">${t('Sign out','تسجيل الخروج')}</button></div><div class="account-panel"><h2>${t('Profile','الملف الشخصي')}</h2><dl class="auth-v1-profile"><dt>${t('Email','البريد الإلكتروني')}</dt><dd dir="ltr">${esc(state.user.email)}</dd><dt>${t('Account type','نوع الحساب')}</dt><dd>${title}</dd><dt>${t('Email verification','تأكيد البريد')}</dt><dd>${state.user.emailVerified?t('Verified','مؤكد'):t('Not verified','غير مؤكد')}</dd></dl>${state.user.emailVerified?'':`<button type="button" class="button outline" id="authVerify">${t('Send verification email','إرسال رسالة التأكيد')}</button>`}<button type="button" class="button outline" id="authRefresh">${t('Refresh account','تحديث الحساب')}</button><p id="authMessage" role="status" aria-live="polite"></p></div><div class="account-panel"><h2>${privileged?t('Management','الإدارة'):t('My orders','طلباتي')}</h2><p>${privileged?t('Team permissions and detailed management are handled in TODAY.','إدارة الفريق والصلاحيات والتفاصيل تتم من برنامج TODAY.'):t('Orders are not connected yet. No order history is available.','الطلبات غير متصلة بعد. سجل الطلبات غير متاح حاليًا.')}</p></div><a class="text-link" href="#catalog">${t('Continue shopping','متابعة التسوق')}</a></section>`;
    main.querySelector('#authLogout').onclick = () => run(() => window.OrthoAuth.logout());
    main.querySelector('#authVerify')?.addEventListener('click',() => run(() => window.OrthoAuth.verify(),() => t('Verification email sent.','تم إرسال رسالة التأكيد.')));
    main.querySelector('#authRefresh').onclick = () => run(() => window.OrthoAuth.refresh());
    if (window.OrthoManagement) window.OrthoManagement.customerTickets(main,state);
  }
  function draw() {
    if (!active()) return;
    const state = window.OrthoAuth.state();
    if (!state.ready) { main.innerHTML=`<section class="wrap auth-v1" data-no-translate><p role="status">${t('Checking your account…','جارٍ التحقق من الحساب…')}</p></section>`; return; }
    if (state.user) {
      if (view === 'login') { location.hash='account'; return; }
      account(state);
    } else { form(); if(state.error)message(errorText({code:state.error}),true); }
    document.title = t('My account','حسابي')+' | ORTHOSERV';
  }
  function sync() {
    const button=document.getElementById('accountBtn');
    if (button) { button.hidden=!window.OrthoAuth?.enabled(); button.onclick=()=>{location.hash=window.OrthoAuth.state().user?'account':'login';}; }
  }
  function render(route, target) {
    if (!window.OrthoAuth?.enabled()) return false;
    main=target; view=route; draw();
    if (!started) { started=true; window.OrthoAuth.subscribe(() => { sync(); draw(); }); }
    window.OrthoAuth.load().catch(()=>{});
    return true;
  }
  window.OrthoAccountPreview={enabled:()=>window.OrthoAuth?.enabled()===true,render,sync};
  document.addEventListener('DOMContentLoaded',sync);
  window.addEventListener('orthocms:ready',sync);
  new MutationObserver(() => { if(!busy)draw(); }).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
