import type { SessionInsights } from '@/domain/analytics/session-insights';
import { FINGER_NAMES, TRAINING_FINGERS } from '@/domain/training/finger-map';

/** Static SVG: no motion is required, and missing observations are gaps rather than zero scores. */
export function FingerAccuracyChart({ fingers }: { fingers: SessionInsights['fingers'] }) {
  const observed = new Map(fingers.map(finger => [finger.finger, finger]));
  const position = (index: number, ratio: number): [number, number] => {
    const angle = -Math.PI / 2 + index * 2 * Math.PI / TRAINING_FINGERS.length;
    return [160 + Math.cos(angle) * 100 * ratio, 145 + Math.sin(angle) * 100 * ratio];
  };
  return <div className="mt-6 grid sm:grid-cols-[minmax(0,320px)_1fr] items-center gap-4">
    <svg viewBox="0 0 320 295" className="w-full max-w-xs" role="img" aria-label="Observed accuracy by reference finger, from the center at zero percent to the outside at one hundred percent. Missing fingers have no measured point; labeled values follow.">
      {[.25, .5, .75, 1].map(ratio => <polygon key={ratio} points={TRAINING_FINGERS.map((_, index) => position(index, ratio).join(',')).join(' ')} fill="none" stroke="currentColor" opacity={.15} />)}
      {TRAINING_FINGERS.map((finger, index) => {
        const [x, y] = position(index, 1), label = position(index, 1.2), measurement = observed.get(finger);
        const point = measurement ? position(index, measurement.accuracy / 100) : null;
        return <g key={finger}><line x1={160} y1={145} x2={x} y2={y} stroke="currentColor" opacity={.2} />{point && <><line x1={160} y1={145} x2={point[0]} y2={point[1]} stroke="var(--forge-accent)" strokeWidth={2} /><circle cx={point[0]} cy={point[1]} r={4} fill="var(--forge-accent)" stroke="currentColor" /></>}<text x={label[0]} y={label[1]} textAnchor="middle" dominantBaseline="central" fill="currentColor" fontSize={12}>{index + 1}</text></g>;
      })}
    </svg>
    <div><h3 className="font-medium">Reference-finger accuracy</h3><p className="text-xs text-muted-foreground mt-2">Chart numbers match the labeled reference fingers below. Unobserved fingers have no point. These are physical layout assignments, not detected finger movements.</p><ol className="space-y-2 mt-3 text-xs">{TRAINING_FINGERS.map((finger, index) => <li key={finger}><span>{index + 1}. {FINGER_NAMES[finger]}: </span><strong>{observed.has(finger) ? `${observed.get(finger)!.accuracy.toFixed(1)}% · ${observed.get(finger)!.n} attempts` : 'Not measured'}</strong></li>)}</ol></div>
  </div>;
}
