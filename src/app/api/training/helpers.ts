import { NextResponse } from "next/server";

/** Password gate for the training app. Reuses the finds admin password so no
 * extra env var / Vercel config is needed; a dedicated TRAINING_PASSWORD
 * overrides it if set. */
export function trainingPassword(): string | undefined {
  return process.env.TRAINING_PASSWORD || process.env.FINDS_ADMIN_PASSWORD;
}

export const AUTH_COOKIE = "training_auth";

/** Reads a cookie value off the raw Cookie header. */
export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

/** Accepts either a Bearer header (used by the login probe) or the persistent
 * `training_auth` cookie set after a successful login. The cookie is
 * server-set + HttpOnly so it survives iOS home-screen storage eviction, which
 * localStorage does not. */
export function validateAuth(request: Request): boolean {
  const pw = trainingPassword();
  if (!pw) return false;

  const auth = request.headers.get("Authorization");
  if (auth?.startsWith("Bearer ") && auth.slice(7) === pw) return true;

  return readCookie(request, AUTH_COOKIE) === pw;
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
