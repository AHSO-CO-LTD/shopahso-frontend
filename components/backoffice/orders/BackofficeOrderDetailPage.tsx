"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  ClipboardCheck,
  Package,
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
  canCancelCustomerConfirmedOrder,
  canCancelRefundOrder,
  canCancelUnpaidOrder,
  canConfirmOrder,
  canFinishDelivery,
  canHandoverOrder,
  canPrepareOrder,
  canShipOrder,
  formatBackofficeMoney,
  getActionTitle,
  getActionToast,
  getInitialActionDraft,
  type BackofficeOrderActionDraft,
  type BackofficeOrderActionKey,
} from "@/components/backoffice/orders/backoffice-order-utils";
import {
  cancelBackofficeOrder,
  confirmBackofficeOrderPayment,
  getBackofficeOrder,
  updateBackofficeOrderFulfillment,
  updateBackofficeOrderStaffNote,
} from "@/lib/api/services/backoffice-orders.service";
import type { CheckoutOrder, CheckoutOrderItem } from "@/lib/checkout/types";

export function BackofficeOrderDetailPage({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeAction, setActiveAction] = useState<BackofficeOrderActionKey | null>(null);
  const [actionDraft, setActionDraft] = useState<BackofficeOrderActionDraft>({
    fulfillmentStatus: "PROCESSING",
    reason: "",
    staffNote: "",
  });

  const loadOrder = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getBackofficeOrder(orderId);
      setOrder(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải chi tiết đơn hàng.";
      setErrorMessage(message);
      setOrder(null);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadOrder();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadOrder]);

  const shippingLine = useMemo(() => {
    if (!order) {
      return "Chưa có dữ liệu";
    }

    const parts = [order.shippingStreetAddress, order.shippingWardName, order.shippingProvinceName].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Chưa có dữ liệu";
  }, [order]);

  function openAction(action: BackofficeOrderActionKey) {
    if (!order) {
      return;
    }

    setActionDraft(getInitialActionDraft(order, action));
    setActiveAction(action);
  }

  async function handleActionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!order || !activeAction) {
      toast.warning("Vui lòng chọn thao tác cần xử lý.");
      return;
    }

    if (["cancel", "cancel-refund", "deliver-failed"].includes(activeAction) && !actionDraft.reason.trim()) {
      toast.warning("Vui lòng nhập lý do xử lý.");
      return;
    }

    const loadingToastId = toast.loading(getActionTitle(activeAction));

    try {
      setIsSubmitting(true);

      const staffNote = actionDraft.staffNote.trim() || undefined;
      const reasonPayload = {
        reason: actionDraft.reason.trim(),
        staffNote,
      };

      const nextOrder =
        activeAction === "confirm-order"
          ? await confirmBackofficeOrderPayment(order.id, {
              staffNote,
            })
          : activeAction === "cancel" || activeAction === "cancel-refund"
            ? await cancelBackofficeOrder(order.id, reasonPayload)
            : activeAction === "staff-note"
              ? await updateBackofficeOrderStaffNote(order.id, { staffNote })
              : await updateBackofficeOrderFulfillment(order.id, {
                  fulfillmentStatus: actionDraft.fulfillmentStatus,
                  staffNote,
                });

      setOrder(nextOrder);
      setActiveAction(null);
      toast.success(getActionToast(activeAction), { id: loadingToastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật đơn hàng.", { id: loadingToastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button asChild className="h-10 cursor-pointer rounded-none px-3 text-sm font-semibold" variant="outline">
          <Link href="/nhan-vien/don-hang">
            <ArrowLeft className="size-4" />
            Danh sách đơn
          </Link>
        </Button>
        <Button
          className="h-10 cursor-pointer rounded-none px-3 text-sm font-semibold"
          disabled={isLoading}
          onClick={() => void loadOrder()}
          type="button"
          variant="outline"
        >
          <RefreshCw className="size-4" />
          Tải lại
        </Button>
      </header>

      {isLoading ? (
        <OrderDetailSkeleton />
      ) : errorMessage ? (
        <div className="border border-destructive bg-destructive/10 p-5 text-sm text-destructive">{errorMessage}</div>
      ) : order ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <main className="grid gap-5">
            <section className="border border-border bg-background">
              <div className="border-b border-border px-4 py-4 md:px-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Chi tiết đơn</p>
                <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h1 className="font-mono text-2xl font-black tracking-tight">{order.orderCode}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Tạo lúc {formatOrderDate(order.createdAt)}</p>
                  </div>
                  <p className="text-2xl font-black text-primary">{formatBackofficeMoney(order.grandTotalAmount)}</p>
                </div>
              </div>
              <div className="grid gap-3 p-4 md:grid-cols-3 md:p-5">
                <StatusLine label="Đơn hàng" value={getOrderStatusLabel(order.status)} />
                <StatusLine label="Thanh toán" value={getPaymentStatusLabel(order.paymentStatus)} />
                <StatusLine label="Giao hàng" value={getFulfillmentStatusLabel(order.fulfillmentStatus)} />
              </div>
            </section>

            <OrderTimeline order={order} />

            <section>
              <InfoPanel title="Người nhận">
                <InfoLine label="Tên" value={order.shippingName || order.customerName || "Chưa có dữ liệu"} />
                <InfoLine label="Điện thoại" value={order.shippingPhone || order.customerPhone || "Chưa có dữ liệu"} />
                <InfoLine label="Email" value={order.customerEmail || "Chưa có dữ liệu"} />
                <InfoLine label="Địa chỉ" value={shippingLine} />
                <InfoLine label="Ghi chú giao" value={order.shippingNote || "Chưa có dữ liệu"} />
              </InfoPanel>
            </section>

            <section className="border border-border bg-background">
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-5">
                <h2 className="text-base font-black tracking-tight">Sản phẩm</h2>
                <span className="text-xs font-semibold text-muted-foreground">{order.items.length} dòng</span>
              </div>
              {order.items.length === 0 ? (
                <div className="p-5 text-sm text-muted-foreground">Đơn hàng chưa có dòng sản phẩm.</div>
              ) : (
                <div className="divide-y divide-border">
                  {order.items.map((item) => (
                    <OrderItemRow item={item} key={item.id} />
                  ))}
                </div>
              )}
            </section>

            <InfoPanel title="Ghi chú nội bộ">
              <p className="min-h-20 text-sm leading-6 text-muted-foreground">{order.staffNote || "Chưa có ghi chú nội bộ."}</p>
            </InfoPanel>
          </main>

          <aside className="h-fit border border-border bg-background xl:sticky xl:top-4">
            <div className="border-b border-border px-4 py-3 md:px-5">
              <h2 className="text-base font-black tracking-tight">Thao tác</h2>
              <p className="mt-1 text-xs text-muted-foreground">Chỉ bật các nút hợp lệ với trạng thái hiện tại.</p>
            </div>
            <div className="grid gap-2 p-4">
              {canCancelUnpaidOrder(order) ? (
                <ActionButton disabled={isSubmitting} icon={<XCircle className="size-4" />} label="Hủy đơn" onClick={() => openAction("cancel")} variant="destructive" />
              ) : null}
              {canConfirmOrder(order) ? (
                <>
                  <ActionButton disabled={isSubmitting} icon={<ClipboardCheck className="size-4" />} label="Xác nhận đơn hàng" onClick={() => openAction("confirm-order")} />
                  {canCancelCustomerConfirmedOrder(order) ? (
                    <ActionButton disabled={isSubmitting} icon={<XCircle className="size-4" />} label="Hủy đơn" onClick={() => openAction("cancel")} variant="destructive" />
                  ) : null}
                  {canCancelRefundOrder(order) ? (
                    <ActionButton disabled={isSubmitting} icon={<XCircle className="size-4" />} label="Hủy đơn và hoàn tiền" onClick={() => openAction("cancel-refund")} variant="destructive" />
                  ) : null}
                </>
              ) : null}
              {canShipOrder(order) ? (
                <>
                  <ActionButton disabled={isSubmitting} icon={<Truck className="size-4" />} label="Cập nhật đang vận chuyển" onClick={() => openAction("ship")} />
                  {canCancelRefundOrder(order) ? (
                    <ActionButton disabled={isSubmitting} icon={<XCircle className="size-4" />} label="Hủy đơn hoàn tiền" onClick={() => openAction("cancel-refund")} variant="destructive" />
                  ) : null}
                </>
              ) : null}
              {canPrepareOrder(order) ? (
                <>
                  <ActionButton disabled={isSubmitting} icon={<Package className="size-4" />} label="Đang chuẩn bị hàng" onClick={() => openAction("prepare")} />
                  {canCancelRefundOrder(order) ? (
                    <ActionButton disabled={isSubmitting} icon={<XCircle className="size-4" />} label="Hủy đơn hoàn tiền" onClick={() => openAction("cancel-refund")} variant="destructive" />
                  ) : null}
                </>
              ) : null}
              {canHandoverOrder(order) ? (
                <>
                  <ActionButton disabled={isSubmitting} icon={<Truck className="size-4" />} label="Bàn giao cho đơn vị vận chuyển" onClick={() => openAction("handover")} />
                  {canCancelRefundOrder(order) ? (
                    <ActionButton disabled={isSubmitting} icon={<XCircle className="size-4" />} label="Hủy đơn hoàn tiền" onClick={() => openAction("cancel-refund")} variant="destructive" />
                  ) : null}
                </>
              ) : null}
              {canFinishDelivery(order) ? (
                <>
                  <ActionButton disabled={isSubmitting} icon={<ClipboardCheck className="size-4" />} label="Giao hàng thành công" onClick={() => openAction("deliver-success")} />
                  <ActionButton disabled={isSubmitting} icon={<XCircle className="size-4" />} label="Giao hàng thất bại" onClick={() => openAction("deliver-failed")} variant="destructive" />
                </>
              ) : null}
            </div>
          </aside>

          {activeAction ? (
            <ActionPanel
              action={activeAction}
              draft={actionDraft}
              isSubmitting={isSubmitting}
              order={order}
              onCancel={() => setActiveAction(null)}
              onChange={setActionDraft}
              onSubmit={handleActionSubmit}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-muted/10 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function OrderTimeline({ order }: { order: CheckoutOrder }) {
  const currentStep = getTimelineStep(order);
  const steps = [
    "Tạo đơn hàng",
    "Xác nhận chuyển khoản",
    "Đang chuẩn bị hàng",
    "Bàn giao cho đơn vị vận chuyển",
    "Đang vận chuyển",
    "Hoàn thành",
  ];

  return (
    <section className="border border-border bg-background p-4 md:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-black tracking-tight">Tiến trình đơn hàng</h2>
          <p className="mt-1 text-xs text-muted-foreground">Theo dõi đơn từ lúc tạo đến khi giao xong.</p>
        </div>
        <span className="border border-border px-2 py-1 text-xs font-semibold text-muted-foreground">
          Bước {Math.min(currentStep + 1, steps.length)}/{steps.length}
        </span>
      </div>
      <ol className="mt-4 grid gap-2 md:grid-cols-6">
        {steps.map((step, index) => {
          const isCurrent = index === currentStep;
          const isDone = index < currentStep;

          return (
            <li
              className={[
                "min-h-20 border px-3 py-2 text-sm",
                isCurrent ? "border-primary bg-primary/10" : isDone ? "border-green-700 bg-green-50" : "border-border bg-muted/10",
              ].join(" ")}
              key={step}
            >
              <p className="font-mono text-[11px] font-black text-muted-foreground">{String(index + 1).padStart(2, "0")}</p>
              <p className="mt-2 font-semibold leading-5">{step}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function getTimelineStep(order: CheckoutOrder) {
  if (order.status === "COMPLETED" && order.paymentStatus === "PAID" && order.fulfillmentStatus === "DELIVERED") {
    return 5;
  }

  if (order.status === "SHIPPING" && order.paymentStatus === "PAID" && order.fulfillmentStatus === "SHIPPING") {
    return 4;
  }

  if (order.status === "READY_TO_SHIP" && order.paymentStatus === "PAID" && order.fulfillmentStatus === "READY_TO_SHIP") {
    return 3;
  }

  if (order.status === "PROCESSING" && order.paymentStatus === "PAID" && order.fulfillmentStatus === "PROCESSING") {
    return 2;
  }

  if (order.status === "CONFIRMED" && order.paymentStatus === "PAID" && order.fulfillmentStatus === "NOT_STARTED") {
    return 1;
  }

  return 0;
}

function InfoPanel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="border border-border bg-background p-4 md:p-5">
      <h2 className="text-base font-black tracking-tight">{title}</h2>
      <dl className="mt-4 grid gap-2">{children}</dl>
    </section>
  );
}

function InfoLine({ label, mono = false, value }: { label: string; mono?: boolean; value: string }) {
  return (
    <div className="grid gap-1 border border-border px-3 py-2 text-sm sm:grid-cols-[132px_minmax(0,1fr)] sm:gap-3">
      <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</dt>
      <dd className={`min-w-0 break-words font-semibold ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}

function OrderItemRow({ item }: { item: CheckoutOrderItem }) {
  const productName = item.productNameSnapshot || item.productName || "Sản phẩm";
  const variantName = item.variantNameSnapshot || item.variantName || productName;
  const sku = item.skuSnapshot || item.sku || "Chưa có dữ liệu";
  const unit = item.unitSnapshot || "sản phẩm";
  const unitPrice = item.effectivePriceSnapshot ?? item.salePriceSnapshot ?? item.priceSnapshot;
  const lineTotal = item.totalAmount ?? item.subtotalAmount;

  return (
    <article className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_180px] md:items-center md:p-5">
      <div className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] gap-3">
        <div className="flex size-[72px] items-center justify-center border border-border bg-muted/15">
          {item.imageUrlSnapshot ? (
            <Image alt={variantName} className="object-cover" height={72} src={item.imageUrlSnapshot} width={72} />
          ) : (
            <Package className="size-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{variantName}</p>
          {variantName !== productName ? <p className="mt-1 truncate text-xs text-muted-foreground">{productName}</p> : null}
          <p className="mt-1 truncate font-mono text-[11px] font-semibold text-muted-foreground">{sku}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {unit} x{item.quantity ?? 0}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 items-end gap-3 md:block md:text-right">
        <div className="text-sm md:mb-2">
          <p className="text-xs text-muted-foreground">Đơn giá</p>
          <p className="whitespace-nowrap font-semibold">{formatBackofficeMoney(unitPrice)}</p>
        </div>
        <div className="text-right text-sm">
          <p className="text-xs text-muted-foreground">Thành tiền</p>
          <p className="whitespace-nowrap font-black text-primary">{formatBackofficeMoney(lineTotal)}</p>
        </div>
      </div>
    </article>
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
  action: BackofficeOrderActionKey;
  draft: BackofficeOrderActionDraft;
  isSubmitting: boolean;
  onCancel: () => void;
  onChange: (draft: BackofficeOrderActionDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  order: CheckoutOrder;
}) {
  const needsReason = ["cancel", "cancel-refund", "deliver-failed"].includes(action);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/25 px-4">
      <form aria-modal="true" className="w-full max-w-xl border border-border bg-background" onSubmit={onSubmit} role="dialog">
        <div className="border-b border-border px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{order.orderCode}</p>
          <h3 className="mt-1 text-xl font-black tracking-tight">{getActionTitle(action)}</h3>
        </div>

        <div className="grid gap-4 px-5 py-5">
          {needsReason ? (
            <label className="grid gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Lý do</span>
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
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Ghi chú nhân viên</span>
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
          <Button className="h-10 cursor-pointer rounded-none px-4 text-sm font-semibold" disabled={isSubmitting} onClick={onCancel} type="button" variant="outline">
            Đóng
          </Button>
          <Button className="h-10 cursor-pointer rounded-none px-4 text-sm font-semibold" disabled={isSubmitting} type="submit" variant={needsReason ? "destructive" : "default"}>
            <ClipboardCheck className="size-4" />
            {isSubmitting ? "Đang xử lý" : "Xác nhận"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <main className="grid gap-5">
        <div className="h-40 animate-pulse border border-border bg-muted" />
        <div className="grid gap-5 md:grid-cols-2">
          <div className="h-64 animate-pulse border border-border bg-muted" />
          <div className="h-64 animate-pulse border border-border bg-muted" />
        </div>
        <div className="h-80 animate-pulse border border-border bg-muted" />
      </main>
      <aside className="h-80 animate-pulse border border-border bg-muted" />
    </div>
  );
}
