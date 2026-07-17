import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase";
import { validateAuth, unauthorized } from "../../helpers";

const BUCKET = "health-reports";

// Canonical metric keys so the same test always charts on one line over time.
const METRIC_HINTS = `
InBody (category "inbody"): weight_kg, skeletal_muscle_mass_kg, body_fat_mass_kg, body_fat_pct,
bmi, visceral_fat_level, waist_hip_ratio, bmr_kcal, inbody_score, total_body_water_l,
protein_kg, minerals_kg, fat_free_mass_kg, bone_mineral_content_kg, smi, target_weight_kg.
Lab (category "lab"): total_cholesterol, ldl_cholesterol, hdl_cholesterol, triglycerides,
non_hdl_cholesterol, vldl_cholesterol, ldl_hdl_ratio, tc_hdl_ratio, vitamin_d, tsh, hba1c,
fasting_glucose, creatinine, urea, ast, alt, hemoglobin. Use snake_case; for any test not
listed, invent a sensible snake_case key.`;

async function ensureBucket(supabase: ReturnType<typeof createAdminClient>) {
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (!data) {
    await supabase.storage.createBucket(BUCKET, { public: false });
  }
}

export async function POST(request: Request) {
  if (!validateAuth(request)) return unauthorized();

  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    const type = (form.get("type") as string) || "lab"; // 'inbody' | 'lab'
    const fallbackDate = (form.get("date") as string) || new Date().toISOString().slice(0, 10);

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const bytes = Buffer.from(await file.arrayBuffer());
    const base64 = bytes.toString("base64");
    let mediaType = file.type || "";
    if (!mediaType) {
      mediaType = file.name.toLowerCase().endsWith(".pdf")
        ? "application/pdf"
        : "image/jpeg";
    }

    const supabase = createAdminClient();

    // 1) store the original file
    await ensureBucket(supabase);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${type}/${Date.now()}-${safeName}`;
    await supabase.storage.from(BUCKET).upload(filePath, bytes, {
      contentType: mediaType,
      upsert: false,
    });

    // 2) extract structured metrics with Claude vision
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const isPdf = mediaType === "application/pdf";
    const fileBlock = isPdf
      ? {
          type: "document" as const,
          source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64 },
        }
      : {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
            data: base64,
          },
        };

    const prompt = `You are extracting data from a ${type === "inbody" ? "body-composition (InBody) scan" : "medical lab report"}. Read every measurement in the document.

Return ONLY a JSON object, no prose, with this shape:
{
  "reportDate": "YYYY-MM-DD",            // the report/collection date printed on the document; if absent use "${fallbackDate}". Reports may print dates as DD/MM/YYYY — convert carefully.
  "metrics": [
    {
      "category": "${type}",
      "metric": "snake_case_key",         // canonical key (see below)
      "label": "Human Readable Name",
      "value": number,                     // numeric only, no units
      "unit": "mg/dL",                     // or "" if none
      "referenceRange": "raw text as printed, e.g. 'Less Than 100'",
      "flag": "high" | "low" | "normal"    // vs the reference range, best judgement
    }
  ],
  "summary": "1-2 plain, factual sentences noting anything outside its reference range and suggesting the user discuss flagged values with their doctor. Do NOT diagnose or recommend treatment/medication."
}

Canonical metric keys: ${METRIC_HINTS}

Extract ALL tests present (a lab panel may include lipids, CBC, thyroid, glucose, etc.). Units are metric (kg, mg/dL). Call the save_report tool with the result.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 4000,
      tools: [
        {
          name: "save_report",
          description: "Save the extracted health-report data.",
          input_schema: {
            type: "object",
            properties: {
              reportDate: { type: "string", description: "YYYY-MM-DD" },
              summary: { type: "string" },
              metrics: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string" },
                    metric: { type: "string", description: "snake_case key" },
                    label: { type: "string" },
                    value: { type: ["number", "null"] },
                    unit: { type: "string" },
                    referenceRange: { type: "string" },
                    flag: { type: "string", enum: ["high", "low", "normal"] },
                  },
                  required: ["metric", "label", "value"],
                },
              },
            },
            required: ["reportDate", "metrics", "summary"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "save_report" },
      messages: [{ role: "user", content: [fileBlock, { type: "text", text: prompt }] }],
    });

    const toolUse = message.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );
    if (!toolUse) throw new Error("Model did not return structured data");
    const parsed = toolUse.input as {
      reportDate?: string;
      summary?: string;
      metrics?: Array<{
        category?: string;
        metric: string;
        label: string;
        value: number | null;
        unit?: string;
        referenceRange?: string;
        flag?: string;
      }>;
    };

    // The user picks the date in the upload form — trust it over the model's
    // reading (printed dates on scans/labs are often blurry or ambiguous).
    const reportDate = fallbackDate;

    // 3) persist report + metrics
    const { data: report, error: reportErr } = await supabase
      .from("health_reports")
      .insert({
        type,
        report_date: reportDate,
        file_path: filePath,
        file_name: file.name,
        summary: parsed.summary ?? null,
      })
      .select()
      .single();
    if (reportErr) throw reportErr;

    const rows = (parsed.metrics ?? [])
      .filter((m) => m.metric && m.value != null && !Number.isNaN(Number(m.value)))
      .map((m) => ({
        report_id: report.id,
        category: m.category || type,
        metric: m.metric,
        label: m.label || m.metric,
        value: Number(m.value),
        unit: m.unit ?? null,
        reference_range: m.referenceRange ?? null,
        flag: m.flag ?? null,
        measured_date: reportDate,
      }));

    if (rows.length > 0) {
      const { error: metricsErr } = await supabase.from("health_metrics").insert(rows);
      if (metricsErr) throw metricsErr;
    }

    return NextResponse.json({ report, metricsCount: rows.length });
  } catch (error) {
    console.error("Health upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process report" },
      { status: 500 }
    );
  }
}

// Delete a report (cascades to its metrics) and its stored file.
export async function DELETE(request: Request) {
  if (!validateAuth(request)) return unauthorized();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const supabase = createAdminClient();
    const { data: report } = await supabase
      .from("health_reports")
      .select("file_path")
      .eq("id", id)
      .maybeSingle();
    if (report?.file_path) {
      await supabase.storage.from(BUCKET).remove([report.file_path]);
    }
    const { error } = await supabase.from("health_reports").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Health delete error:", error);
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
  }
}
