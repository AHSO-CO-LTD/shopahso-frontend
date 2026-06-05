import { ApiError } from "@/lib/api/client";
import type { AlertItem } from "@/lib/admin-statistics/types";

export function formatCompactNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Chưa có";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return String(value);
  }

  return new Intl.NumberFormat("vi-VN").format(numericValue);
}

export function formatMoney(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "0 đ";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return String(value);
  }

  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(numericValue);
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "0%";
  }

  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value)}%`;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Chưa có dữ liệu";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function formatDateBucket(value: string | null | undefined) {
  if (!value) {
    return "Chưa có";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

export function formatFullDateBucket(value: string | null | undefined) {
  if (!value) {
    return "Chưa có dữ liệu";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
  }).format(date);
}

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function normalizeStatisticsLabel(value: string) {
  const labels: Record<string, string> = {
    "active users": "Người dùng đang hoạt động",
    "bien the": "Biến thể",
    "cancelled orders": "Đơn đã hủy",
    "cho xac nhan": "Chờ xác nhận",
    "con hang": "Còn hàng",
    "contact for price variants": "Biến thể cần liên hệ giá",
    "da bao gia": "Đã báo giá",
    "da dong": "Đã đóng",
    "da thanh toan": "Đã thanh toán",
    "dang cho": "Đang chờ",
    "doanh thu": "Doanh thu",
    "don da thanh toan": "Đơn đã thanh toán",
    "don hang": "Đơn hàng",
    "draft products": "Sản phẩm nháp",
    "het hang": "Hết hàng",
    "inactive users": "Người dùng ngưng hoạt động",
    "khach da xac nhan": "Khách đã xác nhận",
    "new products": "Sản phẩm mới",
    "new users": "Người dùng mới",
    "nhan vien": "Nhân viên",
    "nguoi dung": "Người dùng",
    "nguoi dung moi": "Người dùng mới",
    "out of stock variants": "Biến thể hết hàng",
    "paid orders": "Đơn đã thanh toán",
    "products": "Sản phẩm",
    "quan tri": "Quản trị",
    "quote request": "Yêu cầu báo giá",
    "quote requests": "Yêu cầu báo giá",
    "registered users": "Người dùng",
    "revenue": "Doanh thu",
    "san pham": "Sản phẩm",
    "tu choi": "Từ chối",
    "total orders": "Đơn hàng",
    "total users": "Người dùng",
    "variants": "Biến thể",
    "yeu cau bao gia": "Yêu cầu báo giá",
  };

  return labels[normalizeKey(value)] ?? value;
}

export function getStatisticsCardLabel(key: string, label: string) {
  const labelsByKey: Record<string, string> = {
    newProducts: "Sản phẩm mới",
    newUsers: "Người dùng mới",
    orders: "Đơn hàng",
    paidOrders: "Đơn đã thanh toán",
    pendingQuoteRequests: "Yêu cầu chờ xử lý",
    products: "Sản phẩm",
    quoteRequests: "Yêu cầu báo giá",
    registeredUsers: "Người dùng",
    revenue: "Doanh thu",
    variants: "Biến thể",
    visits: "Lượt truy cập",
  };

  return labelsByKey[key] ?? normalizeStatisticsLabel(label);
}

export function getStatisticsBreakdownLabel(key: string, label: string) {
  const labelsByKey: Record<string, string> = {
    ACTIVE: "Đang hoạt động",
    ADMIN: "Quản trị",
    CANCELLED: "Đã hủy",
    CLOSED: "Đã đóng",
    CONFIRMED: "Khách đã xác nhận",
    DRAFT: "Bản nháp",
    FULFILLED: "Đã hoàn tất",
    IN_STOCK: "Còn hàng",
    INACTIVE: "Ngưng hoạt động",
    OUT_OF_STOCK: "Hết hàng",
    PAID: "Đã thanh toán",
    PENDING: "Đang chờ",
    PUBLISHED: "Đã xuất bản",
    QUOTED: "Đã báo giá",
    REJECTED: "Từ chối",
    STAFF: "Nhân viên",
    USER: "Người dùng",
    UNPAID: "Chưa thanh toán",
  };

  return labelsByKey[key] ?? normalizeStatisticsLabel(label);
}

export function getAlertSeverityLabel(severity: AlertItem["severity"]) {
  if (severity === "critical") {
    return "Khẩn cấp";
  }

  if (severity === "warning") {
    return "Cần chú ý";
  }

  return "Thông tin";
}

export function getRateLabel(key: string) {
  const labels: Record<string, string> = {
    cancellationRate: "Tỷ lệ hủy đơn",
    contactForPriceRate: "Tỷ lệ cần báo giá",
    outOfStockRate: "Tỷ lệ hết hàng",
    paidOrderRate: "Tỷ lệ thanh toán",
    quoteCompletionRate: "Tỷ lệ hoàn tất báo giá",
  };

  return labels[key] ?? normalizeStatisticsLabel(key);
}

export function getComparisonLabel(key: string) {
  const labels: Record<string, string> = {
    newUsers: "Người dùng mới",
    orders: "Đơn hàng",
    paidOrders: "Đơn đã thanh toán",
    quoteRequests: "Yêu cầu báo giá",
    revenue: "Doanh thu",
  };

  return labels[key] ?? normalizeStatisticsLabel(key);
}

export function toDateTimeLocalValue(value: string | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function fromDateTimeLocalValue(value: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function getStatisticsToastMessage(error: unknown) {
  if (!(error instanceof ApiError)) {
    return "Không thể tải thống kê admin";
  }

  if (error.status === 401) {
    return "Phiên đăng nhập đã hết hạn";
  }

  if (error.status === 403) {
    return "Bạn không có quyền xem thống kê";
  }

  if (error.status === 400) {
    return "Bộ lọc thời gian không hợp lệ";
  }

  return "Không thể tải thống kê admin";
}
