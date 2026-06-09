/** Shared motion presets — Lagari luxury easing */
export const LAGARI_EASE = [0.22, 1, 0.36, 1] as const;

export const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.95, ease: LAGARI_EASE, delay },
});

export const fadeUpInView = (delay = 0) => ({
  initial: { opacity: 0, y: 48 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15, margin: "0px 0px -40px 0px" },
  transition: { duration: 0.9, ease: LAGARI_EASE, delay },
});

export const heroLogo = {
  initial: { opacity: 0, scale: 0.9, y: 24, filter: "blur(8px)" },
  animate: { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 1.3, ease: LAGARI_EASE, delay: 0.1 },
};

export const heroLine = {
  initial: { opacity: 0, scaleX: 0 },
  animate: { opacity: 1, scaleX: 1 },
  transition: { duration: 1, ease: LAGARI_EASE, delay: 0.45 },
};

export const heroBrand = {
  initial: { opacity: 0, y: 28, letterSpacing: "0.18em" },
  animate: { opacity: 1, y: 0, letterSpacing: "0.04em" },
  transition: { duration: 1.1, ease: LAGARI_EASE, delay: 0.65 },
};

export const heroTagline = {
  initial: { opacity: 0, y: 20, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 1.2, ease: LAGARI_EASE, delay: 0.95 },
};

export const heroFade = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, ease: LAGARI_EASE, delay },
});
