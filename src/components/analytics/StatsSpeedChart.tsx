import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { metricLabel } from '@/services/history-model';

export interface StatsSpeedPoint {
  session: number;
  wpm: number | null;
  accuracy: number | null;
  date: string;
}

/** Loaded after the user selects a comparison with actual speed observations. */
export default function StatsSpeedChart({ chart }: { chart: StatsSpeedPoint[] }) {
  return <div className="h-64 mt-7" role="img" aria-label={`Typing speed for ${chart.length} matched sessions. Exact values are available in the history table.`}>
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chart}>
        <defs>
          <linearGradient id="progress-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--forge-accent)" stopOpacity={.18} />
            <stop offset="100%" stopColor="var(--forge-accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--forge-border)" vertical={false} />
        <XAxis dataKey="session" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--ui-border))', borderRadius: 10 }}
          labelFormatter={label => `Session ${label}`}
          formatter={value => [metricLabel(Number(value)), 'WPM']}
        />
        <Area type="linear" dataKey="wpm" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#progress-fill)" isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  </div>;
}
