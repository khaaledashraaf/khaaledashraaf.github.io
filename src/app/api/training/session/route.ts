import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { validateAuth, unauthorized, isMissingTable } from "../helpers";

// Get-or-create a session for a given workout + date.
export async function POST(request: Request) {
  if (!validateAuth(request)) return unauthorized();

  try {
    const { workoutId, date, note } = await request.json();
    if (!workoutId || !date) {
      return NextResponse.json({ error: "workoutId and date are required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: existing, error: findErr } = await supabase
      .from("training_sessions")
      .select("*")
      .eq("workout_id", workoutId)
      .eq("date", date)
      .maybeSingle();

    if (findErr) {
      if (isMissingTable(findErr)) return NextResponse.json({ setupRequired: true }, { status: 200 });
      throw findErr;
    }
    if (existing) return NextResponse.json({ session: existing });

    const { data: created, error: insertErr } = await supabase
      .from("training_sessions")
      .insert({ workout_id: workoutId, date, note: note ?? null })
      .select()
      .single();

    if (insertErr) throw insertErr;
    return NextResponse.json({ session: created });
  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
