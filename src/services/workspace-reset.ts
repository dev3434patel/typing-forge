export interface WorkspaceReset { ownerId: string; id: string; at: number }
const prefix = 'sparowtype.workspace-reset.v1:';
const eventName = 'sparowtype:workspace-reset';
const resultName = 'sparowtype:workspace-reset-result';
const removedPrefix = 'sparowtype.session-removed.v1:';
const removedEvent = 'sparowtype:session-removed';
export interface WorkspaceSessionRemoval { ownerId: string; sessionId: string; nonce: string }
export function readWorkspaceSessionRemoval(ownerId: string): WorkspaceSessionRemoval | null {
  try { const value = JSON.parse(globalThis.localStorage?.getItem(removedPrefix + encodeURIComponent(ownerId)) ?? 'null'); return value?.ownerId === ownerId && typeof value.sessionId === 'string' && value.sessionId.length <= 200 && typeof value.nonce === 'string' ? value : null; } catch { return null; }
}
export function publishWorkspaceSessionRemoval(ownerId: string, sessionId: string): void {
  const detail: WorkspaceSessionRemoval = { ownerId, sessionId, nonce: crypto.randomUUID() };
  try { globalThis.localStorage?.setItem(removedPrefix + encodeURIComponent(ownerId), JSON.stringify(detail)); } catch { /* The durable repository tombstone and local event still apply. */ }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(removedEvent, { detail }));
}
export function subscribeWorkspaceSessionRemoval(listener: (removal: WorkspaceSessionRemoval) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const local = (event: Event) => listener((event as CustomEvent<WorkspaceSessionRemoval>).detail);
  const storage = (event: StorageEvent) => { if (!event.key?.startsWith(removedPrefix) || !event.newValue) return; try { const value = readWorkspaceSessionRemoval(decodeURIComponent(event.key.slice(removedPrefix.length))); if (value) listener(value); } catch { /* Ignore malformed storage events. */ } };
  window.addEventListener(removedEvent, local); window.addEventListener('storage', storage);
  return () => { window.removeEventListener(removedEvent, local); window.removeEventListener('storage', storage); };
}
export interface WorkspaceResetResult { ownerId: string; message: string; succeeded: boolean }
export function publishWorkspaceResetResult(result: WorkspaceResetResult): void { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(resultName, { detail: result })); }
export function subscribeWorkspaceResetResult(listener: (result: WorkspaceResetResult) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const receive = (event: Event) => listener((event as CustomEvent<WorkspaceResetResult>).detail);
  window.addEventListener(resultName, receive); return () => window.removeEventListener(resultName, receive);
}
export function readWorkspaceReset(ownerId: string): WorkspaceReset | null {
  try {
    const value = JSON.parse(globalThis.localStorage?.getItem(prefix + encodeURIComponent(ownerId)) ?? 'null') as WorkspaceReset | null;
    return value?.ownerId === ownerId && typeof value.id === 'string' && Number.isFinite(value.at) && value.at > 0 ? value : null;
  } catch { return null; }
}
/** Publish before awaiting deletion so controllers and pending writers lose their old generation. */
export function publishWorkspaceReset(ownerId: string): WorkspaceReset {
  const reset = { ownerId, id: crypto.randomUUID(), at: Date.now() };
  try { globalThis.localStorage?.setItem(prefix + encodeURIComponent(ownerId), JSON.stringify(reset)); } catch { /* This tab still resets when durable storage is blocked. */ }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(eventName, { detail: reset }));
  return reset;
}
export function subscribeWorkspaceReset(listener: (reset: WorkspaceReset) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const local = (event: Event) => listener((event as CustomEvent<WorkspaceReset>).detail);
  const otherTab = (event: StorageEvent) => {
    if (!event.key?.startsWith(prefix) || !event.newValue) return;
    try {
      const ownerId = decodeURIComponent(event.key.slice(prefix.length));
      const reset = readWorkspaceReset(ownerId);
      if (reset) listener(reset);
    } catch { /* Ignore malformed storage events. */ }
  };
  window.addEventListener(eventName, local);
  window.addEventListener('storage', otherTab);
  return () => { window.removeEventListener(eventName, local); window.removeEventListener('storage', otherTab); };
}
