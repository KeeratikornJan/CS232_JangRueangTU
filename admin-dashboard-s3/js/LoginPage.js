// Compatibility shim: the login flow now lives in login.js. Older HTML files
// that still reference LoginPage.js will simply load login.js instead.
(function () {
  if (document.currentScript && !window.__loginJsLoaded) {
    const s = document.createElement('script');
    s.src = document.currentScript.src.replace(/LoginPage\.js$/, 'login.js');
    document.head.appendChild(s);
    window.__loginJsLoaded = true;
  }
})();
