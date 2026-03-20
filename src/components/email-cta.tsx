"use client";

import { useState } from "react";
import { Mail, Copy, Check } from "lucide-react";

const email = "hi@khaledashraf.me";
const subject = "Let's work together";
const body = `Hi Khaled,

I came across your portfolio and would love to connect.

`;

export function EmailCTA() {
  const [copied, setCopied] = useState(false);

  const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center h-10 rounded-lg border bg-background shadow-xs overflow-hidden">
      <a
        href={mailtoLink}
        className="flex-1 px-3 text-sm hover:underline underline-offset-2 flex items-center gap-2"
      >
        <Mail className="size-4 text-muted-foreground" />
        {email}
      </a>
      <button
        onClick={handleCopy}
        className="flex items-center justify-center px-3 h-full border-l hover:bg-muted/50 transition-colors"
        aria-label={copied ? "Copied" : "Copy email"}
      >
        {copied ? (
          <Check className="size-4 text-green-500" />
        ) : (
          <Copy className="size-4 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}
