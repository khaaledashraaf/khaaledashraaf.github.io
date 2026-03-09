"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2, CheckCircle } from "lucide-react";

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setStatus("success");
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  if (status === "success") {
    return (
      <section className="w-full py-16 sm:py-24">
        <div className="mx-auto max-w-xl px-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle className="size-12 text-emerald-500" />
            <h2 className="font-mono text-lg font-semibold text-foreground">
              Message Sent!
            </h2>
            <p className="text-sm text-muted-foreground">
              Thanks for reaching out. I&apos;ll get back to you soon.
            </p>
            <Button
              variant="outline"
              onClick={() => setStatus("idle")}
              className="mt-4 font-mono"
            >
              Send Another Message
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-16 sm:py-24">
      <div className="mx-auto max-w-xl px-4">
        <div className="w-full mx-auto items-center justify-center flex flex-col gap-2 mb-10">
          <h2 className="font-mono text-md font-semibold uppercase tracking-wider text-muted-foreground">
            Get in Touch
          </h2>
          <p className="text-sm text-muted-foreground text-center">
            Have a project in mind or just want to say hi? Drop me a message.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="name"
              className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-border bg-background px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Your name"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="email"
              className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border border-border bg-background px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="message"
              className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Message
            </label>
            <textarea
              id="message"
              required
              rows={5}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full resize-none border border-border bg-background px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="What's on your mind?"
            />
          </div>

          {status === "error" && (
            <p className="font-mono text-sm text-red-500">{errorMessage}</p>
          )}

          <Button
            type="submit"
            disabled={status === "loading"}
            className="w-full font-mono"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send />
                Send Message
              </>
            )}
          </Button>
        </form>
      </div>
    </section>
  );
}
