/* Runs in <head> before first paint.
   1. Marks the document as JS-enabled so reveal animations only hide content
      when we know the script that reveals it can run.
   2. Failsafe: if main.js has not booted within 4 s (blocked, errored, offline
      CDN), force every section visible so the page never appears blank. */
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  window.setTimeout(function () {
    if (!window.__caReady) root.classList.add('js-failed');
  }, 4000);
})();
