import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const blob = execFileSync('git', ['show', ':vercel.json'], { encoding: 'utf8' });
const config = JSON.parse(blob);
const scripts = JSON.parse(execFileSync('git', ['show', ':package.json'], { encoding: 'utf8' })).scripts;
const checks = [];
const check = (name, pass) => checks.push({ name, pass: Boolean(pass) });
check('valid JSON', true);
check('Vite framework', config.framework === 'vite');
check('tested static build command exists', config.buildCommand === 'npm run build:vercel' && scripts['build:vercel'] === 'node scripts/build-frontend.mjs vercel');
check('dist output', config.outputDirectory === 'dist');
check('SPA rewrite', config.rewrites.some(rule => rule.source === '/(.*)' && rule.destination === '/index.html'));
const common = config.headers.find(rule => rule.source === '/(.*)');
const expected = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), gyroscope=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https: wss:; worker-src 'self' blob:; manifest-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
};
for (const [key, value] of Object.entries(expected)) check(key, common?.headers.some(header => header.key.toLowerCase() === key.toLowerCase() && header.value === value));
for (const source of ['/sw.js', '/offline-build.json', '/index.html']) check(`${source} no-cache`, config.headers.find(rule => rule.source === source)?.headers.some(header => header.key.toLowerCase() === 'cache-control' && header.value === 'no-cache'));
check('working JSON matches staged config', JSON.stringify(JSON.parse(await readFile('vercel.json', 'utf8'))) === JSON.stringify(config));
const report = { checkedAt: new Date().toISOString(), scope: 'Non-browser configuration review of staged vercel.json only; no build, HTTP request or remote deployment.', source: ':vercel.json', stagedSha256: createHash('sha256').update(blob).digest('hex'), passed: checks.filter(check => check.pass).length, total: checks.length, checks, requiredGlobalHeaders: expected, servedVercelResponseHeaders: 'UNVERIFIED', postAcceptanceNote: 'Permissions-Policy was restored after static acceptance. The local directory-server browser tests did not simulate or verify Vercel response headers; compiled web assets are unchanged by this hosting configuration edit.' };
await writeFile('audit/mobile-games-static-2026-10-20/vercel-header-verification.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, total: report.total, servedVercelResponseHeaders: report.servedVercelResponseHeaders }));
if (report.passed !== report.total) process.exitCode = 1;
