/**
 * RACE ENGINE HOOK
 * Centralizes all race logic: lifecycle, bot simulation, metrics, winner determination.
 * Server-authoritative: final metrics come from canonical metrics-engine.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { sanitizeMetric, calculateWpm, calculateRawWpm, calculateAccuracy, calculateConsistency } from '@/lib/metrics-engine';
import { BotDifficulty, createBot, BotRunner } from '@/lib/bot-engine';
import { generateRandomWords } from '@/lib/quotes';

// ─── Types ───────────────────────────────────────────────────────────────────

export type RacePhase = 'lobby' | 'waiting' | 'countdown' | 'racing' | 'finished';

export interface RaceKeystroke {
  char: string;
  expectedChar: string;
  timestamp: number;
  isCorrect: boolean;
  isBackspace: boolean;
}

export interface PlayerStats {
  wpm: number;
  accuracy: number;
  consistency: number;
  progress: number;
  netWpm: number;
  isFinished: boolean;
}

export interface RaceResult {
  myStats: PlayerStats;
  opponentStats: PlayerStats;
  isWinner: boolean;
  isTie: boolean;
  isBot: boolean;
  botDifficulty?: BotDifficulty;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useRaceEngine() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Phase
  const [phase, setPhase] = useState<RacePhase>('lobby');
  const [countdown, setCountdown] = useState(3);

  // Race data
  const [roomCode, setRoomCode] = useState('');
  const [raceDbId, setRaceDbId] = useState<string | null>(null);
  const [expectedText, setExpectedText] = useState('');
  const [raceDuration, setRaceDuration] = useState(30);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isHost, setIsHost] = useState(false);

  // Bot
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty | null>(null);
  const isBotRace = botDifficulty !== null;

  // Player state
  const [typedText, setTypedText] = useState('');
  const [myLiveStats, setMyLiveStats] = useState<PlayerStats>({
    wpm: 0, accuracy: 100, consistency: 0, progress: 0, netWpm: 0, isFinished: false,
  });
  const [opponentLiveStats, setOpponentLiveStats] = useState<PlayerStats>({
    wpm: 0, accuracy: 100, consistency: 0, progress: 0, netWpm: 0, isFinished: false,
  });

  // Results (server-authoritative for final)
  const [result, setResult] = useState<RaceResult | null>(null);

  // Refs
  const keystrokeLogRef = useRef<RaceKeystroke[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const botRef = useRef<BotRunner | null>(null);
  const botIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownStartedRef = useRef(false);
  const updateThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const wpmWindowsRef = useRef<number[]>([]);
  const wpmWindowTimerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseRef = useRef<RacePhase>('lobby');

  // Keep phaseRef in sync
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ─── Text Generation ─────────────────────────────────────────────────────

  const generateRaceText = useCallback((duration: number) => {
    const wordsNeeded = Math.ceil((duration / 60) * 100);
    return generateRandomWords(wordsNeeded, false, false);
  }, []);

  const generateRoomCode = useCallback(() => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomValues = new Uint8Array(6);
    crypto.getRandomValues(randomValues);
    return Array.from(randomValues, v => chars[v % chars.length]).join('');
  }, []);

  // ─── Cleanup ──────────────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (botIntervalRef.current) { clearInterval(botIntervalRef.current); botIntervalRef.current = null; }
    if (updateThrottleRef.current) { clearTimeout(updateThrottleRef.current); updateThrottleRef.current = null; }
    if (wpmWindowTimerRef.current) { clearInterval(wpmWindowTimerRef.current); wpmWindowTimerRef.current = null; }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  // ─── Compute Final Metrics (Server-Authoritative) ────────────────────────

  const computeFinalMetrics = useCallback((
    keystrokes: RaceKeystroke[],
    typed: string,
    target: string,
  ): PlayerStats => {
    if (keystrokes.length === 0 || typed.length === 0) {
      return { wpm: 0, accuracy: 0, consistency: 0, progress: 0, netWpm: 0, isFinished: false };
    }

    const nonBackspace = keystrokes.filter(k => !k.isBackspace);
    const backspaceCount = keystrokes.filter(k => k.isBackspace).length;

    if (nonBackspace.length === 0) {
      return { wpm: 0, accuracy: 0, consistency: 0, progress: 0, netWpm: 0, isFinished: false };
    }

    const firstTs = nonBackspace[0].timestamp;
    const lastTs = nonBackspace[nonBackspace.length - 1].timestamp;
    const elapsedMs = lastTs - firstTs;

    // Compare typed vs target char-by-char
    const compLen = Math.min(typed.length, target.length);
    let correctChars = 0;
    for (let i = 0; i < compLen; i++) {
      if (typed[i] === target[i]) correctChars++;
    }
    const totalTypedChars = typed.length;
    const incorrectChars = totalTypedChars - correctChars;

    const rawWpm = sanitizeMetric(calculateRawWpm(totalTypedChars, elapsedMs));
    const netWpm = sanitizeMetric(calculateWpm(correctChars, elapsedMs));

    let accuracy = totalTypedChars > 0 ? (correctChars / totalTypedChars) * 100 : 0;
    if (backspaceCount > 0 && accuracy >= 100) accuracy = 99.99;
    accuracy = sanitizeMetric(Math.round(accuracy * 100) / 100);

    const consistency = sanitizeMetric(calculateConsistency(wpmWindowsRef.current));
    const progress = Math.min(100, Math.round((typed.length / target.length) * 100));

    return { wpm: rawWpm, accuracy, consistency, progress, netWpm, isFinished: progress >= 100 };
  }, []);

  // ─── Determine Winner (Server-Authoritative) ─────────────────────────────

  const determineWinner = useCallback((my: PlayerStats, opp: PlayerStats): { isWinner: boolean; isTie: boolean } => {
    // 1. Highest netWpm among players who completed >= 95%
    const myCompleted = my.progress >= 95;
    const oppCompleted = opp.progress >= 95;

    if (myCompleted && !oppCompleted) return { isWinner: true, isTie: false };
    if (!myCompleted && oppCompleted) return { isWinner: false, isTie: false };

    // Both completed or neither completed - compare netWpm
    const wpmDiff = Math.abs(my.netWpm - opp.netWpm);
    if (wpmDiff > 0.1) {
      return { isWinner: my.netWpm > opp.netWpm, isTie: false };
    }

    // WPM tie - compare accuracy
    const accDiff = Math.abs(my.accuracy - opp.accuracy);
    if (accDiff > 0.01) {
      return { isWinner: my.accuracy > opp.accuracy, isTie: false };
    }

    // Complete tie
    return { isWinner: false, isTie: true };
  }, []);

  // ─── Finish Race ──────────────────────────────────────────────────────────

  const finishRace = useCallback(() => {
    if (phaseRef.current === 'finished') return;

    cleanup();

    // Compute my final metrics from keystroke log
    const myFinal = computeFinalMetrics(
      keystrokeLogRef.current,
      typedText,
      expectedText,
    );

    // For bot: compute bot's final metrics
    let oppFinal: PlayerStats;
    if (isBotRace && botRef.current) {
      const botState = botRef.current.state;
      const botCorrect = botState.correctChars;
      const botTotal = botState.typedText.length;
      const botElapsed = botState.keystrokes.length > 0
        ? botState.keystrokes[botState.keystrokes.length - 1].timestamp - botState.keystrokes[0].timestamp
        : 0;

      const botRawWpm = sanitizeMetric(calculateRawWpm(botTotal, botElapsed));
      const botNetWpm = sanitizeMetric(calculateWpm(botCorrect, botElapsed));
      const botAcc = botTotal > 0 ? sanitizeMetric(Math.round((botCorrect / botTotal) * 100 * 100) / 100) : 100;
      const botProgress = Math.min(100, Math.round((botState.cursorIndex / expectedText.length) * 100));

      oppFinal = {
        wpm: botRawWpm,
        netWpm: botNetWpm,
        accuracy: botAcc,
        consistency: 0, // Bot doesn't track consistency
        progress: botProgress,
        isFinished: botState.isFinished,
      };
    } else {
      oppFinal = { ...opponentLiveStats };
    }

    const { isWinner, isTie } = determineWinner(myFinal, oppFinal);

    setResult({
      myStats: myFinal,
      opponentStats: oppFinal,
      isWinner,
      isTie,
      isBot: isBotRace,
      botDifficulty: botDifficulty || undefined,
    });

    setPhase('finished');

    // Persist bot race to DB
    if (isBotRace && user) {
      const winnerId = isTie ? null : (isWinner ? user.id : `BOT_${botDifficulty}`);
      supabase.from('race_sessions').insert({
        room_code: generateRoomCode(),
        host_id: user.id,
        expected_text: expectedText,
        status: 'completed',
        is_bot_race: true,
        bot_difficulty: botDifficulty,
        host_wpm: myFinal.netWpm,
        host_accuracy: myFinal.accuracy,
        host_progress: myFinal.progress,
        opponent_wpm: oppFinal.netWpm,
        opponent_accuracy: oppFinal.accuracy,
        opponent_progress: oppFinal.progress,
        winner_id: winnerId,
        started_at: startTimeRef.current ? new Date(startTimeRef.current).toISOString() : null,
        ended_at: new Date().toISOString(),
      }).then(({ error }) => {
        if (error) console.error('Failed to save race:', error);
      });
    }
  }, [typedText, expectedText, isBotRace, botDifficulty, user, opponentLiveStats, cleanup, computeFinalMetrics, determineWinner, generateRoomCode]);

  // ─── WPM Window Sampling ─────────────────────────────────────────────────

  const startWpmSampling = useCallback(() => {
    wpmWindowsRef.current = [];
    wpmWindowTimerRef.current = setInterval(() => {
      if (!startTimeRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;
      const nonBs = keystrokeLogRef.current.filter(k => !k.isBackspace);
      // Count correct chars in the last 5s window
      const windowStart = Date.now() - 5000;
      const windowChars = nonBs.filter(k => k.timestamp >= windowStart && k.isCorrect).length;
      const windowWpm = calculateWpm(windowChars, 5000);
      wpmWindowsRef.current.push(windowWpm);
    }, 1000);
  }, []);

  // ─── Countdown ────────────────────────────────────────────────────────────

  const runCountdown = useCallback(() => {
    if (countdownStartedRef.current) return;
    countdownStartedRef.current = true;

    setCountdown(3);
    setPhase('countdown');

    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        setPhase('racing');
        startTimeRef.current = Date.now();
        setTimeRemaining(raceDuration);
        startWpmSampling();

        // Start bot if bot race
        if (isBotRace && botRef.current) {
          botRef.current.start();
          botIntervalRef.current = setInterval(() => {
            if (!botRef.current || botRef.current.state.isFinished) {
              if (botIntervalRef.current) clearInterval(botIntervalRef.current);
              return;
            }
            const state = botRef.current.tick();
            const progress = Math.round((state.cursorIndex / expectedText.length) * 100);
            setOpponentLiveStats({
              wpm: sanitizeMetric(state.currentWpm),
              accuracy: sanitizeMetric(state.accuracy),
              consistency: 0,
              progress: Math.min(100, progress),
              netWpm: sanitizeMetric(state.currentWpm),
              isFinished: state.isFinished,
            });
          }, 50);
        }

        // Start race timer
        let remaining = raceDuration;
        timerRef.current = setInterval(() => {
          remaining--;
          setTimeRemaining(remaining);
          if (remaining <= 0) {
            finishRace();
          }
        }, 1000);

        setCountdown(0);
      } else {
        setCountdown(count);
      }
    }, 1000);
  }, [raceDuration, isBotRace, expectedText, finishRace, startWpmSampling]);

  // ─── Create Race (Human vs Human) ────────────────────────────────────────

  const createRace = useCallback(async () => {
    if (!user) {
      toast({ title: 'Please sign in to create a race', variant: 'destructive' });
      navigate('/auth');
      return;
    }

    const code = generateRoomCode();
    const text = generateRaceText(raceDuration);

    const { data, error } = await supabase
      .from('race_sessions')
      .insert({
        room_code: code,
        host_id: user.id,
        expected_text: text,
        status: 'waiting',
        is_bot_race: false,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Failed to create race', description: error.message, variant: 'destructive' });
      return;
    }

    setRoomCode(code);
    setRaceDbId(data.id);
    setExpectedText(text);
    setIsHost(true);
    countdownStartedRef.current = false;
    setPhase('waiting');
    navigate(`/race/${code}`);
  }, [user, raceDuration, toast, navigate, generateRoomCode, generateRaceText]);

  // ─── Create Bot Race ──────────────────────────────────────────────────────

  const createBotRace = useCallback((difficulty: BotDifficulty) => {
    if (!user) {
      toast({ title: 'Please sign in to race', variant: 'destructive' });
      navigate('/auth');
      return;
    }

    const text = generateRaceText(raceDuration);

    setBotDifficulty(difficulty);
    setExpectedText(text);
    setTypedText('');
    setIsHost(true);
    keystrokeLogRef.current = [];
    wpmWindowsRef.current = [];
    startTimeRef.current = null;
    countdownStartedRef.current = false;

    // Create bot
    botRef.current = createBot(difficulty, text);

    setOpponentLiveStats({ wpm: 0, accuracy: 100, consistency: 0, progress: 0, netWpm: 0, isFinished: false });
    setMyLiveStats({ wpm: 0, accuracy: 100, consistency: 0, progress: 0, netWpm: 0, isFinished: false });
    setResult(null);

    runCountdown();
  }, [user, raceDuration, toast, navigate, generateRaceText, runCountdown]);

  // ─── Join Race ────────────────────────────────────────────────────────────

  const joinRace = useCallback(async (joinCode: string) => {
    if (!user) {
      toast({ title: 'Please sign in to join a race', variant: 'destructive' });
      navigate('/auth');
      return;
    }

    const code = joinCode.toUpperCase().trim();
    if (!/^[0-9A-Z]{6}$/.test(code)) {
      toast({ title: 'Invalid room code', description: 'Room code must be 6 alphanumeric characters', variant: 'destructive' });
      return;
    }

    const { data: race, error: fetchError } = await supabase
      .from('race_sessions')
      .select('*')
      .eq('room_code', code)
      .eq('status', 'waiting')
      .maybeSingle();

    if (fetchError || !race) {
      toast({ title: 'Race not found', description: 'Invalid room code or race already started', variant: 'destructive' });
      return;
    }

    const { error: updateError } = await supabase
      .from('race_sessions')
      .update({
        opponent_id: user.id,
        status: 'countdown',
        countdown_started_at: new Date().toISOString(),
      })
      .eq('id', race.id);

    if (updateError) {
      toast({ title: 'Failed to join race', variant: 'destructive' });
      return;
    }

    setRoomCode(code);
    setRaceDbId(race.id);
    setExpectedText(race.expected_text);
    setIsHost(false);
    keystrokeLogRef.current = [];
    wpmWindowsRef.current = [];
    countdownStartedRef.current = false;
    setResult(null);
    runCountdown();
    navigate(`/race/${code}`);
  }, [user, toast, navigate, runCountdown]);

  // ─── Subscribe to Multiplayer Updates ─────────────────────────────────────

  useEffect(() => {
    if (!roomCode || !user || isBotRace) return;

    const channel = supabase
      .channel(`race:${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'race_sessions',
          filter: `room_code=eq.${roomCode}`,
        },
        (payload) => {
          const newData = payload.new as any;

          // Determine opponent stats
          const amHost = user.id === newData.host_id;
          const oppWpm = amHost ? newData.opponent_wpm : newData.host_wpm;
          const oppAcc = amHost ? newData.opponent_accuracy : newData.host_accuracy;
          const oppProgress = amHost ? newData.opponent_progress : newData.host_progress;

          setOpponentLiveStats(prev => ({
            ...prev,
            wpm: oppWpm || 0,
            accuracy: oppAcc || 100,
            progress: oppProgress || 0,
          }));

          // Handle status transitions
          if (newData.status === 'countdown' && phaseRef.current !== 'countdown' && phaseRef.current !== 'racing') {
            runCountdown();
          }

          if (newData.status === 'completed' && phaseRef.current !== 'finished') {
            const myWpm = amHost ? newData.host_wpm : newData.opponent_wpm;
            const myAcc = amHost ? newData.host_accuracy : newData.opponent_accuracy;
            const myProg = amHost ? newData.host_progress : newData.opponent_progress;

            const myFinal: PlayerStats = {
              wpm: myWpm || 0, accuracy: myAcc || 100, consistency: 0,
              progress: myProg || 0, netWpm: myWpm || 0, isFinished: (myProg || 0) >= 100,
            };
            const oppFinal: PlayerStats = {
              wpm: oppWpm || 0, accuracy: oppAcc || 100, consistency: 0,
              progress: oppProgress || 0, netWpm: oppWpm || 0, isFinished: (oppProgress || 0) >= 100,
            };

            const winner = determineWinner(myFinal, oppFinal);
            setResult({
              myStats: myFinal,
              opponentStats: oppFinal,
              ...winner,
              isBot: false,
            });
            setPhase('finished');
            cleanup();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomCode, user, isBotRace, runCountdown, determineWinner, cleanup]);

  // ─── Handle Typing ────────────────────────────────────────────────────────

  const handleTyping = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (phaseRef.current !== 'racing') return;

    const newText = e.target.value;
    const now = Date.now();

    // Log keystroke
    if (newText.length > typedText.length) {
      // Character added
      const charIndex = newText.length - 1;
      const char = newText[charIndex];
      const expectedChar = expectedText[charIndex] || '';
      keystrokeLogRef.current.push({
        char,
        expectedChar,
        timestamp: now,
        isCorrect: char === expectedChar,
        isBackspace: false,
      });
    } else if (newText.length < typedText.length) {
      // Backspace
      keystrokeLogRef.current.push({
        char: '',
        expectedChar: '',
        timestamp: now,
        isCorrect: false,
        isBackspace: true,
      });
    }

    setTypedText(newText);

    // Compute live metrics
    if (!startTimeRef.current) return;
    const elapsedMs = now - startTimeRef.current;

    const compLen = Math.min(newText.length, expectedText.length);
    let correct = 0;
    for (let i = 0; i < compLen; i++) {
      if (newText[i] === expectedText[i]) correct++;
    }

    const wpm = sanitizeMetric(calculateWpm(correct, elapsedMs));
    const totalTyped = newText.length;
    const acc = totalTyped > 0 ? sanitizeMetric(Math.round((correct / totalTyped) * 100 * 100) / 100) : 100;
    const progress = Math.min(100, Math.round((newText.length / expectedText.length) * 100));

    setMyLiveStats({
      wpm,
      accuracy: acc,
      consistency: sanitizeMetric(calculateConsistency(wpmWindowsRef.current)),
      progress,
      netWpm: wpm,
      isFinished: progress >= 100,
    });

    // Throttled DB update for multiplayer
    if (!isBotRace && roomCode) {
      const updateData = isHost
        ? { host_progress: progress, host_wpm: wpm, host_accuracy: acc }
        : { opponent_progress: progress, opponent_wpm: wpm, opponent_accuracy: acc };

      if (!updateThrottleRef.current) {
        updateThrottleRef.current = setTimeout(async () => {
          await supabase.from('race_sessions').update(updateData).eq('room_code', roomCode);
          updateThrottleRef.current = null;
        }, 200);
      }
    }

    // Check if finished typing
    if (newText.length >= expectedText.length) {
      if (updateThrottleRef.current) {
        clearTimeout(updateThrottleRef.current);
        updateThrottleRef.current = null;
      }
      finishRace();
    }
  }, [typedText, expectedText, isBotRace, roomCode, isHost, finishRace]);

  // ─── Restart ──────────────────────────────────────────────────────────────

  const handleRestart = useCallback(() => {
    cleanup();

    setTypedText('');
    setMyLiveStats({ wpm: 0, accuracy: 100, consistency: 0, progress: 0, netWpm: 0, isFinished: false });
    setOpponentLiveStats({ wpm: 0, accuracy: 100, consistency: 0, progress: 0, netWpm: 0, isFinished: false });
    setResult(null);
    keystrokeLogRef.current = [];
    wpmWindowsRef.current = [];
    startTimeRef.current = null;
    countdownStartedRef.current = false;
    botRef.current = null;

    if (botDifficulty) {
      createBotRace(botDifficulty);
    } else {
      setPhase('lobby');
      setRoomCode('');
      setRaceDbId(null);
      setBotDifficulty(null);
    }
  }, [botDifficulty, cleanup, createBotRace]);

  // ─── Copy Room Code ───────────────────────────────────────────────────────

  const copyRoomCode = useCallback(() => {
    navigator.clipboard.writeText(roomCode);
    toast({ title: 'Room code copied!', description: `Share ${roomCode} with your opponent` });
  }, [roomCode, toast]);

  return {
    // State
    phase,
    countdown,
    roomCode,
    expectedText,
    raceDuration,
    timeRemaining,
    typedText,
    isBotRace,
    botDifficulty,
    isHost,
    result,

    // Live stats
    myLiveStats,
    opponentLiveStats,

    // Actions
    setRaceDuration,
    createRace,
    createBotRace,
    joinRace,
    handleTyping,
    handleRestart,
    copyRoomCode,
  };
}
