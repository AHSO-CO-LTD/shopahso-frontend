"use client";

import Image, { type ImageLoaderProps } from "next/image";
import { HOMEPAGE_BANNER_STANDARD } from "@/lib/banner/banner-standards";
import type { Brand } from "@/lib/brand/types";
import { FALLBACK_LOGO_IMAGE } from "@/lib/image-fallbacks";

type BrandDetailHeaderProps = {
  brand: Pick<Brand, "name" | "slug" | "logoUrl" | "bannerUrl">;
  variantCount: number;
};

function passthroughImageLoader({ src }: ImageLoaderProps) {
  return src;
}

export default function BrandDetailHeader({ brand, variantCount }: BrandDetailHeaderProps) {
  return (
    <header className="mb-8 border border-border bg-muted/15">
      {brand.bannerUrl ? (
        <div className={`relative ${HOMEPAGE_BANNER_STANDARD.aspectClass} border-b border-border bg-muted/20`}>
          <Image
            alt={`Banner thương hiệu ${brand.name}`}
            className="object-contain"
            fill
            loader={passthroughImageLoader}
            priority
            sizes="(min-width: 1280px) 1200px, 100vw"
            src={brand.bannerUrl}
            unoptimized
          />
        </div>
      ) : null}

      <div className="px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Thương hiệu</p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-16 w-full items-center justify-center border border-border bg-background px-2 sm:w-40">
            <div className="relative h-10 w-full">
              <Image
                alt={`Logo ${brand.name}`}
                className="object-contain"
                fill
                sizes="160px"
                src={brand.logoUrl ?? FALLBACK_LOGO_IMAGE}
              />
            </div>
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-black tracking-tight lg:text-4xl">{brand.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Tổng biến thể đang mở bán: {variantCount}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
