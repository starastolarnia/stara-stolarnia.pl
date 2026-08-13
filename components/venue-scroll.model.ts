"use client";

import Lenis, { type LenisOptions, type ScrollToOptions } from "lenis";
import { useCallback, useEffect, useRef } from "react";

export type VenueScroll = (
  target: number | string | HTMLElement,
  options?: ScrollToOptions,
) => void;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const VENUE_SCROLL_OPTIONS: LenisOptions = {
  anchors: true,
  autoRaf: true,
  respectReducedMotion: true,
  smoothWheel: true,
  syncTouch: false,
};

export const useVenueScrollModel = () => {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis(VENUE_SCROLL_OPTIONS);
    lenisRef.current = lenis;

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const scrollTo = useCallback<VenueScroll>((target, options) => {
    const lenis = lenisRef.current;

    if (lenis) {
      lenis.scrollTo(target, options);
      return;
    }

    const behavior =
      options?.immediate || window.matchMedia(REDUCED_MOTION_QUERY).matches
        ? "auto"
        : "smooth";

    if (typeof target === "number") {
      window.scrollTo({ top: target, left: 0, behavior });
      return;
    }

    const element = typeof target === "string" ? document.querySelector(target) : target;
    element?.scrollIntoView({ behavior, block: "start" });
  }, []);

  return { scrollTo };
};
