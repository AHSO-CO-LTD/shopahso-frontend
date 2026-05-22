"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RefreshCw, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { CartSummaryPanel } from "@/components/cart/CartSummaryPanel";
import { buildCartSummaryFromItems, getAvailableCartItemIds, getSelectedCartItems } from "@/components/cart/cart-selection";
import { Skeleton } from "@/components/ui/skeleton";

export function CartContent({ compact = false }: { compact?: boolean }) {
  const { cart, errorMessage, isLoading, refreshCart } = useCart();
  const [selectedItemIdsDraft, setSelectedItemIdsDraft] = useState<string[]>([]);
  const availableItemIds = useMemo(() => (cart ? getAvailableCartItemIds(cart) : []), [cart]);
  const selectedItemIds = useMemo(
    () => selectedItemIdsDraft.filter((itemId) => availableItemIds.includes(itemId)),
    [availableItemIds, selectedItemIdsDraft],
  );
  const selectedItems = useMemo(() => (cart ? getSelectedCartItems(cart, selectedItemIds) : []), [cart, selectedItemIds]);
  const selectedSummary = useMemo(() => buildCartSummaryFromItems(selectedItems), [selectedItems]);
  const isAllAvailableSelected = availableItemIds.length > 0 && availableItemIds.every((itemId) => selectedItemIds.includes(itemId));

  function updateSelectedItem(itemId: string, selected: boolean) {
    setSelectedItemIdsDraft((current) => {
      if (selected) {
        return current.includes(itemId) ? current : [...current, itemId];
      }

      return current.filter((currentItemId) => currentItemId !== itemId);
    });
  }

  function toggleAllAvailableItems() {
    setSelectedItemIdsDraft(isAllAvailableSelected ? [] : availableItemIds);
  }

  if (isLoading && !cart) {
    return <CartContentSkeleton compact={compact} />;
  }

  if (errorMessage && !cart) {
    return (
      <div className="border border-destructive bg-destructive/10 p-5 text-sm text-destructive">
        <p className="font-semibold">{errorMessage}</p>
        <button
          type="button"
          className="mt-4 inline-flex h-9 items-center gap-2 border border-destructive px-3 text-xs font-semibold transition-colors hover:bg-destructive/10"
          onClick={() => void refreshCart()}
        >
          <RefreshCw className="size-4" />
          Tải lại giỏ hàng
        </button>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center border border-border bg-background p-8 text-center">
        <ShoppingCart className="size-10 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-black tracking-tight">Giỏ hàng đang trống</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Chọn linh kiện từ danh sách sản phẩm để bắt đầu tạo đơn hàng.
        </p>
        <Link
          href="/san-pham"
          className="mt-5 inline-flex h-10 items-center justify-center border border-primary bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Xem sản phẩm
        </Link>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="grid gap-4">
        <div className="grid max-h-[48dvh] gap-3 overflow-y-auto pr-1">
          {cart.items.map((item) => (
            <CartLineItem
              key={item.id}
              item={item}
              compact
              isSelected={selectedItemIds.includes(item.id)}
              onSelectedChange={updateSelectedItem}
              selectable
            />
          ))}
        </div>
        <CartSummaryPanel
          cart={cart}
          selectedItemIds={selectedItemIds}
          selectedItems={selectedItems}
          selectedSummary={selectedSummary}
          showCartLink
        />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="grid content-start gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-background p-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold">
            <input
              checked={isAllAvailableSelected}
              className="size-4 cursor-pointer accent-primary disabled:cursor-not-allowed"
              disabled={availableItemIds.length === 0}
              onChange={toggleAllAvailableItems}
              type="checkbox"
            />
            Chọn tất cả sản phẩm khả dụng
          </label>
          <p className="text-xs font-semibold text-muted-foreground">
            Đã chọn {selectedItems.length}/{cart.items.length} dòng sản phẩm
          </p>
        </div>
        {cart.items.map((item) => (
          <CartLineItem
            key={item.id}
            item={item}
            isSelected={selectedItemIds.includes(item.id)}
            onSelectedChange={updateSelectedItem}
            selectable
          />
        ))}
      </section>
      <CartSummaryPanel cart={cart} selectedItemIds={selectedItemIds} selectedItems={selectedItems} selectedSummary={selectedSummary} />
    </div>
  );
}

function CartContentSkeleton({ compact }: { compact: boolean }) {
  return (
    <div className={compact ? "grid gap-3" : "grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"}>
      <div className="grid gap-3">
        {Array.from({ length: compact ? 2 : 3 }).map((_, index) => (
          <div key={`cart-skeleton-${index}`} className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 border border-border p-3">
            <Skeleton className="aspect-square w-full" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-9 w-36" />
            </div>
          </div>
        ))}
      </div>
      {!compact ? (
        <div className="border border-border p-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-8 w-40" />
          <Skeleton className="mt-6 h-10 w-full" />
        </div>
      ) : null}
    </div>
  );
}
