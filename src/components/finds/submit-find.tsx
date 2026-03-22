"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, CheckCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "idle" | "sending" | "success" | "error";

function SubmitFindOverlay({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.documentElement.style.overflow = "";
      document.documentElement.style.paddingRight = "";
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/finds/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, url, note, submitterName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  const inputClass = cn(
    "w-full rounded-lg px-3 py-2 text-sm",
    "bg-white/50 dark:bg-white/5",
    "border border-border/50",
    "text-foreground placeholder:text-muted-foreground/50",
    "focus:outline-none focus:ring-2 focus:ring-foreground/20",
    "transition-colors"
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      style={{ perspective: 1200 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotateY: -90 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        exit={{ opacity: 0, scale: 0.5, rotateY: 90 }}
        className={cn(
          "relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto",
          "rounded-2xl backdrop-blur-xl",
          "bg-gradient-to-br from-white/80 via-white/60 to-white/40 dark:from-white/[0.12] dark:via-white/[0.08] dark:to-white/[0.04]",
          "shadow-[0_24px_80px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(0,0,0,0.04)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(255,255,255,0.03)]",
          "border border-white/50 dark:border-white/[0.1]"
        )}
        transition={{ type: "spring", stiffness: 150, damping: 20 }}
      >
        <motion.button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/10 dark:bg-white/10 text-foreground hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <X className="h-4 w-4" />
        </motion.button>

        <motion.div
          className="p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {status === "success" ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <CheckCircle className="h-10 w-10 text-green-500" />
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Thanks for sharing!
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  I&apos;ll review your submission and might add it to the
                  gallery.
                </p>
              </div>
              <button
                onClick={onClose}
                className={cn(
                  "mt-2 px-4 py-2 rounded-xl text-sm font-medium",
                  "bg-foreground text-background hover:bg-foreground/90 transition-colors"
                )}
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-foreground">
                Submit a find
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Found something worth sharing? Send it my way.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What did you find?"
                    required
                    className={cn(inputClass, "mt-1")}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Link
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className={cn(inputClass, "mt-1")}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Why is it worth sharing? *
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What resonated with you about this?"
                    required
                    rows={3}
                    className={cn(inputClass, "mt-1 resize-none")}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Your name
                  </label>
                  <input
                    type="text"
                    value={submitterName}
                    onChange={(e) => setSubmitterName(e.target.value)}
                    placeholder="Anonymous"
                    className={cn(inputClass, "mt-1")}
                  />
                </div>

                {status === "error" && (
                  <p className="text-sm text-red-500">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 mt-2 px-4 py-2.5 rounded-xl text-sm font-medium",
                    "bg-foreground text-background hover:bg-foreground/90 transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {status === "sending" ? (
                    "Sending..."
                  ) : (
                    <>
                      Submit
                      <Send className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

export function SubmitFindButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium",
          "border border-border/50 text-muted-foreground",
          "hover:text-foreground hover:border-border transition-colors"
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Plus className="h-3.5 w-3.5" />
        Submit a find
      </motion.button>

      <AnimatePresence>
        {open && <SubmitFindOverlay onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
