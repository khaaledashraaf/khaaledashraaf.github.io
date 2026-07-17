"use client";

import { exerciseImage } from "@/content/training";

// Animated Everkinetic figure: crossfades relaxation ↔ tension (the rep motion).
// Source SVGs are white-bg + dark line art, so `invert` gives dark-bg + light figure.
export function ExerciseFigure({
  exerciseId,
  className = "",
}: {
  exerciseId: string;
  className?: string;
}) {
  const img = exerciseImage(exerciseId);

  if (!img) {
    return (
      <div className={`flex items-center justify-center bg-black/60 ${className}`}>
        <span className="text-[10px] uppercase tracking-wider text-white/40">
          no illustration
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img.relaxation}
        alt=""
        className="ex-frame ex-relax absolute inset-0 m-auto h-[82%] w-[82%] object-contain"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img.tension}
        alt=""
        className="ex-frame ex-tension absolute inset-0 m-auto h-[82%] w-[82%] object-contain"
      />
    </div>
  );
}
