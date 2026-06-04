"use client";

import { Plus, RefreshCw, Search } from "lucide-react";
import {
  formatPromotionDiscount,
  formatPromotionRange,
  getPromotionStatusClass,
  getPromotionStatusLabel,
} from "@/components/promotions/promotion-display";
import { PROMOTION_STATUS_OPTIONS } from "@/components/staff/promotions/promotion-admin-utils";
import { Button } from "@/components/ui/button";
import type { PromotionStatus, PromotionSummary } from "@/lib/promotion/types";

type PromotionListPanelProps = {
  errorMessage: string | null;
  filters: {
    q: string;
    status: PromotionStatus | "";
  };
  isLoading: boolean;
  onCreate: () => void;
  onFiltersChange: (filters: { q: string; status: PromotionStatus | "" }) => void;
  onRefresh: () => void;
  onSelect: (id: string) => void;
  promotions: PromotionSummary[];
  selectedPromotionId: string;
};

export default function PromotionListPanel({
  errorMessage,
  filters,
  isLoading,
  onCreate,
  onFiltersChange,
  onRefresh,
  onSelect,
  promotions,
  selectedPromotionId,
}: PromotionListPanelProps) {
  return (
    <aside className="flex min-h-0 flex-col border border-border bg-background">
      <header className="border-b border-border px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Promotion
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight">Chương trình</h2>
          </div>
          <div className="flex gap-2">
            <Button className="size-9 rounded-none px-0" disabled={isLoading} onClick={onRefresh} type="button" variant="outline">
              <RefreshCw className="size-4" />
              <span className="sr-only">Tải lại</span>
            </Button>
            <Button className="size-9 rounded-none px-0" onClick={onCreate} type="button">
              <Plus className="size-4" />
              <span className="sr-only">Tạo chương trình</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-3 border-b border-border p-4">
        <label className="grid gap-2 text-sm">
          <span className="font-semibold">Tìm chương trình</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-10 w-full border border-border bg-background pl-9 pr-3 outline-none transition-colors hover:border-primary focus:border-primary"
              onChange={(event) => onFiltersChange({ ...filters, q: event.target.value })}
              placeholder="Tên hoặc slug"
              value={filters.q}
            />
          </span>
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-semibold">Trạng thái</span>
          <select
            className="h-10 cursor-pointer border border-border bg-background px-3 outline-none transition-colors hover:border-primary focus:border-primary"
            onChange={(event) => onFiltersChange({ ...filters, status: event.target.value as PromotionStatus | "" })}
            value={filters.status}
          >
            <option value="">Tất cả</option>
            {PROMOTION_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {getPromotionStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="grid gap-3 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div className="h-28 animate-pulse border border-border bg-muted" key={index} />
            ))}
          </div>
        ) : errorMessage ? (
          <div className="p-5 text-sm text-destructive">{errorMessage}</div>
        ) : promotions.length === 0 ? (
          <div className="p-5 text-sm text-muted-foreground">Chưa có chương trình phù hợp.</div>
        ) : (
          <div className="divide-y divide-border">
            {promotions.map((promotion) => (
              <button
                className={[
                  "grid w-full cursor-pointer gap-2 px-4 py-4 text-left transition-colors hover:bg-muted/20",
                  selectedPromotionId === promotion.id ? "bg-muted/35" : "",
                ].join(" ")}
                key={promotion.id}
                onClick={() => onSelect(promotion.id)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="line-clamp-2 font-black leading-5">{promotion.name}</p>
                  <span className={`shrink-0 border px-2 py-1 text-[10px] font-black uppercase ${getPromotionStatusClass(promotion.status)}`}>
                    {getPromotionStatusLabel(promotion.status)}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-muted-foreground">{promotion.slug}</p>
                <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  <span>{promotion._count?.items ?? 0} SKU</span>
                  <span>{formatPromotionDiscount(promotion.defaultDiscountType, promotion.defaultDiscountValue)}</span>
                </div>
                <p className="truncate text-[11px] text-muted-foreground">
                  {formatPromotionRange(promotion.startsAt, promotion.endsAt)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
