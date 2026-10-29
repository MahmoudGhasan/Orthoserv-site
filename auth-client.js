'use strict';
/* Firebase owns credentials. No password, token or role is stored by this file. */
(() => {
  let session = {ready:false, user:null, role:'customer', error:null};
  let loading, sdk, auth, revision = 0;
  const listeners = new Set();
  const config = () => window.OrthoCMS?.settings?.accounts || {};
  const enabled = () => config().enabled === true && config().provider === 'firebase';
  const notify = () => listeners.forEach(fn => fn({...session}));
  async function load() {
    if (loading) return loading;
    loading = (async () => {
      if (!enabled()) throw new Error('auth/not-configured');
      const firebase = config().firebase;
      if (!firebase?.apiKey || !firebase?.authDomain || !firebase?.projectId || !firebase?.appId) throw new Error('auth/not-configured');
      const [appModule, authModule] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js')
      ]);
      sdk = authModule;
      const app = appModule.getApps().find(a => a.name === 'orthoserv-accounts') || appModule.initializeApp(firebase, 'orthoserv-accounts');
      auth = sdk.getAuth(app);
      auth.languageCode = document.documentElement.lang === 'ar' ? 'ar' : 'en';
      // Each sign-in sets persistence from the explicit Remember me choice.
      // Do not overwrite a returning customer's saved persistence here.
      sdk.onIdTokenChanged(auth, async user => {
        const current = ++revision;
        if (!user) { session = {ready:true,user:null,role:'customer',error:null}; notify(); return; }
        session = {ready:false,user:null,role:'customer',error:null}; notify();
        try {
          const endpoint = new URL(config().apiUrl);
          if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password) throw new Error('auth/not-configured');
          const token = await user.getIdToken();
          const response = await fetch(new URL('/v1/me', endpoint), {
            headers:{Authorization:'Bearer '+token}, cache:'no-store', credentials:'omit',
            signal:AbortSignal.timeout(15000)
          });
          if (!response.ok) throw new Error('auth/profile-unavailable');
          const profile = await response.json();
          if (profile.uid !== user.uid || !['customer','admin','super-admin'].includes(profile.role)) throw new Error('auth/profile-unavailable');
          if (current !== revision) return;
          session = {ready:true,user:{uid:user.uid,email:user.email || '',displayName:user.displayName || '',emailVerified:user.emailVerified},role:profile.role,error:null};
          notify();
        } catch (error) {
          if (current !== revision) return;
          session = {ready:true,user:null,role:'customer',error:error.message || error.code}; notify();
        }
      });
      return auth;
    })().catch(error => {
      session = {ready:true,user:null,role:'customer',error:error.code || error.message}; notify();
      loading = null; throw error;
    });
    return loading;
  }
  async function persistence(remember) {
    await load();
    await sdk.setPersistence(auth, remember ? sdk.browserLocalPersistence : sdk.browserSessionPersistence);
  }
  async function signIn(email, password, remember) {
    await persistence(remember);
    return sdk.signInWithEmailAndPassword(auth,email,password);
  }
  async function signUp(name,email,password,remember) {
    await persistence(remember);
    const result = await sdk.createUserWithEmailAndPassword(auth,email,password);
    // Creating the account succeeded even if a subsequent email/profile request fails.
    let verificationSent = false;
    try { await sdk.updateProfile(result.user,{displayName:name.trim()}); } catch {}
    try { await sdk.sendEmailVerification(result.user); verificationSent = true; } catch {}
    return {verificationSent};
  }
  async function google(remember) {
    await persistence(remember);
    const provider = new sdk.GoogleAuthProvider();
    provider.setCustomParameters({prompt:'select_account'});
    return sdk.signInWithPopup(auth,provider);
  }
  async function reset(email) { await load(); return sdk.sendPasswordResetEmail(auth,email); }
  async function logout() { await load(); await sdk.signOut(auth); }
  async function verify() { await load(); if (auth.currentUser) return sdk.sendEmailVerification(auth.currentUser); }
  async function refresh() { await load(); if (auth.currentUser) { await sdk.reload(auth.currentUser); await auth.currentUser.getIdToken(true); } }
  async function accountRequest(path, options = {}) {
    if (!/^\/v1\/(team|tickets(?:\/[a-f0-9-]{36}(?:\/(?:reply|delete))?)?)(?:\?offset=\d+)?$/.test(path)) throw new Error('auth/invalid-path');
    await load();
    const user=auth.currentUser;
    if (!user || !session.user || session.user.uid!==user.uid) throw new Error('auth/profile-unavailable');
    const endpoint=new URL(config().apiUrl);
    if (endpoint.protocol!=='https:' || endpoint.username || endpoint.password) throw new Error('auth/not-configured');
    const token=await user.getIdToken();
    const response=await fetch(new URL(path,endpoint),{method:options.method || 'GET',
      headers:{Authorization:'Bearer '+token,...(options.body?{'Content-Type':'application/json'}:{})},
      ...(options.body?{body:JSON.stringify(options.body)}:{}),cache:'no-store',credentials:'omit',redirect:'error',signal:AbortSignal.timeout(15000)});
    if (!response.ok) { const error=new Error('Account service unavailable.'); error.status=response.status; throw error; }
    return response.json();
  }
  window.OrthoAuth = {
    enabled,load,signIn,signUp,google,reset,logout,verify,refresh,accountRequest,
    state:() => ({...session}),
    subscribe(fn) { listeners.add(fn); fn({...session}); return () => listeners.delete(fn); }
  };
})();
