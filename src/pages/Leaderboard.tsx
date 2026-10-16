import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Crown, ShieldCheck, Trophy } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { cohortLabel, metricLabel } from "@/services/history-model";

interface Cohort {
  comparison_key: string;
  participants: number;
}
interface RankedEntry {
  position: number;
  user_id: string;
  handle: string;
  best_wpm: number;
  avg_accuracy: number;
  test_count: number;
  total_entries: number;
  is_own: boolean;
}
type RankingPeriod = "alltime" | "day" | "week";
const PERIODS: { value: RankingPeriod; label: string; explanation: string }[] =
  [
    {
      value: "alltime",
      label: "All time",
      explanation: "Accepted results across all dates in this comparison.",
    },
    {
      value: "day",
      label: "Today",
      explanation: "Results accepted today, from 00:00 to the next 00:00 UTC.",
    },
    {
      value: "week",
      label: "This week",
      explanation:
        "Results accepted this week, from Monday 00:00 to the next Monday 00:00 UTC.",
    },
  ];

export default function Leaderboard() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [cohort, setCohort] = useState("");
  const [entries, setEntries] = useState<RankedEntry[]>([]);
  const [period, setPeriod] = useState<RankingPeriod>("alltime");
  const [page, setPage] = useState(0);
  const [cohortsLoading, setCohortsLoading] = useState(isSupabaseConfigured);
  const [rankingsLoading, setRankingsLoading] = useState(false);
  const [cohortError, setCohortError] = useState("");
  const [rankingError, setRankingError] = useState("");
  const [retry, setRetry] = useState(0);
  const selectedPeriod = PERIODS.find((item) => item.value === period)!;
  const loading = cohortsLoading || rankingsLoading;
  const error = cohortError || rankingError;

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    setCohortsLoading(true);
    setCohortError("");
    const fail = (message: string) => {
      if (!active) return;
      setCohortError(`Rankings are unavailable: ${message}`);
      setCohortsLoading(false);
    };
    void supabase.rpc("forge_ranked_cohorts" as never).then(
      ({ data, error }) => {
        if (!active) return;
        if (error) {
          fail(error.message);
          return;
        }
        const rows = (data as unknown as Cohort[]) ?? [];
        setCohorts(rows);
        setCohort((previous) =>
          rows.some((row) => row.comparison_key === previous)
            ? previous
            : (rows[0]?.comparison_key ?? ""),
        );
        setCohortsLoading(false);
      },
      (reason: unknown) =>
        fail(reason instanceof Error ? reason.message : "Connection failed."),
    );
    return () => {
      active = false;
    };
  }, [retry]);

  useEffect(() => {
    if (!isSupabaseConfigured || !cohort) {
      setEntries([]);
      setRankingsLoading(false);
      return;
    }
    let active = true;
    setRankingsLoading(true);
    setRankingError("");
    const params = {
      p_comparison_key: cohort,
      p_limit: 25,
      p_offset: page * 25,
    };
    // Preserve the deployed all-time endpoint for existing installations.
    const request =
      period === "alltime"
        ? supabase.rpc("forge_rankings" as never, params as never)
        : supabase.rpc(
            "forge_rankings_period" as never,
            { ...params, p_period: period } as never,
          );
    const fail = (message: string) => {
      if (!active) return;
      setRankingError(`Ranking results could not be loaded: ${message}`);
      setEntries([]);
      setRankingsLoading(false);
    };
    void request.then(
      ({ data, error }) => {
        if (!active) return;
        if (error) {
          fail(error.message);
          return;
        }
        setEntries((data as unknown as RankedEntry[]) ?? []);
        setRankingsLoading(false);
      },
      (reason: unknown) =>
        fail(reason instanceof Error ? reason.message : "Connection failed."),
    );
    return () => {
      active = false;
    };
  }, [cohort, page, period, retry]);

  return (
    <div className="forge-shell">
      <Header />
      <main id="main-content" className="forge-main">
        <div className="flex flex-wrap justify-between items-end gap-5 mb-9">
          <div>
            <p className="eyebrow flex items-center gap-2">
              <Trophy size={14} aria-hidden="true" /> An even playing field
            </p>
            <h1 className="text-4xl font-semibold tracking-tight mt-3">
              The leaderboard<span className="text-primary">.</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-3">
              Server accepted results, compared with the same rules and
              settings.
            </p>
          </div>
          <Link to="/ranked" className="forge-button-secondary">
            Take a ranked challenge{" "}
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
        <section className="panel p-5 flex items-start gap-3 mb-6">
          <ShieldCheck
            size={19}
            className="text-primary shrink-0 mt-1"
            aria-hidden="true"
          />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Rankings require an authenticated, server issued timed challenge and
            replay validation. Ordinary practice, imported history, bots and
            assisted input stay personal. Browser evidence checks consistency;
            it cannot prove human input. Equal best WPM and average accuracy
            share the same rank.
          </p>
        </section>
        {!isSupabaseConfigured ? (
          <section className="panel p-10 text-center">
            <h2 className="text-lg font-medium">
              Cloud rankings are unavailable in this installation.
            </h2>
            <p className="text-sm text-muted-foreground mt-3">
              Your guest practice and personal history are ready to use.
            </p>
          </section>
        ) : (
          <>
            <section
              className="panel p-5 mb-6 space-y-5"
              aria-label="Ranking filters"
            >
              {cohorts.length > 0 && (
                <label className="block text-xs text-muted-foreground">
                  Comparison
                  <select
                    className="forge-input mt-2"
                    value={cohort}
                    onChange={(event) => {
                      setCohort(event.target.value);
                      setPage(0);
                    }}
                  >
                    {cohorts.map((row) => (
                      <option
                        key={row.comparison_key}
                        value={row.comparison_key}
                      >
                        {cohortLabel(row.comparison_key)} · {row.participants}{" "}
                        all-time typists
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div
                role="group"
                aria-label="Ranking period"
                aria-describedby="ranking-period-description"
                className="flex flex-wrap gap-2"
              >
                {PERIODS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={
                      item.value === period
                        ? "forge-button"
                        : "forge-button-secondary"
                    }
                    aria-pressed={item.value === period}
                    onClick={() => {
                      setPeriod(item.value);
                      setPage(0);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p
                id="ranking-period-description"
                className="text-xs text-muted-foreground leading-relaxed"
              >
                {selectedPeriod.explanation} Best WPM, average input accuracy
                and accepted test count use only that period. Comparison options
                list all-time participants.
              </p>
            </section>
            {error ? (
              <section role="alert" className="panel p-7">
                <p className="text-sm">{error}</p>
                {period !== "alltime" && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Try all-time rankings or retry when this server is
                    available.
                  </p>
                )}
                <button
                  className="forge-button-secondary mt-4"
                  onClick={() => setRetry((value) => value + 1)}
                >
                  Retry
                </button>
              </section>
            ) : loading ? (
              <p className="text-muted-foreground py-14" role="status">
                Loading accepted rankings…
              </p>
            ) : !entries.length ? (
              <section className="panel p-12 text-center">
                <Crown
                  size={32}
                  className="text-primary mx-auto mb-5"
                  aria-hidden="true"
                />
                <h2 className="text-xl font-medium">A clean slate.</h2>
                <p className="text-sm text-muted-foreground mt-3 max-w-md mx-auto">
                  There are no accepted scores for this comparison{" "}
                  {period === "day"
                    ? "today"
                    : period === "week"
                      ? "this week"
                      : "yet"}
                  . Your personal tests still contribute to your progress.
                </p>
                <Link className="forge-button mt-6" to="/stats">
                  See your progress{" "}
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </section>
            ) : (
              <section className="panel overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <caption className="sr-only">
                      Rankings within the selected comparison ·{" "}
                      {selectedPeriod.label}
                    </caption>
                    <thead className="text-xs text-muted-foreground border-b">
                      <tr>
                        {[
                          "Rank",
                          "Typist",
                          "Best WPM",
                          "Average input accuracy",
                          "Accepted tests",
                        ].map((label) => (
                          <th
                            scope="col"
                            key={label}
                            className="px-6 py-4 font-normal whitespace-nowrap"
                          >
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => (
                        <tr
                          key={entry.user_id}
                          className={`border-b last:border-0 ${entry.is_own ? "bg-primary/5" : ""}`}
                        >
                          <td className="px-6 py-5 font-mono text-muted-foreground">
                            {entry.position === 1 ? (
                              <>
                                <Crown
                                  size={18}
                                  className="text-primary"
                                  aria-hidden="true"
                                />
                                <span className="sr-only">1</span>
                              </>
                            ) : (
                              entry.position
                            )}
                          </td>
                          <td className="px-6 py-5 font-medium">
                            {entry.handle}
                            {entry.is_own && (
                              <span className="ml-2 text-[10px] text-primary">
                                YOU
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-5 font-mono text-primary text-lg">
                            {metricLabel(entry.best_wpm)}
                          </td>
                          <td className="px-6 py-5 font-mono">
                            {metricLabel(entry.avg_accuracy)}%
                          </td>
                          <td className="px-6 py-5 font-mono text-muted-foreground">
                            {entry.test_count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-5 border-t flex flex-wrap gap-3 justify-between items-center text-xs text-muted-foreground">
                  <span>
                    {page * 25 + 1}–{page * 25 + entries.length} of{" "}
                    {entries[0]?.total_entries}
                  </span>
                  <div className="flex gap-2">
                    <button
                      className="forge-button-secondary"
                      disabled={!page}
                      onClick={() => setPage((value) => value - 1)}
                    >
                      Previous
                    </button>
                    <button
                      className="forge-button-secondary"
                      disabled={(page + 1) * 25 >= entries[0]?.total_entries}
                      onClick={() => setPage((value) => value + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
