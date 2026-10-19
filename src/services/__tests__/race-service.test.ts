import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const php = vi.hoisted(() => ({ request: vi.fn(), owner: 'account-a' as string | null }));
vi.mock('../php-api', () => ({
  apiRequest: php.request,
  isBackendConfigured: true,
  authService: { currentSession: () => ({ user: php.owner ? { id: php.owner } : null }) },
}));
import { raceService, subscribeRace, type RaceRoom } from '../race-service';

const room = (version = 1): RaceRoom => ({
  id: 'room-id', room_code: 'A1B2C3', host_id: 'account-a', opponent_id: 'account-b',
  expected_text: 'clear focus', status: 'active', duration_seconds: 30, version,
  countdown_started_at: null, started_at: '2026-10-19T00:00:00.000Z',
  deadline_at: '2026-10-19T00:00:30.000Z', ended_at: null, winner_id: null,
  host_progress: 0, opponent_progress: 0, host_wpm: null, opponent_wpm: null,
  host_accuracy: null, opponent_accuracy: null, is_public: false, is_bot_race: false,
});
beforeEach(() => { php.request.mockReset(); php.owner = 'account-a'; });
afterEach(() => vi.useRealTimers());

describe('PHP race transport', () => {
  it('uses explicit authenticated race actions and normalized invite codes', async () => {
    php.request.mockResolvedValue({ room: room() });
    await raceService.create(60);
    expect(php.request).toHaveBeenLastCalledWith('/race/create', expect.objectContaining({
      method: 'POST', expectedOwner: 'account-a', body: { duration: 60 },
    }));
    await raceService.join(' a1b2c3 ');
    expect(php.request).toHaveBeenLastCalledWith('/race/join', expect.objectContaining({ body: { code: 'A1B2C3' } }));
    await raceService.rematch('room-id');
    expect(php.request).toHaveBeenLastCalledWith('/race/rematch', expect.objectContaining({ body: { raceId: 'room-id' } }));
  });

  it('requires a current owner and rejects an unacknowledged room', async () => {
    php.owner = null;
    await expect(raceService.create()).rejects.toThrow('Sign in');
    expect(php.request).not.toHaveBeenCalled();
    php.owner = 'account-a';
    php.request.mockResolvedValue({ room: null });
    await expect(raceService.create()).rejects.toThrow('valid room');
  });

  it('does not overlap polls or replace a newer room with an older snapshot', async () => {
    vi.useFakeTimers();
    let resolve!: (value: { room: RaceRoom }) => void;
    php.request.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    php.request.mockResolvedValue({ room: room(1) });
    const onRoom = vi.fn();
    const onError = vi.fn();
    const stop = subscribeRace('A1B2C3', onRoom, onError);
    await vi.advanceTimersByTimeAsync(5000);
    expect(php.request).toHaveBeenCalledOnce();
    resolve({ room: room(2) });
    await vi.advanceTimersByTimeAsync(0);
    expect(onRoom).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(750);
    expect(php.request).toHaveBeenCalledTimes(2);
    expect(onRoom).toHaveBeenCalledOnce();
    expect(onError).not.toHaveBeenCalled();
    stop();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('aborts polling ownership and ignores a response delivered after leaving', async () => {
    vi.useFakeTimers();
    let resolve!: (value: { room: RaceRoom }) => void;
    php.request.mockImplementation(() => new Promise((done) => { resolve = done; }));
    const onRoom = vi.fn();
    const onError = vi.fn();
    const stop = subscribeRace('A1B2C3', onRoom, onError);
    const signal = php.request.mock.calls[0][1].signal as AbortSignal;
    stop();
    expect(signal.aborted).toBe(true);
    resolve({ room: room() });
    await vi.advanceTimersByTimeAsync(5000);
    expect(onRoom).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(php.request).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reports a transport failure and retries without inventing opponent progress', async () => {
    vi.useFakeTimers();
    php.request.mockRejectedValueOnce(new Error('Connection interrupted')).mockResolvedValue({ room: room(2) });
    const onRoom = vi.fn();
    const onError = vi.fn();
    const stop = subscribeRace('A1B2C3', onRoom, onError);
    await vi.advanceTimersByTimeAsync(0);
    expect(onError).toHaveBeenCalledOnce();
    expect(onRoom).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2000);
    expect(onRoom).toHaveBeenCalledWith(room(2));
    stop();
  });
});
