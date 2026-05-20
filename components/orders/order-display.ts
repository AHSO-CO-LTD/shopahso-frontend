import type { CheckoutOrder } from "@/lib/checkout/types";

export function formatOrderDate(value: string | undefined) {
  if (!value) {
    return "Chưa có dữ liệu";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chưa có dữ liệu";
  }

  return date.toLocaleString("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function getOrderStatusLabel(status: string | null | undefined) {
  switch (status) {
    case "PENDING_PAYMENT":
      return "Chờ thanh toán";
    case "PAYMENT_REVIEW":
      return "Đang kiểm tra thanh toán";
    case "PENDING":
      return "Chờ xử lý";
    case "CONFIRMED":
      return "Đã xác nhận";
    case "PROCESSING":
      return "Đang xử lý";
    case "READY_TO_SHIP":
      return "Sẵn sàng giao hàng";
    case "SHIPPING":
      return "Đang giao hàng";
    case "COMPLETED":
      return "Hoàn tất";
    case "CANCELLED":
      return "Đã hủy";
    case "REJECTED":
      return "Bị từ chối";
    default:
      return status || "Chưa có dữ liệu";
  }
}

export function getPaymentStatusLabel(status: string | null | undefined) {
  switch (status) {
    case "WAITING_CUSTOMER_TRANSFER":
      return "Chờ khách chuyển khoản";
    case "CUSTOMER_CONFIRMED":
      return "Khách đã xác nhận chuyển khoản";
    case "UNPAID":
      return "Chưa thanh toán";
    case "PENDING":
      return "Chờ xác nhận";
    case "PAID":
      return "Đã thanh toán";
    case "REJECTED":
      return "Thanh toán bị từ chối";
    case "FAILED":
      return "Thanh toán lỗi";
    case "REFUNDED":
      return "Đã hoàn tiền";
    default:
      return status || "Chưa có dữ liệu";
  }
}

export function getFulfillmentStatusLabel(status: string | null | undefined) {
  switch (status) {
    case "NOT_STARTED":
      return "Chưa bắt đầu";
    case "UNFULFILLED":
      return "Chưa giao";
    case "PROCESSING":
      return "Đang chuẩn bị";
    case "READY_TO_SHIP":
      return "Sẵn sàng giao hàng";
    case "SHIPPING":
      return "Đang giao hàng";
    case "SHIPPED":
      return "Đã gửi hàng";
    case "DELIVERED":
      return "Đã giao";
    case "FAILED":
      return "Giao hàng thất bại";
    case "RETURNED":
      return "Đã hoàn trả";
    case "CANCELLED":
      return "Đã hủy";
    default:
      return status || "Chưa có dữ liệu";
  }
}

export function canConfirmOrderPayment(order: CheckoutOrder) {
  return (
    order.paymentMethod === "BANK_TRANSFER" &&
    ["WAITING_CUSTOMER_TRANSFER", "UNPAID", "PENDING"].includes(order.paymentStatus)
  );
}
