"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  WORKOUTS,
  getWorkout,
  getExercise,
  nextWorkoutId,
  repRangeLabel,
  byFloor,
  type Workout,
  type Exercise,
  type Floor,
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

type Tab = "workout" | "history" | "weight" | "health";

const PW_KEY = "training_pw";
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

// ============================================================ root
export function TrainingClient() {
  const [pw, setPw] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setPw(localStorage.getItem(PW_KEY));
    setReady(true);
  }, []);
  if (!ready) return <div className="min-h-screen bg-[#0e0f12]" />;
  if (!pw) return <Gate onAuthed={setPw} />;
  return <App pw={pw} onSignOut={() => { localStorage.removeItem(PW_KEY); setPw(null); }} />;
}

// ============================================================ gate
function Gate({ onAuthed }: { onAuthed: (pw: string) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const res = await fetch("/api/training/data", { headers: { Authorization: `Bearer ${value}` } });
    setBusy(false);
    if (res.ok) { localStorage.setItem(PW_KEY, value); onAuthed(value); }
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
function App({ pw, onSignOut }: { pw: string; onSignOut: () => void }) {
  const [tab, setTab] = useState<Tab>("workout");
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sets, setSets] = useState<SetRow[]>([]);
  const [bodyweight, setBodyweight] = useState<BodyweightRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [metrics, setMetrics] = useState<MetricRow[]>([]);

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${pw}`, "Content-Type": "application/json" }), [pw]);

  const load = useCallback(async () => {
    const res = await fetch("/api/training/data", { headers: { Authorization: `Bearer ${pw}` } });
    if (res.status === 401) return onSignOut();
    const json = await res.json();
    if (json.setupRequired) setSetupRequired(true);
    else {
      setSessions(json.sessions ?? []); setSets(json.sets ?? []); setBodyweight(json.bodyweight ?? []);
      setReports(json.reports ?? []); setMetrics(json.metrics ?? []);
    }
    setLoading(false);
  }, [pw, onSignOut]);
  useEffect(() => { load(); }, [load]);

  const ensureSession = useCallback(async (workoutId: string, date: string): Promise<string | null> => {
    const existing = sessions.find((s) => s.workout_id === workoutId && s.date === date);
    if (existing) return existing.id;
    const res = await fetch("/api/training/session", { method: "POST", headers: authHeaders, body: JSON.stringify({ workoutId, date }) });
    const json = await res.json();
    if (json.session) { setSessions((p) => [json.session, ...p]); return json.session.id; }
    return null;
  }, [sessions, authHeaders]);

  const saveSet = useCallback(async (sessionId: string, exerciseId: string, setNumber: number, weight: number | string, reps: number | string) => {
    const res = await fetch("/api/training/set", { method: "POST", headers: authHeaders, body: JSON.stringify({ sessionId, exerciseId, setNumber, weight, reps }) });
    const json = await res.json();
    if (json.set) setSets((p) => [...p.filter((s) => s.id !== json.set.id), json.set]);
  }, [authHeaders]);

  const deleteSet = useCallback(async (id: string) => {
    await fetch(`/api/training/set?id=${id}`, { method: "DELETE", headers: authHeaders });
    setSets((p) => p.filter((s) => s.id !== id));
  }, [authHeaders]);

  const deleteReport = useCallback(async (id: string) => {
    await fetch(`/api/training/health/upload?id=${id}`, { method: "DELETE", headers: authHeaders });
    setReports((p) => p.filter((r) => r.id !== id));
    setMetrics((p) => p.filter((m) => m.report_id !== id));
  }, [authHeaders]);

  const saveBodyweight = useCallback(async (date: string, weight: string) => {
    const res = await fetch("/api/training/bodyweight", { method: "POST", headers: authHeaders, body: JSON.stringify({ date, weight }) });
    const json = await res.json();
    if (json.entry) setBodyweight((p) => [...p.filter((b) => b.date !== json.entry.date), json.entry].sort((a, b) => a.date.localeCompare(b.date)));
  }, [authHeaders]);

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
      <header className="flex items-center justify-between px-5 pb-2" style={{ paddingTop: "max(1.4rem, env(safe-area-inset-top))" }}>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Training</h1>
          <p className="text-xs text-[#9aa1aa]">Recomp · full-body 3×/week</p>
        </div>
        <button onClick={onSignOut} className="text-xs text-[#9aa1aa]">Sign out</button>
      </header>

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
        ) : tab === "workout" ? (
          <WorkoutTab sessions={sessions} sets={sets} ensureSession={ensureSession} saveSet={saveSet} deleteSet={deleteSet} />
        ) : tab === "history" ? (
          <HistoryTab sessions={sessions} sets={sets} />
        ) : tab === "weight" ? (
          <WeightTab bodyweight={bodyweight} saveBodyweight={saveBodyweight} />
        ) : (
          <HealthTab reports={reports} metrics={metrics} pw={pw} onUploaded={load} onDelete={deleteReport} />
        )}
        {!loading && (
          <footer className="px-1 pb-4 pt-6 text-center text-[10px] leading-relaxed text-[#9aa1aa]/60">
            Exercise illustrations:{" "}
            <a href="https://github.com/everkinetic/data" className="underline underline-offset-2" target="_blank" rel="noreferrer">Everkinetic</a>{" "}
            (CC BY-SA 3.0) · Muscle map: react-body-highlighter (MIT)
          </footer>
        )}
      </main>

      <TabBar tab={tab} setTab={setTab} />
    </div>
  );
}

// ============================================================ tab bar
function TabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const items: { id: Tab; label: string }[] = [
    { id: "workout", label: "Workout" },
    { id: "history", label: "History" },
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

// ============================================================ WORKOUT
function WorkoutTab({ sessions, sets, ensureSession, saveSet, deleteSet }: {
  sessions: SessionRow[]; sets: SetRow[];
  ensureSession: (w: string, d: string) => Promise<string | null>;
  saveSet: (s: string, e: string, n: number, w: number | string, r: number | string) => Promise<void>;
  deleteSet: (id: string) => Promise<void>;
}) {
  const date = todayStr();
  const suggested = nextWorkoutId(sessions[0]?.workout_id);
  const [selected, setSelected] = useState<Workout["id"]>(suggested);
  const [started, setStarted] = useState(false);
  const workout = getWorkout(selected)!;
  const todaySession = sessions.find((s) => s.workout_id === selected && s.date === date);
  const alreadyLogged = todaySession && sets.some((s) => s.session_id === todaySession.id);

  // combined muscles worked this session
  const primary = useMemo(() => Array.from(new Set(workout.exercises.flatMap((e) => e.primary))) as Muscle[], [workout]);
  const secondary = useMemo(() => {
    const p = new Set(primary);
    return Array.from(new Set(workout.exercises.flatMap((e) => e.secondary))).filter((m) => !p.has(m as Muscle)) as Muscle[];
  }, [workout, primary]);

  if (started || alreadyLogged) {
    return <SessionView workout={workout} date={date} sessions={sessions} sets={sets} ensureSession={ensureSession} saveSet={saveSet} deleteSet={deleteSet} onBack={() => setStarted(false)} />;
  }

  return (
    <div className="space-y-5 py-4">
      <div className="rounded-2xl border border-white/10 bg-[#2f343b] p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#e23b30]">Today&apos;s workout</span>
          <span className="text-xs text-[#9aa1aa]">auto-selected</span>
        </div>
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
        <button onClick={() => setStarted(true)} className="w-full rounded-xl bg-[#e23b30] py-3.5 text-sm font-bold text-white">
          Start workout
        </button>
        <p className="mt-3 text-center text-[11px] text-[#9aa1aa]">6 exercises · ~30–45 min · warm up on the treadmill first</p>
      </div>

      {/* manual override of which workout */}
      <div>
        <p className="mb-2 text-center text-[11px] text-[#9aa1aa]">Not today&apos;s? Pick another:</p>
        <div className="flex gap-2">
          {WORKOUTS.map((w) => (
            <button key={w.id} onClick={() => setSelected(w.id)}
              className={`flex-1 rounded-lg border py-2 text-sm font-semibold ${selected === w.id ? "border-[#e23b30] bg-[#e23b30] text-white" : "border-white/10 text-[#9aa1aa]"}`}>
              {w.id}{suggested === w.id && <span className="ml-1 text-emerald-400">•</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ session
function SessionView({ workout, date, sessions, sets, ensureSession, saveSet, deleteSet, onBack }: {
  workout: Workout; date: string; sessions: SessionRow[]; sets: SetRow[];
  ensureSession: (w: string, d: string) => Promise<string | null>;
  saveSet: (s: string, e: string, n: number, w: number | string, r: number | string) => Promise<void>;
  deleteSet: (id: string) => Promise<void>;
  onBack: () => void;
}) {
  const [startFloor, setStartFloor] = useState<Floor>("lower");
  const [timer, setTimer] = useState<number | null>(null);
  const groups = byFloor(workout);
  const todaySession = sessions.find((s) => s.workout_id === workout.id && s.date === date);
  const priorSessions = useMemo(() => sessions.filter((s) => s.id !== todaySession?.id), [sessions, todaySession]);
  const priorSets = useMemo(() => sets.filter((s) => s.session_id !== todaySession?.id), [sets, todaySession]);

  const order: Floor[] = startFloor === "lower" ? ["lower", "upper"] : ["upper", "lower"];
  const floorMeta: Record<Floor, { label: string; icon: string }> = {
    lower: { label: "Downstairs · legs", icon: "↓" },
    upper: { label: "Upstairs · upper body", icon: "↑" },
  };

  return (
    <div className="space-y-5 py-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-xs text-[#9aa1aa]">‹ Back</button>
        <div className="text-sm font-bold">{workout.id} · {workout.name}</div>
        <span className="w-10" />
      </div>

      <div className="flex gap-2">
        {(["lower", "upper"] as Floor[]).map((f) => (
          <button key={f} onClick={() => setStartFloor(f)}
            className={`flex-1 rounded-lg border py-2 text-xs font-semibold ${startFloor === f ? "border-[#e23b30] bg-[#e23b30]/15 text-white" : "border-white/10 text-[#9aa1aa]"}`}>
            Start {floorMeta[f].icon} {f === "lower" ? "downstairs" : "upstairs"}
          </button>
        ))}
      </div>

      {order.map((floor) => (
        <div key={floor} className="space-y-3">
          <div className="flex items-center gap-2 pt-1">
            <span className="text-lg">{floorMeta[floor].icon}</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9aa1aa]">{floorMeta[floor].label}</span>
          </div>
          {groups[floor].map((ex, i) => (
            <ExerciseCard key={ex.id} exercise={ex} index={workout.exercises.indexOf(ex) + 1}
              todaySessionId={todaySession?.id ?? null}
              todaySets={sets.filter((s) => s.session_id === todaySession?.id && s.exercise_id === ex.id)}
              prescription={prescribe(ex, priorSets, priorSessions)}
              last={lastTime(ex, priorSets, priorSessions)}
              onConfirm={async (setNumber, weight, reps) => {
                const sid = todaySession?.id ?? (await ensureSession(workout.id, date));
                if (sid) await saveSet(sid, ex.id, setNumber, weight, reps);
                setTimer(90);
              }}
              onDeleteSet={deleteSet}
            />
          ))}
        </div>
      ))}

      {timer !== null && <RestTimer key={timer} seconds={timer} onClose={() => setTimer(null)} />}
    </div>
  );
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
            {exercise.sets} × {prescription.reps} <span className="text-[#e23b30]">@ {prescription.weight} kg</span>
          </span>
        </div>
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
                perSide={exercise.perSide} />
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

function SetRow({ setNumber, existing, target, onConfirm, onDelete, perSide }: {
  setNumber: number; existing?: SetRow;
  target: { weight: number; reps: number };
  onConfirm: (w: number | string, r: number | string) => void | Promise<void>;
  onDelete?: () => void; perSide?: boolean;
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
        <span className="text-xs text-[#9aa1aa]">kg ×</span>
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
          <span className="font-semibold">{existing!.weight} kg × {existing!.reps}{perSide ? " / side" : ""}</span>
        ) : (
          <span className="text-[#9aa1aa]">{target.weight} kg × {target.reps}{perSide ? " / side" : ""}</span>
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

// ============================================================ HISTORY
function HistoryTab({ sessions, sets }: { sessions: SessionRow[]; sets: SetRow[] }) {
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

  if (!sessions.length) return <div className="py-20 text-center text-sm text-[#9aa1aa]">No sessions yet.<br />Log a set in Workout to begin.</div>;

  return (
    <div className="space-y-6 py-4">
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
        <h2 className="mb-2 text-sm font-bold">Sessions</h2>
        <div className="space-y-2">{sessions.map((s) => <SessionItem key={s.id} session={s} sets={sets.filter((x) => x.session_id === s.id)} />)}</div>
      </section>
    </div>
  );
}

function SessionItem({ session, sets }: { session: SessionRow; sets: SetRow[] }) {
  const [open, setOpen] = useState(false);
  const workout = getWorkout(session.workout_id);
  const logged = sets.filter((s) => s.weight != null || s.reps != null);
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
function HealthTab({ reports, metrics, pw, onUploaded, onDelete }: { reports: ReportRow[]; metrics: MetricRow[]; pw: string; onUploaded: () => void; onDelete: (id: string) => Promise<void> }) {
  const [type, setType] = useState<"inbody" | "lab">("lab");
  const [date, setDate] = useState(todayStr());
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true); setError("");
    const fd = new FormData();
    fd.append("file", file); fd.append("type", type); fd.append("date", date);
    const res = await fetch("/api/training/health/upload", { method: "POST", headers: { Authorization: `Bearer ${pw}` }, body: fd });
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
    </div>
  );
}

// ============================================================ shared line chart (dark)
function LineChart({ points, unit, goal, milestones, compact }: {
  points: { x: string; y: number }[]; unit: string; goal?: number; milestones?: number[]; compact?: boolean;
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
      <path d={area} fill="#e23b3018" />
      <path d={path} stroke={RED} strokeWidth={1.6} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => <circle key={i} cx={cx(i)} cy={cy(p.y)} r={compact ? 1.8 : 2.5} fill="#0e0f12" stroke={RED} strokeWidth={1.4} />)}
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
