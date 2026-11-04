/** Audit-only browser init script. It never changes application state or input. */
export function installCourseResetProbe(): void {
  if (location.pathname.replace(/\/+$/, '') !== '/profile') return;
  type Scalar = string | number | boolean | null;
  type Row = Record<string, Scalar>;
  const targetWindow = window as Window & {
    __sparowCourseResetDiagnostic?: (row: Row) => unknown;
  };
  const maximumRows = 160;
  const installedAt = performance.now();
  const identities = new WeakMap<Node, number>();
  let nextIdentity = 1;
  let firstInput: HTMLInputElement | null = null;
  let firstMain: Element | null = null;
  let rows = 0;
  let streamErrors = 0;
  let observerErrors = 0;
  let previousMutation = '';
  const identity = (node: Node | null): number | null => {
    if (!node) return null;
    let value = identities.get(node);
    if (value === undefined) { value = nextIdentity++; identities.set(node, value); }
    return value;
  };
  const input = (): HTMLInputElement | null => {
    const element = document.getElementById('delete-confirmation');
    return element instanceof HTMLInputElement ? element : null;
  };
  const marker = (key: string, json: boolean): { present: boolean; at: number | null } => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return { present: false, at: null };
      const parsed: unknown = json ? JSON.parse(raw) : Number(raw);
      const value = json && parsed && typeof parsed === 'object'
        ? (parsed as { at?: unknown }).at : parsed;
      return { present: true, at: typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= Number.MAX_SAFE_INTEGER ? value : null };
    } catch { return { present: false, at: null }; }
  };
  const facts = (): Row => {
    const current = input();
    const main = document.querySelector('main#main-content');
    const heading = main?.querySelector('h1');
    const buttons = main ? Array.from(main.querySelectorAll('button')) : [];
    const reset = buttons.find(button => button.textContent?.trim() === 'Reset guest workspace');
    const working = buttons.some(button => button.textContent?.trim() === 'Working…');
    const workspace = marker('sparowtype.workspace-reset.v1:guest', true);
    const progression = marker('sparowtype:progression-reset:v1:guest', false);
    return {
      inputNode: identity(current), mainNode: identity(main),
      firstInputNode: identity(firstInput), firstMainNode: identity(firstMain),
      sameInput: current !== null && current === firstInput,
      sameMain: main !== null && main === firstMain,
      inputConnected: current?.isConnected ?? false,
      inputFocused: current !== null && document.activeElement === current,
      inputValue: !current ? 'absent' : current.value === '' ? '' : current.value === 'DELETE' ? 'DELETE' : 'other',
      guestHeading: heading?.textContent?.trim() === 'Guest workspace',
      guestResetButton: reset !== undefined,
      resetDisabled: reset?.disabled ?? null,
      workingButton: working,
      workspaceResetPresent: workspace.present, workspaceResetAt: workspace.at,
      progressionResetPresent: progression.present, progressionResetAt: progression.at,
    };
  };
  const emit = (type: string, phase: string, extra: Row = {}, changedOnly = false): void => {
    if (rows >= maximumRows || location.pathname.replace(/\/+$/, '') !== '/profile') return;
    try {
      const state = facts();
      if (changedOnly) {
        const signature = JSON.stringify(state);
        if (signature === previousMutation) return;
        previousMutation = signature;
      }
      const row: Row = { version: 1, documentTimeOrigin: performance.timeOrigin, sequence: ++rows, elapsedMs: Math.round((performance.now() - installedAt) * 1000) / 1000, type, phase, streamErrors, observerErrors, ...state, ...extra };
      const binding = targetWindow.__sparowCourseResetDiagnostic;
      if (typeof binding !== 'function') { streamErrors = Math.min(streamErrors + 1, maximumRows); return; }
      const sent = binding(row);
      if (sent && typeof (sent as Promise<unknown>).then === 'function') {
        void Promise.resolve(sent).catch(() => { streamErrors = Math.min(streamErrors + 1, maximumRows); });
      }
    } catch { observerErrors = Math.min(observerErrors + 1, maximumRows); }
  };
  const later = (type: string, extra: Row = {}): void => {
    queueMicrotask(() => emit(type, 'microtask', extra));
    requestAnimationFrame(() => emit(type, 'animation-frame', extra));
  };
  // React captures this descriptor while mounting its controlled-input tracker.
  // Install before mount on /profile, but observe only the discovered profile input.
  let setterInstalled = false;
  try {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    if (descriptor?.set && descriptor.configurable) {
      const nativeSetter = descriptor.set;
      Object.defineProperty(HTMLInputElement.prototype, 'value', {
        ...descriptor,
        set: function (this: HTMLInputElement, requested: unknown): void {
          nativeSetter.call(this, requested);
          // Native coercion, receiver checks and exceptions remain unchanged.
          try {
            if (firstInput && this.id === 'delete-confirmation' && (requested === '' || requested === 'DELETE')) {
              const extra: Row = { requestedValue: requested, setterNode: identity(this), setterConnected: this.isConnected };
              emit('value-setter', 'after-native', extra);
              later('value-setter', extra);
            }
          } catch { observerErrors = Math.min(observerErrors + 1, maximumRows); }
        },
      });
      setterInstalled = true;
    }
  } catch { observerErrors = Math.min(observerErrors + 1, maximumRows); }
  const start = (): boolean => {
    const current = input();
    if (!current) return false;
    firstInput = current;
    firstMain = document.querySelector('main#main-content');
    emit('probe', 'attached');
    emit('probe', setterInstalled ? 'setter-installed' : 'setter-unavailable');
    for (const type of ['focus', 'blur', 'beforeinput', 'input', 'change']) {
      document.addEventListener(type, event => {
        if (!(event.target instanceof HTMLInputElement) || event.target.id !== 'delete-confirmation') return;
        const extra: Row = { trusted: event.isTrusted, eventNode: identity(event.target), eventConnected: event.target.isConnected };
        emit(type, 'capture', extra);
        later(type, extra);
      }, true);
    }
    for (const type of ['sparowtype:workspace-reset', 'sparowtype:workspace-reset-result']) {
      window.addEventListener(type, event => {
        const detail: unknown = (event as CustomEvent<unknown>).detail;
        if (!detail || typeof detail !== 'object') return;
        const known = detail as { ownerId?: unknown; at?: unknown; succeeded?: unknown };
        if (known.ownerId !== 'guest') return;
        const extra: Row = { guestEvent: true, succeeded: typeof known.succeeded === 'boolean' ? known.succeeded : null, resetAt: typeof known.at === 'number' && Number.isFinite(known.at) && known.at > 0 && known.at <= Number.MAX_SAFE_INTEGER ? known.at : null };
        emit(type, 'capture', extra);
        later(type, extra);
      });
    }
    window.addEventListener('storage', event => {
      if (event.key === 'sparowtype.workspace-reset.v1:guest' || event.key === 'sparowtype:progression-reset:v1:guest') emit('storage', 'known-guest-reset');
    });
    const changes = new MutationObserver(() => emit('dom', 'changed', {}, true));
    changes.observe(document, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['value', 'disabled', 'aria-busy'] });
    window.addEventListener('pagehide', () => emit('document', 'pagehide'), { once: true });
    later('probe');
    return true;
  };
  if (!start()) {
    const discovery = new MutationObserver(() => {
      if (start()) discovery.disconnect();
    });
    discovery.observe(document, { childList: true, subtree: true });
  }
}
