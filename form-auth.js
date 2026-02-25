(function(){
  // Helper to check login
  function isLoggedIn(){
    return localStorage.getItem('userLoggedIn') === 'true';
  }

  // Save pending submission and redirect to login
  function savePendingAndRedirect(form){
    try{
      const fd = new FormData(form);
      const obj = {};
      for(const [k,v] of fd.entries()){
        // handle multiple values
        if(obj.hasOwnProperty(k)){
          if(Array.isArray(obj[k])) obj[k].push(v); else obj[k] = [obj[k], v];
        } else obj[k] = v;
      }
      const pending = {
        action: form.action || window.location.href,
        method: (form.method || 'POST').toUpperCase(),
        data: obj,
        originPage: window.location.pathname.split('/').pop() || window.location.href
      };
      localStorage.setItem('pendingSubmission', JSON.stringify(pending));
    }catch(e){ console.warn('Could not save pending submission', e); }
    // take to login page
    window.location.href = 'login.html';
  }

  // Try to submit pending submission to backend (JSON POST)
  async function trySubmitPending(){
    const raw = localStorage.getItem('pendingSubmission');
    if(!raw) return false;
    if(!isLoggedIn()) return false;
    let pending;
    try{ pending = JSON.parse(raw); }catch(e){ localStorage.removeItem('pendingSubmission'); return false; }

    try{
      // Only attempt JSON POST to API endpoints. If action contains '/api' submit JSON.
      if(pending.action && pending.action.indexOf('/api') !== -1){
        const res = await fetch(pending.action, {
          method: pending.method || 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pending.data)
        });
        // If server returns JSON, try to parse but don't require it
        try{ await res.json(); }catch(e){}
        if(res.ok){
          localStorage.removeItem('pendingSubmission');
          return true;
        }
        return false;
      } else {
        // If not an API endpoint, navigate back to origin page and keep pendingSubmission so user can submit there
        // Optionally, we could perform a form POST, but that's complex for general cases.
        return false;
      }
    }catch(e){ console.warn('Auto-submit failed', e); return false; }
  }

  // Global submit handler
  document.addEventListener('submit', function(e){
    const form = e.target;
    if(!(form instanceof HTMLFormElement)) return;

    // If already logged in, allow submission to proceed but intercept API forms to use fetch
    if(isLoggedIn()){
      // If form targets an API path, submit via fetch so we can handle response and persist if needed
      const action = form.action || window.location.href;
      if(action.indexOf('/api') !== -1){
        e.preventDefault();
        const fd = new FormData(form);
        const obj = {};
        for(const [k,v] of fd.entries()){
          if(obj.hasOwnProperty(k)){
            if(Array.isArray(obj[k])) obj[k].push(v); else obj[k] = [obj[k], v];
          } else obj[k] = v;
        }
        fetch(action, { method: (form.method||'POST').toUpperCase(), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) })
          .then(async res => {
            let json = null;
            try{ json = await res.json(); }catch(e){}
            if(res.ok){
              // If this is profile/register-like submission keep it locally so it persists until logout
              try{ localStorage.setItem('profileData', JSON.stringify(obj)); }catch(e){}
              alert('Submission successful');
            } else {
              alert('Submission error: ' + (json && json.message ? json.message : res.statusText));
            }
          }).catch(err => { console.error('Submission failed', err); alert('Submission failed'); });
      } else {
        // Non-API form, allow normal submit
      }

    } else {
      // Not logged in: save pending data and redirect to login
      e.preventDefault();
      savePendingAndRedirect(form);
    }
  }, true);

  // On load, attempt to auto-submit pending if logged in
  window.addEventListener('DOMContentLoaded', function(){
    // run in background, but if successful we may redirect to profile page
    trySubmitPending().then(submitted => {
      if(submitted){
        // After auto-submission, send user to profile page
        // But if user is already on login page, redirect to profile
        if(window.location.pathname.endsWith('login.html')){
          window.location.href = 'profile.html';
        }
      }
    });
  });
})();