"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { toast } from "sonner";
import { ChevronDown, LayoutDashboard, LogOut, Users } from "lucide-react";
import { searchCatalogVariants } from "@/lib/api/services/catalog-variants.service";
import type { CatalogVariant } from "@/lib/catalog/types";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const navRef = useRef<HTMLElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { isAuthenticated, isInitializing, logout, profile } = useAuth();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<CatalogVariant[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTotal, setSearchTotal] = useState(0);

  useEffect(() => {
    gsap.fromTo(
      navRef.current,
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
    );
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
      if (!searchBoxRef.current?.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
        setIsSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    const keyword = searchKeyword.trim();

    if (!keyword) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsSearchLoading(true);
      try {
        const response = await searchCatalogVariants({
          q: keyword,
          sort: "relevance",
          page: 1,
          limit: 8,
        });
        setSearchResults(response.items);
        setSearchTotal(response.total);
        setIsSearchOpen(true);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thể tìm kiếm sản phẩm.");
      } finally {
        setIsSearchLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchKeyword]);

  const handleLogout = async () => {
    const loadingToastId = toast.loading("Đang đăng xuất...");

    try {
      setIsAccountMenuOpen(false);
      await logout();
      toast.success("Đăng xuất thành công.", {
        id: loadingToastId,
      });
      router.replace("/");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể đăng xuất. Vui lòng thử lại.";

      toast.error(message, {
        id: loadingToastId,
      });
    }
  };

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container mx-auto flex h-20 items-center justify-between gap-8 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center bg-white p-1">
            <Image
              src="/logo.png"
              alt="ShopAHSO"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <span className="hidden text-2xl font-black tracking-tight sm:block">
            Shop<span className="text-primary">AHSO</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold lg:flex">
          <Link href="/san-pham" className="transition-colors hover:text-primary">
            Sản phẩm
          </Link>
          <Link href="/thuong-hieu" className="transition-colors hover:text-primary">
            Thương hiệu
          </Link>
          <Link href="/datasheet" className="transition-colors hover:text-primary">
            Datasheet
          </Link>
          <Link href="/contact" className="transition-colors hover:text-primary">
            Liên hệ
          </Link>
        </nav>

        <div ref={searchBoxRef} className="relative hidden max-w-xl flex-1 md:block">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Tìm mã SKU, thông số kỹ thuật..."
              className="h-10 w-full border border-border bg-muted px-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              onChange={(event) => {
                const value = event.target.value;
                setSearchKeyword(value);
                if (!value.trim()) {
                  setSearchResults([]);
                  setSearchTotal(0);
                  setIsSearchOpen(false);
                }
              }}
              onFocus={() => {
                if (searchKeyword.trim()) {
                  setIsSearchOpen(true);
                }
              }}
              value={searchKeyword}
            />
            <div className="pointer-events-none absolute left-3 flex items-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="square"
                strokeLinejoin="miter"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <div className="pointer-events-none absolute right-3 flex items-center gap-1 border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              <span>CTRL</span>
              <span>K</span>
            </div>
          </div>
          {isSearchOpen ? (
            <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-50 border border-border bg-background">
              {isSearchLoading ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">Đang tìm kiếm...</p>
              ) : searchResults.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">Không tìm thấy kết quả phù hợp.</p>
              ) : (
                <>
                  <ul className="divide-y divide-border">
                    {searchResults.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={`/san-pham/${item.slug}`}
                          className="block px-4 py-3 transition-colors hover:bg-muted/40"
                          onClick={() => setIsSearchOpen(false)}
                        >
                          <p className="truncate text-sm font-semibold">{item.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            SKU: {item.sku} • {item.product.name}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
                    Tổng kết quả: {searchTotal}
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-4">
          <button type="button" className="relative p-2 transition-colors hover:bg-muted">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
              strokeLinejoin="miter"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center bg-primary text-[10px] font-bold text-white">
              0
            </span>
          </button>

          {isInitializing ? (
            <div className="hidden border border-border px-4 py-2 text-xs text-muted-foreground sm:block">
              Đang tải
            </div>
          ) : isAuthenticated && profile ? (
            <div ref={accountMenuRef} className="relative hidden sm:block">
              <button
                type="button"
                className="flex w-[240px] items-center justify-between gap-3 border border-border px-4 py-2 text-left transition-colors hover:bg-muted"
                aria-expanded={isAccountMenuOpen}
                aria-haspopup="menu"
                onClick={() => setIsAccountMenuOpen((currentState) => !currentState)}
              >
                <div className="min-w-0">
                  <div className="text-[11px] text-muted-foreground">Tài khoản</div>
                  <div className="truncate text-sm font-semibold">{profile.email}</div>
                </div>
                <ChevronDown
                  className={`shrink-0 size-4 transition-transform ${
                    isAccountMenuOpen ? "rotate-180" : "rotate-0"
                  }`}
                />
              </button>

              {isAccountMenuOpen ? (
                <div
                  role="menu"
                  className="absolute top-[calc(100%+8px)] right-0 w-full border border-border bg-background p-2 shadow-sm"
                >
                  {profile.role === "ADMIN" ? (
                    <Link
                      href="/admin"
                      role="menuitem"
                      className="flex w-full items-center gap-3 px-3 py-3 text-sm font-semibold transition-colors hover:bg-muted"
                      onClick={() => setIsAccountMenuOpen(false)}
                    >
                      <LayoutDashboard className="size-4" />
                      <span>Trang quản trị</span>
                    </Link>
                  ) : null}
                  {profile.role === "STAFF" || profile.role === "ADMIN" ? (
                    <Link
                      href="/nhan-vien"
                      role="menuitem"
                      className="flex w-full items-center gap-3 px-3 py-3 text-sm font-semibold transition-colors hover:bg-muted"
                      onClick={() => setIsAccountMenuOpen(false)}
                    >
                      <Users className="size-4" />
                      <span>Trang nhân viên</span>
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-3 px-3 py-3 text-sm font-semibold transition-colors hover:bg-muted"
                    onClick={handleLogout}
                  >
                    <LogOut className="size-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="hidden items-center gap-3 sm:flex">
              <Button asChild size="lg" className="h-10 px-4 text-xs font-semibold">
                <Link href="/dang-nhap">Đăng nhập</Link>
              </Button>
            </div>
          )}

          <button type="button" className="p-2 lg:hidden">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
              strokeLinejoin="miter"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
