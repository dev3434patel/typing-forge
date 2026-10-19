import { cp, lstat, mkdir, mkdtemp, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const destination = path.resolve(root, 'hosting-build');
const output = await mkdtemp(path.join(root, '.hosting-stage-'));
await mkdir(path.join(output, 'public_html/api'), { recursive: true });
await mkdir(path.join(output, 'sparowtype-private'), { recursive: true });
await cp(path.join(root, 'dist'), path.join(output, 'public_html'), { recursive: true });
for (const source of ['src', 'bin', 'public', 'bootstrap.php', 'config.example.php', 'schema.sql', 'UNICODE-LICENSE.txt', '.htaccess']) {
  await cp(path.join(root, 'backend', source), path.join(output, 'sparowtype-private', source), { recursive: true });
}
await writeFile(path.join(output, 'public_html/api/index.php'), `<?php\ndeclare(strict_types=1);\nrequire dirname(__DIR__, 2).'/sparowtype-private/public/index.php';\n`);
await cp(path.join(root, 'backend/public/.htaccess'), path.join(output, 'public_html/api/.htaccess'));
await writeFile(path.join(output, 'public_html/.htaccess'), `Options -Indexes
<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "DENY"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), gyroscope=()"
  Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https: wss:; worker-src 'self' blob:; manifest-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
</IfModule>
<FilesMatch "^(sw\\.js|index\\.html|offline-build\\.json)$">
  <IfModule mod_headers.c>
    Header set Cache-Control "no-cache"
  </IfModule>
</FilesMatch>
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule ^api(?:/.*)?$ api/index.php [QSA,END]
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  RewriteRule ^ index.html [L]
</IfModule>
`);
const instructions = await readFile(path.join(root, 'docs/PHP_XAMPP_SETUP.md'), 'utf8');
await writeFile(path.join(output, 'SETUP.md'), instructions);
// Publish a fresh tree; merging into a prior package could retain a manually
// added secret or obsolete asset. Preserve the entire old output outside it.
const existing = await lstat(destination).catch(error => { if (error.code !== 'ENOENT') throw error; return null; });
if (existing) {
  if (!existing.isDirectory() || existing.isSymbolicLink()) throw new Error('hosting-build must be an ordinary directory. Existing output was preserved.');
  const archiveRoot = path.resolve(root, 'hosting-archive');
  const archive = path.resolve(archiveRoot, `${Date.now()}`);
  if (path.dirname(destination) !== root || path.dirname(archive) !== archiveRoot || path.dirname(archiveRoot) !== root) throw new Error('Hosting output path escaped the workspace.');
  await mkdir(archiveRoot, { recursive: true });
  await rename(destination, archive);
}
await rename(output, destination);
console.log('Hosting package created: hosting-build/public_html + hosting-build/sparowtype-private. No local credentials were copied.');
