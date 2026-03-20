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
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const [notificationResult, autoReplyResult] = await Promise.all([
      resend.emails.send({
        from: "Khaled Ashraf <hi@khaledashraf.me>",
        to: "khaled@khaledashraf.me",
        replyTo: email,
        subject: `New message from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">
              New Contact Form Submission
            </h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 4px;">
              <strong>Message:</strong>
              <p style="white-space: pre-wrap; margin-top: 10px;">${message}</p>
            </div>
          </div>
        `,
      }),
      resend.emails.send({
        from: "Khaled Ashraf <hi@khaledashraf.me>",
        to: email,
        subject: "Thanks for reaching out!",
        text: `Hi ${name},\n\nThanks for your message! I've received it and will get back to you as soon as possible.\n\n— Khaled`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            <p>Hi ${name},</p>
            <p>Thanks for your message! I've received it and will get back to you as soon as possible.</p>
            <p style="margin-top: 24px;">— Khaled</p>
          </div>
        `,
      }),
    ]);

    if (notificationResult.error) {
      console.error("Notification error:", notificationResult.error);
      return NextResponse.json(
        { error: notificationResult.error.message || "Failed to send email" },
        { status: 500 }
      );
    }

    if (autoReplyResult.error) {
      console.error("Auto-reply error:", autoReplyResult.error);
    }

    console.log("Emails sent successfully:", {
      notification: notificationResult.data?.id,
      autoReply: autoReplyResult.data?.id,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}
