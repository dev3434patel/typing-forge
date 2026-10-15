import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Server-authoritative test finisher.
 * Accepts keystroke log + metadata, recomputes ALL metrics server-side,
 * ignores any client-computed wpm/accuracy/consistency.
 */

// ── Metric formulas (mirrors metrics-engine.ts) ──────────────────────────────

interface KeystrokePayload {
  char: string;
  expectedChar: string;
  timestamp: number;
  isCorrect: boolean;
  isBackspace: boolean;
}

function sanitize(v: number): number {
  if (!isFinite(v) || isNaN(v) || v < 0 || v > 100000) return 0;
  return v;
}

function computeMetrics(
  keystrokes: KeystrokePayload[],
  targetText: string,
  typedText: string
) {
  const nonBackspace = keystrokes.filter((k) => !k.isBackspace);
  const backspaceCount = keystrokes.filter((k) => k.isBackspace).length;

  if (nonBackspace.length === 0) {
    return {
      rawWpm: 0, netWpm: 0, accuracy: 0, consistency: 0,
      totalTypedChars: 0, correctChars: 0, incorrectChars: 0,
      elapsedMs: 0, backspaceCount,
    };
  }

  const firstTs = nonBackspace[0].timestamp;
  const lastTs = nonBackspace[nonBackspace.length - 1].timestamp;
  const elapsedMs = lastTs - firstTs;

  // Compare final typed text against target
  const compLen = Math.min(typedText.length, targetText.length);
  let correctChars = 0;
  for (let i = 0; i < compLen; i++) {
    if (typedText[i] === targetText[i]) correctChars++;
  }
  const totalTypedChars = typedText.length;
  const incorrectChars = totalTypedChars - correctChars;

  const minutes = elapsedMs / 60000;
  const rawWpm = sanitize(minutes > 0 ? Math.round((totalTypedChars / 5) / minutes) : 0);
  const netWpm = sanitize(minutes > 0 ? Math.round((correctChars / 5) / minutes) : 0);

  let accuracy = totalTypedChars > 0 ? (correctChars / totalTypedChars) * 100 : 0;
  if (backspaceCount > 0 && accuracy >= 100) accuracy = 99.99;
  accuracy = sanitize(Math.round(accuracy * 100) / 100);

  // Consistency from 5s rolling windows
  const WINDOW = 5000;
  const STEP = 1000;
  const wpmValues: number[] = [];
  for (let ws = firstTs; ws <= lastTs - WINDOW; ws += STEP) {
    const we = ws + WINDOW;
    const correct = nonBackspace.filter(
      (k) => k.timestamp >= ws && k.timestamp < we && k.isCorrect
    ).length;
    wpmValues.push(Math.round((correct / 5) / (WINDOW / 60000)));
  }

  let consistency = 0;
  const valid = wpmValues.filter((w) => w > 0 && isFinite(w));
  if (valid.length >= 2) {
    const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
    if (mean > 0) {
      const variance = valid.reduce((s, w) => s + (w - mean) ** 2, 0) / valid.length;
      const cv = Math.sqrt(variance) / mean;
      consistency = sanitize(Math.round(Math.max(0, Math.min(100, 100 - cv * 100)) * 10) / 10);
    }
  }

  return {
    rawWpm, netWpm, accuracy, consistency,
    totalTypedChars, correctChars, incorrectChars,
    elapsedMs, backspaceCount,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { keystrokes, targetText, typedText, mode, durationSeconds } = body as {
      keystrokes: KeystrokePayload[];
      targetText: string;
      typedText: string;
      mode: string;
      durationSeconds: number;
    };

    if (!keystrokes || !targetText || !mode) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server recomputes ALL metrics
    const metrics = computeMetrics(keystrokes, targetText, typedText || "");

    // Save to test_sessions with server-computed values
    const { error: insertErr } = await supabase.from("test_sessions").insert({
      user_id: user.id,
      test_mode: mode,
      duration_seconds: durationSeconds || Math.round(metrics.elapsedMs / 1000),
      gross_wpm: metrics.rawWpm,
      net_wpm: metrics.netWpm,
      accuracy_percent: metrics.accuracy,
      consistency_percent: metrics.consistency,
      total_characters: metrics.totalTypedChars,
      correct_characters: metrics.correctChars,
      error_count: metrics.incorrectChars,
    });

    if (insertErr) {
      console.error("Insert error:", insertErr);
    }

    // Update leaderboard
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: existing } = await serviceClient
      .from("leaderboards")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      const tests = (existing.tests_completed || 0) + 1;
      const prev = existing.tests_completed || 0;
      await serviceClient
        .from("leaderboards")
        .update({
          wpm_best: Math.max(existing.wpm_best || 0, metrics.netWpm),
          wpm_avg: sanitize(((existing.wpm_avg || 0) * prev + metrics.netWpm) / tests),
          accuracy_avg: sanitize(((existing.accuracy_avg || 0) * prev + metrics.accuracy) / tests),
          consistency_avg: sanitize(((existing.consistency_avg || 0) * prev + metrics.consistency) / tests),
          tests_completed: tests,
          total_characters: (existing.total_characters || 0) + metrics.totalTypedChars,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    } else {
      await serviceClient.from("leaderboards").insert({
        user_id: user.id,
        wpm_best: metrics.netWpm,
        wpm_avg: metrics.netWpm,
        accuracy_avg: metrics.accuracy,
        consistency_avg: metrics.consistency,
        tests_completed: 1,
        total_characters: metrics.totalTypedChars,
      });
    }

    return new Response(
      JSON.stringify({ success: true, metrics }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
