"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const reels = [
  { src: "/reels/reel4.webm", position: "center bottom" },
  { src: "/reels/reel.webm", position: "center 75%" },
  { src: "/reels/reel2.webm", position: "center 50%" },
  { src: "/reels/reel7.webm", position: "center bottom" },
];

function releaseVideo(video: HTMLVideoElement) {
  video.pause();
  video.removeAttribute("src");
  video.load();
}

export function SeaReel() {
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(0);
  // true = A is visible, false = B is visible
  const [showA, setShowA] = useState(true);

  const activeRef = showA ? videoARef : videoBRef;
  const nextRef = showA ? videoBRef : videoARef;

  const loadAndPlay = useCallback(
    (video: HTMLVideoElement, i: number) => {
      video.src = reels[i].src;
      video.style.objectPosition = reels[i].position;
      video.load();
      video.play().catch(() => {});
    },
    [],
  );

  // Load the first video on mount
  useEffect(() => {
    const video = videoARef.current;
    if (video) loadAndPlay(video, 0);
  }, [loadAndPlay]);

  // Schedule the next transition
  useEffect(() => {
    const timer = setTimeout(() => {
      const nextIndex = (index + 1) % reels.length;
      const next = nextRef.current;
      if (next) loadAndPlay(next, nextIndex);

      // Wait a brief moment for the next video to start rendering, then crossfade
      setTimeout(() => {
        setShowA((prev) => !prev);
        setIndex(nextIndex);

        // Free the now-hidden video after the fade completes
        const prev = activeRef.current;
        if (prev) setTimeout(() => releaseVideo(prev), 1200);
      }, 200);
    }, 5000);

    return () => clearTimeout(timer);
  }, [index, showA, activeRef, nextRef, loadAndPlay]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <video
        ref={videoARef}
        muted
        playsInline
        preload="none"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
        style={{ opacity: showA ? 1 : 0 }}
      />
      <video
        ref={videoBRef}
        muted
        playsInline
        preload="none"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
        style={{ opacity: showA ? 0 : 1 }}
      />
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
}
