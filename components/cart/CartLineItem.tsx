"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { formatCartMoney } from "@/components/cart/cart-format";
import { getCartItemPricing, hasCartItemUnitPriceChanged } from "@/components/cart/cart-pricing";
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
  const pricing = getCartItemPricing(item);
  const unitPriceChanged = hasCartItemUnitPriceChanged(item);
  const totalPrice = pricing.totalWithTax;
  const taxPercent = item.current.tax?.percent ?? "0";
  const stockLabel = `${maxQuantity} ${item.variant.unit ?? ""}`.trim();

  function handleQuantityChange(nextQuantity: number) {
    if (nextQuantity < minQuantity) {
      return;
    }

    if (nextQuantity > maxQuantity) {
      return;
    }

    if (nextQuantity === item.quantity) {
      return;
    }

    void updateQuantity(item.id, nextQuantity);
  }

  if (compact) {
    return (
      <article className="grid grid-cols-[auto_56px_minmax(0,1fr)_auto] items-start gap-3 border border-border bg-background p-3">
        {selectable ? (
          <label className="mt-0.5 inline-flex size-7 cursor-pointer items-center justify-center border border-border transition-colors hover:border-primary hover:bg-muted/30 has-disabled:cursor-not-allowed has-disabled:opacity-50">
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
          className="relative size-14 overflow-hidden border border-border bg-muted/20"
          aria-label={`Xem ${item.variant.name}`}
        >
          <Image
            alt={item.variant.name}
            className={isFallbackImage ? "object-contain p-2" : "object-cover"}
            fill
            sizes="56px"
            src={imageUrl}
          />
        </Link>

        <div className="min-w-0">
          <Link
            href={`/san-pham/${item.variant.slug}`}
            className="line-clamp-2 text-sm font-bold leading-5 transition-colors hover:text-primary"
          >
            {item.variant.name}
          </Link>
          <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">SKU: {item.variant.sku}</p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className="min-w-0">
              {!requiresQuote && pricing.isDiscounted && pricing.originalUnitPrice !== null ? (
                <p className="truncate text-[11px] font-semibold text-muted-foreground">
                  <span className="line-through">{formatCartMoney(pricing.originalUnitPrice)}</span>
                  {pricing.discountPercent !== null ? (
                    <span className="ml-1 font-black text-red-700">-{pricing.discountPercent}%</span>
                  ) : null}
                </p>
              ) : null}
              <p className={`text-base font-black leading-none ${pricing.isDiscounted ? "text-red-700" : "text-primary"}`}>
                {requiresQuote ? "Liên hệ báo giá" : formatCartMoney(totalPrice)}
              </p>
            </div>
            {!requiresQuote ? (
              <span className="border border-border bg-muted/20 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                Đã kèm {taxPercent}% thuế
              </span>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-muted-foreground">
            <span>
              Tồn kho: <span className="font-semibold text-foreground">{stockLabel}</span>
            </span>
            {!item.available ? <span className="font-semibold text-destructive">Không khả dụng</span> : null}
            {requiresQuote ? <span className="font-semibold text-foreground">Cần báo giá</span> : null}
            {unitPriceChanged ? <span className="font-semibold text-foreground">Giá đã thay đổi</span> : null}
          </div>

          <QuantityStepper
            canEditQuantity={canEditQuantity}
            isMutating={isMutating}
            itemId={item.id}
            maxQuantity={maxQuantity}
            minQuantity={minQuantity}
            onQuantityChange={handleQuantityChange}
            quantity={item.quantity}
            size="compact"
          />
        </div>

        <button
          type="button"
          className="inline-flex size-7 shrink-0 items-center justify-center border border-border text-destructive transition-colors hover:border-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={isMutating}
          onClick={() => void removeItem(item.id)}
          aria-label={`Xóa ${item.variant.name}`}
        >
          <Trash2 className="size-3.5" />
        </button>
      </article>
    );
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
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(150px,190px)_auto] md:items-start md:gap-5">
          <div className="min-w-0">
            <Link
              href={`/san-pham/${item.variant.slug}`}
              className="line-clamp-2 text-sm font-bold leading-5 transition-colors hover:text-primary"
            >
              {item.variant.name}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="font-mono">SKU: {item.variant.sku}</span>
              <span>Xuất xứ: {item.variant.originCountryCode ?? "Chưa có"}</span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
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
              {unitPriceChanged ? (
                <span className="border border-yellow-500 bg-yellow-50 px-2 py-1 text-[11px] font-semibold text-foreground">
                  Giá đã thay đổi
                </span>
              ) : null}
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Tối thiểu {minQuantity}, tồn kho {stockLabel}
            </p>
          </div>

          <div className="min-w-0 md:text-right">
            {!requiresQuote && pricing.isDiscounted && pricing.originalUnitPrice !== null ? (
              <p className="text-xs font-semibold text-muted-foreground md:whitespace-nowrap">
                <span className="line-through">{formatCartMoney(pricing.originalUnitPrice)}</span>
                {pricing.discountPercent !== null ? (
                  <span className="ml-1 font-black text-red-700">-{pricing.discountPercent}%</span>
                ) : null}
              </p>
            ) : null}
            <p className={`text-base font-black md:whitespace-nowrap ${pricing.isDiscounted ? "text-red-700" : "text-primary"}`}>
              {requiresQuote ? "Liên hệ báo giá" : formatCartMoney(pricing.unitPrice)}
            </p>
            {!requiresQuote && item.current.tax ? (
              <p className="mt-1 text-xs text-muted-foreground md:whitespace-nowrap">
                Thuế {item.current.tax.percent}%:{" "}
                <span className="font-semibold text-foreground">{formatCartMoney(pricing.unitTaxAmount)}</span>
              </p>
            ) : null}
            {unitPriceChanged ? (
              <p className="text-xs text-muted-foreground md:whitespace-nowrap">
                Lúc thêm: {formatCartMoney(item.snapshot.effectivePrice)}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 md:min-h-24 md:flex-col md:items-end">
            <button
              type="button"
              className="inline-flex size-8 shrink-0 items-center justify-center border border-border text-destructive transition-colors hover:border-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={isMutating}
              onClick={() => void removeItem(item.id)}
              aria-label={`Xóa ${item.variant.name}`}
            >
              <Trash2 className="size-4" />
            </button>

            <QuantityStepper
              canEditQuantity={canEditQuantity}
              isMutating={isMutating}
              itemId={item.id}
              maxQuantity={maxQuantity}
              minQuantity={minQuantity}
              onQuantityChange={handleQuantityChange}
              quantity={item.quantity}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function QuantityStepper({
  canEditQuantity,
  isMutating,
  itemId,
  maxQuantity,
  minQuantity,
  onQuantityChange,
  quantity,
  size = "default",
}: {
  canEditQuantity: boolean;
  isMutating: boolean;
  itemId: string;
  maxQuantity: number;
  minQuantity: number;
  onQuantityChange: (nextQuantity: number) => void;
  quantity: number;
  size?: "default" | "compact";
}) {
  const [inputFeedback, setInputFeedback] = useState<string | null>(null);
  const buttonSizeClass = size === "compact" ? "size-7" : "size-9";
  const inputSizeClass = size === "compact" ? "h-7 w-10 text-xs" : "h-9 w-14 text-sm";
  const iconSizeClass = size === "compact" ? "size-3.5" : "size-4";
  const isAtMinQuantity = quantity <= minQuantity;
  const isAtMaxQuantity = quantity >= maxQuantity;
  const quantityFeedback = useMemo(() => {
    if (!canEditQuantity) {
      return null;
    }

    if (isAtMaxQuantity) {
      return `Đã đạt số lượng tối đa.`;
    }

    if (isAtMinQuantity && minQuantity > 1) {
      return `Số lượng đặt tối thiểu là ${minQuantity}.`;
    }

    return null;
  }, [canEditQuantity, isAtMaxQuantity, isAtMinQuantity, minQuantity]);

  function showInputFeedback(message: string) {
    setInputFeedback(message);
    window.setTimeout(() => {
      setInputFeedback((currentMessage) => (currentMessage === message ? null : currentMessage));
    }, 1800);
  }

  return (
    <div className={size === "compact" ? "mt-2" : ""}>
      <div className="flex w-fit items-center border border-border">
        <button
          type="button"
          className={`inline-flex ${buttonSizeClass} items-center justify-center transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40`}
          disabled={!canEditQuantity || isAtMinQuantity}
          onClick={() => onQuantityChange(quantity - 1)}
          aria-label="Giảm số lượng"
        >
          <Minus className={iconSizeClass} />
        </button>
        <input
          key={`${itemId}-${quantity}`}
          aria-invalid={Boolean(inputFeedback)}
          className={`input-no-spin border-x border-border bg-background text-center font-semibold outline-none focus:bg-muted/30 ${inputSizeClass}`}
          disabled={isMutating}
          min={minQuantity}
          max={maxQuantity}
          onBlur={(event) => {
            const nextQuantity = Number(event.currentTarget.value);
            if (!Number.isInteger(nextQuantity)) {
              event.currentTarget.value = String(quantity);
              showInputFeedback("Vui lòng nhập số lượng hợp lệ.");
              return;
            }
            if (nextQuantity < minQuantity) {
              event.currentTarget.value = String(quantity);
              showInputFeedback(`Số lượng đặt tối thiểu là ${minQuantity}.`);
              return;
            }
            if (nextQuantity > maxQuantity) {
              event.currentTarget.value = String(quantity);
              showInputFeedback(`Tối đa ${maxQuantity} sản phẩm trong kho.`);
              return;
            }
            setInputFeedback(null);
            onQuantityChange(nextQuantity);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          type="number"
          defaultValue={quantity}
          aria-label="Số lượng"
        />
        <button
          type="button"
          className={`inline-flex ${buttonSizeClass} items-center justify-center transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40`}
          disabled={!canEditQuantity || isAtMaxQuantity}
          onClick={() => onQuantityChange(quantity + 1)}
          aria-label="Tăng số lượng"
        >
          <Plus className={iconSizeClass} />
        </button>
      </div>
      {inputFeedback || quantityFeedback ? (
        <p className="mt-1 max-w-44 text-[11px] font-semibold leading-4 text-muted-foreground">
          {inputFeedback ?? quantityFeedback}
        </p>
      ) : null}
    </div>
  );
}
