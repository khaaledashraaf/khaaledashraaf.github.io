import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { validateAuth, unauthorized } from "../helpers";

// Upsert a single set (weight + reps) for an exercise within a session.
export async function POST(request: Request) {
  if (!validateAuth(request)) return unauthorized();

  try {
    const { sessionId, exerciseId, setNumber, weight, reps } = await request.json();
    if (!sessionId || !exerciseId || setNumber == null) {
      return NextResponse.json(
        { error: "sessionId, exerciseId and setNumber are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("set_logs")
      .upsert(
        {
          session_id: sessionId,
          exercise_id: exerciseId,
          set_number: setNumber,
          weight: weight === "" || weight == null ? null : Number(weight),
          reps: reps === "" || reps == null ? null : Number(reps),
        },
        { onConflict: "session_id,exercise_id,set_number" }
      )
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ set: data });
  } catch (error) {
    console.error("Upsert set error:", error);
    return NextResponse.json({ error: "Failed to save set" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!validateAuth(request)) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const supabase = createAdminClient();
    const { error } = await supabase.from("set_logs").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete set error:", error);
    return NextResponse.json({ error: "Failed to delete set" }, { status: 500 });
  }
}
