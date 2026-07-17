// ============================================================
// TRAINING — static program definition (Built With Science full-body A/B/C)
// ============================================================
// Source: Jeremy Ethier / Built With Science, "The #1 Full Body Routine to
// Build Muscle & Lose Fat (2025)". Adapted for Khaled: machine/dumbbell-led
// with a barbell on-ramp, floor-grouped for a two-floor gym (legs downstairs,
// upper body upstairs), prescribed weights/reps with double-progression.
//
// Muscle keys match react-body-highlighter so primary/secondary feed the map
// directly. Logs key to `exercise.id` — never rename an id once data exists.

import exerciseImages from "./exercise-images.json";

// react-body-highlighter muscle identifiers
export type Muscle =
  | "trapezius" | "upper-back" | "lower-back" | "chest"
  | "biceps" | "triceps" | "forearm" | "back-deltoids" | "front-deltoids"
  | "abs" | "obliques" | "adductor" | "abductors"
  | "hamstring" | "quadriceps" | "calves" | "gluteal" | "neck" | "knees";

export type Floor = "upper" | "lower"; // upstairs = upper body, downstairs = legs

export interface Exercise {
  /** Stable id — logs are keyed to this. Never change once data exists. */
  id: string;
  name: string;
  floor: Floor;
  /** Short muscle label for the card. */
  target: string;
  primary: Muscle[];
  secondary: Muscle[];
  sets: number;
  /** Inclusive rep range [min, max]. */
  repRange: [number, number];
  /** Starting working weight in kg (seed for the very first prescription). */
  startWeight: number;
  /** kg added when a lift graduates (double progression). */
  increment: number;
  /** Per-leg / per-arm rep target, shown as "× n / side". */
  perSide?: boolean;
  cues: string[];
  /** The barbell / heavier version to graduate to. */
  buildTo?: string;
  /** Extra technique note (e.g. half-rep finisher). */
  finisher?: string;
  /** Exercises sharing a group are performed back-to-back as a superset. */
  supersetGroup?: string;
}

export interface Workout {
  id: "A" | "B" | "C";
  name: string;
  subtitle: string;
  /** Suggested weekday — display hint only; the app rotates by last session. */
  day: string;
  exercises: Exercise[];
}

export const WORKOUTS: Workout[] = [
  {
    id: "A",
    name: "Chest & Squat",
    subtitle: "upper chest · legs · back · arms",
    day: "Wed",
    exercises: [
      {
        id: "a-incline-db-press",
        name: "Incline Dumbbell Press",
        floor: "upper",
        target: "Upper chest",
        primary: ["chest"],
        secondary: ["front-deltoids", "triceps"],
        sets: 3,
        repRange: [8, 12],
        startWeight: 7.5,
        increment: 2.5,
        cues: [
          "Bench at ~30°. Tuck elbows into an arrow on the way down.",
          "Press up and back toward your collarbone.",
          "Full stretch at the bottom.",
        ],
      },
      {
        id: "a-squat",
        name: "Heel-Elevated Goblet Squat",
        floor: "lower",
        target: "Quads / glutes",
        primary: ["quadriceps", "gluteal"],
        secondary: ["hamstring", "lower-back", "adductor"],
        sets: 3,
        repRange: [6, 8],
        startWeight: 12,
        increment: 2.5,
        cues: [
          "Heels on a small plate to stay upright and bias the quads.",
          "Brace your core, sit down between your hips.",
          "Drive up through mid-foot.",
        ],
        buildTo: "barbell back squat",
      },
      {
        id: "a-chest-supported-row",
        name: "Chest-Supported DB Row",
        floor: "upper",
        target: "Mid / upper back",
        primary: ["upper-back"],
        secondary: ["back-deltoids", "biceps"],
        sets: 3,
        repRange: [8, 12],
        startWeight: 12,
        increment: 2.5,
        cues: [
          "Chest down on a ~45° bench, elbows in an arrow.",
          "Squeeze shoulder blades at the top, forearms vertical.",
          "Full stretch at the bottom.",
        ],
        finisher: "Last set: 3–5 half-reps from the bottom stretch after failure.",
      },
      {
        id: "a-seated-leg-curl",
        name: "Seated Leg Curl",
        floor: "lower",
        target: "Hamstrings",
        primary: ["hamstring"],
        secondary: [],
        sets: 3,
        repRange: [8, 12],
        startWeight: 25,
        increment: 5,
        cues: [
          "Stop just short of locking out — keep tension off the calves.",
          "Squeeze hard, slow negative.",
        ],
      },
      {
        id: "a-incline-db-curl",
        name: "Incline Dumbbell Curl",
        floor: "upper",
        target: "Biceps",
        primary: ["biceps"],
        secondary: ["forearm"],
        sets: 3,
        repRange: [8, 12],
        startWeight: 10,
        increment: 2.5,
        cues: ["Elbows back and pinned.", "Full stretch at the bottom."],
        supersetGroup: "a-arms",
      },
      {
        id: "a-overhead-triceps-ext",
        name: "Overhead DB Extension",
        floor: "upper",
        target: "Triceps",
        primary: ["triceps"],
        secondary: [],
        sets: 3,
        repRange: [8, 12],
        startWeight: 10,
        increment: 2.5,
        cues: ["Elbows high and still.", "Deep stretch behind the head."],
        supersetGroup: "a-arms",
      },
    ],
  },
  {
    id: "B",
    name: "Bench & Hinge",
    subtitle: "chest · hamstrings · back · delts",
    day: "Fri",
    exercises: [
      {
        id: "b-flat-db-press",
        name: "Flat Dumbbell Press",
        floor: "upper",
        target: "Chest",
        primary: ["chest"],
        secondary: ["front-deltoids", "triceps"],
        sets: 3,
        repRange: [8, 12],
        startWeight: 12,
        increment: 2.5,
        cues: ["Shoulder blades pinned back and down.", "Control the negative."],
        buildTo: "barbell bench press (4–6 reps)",
      },
      {
        id: "b-rdl",
        name: "Dumbbell Romanian Deadlift",
        floor: "lower",
        target: "Hamstrings / glutes",
        primary: ["hamstring", "gluteal"],
        secondary: ["lower-back"],
        sets: 3,
        repRange: [6, 8],
        startWeight: 14,
        increment: 2.5,
        cues: [
          "Soft knees, push hips back, bar/dumbbells close to legs.",
          "Feel the hamstring stretch, then drive hips forward.",
          "Stop when hips can't push back further — don't round.",
        ],
        buildTo: "barbell RDL",
      },
      {
        id: "b-lat-pulldown",
        name: "Lat Pulldown",
        floor: "upper",
        target: "Lats / upper back",
        primary: ["upper-back"],
        secondary: ["biceps", "back-deltoids"],
        sets: 3,
        repRange: [8, 12],
        startWeight: 40,
        increment: 5,
        cues: ["Wide grip, lean back slightly.", "Drive elbows down to the ribs."],
        finisher: "Last set: 3–5 half-reps from the stretch after failure.",
      },
      {
        id: "b-walking-lunges",
        name: "Walking Lunges",
        floor: "lower",
        target: "Glutes / quads",
        primary: ["gluteal", "quadriceps"],
        secondary: ["hamstring"],
        sets: 3,
        repRange: [8, 10],
        startWeight: 10,
        increment: 2.5,
        perSide: true,
        cues: [
          "Wide step, torso leaned slightly forward for the glutes.",
          "Back knee hovers just above the floor.",
        ],
      },
      {
        id: "b-lateral-raise",
        name: "Cable Lateral Raise",
        floor: "upper",
        target: "Side delts",
        primary: ["front-deltoids", "back-deltoids"],
        secondary: ["trapezius"],
        sets: 3,
        repRange: [12, 15],
        startWeight: 7,
        increment: 2,
        cues: ["Lead with the elbow.", "Slow and strict — no swinging."],
        supersetGroup: "b-delts-abs",
      },
      {
        id: "b-reverse-crunch",
        name: "Reverse Crunch",
        floor: "upper",
        target: "Abs",
        primary: ["abs"],
        secondary: ["obliques"],
        sets: 3,
        repRange: [10, 15],
        startWeight: 0,
        increment: 0,
        cues: ["Curl the pelvis, knees toward chest.", "Slow, controlled descent."],
        supersetGroup: "b-delts-abs",
      },
    ],
  },
  {
    id: "C",
    name: "Shoulders & Glutes",
    subtitle: "delts · lats · glutes · quads · detail",
    day: "Sun",
    exercises: [
      {
        id: "c-db-shoulder-press",
        name: "Seated DB Shoulder Press",
        floor: "upper",
        target: "Front delts",
        primary: ["front-deltoids"],
        secondary: ["triceps", "trapezius"],
        sets: 3,
        repRange: [8, 12],
        startWeight: 12,
        increment: 2.5,
        cues: [
          "Bench 1–2 notches back from upright.",
          "Elbows flare out as you press, tuck in front as you lower.",
        ],
      },
      {
        id: "c-one-arm-row",
        name: "One-Arm Dumbbell Row",
        floor: "upper",
        target: "Lats",
        primary: ["upper-back"],
        secondary: ["biceps", "back-deltoids"],
        sets: 3,
        repRange: [8, 12],
        startWeight: 16,
        increment: 2.5,
        cues: [
          "Elbow tight to your side, drive it back toward your hip.",
          "Forearm vertical — don't curl the weight. Don't rotate the torso.",
        ],
        finisher: "Last set: 3–5 half-reps from the stretch after failure.",
      },
      {
        id: "c-hip-thrust",
        name: "Hip Thrust",
        floor: "lower",
        target: "Glutes",
        primary: ["gluteal"],
        secondary: ["hamstring"],
        sets: 3,
        repRange: [10, 15],
        startWeight: 30,
        increment: 5,
        cues: [
          "Brace the core, squeeze the glutes hard at the top.",
          "Flat back at the top — don't arch the lower back.",
        ],
        buildTo: "swap for DB step-ups if the setup is a hassle",
      },
      {
        id: "c-leg-extension",
        name: "Leg Extension",
        floor: "lower",
        target: "Quads",
        primary: ["quadriceps"],
        secondary: [],
        sets: 3,
        repRange: [10, 15],
        startWeight: 30,
        increment: 5,
        cues: ["Lean back to bias the rectus femoris.", "Pause and squeeze at the top."],
      },
      {
        id: "c-cable-fly",
        name: "Seated Cable Fly",
        floor: "upper",
        target: "Chest",
        primary: ["chest"],
        secondary: ["front-deltoids"],
        sets: 3,
        repRange: [10, 15],
        startWeight: 10,
        increment: 2.5,
        cues: ["Slight pad behind the back for a deeper stretch.", "Squeeze at the midline."],
        finisher: "Last set: 3–5 half-reps from the stretch after failure.",
      },
      {
        id: "c-calf-raise",
        name: "Standing Calf Raise",
        floor: "lower",
        target: "Calves",
        primary: ["calves"],
        secondary: [],
        sets: 3,
        repRange: [10, 15],
        startWeight: 40,
        increment: 5,
        cues: ["Pause at the bottom for a deep stretch.", "Full range, no bouncing."],
        supersetGroup: "c-calves-reardelts",
      },
      {
        id: "c-reverse-fly",
        name: "Reverse Cable Fly",
        floor: "upper",
        target: "Rear delts",
        primary: ["back-deltoids"],
        secondary: ["upper-back", "trapezius"],
        sets: 3,
        repRange: [12, 15],
        startWeight: 7,
        increment: 2,
        cues: ["Cables crossed, sweep the arms outward.", "Let the arms cross at the start for a stretch."],
        supersetGroup: "c-calves-reardelts",
      },
    ],
  },
];

export const WORKOUT_ORDER: Array<Workout["id"]> = ["A", "B", "C"];

export function getWorkout(id: string): Workout | undefined {
  return WORKOUTS.find((w) => w.id === id);
}

export function getExercise(id: string): Exercise | undefined {
  for (const w of WORKOUTS) {
    const ex = w.exercises.find((e) => e.id === id);
    if (ex) return ex;
  }
  return undefined;
}

/** A→B→C→A rotation based on the last completed workout (weekday-agnostic). */
export function nextWorkoutId(lastId?: string | null): Workout["id"] {
  if (!lastId) return "A";
  const i = WORKOUT_ORDER.indexOf(lastId as Workout["id"]);
  if (i === -1) return "A";
  return WORKOUT_ORDER[(i + 1) % WORKOUT_ORDER.length];
}

export function repRangeLabel(range: [number, number]): string {
  return range[0] === range[1] ? `${range[0]}` : `${range[0]}–${range[1]}`;
}

/** Group a workout's exercises by floor, preserving order within each floor. */
export function byFloor(workout: Workout): Record<Floor, Exercise[]> {
  return {
    upper: workout.exercises.filter((e) => e.floor === "upper"),
    lower: workout.exercises.filter((e) => e.floor === "lower"),
  };
}

/** Resolve an exercise's Everkinetic illustration URLs, or null if none exists. */
export function exerciseImage(
  id: string
): { relaxation: string; tension: string } | null {
  const map = exerciseImages as Record<
    string,
    { everkineticId?: string; hasImage: boolean }
  >;
  const e = map[id];
  if (!e || !e.hasImage || !e.everkineticId) return null;
  return {
    relaxation: `/exercises/${e.everkineticId}-relaxation.svg`,
    tension: `/exercises/${e.everkineticId}-tension.svg`,
  };
}
