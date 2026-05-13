"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function useDashboardReveal() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!rootRef.current) {
      return;
    }

    const ctx = gsap.context(() => {
      const targets = rootRef.current?.querySelectorAll("[data-dashboard-block]");
      if (!targets || targets.length === 0) {
        return;
      }

      gsap.fromTo(
        targets,
        { autoAlpha: 0, y: 16 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.42,
          stagger: 0.05,
          ease: "expo.out",
        },
      );
    }, rootRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return rootRef;
}
