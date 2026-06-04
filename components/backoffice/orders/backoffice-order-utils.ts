import type { CheckoutOrder } from "@/lib/checkout/types";

export type BackofficeOrderActionKey =
  | "confirm-order"
  | "cancel"
  | "cancel-refund"
  | "prepare"
  | "handover"
  | "ship"
  | "deliver-success"
  | "deliver-failed"
  | "staff-note";

export type BackofficeOrderActionDraft = {
  fulfillmentStatus: string;
  reason: string;
  staffNote: string;
};

export const ORDER_STATUS_OPTIONS = [
  "PENDING_PAYMENT",
  "PAYMENT_REVIEW",
  "CONFIRMED",
  "PROCESSING",
  "READY_TO_SHIP",
  "SHIPPING",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
];

export const PAYMENT_STATUS_OPTIONS = [
  "WAITING_CUSTOMER_TRANSFER",
  "CUSTOMER_CONFIRMED",
  "PAID",
  "REJECTED",
  "REFUNDED",
];

export const FULFILLMENT_STATUS_OPTIONS = [
  "NOT_STARTED",
  "PROCESSING",
  "READY_TO_SHIP",
  "SHIPPING",
  "DELIVERED",
  "FAILED",
  "RETURNED",
];

const TERMINAL_ORDER_STATUSES = ["COMPLETED", "CANCELLED", "REJECTED"];

export function formatBackofficeMoney(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function canCancelUnpaidOrder(order: CheckoutOrder) {
  return order.paymentStatus === "WAITING_CUSTOMER_TRANSFER" && !TERMINAL_ORDER_STATUSES.includes(order.status);
}

export function canConfirmOrder(order: CheckoutOrder) {
  return order.paymentStatus === "CUSTOMER_CONFIRMED" && !TERMINAL_ORDER_STATUSES.includes(order.status);
}

export function canCancelCustomerConfirmedOrder(order: CheckoutOrder) {
  return order.paymentStatus === "CUSTOMER_CONFIRMED" && !TERMINAL_ORDER_STATUSES.includes(order.status);
}

export function canCancelRefundOrder(order: CheckoutOrder) {
  return (
    ["CUSTOMER_CONFIRMED", "PAID"].includes(order.paymentStatus) &&
    order.fulfillmentStatus !== "DELIVERED" &&
    !TERMINAL_ORDER_STATUSES.includes(order.status)
  );
}

export function canPrepareOrder(order: CheckoutOrder) {
  return (
    order.status === "CONFIRMED" &&
    order.paymentStatus === "PAID" &&
    order.fulfillmentStatus === "NOT_STARTED" &&
    !TERMINAL_ORDER_STATUSES.includes(order.status)
  );
}

export function canHandoverOrder(order: CheckoutOrder) {
  return (
    order.status === "PROCESSING" &&
    order.paymentStatus === "PAID" &&
    order.fulfillmentStatus === "PROCESSING" &&
    !TERMINAL_ORDER_STATUSES.includes(order.status)
  );
}

export function canShipOrder(order: CheckoutOrder) {
  return (
    order.status === "READY_TO_SHIP" &&
    order.paymentStatus === "PAID" &&
    order.fulfillmentStatus === "READY_TO_SHIP" &&
    !TERMINAL_ORDER_STATUSES.includes(order.status)
  );
}

export function canFinishDelivery(order: CheckoutOrder) {
  return order.paymentStatus === "PAID" && order.fulfillmentStatus === "SHIPPING" && !TERMINAL_ORDER_STATUSES.includes(order.status);
}

export function getInitialActionDraft(order: CheckoutOrder, action: BackofficeOrderActionKey): BackofficeOrderActionDraft {
  const fulfillmentStatus =
    action === "prepare"
      ? "PROCESSING"
      : action === "handover"
        ? "READY_TO_SHIP"
        : action === "ship"
          ? "SHIPPING"
          : action === "deliver-success"
            ? "DELIVERED"
            : action === "deliver-failed"
              ? "FAILED"
              : order.fulfillmentStatus || "PROCESSING";

  return {
    fulfillmentStatus,
    reason: "",
    staffNote: order.staffNote ?? "",
  };
}

export function getActionTitle(action: BackofficeOrderActionKey) {
  switch (action) {
    case "confirm-order":
      return "Xác nhận đơn hàng";
    case "cancel":
      return "Hủy đơn";
    case "cancel-refund":
      return "Hủy đơn và hoàn tiền";
    case "prepare":
      return "Đang chuẩn bị hàng";
    case "handover":
      return "Bàn giao cho đơn vị vận chuyển";
    case "ship":
      return "Cập nhật đang vận chuyển";
    case "deliver-success":
      return "Giao hàng thành công";
    case "deliver-failed":
      return "Giao hàng thất bại";
    case "staff-note":
      return "Ghi chú nội bộ";
    default:
      return "Cập nhật đơn hàng";
  }
}

export function getActionToast(action: BackofficeOrderActionKey) {
  switch (action) {
    case "confirm-order":
      return "Đã xác nhận thanh toán đơn hàng.";
    case "cancel":
      return "Đã hủy đơn hàng.";
    case "cancel-refund":
      return "Đã gửi yêu cầu hủy đơn và hoàn tiền.";
    case "prepare":
      return "Đã cập nhật đơn sang trạng thái đang chuẩn bị hàng.";
    case "handover":
      return "Đã cập nhật đơn sang trạng thái sẵn sàng giao.";
    case "ship":
      return "Đã cập nhật đơn sang trạng thái đang vận chuyển.";
    case "deliver-success":
      return "Đơn hàng đã hoàn thành.";
    case "deliver-failed":
      return "Đã cập nhật giao hàng thất bại.";
    case "staff-note":
      return "Đã cập nhật ghi chú nội bộ.";
    default:
      return "Đã cập nhật đơn hàng.";
  }
}
