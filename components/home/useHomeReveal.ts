"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useHomeReveal(rootRef: RefObject<HTMLElement | null>, dependencyKey: string | number = "static") {
  useEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-home-reveal]"));

      if (targets.length === 0) {
        return;
      }

      if (reducedMotion) {
        return;
      }

      ScrollTrigger.batch(targets, {
        interval: 0.08,
        once: true,
        start: "top 86%",
        onEnter: (batch) => {
          gsap.fromTo(
            batch,
            { opacity: 0, y: 22 },
            {
              duration: 0.56,
              ease: "expo.out",
              opacity: 1,
              overwrite: true,
              stagger: 0.07,
              y: 0,
            },
          );
        },
      });
    }, root);

    return () => ctx.revert();
  }, [dependencyKey, rootRef]);
}
