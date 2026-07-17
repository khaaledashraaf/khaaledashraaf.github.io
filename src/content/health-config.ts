// ============================================================
// Health & goal configuration
// ============================================================

export const GOAL = {
  startWeight: 89.7,   // kg, baseline
  targetWeight: 75,    // kg, healthy BMI 25 at 173 cm
  ratePerWeek: 0.5,    // kg/week (sustainable)
  milestones: [85, 80, 75],
  heightCm: 173,
  maintenanceKcal: 2500,
  proteinRange: [120, 150] as [number, number],
};

/** Cadence (days) after which a log is considered "due" — drives the alert strip. */
export const DUE_AFTER_DAYS = {
  bodyweight: 7,
  inbody: 30,
  lab: 92,
};

/** Featured InBody metrics, in display order. */
export const INBODY_METRICS: { key: string; label: string; unit: string; betterLower?: boolean }[] = [
  { key: "weight_kg", label: "Weight", unit: "kg", betterLower: true },
  { key: "skeletal_muscle_mass_kg", label: "Skeletal muscle", unit: "kg" },
  { key: "body_fat_pct", label: "Body fat", unit: "%", betterLower: true },
  { key: "body_fat_mass_kg", label: "Fat mass", unit: "kg", betterLower: true },
  { key: "visceral_fat_level", label: "Visceral fat", unit: "", betterLower: true },
  { key: "bmi", label: "BMI", unit: "", betterLower: true },
  { key: "inbody_score", label: "InBody score", unit: "" },
];

/** Featured lab markers (cardiovascular-first, given familial cholesterol). */
export const LAB_MARKERS: { key: string; label: string; unit: string; betterLower?: boolean }[] = [
  { key: "total_cholesterol", label: "Total cholesterol", unit: "mg/dL", betterLower: true },
  { key: "ldl_cholesterol", label: "LDL", unit: "mg/dL", betterLower: true },
  { key: "hdl_cholesterol", label: "HDL", unit: "mg/dL" },
  { key: "triglycerides", label: "Triglycerides", unit: "mg/dL", betterLower: true },
  { key: "non_hdl_cholesterol", label: "Non-HDL", unit: "mg/dL", betterLower: true },
  { key: "vitamin_d", label: "Vitamin D", unit: "ng/mL" },
  { key: "hba1c", label: "HbA1c", unit: "%", betterLower: true },
  { key: "tsh", label: "TSH", unit: "uIU/mL" },
];

/** Weeks to reach a target weight from current at the plan's rate. */
export function weeksTo(current: number, target: number): number {
  return Math.max(0, Math.ceil((current - target) / GOAL.ratePerWeek));
}
