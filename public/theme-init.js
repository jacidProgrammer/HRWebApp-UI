// Applies the saved theme before the first paint, to avoid a flash of the wrong colours. A separate file
// (not an inline script) so the Content-Security-Policy can stay `script-src 'self'`.
(function () {
  var preference = 'system';
  try {
    preference = localStorage.getItem('hr.theme') || 'system';
  } catch {
    // Storage blocked (private mode, sandboxed iframe): follow the system.
  }
  var dark = preference === 'dark' || (preference !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
})();
