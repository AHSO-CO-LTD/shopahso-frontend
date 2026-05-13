"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { staffNavigation } from "@/components/staff/staff-data";
import { Button } from "@/components/ui/button";

type StaffSidebarProps = {
  isMobileOpen: boolean;
  isSidebarCollapsed: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
};

export default function StaffSidebar({
  isMobileOpen,
  isSidebarCollapsed,
  onCloseMobile,
  onToggleCollapse,
}: StaffSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {isMobileOpen ? (
        <button
          aria-label="Đóng menu nhân viên"
          className="fixed inset-0 z-30 bg-foreground/18 lg:hidden"
          onClick={onCloseMobile}
          type="button"
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex h-screen border-r border-border bg-muted/25 transition-transform duration-200 lg:static lg:h-full lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          isSidebarCollapsed ? "w-[96px]" : "w-[280px]",
        ].join(" ")}
      >
        <div className="flex h-full w-full flex-col overflow-hidden">
          <div className="shrink-0 border-b border-border px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className={isSidebarCollapsed ? "hidden" : "min-w-0"}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Nhân viên
                </p>
                <h2 className="mt-2 text-lg font-black tracking-tight">ShopAHSO Staff</h2>
                <p className="mt-1 text-xs text-muted-foreground">Vận hành đơn hàng và dữ liệu</p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  aria-label={isSidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
                  className="size-10 px-0"
                  onClick={onToggleCollapse}
                  type="button"
                  variant="outline"
                >
                  {isSidebarCollapsed ? (
                    <PanelLeftOpen className="size-4" />
                  ) : (
                    <PanelLeftClose className="size-4" />
                  )}
                </Button>
                <Button
                  aria-label="Đóng menu nhân viên"
                  className="size-10 px-0 lg:hidden"
                  onClick={onCloseMobile}
                  type="button"
                  variant="outline"
                >
                  <ChevronLeft className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-4">
            {staffNavigation.map((item, index) => {
              const Icon = item.icon;
              const isOverview = index === 0;
              const isActive = isOverview
                ? pathname === "/nhan-vien"
                : pathname === item.href;

              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  className={[
                    "flex w-full items-center gap-3 border px-3 py-3 text-left text-sm transition-colors",
                    isActive
                      ? "border-primary bg-background font-semibold text-foreground"
                      : "border-border text-muted-foreground hover:bg-background",
                    isSidebarCollapsed ? "justify-center" : "",
                  ].join(" ")}
                  href={item.href}
                  onClick={onCloseMobile}
                >
                  <Icon className="size-4 shrink-0" />
                  {isSidebarCollapsed ? (
                    <span className="sr-only">{item.label}</span>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
