"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Ban,
  ClipboardCheck,
  CreditCard,
  FileText,
  RefreshCw,
  Truck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  formatOrderDate,
  getFulfillmentStatusLabel,
  getOrderStatusLabel,
  getPaymentStatusLabel,
} from "@/components/orders/order-display";
import {
  cancelBackofficeOrder,
  confirmBackofficeOrderPayment,
  listBackofficeOrders,
  rejectBackofficeOrder,
  rejectBackofficeOrderPayment,
  updateBackofficeOrderFulfillment,
  updateBackofficeOrderStaffNote,
  type BackofficeOrderFilters,
} from "@/lib/api/services/backoffice-orders.service";
import type { CheckoutOrder } from "@/lib/checkout/types";

type ActionKey =
  | "reject"
  | "cancel"
  | "confirm-payment"
  | "reject-payment"
  | "staff-note"
  | "fulfillment";

type ActionDraft = {
  fulfillmentStatus: string;
  reason: string;
  staffNote: string;
};

const ORDER_STATUS_OPTIONS = [
  "PENDING_PAYMENT",
  "PAYMENT_REVIEW",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "READY_TO_SHIP",
  "SHIPPING",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
];

const PAYMENT_STATUS_OPTIONS = [
  "WAITING_CUSTOMER_TRANSFER",
  "CUSTOMER_CONFIRMED",
  "UNPAID",
  "PENDING",
  "PAID",
  "REJECTED",
  "FAILED",
  "REFUNDED",
];

const FULFILLMENT_STATUS_OPTIONS = [
  "NOT_STARTED",
  "UNFULFILLED",
  "PROCESSING",
  "READY_TO_SHIP",
  "SHIPPING",
  "SHIPPED",
  "DELIVERED",
  "FAILED",
  "RETURNED",
  "CANCELLED",
];

const STAFF_FULFILLMENT_OPTIONS = [
  "PROCESSING",
  "READY_TO_SHIP",
  "SHIPPING",
  "DELIVERED",
  "FAILED",
  "RETURNED",
];

const TERMINAL_ORDER_STATUSES = ["COMPLETED", "CANCELLED", "REJECTED"];
const PAYMENT_REVIEWABLE_ORDER_STATUSES = ["PENDING_PAYMENT", "PAYMENT_REVIEW"];
const PAYMENT_REVIEWABLE_PAYMENT_STATUSES = ["WAITING_CUSTOMER_TRANSFER", "CUSTOMER_CONFIRMED"];

function formatMoney(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(Number.isFinite(amount) ? amount : 0);
}

function canConfirmPayment(order: CheckoutOrder) {
  return (
    PAYMENT_REVIEWABLE_ORDER_STATUSES.includes(order.status) &&
    PAYMENT_REVIEWABLE_PAYMENT_STATUSES.includes(order.paymentStatus)
  );
}

function canRejectPayment(order: CheckoutOrder) {
  return (
    PAYMENT_REVIEWABLE_ORDER_STATUSES.includes(order.status) &&
    PAYMENT_REVIEWABLE_PAYMENT_STATUSES.includes(order.paymentStatus)
  );
}

function canRejectOrder(order: CheckoutOrder) {
  return order.paymentStatus !== "PAID" && !TERMINAL_ORDER_STATUSES.includes(order.status);
}

function canCancelOrder(order: CheckoutOrder) {
  return (
    order.paymentStatus !== "PAID" &&
    !TERMINAL_ORDER_STATUSES.includes(order.status) &&
    order.status !== "SHIPPING"
  );
}

function canUpdateFulfillment(order: CheckoutOrder) {
  return order.paymentStatus === "PAID" && !TERMINAL_ORDER_STATUSES.includes(order.status);
}

function getActionTitle(action: ActionKey) {
  switch (action) {
    case "reject":
      return "Từ chối đơn hàng";
    case "cancel":
      return "Hủy đơn hàng";
    case "confirm-payment":
      return "Xác nhận thanh toán";
    case "reject-payment":
      return "Từ chối thanh toán";
    case "staff-note":
      return "Ghi chú nội bộ";
    case "fulfillment":
      return "Cập nhật giao hàng";
    default:
      return "Cập nhật đơn hàng";
  }
}

function getActionToast(action: ActionKey) {
  switch (action) {
    case "reject":
      return "Đã từ chối đơn hàng.";
    case "cancel":
      return "Đã hủy đơn hàng.";
    case "confirm-payment":
      return "Đã xác nhận thanh toán.";
    case "reject-payment":
      return "Đã từ chối thanh toán.";
    case "staff-note":
      return "Đã cập nhật ghi chú nội bộ.";
    case "fulfillment":
      return "Đã cập nhật giao hàng.";
    default:
      return "Đã cập nhật đơn hàng.";
  }
}

function getInitialDraft(order: CheckoutOrder, action: ActionKey): ActionDraft {
  return {
    fulfillmentStatus: action === "fulfillment" ? order.fulfillmentStatus : "PROCESSING",
    reason: "",
    staffNote: order.staffNote ?? "",
  };
}

export function BackofficeOrderManager() {
  const [orders, setOrders] = useState<CheckoutOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [filters, setFilters] = useState<BackofficeOrderFilters>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeAction, setActiveAction] = useState<ActionKey | null>(null);
  const [actionDraft, setActionDraft] = useState<ActionDraft>({
    fulfillmentStatus: "PROCESSING",
    reason: "",
    staffNote: "",
  });

  const selectedOrder = useMemo(() => {
    if (orders.length === 0) {
      return null;
    }

    return orders.find((order) => order.id === selectedOrderId) ?? orders[0];
  }, [orders, selectedOrderId]);

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
      setSelectedOrderId((currentId) => {
        if (response.some((order) => order.id === currentId)) {
          return currentId;
        }

        return response[0]?.id ?? "";
      });
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

  function syncOrder(nextOrder: CheckoutOrder) {
    setOrders((currentOrders) =>
      currentOrders.map((order) => (order.id === nextOrder.id ? nextOrder : order)),
    );
    setSelectedOrderId(nextOrder.id);
  }

  function openAction(action: ActionKey) {
    if (!selectedOrder) {
      toast.warning("Vui lòng chọn đơn hàng cần xử lý.");
      return;
    }

    setActionDraft(getInitialDraft(selectedOrder, action));
    setActiveAction(action);
  }

  async function handleActionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedOrder || !activeAction) {
      toast.warning("Vui lòng chọn đơn hàng và thao tác cần xử lý.");
      return;
    }

    if (["reject", "cancel", "reject-payment"].includes(activeAction) && !actionDraft.reason.trim()) {
      toast.warning("Vui lòng nhập lý do xử lý.");
      return;
    }

    if (activeAction === "fulfillment" && !actionDraft.fulfillmentStatus) {
      toast.warning("Vui lòng chọn trạng thái giao hàng.");
      return;
    }

    const loadingToastId = toast.loading("Đang cập nhật đơn hàng...");

    try {
      setIsSubmitting(true);

      const notePayload = { staffNote: actionDraft.staffNote.trim() || undefined };
      const reasonPayload = {
        reason: actionDraft.reason.trim(),
        staffNote: actionDraft.staffNote.trim() || undefined,
      };

      const nextOrder =
        activeAction === "reject"
          ? await rejectBackofficeOrder(selectedOrder.id, reasonPayload)
          : activeAction === "cancel"
            ? await cancelBackofficeOrder(selectedOrder.id, reasonPayload)
            : activeAction === "confirm-payment"
              ? await confirmBackofficeOrderPayment(selectedOrder.id, notePayload)
              : activeAction === "reject-payment"
                ? await rejectBackofficeOrderPayment(selectedOrder.id, reasonPayload)
                : activeAction === "staff-note"
                  ? await updateBackofficeOrderStaffNote(selectedOrder.id, notePayload)
                  : await updateBackofficeOrderFulfillment(selectedOrder.id, {
                      fulfillmentStatus: actionDraft.fulfillmentStatus,
                      staffNote: actionDraft.staffNote.trim() || undefined,
                    });

      syncOrder(nextOrder);
      toast.success(getActionToast(activeAction), { id: loadingToastId });
      setActiveAction(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật đơn hàng.", {
        id: loadingToastId,
      });
    } finally {
      setIsSubmitting(false);
    }
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
            Đối soát thanh toán, điều phối giao hàng và lưu ghi chú nội bộ theo trạng thái hiện tại.
          </p>
        </div>

        <Button
          className="h-10 px-3 text-sm font-semibold"
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
          label="Trạng thái đơn"
          options={ORDER_STATUS_OPTIONS}
          value={filters.status ?? ""}
          onChange={(value) => setFilters((current) => ({ ...current, status: value || undefined }))}
          getLabel={getOrderStatusLabel}
        />
        <FilterSelect
          label="Thanh toán"
          options={PAYMENT_STATUS_OPTIONS}
          value={filters.paymentStatus ?? ""}
          onChange={(value) => setFilters((current) => ({ ...current, paymentStatus: value || undefined }))}
          getLabel={getPaymentStatusLabel}
        />
        <FilterSelect
          label="Giao hàng"
          options={FULFILLMENT_STATUS_OPTIONS}
          value={filters.fulfillmentStatus ?? ""}
          onChange={(value) => setFilters((current) => ({ ...current, fulfillmentStatus: value || undefined }))}
          getLabel={getFulfillmentStatusLabel}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <div className="border border-border bg-background">
          <div className="border-b border-border px-4 py-3 md:px-5">
            <h2 className="text-base font-black tracking-tight">Danh sách đơn</h2>
            <p className="mt-1 text-xs text-muted-foreground">Chọn một đơn để xem chi tiết và thao tác.</p>
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
                  className={[
                    "grid w-full gap-3 px-4 py-4 text-left transition-colors md:grid-cols-[minmax(0,1fr)_160px_160px_130px]",
                    selectedOrder?.id === order.id ? "bg-muted/30" : "hover:bg-muted/15",
                  ].join(" ")}
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  type="button"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-black">{order.orderCode}</p>
                    <p className="mt-1 truncate text-sm font-semibold">{order.customerName || order.customerEmail}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatOrderDate(order.createdAt)}</p>
                  </div>
                  <StatusBlock label="Đơn" value={getOrderStatusLabel(order.status)} />
                  <StatusBlock label="Thanh toán" value={getPaymentStatusLabel(order.paymentStatus)} />
                  <div className="text-sm font-black">{formatMoney(order.grandTotalAmount)}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="h-fit border border-border bg-background xl:sticky xl:top-4">
          <div className="border-b border-border px-4 py-3 md:px-5">
            <h2 className="text-base font-black tracking-tight">Chi tiết xử lý</h2>
            <p className="mt-1 text-xs text-muted-foreground">Action chỉ hiện khi trạng thái đơn cho phép.</p>
          </div>

          {!selectedOrder ? (
            <div className="p-5 text-sm text-muted-foreground">Chọn một đơn hàng để xử lý.</div>
          ) : (
            <div className="space-y-5 p-4 md:p-5">
              <div>
                <p className="font-mono text-lg font-black">{selectedOrder.orderCode}</p>
                <p className="mt-1 text-sm text-muted-foreground">{selectedOrder.customerEmail}</p>
              </div>

              <dl className="grid gap-2 text-sm">
                <InfoLine label="Khách hàng" value={selectedOrder.customerName || "Chưa có dữ liệu"} />
                <InfoLine label="Điện thoại" value={selectedOrder.customerPhone || "Chưa có dữ liệu"} />
                <InfoLine label="Tổng tiền" value={formatMoney(selectedOrder.grandTotalAmount)} />
                <InfoLine label="Thanh toán" value={getPaymentStatusLabel(selectedOrder.paymentStatus)} />
                <InfoLine label="Giao hàng" value={getFulfillmentStatusLabel(selectedOrder.fulfillmentStatus)} />
                <InfoLine label="Cập nhật" value={formatOrderDate(selectedOrder.updatedAt)} />
              </dl>

              <div className="grid gap-2 border-y border-border py-4">
                <ActionButton
                  disabled={!canConfirmPayment(selectedOrder) || isSubmitting}
                  icon={<CreditCard className="size-4" />}
                  label="Xác nhận thanh toán"
                  onClick={() => openAction("confirm-payment")}
                />
                <ActionButton
                  disabled={!canRejectPayment(selectedOrder) || isSubmitting}
                  icon={<XCircle className="size-4" />}
                  label="Từ chối thanh toán"
                  variant="destructive"
                  onClick={() => openAction("reject-payment")}
                />
                <ActionButton
                  disabled={!canUpdateFulfillment(selectedOrder) || isSubmitting}
                  icon={<Truck className="size-4" />}
                  label="Cập nhật giao hàng"
                  onClick={() => openAction("fulfillment")}
                />
                <ActionButton
                  disabled={!canRejectOrder(selectedOrder) || isSubmitting}
                  icon={<Ban className="size-4" />}
                  label="Từ chối đơn"
                  variant="destructive"
                  onClick={() => openAction("reject")}
                />
                <ActionButton
                  disabled={!canCancelOrder(selectedOrder) || isSubmitting}
                  icon={<XCircle className="size-4" />}
                  label="Hủy đơn"
                  variant="destructive"
                  onClick={() => openAction("cancel")}
                />
                <ActionButton
                  disabled={isSubmitting}
                  icon={<FileText className="size-4" />}
                  label="Ghi chú nội bộ"
                  onClick={() => openAction("staff-note")}
                />
              </div>

              <section className="space-y-2">
                <h3 className="text-sm font-black tracking-tight">Ghi chú nội bộ</h3>
                <p className="min-h-16 border border-border bg-muted/15 p-3 text-sm leading-6 text-muted-foreground">
                  {selectedOrder.staffNote || "Chưa có ghi chú nội bộ."}
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black tracking-tight">Sản phẩm</h3>
                <div className="divide-y divide-border border border-border">
                  {selectedOrder.items?.length ? (
                    selectedOrder.items.map((item) => (
                      <div className="grid gap-1 p-3 text-sm" key={item.id}>
                        <p className="font-semibold">{item.variantNameSnapshot || item.variantName || item.productNameSnapshot || "Sản phẩm"}</p>
                        <p className="text-xs text-muted-foreground">
                          SKU {item.skuSnapshot || item.sku || "N/A"} | SL {item.quantity ?? 0} | {formatMoney(item.totalAmount)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="p-3 text-sm text-muted-foreground">Chưa có dòng sản phẩm.</p>
                  )}
                </div>
              </section>
            </div>
          )}
        </aside>
      </section>

      {selectedOrder && activeAction ? (
        <ActionPanel
          action={activeAction}
          draft={actionDraft}
          isSubmitting={isSubmitting}
          order={selectedOrder}
          onCancel={() => setActiveAction(null)}
          onChange={setActionDraft}
          onSubmit={handleActionSubmit}
        />
      ) : null}
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

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 border border-border px-3 py-2">
      <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words font-semibold">{value}</dd>
    </div>
  );
}

function ActionButton({
  disabled,
  icon,
  label,
  onClick,
  variant = "outline",
}: {
  disabled: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: "outline" | "destructive";
}) {
  return (
    <Button
      className="h-10 w-full cursor-pointer justify-start rounded-none px-3 text-sm font-semibold"
      disabled={disabled}
      onClick={onClick}
      type="button"
      variant={variant}
    >
      {icon}
      {label}
    </Button>
  );
}

function ActionPanel({
  action,
  draft,
  isSubmitting,
  onCancel,
  onChange,
  onSubmit,
  order,
}: {
  action: ActionKey;
  draft: ActionDraft;
  isSubmitting: boolean;
  onCancel: () => void;
  onChange: (draft: ActionDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  order: CheckoutOrder;
}) {
  const needsReason = ["reject", "cancel", "reject-payment"].includes(action);
  const showFulfillment = action === "fulfillment";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/25 px-4">
      <form
        aria-modal="true"
        className="w-full max-w-xl border border-border bg-background"
        onSubmit={onSubmit}
        role="dialog"
      >
        <div className="border-b border-border px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {order.orderCode}
          </p>
          <h3 className="mt-1 text-xl font-black tracking-tight">{getActionTitle(action)}</h3>
        </div>

        <div className="grid gap-4 px-5 py-5">
          {showFulfillment ? (
            <label className="grid gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Trạng thái giao hàng
              </span>
              <select
                className="h-11 cursor-pointer border border-border bg-background px-3 outline-none transition-colors hover:border-primary focus:border-primary"
                onChange={(event) => onChange({ ...draft, fulfillmentStatus: event.target.value })}
                value={draft.fulfillmentStatus}
              >
                {STAFF_FULFILLMENT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {getFulfillmentStatusLabel(option)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {needsReason ? (
            <label className="grid gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Lý do
              </span>
              <textarea
                className="min-h-24 resize-y border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                maxLength={255}
                onChange={(event) => onChange({ ...draft, reason: event.target.value })}
                required
                value={draft.reason}
              />
            </label>
          ) : null}

          <label className="grid gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Ghi chú nhân viên
            </span>
            <textarea
              className="min-h-24 resize-y border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
              maxLength={255}
              onChange={(event) => onChange({ ...draft, staffNote: event.target.value })}
              placeholder="Ghi chú nội bộ, tối đa 255 ký tự"
              value={draft.staffNote}
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-4">
          <Button
            className="h-10 cursor-pointer px-4 text-sm font-semibold"
            disabled={isSubmitting}
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            Đóng
          </Button>
          <Button
            className="h-10 cursor-pointer px-4 text-sm font-semibold"
            disabled={isSubmitting}
            type="submit"
            variant={needsReason ? "destructive" : "default"}
          >
            <ClipboardCheck className="size-4" />
            {isSubmitting ? "Đang xử lý" : "Xác nhận"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function OrderListSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1fr)_160px_160px_130px]" key={index}>
          <div className="h-14 animate-pulse bg-muted" />
          <div className="h-10 animate-pulse bg-muted" />
          <div className="h-10 animate-pulse bg-muted" />
          <div className="h-10 animate-pulse bg-muted" />
        </div>
      ))}
    </div>
  );
}
