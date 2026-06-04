"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import DiscountedVariantGrid from "@/components/promotions/DiscountedVariantGrid";
import {
  formatPromotionDiscount,
  formatPromotionRange,
  getPromotionStatusClass,
  getPromotionStatusLabel,
} from "@/components/promotions/promotion-display";
import { Button } from "@/components/ui/button";
import { getPublicPromotionBySlug } from "@/lib/api/services/promotions.service";
import { PROMOTION_BANNER_STANDARD } from "@/lib/banner/banner-standards";
import type { CatalogVariant } from "@/lib/catalog/types";
import type { PublicPromotionDetail } from "@/lib/promotion/types";

export default function PublicPromotionDetailPage({ slug }: { slug: string }) {
  const [promotion, setPromotion] = useState<PublicPromotionDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const variants = useMemo<CatalogVariant[]>(
    () => promotion?.items.map((item) => item.variant).filter(Boolean) ?? [],
    [promotion],
  );

  async function loadPromotion(showFeedback = false) {
    const loadingToastId = showFeedback ? toast.loading("Đang tải chương trình...") : undefined;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getPublicPromotionBySlug(slug);
      setPromotion(response);
      if (showFeedback) {
        toast.success("Đã cập nhật chương trình.", { id: loadingToastId });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải chương trình khuyến mãi.";
      setErrorMessage(message);
      toast.error(message, { id: loadingToastId });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPromotion();
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return (
    <main className="border-t border-border bg-background">
      <section className="container mx-auto px-4 py-8 lg:py-10">
        <div className="mb-6">
          <Link
            className="inline-flex h-9 cursor-pointer items-center gap-2 border border-border px-3 text-xs font-semibold transition-colors hover:border-primary hover:text-primary"
            href="/khuyen-mai"
          >
            <ArrowLeft className="size-4" />
            Quay lại khuyến mãi
          </Link>
        </div>

        {isLoading ? (
          <div className="h-80 animate-pulse border border-border bg-muted" />
        ) : errorMessage || !promotion ? (
          <div className="border border-destructive bg-destructive/10 p-6">
            <p className="text-sm font-semibold text-destructive">
              {errorMessage ?? "Không tìm thấy chương trình khuyến mãi."}
            </p>
            <Button className="mt-4 h-10 rounded-none px-4" onClick={() => void loadPromotion(true)} type="button" variant="outline">
              <RefreshCw className="size-4" />
              Tải lại
            </Button>
          </div>
        ) : (
          <div className="grid gap-8">
            {promotion.bannerImageUrl ? (
              <Link
                aria-label={`Mở banner ${promotion.name}`}
                className="block cursor-pointer border border-border bg-muted/20 transition-opacity hover:opacity-90"
                href={promotion.bannerLinkUrl || `/khuyen-mai/${promotion.slug}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={`Banner ${promotion.name}`}
                  className={`${PROMOTION_BANNER_STANDARD.aspectClass} w-full object-contain`}
                  src={promotion.bannerImageUrl}
                />
              </Link>
            ) : null}

            <header>
              <div className="border border-border bg-background p-5 sm:p-7">
                <span className={`inline-flex border px-2 py-1 text-[11px] font-black uppercase ${getPromotionStatusClass(promotion.status)}`}>
                  {getPromotionStatusLabel(promotion.status)}
                </span>
                <p className="mt-5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-red-700">
                  Ưu đãi mặc định {formatPromotionDiscount(promotion.defaultDiscountType, promotion.defaultDiscountValue)}
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{promotion.name}</h1>
                {promotion.description ? (
                  <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">{promotion.description}</p>
                ) : null}
                <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                  <InfoBlock label="Thời gian" value={formatPromotionRange(promotion.startsAt, promotion.endsAt)} />
                  <InfoBlock label="SKU áp dụng" value={String(promotion._count?.items ?? promotion.items.length)} />
                </dl>
              </div>

              <aside className="hidden">
                {promotion.bannerImageUrl ? (
                  <Link className="block h-full min-h-72" href={promotion.bannerLinkUrl || `/khuyen-mai/${promotion.slug}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={`Banner ${promotion.name}`}
                      className="h-full min-h-72 w-full object-cover"
                      src={promotion.bannerImageUrl}
                    />
                  </Link>
                ) : (
                  <div className="grid h-full min-h-72 place-items-center p-5 text-center">
                    <p className="text-lg font-black">Chương trình không có banner riêng</p>
                  </div>
                )}
              </aside>
            </header>

            <section>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    PROMOTION / ITEMS
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight">Sản phẩm trong chương trình</h2>
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

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-muted/15 px-3 py-2">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}
