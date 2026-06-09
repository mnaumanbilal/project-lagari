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

const ctaVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.95, ease: LAGARI_EASE, delay: 0.35 },
  },
};

function HeroCta() {
  return (
    <Link
      href="/shop"
      className="inline-flex items-center rounded-sm border border-lagari-primary bg-lagari-primary px-10 py-3.5 font-label text-lagari-deep transition-[background-color,color,border-color,box-shadow] duration-[var(--lagari-duration-medium)] ease-[var(--lagari-ease-out)] hover:border-lagari-brass hover:bg-transparent hover:text-lagari-primary hover:shadow-[0_0_24px_rgba(201,169,98,0.15)]"
    >
      Shop the collection
    </Link>
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
        <h1 className="sr-only">Lagari — artisanal fragrance impressions</h1>

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

        <div className="relative mx-auto flex max-w-7xl justify-center px-4 pt-[215px] sm:px-6 motion-static">
          {skipMotion ? (
            <HeroCta />
          ) : (
            <motion.div
              className="flex justify-center"
              variants={ctaVariants}
              initial="show"
              animate={contentControls}
            >
              <Link
                href="/shop"
                className="inline-flex items-center rounded-sm border border-lagari-primary bg-lagari-primary px-10 py-3.5 font-label text-lagari-deep transition-[background-color,color,border-color,box-shadow] duration-[var(--lagari-duration-medium)] ease-[var(--lagari-ease-out)] hover:border-lagari-brass hover:bg-transparent hover:text-lagari-primary hover:shadow-[0_0_24px_rgba(201,169,98,0.15)]"
              >
                Shop the collection
              </Link>
            </motion.div>
          )}
        </div>
      </section>
    </MotionConfig>
  );
}
