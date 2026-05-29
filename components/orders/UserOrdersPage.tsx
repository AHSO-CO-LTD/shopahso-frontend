"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ClipboardList, Eye, Filter, PackageSearch, RefreshCw, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import AccountNavigation from "@/components/account/AccountNavigation";
import { formatCartMoney } from "@/components/cart/cart-format";
import {
  formatOrderDate,
  getFulfillmentStatusLabel,
  getOrderStatusLabel,
  getPaymentStatusLabel,
} from "@/components/orders/order-display";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listMyOrders } from "@/lib/api/services/checkout.service";
import type { CheckoutOrder } from "@/lib/checkout/types";

const statusFilters = [
  { label: "Tất cả", value: "ALL" },
  { label: "Chờ thanh toán", value: "PENDING_PAYMENT" },
  { label: "Kiểm tra thanh toán", value: "PAYMENT_REVIEW" },
  { label: "Đã xác nhận", value: "CONFIRMED" },
  { label: "Đang xử lý", value: "PROCESSING" },
  { label: "Sẵn sàng giao", value: "READY_TO_SHIP" },
  { label: "Đang giao", value: "SHIPPING" },
  { label: "Hoàn tất", value: "COMPLETED" },
  { label: "Đã hủy", value: "CANCELLED" },
  { label: "Bị từ chối", value: "REJECTED" },
] as const;

export default function UserOrdersPage() {
  const router = useRouter();
  const { isInitializing, profile } = useAuth();
  const [orders, setOrders] = useState<CheckoutOrder[]>([]);
  const [activeStatus, setActiveStatus] = useState<(typeof statusFilters)[number]["value"]>("ALL");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await listMyOrders(activeStatus === "ALL" ? undefined : activeStatus);
      setOrders(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải danh sách đơn hàng.";
      setErrorMessage(message);
      setOrders([]);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [activeStatus]);

  useEffect(() => {
    if (!isInitializing && !profile) {
      router.replace("/dang-nhap");
    }
  }, [isInitializing, profile, router]);

  useEffect(() => {
    if (!profile?.id) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadOrders();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadOrders, profile?.id]);

  const summary = useMemo(() => {
    const totalAmount = orders.reduce((total, order) => total + Number(order.grandTotalAmount ?? 0), 0);
    const unpaidCount = orders.filter((order) => order.paymentStatus !== "PAID").length;

    return {
      totalAmount,
      unpaidCount,
    };
  }, [orders]);

  const activeStatusLabel = useMemo(
    () => statusFilters.find((filter) => filter.value === activeStatus)?.label ?? "Tất cả",
    [activeStatus],
  );

  if (isInitializing || !profile) {
    return (
      <main className="border-t border-border bg-background">
        <section className="container mx-auto px-3 py-6 sm:px-4 sm:py-10 lg:py-12">
          <OrderListSkeleton />
        </section>
      </main>
    );
  }

  return (
    <main className="border-t border-border bg-background">
      <section className="container mx-auto px-3 py-6 sm:px-4 sm:py-10 lg:py-12">
        <header className="mb-5 flex items-end justify-between gap-3 sm:mb-8 sm:flex-wrap sm:gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Tài khoản người dùng
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">Đơn hàng của tôi</h1>
          </div>
          <Button
            className="h-9 shrink-0 cursor-pointer px-3 text-xs font-semibold sm:h-10 sm:px-4 sm:text-sm"
            disabled={isLoading}
            onClick={() => void loadOrders()}
            type="button"
            variant="outline"
          >
            <RefreshCw className="size-4" />
            <span className="hidden sm:inline">Làm mới</span>
          </Button>
        </header>
        <AccountNavigation />

        <section className="mb-4 grid grid-cols-3 gap-2 sm:mb-6 sm:gap-3">
          <Metric label="Tổng đơn" value={String(orders.length)} />
          <Metric label="Chưa thanh toán" value={String(summary.unpaidCount)} />
          <Metric label="Tổng giá trị" value={formatCartMoney(summary.totalAmount)} />
        </section>

        <section className="mb-4 sm:mb-6">
          <Button
            className="h-10 w-full cursor-pointer justify-between rounded-none px-3 text-xs font-semibold sm:hidden"
            onClick={() => setIsFilterOpen((current) => !current)}
            type="button"
            variant="outline"
            aria-expanded={isFilterOpen}
          >
            <span className="inline-flex min-w-0 items-center gap-2">
              <Filter className="size-4 shrink-0" />
              <span className="truncate">Lọc: {activeStatusLabel}</span>
            </span>
            <span className="font-mono text-[11px]">{isFilterOpen ? "Ẩn" : "Mở"}</span>
          </Button>
          <div className={`${isFilterOpen ? "grid" : "hidden"} mt-2 grid-cols-2 gap-2 sm:mt-0 sm:flex sm:flex-wrap`}>
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={[
                  "inline-flex h-9 cursor-pointer items-center justify-center border px-2 text-center text-[11px] font-semibold transition-colors hover:border-primary hover:text-primary sm:px-3 sm:text-xs",
                  activeStatus === filter.value ? "border-primary bg-primary text-primary-foreground hover:text-primary-foreground" : "border-border bg-background",
                ].join(" ")}
                onClick={() => {
                  setActiveStatus(filter.value);
                  setIsFilterOpen(false);
                }}
              >
                <span className="truncate">{filter.label}</span>
              </button>
            ))}
          </div>
        </section>

        {isLoading ? (
          <OrderListSkeleton />
        ) : errorMessage ? (
          <ErrorState message={errorMessage} onRetry={() => void loadOrders()} />
        ) : orders.length === 0 ? (
          <EmptyState />
        ) : (
          <section className="overflow-x-auto border border-border bg-background">
            <div className="hidden min-w-[1470px] grid-cols-[180px_320px_190px_250px_180px_140px_110px] gap-3 border-b border-border bg-muted/20 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground lg:grid">
              <span>Mã đơn</span>
              <span>Thông tin</span>
              <span>Trạng thái</span>
              <span>Thanh toán</span>
              <span>Giao hàng</span>
              <span>Tổng tiền</span>
              <span className="text-right">Thao tác</span>
            </div>
            <div className="divide-y divide-border">
              {orders.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border border-border bg-muted/10 p-2 sm:p-4">
      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:text-xs sm:tracking-[0.12em]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black tracking-tight sm:mt-2 sm:text-2xl">{value}</p>
    </div>
  );
}

function OrderRow({ order }: { order: CheckoutOrder }) {
  return (
    <article>
      <Link
        href={`/tai-khoan/don-hang/${order.id}`}
        className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-3 py-3 transition-colors hover:bg-muted/30 lg:hidden"
      >
        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-black">{order.orderCode}</p>
          <StatusBadge label={getOrderStatusLabel(order.status)} compact />
        </div>
        <p className="self-center whitespace-nowrap text-sm font-black text-primary">{formatCartMoney(order.grandTotalAmount)}</p>
      </Link>

      <div className="hidden gap-3 px-4 py-4 lg:grid lg:min-w-[1470px] lg:grid-cols-[180px_320px_190px_250px_180px_140px_110px] lg:items-center">
        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-black">{order.orderCode}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{formatOrderDate(order.createdAt)}</p>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{order.customerName || order.customerEmail}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{order.items?.length ?? 0} sản phẩm</p>
        </div>
        <StatusBadge label={getOrderStatusLabel(order.status)} />
        <StatusBadge label={getPaymentStatusLabel(order.paymentStatus)} />
        <StatusBadge label={getFulfillmentStatusLabel(order.fulfillmentStatus)} />
        <p className="whitespace-nowrap text-sm font-black text-primary">{formatCartMoney(order.grandTotalAmount)}</p>
        <div className="flex justify-end">
          <Button asChild className="h-9 cursor-pointer px-3 text-xs font-semibold" variant="outline">
            <Link href={`/tai-khoan/don-hang/${order.id}`}>
              <Eye className="size-4" />
              Chi tiết
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ compact = false, label }: { compact?: boolean; label: string }) {
  return (
    <span
      className={[
        "inline-flex w-fit max-w-full items-center truncate whitespace-nowrap border border-border bg-muted/20 font-semibold",
        compact ? "mt-1 h-6 px-2 text-[11px]" : "h-8 px-2.5 text-xs",
      ].join(" ")}
    >
      {label}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="grid min-h-80 place-items-center border border-border bg-background p-8 text-center">
      <div>
        <PackageSearch className="mx-auto size-11 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-black tracking-tight">Chưa có đơn hàng</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Khi bạn hoàn tất checkout, đơn hàng sẽ xuất hiện tại đây để theo dõi lại.
        </p>
        <Button asChild className="mt-5 h-10 px-4 text-sm font-semibold">
          <Link href="/san-pham">
            <ShoppingCart className="size-4" />
            Mua hàng
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="border border-destructive bg-destructive/10 p-5 text-sm text-destructive">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-semibold">
          <AlertCircle className="size-4" />
          {message}
        </p>
        <Button className="h-9 px-3 text-xs font-semibold" onClick={onRetry} type="button" variant="outline">
          Thử lại
        </Button>
      </div>
    </div>
  );
}

function OrderListSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={`order-skeleton-${index}`} className="border border-border p-3 sm:p-4">
          <div className="flex items-start gap-4">
            <ClipboardList className="mt-1 size-5 text-muted-foreground" />
            <div className="grid flex-1 gap-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-64 max-w-full" />
              <Skeleton className="h-3 w-44" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
