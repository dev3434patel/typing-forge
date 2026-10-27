import type { GameEvidence } from '../engine/types';
import { gameDefinition } from '../modes/catalog';
export function downloadJson(value: unknown, name: string): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
/** No target text, account handle, email or seed is placed on the share card. */
export async function shareArcadeCard(evidence: GameEvidence): Promise<void> {
  await document.fonts.ready;
  const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 630;
  const context = canvas.getContext('2d'); if (!context) throw new Error('Image export is unavailable');
  context.fillStyle = '#07070A'; context.fillRect(0, 0, 1200, 630);
  context.fillStyle = '#EDEDF2'; context.font = '700 42px Sora, sans-serif'; context.fillText('SparowType', 72, 96);
  context.font = '600 48px Inter, sans-serif'; context.fillText(gameDefinition(evidence.gameId)!.name, 72, 206);
  context.font = '500 24px Inter, sans-serif'; context.fillStyle = '#C6FF3D'; context.fillText('LOCAL PRACTICE · canonical typing evidence', 72, 258);
  context.fillStyle = '#EDEDF2'; context.font = '700 80px Sora, sans-serif';
  const wpm = evidence.session.metrics.wpm; context.fillText(wpm === null ? '— WPM' : `${wpm.toFixed(0)} WPM`, 72, 386);
  context.font = '500 30px Inter, sans-serif'; context.fillText(`${evidence.session.metrics.inputAccuracy?.toFixed(1) ?? '—'}% attempt accuracy · ${evidence.completedWords} words`, 72, 450);
  context.font = '400 22px Inter, sans-serif'; context.fillStyle = '#8B8BA0'; context.fillText(`${evidence.difficulty} · ${evidence.variant} · ${new Date(evidence.session.finishedAtWall).toISOString().slice(0, 10)}`, 72, 536);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Image export failed')), 'image/png'));
  const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = `sparowtype-${evidence.gameId}-local.png`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
