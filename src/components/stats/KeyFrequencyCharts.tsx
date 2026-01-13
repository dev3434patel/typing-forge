import { motion } from 'framer-motion';
import { BarChart3, Grid3X3, Info } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

interface KeyFrequency {
  key: string;
  hits: number;
  misses: number;
  missRatio: number;
}

interface KeyFrequencyHistogramProps {
  frequencies: KeyFrequency[];
}

export function KeyFrequencyHistogram({ frequencies }: KeyFrequencyHistogramProps) {
  const sortedData = [...frequencies]
    .filter(f => f.hits > 0 || f.misses > 0)
    .sort((a, b) => (b.hits + b.misses) - (a.hits + a.misses));

  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        Key Frequency Histogram
      </h3>
      
      <p className="text-sm text-muted-foreground mb-2">
        This chart shows relative key frequencies.
      </p>

      <div className="flex items-center gap-4 mb-4 text-xs">
        <span className="text-muted-foreground">Bar color:</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-success rounded" />
          <span>– hit count,</span>
          <div className="w-3 h-3 bg-destructive rounded" />
          <span>– miss count,</span>
          <div className="w-3 h-3 bg-warning rounded" />
          <span>– miss/hit ratio (relative miss frequency).</span>
        </div>
      </div>

      {sortedData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-muted-foreground">
          <Info className="w-5 h-5 mr-2" />
          No frequency data available yet
        </div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <XAxis
                dataKey="key"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toUpperCase()}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                  fontSize: '11px',
                }}
                formatter={(value: number, name: string) => [value, name]}
                labelFormatter={(label) => label.toUpperCase()}
              />
              <Legend 
                wrapperStyle={{ fontSize: '11px' }}
              />
              <Bar dataKey="hits" stackId="a" fill="hsl(var(--success))" name="Hits" radius={[0, 0, 0, 0]} />
              <Bar dataKey="misses" stackId="a" fill="hsl(var(--destructive))" name="Misses" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}

interface KeyFrequencyHeatmapProps {
  frequencies: KeyFrequency[];
}

const KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

export function KeyFrequencyHeatmap({ frequencies }: KeyFrequencyHeatmapProps) {
  const getKeyData = (key: string) => {
    return frequencies.find(f => f.key === key) || { key, hits: 0, misses: 0, missRatio: 0 };
  };

  const maxTotal = Math.max(...frequencies.map(f => f.hits + f.misses), 1);

  const getKeyStyles = (data: KeyFrequency) => {
    const total = data.hits + data.misses;
    if (total === 0) return { hitSize: 0, missSize: 0 };
    
    const normalizedTotal = total / maxTotal;
    const baseSize = 8 + (normalizedTotal * 24); // 8-32px
    
    const hitRatio = data.hits / total;
    const missRatio = data.misses / total;
    
    return {
      hitSize: baseSize * hitRatio,
      missSize: baseSize * missRatio,
    };
  };

  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
        <Grid3X3 className="w-5 h-5 text-primary" />
        Key Frequency Heatmap
      </h3>
      
      <p className="text-sm text-muted-foreground mb-2">
        This chart shows relative key frequencies as a heatmap.
      </p>

      <div className="flex items-center gap-4 mb-4 text-xs">
        <span className="text-muted-foreground">Circle color:</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-success rounded-full" />
          <span>– hit count,</span>
          <div className="w-3 h-3 bg-destructive rounded-full" />
          <span>– miss count.</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex gap-1"
            style={{ marginLeft: rowIndex === 1 ? '20px' : rowIndex === 2 ? '40px' : '0' }}
          >
            {row.map((key) => {
              const data = getKeyData(key);
              const styles = getKeyStyles(data);
              const total = data.hits + data.misses;
              
              return (
                <div
                  key={key}
                  className="relative w-10 h-10 bg-muted rounded flex items-center justify-center group"
                >
                  <span className="text-xs font-mono font-bold text-muted-foreground z-10">
                    {key.toUpperCase()}
                  </span>
                  
                  {/* Hit circle */}
                  {styles.hitSize > 0 && (
                    <div
                      className="absolute rounded-full bg-success/60"
                      style={{
                        width: styles.hitSize,
                        height: styles.hitSize,
                      }}
                    />
                  )}
                  
                  {/* Miss circle */}
                  {styles.missSize > 0 && (
                    <div
                      className="absolute rounded-full bg-destructive/60"
                      style={{
                        width: styles.missSize,
                        height: styles.missSize,
                        marginLeft: styles.hitSize / 2,
                        marginTop: styles.hitSize / 2,
                      }}
                    />
                  )}
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
                    <div className="font-bold">{key.toUpperCase()}</div>
                    <div>Hits: {data.hits}</div>
                    <div>Misses: {data.misses}</div>
                    <div>Total: {total}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
