"use client";

import Link from "next/link";
import { ArrowRight, Timer } from "lucide-react";
import {
  formatPromotionDiscount,
  formatPromotionRange,
  getPromotionStatusClass,
  getPromotionStatusLabel,
} from "@/components/promotions/promotion-display";
import type { PromotionSummary } from "@/lib/promotion/types";

export default function PromotionSummaryCard({ promotion }: { promotion: PromotionSummary }) {
  const href = `/khuyen-mai/${promotion.slug}`;

  return (
    <article className="group grid min-h-52 border border-border bg-background transition-colors hover:border-red-700">
      <Link className="grid h-full cursor-pointer grid-rows-[auto_1fr_auto]" href={href}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <span className={`border px-2 py-1 text-[11px] font-black uppercase ${getPromotionStatusClass(promotion.status)}`}>
            {getPromotionStatusLabel(promotion.status)}
          </span>
          <span className="font-mono text-[11px] font-semibold text-muted-foreground">
            {promotion._count?.items ?? 0} SKU
          </span>
        </div>

        <div className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-red-700">
            Ưu đãi mặc định {formatPromotionDiscount(promotion.defaultDiscountType, promotion.defaultDiscountValue)}
          </p>
          <h3 className="mt-2 line-clamp-2 text-xl font-black tracking-tight transition-colors group-hover:text-red-700">
            {promotion.name}
          </h3>
          {promotion.description ? (
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
              {promotion.description}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
          <span className="inline-flex min-w-0 items-center gap-2 text-muted-foreground">
            <Timer className="size-4 shrink-0" />
            <span className="truncate">{formatPromotionRange(promotion.startsAt, promotion.endsAt)}</span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-red-700 transition-transform group-hover:translate-x-1" />
        </div>
      </Link>
    </article>
  );
}
