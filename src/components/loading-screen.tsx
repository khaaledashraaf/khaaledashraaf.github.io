"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  type ReactNode,
} from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

const LoadingContext = createContext(true);

/** Returns true once the loading screen has fully faded out */
export function useLoadingDone() {
  return useContext(LoadingContext);
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true);
  const [done, setDone] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { resolvedTheme } = useTheme();

  useLayoutEffect(() => {
    setIsDark(resolvedTheme === "dark");
  }, [resolvedTheme]);

  useEffect(() => {
    const start = Date.now();

    function dismiss() {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 2000 - elapsed);
      setTimeout(() => {
        setVisible(false);
      }, remaining);
    }

    if (document.readyState === "complete") {
      dismiss();
    } else {
      window.addEventListener("load", dismiss);
      return () => window.removeEventListener("load", dismiss);
    }
  }, []);

  const onExitComplete = useCallback(() => {
    setDone(true);
  }, []);

  return (
    <LoadingContext.Provider value={done}>
      <AnimatePresence onExitComplete={onExitComplete}>
        {visible && (
          <motion.div
            key="loading-screen"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-white dark:bg-background"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {isDark ? (
              <Image
                src="/moon.png"
                alt=""
                width={96}
                height={96}
                className="w-24 h-24 object-contain"
                priority
              />
            ) : (
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-24 h-24 object-contain"
              >
                <source src="/animations/sun.mp4" type="video/mp4" />
              </video>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </LoadingContext.Provider>
  );
}
