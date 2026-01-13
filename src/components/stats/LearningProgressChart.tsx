import { motion } from 'framer-motion';
import { TrendingUp, Info } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  ComposedChart,
  Area,
  Bar,
} from 'recharts';
import { Slider } from '@/components/ui/slider';
import { useState } from 'react';

interface LessonData {
  lesson: number;
  wpm: number;
  accuracy: number;
  keysCount: number;
}

interface KeyProgressData {
  lesson: number;
  [key: string]: number; // Dynamic keys for each letter
}

interface LearningProgressChartProps {
  lessonData: LessonData[];
  keyProgressData: KeyProgressData[];
  unlockedKeys: string[];
}

export function LearningProgressChart({
  lessonData,
  keyProgressData,
  unlockedKeys,
}: LearningProgressChartProps) {
  const [smoothness, setSmoothness] = useState([50]);

  // Generate colors for each key
  const getKeyColor = (key: string, speed: number) => {
    // Slow = red, Fast = green
    const normalizedSpeed = Math.min(speed / 100, 1);
    const hue = normalizedSpeed * 120; // 0 = red, 120 = green
    return `hsl(${hue}, 70%, 50%)`;
  };

  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        Learning Progress Overview
      </h3>
      
      <p className="text-sm text-muted-foreground mb-4">
        This chart shows the learning progress overview for all keys.
      </p>

      <div className="flex items-center gap-4 mb-2 text-xs">
        <span className="text-muted-foreground">
          Horizontal axis: lesson number. Vertical axis: typing speed for each individual key,
        </span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-destructive rounded" />
          <span>– slow,</span>
          <div className="w-3 h-3 bg-success rounded" />
          <span>– fast.</span>
        </div>
      </div>

      {lessonData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-muted-foreground">
          <Info className="w-5 h-5 mr-2" />
          Complete some lessons to see progress data
        </div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={keyProgressData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              />
              {unlockedKeys.slice(0, 10).map((key, index) => (
                <Line
                  key={key}
                  type={smoothness[0] > 50 ? 'monotone' : 'linear'}
                  dataKey={key}
                  stroke={`hsl(${(index * 30) % 360}, 70%, 50%)`}
                  strokeWidth={1.5}
                  dot={false}
                  name={key.toUpperCase()}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}

interface TypingSpeedChartProps {
  lessonData: LessonData[];
}

export function TypingSpeedChart({ lessonData }: TypingSpeedChartProps) {
  const [smoothness, setSmoothness] = useState([50]);

  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        Typing Speed
      </h3>
      
      <p className="text-sm text-muted-foreground mb-2">
        This chart shows how overall typing speed changes over time.
      </p>

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

      <div className="flex items-center gap-4 mb-2 text-xs text-muted-foreground">
        <span>Horizontal axis: lesson number. Vertical axis:</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary rounded" />
          <span>– typing speed,</span>
          <div className="w-3 h-3 bg-success rounded" />
          <span>– typing accuracy,</span>
          <div className="w-3 h-3 bg-warning rounded" />
          <span>– number of keys.</span>
        </div>
      </div>

      {lessonData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-muted-foreground">
          <Info className="w-5 h-5 mr-2" />
          Complete some lessons to see speed data
        </div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={lessonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="lesson"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                domain={[0, 'auto']}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                  fontSize: '11px',
                }}
              />
              <Area
                yAxisId="right"
                type={smoothness[0] > 50 ? 'monotone' : 'linear'}
                dataKey="accuracy"
                fill="hsl(var(--success) / 0.2)"
                stroke="hsl(var(--success))"
                strokeWidth={1}
                name="Accuracy %"
              />
              <Line
                yAxisId="left"
                type={smoothness[0] > 50 ? 'monotone' : 'linear'}
                dataKey="wpm"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                name="WPM"
              />
              <Bar
                yAxisId="left"
                dataKey="keysCount"
                fill="hsl(var(--warning) / 0.5)"
                name="Keys"
                barSize={4}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
