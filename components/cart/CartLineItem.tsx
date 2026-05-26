"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/cart/CartProvider";
import { formatCartMoney, formatTaxSource } from "@/components/cart/cart-format";
import type { CartItem } from "@/lib/cart/types";
import { FALLBACK_LOGO_IMAGE } from "@/lib/image-fallbacks";
import { isContactForPrice } from "@/lib/pricing-status";

export function CartLineItem({
  compact = false,
  isSelected = true,
  item,
  onSelectedChange,
  selectable = false,
}: {
  compact?: boolean;
  isSelected?: boolean;
  item: CartItem;
  onSelectedChange?: (itemId: string, selected: boolean) => void;
  selectable?: boolean;
}) {
  const { isMutating, removeItem, updateQuantity } = useCart();
  const minQuantity = item.minOrderQuantity;
  const maxQuantity = item.stockQuantity;
  const requiresQuote = isContactForPrice(item.current.pricingStatus ?? item.variant.pricingStatus);
  const canEditQuantity = !isMutating && item.available && !requiresQuote;
  const imageUrl = item.snapshot.imageUrl || item.variant.imageUrls?.[0] || FALLBACK_LOGO_IMAGE;
  const isFallbackImage = imageUrl === FALLBACK_LOGO_IMAGE;

  function handleQuantityChange(nextQuantity: number) {
    if (nextQuantity < minQuantity) {
      toast.warning("Bạn đã chạm giới hạn tối thiểu của sản phẩm này.");
      return;
    }

    if (nextQuantity > maxQuantity) {
      toast.warning("Bạn đã chạm giới hạn tối đa của sản phẩm này.");
      return;
    }

    if (nextQuantity === item.quantity) {
      return;
    }

    void updateQuantity(item.id, nextQuantity);
  }

  return (
    <article
      className={[
        "grid gap-3 border border-border bg-background p-3 sm:gap-4",
        selectable ? "grid-cols-[auto_88px_minmax(0,1fr)]" : "grid-cols-[88px_minmax(0,1fr)]",
      ].join(" ")}
    >
      {selectable ? (
        <label className="mt-1 inline-flex size-8 cursor-pointer items-center justify-center border border-border transition-colors hover:border-primary hover:bg-muted/30 has-disabled:cursor-not-allowed has-disabled:opacity-50">
          <input
            aria-label={`Chọn ${item.variant.name}`}
            checked={isSelected}
            className="size-4 cursor-pointer accent-primary disabled:cursor-not-allowed"
            disabled={!item.available || requiresQuote}
            onChange={(event) => onSelectedChange?.(item.id, event.currentTarget.checked)}
            type="checkbox"
          />
        </label>
      ) : null}
      <Link
        href={`/san-pham/${item.variant.slug}`}
        className="relative aspect-square overflow-hidden border border-border bg-muted/20"
        aria-label={`Xem ${item.variant.name}`}
      >
        <Image
          alt={item.variant.name}
          className={isFallbackImage ? "object-contain p-3" : "object-cover"}
          fill
          sizes="88px"
          src={imageUrl}
        />
      </Link>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/san-pham/${item.variant.slug}`}
              className="line-clamp-2 text-sm font-bold leading-5 transition-colors hover:text-primary"
            >
              {item.variant.name}
            </Link>
            <p className="mt-1 truncate text-xs text-muted-foreground">SKU: {item.variant.sku}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">Xuất xứ: {item.variant.originCountryCode ?? "Chưa có"}</p>
          </div>
          <button
            type="button"
            className="inline-flex size-8 shrink-0 items-center justify-center border border-border text-destructive transition-colors hover:border-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={isMutating}
            onClick={() => void removeItem(item.id)}
            aria-label={`Xóa ${item.variant.name}`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {!item.available ? (
            <span className="border border-destructive bg-destructive/10 px-2 py-1 text-[11px] font-semibold text-destructive">
              Không khả dụng
            </span>
          ) : null}
          {requiresQuote ? (
            <span className="border border-secondary bg-secondary/30 px-2 py-1 text-[11px] font-semibold text-foreground">
              Cần báo giá
            </span>
          ) : null}
          {item.priceChanged ? (
            <span className="border border-secondary bg-secondary/30 px-2 py-1 text-[11px] font-semibold text-foreground">
              Giá đã thay đổi
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Giá hiện tại</p>
            <p className="text-base font-black text-primary">
              {requiresQuote ? "Liên hệ báo giá" : formatCartMoney(item.current.effectivePrice)}
            </p>
            {!requiresQuote && item.current.tax ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Thuế {item.current.tax.percent}%:{" "}
                <span className="font-semibold text-foreground">{formatCartMoney(item.current.tax.amount)}</span>
                {" "}({formatTaxSource(item.current.tax.source)})
              </p>
            ) : null}
            {!requiresQuote && item.current.totalWithTax ? (
              <p className="text-xs text-muted-foreground">
                Tổng sau thuế:{" "}
                <span className="font-semibold text-foreground">{formatCartMoney(item.current.totalWithTax)}</span>
              </p>
            ) : null}
            {item.priceChanged ? (
              <p className="text-xs text-muted-foreground">
                Lúc thêm: {formatCartMoney(item.snapshot.effectivePrice)}
              </p>
            ) : null}
          </div>

          <div className="flex items-center border border-border">
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!canEditQuantity}
              onClick={() => handleQuantityChange(item.quantity - 1)}
              aria-label="Giảm số lượng"
            >
              <Minus className="size-4" />
            </button>
            <input
              key={`${item.id}-${item.quantity}`}
              className="input-no-spin h-9 w-14 border-x border-border bg-background text-center text-sm font-semibold outline-none focus:bg-muted/30"
              disabled={isMutating}
              min={minQuantity}
              max={maxQuantity}
              onBlur={(event) => {
                const nextQuantity = Number(event.currentTarget.value);
                if (!Number.isInteger(nextQuantity)) {
                  event.currentTarget.value = String(item.quantity);
                  return;
                }
                handleQuantityChange(nextQuantity);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
              type="number"
              defaultValue={item.quantity}
              aria-label="Số lượng"
            />
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!canEditQuantity}
              onClick={() => handleQuantityChange(item.quantity + 1)}
              aria-label="Tăng số lượng"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        {!compact ? (
          <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
            Tối thiểu {minQuantity}, tồn kho {maxQuantity} {item.variant.unit ?? ""}
          </div>
        ) : null}
      </div>
    </article>
  );
}
