"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import DiscountedVariantGrid from "@/components/promotions/DiscountedVariantGrid";
import PromotionSummaryCard from "@/components/promotions/PromotionSummaryCard";
import { Button } from "@/components/ui/button";
import {
  listPublicDiscountedVariants,
  listPublicPromotions,
} from "@/lib/api/services/promotions.service";
import type { CatalogVariant } from "@/lib/catalog/types";
import type { PromotionSummary } from "@/lib/promotion/types";

export default function PublicPromotionLandingPage() {
  const [promotions, setPromotions] = useState<PromotionSummary[]>([]);
  const [variants, setVariants] = useState<CatalogVariant[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadData(showFeedback = false) {
    const loadingToastId = showFeedback ? toast.loading("Đang tải khuyến mãi...") : undefined;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [promotionResponse, variantResponse] = await Promise.all([
        listPublicPromotions(),
        listPublicDiscountedVariants(),
      ]);

      setPromotions(promotionResponse);
      setVariants(variantResponse);
      if (showFeedback) {
        toast.success("Đã cập nhật khuyến mãi.", { id: loadingToastId });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải dữ liệu khuyến mãi.";
      setErrorMessage(message);
      toast.error(message, { id: loadingToastId });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <main className="border-t border-border bg-background">
      <section className="container mx-auto px-4 py-8 lg:py-10">
        {isLoading ? (
          <PromotionLandingSkeleton />
        ) : errorMessage ? (
          <div className="border border-destructive bg-destructive/10 p-6">
            <p className="text-sm font-semibold text-destructive">{errorMessage}</p>
            <Button className="mt-4 h-10 cursor-pointer rounded-none px-4" onClick={() => void loadData(true)} type="button" variant="outline">
              <RefreshCw className="size-4" />
              Tải lại
            </Button>
          </div>
        ) : (
          <div className="grid gap-10">
            <section>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    ACTIVE / PROMOTIONS
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight">Chương trình khuyến mãi</h2>
                </div>
                <p className="border border-border px-3 py-2 text-sm font-semibold text-muted-foreground">
                  {promotions.length} chương trình
                </p>
              </div>

              {promotions.length === 0 ? (
                <div className="border border-border bg-muted/20 p-6 text-sm text-muted-foreground">
                  Hiện chưa có chương trình khuyến mãi đang hiển thị.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {promotions.map((promotion) => (
                    <PromotionSummaryCard key={promotion.id} promotion={promotion} />
                  ))}
                </div>
              )}
            </section>

            <section id="san-pham-giam-gia">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    DISCOUNTED / VARIANTS
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight">Sản phẩm đang giảm giá</h2>
                </div>
                <p className="border border-border px-3 py-2 text-sm font-semibold text-muted-foreground">
                  {variants.length} SKU
                </p>
              </div>
              <DiscountedVariantGrid variants={variants} />
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

function PromotionLandingSkeleton() {
  return (
    <div className="grid gap-8">
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="h-52 animate-pulse border border-border bg-muted" key={index} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, index) => (
          <div className="h-80 animate-pulse border border-border bg-muted" key={index} />
        ))}
      </div>
    </div>
  );
}
