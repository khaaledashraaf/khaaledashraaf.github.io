import { NextResponse } from "next/server";
import { trainingPassword, AUTH_COOKIE } from "../helpers";

const ONE_YEAR = 60 * 60 * 24 * 365;

function isSecure(request: Request): boolean {
  if (request.headers.get("x-forwarded-proto") === "https") return true;
  return new URL(request.url).protocol === "https:";
}

// POST { password } — validate and set a long-lived, server-set HttpOnly
// cookie. Unlike localStorage (which iOS evicts for home-screen web apps),
// this persists, so the password only has to be typed once.
export async function POST(request: Request) {
  let password = "";
  try {
    ({ password } = await request.json());
  } catch {
    /* empty/invalid body */
  }

  const pw = trainingPassword();
  if (!pw || password !== pw) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, pw, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure(request),
    path: "/",
    maxAge: ONE_YEAR,
  });
  return res;
}

// POST to /api/training/login with { logout: true } is not used; sign-out is a
// DELETE that clears the cookie.
export async function DELETE(request: Request) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure(request),
    path: "/",
    maxAge: 0,
  });
  return res;
}
