"use client";

import { MotionConfig } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import bannerSrc from "@/app/assets/images/lagari-banner-image.png";
import { LAGARI_EASE } from "@/lib/motion/presets";
import { useClientReady } from "@/lib/motion/use-client-ready";
import { useSkipMotion } from "@/lib/motion/use-skip-motion";

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.95, ease: LAGARI_EASE },
  },
};

const lineVariants = {
  hidden: { opacity: 0, scaleX: 0 },
  show: {
    opacity: 1,
    scaleX: 1,
    transition: { duration: 0.9, ease: LAGARI_EASE },
  },
};

const brandVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 1, ease: LAGARI_EASE },
  },
};

function HeroBrassDivider({ animated = false }: { animated?: boolean }) {
  const className =
    "mx-auto mt-[15px] h-px w-[min(12rem,60vw)] origin-center bg-gradient-to-r from-transparent via-lagari-brass to-transparent";

  if (!animated) {
    return <div aria-hidden className={className} />;
  }

  return <motion.div aria-hidden className={className} variants={lineVariants} />;
}

function HeroHeadline({ animated = false }: { animated?: boolean }) {
  const titleClass =
    "lagari-hero-headline font-display text-[clamp(1.5rem,4vw,3.5rem)] font-semibold leading-none tracking-tight text-lagari-brass whitespace-nowrap";

  if (!animated) {
    return <h1 className={titleClass}>LAGARI: Crafted for Presence</h1>;
  }

  return (
    <h1 className={titleClass}>
      <motion.span className="inline-block" variants={brandVariants}>
        LAGARI: Crafted for Presence
      </motion.span>
    </h1>
  );
}

function HeroTagline({ animated = false }: { animated?: boolean }) {
  const className =
    "lagari-hero-tagline font-label mt-4 max-w-md text-sm tracking-[0.14em] text-lagari-primary/90 sm:text-[0.8125rem]";

  if (!animated) {
    return (
      <p className={className}>
        Artisanal impressions of iconic fragrances — composed for Pakistan
      </p>
    );
  }

  return (
    <motion.p className={className} variants={itemVariants}>
      Artisanal impressions of iconic fragrances — composed for Pakistan
    </motion.p>
  );
}

function HeroCta({ animated = false }: { animated?: boolean }) {
  const button = (
    <Link
      href="/shop"
      className="inline-flex items-center rounded-sm border border-lagari-primary bg-lagari-primary px-10 py-3.5 font-label text-lagari-deep transition-[background-color,color,border-color,box-shadow] duration-[var(--lagari-duration-medium)] ease-[var(--lagari-ease-out)] hover:border-lagari-brass hover:bg-transparent hover:text-lagari-primary hover:shadow-[0_0_24px_rgba(201,169,98,0.15)]"
    >
      Shop the collection
    </Link>
  );

  if (!animated) {
    return <div className="flex justify-center">{button}</div>;
  }

  return (
    <motion.div className="flex justify-center" variants={itemVariants}>
      {button}
    </motion.div>
  );
}

function HeroTopText({ animated = false }: { animated?: boolean }) {
  if (!animated) {
    return (
      <div className="mt-5 flex shrink-0 flex-col items-center text-center">
        <HeroHeadline />
        <HeroTagline />
        <HeroBrassDivider />
      </div>
    );
  }

  return (
    <motion.div
      className="mt-9 flex shrink-0 flex-col items-center text-center"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants}>
        <HeroHeadline animated />
      </motion.div>
      <HeroTagline animated />
      <HeroBrassDivider animated />
    </motion.div>
  );
}

function HeroContent({ animated = false }: { animated?: boolean }) {
  return (
    <>
      <HeroTopText animated={animated} />

      <div className="flex-1" aria-hidden />

      <div className="mb-12 shrink-0">
        <HeroCta animated={animated} />
      </div>
    </>
  );
}

export function HeroBanner() {
  const skipMotion = useSkipMotion();
  const reduceMotion = useReducedMotion();
  const ready = useClientReady();
  const contentControls = useAnimationControls();

  useEffect(() => {
    if (!ready || reduceMotion !== false) return;

    void (async () => {
      await contentControls.start("hidden", { duration: 0 });
      await contentControls.start("show");
    })();
  }, [ready, reduceMotion, contentControls]);

  return (
    <MotionConfig reducedMotion="user">
      <section className="relative min-h-[78vh] overflow-hidden border-b border-lagari-border sm:min-h-[88vh]">
        <div className="absolute inset-0">
          {skipMotion ? (
            <div className="relative h-full w-full">
              <Image
                src={bannerSrc}
                alt="Lagari extrait de parfum collection"
                fill
                priority
                sizes="100vw"
                className="object-cover object-[center_42%] brightness-[1.05] contrast-[1.04] saturate-[1.07]"
              />
            </div>
          ) : (
            <motion.div
              className="relative h-full w-full"
              initial={{ scale: 1.06 }}
              animate={{ scale: 1 }}
              transition={{ duration: 2, ease: LAGARI_EASE }}
            >
              <Image
                src={bannerSrc}
                alt="Lagari extrait de parfum collection"
                fill
                priority
                sizes="100vw"
                className="object-cover object-[center_42%] brightness-[1.05] contrast-[1.04] saturate-[1.07]"
              />
            </motion.div>
          )}
          <div className="lagari-hero-scrim absolute inset-0" aria-hidden />
        </div>

        <div className="relative mx-auto flex min-h-[78vh] max-w-7xl flex-col px-4 sm:min-h-[88vh] sm:px-6 motion-static">
          {skipMotion ? (
            <HeroContent />
          ) : (
            <motion.div
              className="flex min-h-[inherit] flex-col"
              variants={containerVariants}
              initial="show"
              animate={contentControls}
            >
              <HeroContent animated />
            </motion.div>
          )}
        </div>
      </section>
    </MotionConfig>
  );
}
