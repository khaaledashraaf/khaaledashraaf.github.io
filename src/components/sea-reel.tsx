"use client";

import { useEffect, useRef, useState } from "react";

const reels = [
  { src: "/reels/reel4.webm", position: "center bottom" },
  { src: "/reels/reel.webm", position: "center 75%" },
  { src: "/reels/reel2.webm", position: "center 50%" },
  { src: "/reels/reel7.webm", position: "center bottom" },
];

export function SeaReel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Free previous video buffer before loading next
    video.pause();
    video.removeAttribute("src");
    video.load();

    // Set new source and position
    video.src = reels[index].src;
    video.style.objectPosition = reels[index].position;
    video.load();
    video.play().catch(() => {});

    const timer = setTimeout(() => {
      setIndex((i) => (i + 1) % reels.length);
    }, 5000);

    return () => {
      clearTimeout(timer);
      // Release buffer on cleanup
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [index]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <video
        ref={videoRef}
        muted
        playsInline
        preload="none"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
}
