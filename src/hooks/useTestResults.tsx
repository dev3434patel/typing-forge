import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { saveTestResult, type TestResult, type TypingStats } from '@/lib/typing-engine';
import { 
  type KeystrokeRecord, 
  computeSessionMetrics, 
  sanitizeMetric 
} from '@/lib/metrics-engine';
import { type Keystroke } from '@/lib/professional-accuracy';

interface PerCharMetric {
  char: string;
  wpm: number;
  accuracy: number;
  confidence: number;
  occurrences: number;
}

// Extended stats interface with keystroke log for server-authoritative metrics
export interface ExtendedTypingStats extends TypingStats {
  wpmHistory: number[];
  backspaceCount?: number;
  keystrokeLog?: Keystroke[];
  targetText?: string;
  typedText?: string;
}

/**
 * Convert legacy Keystroke format to KeystrokeRecord for metrics engine
 */
function convertToKeystrokeRecord(keystrokes: Keystroke[], sessionId: string): KeystrokeRecord[] {
  return keystrokes.map((k, index) => ({
    session_id: sessionId,
    char_expected: k.expected || k.char,
    char_typed: k.char,
    event_type: 'keydown' as const,
    timestamp_ms: k.timestamp,
    cursor_index: k.position,
    is_backspace: k.key === 'Backspace',
    is_correct: k.isCorrect ?? (k.char === k.expected),
  }));
}

export function useTestResults() {
  const { user } = useAuth();

  const saveResult = useCallback(async (
    stats: ExtendedTypingStats,
    mode: string,
    duration: number
  ) => {
    // Use canonical metrics engine if keystroke log is available
    let finalMetrics = {
      netWpm: sanitizeMetric(stats.wpm),
      rawWpm: sanitizeMetric(stats.rawWpm),
      accuracy: sanitizeMetric(stats.accuracy),
      consistency: sanitizeMetric(stats.consistency),
      correctChars: stats.correctChars,
      incorrectChars: stats.incorrectChars,
      totalChars: stats.totalChars,
      backspaceCount: stats.backspaceCount || 0,
    };

    // If keystroke log is available, compute server-authoritative metrics
    if (stats.keystrokeLog && stats.keystrokeLog.length > 0 && stats.targetText && stats.typedText) {
      const sessionId = crypto.randomUUID();
      const keystrokeRecords = convertToKeystrokeRecord(stats.keystrokeLog, sessionId);
      
      const sessionMetrics = computeSessionMetrics(
        keystrokeRecords,
        stats.targetText,
        stats.typedText
      );
      
      // Use canonical metrics from engine
      finalMetrics = {
        netWpm: sanitizeMetric(sessionMetrics.netWpm),
        rawWpm: sanitizeMetric(sessionMetrics.rawWpm),
        accuracy: sanitizeMetric(sessionMetrics.accuracy),
        consistency: sanitizeMetric(sessionMetrics.consistency),
        correctChars: sessionMetrics.correctChars,
        incorrectChars: sessionMetrics.incorrectChars,
        totalChars: sessionMetrics.totalTypedChars,
        backspaceCount: sessionMetrics.backspaceCount,
      };
    } else {
      // Fallback: Apply backspace cap manually if no keystroke log
      if (stats.backspaceCount && stats.backspaceCount > 0 && finalMetrics.accuracy === 100) {
        finalMetrics.accuracy = 99.99;
      }
    }
    
    // Always save to localStorage
    const localResult: TestResult = {
      id: crypto.randomUUID(),
      wpm: finalMetrics.netWpm,
      rawWpm: finalMetrics.rawWpm,
      accuracy: finalMetrics.accuracy,
      consistency: finalMetrics.consistency,
      mode,
      duration,
      correctChars: finalMetrics.correctChars,
      incorrectChars: finalMetrics.incorrectChars,
      totalChars: finalMetrics.totalChars,
      errors: stats.errors,
      date: new Date().toISOString(),
      wpmHistory: stats.wpmHistory,
    };
    saveTestResult(localResult);

    // If logged in, also save to database with canonical metrics
    if (user) {
      try {
        // Save test session with server-authoritative metrics
        await supabase.from('test_sessions').insert({
          user_id: user.id,
          test_mode: mode,
          duration_seconds: duration,
          gross_wpm: finalMetrics.rawWpm,
          net_wpm: finalMetrics.netWpm,
          accuracy_percent: finalMetrics.accuracy,
          consistency_percent: finalMetrics.consistency,
          total_characters: finalMetrics.totalChars,
          correct_characters: finalMetrics.correctChars,
          error_count: stats.errors,
          wpm_history: stats.wpmHistory,
        });

        // Update leaderboard entry with sanitized values
        const { data: existingEntry } = await supabase
          .from('leaderboards')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingEntry) {
          const testsCompleted = (existingEntry.tests_completed || 0) + 1;
          const prevAvgWpm = existingEntry.wpm_avg || 0;
          const prevAvgAccuracy = existingEntry.accuracy_avg || 0;
          const prevAvgConsistency = existingEntry.consistency_avg || 0;
          const prevTestsCompleted = existingEntry.tests_completed || 0;
          
          const newAvgWpm = sanitizeMetric(((prevAvgWpm * prevTestsCompleted) + finalMetrics.netWpm) / testsCompleted);
          const newAvgAccuracy = sanitizeMetric(((prevAvgAccuracy * prevTestsCompleted) + finalMetrics.accuracy) / testsCompleted);
          const newAvgConsistency = sanitizeMetric(((prevAvgConsistency * prevTestsCompleted) + finalMetrics.consistency) / testsCompleted);

          await supabase
            .from('leaderboards')
            .update({
              wpm_best: Math.max(existingEntry.wpm_best || 0, finalMetrics.netWpm),
              wpm_avg: newAvgWpm,
              accuracy_avg: newAvgAccuracy,
              consistency_avg: newAvgConsistency,
              tests_completed: testsCompleted,
              total_characters: (existingEntry.total_characters || 0) + finalMetrics.totalChars,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);
        } else {
          await supabase.from('leaderboards').insert({
            user_id: user.id,
            wpm_best: finalMetrics.netWpm,
            wpm_avg: finalMetrics.netWpm,
            accuracy_avg: finalMetrics.accuracy,
            consistency_avg: finalMetrics.consistency,
            tests_completed: 1,
            total_characters: finalMetrics.totalChars,
          });
        }
      } catch (error) {
        console.error('Failed to save test to database:', error);
      }
    }

    return localResult;
  }, [user]);

  const saveCharacterConfidence = useCallback(async (charMetrics: Record<string, PerCharMetric>) => {
    if (!user) return;

    try {
      for (const [char, metrics] of Object.entries(charMetrics)) {
        const { data: existing } = await supabase
          .from('character_confidence')
          .select('*')
          .eq('user_id', user.id)
          .eq('character', char)
          .maybeSingle();

        if (existing) {
          const shouldUnlock = metrics.wpm >= 35 && metrics.accuracy >= 95;
          
          await supabase
            .from('character_confidence')
            .update({
              confidence_level: metrics.confidence,
              current_wpm: metrics.wpm,
              current_accuracy: metrics.accuracy,
              total_instances: existing.total_instances + metrics.occurrences,
              lessons_practiced: existing.lessons_practiced + 1,
              is_unlocked: existing.is_unlocked || shouldUnlock,
              unlocked_at: shouldUnlock && !existing.is_unlocked ? new Date().toISOString() : existing.unlocked_at,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
        } else {
          const shouldUnlock = metrics.wpm >= 35 && metrics.accuracy >= 95;
          
          await supabase.from('character_confidence').insert({
            user_id: user.id,
            character: char,
            confidence_level: metrics.confidence,
            current_wpm: metrics.wpm,
            current_accuracy: metrics.accuracy,
            total_instances: metrics.occurrences,
            lessons_practiced: 1,
            is_unlocked: shouldUnlock,
            unlocked_at: shouldUnlock ? new Date().toISOString() : null,
          });
        }
      }
    } catch (error) {
      console.error('Failed to save character confidence:', error);
    }
  }, [user]);

  return { saveResult, saveCharacterConfidence };
}
