import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
beforeEach(() => { vi.resetModules(); vi.stubEnv('VITE_API_BASE_URL', '/api'); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('PHP cookie and CSRF transport', () => {
  it('bootstraps a guest CSRF token and binds a write to its expected owner without bearer tokens', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(json({ user: null, csrfToken: 'guest-token' })).mockResolvedValueOnce(json({ deleted: true }));
    vi.stubGlobal('fetch', fetcher);
    const { accountApi } = await import('../php-api');
    await accountApi.deleteSession('alice', 'session/one');
    expect(fetcher.mock.calls[0][0]).toBe('/api/auth/session');
    expect(fetcher.mock.calls[1][0]).toBe('/api/sessions/session%2Fone');
    const options = fetcher.mock.calls[1][1];
    expect(options.credentials).toBe('include');
    expect(options.headers['X-CSRF-Token']).toBe('guest-token');
    expect(options.headers.Authorization).toBeUndefined();
    expect(JSON.parse(options.body)).toEqual({ expectedOwner: 'alice' });
  });
  it('uses rotated authentication CSRF for subsequent writes', async () => {
    const session = { user: { id: 'alice', email: 'alice@fixture.invalid', handle: 'alice', created_at: '2026-10-19T00:00:00Z' }, csrfToken: 'signed-in-token' };
    const fetcher = vi.fn().mockResolvedValueOnce(json({ user: null, csrfToken: 'guest-token' })).mockResolvedValueOnce(json(session)).mockResolvedValueOnce(json({ id: 'alice', handle: 'new_handle' }));
    vi.stubGlobal('fetch', fetcher);
    const { authService, accountApi } = await import('../php-api');
    await authService.signIn('alice@fixture.invalid', 'correct horse battery');
    await accountApi.updateProfile('alice', 'new_handle');
    expect(fetcher.mock.calls[2][1].headers['X-CSRF-Token']).toBe('signed-in-token');
    expect(authService.currentSession()?.user?.id).toBe('alice');
  });
  it('refreshes stale CSRF once while keeping the intended owner immutable', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(json({ user: null, csrfToken: 'first' }))
      .mockResolvedValueOnce(json({ error: { code: 'csrf', message: 'Refresh' } }, 403))
      .mockResolvedValueOnce(json({ user: { id: 'bob' }, csrfToken: 'second' }))
      .mockResolvedValueOnce(json({ error: { code: 'owner-changed', message: 'Account changed' } }, 409));
    vi.stubGlobal('fetch', fetcher);
    const { accountApi } = await import('../php-api');
    await expect(accountApi.deleteSession('alice', 'one')).rejects.toMatchObject({ code: 'owner-changed', status: 409 });
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(JSON.parse(fetcher.mock.calls[3][1].body)).toEqual({ expectedOwner: 'alice' });
    expect(fetcher.mock.calls[3][1].headers['X-CSRF-Token']).toBe('second');
  });
  it('does not retry a rejected ownership request', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(json({ user: null, csrfToken: 'token' })).mockResolvedValueOnce(json({ error: { code: 'owner-changed', message: 'Account changed' } }, 409));
    vi.stubGlobal('fetch', fetcher);
    const { accountApi } = await import('../php-api');
    await expect(accountApi.deleteAccount('alice')).rejects.toMatchObject({ code: 'owner-changed' });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('binds protected reads to their expected owner and leaves public reads public', async () => {
    const fetcher = vi.fn().mockImplementation(async () => json({ cohorts: [] })); vi.stubGlobal('fetch', fetcher);
    const { accountApi } = await import('../php-api');
    await accountApi.preferences('alice'); await accountApi.cohorts();
    expect(fetcher.mock.calls[0][0]).toBe('/api/preferences?expectedOwner=alice');
    expect(fetcher.mock.calls[1][0]).toBe('/api/leaderboards/cohorts');
    expect(fetcher.mock.calls.every(([, options]) => options.method === 'GET' && options.credentials === 'include')).toBe(true);
  });
  it('reports a non-JSON PHP error without exposing its response body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>private server diagnostic</html>', { status: 500 })));
    const { apiRequest } = await import('../php-api');
    await expect(apiRequest('/profile')).rejects.toMatchObject({ code: 'invalid-response', status: 500 });
    await expect(apiRequest('/profile')).rejects.not.toThrow('private server diagnostic');
  });
  it('supports a hosting subdirectory and an explicit disabled backend', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '/sparowtype/api/');
    const fetcher = vi.fn().mockResolvedValue(json({ cohorts: [] })); vi.stubGlobal('fetch', fetcher);
    let api = await import('../php-api'); await api.accountApi.cohorts();
    expect(fetcher.mock.calls[0][0]).toBe('/sparowtype/api/leaderboards/cohorts');
    vi.resetModules(); vi.stubEnv('VITE_API_BASE_URL', 'disabled'); api = await import('../php-api');
    expect(api.isBackendConfigured).toBe(false);
    await expect(api.accountApi.cohorts()).rejects.toMatchObject({ code: 'backend-unavailable' });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('publishes server-discovered session expiry so the previous account cannot trap sign-in navigation', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(json({ user: { id: 'alice' }, csrfToken: 'account' }))
      .mockResolvedValueOnce(json({ user: null, csrfToken: 'guest' }));
    vi.stubGlobal('fetch', fetcher);
    const { authService } = await import('../php-api');
    const changed = vi.fn(), unsubscribe = authService.subscribe(changed);
    await authService.getSession(); await authService.getSession();
    expect(changed.mock.calls.map(([value]) => value.user?.id ?? null)).toEqual(['alice', null]);
    expect(authService.currentSession()?.user).toBeNull();
    unsubscribe();
  });
});
