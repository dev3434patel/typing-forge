import { memo } from "react";
import {
  SIGNAL_RUN_GATES_PER_STAGE,
  SIGNAL_RUN_STAGES,
} from "@/lib/typing-game";

/** Decorative SVG is kept separate from the accessible game state and controls. */
export const SignalScene = memo(function SignalScene({ gate, totalGates }: { gate: number; totalGates: number }) {
  const stage = Math.min(
    2,
    Math.floor(gate / SIGNAL_RUN_GATES_PER_STAGE),
  );
  const stageProgress =
    gate === totalGates
      ? 6
      : gate % SIGNAL_RUN_GATES_PER_STAGE;
  return (
    <div className="signal-scene" data-stage={stage} aria-hidden="true">
      <svg viewBox="0 0 720 230" fill="none" className="signal-landscape">
        <path
          d="M0 187 100 133 210 163 327 93 445 145 560 95 720 145V230H0Z"
          className="signal-mountain-far"
        />
        <path
          d="m0 219 145-61 122 50 126-53 127 48 200-60v87H0Z"
          className="signal-mountain-near"
        />
        <path
          d="M60 171C180 75 270 211 372 126S551 93 660 62"
          className="signal-route"
        />
        {[
          { x: 60, y: 171 },
          { x: 169, y: 136 },
          { x: 279, y: 156 },
          { x: 389, y: 112 },
          { x: 520, y: 89 },
          { x: 660, y: 62 },
        ].map((point, index) => (
          <g
            key={index}
            className={
              index < stageProgress ? "signal-beacon is-lit" : "signal-beacon"
            }
          >
            <circle cx={point.x} cy={point.y} r="15" />
            <circle cx={point.x} cy={point.y} r="4" />
            <path d={`M${point.x} ${point.y - 8}v-15m-7 6 7-6 7 6`} />
          </g>
        ))}
        <path d="m340 198 20-11 20 11-20 11Z" className="signal-craft" />
        <path d="m350 211 10 9 10-9" className="signal-craft-tail" />
        <circle cx="620" cy="35" r="15" className="signal-moon" />
        <path
          d="M67 53h4m-2-2v4m375-28h4m-2-2v4m-222 37h4m-2-2v4m329-4h4m-2-2v4"
          className="signal-stars"
        />
      </svg>
      <div className="signal-scene-caption">
        <span>
          {String(stage + 1).padStart(2, "0")} / {SIGNAL_RUN_STAGES[stage].name}
        </span>
        <span>{stageProgress} / 6 beacons</span>
      </div>
    </div>
  );
});
