import { describe, expect, it } from 'vitest';
import { checkReleaseOrigin } from '../../../scripts/check-release-origin.mjs';

describe('explicit release origin', () => {
  it.each(['', 'http://localhost/', 'https://localhost/', 'https://127.0.0.1/', 'https://host.invalid/', 'https://example.test/', 'https://practice.example/', 'https://example.com/', 'https://www.example.net/', 'https://practice.example.org/'])('rejects absent/local/test origin %s', siteUrl => {
    expect(() => checkReleaseOrigin({ SPAROWTYPE_SITE_URL: siteUrl })).toThrow();
  });
  it.each(['https://sparowtype.vercel.app/', 'https://dev3434patel.github.io/typing-forge/'])('accepts explicitly configured public-form origin %s without claiming hosted verification', siteUrl => {
    const base = new URL(siteUrl).pathname;
    expect(checkReleaseOrigin({ SPAROWTYPE_SITE_URL: siteUrl, SPAROWTYPE_BASE_PATH: base })).toMatchObject({ status: 'PASS-SCOPED', siteUrl });
  });
  it('does not invent or infer the production origin', () => {
    expect(() => checkReleaseOrigin({ VERCEL_URL: 'preview.example.org' })).toThrow('set SPAROWTYPE_SITE_URL');
  });
});
