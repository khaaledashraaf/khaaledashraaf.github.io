"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, useRef, useMemo } from "react";

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

// Generates random star positions (seeded for consistency)
function generateStars(count: number) {
  const stars: { x: number; y: number; char: string; delay: number }[] = [];
  const chars = ["*", ".", "+", "·"];
  
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * 100,
      y: Math.random() * 60, // keep stars in upper 60% of screen
      char: chars[Math.floor(Math.random() * chars.length)],
      delay: Math.random() * 3, // random twinkle delay 0-3s
    });
  }
  
  return stars;
}

// Generates cloud data with varied positions and speeds
function generateClouds(count: number) {
  const clouds: { id: number; y: number; speed: number; scale: number; opacity: number }[] = [];
  
  for (let i = 0; i < count; i++) {
    clouds.push({
      id: i,
      y: 30 + Math.random() * 40, // vertical position 10-50% from top
      speed: 0.08 + Math.random() * 0.08, // slower speeds (0.08-0.16)
      scale: 0.6 + Math.random() * 0.3, // smaller sizes (0.5-0.8)
      opacity: 0.5 + Math.random() * 0.7, // varied opacity (0.15-0.3)
    });
  }
  
  return clouds;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AsciiBackground() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // --- Sun state (light mode) ---
  const [sunFrames, setSunFrames] = useState<string[]>([]);
  const [sunFrameIndex, setSunFrameIndex] = useState(0);
  const [sunDirection, setSunDirection] = useState(1); // 1 = forward, -1 = backward (ping-pong)
  
  // --- Bird state (light mode) ---
  const [birdFrames, setBirdFrames] = useState<string[]>([]);
  const [birdFrameIndex, setBirdFrameIndex] = useState(0);
  const [birdPosition, setBirdPosition] = useState(-10); // horizontal position in %
  const birdTickRef = useRef(0); // used to decouple flap speed from movement speed
  
  // --- Cloud state (light mode) ---
  const [cloudFrames, setCloudFrames] = useState<string[]>([]);
  const cloudData = useMemo(() => generateClouds(3), []);
  const [cloudPositions, setCloudPositions] = useState<number[]>(() => 
    // Stagger initial positions across the screen
    [20, 60, 110]
  );
  
  // --- Moon state (dark mode) ---
  const [moonFrames, setMoonFrames] = useState<string[]>([]);
  const [moonFrameIndex, setMoonFrameIndex] = useState(0);
  const [moonDirection, setMoonDirection] = useState(1);
  
  // --- Stars (dark mode) ---
  const stars = useMemo(() => generateStars(25), []);
  
  // --- Parallax state ---
  const [scrollY, setScrollY] = useState(0);
  
  // --- Cursor glow state (dark mode) ---
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMouseInWindow, setIsMouseInWindow] = useState(false);
  
  // --- Interval refs ---
  const sunIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const birdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const moonIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cloudIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // -------------------------------------------------------------------------
  // Load frames on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    setMounted(true);

    async function loadAllFrames() {
      const [sun, bird, moon, cloud] = await Promise.all([
        loadAsciiFrames("/ascii/sun", "sun"),
        loadAsciiFrames("/ascii/bird", "bird"),
        loadAsciiFrames("/ascii/moon", "moon"),
        loadAsciiFrames("/ascii/cloud", "cloud"),
      ]);
      if (sun.length > 0) setSunFrames(sun);
      if (bird.length > 0) setBirdFrames(bird);
      if (moon.length > 0) setMoonFrames(moon);
      if (cloud.length > 0) setCloudFrames(cloud);
    }

    loadAllFrames();
  }, []);

  // -------------------------------------------------------------------------
  // Parallax scroll listener
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!mounted) return;

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mounted]);

  // -------------------------------------------------------------------------
  // Cursor glow tracker (dark mode only)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!mounted) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setIsMouseInWindow(true);
    };

    const handleMouseLeave = () => {
      setIsMouseInWindow(false);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [mounted]);

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
  // Bird animation: flap + fly left-to-right (light mode)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!mounted || birdFrames.length === 0 || resolvedTheme === "dark") return;

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
  }, [mounted, birdFrames.length, resolvedTheme]);

  // -------------------------------------------------------------------------
  // Cloud animation: drift right-to-left slowly (light mode)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!mounted || cloudFrames.length === 0 || resolvedTheme === "dark") return;

    cloudIntervalRef.current = setInterval(() => {
      setCloudPositions((prev) =>
        prev.map((pos, i) => {
          const speed = cloudData[i].speed;
          const next = pos - speed;
          // Reset to right side when off-screen left
          if (next < -30) return 120 + Math.random() * 20;
          return next;
        })
      );
    }, 100);

    return () => {
      if (cloudIntervalRef.current) clearInterval(cloudIntervalRef.current);
    };
  }, [mounted, cloudFrames.length, resolvedTheme, cloudData]);

  // -------------------------------------------------------------------------
  // Moon animation: ping-pong through keyframes (dark mode)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!mounted || moonFrames.length === 0 || resolvedTheme !== "dark") return;

    moonIntervalRef.current = setInterval(() => {
      setMoonFrameIndex((prev) => {
        const next = prev + moonDirection;
        if (next >= moonFrames.length - 1) {
          setMoonDirection(-1);
          return moonFrames.length - 1;
        }
        if (next <= 0) {
          setMoonDirection(1);
          return 0;
        }
        return next;
      });
    }, 600); // slower than sun for calmer night feel

    return () => {
      if (moonIntervalRef.current) clearInterval(moonIntervalRef.current);
    };
  }, [mounted, moonFrames.length, moonDirection, resolvedTheme]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  
  // Don't render until mounted (avoid hydration mismatch)
  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      
      {/* ===== LIGHT MODE: Sun + Bird ===== */}
      {!isDark && (
        <>
          {/* Sun - fixed position, top right, slow parallax */}
          {sunFrames.length > 0 && (
            <pre 
              className="absolute right-4 top-[5rem] font-mono text-[10px] leading-tight text-amber-500/70 sm:text-xs"
              style={{
                transform: `translateY(${scrollY * -0.1}px)`,
                willChange: 'transform',
              }}
            >
              {sunFrames[sunFrameIndex]}
            </pre>
          )}
          
          {/* Bird - flies left to right, bobs vertically with flap, fast parallax */}
          {birdFrames.length > 0 && (
            <div
              className="absolute left-0 top-[10%] flex items-center justify-center"
              style={{ 
                transform: `translateX(${birdPosition}vw) translateY(${birdFrameIndex * 3 - scrollY * 0.8}px)`,
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
          
          {/* Clouds - drift slowly right to left */}
          {cloudFrames.length > 0 && cloudData.map((cloud, i) => (
            <pre
              key={cloud.id}
              className="absolute origin-top-left font-mono text-[10px] leading-tight text-sky-500"
              style={{
                left: `${cloudPositions[i]}%`,
                top: `${cloud.y}%`,
                transform: `scale(${cloud.scale}) translateY(${scrollY * -0.15}px)`,
                opacity: cloud.opacity,
                willChange: 'transform, left',
              }}
            >
              {cloudFrames[0]}
            </pre>
          ))}
        </>
      )}

      {/* ===== DARK MODE: Moon + Stars + Cursor Glow ===== */}
      {isDark && (
        <>
          {/* Cursor glow - subtle radial gradient following mouse */}
          {isMouseInWindow && (
            <div
              className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
              style={{
                background: `radial-gradient(100px at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 255, 255, 0.06), transparent)`,
              }}
            />
          )}
          
          {/* Moon - fixed position, top right, slow parallax */}
          {moonFrames.length > 0 && (
            <pre 
              className="absolute left-4 top-[6rem] origin-top-left font-mono text-[10px] leading-tight text-foreground/40"
              style={{
                transform: `scale(2.5) translateY(${scrollY * -0.1}px)`,
                willChange: 'transform',
              }}
            >
              {moonFrames[moonFrameIndex]}
            </pre>
          )}
          
          {/* Stars - twinkling scattered across the sky */}
          {stars.map((star, i) => (
            <span
              key={i}
              className="absolute font-mono text-foreground/40 animate-twinkle"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                transform: `translateY(${scrollY * -0.05}px)`,
                animationDelay: `${star.delay}s`,
                willChange: 'transform, opacity',
              }}
            >
              {star.char}
            </span>
          ))}
        </>
      )}
    </div>
  );
}
