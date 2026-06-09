"use client";

import { useReducedMotion } from "framer-motion";
import { useClientReady } from "@/lib/motion/use-client-ready";

/**
 * True when we should skip motion and render fully visible static content.
 * Covers: prefers-reduced-motion, hydration (null), and MotionConfig blocking animations.
 */
export function useSkipMotion() {
  const reduceMotion = useReducedMotion();
  const ready = useClientReady();

  if (!ready) return true;
  return reduceMotion !== false;
}
