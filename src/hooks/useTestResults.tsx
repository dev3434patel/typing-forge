import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { saveTestResult, type TestResult, type TypingStats } from '@/lib/typing-engine';
import { sanitizeMetric } from '@/lib/metrics-engine';
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

export function useTestResults() {
  const { user } = useAuth();

  const saveResult = useCallback(async (
    stats: ExtendedTypingStats,
    mode: string,
    duration: number
  ) => {
    // Compute client-side metrics for localStorage (works for anonymous users)
    const finalMetrics = {
      netWpm: sanitizeMetric(stats.wpm),
      rawWpm: sanitizeMetric(stats.rawWpm),
      accuracy: sanitizeMetric(stats.accuracy),
      consistency: sanitizeMetric(stats.consistency),
      correctChars: stats.correctChars,
      incorrectChars: stats.incorrectChars,
      totalChars: stats.totalChars,
      backspaceCount: stats.backspaceCount || 0,
    };

    // Apply backspace cap
    if (finalMetrics.backspaceCount > 0 && finalMetrics.accuracy >= 100) {
      finalMetrics.accuracy = 99.99;
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

    // SERVER-AUTHORITATIVE: Send keystrokes to edge function for logged-in users
    // Server recomputes all metrics and saves to test_sessions + leaderboards
    if (user && stats.keystrokeLog && stats.keystrokeLog.length > 0 && stats.targetText) {
      try {
        const keystrokePayload = stats.keystrokeLog.map(k => ({
          char: k.char,
          expectedChar: k.expected || k.char,
          timestamp: k.timestamp,
          isCorrect: k.isCorrect ?? (k.char === k.expected),
          isBackspace: k.key === 'Backspace',
        }));

        await supabase.functions.invoke('finish-test', {
          body: {
            keystrokes: keystrokePayload,
            targetText: stats.targetText,
            typedText: stats.typedText || '',
            mode,
            durationSeconds: duration,
          },
        });
      } catch (error) {
        console.error('Failed to save test via server:', error);
        // Fallback: save directly to DB with client metrics
        await fallbackSave(user.id, finalMetrics, stats, mode, duration);
      }
    } else if (user) {
      // No keystroke log available, fallback to client-side save
      await fallbackSave(user.id, finalMetrics, stats, mode, duration);
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
          const shouldUnlock = metrics.wpm >= 35 && metrics.accuracy >= 95 && metrics.confidence >= 0.9 && metrics.occurrences >= 20;

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
          const shouldUnlock = metrics.wpm >= 35 && metrics.accuracy >= 95 && metrics.confidence >= 0.9 && metrics.occurrences >= 20;

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

/** Fallback: direct DB save when edge function is unavailable */
async function fallbackSave(
  userId: string,
  metrics: { netWpm: number; rawWpm: number; accuracy: number; consistency: number; correctChars: number; incorrectChars: number; totalChars: number; backspaceCount: number },
  stats: ExtendedTypingStats,
  mode: string,
  duration: number
) {
  try {
    await supabase.from('test_sessions').insert({
      user_id: userId,
      test_mode: mode,
      duration_seconds: duration,
      gross_wpm: metrics.rawWpm,
      net_wpm: metrics.netWpm,
      accuracy_percent: metrics.accuracy,
      consistency_percent: metrics.consistency,
      total_characters: metrics.totalChars,
      correct_characters: metrics.correctChars,
      error_count: stats.errors,
      wpm_history: stats.wpmHistory,
    });
  } catch (error) {
    console.error('Fallback save failed:', error);
  }
}
