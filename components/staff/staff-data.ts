import { Boxes, ClipboardList, FileImage, FileText, ShoppingCart, Tags, TicketPercent, Users } from "lucide-react";

export const staffNavigation = [
  {
    icon: ShoppingCart,
    label: "Sản phẩm",
    href: "/nhan-vien/san-pham",
  },
  {
    icon: Users,
    label: "Người dùng",
    href: "/nhan-vien/nguoi-dung",
  },
  {
    icon: ClipboardList,
    label: "Đơn hàng",
    href: "/nhan-vien/don-hang",
  },
  {
    icon: FileText,
    label: "Báo giá",
    href: "/nhan-vien/bao-gia",
  },
  {
    icon: TicketPercent,
    label: "Khuyến mãi",
    href: "/nhan-vien/khuyen-mai",
  },
  {
    icon: FileImage,
    label: "Banner",
    href: "/nhan-vien/banner",
  },
  {
    icon: Boxes,
    label: "Danh mục",
    href: "/nhan-vien/danh-muc",
  },
  {
    icon: Tags,
    label: "Thương hiệu",
    href: "/nhan-vien/thuong-hieu",
  },
];

export const staffSignals: Array<{ label: string; value: string }> = [];

export const staffOverviewCards: Array<{ label: string; value: string }> = [];

export const staffModules: Array<{
  icon: typeof ShoppingCart;
  title: string;
  summary: string;
  status: string;
}> = [];

export const staffQueues: Array<{ title: string; value: string }> = [];

export const staffPanels: Array<{
  icon: typeof ShoppingCart;
  title: string;
  items: string[];
}> = [];
