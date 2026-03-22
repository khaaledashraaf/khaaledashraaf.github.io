"use client";

import { useLoadingDone } from "@/components/loading-screen";

export default function Template({ children }: { children: React.ReactNode }) {
  const loadingDone = useLoadingDone();

  return (
    <div
      className={loadingDone ? "animate-fade-in" : "opacity-0"}
    >
      {children}
    </div>
  );
}
