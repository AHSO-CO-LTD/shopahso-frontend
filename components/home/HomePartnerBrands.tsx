"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import { useHomeReveal } from "@/components/home/useHomeReveal";
import { Skeleton } from "@/components/ui/skeleton";
import { listCatalogFeaturedBrands } from "@/lib/api/services/catalog-variants.service";
import type { CatalogFeaturedBrand } from "@/lib/catalog/types";
import { FALLBACK_LOGO_IMAGE } from "@/lib/image-fallbacks";

async function fetchPartnerBrands() {
  const response = await listCatalogFeaturedBrands();
  return response.slice(0, 12);
}

export default function HomePartnerBrands() {
  const rootRef = useRef<HTMLElement>(null);
  const [brands, setBrands] = useState<CatalogFeaturedBrand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useHomeReveal(rootRef, `${isLoading}-${brands.length}-${errorMessage ?? "ok"}`);

  const loadBrands = useCallback(async (showFeedback = false) => {
    const loadingToastId = showFeedback ? toast.loading("Đang tải lại thương hiệu cộng tác...") : undefined;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextBrands = await fetchPartnerBrands();
      setBrands(nextBrands);
      if (showFeedback) {
        toast.success("Đã cập nhật thương hiệu cộng tác.", { id: loadingToastId });
      }
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Không thể tải thương hiệu cộng tác.";
      setBrands([]);
      setErrorMessage(nextMessage);
      toast.error(nextMessage, { id: loadingToastId });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialBrands() {
      try {
        const nextBrands = await fetchPartnerBrands();

        if (cancelled) {
          return;
        }

        setBrands(nextBrands);
      } catch (error) {
        if (cancelled) {
          return;
        }

        const nextMessage = error instanceof Error ? error.message : "Không thể tải thương hiệu cộng tác.";
        setBrands([]);
        setErrorMessage(nextMessage);
        toast.error(nextMessage);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialBrands();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section ref={rootRef} className="border-b border-border bg-muted/20 py-10 sm:py-12">
      <div className="container mx-auto px-4">
        <HomeSectionHeader
          action={
            <Link
              className="inline-flex h-10 cursor-pointer items-center gap-2 border border-border bg-background px-3 text-sm font-black transition-colors hover:border-primary hover:text-primary"
              href="/thuong-hieu"
            >
              Xem thương hiệu
              <ArrowRight className="size-4" />
            </Link>
          }
          description=""
          eyebrow="05 / Partner brands"
          title="Thương hiệu cộng tác"
        />

        <div className="mt-5">
          {isLoading ? (
            <BrandSkeleton />
          ) : errorMessage ? (
            <div className="border border-border bg-background p-5" data-home-reveal>
              <p className="text-sm font-semibold text-destructive">{errorMessage}</p>
              <button
                className="mt-4 inline-flex h-10 cursor-pointer items-center gap-2 border border-border px-3 text-sm font-black transition-colors hover:border-primary hover:text-primary"
                onClick={() => void loadBrands(true)}
                type="button"
              >
                <RefreshCw className="size-4" />
                Tải lại
              </button>
            </div>
          ) : brands.length === 0 ? (
            <div className="border border-border bg-background p-5 text-sm text-muted-foreground" data-home-reveal>
              Chưa có thương hiệu cộng tác để hiển thị.
            </div>
          ) : (
            <div className="grid grid-cols-2 border border-border bg-background sm:grid-cols-3 lg:grid-cols-6">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  className="group flex min-h-36 cursor-pointer flex-col border-b border-r border-border p-4 transition-colors hover:bg-muted hover:text-primary"
                  data-home-reveal
                  href={`/thuong-hieu/${brand.slug}`}
                >
                  <div className="relative h-12 w-full">
                    <Image
                      alt={brand.name}
                      className="object-contain object-left"
                      fill
                      sizes="160px"
                      src={brand.logoUrl ?? FALLBACK_LOGO_IMAGE}
                    />
                  </div>
                  <p className="mt-4 line-clamp-2 text-sm font-black leading-tight">{brand.name}</p>
                  <p className="mt-auto pt-3 font-mono text-[10px] text-muted-foreground">
                    {brand.featuredVariantCount} biến thể
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function BrandSkeleton() {
  return (
    <div className="grid grid-cols-2 border border-border bg-background sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 12 }, (_, index) => (
        <article key={`home-partner-brand-skeleton-${index}`} className="min-h-36 border-b border-r border-border p-4">
          <Skeleton className="h-12 w-28" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-3/4" />
          <Skeleton className="mt-6 h-3 w-20" />
        </article>
      ))}
    </div>
  );
}
