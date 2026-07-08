/* Runs render-blocking in <head>, before first paint. Marks JS as available
   so the hero's reveal animations start hidden (and stay visible as a
   fallback when JS is disabled). Kept as an external file so it satisfies the
   Content-Security-Policy `script-src 'self'` rule set in .htaccess. */
document.documentElement.classList.add("js");
