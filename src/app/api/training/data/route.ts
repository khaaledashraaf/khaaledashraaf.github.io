import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { validateAuth, unauthorized, isMissingTable } from "../helpers";

// Returns everything the client needs in one shot.
export async function GET(request: Request) {
  if (!validateAuth(request)) return unauthorized();

  try {
    const supabase = createAdminClient();

    const [sessionsRes, setsRes, bwRes, reportsRes, metricsRes] = await Promise.all([
      supabase.from("training_sessions").select("*").order("date", { ascending: false }),
      supabase.from("set_logs").select("*"),
      supabase.from("bodyweight_logs").select("*").order("date", { ascending: true }),
      supabase.from("health_reports").select("*").order("report_date", { ascending: false }),
      supabase.from("health_metrics").select("*").order("measured_date", { ascending: true }),
    ]);

    const firstErr =
      sessionsRes.error || setsRes.error || bwRes.error || reportsRes.error || metricsRes.error;
    if (firstErr) {
      if (isMissingTable(firstErr)) {
        return NextResponse.json({ setupRequired: true }, { status: 200 });
      }
      throw firstErr;
    }

    return NextResponse.json({
      sessions: sessionsRes.data ?? [],
      sets: setsRes.data ?? [],
      bodyweight: bwRes.data ?? [],
      reports: reportsRes.data ?? [],
      metrics: metricsRes.data ?? [],
    });
  } catch (error) {
    console.error("Training data error:", error);
    return NextResponse.json({ error: "Failed to load training data" }, { status: 500 });
  }
}
