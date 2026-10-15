import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Bot,
  Swords,
  Users,
  ArrowRight,
  Copy,
  LogOut,
  RotateCcw,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TypingArea } from "@/components/typing/TypingArea";
import { SessionResults } from "@/components/typing/SessionResults";
import {
  SessionController,
  graphemes,
  type SessionConfig,
  type SessionResult,
  type SessionSnapshot,
} from "@/lib/typing-core";
import { createBot, BOT_CONFIGS, type BotLevel } from "@/lib/bot-engine";
import { generatePackText } from "@/lib/content-packs";
import { opponentPacePosition } from "@/lib/race-pace";
import { useAuth } from "@/hooks/useAuth";
import { useTestResults } from "@/hooks/useTestResults";
import { usePreferences } from "@/contexts/PreferencesContext";
import {
  raceService,
  subscribeRace,
  type RaceRoom,
} from "@/services/race-service";
function Track({
  name,
  progress,
  wpm,
  bot,
  rival,
}: {
  name: string;
  progress: number;
  wpm: number | null;
  bot?: boolean;
  rival?: boolean;
}) {
  return (
    <div className="panel p-5">
      <div className="flex justify-between items-center mb-4 text-sm">
        <span className="inline-flex gap-2 items-center">
          {bot ? <Bot size={16} /> : <Users size={16} />}
          {name}
          {bot && (
            <span className="text-xs text-muted-foreground border rounded px-2 py-1">
              local bot
            </span>
          )}
        </span>
        <span className="font-mono">
          {wpm === null ? "—" : wpm.toFixed(0)}
          <span className="text-xs text-muted-foreground ml-1">wpm</span>
        </span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full">
        <div
          className={`h-full rounded-full transition-[width] duration-150 ${rival ? "race-opponent-progress" : "bg-primary"}`}
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {progress.toFixed(0)}% correct target characters
      </p>
    </div>
  );
}
function RaceSession({
  room,
  botLevel,
  onExit,
  onRoom,
  onRestart,
  autoFocus,
}: {
  room?: RaceRoom;
  botLevel?: BotLevel;
  onExit: () => void;
  onRoom: (room: RaceRoom) => void;
  onRestart?: () => void;
  autoFocus?: boolean;
}) {
  const { user } = useAuth(),
    { preferences } = usePreferences(),
    { saveSession, syncState } = useTestResults();
  const [result, setResult] = useState<SessionResult | null>(null),
    [error, setError] = useState(""),
    [botStats, setBotStats] = useState({
      progress: 0,
      wpm: null as number | null,
      cursor: 0,
    }),
    [own, setOwn] = useState({ progress: 0, wpm: null as number | null });
  const [bundle] = useState(() => {
    const config: SessionConfig = {
      clientSessionId: crypto.randomUUID(),
      mode: "race",
      ownerScope: user?.id || "guest",
      initialTarget:
        room?.expected_text || generatePackText("en", 100, crypto.randomUUID()),
      durationMs: (room?.duration_seconds || 30) * 1000,
      scoringPolicy: "prose",
      language: "en",
      keyboardLayout: preferences.layout,
      contentRevision: room ? "server-race-v1" : "forge-curated-2026.10.15",
      challengeId: room?.id || `local-bot:${botLevel}`,
      settings: { localBot: !!botLevel },
      privacy: "public-corpus",
    };
    const now = performance.now(),
      serverNow = room?.server_now ? Date.parse(room.server_now) : Date.now(),
      startWall = room?.started_at ? Date.parse(room.started_at) : Date.now(),
      startMono = now - Math.max(0, serverNow - startWall);
    const controller = new SessionController(config, {
      now: () => performance.now(),
      wallNow: () => Date.now(),
    });
    controller.startAt(startMono, startWall);
    return {
      config,
      controller,
      startMono,
      startWall,
      targetUnits: graphemes(config.initialTarget).length,
    };
  });
  const roomRef = useRef(room),
    latest = useRef<SessionSnapshot | null>(null),
    posting = useRef(false),
    completed = useRef(false);
  roomRef.current = room;
  const roomStatus = room?.status,
    raceId = room?.id;
  const finish = useCallback(
    (value: SessionResult) => {
      completed.current = true;
      setResult(value);
      if (botLevel)
        void saveSession(value).catch((cause) => setError(String(cause)));
      else if (roomRef.current)
        void raceService
          .submit(roomRef.current.id, value, true)
          .then(onRoom)
          .catch((cause) =>
            setError(
              `Race finish could not be confirmed: ${String(cause)}. Retry below.`,
            ),
          );
    },
    [botLevel, saveSession, onRoom],
  );
  useEffect(() => {
    if (
      roomStatus &&
      ["completed", "cancelled", "abandoned"].includes(roomStatus) &&
      !completed.current
    ) {
      completed.current = true;
      setResult(bundle.controller.finish("abandoned"));
    }
  }, [roomStatus, bundle]);
  useEffect(() => {
    if (!botLevel) return;
    const runner = createBot(botLevel, bundle.config.initialTarget, {
      now: () => performance.now(),
    });
    runner.start();
    const botController = new SessionController(
      {
        ...bundle.config,
        clientSessionId: `${bundle.config.clientSessionId}-opponent`,
      },
      { now: () => performance.now(), wallNow: () => Date.now() },
    );
    botController.startAt(bundle.startMono, bundle.startWall);
    let processed = 0;
    const timer = setInterval(() => {
      if (completed.current) return;
      const state = runner.tick();
      for (; processed < state.keystrokes.length; processed++) {
        const event = state.keystrokes[processed];
        botController.input(
          event.isBackspace
            ? { type: "delete" }
            : { type: "insert", text: event.char },
          event.timestamp,
        );
      }
      const snapshot = botController.tick();
      setBotStats({
        progress: snapshot.targetText.length
          ? (snapshot.metrics.correct /
              snapshot.characters.filter((slot) => slot.expected !== null)
                .length) *
            100
          : 0,
        wpm: snapshot.metrics.wpm,
        cursor: snapshot.cursor,
      });
    }, 100);
    return () => clearInterval(timer);
  }, [botLevel, bundle]);
  useEffect(() => {
    if (botLevel || !raceId) return;
    const timer = setInterval(() => {
      if (
        posting.current ||
        completed.current ||
        !latest.current ||
        latest.current.status !== "running"
      )
        return;
      // A checkpoint exports replayable evidence without freezing the live controller.
      const controller = bundle.controller as SessionController & {
        checkpoint?: () => SessionResult;
      };
      if (!controller.checkpoint) return;
      posting.current = true;
      void raceService
        .submit(raceId, controller.checkpoint(), false)
        .then(onRoom)
        .catch((cause) => setError(String(cause)))
        .finally(() => {
          posting.current = false;
        });
    }, 1000);
    return () => clearInterval(timer);
  }, [botLevel, bundle, raceId, onRoom]);
  const isHost = room?.host_id === user?.id;
  const opponent = botLevel
    ? botStats
    : {
        progress: isHost
          ? (room?.opponent_progress ?? 0)
          : (room?.host_progress ?? 0),
        wpm: isHost ? (room?.opponent_wpm ?? null) : (room?.host_wpm ?? null),
      };
  const snapshot = useCallback((value: SessionSnapshot) => {
    latest.current = value;
    setOwn({
      progress: value.characters.length
        ? (value.metrics.correct /
            value.characters.filter((slot) => slot.expected !== null).length) *
          100
        : 0,
      wpm: value.metrics.wpm,
    });
  }, []);
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Track name="You" progress={own.progress} wpm={own.wpm} />
        <Track
          name={
            botLevel
              ? `${botLevel[0].toUpperCase()}${botLevel.slice(1)} opponent`
              : "Opponent"
          }
          progress={opponent.progress}
          wpm={opponent.wpm}
          bot={!!botLevel}
          rival
        />
      </div>
      {error && (
        <div role="alert" className="panel p-4 text-sm text-destructive">
          {error}
          {result && room && (
            <button
              className="forge-button-secondary ml-3"
              onClick={() => {
                void raceService
                  .submit(room.id, result, true)
                  .then((value) => {
                    setError("");
                    onRoom(value);
                  })
                  .catch((cause) => setError(String(cause)));
              }}
            >
              Retry finish
            </button>
          )}
        </div>
      )}
      {result ? (
        <>
          <div className="panel p-5">
            <h2 className="font-medium">
              {botLevel
                ? "Bot practice complete"
                : room?.status === "completed"
                  ? room.winner_id === null
                    ? "Race tied"
                    : room.winner_id === user?.id
                      ? "You won this race"
                      : "Opponent won this race"
                  : ["cancelled", "abandoned"].includes(room?.status || "")
                    ? "Race ended"
                    : "Your result is in. Waiting for the server."}
            </h2>
            <p className="text-xs text-muted-foreground mt-2">
              {botLevel
                ? "Local bot practice stays separate from human rankings."
                : "The server confirms the finish order and shared race timing."}
            </p>
          </div>
          <SessionResults
            result={result}
            onRestart={botLevel && onRestart ? onRestart : onExit}
            quickRestart={!!botLevel && !!onRestart}
            saveStatus={botLevel ? syncState : undefined}
          />
        </>
      ) : (
        <TypingArea
          configuration={bundle.config}
          controller={bundle.controller}
          onTestComplete={finish}
          onSnapshot={snapshot}
          onRestart={botLevel ? onRestart : undefined}
          autoFocus={autoFocus}
          opponentPace={{
            label: botLevel ? "Bot" : "Opponent",
            position: opponentPacePosition(
              bundle.targetUnits,
              botLevel
                ? { cursor: botStats.cursor }
                : { progress: opponent.progress },
            ),
            wpm: opponent.wpm,
            approximate: !botLevel,
          }}
        />
      )}
    </div>
  );
}
export default function Race() {
  const { roomCode } = useParams(),
    navigate = useNavigate(),
    { user } = useAuth();
  const userId = user?.id;
  const [room, setRoom] = useState<RaceRoom | null>(null),
    [mountedRace, setMountedRace] = useState<string | null>(null),
    [bot, setBot] = useState<BotLevel | null>(null),
    [botAttempt, setBotAttempt] = useState(0),
    [difficulty, setDifficulty] = useState<BotLevel>("intermediate"),
    [code, setCode] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [now, setNow] = useState(Date.now()),
    [serverOffset, setServerOffset] = useState(0),
    [copied, setCopied] = useState(false),
    [duration, setDuration] = useState(30);
  const acceptRoom = useCallback((value: RaceRoom) => {
    if (value.server_now)
      setServerOffset(Date.parse(value.server_now) - Date.now());
    setRoom((previous) =>
      !previous || value.id !== previous.id || value.version >= previous.version
        ? value
        : previous,
    );
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!roomCode || !userId) return;
    setError("");
    let alive = true;
    void raceService
      .get(roomCode)
      .then((value) => {
        if (alive) acceptRoom(value);
      })
      .catch((cause) => {
        if (alive) setError(String(cause));
      });
    const unsubscribe = subscribeRace(
      roomCode,
      (value) => {
        if (alive) acceptRoom(value);
      },
      (cause) => {
        if (alive) setError(cause.message);
      },
    );
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [roomCode, userId, acceptRoom]);
  const operation = async (run: () => Promise<RaceRoom>) => {
    setBusy(true);
    setError("");
    try {
      const value = await run();
      acceptRoom(value);
      navigate(`/race/${value.room_code}`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The race operation failed. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  const exit = () => {
    setBot(null);
    setBotAttempt(0);
    setRoom(null);
    setMountedRace(null);
    setError("");
    navigate("/race");
  };
  const retryBot = useCallback(() => setBotAttempt((value) => value + 1), []);
  const synchronizedNow = now + serverOffset;
  const start = room?.started_at ? Date.parse(room.started_at) : null;
  const active =
    room &&
    (room.status === "active" ||
      (room.status === "countdown" &&
        start !== null &&
        synchronizedNow >= start));
  const currentRoomId = room?.id;
  useEffect(() => {
    if (active && currentRoomId) setMountedRace(currentRoomId);
  }, [active, currentRoomId]);
  return (
    <div className="forge-shell">
      <Header />
      <main id="main-content" className="forge-main">
        <div className="flex flex-wrap justify-between gap-4 mb-9">
          <div>
            <p className="eyebrow">A little friendly competition</p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-3">
              Find your racing rhythm<span className="text-primary">.</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-3">
              Share a track with a friend, or warm up against a local bot.
            </p>
          </div>
          {(bot || room) && (
            <button
              className="forge-button-secondary self-end"
              disabled={busy}
              onClick={() => {
                if (
                  room &&
                  !["completed", "cancelled", "abandoned"].includes(room.status)
                ) {
                  setBusy(true);
                  void raceService
                    .leave(room.id)
                    .then(exit)
                    .catch((cause) => setError(String(cause)))
                    .finally(() => setBusy(false));
                } else exit();
              }}
            >
              <LogOut size={15} />
              Leave race
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="panel p-4 mb-5 text-sm text-destructive">
            {error}
          </p>
        )}
        {bot ? (
          <RaceSession
            key={`bot:${bot}:${botAttempt}`}
            botLevel={bot}
            onExit={exit}
            onRoom={acceptRoom}
            onRestart={retryBot}
            autoFocus={botAttempt > 0 ? true : undefined}
          />
        ) : room && (active || mountedRace === room.id) ? (
          <RaceSession
            key={room.id}
            room={room}
            onExit={exit}
            onRoom={acceptRoom}
          />
        ) : room ? (
          <section className="panel p-8 sm:p-12 text-center">
            <Swords className="text-primary mx-auto mb-5" size={30} />
            <h2 className="text-2xl font-medium">
              {room.status === "waiting"
                ? "Your track is ready."
                : room.status === "countdown"
                  ? "Get ready…"
                  : "This race has ended."}
            </h2>
            <p className="text-sm text-muted-foreground mt-3">
              {room.status === "waiting"
                ? "Send the room code to a friend. Both racers start on the same server countdown."
                : room.status === "countdown"
                  ? "The shared clock starts with the countdown, including any idle time."
                  : "The scores below are the last server-confirmed result."}
            </p>
            <p className="font-mono text-4xl tracking-[.25em] text-primary mt-8 mb-4">
              {room.room_code}
            </p>
            {room.status === "completed" && (
              <div className="grid sm:grid-cols-2 gap-4 my-6 text-left">
                <Track
                  name="Host"
                  progress={room.host_progress}
                  wpm={room.host_wpm}
                />
                <Track
                  name="Opponent"
                  progress={room.opponent_progress}
                  wpm={room.opponent_wpm}
                />
              </div>
            )}
            <button
              className="forge-button-secondary"
              onClick={() => {
                void navigator.clipboard
                  .writeText(`${location.origin}/race/${room.room_code}`)
                  .then(() => setCopied(true))
                  .catch(() =>
                    setError("Copy unavailable. Select the room code above."),
                  );
              }}
            >
              <Copy size={15} />
              {copied ? "Link copied" : "Copy invite link"}
            </button>
            {room.status === "countdown" && (
              <p className="font-mono text-5xl mt-8">
                {start
                  ? Math.max(1, Math.ceil((start - synchronizedNow) / 1000))
                  : "…"}
              </p>
            )}
            {["cancelled", "abandoned", "completed"].includes(room.status) && (
              <button
                className="forge-button ml-3"
                onClick={() =>
                  void operation(() => raceService.rematch(room.id))
                }
              >
                <RotateCcw size={15} />
                Rematch
              </button>
            )}
          </section>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <section className="panel p-7">
              <Bot size={24} className="text-primary mb-5" />
              <h2 className="text-xl font-medium">
                A practice partner, always ready.
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3 mb-6">
                A local bot with a natural rhythm, occasional mistakes and real
                corrections. No account needed.
              </p>
              <label className="text-sm block mb-6">
                Difficulty
                <select
                  className="forge-input mt-2"
                  value={difficulty}
                  onChange={(event) =>
                    setDifficulty(event.target.value as BotLevel)
                  }
                >
                  {Object.entries(BOT_CONFIGS).map(([id, value]) => (
                    <option key={id} value={id}>
                      {id[0].toUpperCase() + id.slice(1)} · about{" "}
                      {value.targetWpmMean} wpm
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="forge-button w-full"
                onClick={() => {
                  setBotAttempt(0);
                  setBot(difficulty);
                }}
              >
                Start bot practice
                <ArrowRight size={16} />
              </button>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                30 seconds · local practice · clearly labelled bot
              </p>
            </section>
            <section className="panel p-7">
              <Users size={24} className="text-primary mb-5" />
              <h2 className="text-xl font-medium">One room. Two racers.</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3 mb-6">
                A shared passage, server countdown and validated finish. Sign in
                to create or join a human room.
              </p>
              {user ? (
                <>
                  <label className="text-sm block">
                    Duration
                    <select
                      className="forge-input mt-2"
                      value={duration}
                      onChange={(e) => setDuration(+e.target.value)}
                    >
                      {[15, 30, 60, 120].map((n) => (
                        <option key={n} value={n}>
                          {n} seconds
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex gap-3 my-4">
                    <button
                      className="forge-button flex-1"
                      disabled={busy}
                      onClick={() =>
                        void operation(() => raceService.create(duration))
                      }
                    >
                      Create room
                    </button>
                    <button
                      className="forge-button-secondary flex-1"
                      disabled={busy}
                      onClick={() =>
                        void operation(() => raceService.quickMatch(duration))
                      }
                    >
                      Quick match
                    </button>
                  </div>
                  <form
                    className="flex gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void operation(() => raceService.join(roomCode || code));
                    }}
                  >
                    <label className="sr-only" htmlFor="room-code">
                      Room code
                    </label>
                    <input
                      id="room-code"
                      className="forge-input font-mono uppercase"
                      placeholder="Room code"
                      value={roomCode || code}
                      onChange={(e) => setCode(e.target.value)}
                      maxLength={12}
                    />
                    <button
                      className="forge-button-secondary"
                      disabled={busy || !(roomCode || code).trim()}
                    >
                      Join
                    </button>
                  </form>
                </>
              ) : (
                <Link to="/auth" className="forge-button-secondary w-full">
                  Sign in for human races
                  <ArrowRight size={16} />
                </Link>
              )}
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
