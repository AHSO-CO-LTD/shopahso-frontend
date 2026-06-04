"use client";

import HomePublicBannerSlot from "@/components/home/HomePublicBannerSlot";

export default function HomeBanner() {
  return (
    <section className="border-b border-border bg-muted/20">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <HomePublicBannerSlot />
      </div>
    </section>
  );
}
