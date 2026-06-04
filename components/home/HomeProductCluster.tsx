"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";
import QuoteRequestModal from "@/components/quote-requests/QuoteRequestModal";
import CatalogVariantCard from "@/components/storefront/CatalogVariantCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { CatalogVariant } from "@/lib/catalog/types";

type HomeProductClusterProps = {
  description: string;
  emptyText: string;
  errorMessage: string | null;
  eyebrow: string;
  href: string;
  isLoading: boolean;
  onRetry: () => void;
  products: CatalogVariant[];
  title: string;
};

export default function HomeProductCluster({
  description,
  emptyText,
  errorMessage,
  eyebrow,
  href,
  isLoading,
  onRetry,
  products,
  title,
}: HomeProductClusterProps) {
  const [quoteVariant, setQuoteVariant] = useState<CatalogVariant | null>(null);

  return (
    <section className="border-b border-border bg-background py-10 sm:py-12">
      <div className="container mx-auto px-4">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              {eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">{title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          <Link
            className="inline-flex h-10 w-fit cursor-pointer items-center gap-2 border border-border px-3 text-sm font-black transition-colors hover:border-primary hover:text-primary"
            href={href}
          >
            Xem tất cả
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {isLoading ? (
          <ProductClusterSkeleton />
        ) : errorMessage ? (
          <div className="border border-border bg-muted/20 p-5" data-home-reveal>
            <p className="text-sm font-semibold text-destructive">{errorMessage}</p>
            <button
              className="mt-4 inline-flex h-10 cursor-pointer items-center gap-2 border border-border bg-background px-3 text-sm font-black transition-colors hover:border-primary hover:text-primary"
              onClick={onRetry}
              type="button"
            >
              <RefreshCw className="size-4" />
              Tải lại
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="border border-border bg-muted/20 p-5 text-sm text-muted-foreground" data-home-reveal>
            {emptyText}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((variant) => (
                <div data-home-reveal key={variant.id}>
                  <CatalogVariantCard onRequestQuote={setQuoteVariant} variant={variant} />
                </div>
              ))}
            </div>
            <QuoteRequestModal
              onClose={() => setQuoteVariant(null)}
              open={Boolean(quoteVariant)}
              variant={quoteVariant}
            />
          </>
        )}
      </div>
    </section>
  );
}

function ProductClusterSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 5 }, (_, index) => (
        <article key={`home-product-cluster-skeleton-${index}`} className="border border-border bg-background">
          <Skeleton className="aspect-square border-b border-border sm:aspect-[5/4]" />
          <div className="space-y-3 p-3 sm:p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </article>
      ))}
    </div>
  );
}
