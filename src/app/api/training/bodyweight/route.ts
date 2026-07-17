import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { validateAuth, unauthorized } from "../helpers";

// Upsert a bodyweight entry (one per date).
export async function POST(request: Request) {
  if (!validateAuth(request)) return unauthorized();

  try {
    const { date, weight } = await request.json();
    if (!date || weight == null || weight === "") {
      return NextResponse.json({ error: "date and weight are required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("bodyweight_logs")
      .upsert({ date, weight: Number(weight) }, { onConflict: "date" })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ entry: data });
  } catch (error) {
    console.error("Bodyweight error:", error);
    return NextResponse.json({ error: "Failed to save bodyweight" }, { status: 500 });
  }
}
