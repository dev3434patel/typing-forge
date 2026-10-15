import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Loader2 } from 'lucide-react';
import { useRaceEngine } from '@/hooks/useRaceEngine';

import { RaceLobby } from '@/components/race/RaceLobby';
import { RaceWaiting } from '@/components/race/RaceWaiting';
import { RaceCountdown } from '@/components/race/RaceCountdown';
import { RaceTypingArea } from '@/components/race/RaceTypingArea';
import { RaceResults } from '@/components/race/RaceResults';
import { RaceSettings } from '@/components/race/RaceSettings';

const Race = () => {
  const { loading: authLoading } = useAuth();
  const race = useRaceEngine();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Title */}
        {race.phase === 'lobby' && (
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Race Mode</h1>
            <p className="text-muted-foreground">
              Challenge opponents in real-time typing races
            </p>
          </motion.div>
        )}

        {/* Settings - show in lobby */}
        {race.phase === 'lobby' && (
          <RaceSettings
            duration={race.raceDuration}
            onDurationChange={race.setRaceDuration}
            isBot={false}
            disabled={false}
          />
        )}

        {/* Racing settings indicator */}
        {(race.phase === 'racing' || race.phase === 'countdown') && (
          <RaceSettings
            duration={race.raceDuration}
            onDurationChange={() => {}}
            isBot={race.isBotRace}
            botDifficulty={race.botDifficulty || undefined}
            disabled={true}
          />
        )}

        <AnimatePresence mode="wait">
          {race.phase === 'lobby' && (
            <RaceLobby
              user={true}
              onCreateRace={race.createRace}
              onJoinRace={race.joinRace}
              onCreateBotRace={race.createBotRace}
            />
          )}

          {race.phase === 'waiting' && (
            <RaceWaiting
              roomCode={race.roomCode}
              onCopyCode={race.copyRoomCode}
            />
          )}

          {race.phase === 'countdown' && (
            <RaceCountdown countdown={race.countdown} />
          )}

          {race.phase === 'racing' && (
            <RaceTypingArea
              expectedText={race.expectedText}
              typedText={race.typedText}
              currentWpm={race.myLiveStats.wpm}
              currentAccuracy={race.myLiveStats.accuracy}
              opponentWpm={race.opponentLiveStats.wpm}
              opponentProgress={race.opponentLiveStats.progress}
              isBot={race.isBotRace}
              botDifficulty={race.botDifficulty || undefined}
              timeRemaining={race.timeRemaining}
              isRacing={true}
              onTyping={race.handleTyping}
              onRestart={race.handleRestart}
            />
          )}

          {race.phase === 'finished' && race.result && (
            <RaceResults
              myStats={race.result.myStats}
              opponentStats={race.result.opponentStats}
              isWinner={race.result.isWinner}
              isTie={race.result.isTie}
              isBot={race.result.isBot}
              botDifficulty={race.result.botDifficulty}
              onPlayAgain={race.handleRestart}
            />
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
};

export default Race;
