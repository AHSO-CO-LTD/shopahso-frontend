"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, Home, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const pageLabels: Record<string, string> = {
  "/admin": "Tổng quan vận hành",
  "/admin/tai-khoan": "Quản lý tài khoản",
  "/admin/thue": "Thiết lập thuế",
  "/admin/thanh-toan": "Cấu hình thanh toán",
  "/admin/email": "Cấu hình email",
};

type AdminHeaderProps = {
  onOpenSidebar: () => void;
};

export default function AdminHeader({ onOpenSidebar }: AdminHeaderProps) {
  const pathname = usePathname();
  const currentLabel = pageLabels[pathname] ?? "Quản trị";

  return (
    <header className="shrink-0 border-b border-border bg-background px-4 py-4 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            aria-label="Mở menu quản trị"
            className="size-10 cursor-pointer px-0 lg:hidden"
            onClick={onOpenSidebar}
            type="button"
            variant="outline"
          >
            <Menu className="size-4" />
          </Button>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Quản trị
            </p>
            <h1 className="mt-1 truncate text-xl font-black tracking-tight">{currentLabel}</h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            asChild
            className="h-11 cursor-pointer px-4 text-sm font-semibold"
            variant="outline"
          >
            <Link href="/nhan-vien">
              <BriefcaseBusiness className="size-4" />
              Trang nhân viên
            </Link>
          </Button>

          <Button
            asChild
            className="h-11 cursor-pointer px-4 text-sm font-semibold"
            variant="outline"
          >
            <Link href="/">
              <Home className="size-4" />
              Về trang chủ
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
