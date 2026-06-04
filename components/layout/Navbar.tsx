"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { toast } from "sonner";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShoppingCart,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { searchCatalogVariants } from "@/lib/api/services/catalog-variants.service";
import type { CatalogVariant } from "@/lib/catalog/types";
import { useCart } from "@/components/cart/CartProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const navRef = useRef<HTMLElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { isAuthenticated, isInitializing, logout, profile } = useAuth();
  const { cart, isLoading: isCartLoading, openDrawer } = useCart();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<CatalogVariant[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      if (
        isMobileMenuOpen &&
        !mobileMenuRef.current?.contains(event.target as Node) &&
        !mobileToggleRef.current?.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
        setIsSearchOpen(false);
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileMenuOpen]);

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

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const keyword = searchKeyword.trim();
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);

    if (!keyword) {
      router.push("/san-pham");
      return;
    }

    const params = new URLSearchParams();
    params.set("q", keyword);
    router.push(`/san-pham?${params.toString()}`);
  }

  function closeMobileMenu() {
    setIsAccountMenuOpen(false);
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
  }

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4 lg:h-20 lg:gap-8">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center bg-white p-1 lg:h-12 lg:w-12">
            <Image
              src="/logo.png"
              alt="ShopAHSO"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <span className="hidden text-2xl font-black tracking-tight sm:block">
            Shop<span className="text-primary">AHSO</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold lg:flex">
          <Link href="/" className="transition-colors hover:text-primary">
            Trang chủ
          </Link>
          <Link href="/san-pham" className="transition-colors hover:text-primary">
            Sản phẩm
          </Link>
          <Link href="/thuong-hieu" className="transition-colors hover:text-primary">
            Thương hiệu
          </Link>
          <Link href="https://ahso.vn" className="transition-colors hover:text-primary">
            Về AHSO
          </Link>
        </nav>

        <div ref={searchBoxRef} className="relative hidden max-w-xl flex-1 md:block">
          <form className="relative flex items-center" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Tìm mã SKU, thông số kỹ thuật..."
              className="h-10 w-full border border-border bg-muted px-10 pr-20 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
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
            <button
              type="submit"
              className="absolute right-1 inline-flex h-8 items-center justify-center border border-border bg-background px-3 text-xs font-semibold transition-colors hover:border-primary hover:text-primary"
            >
              Tìm
            </button>
          </form>

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

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            className="relative inline-flex size-10 items-center justify-center border border-transparent p-2 transition-colors hover:border-primary hover:bg-muted hover:text-primary"
            onClick={openDrawer}
            aria-label="Mở giỏ hàng"
          >
            <ShoppingCart className="size-5" />
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center bg-primary px-1 text-[10px] font-bold text-white">
              {isCartLoading && !cart ? "..." : cart?.summary.itemCount ?? 0}
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
                  <Link
                    href="/tai-khoan"
                    role="menuitem"
                    className="flex w-full items-center gap-3 px-3 py-3 text-sm font-semibold transition-colors hover:bg-muted"
                    onClick={() => setIsAccountMenuOpen(false)}
                  >
                    <UserCircle className="size-4" />
                    <span>Hồ sơ</span>
                  </Link>
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

          <button
            ref={mobileToggleRef}
            type="button"
            className="inline-flex size-10 cursor-pointer items-center justify-center border border-border transition-colors hover:border-primary hover:bg-muted hover:text-primary lg:hidden"
            aria-label={isMobileMenuOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((currentState) => !currentState)}
          >
            {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {isMobileMenuOpen ? (
        <div ref={mobileMenuRef} className="border-t border-border bg-background lg:hidden">
          <div className="container mx-auto grid gap-4 px-4 py-4">
            <div className="relative">
              <form className="relative flex items-center" onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  placeholder="Tìm SKU, thông số kỹ thuật..."
                  className="h-11 w-full border border-border bg-muted px-10 pr-20 text-sm outline-none focus:border-primary"
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
                <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
                <button
                  type="submit"
                  className="absolute right-1 inline-flex h-9 cursor-pointer items-center justify-center border border-border bg-background px-3 text-xs font-semibold transition-colors hover:border-primary hover:text-primary"
                >
                  Tìm
                </button>
              </form>

              {isSearchOpen ? (
                <SearchResultPanel
                  isLoading={isSearchLoading}
                  results={searchResults}
                  total={searchTotal}
                  onSelect={closeMobileMenu}
                />
              ) : null}
            </div>

            <nav className="grid border border-border text-sm font-semibold">
              <MobileNavLink href="/" label="Trang chủ" onSelect={closeMobileMenu} />
              <MobileNavLink href="/san-pham" label="Sản phẩm" onSelect={closeMobileMenu} />
              <MobileNavLink href="/thuong-hieu" label="Thương hiệu" onSelect={closeMobileMenu} />
              <MobileNavLink href="https://ahso.vn" label="Về AHSO" onSelect={closeMobileMenu} />
            </nav>

            <div className="border border-border bg-muted/10 p-3">
              {isInitializing ? (
                <p className="text-sm font-semibold text-muted-foreground">Đang tải tài khoản...</p>
              ) : isAuthenticated && profile ? (
                <div className="grid gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Tài khoản
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold">{profile.email}</p>
                  </div>
                  <div className="grid border border-border bg-background">
                    <MobileMenuItem href="/tai-khoan" icon={<UserCircle className="size-4" />} label="Hồ sơ" onSelect={closeMobileMenu} />
                    {profile.role === "ADMIN" ? (
                      <MobileMenuItem href="/admin" icon={<LayoutDashboard className="size-4" />} label="Trang quản trị" onSelect={closeMobileMenu} />
                    ) : null}
                    {profile.role === "STAFF" || profile.role === "ADMIN" ? (
                      <MobileMenuItem href="/nhan-vien" icon={<Users className="size-4" />} label="Trang nhân viên" onSelect={closeMobileMenu} />
                    ) : null}
                    <button
                      type="button"
                      className="flex h-11 w-full cursor-pointer items-center gap-3 border-t border-border px-3 text-left text-sm font-semibold transition-colors hover:bg-muted"
                      onClick={() => {
                        closeMobileMenu();
                        void handleLogout();
                      }}
                    >
                      <LogOut className="size-4" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              ) : (
                <Button asChild className="h-11 w-full text-sm font-semibold">
                  <Link href="/dang-nhap" onClick={closeMobileMenu}>
                    Đăng nhập
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
};

function SearchResultPanel({
  isLoading,
  onSelect,
  results,
  total,
}: {
  isLoading: boolean;
  onSelect: () => void;
  results: CatalogVariant[];
  total: number;
}) {
  return (
    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 border border-border bg-background">
      {isLoading ? (
        <p className="px-4 py-3 text-sm text-muted-foreground">Đang tìm kiếm...</p>
      ) : results.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted-foreground">Không tìm thấy kết quả phù hợp.</p>
      ) : (
        <>
          <ul className="divide-y divide-border">
            {results.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/san-pham/${item.slug}`}
                  className="block px-4 py-3 transition-colors hover:bg-muted/40"
                  onClick={onSelect}
                >
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    SKU: {item.sku} | {item.product.name}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
            Tổng kết quả: {total}
          </div>
        </>
      )}
    </div>
  );
}

function MobileNavLink({
  href,
  label,
  onSelect,
}: {
  href: string;
  label: string;
  onSelect: () => void;
}) {
  return (
    <Link
      href={href}
      className="flex h-11 cursor-pointer items-center border-b border-border px-3 transition-colors last:border-b-0 hover:bg-muted hover:text-primary"
      onClick={onSelect}
    >
      {label}
    </Link>
  );
}

function MobileMenuItem({
  href,
  icon,
  label,
  onSelect,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  onSelect: () => void;
}) {
  return (
    <Link
      href={href}
      className="flex h-11 cursor-pointer items-center gap-3 border-b border-border px-3 text-sm font-semibold transition-colors last:border-b-0 hover:bg-muted"
      onClick={onSelect}
    >
      {icon}
      {label}
    </Link>
  );
}

export default Navbar;
