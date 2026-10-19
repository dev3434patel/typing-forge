import type { AuthSession } from './php-api';

interface AuthSessionSource {
  subscribe: (callback: (session: AuthSession) => void) => () => void;
  getSession: () => Promise<AuthSession>;
}

/** Auth events are newer than the asynchronous bootstrap read they can overtake. */
export function observeAuthSession(auth: AuthSessionSource, onSession: (session: AuthSession | null) => void): () => void {
  let active = true;
  let receivedEvent = false;
  const unsubscribe = auth.subscribe(session => {
    if (!active) return;
    receivedEvent = true;
    onSession(session);
  });
  void auth.getSession().then(session => {
    if (active && !receivedEvent) onSession(session);
  }).catch(() => {
    if (active && !receivedEvent) onSession(null);
  });
  return () => {
    active = false;
    unsubscribe();
  };
}
