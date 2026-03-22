"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, useRef, useMemo } from "react";

// ============================================================================
// TYPES
// ============================================================================

interface CloudConfig {
  id: number;
  y: number;
  speed: number;
  scale: number;
  opacity: number;
  initialX: number;
}

// ============================================================================
// UTILITIES
// ============================================================================

async function loadAsciiFrames(basePath: string, prefix: string) {
  const frames: string[] = [];
  let index = 1;
  while (true) {
    try {
      const res = await fetch(`${basePath}/${prefix}-kf${index}.txt`);
      if (!res.ok) break;
      frames.push(await res.text());
      index++;
    } catch {
      break;
    }
  }
  return frames;
}

function generateStars(count: number) {
  const chars = ["*", ".", "+", "·"];
  return Array.from({ length: count }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 60,
    char: chars[Math.floor(Math.random() * chars.length)],
    delay: Math.random() * 3,
  }));
}

function generateClouds(count: number): CloudConfig[] {
  const initialPositions = [20, 60, 110];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    y: 10 + Math.random() * 25,
    speed: 0.08 + Math.random() * 0.08,
    scale: 0.6 + Math.random() * 0.3,
    opacity: 0.5 + Math.random() * 0.7,
    initialX: initialPositions[i] ?? 60,
  }));
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Ping-pong animates a <pre> element's textContent through ASCII keyframes.
 * All updates go straight to the DOM — zero React re-renders.
 */
function usePingPongFrames(
  frames: string[],
  intervalMs: number,
  active: boolean
) {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (!active || frames.length < 2) return;

    let index = 0;
    let dir = 1;

    const id = setInterval(() => {
      const next = index + dir;
      if (next >= frames.length - 1) {
        dir = -1;
        index = frames.length - 1;
      } else if (next <= 0) {
        dir = 1;
        index = 0;
      } else {
        index = next;
      }
      if (ref.current) ref.current.textContent = frames[index];
    }, intervalMs);

    return () => clearInterval(id);
  }, [frames, intervalMs, active]);

  return ref;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AsciiBackground() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollYRef = useRef(0);

  const [frames, setFrames] = useState({
    sun: [] as string[],
    bird: [] as string[],
    moon: [] as string[],
    cloud: [] as string[],
  });

  const stars = useMemo(() => generateStars(25), []);
  const cloudData = useMemo(() => generateClouds(3), []);

  const isDark = resolvedTheme === "dark";

  const sunRef = usePingPongFrames(frames.sun, 400, mounted && !isDark);
  const moonRef = usePingPongFrames(frames.moon, 600, mounted && isDark);

  const birdWrapRef = useRef<HTMLDivElement>(null);
  const birdPreRef = useRef<HTMLPreElement>(null);
  const cloudRefs = useRef<(HTMLPreElement | null)[]>([]);

  // --- Load frames once on mount ---
  useEffect(() => {
    setMounted(true);
    Promise.all([
      loadAsciiFrames("/ascii/sun", "sun"),
      loadAsciiFrames("/ascii/bird", "bird"),
      loadAsciiFrames("/ascii/moon", "moon"),
      loadAsciiFrames("/ascii/cloud", "cloud"),
    ]).then(([sun, bird, moon, cloud]) =>
      setFrames({ sun, bird, moon, cloud })
    );
  }, []);

  // --- Scroll → CSS custom property (rAF-throttled, no re-renders) ---
  useEffect(() => {
    if (!mounted) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        scrollYRef.current = y;
        containerRef.current?.style.setProperty("--sy", String(y));
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [mounted]);

  // --- Mouse → CSS custom properties (no re-renders) ---
  useEffect(() => {
    if (!mounted) return;

    const onMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      el.style.setProperty("--mx", `${e.clientX}px`);
      el.style.setProperty("--my", `${e.clientY}px`);
      el.style.setProperty("--mouse-in", "1");
    };
    const onLeave = () =>
      containerRef.current?.style.setProperty("--mouse-in", "0");

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [mounted]);

  // --- Bird: flap + fly (direct DOM) ---
  useEffect(() => {
    if (!mounted || frames.bird.length === 0 || isDark) return;

    let frame = 0;
    let tick = 0;
    let posVw = -10;

    const id = setInterval(() => {
      frame = (frame + 1) % frames.bird.length;
      tick++;
      if (tick % 3 === 0) {
        posVw += 1.5;
        if (posVw > 110) posVw = -10;
      }

      const sy = scrollYRef.current;
      if (birdWrapRef.current) {
        birdWrapRef.current.style.transform =
          `translateX(${posVw}vw) translateY(${frame * 3 - sy * 0.8}px)`;
      }
      if (birdPreRef.current) {
        birdPreRef.current.textContent = frames.bird[frame];
      }
    }, 100);

    return () => clearInterval(id);
  }, [mounted, frames.bird, isDark]);

  // --- Clouds: drift right-to-left (rAF for smooth 60fps, transform for GPU compositing) ---
  useEffect(() => {
    if (!mounted || frames.cloud.length === 0 || isDark) return;

    const positions = cloudData.map((c) => c.initialX);
    let prev = 0;
    let rafId: number;

    const tick = (now: number) => {
      const dt = prev ? now - prev : 0;
      prev = now;

      cloudData.forEach((cloud, i) => {
        positions[i] -= cloud.speed * (dt / 100);
        if (positions[i] < -30) positions[i] = 120 + Math.random() * 20;
        const el = cloudRefs.current[i];
        if (el) {
          const sy = scrollYRef.current;
          el.style.transform =
            `translateX(${positions[i]}vw) scale(${cloud.scale}) translateY(${sy * -0.15}px)`;
        }
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [mounted, frames.cloud, isDark, cloudData]);

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* ===== LIGHT MODE ===== */}
      {!isDark && (
        <>
          {frames.sun.length > 0 && (
            <pre
              ref={sunRef}
              className="absolute right-4 top-[5rem] font-mono text-[10px] leading-tight text-amber-500/70 sm:text-xs hidden sm:block"
              style={{
                transform: "translateY(calc(var(--sy, 0) * -0.1px))",
              }}
            >
              {frames.sun[0]}
            </pre>
          )}

          {frames.bird.length > 0 && (
            <div
              ref={birdWrapRef}
              className="absolute left-0 top-[10%]"
              style={{ width: "8ch", height: "2em" }}
            >
              <pre
                ref={birdPreRef}
                className="font-mono text-[10px] leading-tight text-foreground/50 sm:text-xs"
              >
                {frames.bird[0]}
              </pre>
            </div>
          )}

          {frames.cloud.length > 0 &&
            cloudData.map((cloud, i) => (
              <pre
                key={cloud.id}
                ref={(el) => {
                  cloudRefs.current[i] = el;
                }}
                className="absolute left-0 origin-top-left font-mono text-[10px] leading-tight text-sky-500"
                style={{
                  top: `${cloud.y}%`,
                  opacity: cloud.opacity,
                }}
              >
                {frames.cloud[0]}
              </pre>
            ))}
        </>
      )}

      {/* ===== DARK MODE ===== */}
      {isDark && (
        <>
          <div
            className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300 hidden sm:block"
            style={{
              background:
                "radial-gradient(100px at var(--mx, -100px) var(--my, -100px), rgba(255,255,255,0.04), transparent)",
              opacity: "var(--mouse-in, 0)",
            }}
          />

          {frames.moon.length > 0 && (
            <pre
              ref={moonRef}
              className="absolute left-4 top-[6rem] origin-top-left font-mono text-[10px] leading-tight text-foreground/40 sm:block hidden"
              style={{
                transform:
                  "scale(2.5) translateY(calc(var(--sy, 0) * -0.1px))",
              }}
            >
              {frames.moon[0]}
            </pre>
          )}

          {stars.map((star, i) => (
            <span
              key={i}
              className="absolute font-mono text-foreground/40 animate-twinkle"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                transform: "translateY(calc(var(--sy, 0) * -0.05px))",
                animationDelay: `${star.delay}s`,
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
