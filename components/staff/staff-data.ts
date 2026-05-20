import { Boxes, CreditCard, Percent, ShoppingCart, Tags, Users } from "lucide-react";

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
    icon: Boxes,
    label: "Danh mục",
    href: "/nhan-vien/danh-muc",
  },
  {
    icon: Tags,
    label: "Thương hiệu",
    href: "/nhan-vien/thuong-hieu",
  },
  {
    icon: Percent,
    label: "Thuế",
    href: "/nhan-vien/thue",
  },
  {
    icon: CreditCard,
    label: "Thanh toán",
    href: "/nhan-vien/thanh-toan",
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
