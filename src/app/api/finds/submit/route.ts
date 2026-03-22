import { Resend } from "resend";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);
    const { title, url, note, submitterName } = await request.json();

    if (!title || !note) {
      return NextResponse.json(
        { error: "Title and note are required" },
        { status: 400 }
      );
    }

    const result = await resend.emails.send({
      from: "Khaled Ashraf <hi@khaledashraf.me>",
      to: "khaled@khaledashraf.me",
      subject: `New find submission: ${title}`,
      text: `Title: ${title}\nURL: ${url || "N/A"}\nSubmitted by: ${submitterName || "Anonymous"}\n\nNote:\n${note}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">
            New Find Submission
          </h2>
          <p><strong>Title:</strong> ${title}</p>
          ${url ? `<p><strong>URL:</strong> <a href="${url}">${url}</a></p>` : ""}
          <p><strong>Submitted by:</strong> ${submitterName || "Anonymous"}</p>
          <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 4px;">
            <strong>Note:</strong>
            <p style="white-space: pre-wrap; margin-top: 10px;">${note}</p>
          </div>
        </div>
      `,
    });

    if (result.error) {
      console.error("Find submission error:", result.error);
      return NextResponse.json(
        { error: result.error.message || "Failed to send submission" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Find submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit. Please try again." },
      { status: 500 }
    );
  }
}
