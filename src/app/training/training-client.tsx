"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  WORKOUTS,
  getWorkout,
  getExercise,
  nextWorkoutId,
  repRangeLabel,
  loadSuffix,
  byFloor,
  WARMUP_TREADMILL,
  WARMUP_STRETCHES,
  type Workout,
  type Exercise,
  type Floor,
  type LoadType,
  type Muscle,
} from "@/content/training";
import {
  prescribe,
  lastTime,
  type SetRow,
  type SessionRow,
} from "@/lib/progression";
import {
  GOAL,
  TARGET_DATE,
  DUE_AFTER_DAYS,
  INBODY_METRICS,
  LAB_MARKERS,
  weeksTo,
} from "@/content/health-config";
import { MuscleMap } from "@/components/training/muscle-map";
import { ExerciseFigure } from "@/components/training/exercise-figure";

// ------------------------------------------------------------ types
interface BodyweightRow { id: string; date: string; weight: number }
interface ReportRow { id: string; type: string; report_date: string; file_name: string | null; summary: string | null }
interface MetricRow { id: string; report_id: string; category: string; metric: string; label: string; value: number | null; unit: string | null; reference_range: string | null; flag: string | null; measured_date: string }

type Tab = "home" | "workout" | "weight" | "health";

const RED = "#e23b30";

// ------------------------------------------------------------ date helpers
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtDate(s: string): string {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtMonthYear(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}
function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}
// Fake id for rows created in test mode (never touches the database).
function localId(): string {
  const c = typeof crypto !== "undefined" ? crypto : undefined;
  return `test-${c?.randomUUID ? c.randomUUID() : `${Date.now()}-${Math.round(Math.random() * 1e6)}`}`;
}
// A session is "complete" once every exercise in its workout has all its sets logged.
function isSessionComplete(session: SessionRow, allSets: SetRow[]): boolean {
  const w = getWorkout(session.workout_id);
  if (!w) return false;
  return w.exercises.every(
    (ex) => allSets.filter((s) => s.session_id === session.id && s.exercise_id === ex.id && s.weight != null && s.reps != null).length >= ex.sets
  );
}
// A session only counts toward the rotation once at least one lift was logged —
// a warm-up-only session (treadmill logged, then abandoned) mustn't use up its slot.
function hasLifts(session: SessionRow, sets: SetRow[]): boolean {
  return sets.some(
    (x) => x.session_id === session.id && x.exercise_id !== WARMUP_TREADMILL.id && x.weight != null && x.reps != null
  );
}
// The workout to offer next — mirrors WorkoutTab: resume an unfinished session,
// else advance the A→B→C rotation past the most recent *lifted* one.
function nextWorkoutToDo(sessions: SessionRow[], sets: SetRow[]): string {
  const mostRecent = sessions[0];
  // Only *today's* unfinished session is resumable — a past-day session is done,
  // finished or not; you never go back to complete yesterday's workout.
  const active =
    mostRecent && mostRecent.date === todayStr() && !isSessionComplete(mostRecent, sets)
      ? mostRecent
      : null;
  if (active) return active.workout_id;
  const counted = sessions.find((s) => hasLifts(s, sets));
  return nextWorkoutId(counted?.workout_id);
}
function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}
function fmtDM(s: string): string {
  const [, m, d] = s.split("-").map(Number);
  return `${d}/${m}`;
}
function fmtLong(s: string): string {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Per-tab page heading.
function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-0.5 text-xs text-[#9aa1aa]">{subtitle}</p>}
    </div>
  );
}

// The pixel dumbbell from the app icon, as inline SVG so it can be recolored.
function DumbbellMark({ className = "", color = "#0f1012" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 3 16 10" className={className} fill={color} role="img" aria-label="Training">
      <rect x="0" y="5" width="2" height="6" />
      <rect x="3" y="3" width="2" height="10" />
      <rect x="5" y="6" width="1" height="4" />
      <rect x="6" y="7" width="4" height="2" />
      <rect x="10" y="6" width="1" height="4" />
      <rect x="11" y="3" width="2" height="10" />
      <rect x="14" y="5" width="2" height="6" />
    </svg>
  );
}

// ============================================================ root
export function TrainingClient() {
  const [status, setStatus] = useState<"loading" | "in" | "out">("loading");
  // Auth lives in a server-set HttpOnly cookie, so we can't read it from JS —
  // we probe the API instead. 200 means the cookie is valid; 401 means log in.
  useEffect(() => {
    fetch("/api/training/data")
      .then((r) => setStatus(r.ok ? "in" : "out"))
      .catch(() => setStatus("out"));
  }, []);
  const signOut = useCallback(async () => {
    await fetch("/api/training/login", { method: "DELETE" });
    setStatus("out");
  }, []);
  if (status === "loading") return <div className="min-h-screen bg-[#0e0f12]" />;
  if (status === "out") return <Gate onAuthed={() => setStatus("in")} />;
  return <App onSignOut={signOut} />;
}

// ============================================================ gate
function Gate({ onAuthed }: { onAuthed: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const res = await fetch("/api/training/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: value }),
    });
    setBusy(false);
    if (res.ok) onAuthed();
    else setError("Wrong password");
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0e0f12] px-6 text-[#f3f5f7]">
      <form onSubmit={submit} className="w-full max-w-xs space-y-4">
        <div className="text-center">
          <div className="text-2xl font-extrabold tracking-tight">Training</div>
          <p className="mt-1 text-sm text-[#9aa1aa]">Full-body · A / B / C</p>
        </div>
        <input type="password" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Password" autoFocus
          className="w-full rounded-xl border border-white/10 bg-[#2f343b] px-4 py-3 text-base outline-none focus:border-[#e23b30]" />
        {error && <p className="text-sm text-[#e23b30]">{error}</p>}
        <button type="submit" disabled={busy || !value}
          className="w-full rounded-xl bg-[#e23b30] py-3 text-sm font-bold text-white disabled:opacity-50">
          {busy ? "Checking…" : "Enter"}
        </button>
      </form>
    </div>
  );
}

// ============================================================ app shell
function App({ onSignOut }: { onSignOut: () => void }) {
  const [tab, setTab] = useState<Tab>("home");
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sets, setSets] = useState<SetRow[]>([]);
  const [bodyweight, setBodyweight] = useState<BodyweightRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [metrics, setMetrics] = useState<MetricRow[]>([]);

  // Test mode: real data still loads (so prescriptions/history look real), but
  // every write stays in local state and never hits Supabase. Persists across
  // reloads via localStorage; also enable-able with ?debug in the URL.
  const [debug, setDebug] = useState(false);
  useEffect(() => {
    const on = localStorage.getItem("training_debug") === "1"
      || new URLSearchParams(window.location.search).has("debug");
    setDebug(on);
  }, []);
  const toggleDebug = useCallback(() => {
    setDebug((d) => {
      const n = !d;
      try { localStorage.setItem("training_debug", n ? "1" : "0"); } catch { /* ignore */ }
      return n;
    });
  }, []);

  // The auth cookie rides along automatically on same-origin requests.
  const authHeaders = useMemo(() => ({ "Content-Type": "application/json" }), []);

  const load = useCallback(async () => {
    const res = await fetch("/api/training/data");
    if (res.status === 401) return onSignOut();
    const json = await res.json();
    if (json.setupRequired) setSetupRequired(true);
    else {
      setSessions(json.sessions ?? []); setSets(json.sets ?? []); setBodyweight(json.bodyweight ?? []);
      setReports(json.reports ?? []); setMetrics(json.metrics ?? []);
    }
    setLoading(false);
  }, [onSignOut]);
  useEffect(() => { load(); }, [load]);

  const ensureSession = useCallback(async (workoutId: string, date: string): Promise<string | null> => {
    const existing = sessions.find((s) => s.workout_id === workoutId && s.date === date);
    if (existing) return existing.id;
    if (debug) {
      const session = { id: localId(), workout_id: workoutId, date };
      setSessions((p) => [session, ...p]);
      return session.id;
    }
    const res = await fetch("/api/training/session", { method: "POST", headers: authHeaders, body: JSON.stringify({ workoutId, date }) });
    const json = await res.json();
    if (json.session) { setSessions((p) => [json.session, ...p]); return json.session.id; }
    return null;
  }, [sessions, authHeaders, debug]);

  const saveSet = useCallback(async (sessionId: string, exerciseId: string, setNumber: number, weight: number | string, reps: number | string) => {
    if (debug) {
      const set = { id: localId(), session_id: sessionId, exercise_id: exerciseId, set_number: setNumber, weight: Number(weight), reps: Number(reps) };
      setSets((p) => [...p.filter((s) => !(s.session_id === sessionId && s.exercise_id === exerciseId && s.set_number === setNumber)), set]);
      return;
    }
    const res = await fetch("/api/training/set", { method: "POST", headers: authHeaders, body: JSON.stringify({ sessionId, exerciseId, setNumber, weight, reps }) });
    const json = await res.json();
    if (json.set) setSets((p) => [...p.filter((s) => s.id !== json.set.id), json.set]);
  }, [authHeaders, debug]);

  const deleteSet = useCallback(async (id: string) => {
    if (!debug) await fetch(`/api/training/set?id=${id}`, { method: "DELETE", headers: authHeaders });
    setSets((p) => p.filter((s) => s.id !== id));
  }, [authHeaders, debug]);

  const deleteReport = useCallback(async (id: string) => {
    if (!debug) await fetch(`/api/training/health/upload?id=${id}`, { method: "DELETE", headers: authHeaders });
    setReports((p) => p.filter((r) => r.id !== id));
    setMetrics((p) => p.filter((m) => m.report_id !== id));
  }, [authHeaders, debug]);

  const saveBodyweight = useCallback(async (date: string, weight: string) => {
    if (debug) {
      const entry = { id: localId(), date, weight: Number(weight) };
      setBodyweight((p) => [...p.filter((b) => b.date !== date), entry].sort((a, b) => a.date.localeCompare(b.date)));
      return;
    }
    const res = await fetch("/api/training/bodyweight", { method: "POST", headers: authHeaders, body: JSON.stringify({ date, weight }) });
    const json = await res.json();
    if (json.entry) setBodyweight((p) => [...p.filter((b) => b.date !== json.entry.date), json.entry].sort((a, b) => a.date.localeCompare(b.date)));
  }, [authHeaders, debug]);

  if (setupRequired) return <SetupScreen onRetry={() => { setSetupRequired(false); setLoading(true); load(); }} />;

  // due reminders
  const today = todayStr();
  const lastBw = bodyweight[bodyweight.length - 1]?.date;
  const lastInbody = reports.filter((r) => r.type === "inbody")[0]?.report_date;
  const lastLab = reports.filter((r) => r.type === "lab")[0]?.report_date;
  const due: { key: string; label: string; tab: Tab }[] = [];
  if (!lastBw || daysBetween(lastBw, today) >= DUE_AFTER_DAYS.bodyweight) due.push({ key: "bw", label: lastBw ? "Time to log your weight" : "Log your first weigh-in", tab: "weight" });
  if (!lastInbody || daysBetween(lastInbody, today) >= DUE_AFTER_DAYS.inbody) due.push({ key: "ib", label: "InBody scan due this month", tab: "health" });
  if (!lastLab || daysBetween(lastLab, today) >= DUE_AFTER_DAYS.lab) due.push({ key: "lab", label: "Lipid panel due (quarterly)", tab: "health" });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#0e0f12] pb-24 text-[#f3f5f7]">
      <header className="mb-2 flex items-center justify-between bg-[#e23b30] px-5 pb-3" style={{ paddingTop: "max(1.4rem, env(safe-area-inset-top))" }}>
        <DumbbellMark className="h-5 w-auto" color="#0f1012" />
        {/* test toggle kept discreet while you're still testing */}
        <button onClick={toggleDebug}
          className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${debug ? "border-white bg-white/20 text-white" : "border-white/40 text-white/70"}`}>
          {debug ? "Test on" : "Test"}
        </button>
      </header>

      {debug && (
        <div className="mx-5 mb-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-center text-[11px] font-semibold text-amber-300">
          Test mode — nothing is being saved to the database
        </div>
      )}

      {due.length > 0 && (
        <div className="space-y-1.5 px-5 pb-2">
          {due.map((d) => (
            <button key={d.key} onClick={() => setTab(d.tab)}
              className="flex w-full items-center gap-2 rounded-lg border-l-2 border-[#e23b30] bg-[#e23b30]/10 px-3 py-2 text-left text-xs">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#e23b30]" />
              <span className="flex-1">{d.label}</span>
              <span className="text-[#9aa1aa]">›</span>
            </button>
          ))}
        </div>
      )}

      <main className="flex-1 px-5">
        {loading ? (
          <div className="py-20 text-center text-sm text-[#9aa1aa]">Loading…</div>
        ) : tab === "home" ? (
          <DashboardTab sessions={sessions} sets={sets} bodyweight={bodyweight} metrics={metrics} setTab={setTab} />
        ) : tab === "workout" ? (
          <WorkoutTab sessions={sessions} sets={sets} bodyweightKg={bodyweight[bodyweight.length - 1]?.weight} ensureSession={ensureSession} saveSet={saveSet} deleteSet={deleteSet} />
        ) : tab === "weight" ? (
          <WeightTab bodyweight={bodyweight} saveBodyweight={saveBodyweight} />
        ) : (
          <HealthTab reports={reports} metrics={metrics} testMode={debug} onUploaded={load} onDelete={deleteReport} />
        )}
      </main>

      <TabBar tab={tab} setTab={setTab} />
    </div>
  );
}

// ============================================================ tab bar
function TabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const items: { id: Tab; label: string }[] = [
    { id: "home", label: "Home" },
    { id: "workout", label: "Workout" },
    { id: "weight", label: "Weight" },
    { id: "health", label: "Health" },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md border-t border-white/10 bg-[#0e0f12]/95 backdrop-blur" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {items.map((it) => (
        <button key={it.id} onClick={() => setTab(it.id)} className={`flex-1 py-3.5 text-xs font-semibold ${tab === it.id ? "text-white" : "text-[#9aa1aa]"}`}>
          {it.label}
          <span className={`mx-auto mt-1 block h-0.5 w-6 rounded-full ${tab === it.id ? "bg-[#e23b30]" : "bg-transparent"}`} />
        </button>
      ))}
    </nav>
  );
}

// ============================================================ DASHBOARD (home)
function DashboardTab({ sessions, sets, bodyweight, metrics, setTab }: {
  sessions: SessionRow[]; sets: SetRow[]; bodyweight: BodyweightRow[];
  metrics: MetricRow[]; setTab: (t: Tab) => void;
}) {
  const today = todayStr();
  const start = GOAL.startWeight;
  const target = GOAL.targetWeight;

  const latest = bodyweight[bodyweight.length - 1];
  const todayWeight = latest?.weight ?? null; // this morning's raw log (shown small)
  // 7-day rolling average — the honest "where am I" number the goal math anchors on
  const avg7 = useMemo(() => {
    if (!latest) return null;
    const cutoff = Date.parse(latest.date) - 6 * 86400000;
    const recent = bodyweight.filter((b) => Date.parse(b.date) >= cutoff);
    return recent.reduce((s, b) => s + b.weight, 0) / recent.length;
  }, [bodyweight, latest]);
  const current = avg7 ?? start;
  const toGo = Math.max(0, current - target);
  const startDate = bodyweight[0]?.date ?? today;
  // bar fill = time elapsed toward the target date
  const spanMs = Math.max(1, Date.parse(TARGET_DATE) - Date.parse(startDate));
  const datePct = (d: string) => clamp(((Date.parse(d) - Date.parse(startDate)) / spanMs) * 100, 0, 100);
  const pct = datePct(today);

  const daysLeft = Math.max(0, daysBetween(today, TARGET_DATE));
  const weeksLeft = Math.max(0, Math.round(daysLeft / 7));
  const neededPace = weeksLeft > 0 ? toGo / weeksLeft : 0; // kg/week to hit target on time

  // workouts logged in the last 7 days
  const last7 = sessions.filter((s) => { const d = daysBetween(s.date, today); return d >= 0 && d <= 6; }).length;

  // next workout in the rotation
  const nextId = nextWorkoutToDo(sessions, sets);
  const nextWorkout = getWorkout(nextId)!;

  // milestones with projected dates (converge on the target date)
  const milestones = GOAL.milestones.map((m) => ({
    m,
    done: current <= m,
    date: current > m && neededPace > 0 ? addDays(today, Math.round(((current - m) / neededPace) * 7)) : null,
  }));

  // health-marker trends (sparkline per attribute); only markers with 2+ points
  const seriesFor = (key: string) => metrics
    .filter((x) => x.metric === key && x.value != null)
    .sort((a, b) => a.measured_date.localeCompare(b.measured_date))
    .map((x) => ({ x: x.measured_date, y: x.value as number }));
  const trendGroup = (keys: string[], defs: { key: string; label: string; unit: string; betterLower?: boolean }[]) =>
    keys
      .map((k) => { const d = defs.find((x) => x.key === k); return { key: k, label: d?.label ?? k, unit: d?.unit ?? "", betterLower: d?.betterLower, series: seriesFor(k) }; })
      .filter((t) => t.series.length >= 2);
  const lipidTrends = trendGroup(
    ["total_cholesterol", "ldl_cholesterol", "hdl_cholesterol", "triglycerides", "non_hdl_cholesterol"],
    LAB_MARKERS,
  );
  const bodyTrends = trendGroup(
    ["weight_kg", "skeletal_muscle_mass_kg", "body_fat_pct", "visceral_fat_level"],
    INBODY_METRICS,
  );

  const trendCard = (t: { key: string; label: string; unit: string; betterLower?: boolean; series: { x: string; y: number }[] }) => {
    // Green when the net change is a health improvement, red when it's the wrong way.
    const delta = t.series[t.series.length - 1].y - t.series[0].y;
    const color = delta === 0 ? "#9aa1aa" : (t.betterLower ? delta < 0 : delta > 0) ? "#2fb079" : "#e23b30";
    return (
      <div key={t.key} className="rounded-xl border border-white/10 bg-[#0e0f12] p-2.5">
        <div className="mb-1 truncate text-[11px] font-semibold text-[#9aa1aa]">{t.label}</div>
        <LineChart points={t.series} unit={t.unit} compact color={color} />
      </div>
    );
  };

  return (
    <div className="space-y-5 py-4">
      <PageTitle title="Welcome back, Khaled" subtitle={fmtLong(today)} />

      {/* countdown hero */}
      <div className="rounded-2xl border border-white/10 bg-[#2f343b] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-3xl font-extrabold leading-none tabular-nums">{current.toFixed(1)}<span className="ml-1 text-base font-normal text-[#9aa1aa]">kg</span></div>
            <div className="mt-1.5 text-[11px] text-[#9aa1aa] tabular-nums">7-day avg{todayWeight != null ? ` · today ${todayWeight.toFixed(1)}` : ""}</div>
          </div>
          <div className="text-2xl font-extrabold leading-none text-[#e23b30] tabular-nums">{daysLeft}<span className="ml-1 text-sm font-normal text-[#9aa1aa]">days</span></div>
        </div>

        {/* weights above the bar: start · milestones · goal */}
        <div className="relative mb-1 mt-5 h-3 text-[11px] font-bold leading-none tabular-nums">
          <span className="absolute left-0">{start}<span className="text-[8px] font-normal text-[#9aa1aa]"> kg</span></span>
          {milestones.filter((ms) => ms.m !== target && ms.date).map((ms) => (
            <span key={ms.m} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${datePct(ms.date!)}%` }}>
              {ms.m}<span className="text-[8px] font-normal text-[#9aa1aa]"> kg</span>
            </span>
          ))}
          <span className="absolute right-0 text-[#e23b30]">{target}<span className="text-[8px] font-normal text-[#9aa1aa]"> kg</span></span>
        </div>
        <div className="relative h-2 rounded-full bg-white/10">
          <div className="absolute inset-y-0 left-0 rounded-full bg-[#e23b30]" style={{ width: `${pct}%` }} />
          {milestones.filter((ms) => ms.m !== target && ms.date).map((ms) => (
            <span key={ms.m} className="absolute top-1/2 h-2.5 w-0.5 -translate-y-1/2 rounded-full bg-white/40"
              style={{ left: `${datePct(ms.date!)}%` }} />
          ))}
        </div>
        {/* dates below the bar: start · milestones · end */}
        <div className="relative mt-2 h-3 text-[10px] text-[#9aa1aa] tabular-nums">
          <span className="absolute left-0">{fmtDM(startDate)}</span>
          {milestones.filter((ms) => ms.m !== target && ms.date).map((ms) => (
            <span key={ms.m} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${datePct(ms.date!)}%` }}>{fmtDM(ms.date!)}</span>
          ))}
          <span className="absolute right-0">{fmtDM(TARGET_DATE)}</span>
        </div>
      </div>

      {/* next workout */}
      <button onClick={() => setTab("workout")} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-[#2f343b] p-4 text-left">
        <span className="w-8 text-center text-3xl font-extrabold text-[#e23b30]">{nextWorkout.id}</span>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#9aa1aa]">Next workout</div>
          <div className="truncate text-sm font-bold">{nextWorkout.name}</div>
          <div className="truncate text-[11px] text-[#9aa1aa]">{nextWorkout.subtitle}</div>
        </div>
        <span className="shrink-0 text-lg text-[#e23b30]">›</span>
      </button>

      {/* quick stats */}
      <div className="grid grid-cols-3 gap-2">
        <Stat label="7-day avg" value={avg7 ? avg7.toFixed(1) : current.toFixed(1)} unit="kg" />
        <Stat label="Last 7 days" value={`${last7}`} unit="wk" />
        <Stat label="To goal" value={toGo.toFixed(1)} unit="kg" tone="good" />
      </div>

      {/* timeline / projection */}
      <div className="rounded-2xl border border-white/10 bg-[#2f343b] p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-bold">Timeline to {target} kg</h2>
          <span className="text-[10px] text-[#9aa1aa]">glide path · Feb 27</span>
        </div>
        <ProjectionChart bodyweight={bodyweight} />
        <div className="mt-2 flex items-center gap-4 text-[10px] text-[#9aa1aa]">
          <span className="flex items-center gap-1"><span className="h-0.5 w-4 rounded bg-[#e23b30]" /> actual</span>
          <span className="flex items-center gap-1"><span className="h-0.5 w-4 rounded bg-[#46b6ab]" /> projected</span>
        </div>
      </div>

      {/* health trends — a sparkline per marker, no numbers */}
      {lipidTrends.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#2f343b] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">Lipid profile</h2>
            <button onClick={() => setTab("health")} className="text-[10px] text-[#9aa1aa]">details ›</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {lipidTrends.map(trendCard)}
          </div>
        </div>
      )}

      {bodyTrends.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#2f343b] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">Body composition</h2>
            <button onClick={() => setTab("health")} className="text-[10px] text-[#9aa1aa]">details ›</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {bodyTrends.map(trendCard)}
          </div>
        </div>
      )}
    </div>
  );
}

// Weight glide-path: actual weigh-ins (solid) + projection to the target date (dashed).
function ProjectionChart({ bodyweight }: { bodyweight: BodyweightRow[] }) {
  const today = todayStr();
  const start = GOAL.startWeight;
  const target = GOAL.targetWeight;
  const latest = bodyweight[bodyweight.length - 1];
  const curDate = latest?.date ?? today;
  const curVal = latest?.weight ?? start;
  const startDate = bodyweight[0]?.date ?? today;

  const x0 = Date.parse(startDate);
  const x1 = Date.parse(TARGET_DATE);
  const spanX = Math.max(1, x1 - x0);

  const W = 320, H = 150, padL = 24, padR = 12, padT = 12, padB = 20;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const yVals = [start, target, curVal, ...bodyweight.map((b) => b.weight)];
  const minY = Math.min(...yVals) - 1, maxY = Math.max(...yVals) + 1, rangeY = maxY - minY || 1;
  const sx = (ms: number) => padL + clamp((ms - x0) / spanX, 0, 1) * plotW;
  const sy = (v: number) => padT + plotH - ((v - minY) / rangeY) * plotH;

  const actual = bodyweight.map((b) => ({ x: Date.parse(b.date), y: b.weight }));
  const actualPath = actual.map((p, i) => `${i === 0 ? "M" : "L"} ${sx(p.x).toFixed(1)} ${sy(p.y).toFixed(1)}`).join(" ");
  const projPath = `M ${sx(Date.parse(curDate)).toFixed(1)} ${sy(curVal).toFixed(1)} L ${sx(x1).toFixed(1)} ${sy(target).toFixed(1)}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Weight projection to target date">
      {GOAL.milestones.map((m) => (m > minY && m < maxY ? (
        <g key={m}>
          <line x1={padL} y1={sy(m)} x2={W - padR} y2={sy(m)} stroke={m === target ? RED : "#ffffff1a"} strokeWidth={m === target ? 1 : 0.5} strokeDasharray={m === target ? "4 3" : "2 3"} />
          <text x={0} y={sy(m) + 3} fontSize={9} fill={m === target ? RED : "#9aa1aa"}>{m}</text>
        </g>
      ) : null))}
      <line x1={sx(Date.parse(today))} y1={padT} x2={sx(Date.parse(today))} y2={padT + plotH} stroke="#ffffff22" strokeWidth={0.5} />
      <path d={projPath} stroke="#46b6ab" strokeWidth={1.5} strokeDasharray="5 3" fill="none" />
      <circle cx={sx(x1)} cy={sy(target)} r={3} fill="#46b6ab" />
      {actual.length > 1 && <path d={actualPath} stroke={RED} strokeWidth={1.8} fill="none" strokeLinejoin="round" strokeLinecap="round" />}
      {actual.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={2.2} fill="#0e0f12" stroke={RED} strokeWidth={1.3} />)}
      {actual.length === 0 && <circle cx={sx(Date.parse(today))} cy={sy(start)} r={2.6} fill="#0e0f12" stroke={RED} strokeWidth={1.4} />}
      <text x={padL} y={H - 5} fontSize={9} fill="#9aa1aa" textAnchor="start">{fmtDate(startDate)}</text>
      <text x={W - padR} y={H - 5} fontSize={9} fill="#9aa1aa" textAnchor="end">{fmtDate(TARGET_DATE)}</text>
    </svg>
  );
}

// ============================================================ WORKOUT
function WorkoutTab({ sessions, sets, bodyweightKg, ensureSession, saveSet, deleteSet }: {
  sessions: SessionRow[]; sets: SetRow[]; bodyweightKg?: number;
  ensureSession: (w: string, d: string) => Promise<string | null>;
  saveSet: (s: string, e: string, n: number, w: number | string, r: number | string) => Promise<void>;
  deleteSet: (id: string) => Promise<void>;
}) {
  const date = todayStr();
  // The workout to offer next: if the most recent session isn't finished yet,
  // resume it (this pins the choice so it can't flip mid-session); once it's
  // complete, advance to the next in the A→B→C rotation.
  const mostRecent = sessions[0];
  // Resume only today's unfinished session; a prior-day session is done for good.
  const activeSession =
    mostRecent && mostRecent.date === date && !isSessionComplete(mostRecent, sets)
      ? mostRecent
      : null;
  // Rotation advances past the last session that actually had lifts, so an
  // abandoned warm-up-only session doesn't skip its workout.
  const lastLifted = sessions.find((s) => hasLifts(s, sets));
  const suggested = activeSession ? activeSession.workout_id : nextWorkoutId(lastLifted?.workout_id);
  const workout = getWorkout(suggested)!;

  // Being inside a session is held in state (captured at mount for resume), so
  // completing the last set doesn't yank us out before the "done" screen shows.
  const [runId, setRunId] = useState<string | null>(activeSession ? activeSession.workout_id : null);

  // combined muscles worked this session
  const primary = useMemo(() => Array.from(new Set(workout.exercises.flatMap((e) => e.primary))) as Muscle[], [workout]);
  const secondary = useMemo(() => {
    const p = new Set(primary);
    return Array.from(new Set(workout.exercises.flatMap((e) => e.secondary))).filter((m) => !p.has(m as Muscle)) as Muscle[];
  }, [workout, primary]);

  if (runId) {
    return <SessionView workout={getWorkout(runId)!} date={date} sessions={sessions} sets={sets} bodyweightKg={bodyweightKg} ensureSession={ensureSession} saveSet={saveSet} deleteSet={deleteSet} onBack={() => setRunId(null)} />;
  }

  return (
    <div className="space-y-5 py-4">
      <PageTitle title="Workout" subtitle="Full-body · A / B / C rotation" />

      <div className="rounded-2xl border border-white/10 bg-[#2f343b] p-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#e23b30]">Today&apos;s workout</span>
        <div className="mt-1 flex items-baseline gap-3">
          <span className="text-3xl font-extrabold text-[#e23b30]">{workout.id}</span>
          <div>
            <div className="text-lg font-bold leading-tight">{workout.name}</div>
            <div className="text-xs text-[#9aa1aa]">{workout.subtitle}</div>
          </div>
        </div>
        <div className="my-4 flex justify-center">
          <MuscleMap primary={primary} secondary={secondary} width={92} />
        </div>
        <button onClick={() => setRunId(suggested)} className="w-full rounded-xl bg-[#e23b30] py-3.5 text-sm font-bold text-white">
          Start workout
        </button>
      </div>

      <HistorySection sessions={sessions} sets={sets} />
    </div>
  );
}

// ------------------------------------------------------------ session
const FLOOR_LABEL: Record<Floor, string> = {
  lower: "Lower Body",
  upper: "Upper Body",
};
// Always lower body first (leg machines are on the way in).
const FLOOR_ORDER: Floor[] = ["lower", "upper"];

function SessionView({ workout, date, sessions, sets, bodyweightKg, ensureSession, saveSet, deleteSet, onBack }: {
  workout: Workout; date: string; sessions: SessionRow[]; sets: SetRow[]; bodyweightKg?: number;
  ensureSession: (w: string, d: string) => Promise<string | null>;
  saveSet: (s: string, e: string, n: number, w: number | string, r: number | string) => Promise<void>;
  deleteSet: (id: string) => Promise<void>;
  onBack: () => void;
}) {
  const [phase, setPhase] = useState<"overview" | "warmup" | "focused" | "done">("overview");
  const [current, setCurrent] = useState(0);
  const [timer, setTimer] = useState<number | null>(null);

  const groups = byFloor(workout);
  const todaySession = sessions.find((s) => s.workout_id === workout.id && s.date === date);
  const priorSessions = useMemo(() => sessions.filter((s) => s.id !== todaySession?.id), [sessions, todaySession]);
  const priorSets = useMemo(() => sets.filter((s) => s.session_id !== todaySession?.id), [sets, todaySession]);

  // the exercises in the exact order he'll perform them (lower body first)
  const sequence = useMemo(() => FLOOR_ORDER.flatMap((f) => groups[f]), [groups]);

  const setsFor = (exId: string) => sets.filter((s) => s.session_id === todaySession?.id && s.exercise_id === exId);
  const isDone = (ex: Exercise) => setsFor(ex.id).filter((s) => s.weight != null && s.reps != null).length >= ex.sets;
  const allDone = sequence.length > 0 && sequence.every(isDone);

  // Treadmill warm-up is a pseudo-set: minutes live in `reps` under a fixed id.
  const treadmillSet = sets.find((s) => s.session_id === todaySession?.id && s.exercise_id === WARMUP_TREADMILL.id && s.reps != null);
  const treadMinutes = treadmillSet?.reps ?? null;
  const warmupDone = treadMinutes != null;

  async function logTreadmill(minutes: number) {
    const sid = todaySession?.id ?? (await ensureSession(workout.id, date));
    if (sid) await saveSet(sid, WARMUP_TREADMILL.id, 1, "", minutes);
  }

  // ---------- done: the finish / celebration screen ----------
  if (phase === "done") {
    const logged = sets.filter((s) => s.session_id === todaySession?.id && s.exercise_id !== WARMUP_TREADMILL.id && s.weight != null && s.reps != null);
    const totalSets = logged.length;
    const tread = treadMinutes ?? 10; // fall back to a nominal warm-up if unlogged
    const liftMinutes = Math.round(totalSets * 2.5);
    const estMinutes = tread + liftMinutes;
    const kg = bodyweightKg ?? GOAL.startWeight;
    // kcal = METs × kg × hours — ~4 METs brisk treadmill, ~5 METs lifting
    const calories = Math.round((kg * (4 * tread + 5 * liftMinutes)) / 60);
    const stats: { label: string; value: string }[] = [
      { label: "Sets", value: `${totalSets}` },
      { label: "Est. time", value: `~${estMinutes} min` },
      { label: "Est. calories", value: `~${calories} kcal` },
    ];
    return (
      <div className="flex min-h-[68vh] flex-col items-center justify-center gap-6 py-10 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 text-4xl text-emerald-400">✓</div>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Workout complete</h2>
          <p className="mt-1 text-sm text-[#9aa1aa]">{workout.id} · {workout.name}</p>
        </div>
        <div className="grid w-full grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-[#2f343b] p-3 text-center">
              <div className="text-base font-bold tabular-nums">{s.value}</div>
              <div className="mt-0.5 text-[11px] text-[#9aa1aa]">{s.label}</div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#9aa1aa]/70">Time & calories are rough estimates from your sets and bodyweight.</p>
        <button onClick={onBack} className="w-full rounded-xl bg-[#e23b30] py-3.5 text-sm font-bold text-white">
          Back to home
        </button>
      </div>
    );
  }

  async function logSet(ex: Exercise, setNumber: number, weight: number | string, reps: number | string) {
    const sid = todaySession?.id ?? (await ensureSession(workout.id, date));
    if (sid) await saveSet(sid, ex.id, setNumber, weight, reps);
    setTimer(90);
  }

  // ---------- warm-up: treadmill + dynamic stretches before the lifts ----------
  if (phase === "warmup") {
    return (
      <WarmupView
        minutes={treadMinutes}
        onSave={logTreadmill}
        onBack={() => setPhase("overview")}
        onStart={() => { setCurrent(0); setPhase("focused"); }}
      />
    );
  }

  // ---------- overview: the plan for today, then a Start button ----------
  if (phase === "overview") {
    // Any *set* logged counts as started — a half-finished exercise must resume
    // the lifts, not bounce back into the warm-up.
    const anyLogged = sequence.some((ex) => setsFor(ex.id).some((s) => s.weight != null && s.reps != null));
    const firstIncomplete = Math.max(0, sequence.findIndex((ex) => !isDone(ex)));
    return (
      <div className="space-y-5 py-4">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-xs text-[#9aa1aa]">‹ Back</button>
          <div className="text-sm font-bold">{workout.id} · {workout.name}</div>
          <span className="w-10" />
        </div>

        <div className="space-y-2">
          <div className="pt-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9aa1aa]">Warm-up</span>
          </div>
          <button onClick={() => setPhase("warmup")}
            className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-[#2f343b] px-3 py-2.5 text-left">
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${warmupDone ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-[#9aa1aa]"}`}>
              {warmupDone ? "✓" : "W"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">Treadmill + stretches</div>
              <div className="text-[11px] text-[#9aa1aa]">
                {warmupDone ? `${treadMinutes} min treadmill · dynamic stretches` : `~${WARMUP_TREADMILL.defaultMinutes} min treadmill · dynamic stretches`}
              </div>
            </div>
            <span className="text-lg text-[#9aa1aa]">›</span>
          </button>
        </div>

        {FLOOR_ORDER.map((floor) => (
          <div key={floor} className="space-y-2">
            <div className="pt-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9aa1aa]">{FLOOR_LABEL[floor]}</span>
            </div>
            {groups[floor].map((ex) => {
              const p = prescribe(ex, priorSets, priorSessions);
              const done = isDone(ex);
              return (
                <button key={ex.id} onClick={() => { setCurrent(sequence.indexOf(ex)); setPhase("focused"); }}
                  className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-[#2f343b] px-3 py-2.5 text-left">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${done ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-[#9aa1aa]"}`}>
                    {done ? "✓" : sequence.indexOf(ex) + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{ex.name}</div>
                    <div className="text-[11px] text-[#9aa1aa]">{ex.sets} × {p.reps} · {weightLabel(p.weight, ex.load)}{ex.supersetGroup ? " · superset" : ""}</div>
                  </div>
                  <span className="text-lg text-[#9aa1aa]">›</span>
                </button>
              );
            })}
          </div>
        ))}

        <button
          onClick={() => {
            if (allDone) setPhase("done");
            else if (!anyLogged && !warmupDone) setPhase("warmup");
            else { setCurrent(firstIncomplete); setPhase("focused"); }
          }}
          className="w-full rounded-xl bg-[#e23b30] py-3.5 text-sm font-bold text-white">
          {allDone ? "Finish workout" : anyLogged ? "Resume workout" : warmupDone ? "Start lifting" : "Start warm-up"}
        </button>
      </div>
    );
  }

  // ---------- focused: one exercise at a time, next peeking at the bottom ----------
  const ex = sequence[current];
  const prev = sequence[current - 1] ?? null;
  const next = sequence[current + 1] ?? null;
  const prevDone = prev ? isDone(prev) : false;
  const nextDone = next ? isDone(next) : false;
  const isLast = current >= sequence.length - 1;

  return (
    <div className="space-y-4 py-4 pb-28">
      <div className="flex items-center justify-between">
        <button onClick={() => setPhase("overview")} className="text-xs text-[#9aa1aa]">‹ Overview</button>
        <div className="text-xs font-semibold text-[#9aa1aa]">{current + 1} of {sequence.length}</div>
        <span className="w-16" />
      </div>

      {/* progress across the session */}
      <div className="flex gap-1">
        {sequence.map((s, i) => (
          <span key={s.id} className={`h-1 flex-1 rounded-full ${isDone(s) ? "bg-emerald-500/60" : i === current ? "bg-[#e23b30]" : "bg-white/10"}`} />
        ))}
      </div>

      <ExerciseCard exercise={ex} index={current + 1}
        todaySessionId={todaySession?.id ?? null}
        todaySets={setsFor(ex.id)}
        prescription={prescribe(ex, priorSets, priorSessions)}
        last={lastTime(ex, priorSets, priorSessions)}
        onConfirm={(setNumber, weight, reps) => logSet(ex, setNumber, weight, reps)}
        onDeleteSet={deleteSet}
      />

      {/* split prev / next bar, pinned above the tab bar; yields to the rest timer */}
      {timer === null && (
        <div className="fixed inset-x-0 bottom-16 z-40 mx-auto flex max-w-md items-stretch border-t border-white/10 bg-[#191b20]/95 backdrop-blur"
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
          {/* previous — from the first exercise it steps back into the warm-up */}
          <button
            onClick={() => (prev ? setCurrent((c) => c - 1) : setPhase("warmup"))}
            className="flex flex-1 items-center gap-2 border-r border-white/10 px-4 py-3 text-left">
            <span className="shrink-0 text-lg text-[#9aa1aa]">‹</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#9aa1aa]">
                Previous
                {(prev ? prevDone : warmupDone)
                  ? <span className="text-emerald-400">✓</span>
                  : <span className="h-1.5 w-1.5 rounded-full bg-white/25" />}
              </div>
              <div className="truncate text-sm font-semibold">{prev ? prev.name : "Warm-up"}</div>
            </div>
          </button>

          {/* next / finish */}
          <button
            onClick={() => (isLast ? setPhase("done") : setCurrent((c) => c + 1))}
            className="flex flex-1 items-center justify-end gap-2 px-4 py-3 text-right">
            {isLast ? (
              <span className="text-sm font-bold text-emerald-400">Finish workout ✓</span>
            ) : (
              <>
                <div className="min-w-0">
                  <div className="flex items-center justify-end gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#9aa1aa]">
                    {nextDone && <span className="text-emerald-400">✓</span>}
                    Up next
                  </div>
                  <div className="truncate text-sm font-semibold">{next!.name}</div>
                </div>
                <span className="shrink-0 text-lg text-[#e23b30]">›</span>
              </>
            )}
          </button>
        </div>
      )}

      {timer !== null && <RestTimer key={timer} seconds={timer} onClose={() => setTimer(null)} />}
    </div>
  );
}

// ------------------------------------------------------------ warm-up view
// Treadmill first (minutes are logged so the finish-screen estimates are real),
// then a tap-through dynamic stretch circuit. Stretch checks are session-local
// on purpose — there's nothing to learn from persisting them.
function WarmupView({ minutes, onSave, onStart, onBack }: {
  minutes: number | null;
  onSave: (m: number) => Promise<void>;
  onStart: () => void;
  onBack: () => void;
}) {
  const [value, setValue] = useState(String(minutes ?? WARMUP_TREADMILL.defaultMinutes));
  const [saving, setSaving] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const logged = minutes != null;
  const checkedCount = WARMUP_STRETCHES.filter((s) => checked[s.id]).length;

  async function save() {
    // Whole minutes only — the reps column this rides on is an integer.
    const m = Math.round(Number(value));
    if (!Number.isFinite(m) || m <= 0) return;
    setSaving(true);
    await onSave(m);
    setSaving(false);
  }

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-xs text-[#9aa1aa]">‹ Overview</button>
        <div className="text-sm font-bold">Warm-up</div>
        <span className="w-16" />
      </div>

      {/* treadmill */}
      <div className="rounded-2xl border border-white/10 bg-[#2f343b] p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wide">Treadmill</h3>
          {logged && <span className="text-[11px] font-semibold text-emerald-400">✓ {minutes} min logged</span>}
        </div>
        <p className="mt-1 text-[11px] text-[#9aa1aa]">{WARMUP_TREADMILL.cue}</p>
        <div className="mt-3 flex items-center gap-2">
          {[5, 8, 10].map((m) => (
            <button key={m} onClick={() => setValue(String(m))}
              className={`rounded-md px-2.5 py-2 text-xs font-semibold ${value === String(m) ? "bg-[#e23b30] text-white" : "bg-white/10 text-[#9aa1aa]"}`}>
              {m}m
            </button>
          ))}
          <input type="number" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-md border border-white/15 bg-[#0e0f12] px-2 py-2 text-center text-sm outline-none focus:border-[#e23b30]" />
          <span className="whitespace-nowrap text-xs text-[#9aa1aa]">min</span>
          <button onClick={save} disabled={saving || !Number(value)}
            className="rounded-md bg-[#e23b30] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
            {saving ? "…" : logged ? "Update" : "Log"}
          </button>
        </div>
      </div>

      {/* dynamic stretches */}
      <div className="rounded-2xl border border-white/10 bg-[#2f343b] p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wide">Dynamic stretches</h3>
          <span className="text-[11px] text-[#9aa1aa] tabular-nums">{checkedCount}/{WARMUP_STRETCHES.length}</span>
        </div>
        <p className="mt-1 text-[11px] text-[#9aa1aa]">Tap each as you finish — about 3 minutes. Keep them moving, no long holds.</p>
        <div className="mt-3 space-y-1.5">
          {WARMUP_STRETCHES.map((s) => {
            const on = !!checked[s.id];
            return (
              <button key={s.id} onClick={() => setChecked((c) => ({ ...c, [s.id]: !c[s.id] }))}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left ${on ? "border-emerald-500/30 bg-emerald-500/10" : "border-white/10 bg-[#0e0f12]"}`}>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${on ? "bg-emerald-500 text-[#04210f]" : "bg-white/10 text-[#9aa1aa]"}`}>
                  {on ? "✓" : ""}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`truncate text-sm font-semibold ${on ? "text-emerald-300" : ""}`}>{s.name}</span>
                    <span className="shrink-0 text-[11px] text-[#9aa1aa] tabular-nums">{s.amount}</span>
                  </div>
                  <div className="text-[11px] text-[#9aa1aa]">{s.cue}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={onStart} className="w-full rounded-xl bg-[#e23b30] py-3.5 text-sm font-bold text-white">
        Start lifting ›
      </button>
    </div>
  );
}

// Prescribed-weight label with its unit spelled out, e.g. "10 kg / side".
// Bodyweight / zero-load moves read "Bodyweight".
function weightLabel(weight: number, load: LoadType): string {
  if (load === "bodyweight" || weight <= 0) return "Bodyweight";
  const s = loadSuffix(load);
  return s ? `${weight} kg ${s}` : `${weight} kg`;
}

// Compact unit label for a logged/target set, e.g. "10 kg/side", "6 kg/hand", "BW".
function weightShort(weight: number, load: LoadType): string {
  if (load === "bodyweight" || weight <= 0) return "BW";
  if (load === "per-hand") return `${weight} kg/hand`;
  if (load === "per-side") return `${weight} kg/side`;
  return `${weight} kg`;
}

// ------------------------------------------------------------ exercise card
function ExerciseCard({ exercise, index, todaySessionId, todaySets, prescription, last, onConfirm, onDeleteSet }: {
  exercise: Exercise; index: number; todaySessionId: string | null; todaySets: SetRow[];
  prescription: { weight: number; reps: number; seed: boolean };
  last: { date: string; sets: { weight: number; reps: number }[] } | null;
  onConfirm: (setNumber: number, weight: number | string, reps: number | string) => Promise<void>;
  onDeleteSet: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const doneCount = todaySets.filter((s) => s.weight != null && s.reps != null).length;
  void todaySessionId;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#2f343b]">
      <div className="grid grid-cols-[1fr_auto] gap-3 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#9aa1aa]">{index}</span>
            <h3 className="truncate text-sm font-bold uppercase tracking-wide">{exercise.name}</h3>
          </div>
          <p className="mt-0.5 text-[11px] uppercase tracking-wide text-[#9aa1aa]">
            {exercise.target} · {exercise.sets} × {repRangeLabel(exercise.repRange)}{exercise.supersetGroup && " · superset"}
          </p>
          {exercise.buildTo && <p className="mt-1 text-[11px] text-[#46b6ab]">→ {exercise.buildTo}</p>}
          <button onClick={() => setOpen((o) => !o)} className="mt-2 text-[11px] text-[#9aa1aa] underline underline-offset-2">
            {open ? "Hide cues" : "Form cues"}
          </button>
        </div>
        <div className="flex flex-col items-center gap-1">
          <MuscleMap primary={exercise.primary} secondary={exercise.secondary} width={40} />
        </div>
      </div>

      <ExerciseFigure exerciseId={exercise.id} className="aspect-[16/10] w-full" />

      <div className="p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[11px] uppercase tracking-wide text-[#9aa1aa]">
            {prescription.seed ? "Suggested start" : "Prescribed today"}
          </span>
          <span className="text-sm font-bold">
            {exercise.sets} × {prescription.reps}{" "}
            <span className="text-[#e23b30]">
              {exercise.load === "bodyweight" || prescription.weight <= 0
                ? "Bodyweight"
                : `@ ${weightLabel(prescription.weight, exercise.load)}`}
            </span>
          </span>
        </div>
        {prescription.seed && (
          <div className="mb-2 rounded-lg border border-[#e23b30]/25 bg-[#e23b30]/5 px-3 py-2 text-[11px] leading-relaxed text-[#c9ccd1]">
            <span className="font-semibold text-[#e8a39d]">First time on this lift</span> — pick a weight you could do{" "}
            <b className="text-white">5+ more reps</b> with; it should feel easy. Stop if your form breaks — the app adds
            weight for you each session, so there&rsquo;s no rush to go heavy.
          </div>
        )}
        {last && (
          <p className="mb-2 text-[11px] text-[#9aa1aa]">
            Last ({fmtDate(last.date)}): {last.sets.map((s) => `${s.weight}×${s.reps}`).join("  ")}
          </p>
        )}
        <div className="space-y-2">
          {Array.from({ length: exercise.sets }).map((_, i) => {
            const setNumber = i + 1;
            const existing = todaySets.find((s) => s.set_number === setNumber);
            return (
              <SetRow key={setNumber} setNumber={setNumber} existing={existing}
                target={prescription}
                onConfirm={(w, r) => onConfirm(setNumber, w, r)}
                onDelete={existing ? () => onDeleteSet(existing.id) : undefined}
                load={exercise.load} perSide={exercise.perSide} />
            );
          })}
        </div>
        {doneCount > 0 && <p className="mt-2 text-[11px] text-emerald-400">{doneCount}/{exercise.sets} sets logged</p>}
      </div>

      {open && (
        <div className="space-y-2 border-t border-white/10 bg-black/20 p-4 text-xs text-[#9aa1aa]">
          <ul className="list-disc space-y-1 pl-4">{exercise.cues.map((c) => <li key={c}>{c}</li>)}</ul>
          {exercise.finisher && <p className="text-[#f3f5f7]"><b>Finisher:</b> {exercise.finisher}</p>}
        </div>
      )}
    </div>
  );
}

function SetRow({ setNumber, existing, target, onConfirm, onDelete, load, perSide }: {
  setNumber: number; existing?: SetRow;
  target: { weight: number; reps: number };
  onConfirm: (w: number | string, r: number | string) => void | Promise<void>;
  onDelete?: () => void; load: LoadType; perSide?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [w, setW] = useState(String(existing?.weight ?? target.weight));
  const [r, setR] = useState(String(existing?.reps ?? target.reps));
  const [saving, setSaving] = useState(false);
  const done = existing?.weight != null && existing?.reps != null;

  async function confirm(weight: number | string, reps: number | string) {
    setSaving(true); await onConfirm(weight, reps); setSaving(false); setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold">{setNumber}</span>
        <input type="number" inputMode="decimal" value={w} onChange={(e) => setW(e.target.value)} className="w-full rounded-md border border-white/15 bg-[#0e0f12] px-2 py-2 text-center text-sm outline-none focus:border-[#e23b30]" />
        <span className="whitespace-nowrap text-xs text-[#9aa1aa]">{load === "per-hand" ? "kg/hand" : load === "per-side" ? "kg/side" : "kg"} ×</span>
        <input type="number" inputMode="numeric" value={r} onChange={(e) => setR(e.target.value)} className="w-full rounded-md border border-white/15 bg-[#0e0f12] px-2 py-2 text-center text-sm outline-none focus:border-[#e23b30]" />
        <button onClick={() => confirm(w, r)} disabled={saving} className="rounded-md bg-[#e23b30] px-3 py-2 text-xs font-bold text-white">{saving ? "…" : "Save"}</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${done ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-[#9aa1aa]"}`}>{setNumber}</span>
      <div className="flex-1 text-sm">
        {done ? (
          <span className="font-semibold">{weightShort(existing!.weight as number, load)} × {existing!.reps}{perSide ? "/side" : ""}</span>
        ) : (
          <span className="text-[#9aa1aa]">{weightShort(target.weight, load)} × {target.reps}{perSide ? "/side" : ""}</span>
        )}
      </div>
      <button onClick={() => setEditing(true)} className="text-[11px] text-[#9aa1aa] underline underline-offset-2">edit</button>
      {done ? (
        <button onClick={onDelete} className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-sm font-black text-[#04210f]">✓</button>
      ) : (
        <button onClick={() => confirm(target.weight, target.reps)} disabled={saving}
          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white/25 text-xs">{saving ? "…" : setNumber}</button>
      )}
    </div>
  );
}

// ------------------------------------------------------------ rest timer
function RestTimer({ seconds, onClose }: { seconds: number; onClose: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const [preset, setPreset] = useState(seconds);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    ref.current = setInterval(() => {
      setRemaining((v) => {
        if (v <= 1) { if (ref.current) clearInterval(ref.current); if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(200); return 0; }
        return v - 1;
      });
    }, 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [preset]);
  const mm = Math.floor(remaining / 60), ss = String(remaining % 60).padStart(2, "0");
  return (
    <div className="fixed inset-x-0 bottom-16 z-50 mx-auto flex max-w-md items-center justify-between gap-3 border-t border-white/10 bg-[#0e0f12]/95 px-5 py-3 backdrop-blur" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
      <span className="text-lg font-bold tabular-nums">{mm}:{ss}</span>
      <div className="flex gap-1.5">
        {[60, 90, 120].map((s) => (
          <button key={s} onClick={() => { setPreset(s); setRemaining(s); }} className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${preset === s ? "bg-[#e23b30] text-white" : "bg-white/10 text-[#9aa1aa]"}`}>{s}s</button>
        ))}
      </div>
      <button onClick={onClose} className="text-xs text-[#9aa1aa]">Done</button>
    </div>
  );
}

// ============================================================ HISTORY (embedded in Workout)
function HistorySection({ sessions, sets }: { sessions: SessionRow[]; sets: SetRow[] }) {
  const withData = useMemo(() => {
    const ids = new Set(sets.map((s) => s.exercise_id));
    return WORKOUTS.flatMap((w) => w.exercises).filter((e) => ids.has(e.id));
  }, [sets]);
  const [chartEx, setChartEx] = useState("");
  useEffect(() => { if (!chartEx && withData[0]) setChartEx(withData[0].id); }, [withData, chartEx]);

  const chartData = useMemo(() => {
    if (!chartEx) return [];
    const bySession = new Map<string, { date: string; top: number }>();
    for (const s of sets) {
      if (s.exercise_id !== chartEx || s.weight == null) continue;
      const se = sessions.find((x) => x.id === s.session_id); if (!se) continue;
      const prev = bySession.get(se.id);
      if (!prev || s.weight > prev.top) bySession.set(se.id, { date: se.date, top: s.weight });
    }
    return Array.from(bySession.values()).sort((a, b) => a.date.localeCompare(b.date)).map((d) => ({ x: d.date, y: d.top }));
  }, [chartEx, sets, sessions]);

  if (!sessions.length) return null;

  return (
    <div className="space-y-5 pt-2">
      {withData.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold">Progress</h2>
          <select value={chartEx} onChange={(e) => setChartEx(e.target.value)} className="mb-3 w-full rounded-lg border border-white/10 bg-[#2f343b] px-3 py-2 text-sm outline-none">
            {withData.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <div className="rounded-2xl border border-white/10 bg-[#2f343b] p-4"><LineChart points={chartData} unit="kg" /></div>
        </section>
      )}
      <section>
        <h2 className="mb-2 text-sm font-bold">History</h2>
        <div className="space-y-2">{[...sessions].sort((a, b) => a.date.localeCompare(b.date)).map((s) => <SessionItem key={s.id} session={s} sets={sets.filter((x) => x.session_id === s.id)} />)}</div>
      </section>
    </div>
  );
}

function SessionItem({ session, sets }: { session: SessionRow; sets: SetRow[] }) {
  const [open, setOpen] = useState(false);
  const workout = getWorkout(session.workout_id);
  // The treadmill warm-up is a pseudo-set (minutes in `reps`) — pull it out so
  // it doesn't render as an exercise or inflate the exercise count.
  const treadmill = sets.find((s) => s.exercise_id === WARMUP_TREADMILL.id && s.reps != null);
  const logged = sets.filter((s) => s.exercise_id !== WARMUP_TREADMILL.id && (s.weight != null || s.reps != null));
  const grouped = useMemo(() => {
    const m = new Map<string, SetRow[]>();
    for (const s of logged) { const a = m.get(s.exercise_id) ?? []; a.push(s); m.set(s.exercise_id, a); }
    for (const a of m.values()) a.sort((x, y) => x.set_number - y.set_number);
    return m;
  }, [logged]);
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#2f343b]">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <span><span className="text-sm font-bold">{workout?.id} · {workout?.name}</span><span className="ml-2 text-xs text-[#9aa1aa]">{fmtDate(session.date)}</span></span>
        <span className="text-xs text-[#9aa1aa]">{grouped.size} ex · {logged.length} sets</span>
      </button>
      {open && (
        <div className="space-y-1.5 border-t border-white/10 px-4 py-3 text-xs">
          {treadmill && (
            <div className="flex justify-between gap-3">
              <span className="text-[#9aa1aa]">Treadmill warm-up</span>
              <span className="text-right font-semibold tabular-nums">{treadmill.reps} min</span>
            </div>
          )}
          {Array.from(grouped.entries()).map(([id, rows]) => (
            <div key={id} className="flex justify-between gap-3">
              <span className="text-[#9aa1aa]">{getExercise(id)?.name ?? id}</span>
              <span className="text-right font-semibold tabular-nums">{rows.map((r) => `${r.weight ?? "–"}×${r.reps ?? "–"}`).join("  ")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================ WEIGHT
function WeightTab({ bodyweight, saveBodyweight }: { bodyweight: BodyweightRow[]; saveBodyweight: (d: string, w: string) => Promise<void> }) {
  const today = todayStr();
  const todayEntry = bodyweight.find((b) => b.date === today);
  const [value, setValue] = useState(todayEntry ? String(todayEntry.weight) : "");
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (todayEntry) setValue(String(todayEntry.weight)); }, [todayEntry]);

  const latest = bodyweight[bodyweight.length - 1];
  const avg7 = useMemo(() => {
    if (!latest) return null;
    const cutoff = Date.parse(latest.date) - 6 * 86400000;
    const recent = bodyweight.filter((b) => Date.parse(b.date) >= cutoff);
    return recent.reduce((s, b) => s + b.weight, 0) / recent.length;
  }, [bodyweight, latest]);

  const current = latest?.weight ?? GOAL.startWeight;
  const toGo = Math.max(0, current - GOAL.targetWeight);
  const weeks = weeksTo(current, GOAL.targetWeight);
  const eta = new Date(Date.now() + weeks * 7 * 86400000);
  const pctToGoal = Math.min(100, Math.max(0, ((GOAL.startWeight - current) / (GOAL.startWeight - GOAL.targetWeight)) * 100));

  async function submit(e: React.FormEvent) { e.preventDefault(); if (!value) return; setSaving(true); await saveBodyweight(today, value); setSaving(false); }

  return (
    <div className="space-y-6 py-4">
      <PageTitle title="Weight" subtitle="Tracking toward 75 kg" />

      <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-[#2f343b] p-4">
        <label className="mb-2 block text-sm font-bold">Today&apos;s weight</label>
        <div className="flex gap-2">
          <input type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="kg"
            className="flex-1 rounded-xl border border-white/15 bg-[#0e0f12] px-3 py-2.5 text-center text-base outline-none focus:border-[#e23b30]" />
          <button type="submit" disabled={saving || !value} className="rounded-xl bg-[#e23b30] px-5 text-sm font-bold text-white disabled:opacity-50">{saving ? "…" : todayEntry ? "Update" : "Log"}</button>
        </div>
        <p className="mt-2 text-[11px] text-[#9aa1aa]">Weigh in most mornings. Judge the weekly average, not the day.</p>
      </form>

      {/* goal progress */}
      <div className="rounded-2xl border border-white/10 bg-[#2f343b] p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#9aa1aa]">Goal</span>
          <span className="text-sm"><b className="text-[#e23b30]">{toGo.toFixed(1)} kg</b> to 75</span>
        </div>
        <div className="relative my-4 h-2 rounded-full bg-white/10">
          <div className="absolute inset-y-0 left-0 rounded-full bg-[#e23b30]" style={{ width: `${pctToGoal}%` }} />
        </div>
        <div className="flex justify-between text-[11px] text-[#9aa1aa]">
          <span>start 89.7</span>
          <span>target 75 · ~{fmtMonthYear(eta)}</span>
        </div>
      </div>

      {bodyweight.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Current" value={`${current}`} unit="kg" />
            <Stat label="7-day avg" value={avg7 ? avg7.toFixed(1) : "–"} unit="kg" />
            <Stat label="To goal" value={`${toGo.toFixed(1)}`} unit="kg" tone="good" />
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#2f343b] p-4">
            <h2 className="mb-3 text-sm font-bold">Trend</h2>
            <LineChart points={bodyweight.map((b) => ({ x: b.date, y: b.weight }))} unit="kg" goal={GOAL.targetWeight} milestones={GOAL.milestones} />
          </div>
        </>
      )}
      {bodyweight.length === 0 && <p className="py-10 text-center text-sm text-[#9aa1aa]">No entries yet. Log your first weigh-in above.</p>}
    </div>
  );
}

function Stat({ label, value, unit, tone }: { label: string; value: string; unit: string; tone?: "good" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#2f343b] p-3 text-center">
      <div className={`text-lg font-bold tabular-nums ${tone === "good" ? "text-emerald-400" : "text-white"}`}>{value}<span className="ml-0.5 text-xs font-normal text-[#9aa1aa]">{unit}</span></div>
      <div className="text-[11px] text-[#9aa1aa]">{label}</div>
    </div>
  );
}

// ============================================================ HEALTH
function HealthTab({ reports, metrics, testMode, onUploaded, onDelete }: { reports: ReportRow[]; metrics: MetricRow[]; testMode: boolean; onUploaded: () => void; onDelete: (id: string) => Promise<void> }) {
  const [type, setType] = useState<"inbody" | "lab">("lab");
  const [date, setDate] = useState(todayStr());
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (testMode) {
      setError("Test mode — file wasn't uploaded or parsed.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setUploading(true); setError("");
    const fd = new FormData();
    fd.append("file", file); fd.append("type", type); fd.append("date", date);
    const res = await fetch("/api/training/health/upload", { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) { onUploaded(); if (fileRef.current) fileRef.current.value = ""; }
    else { const j = await res.json().catch(() => ({})); setError(j.error || "Upload failed"); }
  }

  const featured = type === "inbody" ? INBODY_METRICS : LAB_MARKERS;
  const latestByMetric = useMemo(() => {
    const m = new Map<string, MetricRow>();
    for (const row of metrics) { const prev = m.get(row.metric); if (!prev || row.measured_date > prev.measured_date) m.set(row.metric, row); }
    return m;
  }, [metrics]);
  const seriesFor = (key: string) => metrics.filter((x) => x.metric === key && x.value != null).sort((a, b) => a.measured_date.localeCompare(b.measured_date)).map((x) => ({ x: x.measured_date, y: x.value as number }));

  return (
    <div className="space-y-6 py-4">
      <PageTitle title="Health" subtitle="InBody & lab reports" />

      <div className="rounded-2xl border border-white/10 bg-[#2f343b] p-4">
        <div className="mb-3 flex gap-2">
          {(["lab", "inbody"] as const).map((t) => (
            <button key={t} onClick={() => setType(t)} className={`flex-1 rounded-lg border py-2 text-xs font-semibold ${type === t ? "border-[#e23b30] bg-[#e23b30]/15 text-white" : "border-white/10 text-[#9aa1aa]"}`}>
              {t === "lab" ? "Lab / lipid report" : "InBody scan"}
            </button>
          ))}
        </div>
        <label className="mb-1 block text-[11px] text-[#9aa1aa]">Date taken</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mb-3 w-full rounded-lg border border-white/15 bg-[#0e0f12] px-3 py-2 text-sm outline-none focus:border-[#e23b30]" />
        <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} className="hidden" />
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full rounded-xl bg-[#e23b30] py-3 text-sm font-bold text-white disabled:opacity-60">
          {uploading ? "Reading your report…" : "Upload photo or PDF"}
        </button>
        {error && <p className="mt-2 text-xs text-[#e23b30]">{error}</p>}
        <p className="mt-2 text-[11px] text-[#9aa1aa]">The app reads the numbers automatically. It informs vs reference ranges — it doesn&apos;t diagnose.</p>
      </div>

      {/* featured metrics */}
      {metrics.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold">{type === "inbody" ? "Body composition" : "Key markers"}</h2>
          <div className="space-y-2">
            {featured.map((f) => {
              const latest = latestByMetric.get(f.key);
              if (!latest) return null;
              const series = seriesFor(f.key);
              const flagColor = latest.flag === "high" || latest.flag === "low" ? "text-[#e23b30]" : "text-emerald-400";
              return (
                <div key={f.key} className="rounded-xl border border-white/10 bg-[#2f343b] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#9aa1aa]">{f.label}</span>
                    <span className={`text-sm font-bold tabular-nums ${flagColor}`}>{latest.value}{f.unit && <span className="ml-0.5 text-[10px] font-normal text-[#9aa1aa]">{f.unit}</span>}</span>
                  </div>
                  {latest.reference_range && <div className="text-[10px] text-[#9aa1aa]">ref: {latest.reference_range}</div>}
                  {series.length > 1 && <div className="mt-2"><LineChart points={series} unit={f.unit} compact /></div>}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* reports + insights */}
      {reports.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold">Reports</h2>
          <div className="space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="rounded-xl border border-white/10 bg-[#2f343b] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{r.type === "inbody" ? "InBody scan" : "Lab report"}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#9aa1aa]">{fmtDate(r.report_date)}</span>
                    <button onClick={() => { if (confirm("Delete this report and its metrics?")) onDelete(r.id); }} className="text-[11px] text-[#e23b30]">delete</button>
                  </div>
                </div>
                {r.summary && <p className="mt-1 text-xs text-[#9aa1aa]">{r.summary}</p>}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-[#9aa1aa]">Insights are informational and compare to standard reference ranges. Discuss anything flagged with your doctor.</p>
        </section>
      )}
      {reports.length === 0 && <p className="py-8 text-center text-sm text-[#9aa1aa]">No reports yet. Upload your InBody scan or lipid panel above.</p>}

      <Credits />
    </div>
  );
}

// Attribution for the open-source assets (Everkinetic is CC BY-SA 3.0, which
// asks for credit). Tucked at the bottom of the Health tab so it stays present
// without cluttering the workout flow.
function Credits() {
  return (
    <footer className="px-1 pb-4 pt-8 text-center text-[10px] leading-relaxed text-[#9aa1aa]/60">
      Exercise illustrations:{" "}
      <a href="https://github.com/everkinetic/data" className="underline underline-offset-2" target="_blank" rel="noreferrer">Everkinetic</a>{" "}
      (CC BY-SA 3.0) · Muscle map: react-body-highlighter (MIT)
    </footer>
  );
}

// ============================================================ shared line chart (dark)
function LineChart({ points, unit, goal, milestones, compact, color = RED }: {
  points: { x: string; y: number }[]; unit: string; goal?: number; milestones?: number[]; compact?: boolean; color?: string;
}) {
  if (points.length === 0) return <p className="py-6 text-center text-xs text-[#9aa1aa]">No data yet.</p>;
  if (points.length === 1) return <p className="py-4 text-center text-sm"><span className="text-lg font-bold">{points[0].y}</span><span className="ml-1 text-xs text-[#9aa1aa]">{unit} · need 2+ for a trend</span></p>;

  const W = 320, H = compact ? 70 : 140, padL = 28, padR = 8, padT = 10, padB = compact ? 6 : 20;
  const ys = points.map((p) => p.y).concat(goal != null ? [goal] : []);
  const minY = Math.min(...ys), maxY = Math.max(...ys), range = maxY - minY || 1;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const cx = (i: number) => padL + (i / (points.length - 1)) * plotW;
  const cy = (v: number) => padT + plotH - ((v - minY) / range) * plotH;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${cx(i).toFixed(1)} ${cy(p.y).toFixed(1)}`).join(" ");
  const area = `${path} L ${cx(points.length - 1).toFixed(1)} ${(padT + plotH).toFixed(1)} L ${cx(0).toFixed(1)} ${(padT + plotH).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="chart">
      {!compact && [minY, (minY + maxY) / 2, maxY].map((v, i) => (
        <g key={i}>
          <line x1={padL} y1={cy(v)} x2={W - padR} y2={cy(v)} stroke="#ffffff14" strokeWidth={0.5} />
          <text x={0} y={cy(v) + 3} fill="#9aa1aa" fontSize={9}>{v.toFixed(0)}</text>
        </g>
      ))}
      {goal != null && goal >= minY && goal <= maxY && (
        <g><line x1={padL} y1={cy(goal)} x2={W - padR} y2={cy(goal)} stroke={RED} strokeWidth={1} strokeDasharray="4 3" />
          <text x={W - padR} y={cy(goal) - 3} fill={RED} fontSize={9} textAnchor="end">goal {goal}</text></g>
      )}
      {milestones?.filter((m) => m > minY && m < maxY && m !== goal).map((m) => (
        <line key={m} x1={padL} y1={cy(m)} x2={W - padR} y2={cy(m)} stroke="#ffffff22" strokeWidth={0.5} strokeDasharray="2 3" />
      ))}
      <path d={area} fill={color} fillOpacity={0.09} />
      <path d={path} stroke={color} strokeWidth={1.6} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => <circle key={i} cx={cx(i)} cy={cy(p.y)} r={compact ? 1.8 : 2.5} fill="#0e0f12" stroke={color} strokeWidth={1.4} />)}
      {!compact && [0, points.length - 1].map((idx) => (
        <text key={idx} x={cx(idx)} y={H - 4} textAnchor={idx === 0 ? "start" : "end"} fill="#9aa1aa" fontSize={9}>{fmtDate(points[idx].x)}</text>
      ))}
    </svg>
  );
}

// ============================================================ setup
function SetupScreen({ onRetry }: { onRetry: () => void }) {
  const [copied, setCopied] = useState(false);
  const sql = `-- Training tracker — run in Supabase SQL editor
create table if not exists training_sessions (id uuid primary key default gen_random_uuid(), workout_id text not null, date date not null, note text, created_at timestamptz default now());
create unique index if not exists training_sessions_workout_date_idx on training_sessions (workout_id, date);
create table if not exists set_logs (id uuid primary key default gen_random_uuid(), session_id uuid references training_sessions(id) on delete cascade, exercise_id text not null, set_number int not null, weight numeric, reps int, created_at timestamptz default now(), unique (session_id, exercise_id, set_number));
create table if not exists bodyweight_logs (id uuid primary key default gen_random_uuid(), date date not null unique, weight numeric not null, created_at timestamptz default now());
create table if not exists health_reports (id uuid primary key default gen_random_uuid(), type text not null, report_date date not null, file_path text, file_name text, summary text, created_at timestamptz default now());
create table if not exists health_metrics (id uuid primary key default gen_random_uuid(), report_id uuid references health_reports(id) on delete cascade, category text not null, metric text not null, label text not null, value numeric, unit text, reference_range text, flag text, measured_date date not null, created_at timestamptz default now());
alter table training_sessions enable row level security;
alter table set_logs enable row level security;
alter table bodyweight_logs enable row level security;
alter table health_reports enable row level security;
alter table health_metrics enable row level security;`;
  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-[#0e0f12] px-5 py-10 text-[#f3f5f7]">
      <h1 className="text-xl font-extrabold">One-time setup</h1>
      <p className="mt-2 text-sm text-[#9aa1aa]">Open Supabase → SQL Editor → New query, paste this, hit Run, then tap Done.</p>
      <button onClick={() => { navigator.clipboard.writeText(sql); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="mt-4 w-full rounded-xl bg-[#e23b30] py-2.5 text-sm font-bold text-white">{copied ? "Copied ✓" : "Copy SQL"}</button>
      <pre className="mt-3 max-h-[45vh] overflow-auto rounded-xl border border-white/10 bg-[#2f343b] p-3 text-[10px] leading-relaxed">{sql}</pre>
      <button onClick={onRetry} className="mt-4 w-full rounded-xl border border-white/15 py-2.5 text-sm font-semibold">Done — reload</button>
    </div>
  );
}
