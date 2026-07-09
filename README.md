# Lowes Building Services website

Static marketing site for Lowes Building Services Limited. It is served by Apache/LiteSpeed and deployed to cPanel from the `main` branch.

## Local development

Requirements: Node.js 22.22 or newer and npm 10.

```sh
npm ci
npx playwright install chromium
npm run check
```

`npm run check` is the release gate. It validates JavaScript syntax, HTML, IDs, local assets, fragment links, canonical/social metadata, the CSP bootstrap hash, deployment safeguards, and browser behavior in Chromium. Browser coverage includes normal loading, no-JavaScript fallback, reduced motion, mobile-menu focus, breakpoint changes, contact links, and date-derived copy.

## Site structure

- `index.html`: content, metadata, structured data, and semantic page structure.
- `styles.css`: design tokens, responsive layout, motion, and fallback states.
- `app.js`: progressive enhancements and interaction behavior.
- `assets/`: production images, logos, and icons.
- `.htaccess`: canonical redirects, security headers, compression, and caching.
- `.cpanel.yml`: staged production deployment.
- `tests/` and `scripts/`: browser and static release checks; these are not deployed.

The business age is calculated in `app.js` from the founding year `1998`, and the copyright year uses the browser's current year. The HTML retains “since 1998” or a current numeric fallback so the page remains meaningful without JavaScript.

## Progressive enhancement contract

Core content and contact routes must work without JavaScript. Reveal styles are activated only after `app.js` successfully creates the observer. On small screens, the mobile navigation renders as a static fallback until its enhanced modal behavior is ready.

The inline head bootstrap prevents a hero-animation flash. Its exact SHA-256 hash is allowlisted in `.htaccess`; changing that statement requires updating the CSP hash. `npm run check:static` detects drift.

## Production deployment

cPanel stages all production files under `/home/lowesbui/.lowes-deploy-stage`. Assets are synchronized with deletion enabled so removed files do not remain public. Top-level files are installed as `.next` files and renamed into place, with `index.html` published last to minimize mixed-release windows.

The hosting account must provide:

- `mod_rewrite` for HTTPS and canonical-host redirects;
- `mod_headers` for CSP, security, and cache headers;
- either `mod_brotli` or `mod_deflate` for text compression;
- `rsync` at `/usr/bin/rsync` for convergent asset deployment.

After deployment, verify all four HTTP/HTTPS and apex/www URL combinations, response security headers, compression, cache headers, mobile navigation, and both contact links. If TLS terminates upstream of Apache, confirm the hosting control plane exposes HTTPS correctly before changing the redirect condition.

Rollback by redeploying the previous known-good Git commit through cPanel. The staged deployment will restore its exact asset set.
