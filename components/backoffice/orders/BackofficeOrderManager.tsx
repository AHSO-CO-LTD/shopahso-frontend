"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  formatOrderDate,
  getFulfillmentStatusLabel,
  getOrderStatusLabel,
  getPaymentStatusLabel,
} from "@/components/orders/order-display";
import {
  FULFILLMENT_STATUS_OPTIONS,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  formatBackofficeMoney,
} from "@/components/backoffice/orders/backoffice-order-utils";
import {
  listBackofficeOrders,
  type BackofficeOrderFilters,
} from "@/lib/api/services/backoffice-orders.service";
import type { CheckoutOrder } from "@/lib/checkout/types";

export function BackofficeOrderManager() {
  const router = useRouter();
  const [orders, setOrders] = useState<CheckoutOrder[]>([]);
  const [filters, setFilters] = useState<BackofficeOrderFilters>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const metrics = useMemo(
    () => ({
      paid: orders.filter((order) => order.paymentStatus === "PAID").length,
      review: orders.filter((order) => ["PENDING_PAYMENT", "PAYMENT_REVIEW"].includes(order.status)).length,
      total: orders.length,
    }),
    [orders],
  );

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await listBackofficeOrders(filters);
      setOrders(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải danh sách đơn hàng.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadOrders();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadOrders]);

  function openOrder(orderId: string) {
    router.push(`/nhan-vien/don-hang/${orderId}`);
  }

  return (
    <div className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Nhân viên
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Quản lý đơn hàng</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Theo dõi đơn, mở chi tiết để xem thông tin người nhận, sản phẩm, thanh toán và xử lý trạng thái.
          </p>
        </div>

        <Button
          className="h-10 cursor-pointer rounded-none px-3 text-sm font-semibold"
          disabled={isLoading}
          onClick={() => void loadOrders()}
          type="button"
          variant="outline"
        >
          <RefreshCw className="size-4" />
          Tải lại
        </Button>
      </header>

      <section className="mb-4 grid gap-3 md:grid-cols-3">
        <Metric label="Tổng đơn" value={String(metrics.total)} />
        <Metric label="Chờ đối soát" value={String(metrics.review)} />
        <Metric label="Đã thanh toán" value={String(metrics.paid)} />
      </section>

      <section className="mb-4 grid gap-3 border border-border bg-background p-3 lg:grid-cols-3">
        <FilterSelect
          getLabel={getOrderStatusLabel}
          label="Trạng thái đơn"
          onChange={(value) => setFilters((current) => ({ ...current, status: value || undefined }))}
          options={ORDER_STATUS_OPTIONS}
          value={filters.status ?? ""}
        />
        <FilterSelect
          getLabel={getPaymentStatusLabel}
          label="Thanh toán"
          onChange={(value) => setFilters((current) => ({ ...current, paymentStatus: value || undefined }))}
          options={PAYMENT_STATUS_OPTIONS}
          value={filters.paymentStatus ?? ""}
        />
        <FilterSelect
          getLabel={getFulfillmentStatusLabel}
          label="Giao hàng"
          onChange={(value) => setFilters((current) => ({ ...current, fulfillmentStatus: value || undefined }))}
          options={FULFILLMENT_STATUS_OPTIONS}
          value={filters.fulfillmentStatus ?? ""}
        />
      </section>

      <section className="border border-border bg-background">
        <div className="border-b border-border px-4 py-3 md:px-5">
          <h2 className="text-base font-black tracking-tight">Danh sách đơn</h2>
          <p className="mt-1 text-xs text-muted-foreground">Nhấn vào một đơn để xem chi tiết và thao tác xử lý.</p>
        </div>

        {isLoading ? (
          <OrderListSkeleton />
        ) : errorMessage ? (
          <div className="p-5 text-sm text-destructive">{errorMessage}</div>
        ) : orders.length === 0 ? (
          <div className="p-5 text-sm text-muted-foreground">Không có đơn hàng phù hợp với bộ lọc hiện tại.</div>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((order) => (
              <button
                className="grid w-full cursor-pointer gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/20 focus-visible:bg-muted/20 focus-visible:outline-none md:grid-cols-[minmax(220px,1.35fr)_minmax(150px,1fr)_minmax(150px,1fr)_minmax(120px,0.8fr)] md:items-center"
                key={order.id}
                onClick={() => openOrder(order.id)}
                type="button"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm font-black">{order.orderCode}</p>
                  <p className="mt-1 truncate text-sm font-semibold">{order.customerName || order.customerEmail}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatOrderDate(order.createdAt)}</p>
                </div>
                <StatusBlock label="Trạng thái đơn" value={getOrderStatusLabel(order.status)} />
                <StatusBlock label="Thanh toán" value={getPaymentStatusLabel(order.paymentStatus)} />
                <div className="text-sm font-black md:text-right">{formatBackofficeMoney(order.grandTotalAmount)}</div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-background p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function FilterSelect({
  getLabel,
  label,
  onChange,
  options,
  value,
}: {
  getLabel: (value: string) => string;
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      <select
        className="h-10 cursor-pointer border border-border bg-background px-3 outline-none transition-colors hover:border-primary focus:border-primary"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">Tất cả</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {getLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function OrderListSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(220px,1.35fr)_minmax(150px,1fr)_minmax(150px,1fr)_minmax(120px,0.8fr)]" key={index}>
          <div className="h-14 animate-pulse bg-muted" />
          <div className="h-10 animate-pulse bg-muted" />
          <div className="h-10 animate-pulse bg-muted" />
          <div className="h-10 animate-pulse bg-muted" />
        </div>
      ))}
    </div>
  );
}
