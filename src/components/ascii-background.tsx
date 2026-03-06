"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";

// ============================================================================
// UTILITIES
// ============================================================================

// Loads ASCII keyframes from public folder
// Expects files named: {prefix}-kf1.txt, {prefix}-kf2.txt, etc.
async function loadAsciiFrames(basePath: string, prefix: string) {
  const frames: string[] = [];
  let index = 1;

  while (true) {
    try {
      const res = await fetch(`${basePath}/${prefix}-kf${index}.txt`);
      if (!res.ok) break;
      const text = await res.text();
      frames.push(text);
      index++;
    } catch {
      break;
    }
  }

  return frames;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AsciiBackground() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // --- Sun state ---
  const [sunFrames, setSunFrames] = useState<string[]>([]);
  const [sunFrameIndex, setSunFrameIndex] = useState(0);
  const [sunDirection, setSunDirection] = useState(1); // 1 = forward, -1 = backward (ping-pong)
  
  // --- Bird state ---
  const [birdFrames, setBirdFrames] = useState<string[]>([]);
  const [birdFrameIndex, setBirdFrameIndex] = useState(0);
  const [birdPosition, setBirdPosition] = useState(-10); // horizontal position in %
  const birdTickRef = useRef(0); // used to decouple flap speed from movement speed
  
  // --- Interval refs ---
  const sunIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const birdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // -------------------------------------------------------------------------
  // Load frames on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    setMounted(true);

    async function loadAllFrames() {
      const [sun, bird] = await Promise.all([
        loadAsciiFrames("/ascii/sun", "sun"),
        loadAsciiFrames("/ascii/bird", "bird"),
      ]);
      if (sun.length > 0) setSunFrames(sun);
      if (bird.length > 0) setBirdFrames(bird);
    }

    loadAllFrames();
  }, []);

  // -------------------------------------------------------------------------
  // Sun animation: ping-pong through keyframes
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!mounted || sunFrames.length === 0) return;

    sunIntervalRef.current = setInterval(() => {
      setSunFrameIndex((prev) => {
        const next = prev + sunDirection;
        if (next >= sunFrames.length - 1) {
          setSunDirection(-1); // reverse at end
          return sunFrames.length - 1;
        }
        if (next <= 0) {
          setSunDirection(1); // reverse at start
          return 0;
        }
        return next;
      });
    }, 400); // ms per frame

    return () => {
      if (sunIntervalRef.current) clearInterval(sunIntervalRef.current);
    };
  }, [mounted, sunFrames.length, sunDirection]);

  // -------------------------------------------------------------------------
  // Bird animation: flap + fly left-to-right
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!mounted || birdFrames.length === 0) return;

    birdIntervalRef.current = setInterval(() => {
      // Cycle through flap keyframes (vertical bob synced via birdFrameIndex)
      setBirdFrameIndex((prev) => (prev + 1) % birdFrames.length);
      
      // Move horizontally every 3rd tick (keeps horizontal speed same despite faster flapping)
      birdTickRef.current += 1;
      if (birdTickRef.current % 3 === 0) {
        setBirdPosition((prev) => {
          const next = prev + 1.5;
          if (next > 110) return -10; // loop back when off-screen
          return next;
        });
      }
    }, 100); // ms per flap (faster flapping)

    return () => {
      if (birdIntervalRef.current) clearInterval(birdIntervalRef.current);
    };
  }, [mounted, birdFrames.length]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  
  // Don't render until mounted (avoid hydration mismatch)
  if (!mounted) return null;
  
  // Only show in light mode
  if (resolvedTheme === "dark") return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      
      {/* Sun - fixed position, top right */}
      {sunFrames.length > 0 && (
        <pre className="absolute right-4 top-[5rem] font-mono text-[10px] leading-tight text-foreground/30 sm:text-xs">
          {sunFrames[sunFrameIndex]}
        </pre>
      )}
      
      {/* Bird - flies left to right, bobs vertically with flap */}
      {birdFrames.length > 0 && (
        <div
          className="absolute left-0 top-[10%] flex items-center justify-center"
          style={{ 
            transform: `translateX(${birdPosition}vw) translateY(${birdFrameIndex * 3}px)`,
            width: '8ch',
            height: '2em',
            willChange: 'transform',
          }}
        >
          <pre className="font-mono text-[10px] leading-tight text-foreground/50 sm:text-xs">
            {birdFrames[birdFrameIndex]}
          </pre>
        </div>
      )}
    </div>
  );
}
