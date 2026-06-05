import type { AlertItem } from "@/lib/admin-statistics/types";

export type AdminAlertDestination = {
  actions: Array<{
    href: string;
    label: string;
  }>;
  description: string;
  metrics: Array<{
    label: string;
    value: string;
  }>;
  severity: AlertItem["severity"];
  slug: string;
  title: string;
};

export const adminAlertDestinations: Record<string, AdminAlertDestination> = {
  "bien-the-het-hang": {
    actions: [
      { href: "/nhan-vien/san-pham", label: "Mở quản lý sản phẩm" },
      { href: "/admin", label: "Quay lại dashboard" },
    ],
    description:
      "Các biến thể hết hàng cần được rà soát tồn kho, cập nhật trạng thái bán hoặc chuyển sang liên hệ báo giá nếu chưa thể bổ sung hàng.",
    metrics: [
      { label: "Nguồn dữ liệu", value: "ProductVariant stockQuantity <= 0" },
      { label: "Ưu tiên", value: "Cao" },
      { label: "Người xử lý", value: "Nhân viên sản phẩm" },
    ],
    severity: "critical",
    slug: "bien-the-het-hang",
    title: "Biến thể hết hàng",
  },
  "bao-gia-dang-cho": {
    actions: [
      { href: "/nhan-vien/bao-gia", label: "Mở yêu cầu báo giá" },
      { href: "/admin", label: "Quay lại dashboard" },
    ],
    description:
      "Các yêu cầu báo giá đang chờ cần được nhận xử lý, phản hồi khách hàng và cập nhật trạng thái để tránh chậm trễ vận hành.",
    metrics: [
      { label: "Nguồn dữ liệu", value: "QuoteRequest status PENDING" },
      { label: "Ưu tiên", value: "Trung bình" },
      { label: "Người xử lý", value: "Nhân viên báo giá" },
    ],
    severity: "warning",
    slug: "bao-gia-dang-cho",
    title: "Yêu cầu báo giá đang chờ",
  },
  "don-bi-huy-tu-choi": {
    actions: [
      { href: "/nhan-vien/don-hang", label: "Mở quản lý đơn hàng" },
      { href: "/admin", label: "Quay lại dashboard" },
    ],
    description:
      "Đơn bị hủy hoặc từ chối cần được rà lại nguyên nhân, ghi chú nội bộ và đối chiếu thanh toán nếu có phát sinh hoàn tiền.",
    metrics: [
      { label: "Nguồn dữ liệu", value: "Order status CANCELLED hoặc REJECTED" },
      { label: "Ưu tiên", value: "Trung bình" },
      { label: "Người xử lý", value: "Nhân viên đơn hàng" },
    ],
    severity: "warning",
    slug: "don-bi-huy-tu-choi",
    title: "Đơn bị hủy hoặc từ chối",
  },
  "don-chua-thanh-toan": {
    actions: [
      { href: "/nhan-vien/don-hang", label: "Mở quản lý đơn hàng" },
      { href: "/admin/thanh-toan", label: "Kiểm tra cấu hình thanh toán" },
    ],
    description:
      "Đơn chưa thanh toán cần được kiểm tra trạng thái cổng thanh toán, nhắc khách hàng hoặc xử lý thủ công nếu giao dịch đang chờ xác minh.",
    metrics: [
      { label: "Nguồn dữ liệu", value: "Payment status chưa PAID" },
      { label: "Ưu tiên", value: "Trung bình" },
      { label: "Người xử lý", value: "Nhân viên đơn hàng" },
    ],
    severity: "warning",
    slug: "don-chua-thanh-toan",
    title: "Đơn chưa thanh toán",
  },
  "san-pham-nhap": {
    actions: [
      { href: "/nhan-vien/san-pham", label: "Mở quản lý sản phẩm" },
      { href: "/admin", label: "Quay lại dashboard" },
    ],
    description:
      "Sản phẩm nháp cần được hoàn thiện thông tin, hình ảnh, biến thể và xuất bản khi đã sẵn sàng hiển thị trên storefront.",
    metrics: [
      { label: "Nguồn dữ liệu", value: "Product status DRAFT" },
      { label: "Ưu tiên", value: "Thông tin" },
      { label: "Người xử lý", value: "Nhân viên sản phẩm" },
    ],
    severity: "info",
    slug: "san-pham-nhap",
    title: "Sản phẩm nháp",
  },
  "tracking-website": {
    actions: [
      { href: "/admin", label: "Quay lại dashboard" },
      { href: "/admin/email", label: "Mở cấu hình hệ thống" },
    ],
    description:
      "Website tracking chưa bật nên dashboard chưa có lượt truy cập và phiên truy cập. Cần bổ sung hạ tầng tracking hoặc bảng visits/sessions từ backend.",
    metrics: [
      { label: "Nguồn dữ liệu", value: "Website trackingAvailable = false" },
      { label: "Ưu tiên", value: "Trung bình" },
      { label: "Người xử lý", value: "Admin hệ thống" },
    ],
    severity: "warning",
    slug: "tracking-website",
    title: "Tracking website chưa bật",
  },
};

const alertKeyToSlug: Record<string, string> = {
  cancelledOrders: "don-bi-huy-tu-choi",
  draftProducts: "san-pham-nhap",
  outOfStockVariants: "bien-the-het-hang",
  pendingQuoteRequests: "bao-gia-dang-cho",
  trackingWebsite: "tracking-website",
  unpaidOrders: "don-chua-thanh-toan",
};

export function getAdminAlertDestinationHref(alert: AlertItem) {
  const slug = alertKeyToSlug[alert.key] ?? alert.key;
  const knownDestination = adminAlertDestinations[slug];

  if (knownDestination) {
    return `/admin/canh-bao/${slug}`;
  }

  return alert.href ?? `/admin/canh-bao/${slug}`;
}

export function getAdminAlertDestination(slug: string) {
  return adminAlertDestinations[slug];
}
