import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, User, Bot, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface RaceHistoryItem {
  id: string;
  room_code: string;
  host_id: string;
  opponent_id: string | null;
  is_bot_race: boolean;
  bot_difficulty: string | null;
  host_wpm: number | null;
  host_accuracy: number | null;
  host_progress: number | null;
  opponent_wpm: number | null;
  opponent_accuracy: number | null;
  opponent_progress: number | null;
  winner_id: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

interface RaceHistoryProps {
  raceHistory: RaceHistoryItem[];
  currentUserId: string;
}

type SortField = 'date' | 'wpm';
type SortOrder = 'asc' | 'desc';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function RaceHistory({ raceHistory, currentUserId }: RaceHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (startedAt: string | null, endedAt: string | null) => {
    if (!startedAt || !endedAt) return 'N/A';
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);
    return `${seconds}s`;
  };

  const getOpponentName = (race: RaceHistoryItem) => {
    if (race.is_bot_race) {
      return `Bot (${race.bot_difficulty || 'unknown'})`;
    }
    if (race.opponent_id) {
      return 'Opponent';
    }
    return 'Solo';
  };

  const getMyStats = (race: RaceHistoryItem) => {
    const isHost = race.host_id === currentUserId;
    return {
      wpm: isHost ? race.host_wpm : race.opponent_wpm,
      accuracy: isHost ? race.host_accuracy : race.opponent_accuracy,
      progress: isHost ? race.host_progress : race.opponent_progress,
    };
  };

  const getOpponentStats = (race: RaceHistoryItem) => {
    const isHost = race.host_id === currentUserId;
    return {
      wpm: isHost ? race.opponent_wpm : race.host_wpm,
      accuracy: isHost ? race.opponent_accuracy : race.host_accuracy,
      progress: isHost ? race.opponent_progress : race.host_progress,
    };
  };

  const isWinner = (race: RaceHistoryItem) => {
    return race.winner_id === currentUserId;
  };

  // Filter and sort
  const filteredRaces = useMemo(() => {
    let filtered = [...raceHistory];

    // Apply sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'wpm':
          const aWpm = getMyStats(a).wpm || 0;
          const bWpm = getMyStats(b).wpm || 0;
          comparison = aWpm - bWpm;
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [raceHistory, sortField, sortOrder, currentUserId]);

  // Pagination
  const totalPages = Math.ceil(filteredRaces.length / pageSize);
  const paginatedRaces = filteredRaces.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (raceHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Race History</CardTitle>
          <CardDescription>Your completed races will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No race history yet</p>
            <p className="text-sm mt-2">Complete some races to see your history here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Race History</CardTitle>
            <CardDescription>
              {raceHistory.length} {raceHistory.length === 1 ? 'race' : 'races'} completed
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-sm border rounded-md bg-background"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  <button
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    Date
                    {sortField === 'date' && (
                      <TrendingUp className={cn('w-3 h-3', sortOrder === 'desc' && 'rotate-180')} />
                    )}
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Opponent
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  <button
                    onClick={() => handleSort('wpm')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
                  >
                    My WPM
                    {sortField === 'wpm' && (
                      <TrendingUp className={cn('w-3 h-3', sortOrder === 'desc' && 'rotate-180')} />
                    )}
                  </button>
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  My Accuracy
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">
                  Opponent WPM
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">
                  Duration
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                  Result
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRaces.map((race) => {
                const myStats = getMyStats(race);
                const opponentStats = getOpponentStats(race);
                const won = isWinner(race);

                return (
                  <motion.tr
                    key={race.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                      {formatDate(race.created_at)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {race.is_bot_race ? (
                          <Bot className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <User className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="text-sm capitalize">
                          {getOpponentName(race)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-primary">
                      {myStats.wpm?.toFixed(0) || 'N/A'}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className={cn(
                        'font-mono text-sm',
                        (myStats.accuracy || 0) >= 98 ? 'text-green-500' :
                        (myStats.accuracy || 0) >= 95 ? 'text-yellow-500' :
                        'text-red-500'
                      )}>
                        {myStats.accuracy?.toFixed(1) || 'N/A'}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right hidden md:table-cell text-muted-foreground text-sm font-mono">
                      {opponentStats.wpm?.toFixed(0) || 'N/A'}
                    </td>
                    <td className="py-4 px-4 text-right hidden md:table-cell text-muted-foreground text-sm">
                      {formatDuration(race.started_at, race.ended_at)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Badge
                        variant={won ? 'default' : 'secondary'}
                        className={cn(
                          won && 'bg-green-500/20 text-green-500 border-green-500/50'
                        )}
                      >
                        {won ? (
                          <span className="flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            Won
                          </span>
                        ) : (
                          'Lost'
                        )}
                      </Badge>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredRaces.length)} of {filteredRaces.length} races
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
