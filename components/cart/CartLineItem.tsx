"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/cart/CartProvider";
import { formatCartMoney, formatTaxSource } from "@/components/cart/cart-format";
import type { CartItem } from "@/lib/cart/types";

export function CartLineItem({ item, compact = false }: { item: CartItem; compact?: boolean }) {
  const { isMutating, removeItem, updateQuantity } = useCart();
  const minQuantity = item.minOrderQuantity;
  const maxQuantity = item.stockQuantity;
  const canEditQuantity = !isMutating && item.available;
  const imageUrl = item.snapshot.imageUrl || item.variant.imageUrls?.[0];

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
    <article className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 border border-border bg-background p-3">
      <Link
        href={`/san-pham/${item.variant.slug}`}
        className="relative aspect-square overflow-hidden border border-border bg-muted/20"
        aria-label={`Xem ${item.variant.name}`}
      >
        {imageUrl ? (
          <Image
            alt={item.variant.name}
            className="object-cover"
            fill
            sizes="88px"
            src={imageUrl}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Chưa có ảnh
          </div>
        )}
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
          {item.priceChanged ? (
            <span className="border border-secondary bg-secondary/30 px-2 py-1 text-[11px] font-semibold text-foreground">
              Giá đã thay đổi
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Giá hiện tại</p>
            <p className="text-base font-black text-primary">{formatCartMoney(item.current.effectivePrice)}</p>
            {item.current.tax ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Thuế {item.current.tax.percent}%:{" "}
                <span className="font-semibold text-foreground">{formatCartMoney(item.current.tax.amount)}</span>
                {" "}({formatTaxSource(item.current.tax.source)})
              </p>
            ) : null}
            {item.current.totalWithTax ? (
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
