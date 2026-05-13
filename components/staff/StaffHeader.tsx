"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const pageLabels: Record<string, string> = {
  "/nhan-vien": "Bảng điều phối nghiệp vụ",
  "/nhan-vien/san-pham": "Quản lý sản phẩm",
  "/nhan-vien/san-pham/tao": "Tạo sản phẩm",
  "/nhan-vien/nguoi-dung": "Quản lý người dùng",
  "/nhan-vien/danh-muc": "Tạo danh mục",
  "/nhan-vien/thuong-hieu": "Quản lý thương hiệu",
};

type StaffHeaderProps = {
  onOpenSidebar: () => void;
};

export default function StaffHeader({ onOpenSidebar }: StaffHeaderProps) {
  const pathname = usePathname();
  const currentLabel = pathname.startsWith("/nhan-vien/san-pham/") && pathname.includes("/bien-the")
    ? pathname.endsWith("/tao")
      ? "Tạo biến thể sản phẩm"
      : pathname.endsWith("/sua")
        ? "Sửa biến thể sản phẩm"
      : "Quản lý biến thể sản phẩm"
    : pathname.startsWith("/nhan-vien/san-pham/")
      ? "Quản lý chi tiết sản phẩm"
    : pageLabels[pathname] ?? "Khu nhân viên";

  return (
    <header className="shrink-0 border-b border-border bg-background px-4 py-4 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            className="size-10 px-0 lg:hidden"
            onClick={onOpenSidebar}
            type="button"
            variant="outline"
          >
            <Menu className="size-4" />
          </Button>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Nhân viên
            </p>
            <h1 className="mt-1 text-xl font-black tracking-tight">{currentLabel}</h1>
          </div>
        </div>

        <Button asChild className="h-11 px-4 text-sm font-semibold" variant="outline">
          <Link href="/">
            <Home className="size-4" />
            Về trang chủ
          </Link>
        </Button>
      </div>
    </header>
  );
}
