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
    video.load();
    video.play().catch(() => {});

    const timer = setTimeout(() => {
      setIndex((i) => (i + 1) % reels.length);
    }, 5000);

    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <video
        ref={videoRef}
        key={index}
        muted
        playsInline
        autoPlay
        className="w-full h-full object-cover"
        style={{ objectPosition: reels[index].position }}
      >
        <source src={reels[index].src} type="video/webm" />
      </video>
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
}
