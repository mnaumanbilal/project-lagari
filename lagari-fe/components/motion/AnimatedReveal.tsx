"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { LAGARI_EASE } from "@/lib/motion/presets";
import { useSkipMotion } from "@/lib/motion/use-skip-motion";

type AnimatedRevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Stagger delay in seconds */
  delay?: number;
};

export function AnimatedReveal({
  children,
  className = "",
  delay = 0,
}: AnimatedRevealProps) {
  const skipMotion = useSkipMotion();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: true,
    amount: 0,
    margin: "0px 0px 120px 0px",
  });

  if (skipMotion) {
    return (
      <div ref={ref} className={`motion-static ${className}`.trim()}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{
        duration: 0.85,
        ease: LAGARI_EASE,
        delay: isInView ? delay : 0,
      }}
    >
      {children}
    </motion.div>
  );
}
