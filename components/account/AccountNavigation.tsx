"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, FileText, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const accountNavItems = [
  {
    href: "/tai-khoan",
    label: "Thông tin cá nhân",
    icon: UserCircle,
    isActive: (pathname: string) => pathname === "/tai-khoan",
  },
  {
    href: "/tai-khoan/don-hang",
    label: "Đơn hàng",
    icon: ClipboardList,
    isActive: (pathname: string) => pathname.startsWith("/tai-khoan/don-hang"),
  },
  {
    href: "/tai-khoan/yeu-cau-bao-gia",
    label: "Báo giá",
    icon: FileText,
    isActive: (pathname: string) => pathname.startsWith("/tai-khoan/yeu-cau-bao-gia"),
  },
];

export default function AccountNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Điều hướng tài khoản"
      className="mb-5 grid border border-border bg-background sm:mb-8 sm:grid-cols-3"
    >
      {accountNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.isActive(pathname);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex h-12 cursor-pointer items-center justify-center gap-2 border-b border-border px-3 text-sm font-semibold transition-colors last:border-b-0 hover:bg-muted hover:text-primary sm:border-b-0 sm:border-r sm:last:border-r-0",
              isActive ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : "",
            )}
            href={item.href}
            key={item.href}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
