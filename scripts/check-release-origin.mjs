import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { resolveDeploymentConfig } from '../build/deployment-config.mjs';

/** Local builds remain usable without a domain. Publishing requires an explicit origin. */
export function checkReleaseOrigin(environment = process.env) {
  const config = resolveDeploymentConfig(environment);
  if (!config.siteUrl) throw new Error('Release blocked: set SPAROWTYPE_SITE_URL to the real public HTTPS application URL (including its Pages base path). Local npm run build remains available.');
  const url = new URL(config.siteUrl);
  if (url.protocol !== 'https:' || /^(localhost|127(?:\.\d{1,3}){3}|\[::1\])$/i.test(url.hostname) || /\.(invalid|test|localhost|example)$/i.test(url.hostname) || /(?:^|\.)example\.(com|net|org)$/i.test(url.hostname)) {
    throw new Error('Release blocked: SPAROWTYPE_SITE_URL must be the real public HTTPS application URL, not a local or reserved test hostname.');
  }
  return { status: 'PASS-SCOPED', target: config.target, siteUrl: url.href, base: config.base, scope: 'Configuration validation only; DNS, TLS and hosted routing are not verified.' };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { process.stdout.write(JSON.stringify(checkReleaseOrigin(), null, 2) + '\n'); }
  catch (error) { process.stderr.write(error.message + '\n'); process.exitCode = 1; }
}
