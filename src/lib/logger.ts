/**
 * Lightweight application logger.
 *
 * - `debug`/`info`/`warn` are silent in production builds.
 * - They can be re-enabled at runtime by appending `?debug=1` to the URL.
 * - `error` always logs so genuine failures are never swallowed.
 *
 * Production code must never call `console.log` directly — use this logger instead.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

let debugOverride: boolean | null = null;

function urlRequestsDebug(): boolean {
  if (typeof window === 'undefined' || !window.location) return false;
  try {
    return new URLSearchParams(window.location.search).get('debug') === '1';
  } catch {
    return false;
  }
}

function isVerboseEnabled(): boolean {
  if (debugOverride !== null) return debugOverride;
  const isDev = Boolean(import.meta.env?.DEV);
  return isDev || urlRequestsDebug();
}

function shouldLog(level: LogLevel): boolean {
  if (level === 'error') return true;
  return isVerboseEnabled();
}

export const logger = {
  /** Force verbose logging on/off (primarily for tests). Pass `null` to restore defaults. */
  setDebug(value: boolean | null): void {
    debugOverride = value;
  },
  debug(...args: unknown[]): void {
    if (shouldLog('debug')) console.debug(...args);
  },
  info(...args: unknown[]): void {
    if (shouldLog('info')) console.info(...args);
  },
  warn(...args: unknown[]): void {
    if (shouldLog('warn')) console.warn(...args);
  },
  error(...args: unknown[]): void {
    if (shouldLog('error')) console.error(...args);
  },
};
