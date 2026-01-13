import { motion } from 'framer-motion';
import { Users, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';

interface SpeedHistogramProps {
  userAvgSpeed: number;
  userTopSpeed: number;
  // Distribution data: array of { range: string, count: number, percentage: number }
  distribution: { range: string; rangeStart: number; rangeEnd: number; count: number }[];
  percentileBeat: number; // What percentage of users you beat
}

export function SpeedHistogram({
  userAvgSpeed,
  userTopSpeed,
  distribution,
  percentileBeat,
}: SpeedHistogramProps) {
  // Find max count for scaling
  const maxCount = Math.max(...distribution.map(d => d.count), 1);

  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        Relative Typing Speed
      </h3>
      
      <p className="text-sm text-muted-foreground mb-4">
        This is a histogram of the typing speeds of all users, and your position in relation to them.
      </p>
      
      <div className="p-3 bg-primary/10 rounded-lg mb-4">
        <p className="text-sm">
          Your all time average speed beats{' '}
          <span className="font-bold text-primary">{percentileBeat.toFixed(2)}%</span>
          {' '}of all other people.
        </p>
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary rounded" />
          <span>Average speed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-success rounded" />
          <span>Top speed</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-2">
        See how fast you type relative to other users. The higher the bar is, the more people type at that speed. Your position is marked with the colored vertical lines.
      </p>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={distribution} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <XAxis
              dataKey="range"
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={50}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={[0, maxCount]}
              hide
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${value} users`, 'Count']}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {distribution.map((entry, index) => {
                const isUserAvg = userAvgSpeed >= entry.rangeStart && userAvgSpeed < entry.rangeEnd;
                const isUserTop = userTopSpeed >= entry.rangeStart && userTopSpeed < entry.rangeEnd;
                
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      isUserTop ? 'hsl(var(--success))' :
                      isUserAvg ? 'hsl(var(--primary))' :
                      'hsl(var(--muted-foreground) / 0.3)'
                    }
                  />
                );
              })}
            </Bar>
            {/* Reference lines for user speeds */}
            <ReferenceLine
              x={distribution.find(d => userAvgSpeed >= d.rangeStart && userAvgSpeed < d.rangeEnd)?.range}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
            <ReferenceLine
              x={distribution.find(d => userTopSpeed >= d.rangeStart && userTopSpeed < d.rangeEnd)?.range}
              stroke="hsl(var(--success))"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
