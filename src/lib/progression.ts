// ============================================================
// Double-progression engine
// ------------------------------------------------------------
// Prescribes the next session's weight × reps for an exercise from the actual
// logged history. Because it reads real performance, a manual override (going
// heavier / more reps than prescribed) automatically raises future targets.
// ============================================================

import type { Exercise } from "@/content/training";

export interface SetRow {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
}

export interface SessionRow {
  id: string;
  workout_id: string;
  date: string;
}

export interface Prescription {
  weight: number;
  reps: number;
  /** True when this is the very first time (no history) — seed values. */
  seed: boolean;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
function round(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Prescription for `ex` given all prior sessions/sets (exclude today's). */
export function prescribe(
  ex: Exercise,
  priorSets: SetRow[],
  sessions: SessionRow[]
): Prescription {
  const byDateDesc = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  for (const s of byDateDesc) {
    const sets = priorSets.filter(
      (x) =>
        x.session_id === s.id &&
        x.exercise_id === ex.id &&
        x.weight != null &&
        x.reps != null
    );
    if (sets.length === 0) continue;
    return progressFrom(ex, sets);
  }
  return { weight: ex.startWeight, reps: ex.repRange[0], seed: true };
}

function progressFrom(ex: Exercise, sets: SetRow[]): Prescription {
  const [min, max] = ex.repRange;
  const weights = sets.map((s) => s.weight as number);
  const workW = Math.max(...weights); // top working weight last time
  const repsAtW = sets
    .filter((s) => s.weight === workW)
    .map((s) => s.reps as number);
  const hitTop =
    repsAtW.length >= 1 &&
    repsAtW.every((r) => r >= max) &&
    sets.length >= ex.sets;

  if (hitTop) {
    return { weight: round(workW + ex.increment), reps: min, seed: false };
  }
  const worst = Math.min(...sets.map((s) => s.reps as number));
  return { weight: workW, reps: clamp(worst + 1, min, max), seed: false };
}

/** "Last time" summary line for an exercise (most recent prior session). */
export function lastTime(
  ex: Exercise,
  priorSets: SetRow[],
  sessions: SessionRow[]
): { date: string; sets: { weight: number; reps: number }[] } | null {
  const byDateDesc = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  for (const s of byDateDesc) {
    const sets = priorSets
      .filter(
        (x) =>
          x.session_id === s.id &&
          x.exercise_id === ex.id &&
          x.weight != null &&
          x.reps != null
      )
      .sort((a, b) => a.set_number - b.set_number);
    if (sets.length === 0) continue;
    return {
      date: s.date,
      sets: sets.map((x) => ({ weight: x.weight as number, reps: x.reps as number })),
    };
  }
  return null;
}
