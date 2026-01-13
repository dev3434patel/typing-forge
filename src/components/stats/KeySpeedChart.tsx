import { motion } from 'framer-motion';
import { Keyboard, TrendingUp, Info } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { Slider } from '@/components/ui/slider';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface KeyData {
  key: string;
  lastSpeed: number;
  topSpeed: number;
  avgSpeed: number;
  learningRate: 'improving' | 'stable' | 'uncertain' | 'declining';
  history: { lesson: number; wpm: number }[];
}

interface KeySpeedChartProps {
  keyData: KeyData[];
  targetWpm: number;
  selectedKey: string | null;
  onSelectKey: (key: string | null) => void;
}

export function KeySpeedChart({
  keyData,
  targetWpm,
  selectedKey,
  onSelectKey,
}: KeySpeedChartProps) {
  const [smoothness, setSmoothness] = useState([50]);
  
  const selectedKeyData = keyData.find(k => k.key === selectedKey);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const getLearningRateColor = (rate: string) => {
    switch (rate) {
      case 'improving': return 'text-success';
      case 'stable': return 'text-primary';
      case 'uncertain': return 'text-warning';
      case 'declining': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
        <Keyboard className="w-5 h-5 text-primary" />
        Key Typing Speed
      </h3>
      
      <p className="text-sm text-muted-foreground mb-4">
        This chart shows the typing speed change for each individual key.
      </p>

      {/* Key selector */}
      <div className="flex flex-wrap gap-1 mb-4">
        {alphabet.map((letter) => {
          const data = keyData.find(k => k.key === letter.toLowerCase());
          const hasData = data && data.history.length > 0;
          
          return (
            <button
              key={letter}
              onClick={() => onSelectKey(hasData ? letter.toLowerCase() : null)}
              className={cn(
                'w-7 h-7 text-xs font-mono font-bold rounded transition-all',
                selectedKey === letter.toLowerCase()
                  ? 'bg-primary text-primary-foreground'
                  : hasData
                    ? 'bg-muted hover:bg-muted/80'
                    : 'bg-muted/30 text-muted-foreground cursor-not-allowed'
              )}
              disabled={!hasData}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {selectedKeyData ? (
        <>
          {/* Selected key stats */}
          <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
            <div>
              <span className="text-xs text-muted-foreground">Last speed:</span>
              <p className="font-mono font-bold">
                {selectedKeyData.lastSpeed.toFixed(1)}
                <span className="text-xs text-muted-foreground ml-1">wpm</span>
                <span className="text-xs text-muted-foreground ml-1">
                  ({Math.round((selectedKeyData.lastSpeed / targetWpm) * 100)}%)
                </span>
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Top speed:</span>
              <p className="font-mono font-bold">
                {selectedKeyData.topSpeed.toFixed(1)}
                <span className="text-xs text-muted-foreground ml-1">wpm</span>
                <span className="text-xs text-muted-foreground ml-1">
                  ({Math.round((selectedKeyData.topSpeed / targetWpm) * 100)}%)
                </span>
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Learning rate:</span>
              <p className={cn('font-semibold capitalize', getLearningRateColor(selectedKeyData.learningRate))}>
                {selectedKeyData.learningRate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-muted-foreground">Smoothness:</span>
            <div className="w-32">
              <Slider
                value={smoothness}
                onValueChange={setSmoothness}
                min={0}
                max={100}
                step={10}
              />
            </div>
          </div>

          <div className="text-xs text-muted-foreground mb-2">
            Horizontal axis: lesson number. Vertical axis:{' '}
            <span className="inline-flex items-center gap-1">
              <div className="w-2 h-2 bg-primary rounded" /> – typing speed for the currently selected key,
            </span>{' '}
            <span className="inline-flex items-center gap-1">
              <div className="w-2 h-2 bg-warning rounded" /> – target typing speed.
            </span>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedKeyData.history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="lesson"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                    fontSize: '11px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)} wpm`, 'Speed']}
                />
                <ReferenceLine
                  y={targetWpm}
                  stroke="hsl(var(--warning))"
                  strokeDasharray="4 4"
                  label={{ value: `Target: ${targetWpm}`, fill: 'hsl(var(--warning))', fontSize: 10 }}
                />
                <Line
                  type={smoothness[0] > 50 ? 'monotone' : 'linear'}
                  dataKey="wpm"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                  name="WPM"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="h-48 flex items-center justify-center text-muted-foreground">
          <Info className="w-5 h-5 mr-2" />
          Select a key above to see its speed history
        </div>
      )}
    </motion.div>
  );
}

interface KeySpeedHistogramProps {
  keyData: KeyData[];
}

export function KeySpeedHistogram({ keyData }: KeySpeedHistogramProps) {
  const sortedData = [...keyData]
    .filter(k => k.avgSpeed > 0)
    .sort((a, b) => b.avgSpeed - a.avgSpeed);

  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        Key Typing Speed Histogram
      </h3>
      
      <p className="text-sm text-muted-foreground mb-4">
        This chart shows the average typing speed for each individual key.
      </p>

      {sortedData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-muted-foreground">
          <Info className="w-5 h-5 mr-2" />
          No key data available yet
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
                formatter={(value: number) => [`${value.toFixed(1)} wpm`, 'Average Speed']}
                labelFormatter={(label) => label.toUpperCase()}
              />
              <Bar dataKey="avgSpeed" radius={[4, 4, 0, 0]}>
                {sortedData.map((entry, index) => {
                  const hue = (entry.avgSpeed / 100) * 120;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={`hsl(${hue}, 70%, 50%)`}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
