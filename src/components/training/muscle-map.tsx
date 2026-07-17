"use client";

import dynamic from "next/dynamic";
import type { Muscle } from "@/content/training";

// react-body-highlighter renders inline SVG — load client-only to avoid SSR quirks.
const Model = dynamic(() => import("react-body-highlighter"), { ssr: false });

const PRIMARY = "#e23b30"; // worked (primary)
const SECONDARY = "#ef9a92"; // worked (secondary)
const IDLE = "#cbd0d7"; // not worked (light body on dark card)

export function MuscleMap({
  primary,
  secondary,
  width = 66,
}: {
  primary: Muscle[];
  secondary: Muscle[];
  width?: number;
}) {
  const data = [
    { name: "secondary", muscles: secondary as string[], frequency: 1 },
    { name: "primary", muscles: primary as string[], frequency: 2 },
  ];
  const style = { width };
  return (
    <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Model
        {...({ data, type: "anterior" } as any)}
        bodyColor={IDLE}
        highlightedColors={[SECONDARY, PRIMARY]}
        style={style}
      />
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Model
        {...({ data, type: "posterior" } as any)}
        bodyColor={IDLE}
        highlightedColors={[SECONDARY, PRIMARY]}
        style={style}
      />
    </div>
  );
}
