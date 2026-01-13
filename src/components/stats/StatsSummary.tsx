import { motion } from 'framer-motion';
import { Clock, BookOpen, Zap, Target, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsSummaryProps {
  title: string;
  totalTime: number; // in seconds
  lessonsCount: number;
  topSpeed: number;
  avgSpeed: number;
  topAccuracy: number;
  avgAccuracy: number;
  previousAvgSpeed?: number;
  previousAvgAccuracy?: number;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `00:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function StatsSummary({
  title,
  totalTime,
  lessonsCount,
  topSpeed,
  avgSpeed,
  topAccuracy,
  avgAccuracy,
  previousAvgSpeed,
  previousAvgAccuracy,
}: StatsSummaryProps) {
  const speedTrend = previousAvgSpeed ? avgSpeed - previousAvgSpeed : 0;
  const accuracyTrend = previousAvgAccuracy ? avgAccuracy - previousAvgAccuracy : 0;

  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        {title === 'Statistics for Today' ? (
          <Clock className="w-5 h-5 text-primary" />
        ) : (
          <BookOpen className="w-5 h-5 text-primary" />
        )}
        {title}
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="flex flex-col">
          <span className="stat-label flex items-center gap-1">
            <Clock className="w-3 h-3" /> Time
          </span>
          <span className="text-2xl font-mono font-bold text-foreground">
            {formatTime(totalTime)}
          </span>
        </div>
        
        <div className="flex flex-col">
          <span className="stat-label flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> Lessons
          </span>
          <span className="text-2xl font-mono font-bold text-foreground">
            {lessonsCount}
          </span>
        </div>
        
        <div className="flex flex-col">
          <span className="stat-label flex items-center gap-1">
            <Zap className="w-3 h-3" /> Top Speed
          </span>
          <span className="text-2xl font-mono font-bold text-primary">
            {topSpeed.toFixed(1)}<span className="text-sm ml-1">wpm</span>
          </span>
        </div>
        
        <div className="flex flex-col">
          <span className="stat-label flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Avg Speed
            {speedTrend !== 0 && (
              <span className={speedTrend > 0 ? 'text-success' : 'text-destructive'}>
                {speedTrend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              </span>
            )}
          </span>
          <span className="text-2xl font-mono font-bold text-foreground">
            {avgSpeed.toFixed(1)}<span className="text-sm ml-1">wpm</span>
          </span>
        </div>
        
        <div className="flex flex-col">
          <span className="stat-label flex items-center gap-1">
            <Target className="w-3 h-3" /> Top Accuracy
          </span>
          <span className="text-2xl font-mono font-bold text-success">
            {topAccuracy.toFixed(2)}<span className="text-sm ml-1">%</span>
          </span>
        </div>
        
        <div className="flex flex-col">
          <span className="stat-label flex items-center gap-1">
            <Target className="w-3 h-3" /> Avg Accuracy
            {accuracyTrend !== 0 && (
              <span className={accuracyTrend > 0 ? 'text-success' : 'text-destructive'}>
                {accuracyTrend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              </span>
            )}
          </span>
          <span className="text-2xl font-mono font-bold text-foreground">
            {avgAccuracy.toFixed(2)}<span className="text-sm ml-1">%</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}
