import { Boxes, PackageSearch, ShoppingCart, Tags, Users } from "lucide-react";

export const staffNavigation = [
  {
    icon: ShoppingCart,
    label: "Đơn hàng",
    href: "/nhan-vien",
  },
  {
    icon: Users,
    label: "Người dùng",
    href: "/nhan-vien/nguoi-dung",
  },
  {
    icon: Boxes,
    label: "Danh mục",
    href: "/nhan-vien",
  },
  {
    icon: Tags,
    label: "Thương hiệu",
    href: "/nhan-vien",
  },
];

export const staffSignals = [
  { label: "Ca trực", value: "Sáng 08:00 - 17:00" },
  { label: "Trạng thái", value: "Sẵn sàng xử lý" },
  { label: "Vai trò", value: "Vận hành nội bộ" },
];

export const staffOverviewCards = [
  { label: "Đơn hàng chờ xác nhận", value: "26" },
  { label: "Người dùng cần hỗ trợ", value: "08" },
  { label: "Danh mục chờ cập nhật", value: "14" },
  { label: "Thương hiệu chờ duyệt", value: "05" },
];

export const staffModules = [
  {
    icon: ShoppingCart,
    title: "Quản lý đơn hàng",
    summary: "Theo dõi trạng thái đơn, kiểm tra thanh toán và điều phối giao hàng.",
    status: "Ưu tiên",
  },
  {
    icon: Users,
    title: "Quản lý người dùng",
    summary: "Hỗ trợ tài khoản, rà soát hoạt động và xử lý các yêu cầu nội bộ.",
    status: "Sẵn sàng",
  },
  {
    icon: Boxes,
    title: "Quản lý danh mục",
    summary: "Cập nhật cấu trúc ngành hàng, trạng thái hiển thị và nội dung điều hướng.",
    status: "Chờ API",
  },
  {
    icon: Tags,
    title: "Quản lý thương hiệu",
    summary: "Theo dõi brand đang hoạt động, logo và chuẩn hóa thông tin trình bày.",
    status: "Chờ API",
  },
];

export const staffQueues = [
  { title: "Đơn hàng cần kiểm tra", value: "11" },
  { title: "Tài khoản chờ phản hồi", value: "06" },
  { title: "Danh mục cần rà soát", value: "09" },
];

export const staffPanels = [
  {
    icon: PackageSearch,
    title: "Đơn hàng",
    items: [
      "Xác nhận đơn mới",
      "Đối soát trạng thái thanh toán",
      "Kiểm tra bàn giao vận chuyển",
    ],
  },
  {
    icon: Users,
    title: "Người dùng",
    items: [
      "Rà soát tài khoản bị khóa",
      "Kiểm tra yêu cầu hỗ trợ",
      "Theo dõi lần đăng nhập gần nhất",
    ],
  },
  {
    icon: Boxes,
    title: "Danh mục",
    items: ["Sắp xếp nhóm hàng", "Bật/tắt danh mục", "Kiểm tra cấu trúc hiển thị"],
  },
  {
    icon: Tags,
    title: "Thương hiệu",
    items: ["Cập nhật logo", "Bật/tắt trạng thái brand", "Chuẩn hóa slug hiển thị"],
  },
];
