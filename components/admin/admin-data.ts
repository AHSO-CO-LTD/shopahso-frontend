import { BarChart3, ShieldCheck } from "lucide-react";

export const adminNavigation = [
  {
    icon: BarChart3,
    label: "Tong quan",
    href: "/admin",
  },
  {
    icon: ShieldCheck,
    label: "Tai khoan",
    href: "/admin/tai-khoan",
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
