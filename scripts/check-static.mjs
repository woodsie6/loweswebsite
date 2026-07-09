import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [html, htaccess, deployment] = await Promise.all([
  readFile(resolve(root, 'index.html'), 'utf8'),
  readFile(resolve(root, '.htaccess'), 'utf8'),
  readFile(resolve(root, '.cpanel.yml'), 'utf8'),
]);

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
assert(duplicateIds.length === 0, `Duplicate IDs: ${[...new Set(duplicateIds)].join(', ')}`);

const idSet = new Set(ids);
const fragments = [...html.matchAll(/\bhref="#([^"]+)"/g)].map((match) => match[1]);
const missingFragments = fragments.filter((fragment) => !idSet.has(fragment));
assert(missingFragments.length === 0, `Missing fragment targets: ${missingFragments.join(', ')}`);
assert(!html.includes('href="#"'), 'Placeholder href="#" is not allowed');

const localReferences = [...html.matchAll(/\b(?:src|href)="\.\/([^"?#]+)(?:[?#][^"]*)?"/g)]
  .map((match) => match[1]);
for (const reference of localReferences) {
  try {
    await access(resolve(root, reference));
  } catch {
    failures.push(`Missing local asset: ${reference}`);
  }
}

assert(
  html.includes('<link rel="canonical" href="https://lowesbuildingservices.co.uk/" />'),
  'Canonical URL must be absolute and use the apex HTTPS host'
);
assert(
  html.includes('<meta property="og:url" content="https://lowesbuildingservices.co.uk/" />'),
  'Open Graph URL must be present and absolute'
);
assert(
  /<meta property="og:image" content="https:\/\//.test(html),
  'Open Graph image must use an absolute URL'
);
assert(!html.includes('fonts.googleapis.com'), 'Production HTML must not depend on Google Fonts');

const bootstrap = 'document.documentElement.classList.add("js");';
assert(html.includes(`<script>${bootstrap}</script>`), 'Expected pre-paint JavaScript bootstrap is missing');
const bootstrapHash = createHash('sha256').update(bootstrap).digest('base64');
assert(
  htaccess.includes(`'sha256-${bootstrapHash}'`),
  'Content Security Policy does not allowlist the exact bootstrap hash'
);

assert(/RewriteCond %\{HTTPS\} !=on \[OR\]/.test(htaccess), 'HTTPS redirect condition is missing');
assert(htaccess.includes('BROTLI_COMPRESS') && htaccess.includes('DEFLATE'), 'Compression fallback is incomplete');
assert(htaccess.includes('Cache-Control'), 'Cache policy is missing');
assert(deployment.includes('rsync --archive --delete --delay-updates'), 'Deployment must prune stale assets');
assert(
  deployment.indexOf('index.html.next $DEPLOYPATH/index.html') > deployment.indexOf('app.js.next $DEPLOYPATH/app.js'),
  'Deployment must publish index.html after its dependent assets'
);

assert(html.includes('data-count-from-year="1998"'), 'Business age counter must derive from 1998');
assert(html.includes('data-current-year'), 'Copyright year must update automatically');

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Static checks passed (${ids.length} unique IDs, ${localReferences.length} local references).`);
}
