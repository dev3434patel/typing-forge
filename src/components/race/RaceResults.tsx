import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trophy, Bot, RotateCcw, Home, Award, Target, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlayerStats } from '@/hooks/useRaceEngine';

interface RaceResultsProps {
  myStats: PlayerStats;
  opponentStats: PlayerStats;
  isWinner: boolean;
  isTie: boolean;
  isBot: boolean;
  botDifficulty?: string;
  onPlayAgain?: () => void;
}

export const RaceResults = ({
  myStats,
  opponentStats,
  isWinner,
  isTie,
  isBot,
  botDifficulty,
  onPlayAgain,
}: RaceResultsProps) => {
  const navigate = useNavigate();

  const handlePlayAgain = () => {
    if (onPlayAgain) {
      onPlayAgain();
    } else {
      navigate('/race');
    }
  };

  const headlineText = isTie
    ? '🤝 It\'s a Tie!'
    : isWinner
      ? '🎉 Victory!'
      : 'Race Complete';

  const subtitleText = isTie
    ? 'You matched your opponent perfectly!'
    : isWinner
      ? 'Congratulations! You outpaced your opponent!'
      : 'Great effort! Keep practicing to improve.';

  return (
    <motion.div
      key="finished"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-lg mx-auto text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
      >
        <Trophy
          className={cn(
            'w-20 h-20 mx-auto mb-6',
            isTie ? 'text-warning' : isWinner ? 'text-primary' : 'text-muted-foreground'
          )}
        />
      </motion.div>

      <motion.h2
        className="text-3xl font-bold mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {headlineText}
      </motion.h2>

      <motion.p
        className="text-muted-foreground mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {subtitleText}
      </motion.p>

      <motion.div
        className="space-y-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {/* Your stats */}
        <StatRow
          label="Your Results"
          isHighlighted
          stats={myStats}
          accentClass="text-primary"
          borderClass="border-primary/30"
        />

        {/* Opponent stats */}
        <StatRow
          label={
            isBot
              ? `${botDifficulty ? botDifficulty.charAt(0).toUpperCase() + botDifficulty.slice(1) : ''} Bot`
              : 'Opponent'
          }
          icon={isBot ? <Bot className="w-4 h-4" /> : undefined}
          stats={opponentStats}
          accentClass="text-destructive"
          borderClass="border-destructive/30"
        />
      </motion.div>

      <motion.div
        className="flex gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Button
          variant="outline"
          onClick={handlePlayAgain}
          className="flex-1 gap-2"
          size="lg"
        >
          <RotateCcw className="w-4 h-4" />
          Play Again
        </Button>
        <Button
          onClick={() => navigate('/')}
          className="flex-1 gap-2"
          size="lg"
        >
          <Home className="w-4 h-4" />
          Home
        </Button>
      </motion.div>
    </motion.div>
  );
};

function StatRow({
  label,
  icon,
  stats,
  accentClass,
  borderClass,
  isHighlighted,
}: {
  label: string;
  icon?: React.ReactNode;
  stats: PlayerStats;
  accentClass: string;
  borderClass: string;
  isHighlighted?: boolean;
}) {
  return (
    <div className={cn('stat-card p-5', borderClass)}>
      <p className={cn(
        'text-sm font-medium mb-3 flex items-center justify-center gap-2',
        isHighlighted ? accentClass : 'text-muted-foreground'
      )}>
        {icon}
        {label}
      </p>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className={cn('text-3xl font-bold font-mono', accentClass)}>
            {Math.round(stats.netWpm)}
          </p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">WPM</p>
        </div>
        <div>
          <p className={cn(
            'text-3xl font-bold font-mono',
            stats.accuracy >= 95 ? 'text-primary' : stats.accuracy >= 90 ? 'text-warning' : 'text-destructive'
          )}>
            {stats.accuracy.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Accuracy</p>
        </div>
        <div>
          <p className="text-3xl font-bold font-mono text-foreground">
            {stats.progress}%
          </p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Complete</p>
        </div>
      </div>
    </div>
  );
}
