import type { privateShareProjection } from './dashboard';

export type ShareCardContext = Pick<CanvasRenderingContext2D, 'fillStyle' | 'font' | 'fillRect' | 'beginPath' | 'roundRect' | 'fill' | 'fillText' | 'measureText'>;
export const SHARE_CARD_SIZE = { width: 1200, height: 630 } as const;
const metric = (value: number | null, digits = 0) => value === null ? '—' : value.toFixed(digits);

/** Fixed privacy-preserving paint contract, testable without browser storage. */
export function renderShareCard(context: ShareCardContext, projection: ReturnType<typeof privateShareProjection>, color: (name: string, fallback: string) => string) {
  context.fillStyle = color('background', '#0B0D12');
  context.fillRect(0, 0, 1200, 630);
  context.fillStyle = '#07070A';
  context.beginPath(); context.roundRect(54, 45, 245, 60, 12); context.fill();
  context.font = '700 26px Sora, sans-serif';
  let x = 70;
  for (const [index, letter] of [...'SparowType'].entries()) {
    context.fillStyle = index < 6 ? '#EDEDF2' : '#C6FF3D';
    context.fillText(letter, x, 85); x += context.measureText(letter).width - 1.04;
  }
  context.fillStyle = color('secondary', '#AAB6C6'); context.font = '20px "Inter Variable", sans-serif';
  context.fillText(`${projection.mode} · ${projection.metrics.durationSeconds.toFixed(1)}s · personal practice`, 70, 150);
  context.fillStyle = color('text', '#EEF1F7'); context.font = '600 140px "JetBrains Mono Variable", monospace';
  context.fillText(metric(projection.metrics.wpm), 65, 340);
  context.font = '24px "Inter Variable", sans-serif'; context.fillStyle = color('muted', '#8796A8'); context.fillText('words per minute', 75, 390);
  context.fillStyle = color('accent', '#C6FF3D'); context.font = '500 72px "JetBrains Mono Variable", monospace';
  context.fillText(`${metric(projection.metrics.inputAccuracy, 1)}%`, 700, 300);
  context.fillStyle = color('muted', '#8796A8'); context.font = '24px "Inter Variable", sans-serif'; context.fillText('input accuracy', 705, 355);
  context.fillStyle = color('border', '#2D3746'); context.fillRect(70, 475, 1060, 1);
  context.fillStyle = color('muted', '#8796A8'); context.font = '18px "Inter Variable", sans-serif';
  context.fillText('Personal practice · no private text included', 70, 530);
}
