import { motion } from 'framer-motion';
import { Award, Target, Info } from 'lucide-react';

interface AccuracyStreak {
  threshold: number;
  count: number;
  avgWpm: number;
  avgAccuracy: number;
  startDate: string;
  endDate: string;
}

interface AccuracyStreaksProps {
  streaks: AccuracyStreak[];
}

export function AccuracyStreaks({ streaks }: AccuracyStreaksProps) {
  const thresholds = [100, 98, 95, 90];
  
  if (streaks.length === 0) {
    return (
      <motion.div
        className="stat-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Accuracy Streaks
        </h3>
        
        <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
          <Info className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">
              You don't have any accuracy streaks. Consider completing a lesson with the highest accuracy possible, regardless of typing speed.
            </p>
            <p className="text-xs">
              Above are listed the longest continuous sequences of lessons with accuracy above a given threshold, along with statistics about every such sequence. The longer the sequence of lessons, the better.
            </p>
          </div>
        </div>
        
        {/* Threshold legend */}
        <div className="mt-4 flex flex-wrap gap-2">
          {thresholds.map((threshold) => (
            <div
              key={threshold}
              className="flex items-center gap-1.5 text-xs px-2 py-1 bg-muted rounded"
            >
              <Target className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">{threshold}%+</span>
              <span className="text-muted-foreground">—</span>
              <span className="text-muted-foreground">0 lessons</span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Award className="w-5 h-5 text-primary" />
        Accuracy Streaks
      </h3>
      
      <div className="space-y-3">
        {streaks.map((streak, index) => (
          <motion.div
            key={index}
            className="p-3 bg-muted/50 rounded-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                  ${streak.threshold >= 98 ? 'bg-success/20 text-success' :
                    streak.threshold >= 95 ? 'bg-primary/20 text-primary' :
                    'bg-warning/20 text-warning'}
                `}>
                  {streak.threshold}%
                </div>
                <div>
                  <span className="font-semibold">{streak.count} lessons</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {streak.startDate} - {streak.endDate}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Avg Speed: </span>
                <span className="font-mono font-semibold">{streak.avgWpm.toFixed(1)} wpm</span>
              </div>
              <div>
                <span className="text-muted-foreground">Avg Accuracy: </span>
                <span className="font-mono font-semibold">{streak.avgAccuracy.toFixed(2)}%</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
