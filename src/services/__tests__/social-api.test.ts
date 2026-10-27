import { beforeEach, describe, expect, it, vi } from 'vitest';
const request = vi.hoisted(() => vi.fn());
vi.mock('../php-api', () => ({ apiRequest: request, ApiError: class extends Error { constructor(public code: string, message: string, public status: number) { super(message); } } }));
import { SocialApi } from '../social-api';
const snapshot = (ownerId = 'alice') => ({ ownerId, friends: [], requests: [], blocked: [], duels: [] });
beforeEach(() => request.mockReset().mockResolvedValue(snapshot()));
describe('owner-bound social API', () => {
  it('binds every private request to its immutable owner', async () => { const api = new SocialApi('alice'); await api.load(); expect(request).toHaveBeenLastCalledWith('/social', expect.objectContaining({ expectedOwner: 'alice' })); await api.request('typing_friend'); expect(request).toHaveBeenLastCalledWith('/social/request', expect.objectContaining({ method: 'POST', expectedOwner: 'alice', body: { handle: 'typing_friend' } })); });
  it('does not surface a different owner’s contacts or duel result', async () => { request.mockResolvedValue(snapshot('bob')); await expect(new SocialApi('alice').load()).rejects.toMatchObject({ code: 'social-owner', status: 409 }); });
  it('retains explicit duel request identity on repeated creation requests', async () => { const api = new SocialApi('alice'); await api.createDuel('bob', 'one-intent'); await api.createDuel('bob', 'one-intent'); expect(request.mock.calls[0][1].body).toEqual(request.mock.calls[1][1].body); });
  it('sends canonical evidence through the duel endpoint without client XP, placement or score assertions', async () => { const candidate = { clientSessionId: 'one', events: [{ sequence: 0 }] } as never; await new SocialApi('alice').submitDuel('duel-one', candidate); expect(request).toHaveBeenCalledWith('/social/duel-submit', expect.objectContaining({ body: { duelId: 'duel-one', candidate }, expectedOwner: 'alice' })); expect(request.mock.calls[0][1].body.wpm).toBeUndefined(); });
  it('submits a fixed report category and no chat/message body', async () => { await new SocialApi('alice').report('bob', 'cheating'); expect(request).toHaveBeenCalledWith('/social/report', expect.objectContaining({ body: { userId: 'bob', reason: 'cheating' } })); });
});
