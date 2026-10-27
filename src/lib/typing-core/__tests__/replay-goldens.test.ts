import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { EVENT_LOG_SCHEMA_VERSION, replaySession } from '..';

const golden = JSON.parse(readFileSync(new URL('./fixtures/replay-v3.json', import.meta.url), 'utf8'));
describe('immutable canonical v3 event-log goldens', () => {
  it('pins the schema and covers at least30 distinct canonical logs', () => {
    expect(EVENT_LOG_SCHEMA_VERSION).toBe(3);
    expect(golden.schemaVersion).toBe(EVENT_LOG_SCHEMA_VERSION);
    expect(new Set(golden.fixtures.map(item => item.name)).size).toBeGreaterThanOrEqual(30);
  });
  for (const fixture of golden.fixtures) it(fixture.name, () => {
    const before = JSON.stringify(fixture);
    const replay = replaySession(fixture.configuration, fixture.events, fixture.elapsedMs, fixture.options);
    expect(replay.finalText).toBe(fixture.expected.finalText);
    expect(replay.cursor).toBe(fixture.expected.cursor);
    expect(replay.metrics).toEqual(fixture.expected.metrics);
    expect(createHash('sha256').update(JSON.stringify(replay)).digest('hex')).toBe(fixture.expected.sha256);
    expect(JSON.stringify(fixture)).toBe(before);
  });
});
