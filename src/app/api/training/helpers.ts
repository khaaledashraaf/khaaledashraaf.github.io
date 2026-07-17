import { NextResponse } from "next/server";

/** Password gate for the training app. Reuses the finds admin password so no
 * extra env var / Vercel config is needed; a dedicated TRAINING_PASSWORD
 * overrides it if set. */
export function trainingPassword(): string | undefined {
  return process.env.TRAINING_PASSWORD || process.env.FINDS_ADMIN_PASSWORD;
}

export function validateAuth(request: Request): boolean {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  const pw = trainingPassword();
  return !!pw && auth.slice(7) === pw;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/** Detects the "relation does not exist" error so the client can prompt the
 * user to run the setup SQL. */
export function isMissingTable(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  if (!e) return false;
  return (
    e.code === "42P01" ||
    e.code === "PGRST205" ||
    /does not exist|could not find the table|schema cache/i.test(e.message ?? "")
  );
}
