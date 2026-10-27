import { graphemes } from '@/lib/typing-core/transcript';

export interface TargetFeedback {
  matched: string;
  next: string;
  remaining: string;
  matchedUnits: number;
  totalUnits: number;
}

/** Presentation only: never awards credit or changes a canonical attempt. */
export function targetFeedback(target: string, draft: string, displayedTarget = target): TargetFeedback {
  const expected = graphemes(target), entered = graphemes(draft), displayed = graphemes(displayedTarget);
  let matchedUnits = 0;
  while (matchedUnits < expected.length && matchedUnits < entered.length && expected[matchedUnits] === entered[matchedUnits]) matchedUnits++;
  return {
    matched: displayed.slice(0, matchedUnits).join(''),
    next: displayed[matchedUnits] ?? '',
    remaining: displayed.slice(matchedUnits + 1).join(''),
    matchedUnits,
    totalUnits: expected.length,
  };
}

type LabelContext = Pick<CanvasRenderingContext2D,
  'save' | 'restore' | 'beginPath' | 'rect' | 'clip' | 'fillText' | 'measureText' | 'moveTo' | 'lineTo' | 'stroke' | 'fillStyle' | 'strokeStyle' | 'lineWidth' | 'direction'>;

/** Repaint the same complete shaped word through clips. Splitting fillText into
 * letter runs would disturb kerning, combining characters and joined scripts.
 * Masked phantom labels are clipped as displayed; this cannot reveal their text.
 */
export function paintTargetFeedback(context: LabelContext, label: string, x: number, y: number, feedback: TargetFeedback, accent: string, text: string): void {
  const displayed = graphemes(label), rtl = /^[^\p{L}]*[\p{Script=Arabic}\p{Script=Hebrew}]/u.test(label);
  const width = context.measureText(label).width;
  const matchedWidth = Math.min(width, context.measureText(displayed.slice(0, feedback.matchedUnits).join('')).width);
  const nextEdge = Math.min(width, context.measureText(displayed.slice(0, feedback.matchedUnits + 1).join('')).width);
  const left = x - width / 2;
  context.save();
  context.direction = rtl ? 'rtl' : 'ltr';
  if (matchedWidth > 0) {
    context.save(); context.beginPath();
    context.rect(rtl ? left + width - matchedWidth : left, y - 18, matchedWidth, 36);
    context.clip(); context.fillStyle = accent; context.fillText(label, x, y); context.restore();
  }
  if (feedback.matchedUnits < feedback.totalUnits && nextEdge > matchedWidth) {
    const start = rtl ? left + width - nextEdge : left + matchedWidth;
    const end = rtl ? left + width - matchedWidth : left + nextEdge;
    context.strokeStyle = text; context.lineWidth = 2; context.beginPath();
    context.moveTo(start, y + 11); context.lineTo(end, y + 11); context.stroke();
  }
  context.restore();
}
