import { BarChart3, CreditCard, Mail, Percent, ShieldCheck } from "lucide-react";

export const adminNavigation = [
  {
    icon: BarChart3,
    label: "Tổng quan",
    href: "/admin",
  },
  {
    icon: ShieldCheck,
    label: "Tài khoản",
    href: "/admin/tai-khoan",
  },
  {
    icon: Percent,
    label: "Thuế",
    href: "/admin/thue",
  },
  {
    icon: CreditCard,
    label: "Thanh toán",
    href: "/admin/thanh-toan",
  },
  {
    icon: Mail,
    label: "Email",
    href: "/admin/email",
  },
];

export const adminOverviewCards: Array<{ label: string; value: string }> = [];

export const adminModules: Array<{
  icon: typeof BarChart3;
  title: string;
  status: string;
}> = [];

export const adminQueues: Array<{ title: string; value: string }> = [];

export const adminSignals: Array<{ label: string; value: string }> = [];
