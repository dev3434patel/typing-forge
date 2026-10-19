import { describe, expect, it, vi } from 'vitest';
import type { AuthSession } from '../php-api';
import { observeAuthSession } from '../auth-state';

const session = (id: string | null): AuthSession => ({ user: id ? { id, email: `${id}@fixture.invalid`, handle: id, created_at: '2026-10-19T00:00:00Z' } : null, csrfToken: 'fixture-csrf' });
function source() {
  let notify!: (value: AuthSession) => void;
  let resolve!: (value: AuthSession) => void;
  let reject!: (cause: unknown) => void;
  const bootstrap = new Promise<AuthSession>((done, fail) => { resolve = done; reject = fail; });
  const unsubscribe = vi.fn();
  const auth = { subscribe: vi.fn((callback: typeof notify) => { notify = callback; return unsubscribe; }), getSession: vi.fn(() => bootstrap) };
  return { auth, resolve, reject, unsubscribe, emit: (value: AuthSession) => notify(value) };
}
describe('cookie auth initialization ordering', () => {
  it('subscribes before requesting the initial account and returns its cookie session', async () => {
    const fixture = source(), changed = vi.fn(); observeAuthSession(fixture.auth, changed);
    expect(fixture.auth.subscribe.mock.invocationCallOrder[0]).toBeLessThan(fixture.auth.getSession.mock.invocationCallOrder[0]);
    fixture.resolve(session('alice')); await Promise.resolve();
    expect(changed).toHaveBeenCalledExactlyOnceWith(session('alice'));
  });
  it('does not restore the old account after a newer sign-out event', async () => {
    const fixture = source(), changed = vi.fn(); observeAuthSession(fixture.auth, changed);
    fixture.emit(session(null)); fixture.resolve(session('alice')); await Promise.resolve();
    expect(changed).toHaveBeenCalledExactlyOnceWith(session(null));
  });
  it('does not replace a newer signed-in account with a stale account read', async () => {
    const fixture = source(), changed = vi.fn(); observeAuthSession(fixture.auth, changed);
    fixture.emit(session('bob')); fixture.resolve(session('alice')); await Promise.resolve();
    expect(changed).toHaveBeenCalledExactlyOnceWith(session('bob'));
  });
  it('retains a newer account when the bootstrap request rejects', async () => {
    const fixture = source(), changed = vi.fn(); observeAuthSession(fixture.auth, changed);
    fixture.emit(session('bob')); fixture.reject(new Error('Storage read failed')); await Promise.resolve(); await Promise.resolve();
    expect(changed).toHaveBeenCalledExactlyOnceWith(session('bob'));
  });
  it('finishes bootstrap as a guest when transport fails before any auth event', async () => {
    const fixture = source(), changed = vi.fn(); observeAuthSession(fixture.auth, changed);
    fixture.reject(new Error('PHP API unavailable')); await Promise.resolve(); await Promise.resolve();
    expect(changed).toHaveBeenCalledExactlyOnceWith(null);
  });
  it('ignores queued events and a pending read after unsubscribing', async () => {
    const fixture = source(), changed = vi.fn(); const stop = observeAuthSession(fixture.auth, changed);
    stop(); fixture.emit(session('alice')); fixture.resolve(session('alice')); await Promise.resolve();
    expect(fixture.unsubscribe).toHaveBeenCalledOnce(); expect(changed).not.toHaveBeenCalled();
  });
});
