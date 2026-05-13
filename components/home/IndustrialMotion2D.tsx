"use client";

import Lottie from "lottie-react";
import conveyorBeltAnimation from "@/Conveyor belt.json";

export default function IndustrialMotion2D() {
  return (
    <div className="h-full w-full bg-muted/20" aria-hidden="true">
      <Lottie
        animationData={conveyorBeltAnimation}
        autoplay
        loop
        className="h-full w-full"
        rendererSettings={{
          preserveAspectRatio: "xMidYMid meet",
        }}
      />
    </div>
  );
}
