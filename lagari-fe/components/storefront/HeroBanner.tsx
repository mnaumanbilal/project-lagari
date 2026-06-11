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

const HEADLINE = "LAGARI: Crafted for Presence";
const PUNCHLINE =
  "Artisanal impressions of iconic designer fragrances.";

const wrapperClassName =
  "flex w-full flex-col items-center gap-2 text-center sm:gap-3";

const headlineClassName =
  "font-display text-[1.375rem] font-semibold leading-[1.2] tracking-[0.02em] text-lagari-brass sm:text-[2rem] md:text-[2.5rem] lg:text-[3rem] xl:text-[3.25rem]";

const punchlineClassName =
  "max-w-[16rem] font-label text-[0.6875rem] leading-relaxed text-lagari-primary sm:max-w-sm sm:text-xs";

const ctaClassName =
  "mt-4 inline-flex items-center justify-center rounded-sm border border-lagari-primary bg-lagari-primary px-5 py-2 font-label text-xs text-lagari-deep transition-[background-color,color,border-color,box-shadow] duration-[var(--lagari-duration-medium)] ease-[var(--lagari-ease-out)] hover:border-lagari-brass hover:bg-transparent hover:text-lagari-primary hover:shadow-[0_0_24px_rgba(201,169,98,0.15)] sm:px-8 sm:py-2.5 sm:text-sm";

const contentVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.25,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.95, ease: LAGARI_EASE },
  },
};

function HeroCopyStatic() {
  return (
    <div className={wrapperClassName}>
      <h1 className={headlineClassName}>{HEADLINE}</h1>
      <p className={punchlineClassName}>{PUNCHLINE}</p>
      <Link href="/shop" className={ctaClassName}>
        Shop the collection
      </Link>
    </div>
  );
}

function HeroCopyAnimated({
  controls,
}: {
  controls: ReturnType<typeof useAnimationControls>;
}) {
  return (
    <motion.div
      className={wrapperClassName}
      variants={contentVariants}
      initial="show"
      animate={controls}
    >
      <motion.h1 className={headlineClassName} variants={itemVariants}>
        {HEADLINE}
      </motion.h1>
      <motion.p className={punchlineClassName} variants={itemVariants}>
        {PUNCHLINE}
      </motion.p>
      <motion.div variants={itemVariants}>
        <Link href="/shop" className={ctaClassName}>
          Shop the collection
        </Link>
      </motion.div>
    </motion.div>
  );
}

export function HeroBanner() {
  const skipMotion = useSkipMotion();
  const reduceMotion = useReducedMotion();
  const ready = useClientReady();
  const contentControls = useAnimationControls();

  useEffect(() => {
    if (!ready || reduceMotion !== false || skipMotion) return;

    void (async () => {
      await contentControls.start("hidden", { duration: 0 });
      await contentControls.start("show");
    })();
  }, [ready, reduceMotion, skipMotion, contentControls]);

  return (
    <MotionConfig reducedMotion="user">
      <section className="relative min-h-[72vh] overflow-hidden border-b border-lagari-border sm:min-h-[82vh] lg:min-h-[88vh]">
        <div className="absolute inset-0">
          {skipMotion ? (
            <div className="relative h-full w-full">
              <Image
                src={bannerSrc}
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
                aria-hidden
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
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
                aria-hidden
              />
            </motion.div>
          )}
        </div>

        <div className="relative mx-auto flex w-full max-w-7xl justify-center px-4 pt-[30px] sm:px-6 motion-static">
          {skipMotion ? (
            <HeroCopyStatic />
          ) : (
            <HeroCopyAnimated controls={contentControls} />
          )}
        </div>
      </section>
    </MotionConfig>
  );
}
