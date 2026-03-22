import type { ComponentType } from "react";

/**
 * Registry of custom content components for featured finds.
 * Key = find ID, value = lazy-loaded React component.
 *
 * To add custom content for a featured find:
 * 1. Create a new file in this folder (e.g., `my-find.tsx`)
 * 2. Export a default component that receives no props
 * 3. Add it to the registry below with the find's ID
 */

import { lazy } from "react";

const registry: Record<string, ComponentType> = {
  // "3": lazy(() => import("./software-is-culture")),
  "5": lazy(() => import("./susan-kare")),
};

export function getFeaturedContent(findId: string): ComponentType | null {
  return registry[findId] ?? null;
}
