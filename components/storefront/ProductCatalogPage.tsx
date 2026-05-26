"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  listCatalogBrands,
  listCatalogCategoriesTree,
  searchCatalogVariants,
} from "@/lib/api/services/catalog-variants.service";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import type { Brand } from "@/lib/brand/types";
import type { CategoryTreeNode } from "@/lib/category/types";
import { formatCatalogMoney, getCatalogPricingDisplay } from "@/lib/catalog/pricing";
import type { CatalogProductFilterOption, CatalogVariant } from "@/lib/catalog/types";
import { FALLBACK_LOGO_IMAGE } from "@/lib/image-fallbacks";
import { isContactForPrice } from "@/lib/pricing-status";
import { Skeleton } from "@/components/ui/skeleton";

function flattenCategories(tree: CategoryTreeNode[]) {
  const items: Array<{ id: string; slug: string; label: string }> = [];

  function walk(nodes: CategoryTreeNode[], depth: number) {
    nodes.forEach((node) => {
      items.push({
        id: node.id,
        slug: node.slug,
        label: `${"-- ".repeat(depth)}${node.name}`,
      });

      if (node.children.length > 0) {
        walk(node.children, depth + 1);
      }
    });
  }

  walk(tree, 0);
  return items;
}

type SortOption = "relevance" | "score" | "newest" | "price_asc" | "price_desc";

function extractProductsFromVariants(items: CatalogVariant[]): CatalogProductFilterOption[] {
  return items
    .map((variant) => variant.product)
    .filter((product): product is CatalogProductFilterOption => Boolean(product?.id && product?.name));
}

function mergeProductOptions(current: CatalogProductFilterOption[], incoming: CatalogProductFilterOption[]) {
  const map = new Map(current.map((item) => [item.id, item]));

  incoming.forEach((item) => {
    if (item?.id && item?.name) {
      map.set(item.id, item);
    }
  });

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

export default function ProductCatalogPage() {
  const [variants, setVariants] = useState<CatalogVariant[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<CatalogProductFilterOption[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categoryOptions = useMemo(() => flattenCategories(categoryTree), [categoryTree]);
  const keyword = searchParams.get("q") ?? "";
  const keywordDebounceRef = useRef<number | null>(null);
  const keywordInputRef = useRef<HTMLInputElement | null>(null);
  const catalogTopRef = useRef<HTMLDivElement | null>(null);
  const selectedProductSlug = searchParams.get("productSlug") ?? "";
  const legacyProductId = searchParams.get("productId") ?? "";
  const selectedCategorySlug = searchParams.get("categorySlug") ?? "";
  const selectedBrandSlug = searchParams.get("brandSlug") ?? "";
  const priceMin = searchParams.get("priceMin") ?? "";
  const priceMax = searchParams.get("priceMax") ?? "";
  const sort = (searchParams.get("sort") as SortOption | null) ?? "relevance";
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "24");

  const selectedCategoryId = useMemo(
    () => categoryOptions.find((category) => category.slug === selectedCategorySlug)?.id ?? "",
    [categoryOptions, selectedCategorySlug],
  );
  const selectedBrandId = useMemo(
    () => brands.find((brand) => brand.slug === selectedBrandSlug)?.id ?? "",
    [brands, selectedBrandSlug],
  );
  const selectedProductId = useMemo(() => {
    if (selectedProductSlug) {
      return products.find((product) => product.slug === selectedProductSlug)?.id ?? "";
    }

    return legacyProductId;
  }, [selectedProductSlug, legacyProductId, products]);
  const selectedProductSlugValue = useMemo(() => {
    if (selectedProductSlug) {
      return selectedProductSlug;
    }

    if (!legacyProductId) {
      return "";
    }

    return products.find((product) => product.id === legacyProductId)?.slug ?? "";
  }, [selectedProductSlug, legacyProductId, products]);

  const updateQuery = useCallback((
    updates: Record<string, string | null | undefined>,
    options?: { resetPage?: boolean },
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    if (options?.resetPage) {
      params.delete("page");
    }

    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  function handleKeywordChange(rawValue: string) {
    if (keywordDebounceRef.current !== null) {
      window.clearTimeout(keywordDebounceRef.current);
    }

    keywordDebounceRef.current = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (rawValue.trim()) {
        params.set("q", rawValue);
      } else {
        params.delete("q");
      }
      params.delete("page");
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }, 350);
  }

  function resetAllFilters() {
    if (keywordDebounceRef.current !== null) {
      window.clearTimeout(keywordDebounceRef.current);
      keywordDebounceRef.current = null;
    }
    if (keywordInputRef.current) {
      keywordInputRef.current.value = "";
    }
    router.replace(pathname, { scroll: false });
  }

  function scrollToCatalogTop() {
    if (!catalogTopRef.current) {
      return;
    }

    const nextTop = window.scrollY + catalogTopRef.current.getBoundingClientRect().top - 12;
    window.scrollTo({ top: nextTop, behavior: "smooth" });
  }

  function handlePageChange(nextPage: number) {
    updateQuery({ page: String(nextPage) });
    window.requestAnimationFrame(scrollToCatalogTop);
  }

  function handleVariantCardNavigate(variantSlug: string, eventTarget: EventTarget | null) {
    if (eventTarget instanceof HTMLElement && eventTarget.closest("a, button")) {
      return;
    }

    router.push(`/san-pham/${variantSlug}`);
  }

  useEffect(() => {
    if (!keywordInputRef.current) {
      return;
    }

    if (document.activeElement === keywordInputRef.current) {
      return;
    }

    keywordInputRef.current.value = keyword;
  }, [keyword]);

  useEffect(() => {
    return () => {
      if (keywordDebounceRef.current !== null) {
        window.clearTimeout(keywordDebounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    async function loadInitialFilters() {
      const [brandsResult, categoriesResult] = await Promise.allSettled([
        listCatalogBrands(),
        listCatalogCategoriesTree(),
      ]);

      if (brandsResult.status === "fulfilled") {
        setBrands(brandsResult.value);
      } else {
        toast.error("Không thể tải danh sách thương hiệu.");
      }

      if (categoriesResult.status === "fulfilled") {
        setCategoryTree(categoriesResult.value);
      } else {
        toast.error("Không thể tải danh mục sản phẩm.");
      }
    }

    void loadInitialFilters();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAllProductsForFilter() {
      try {
        const firstPage = await searchCatalogVariants({
          page: 1,
          limit: 100,
          sort: "relevance",
        });

        let merged = extractProductsFromVariants(firstPage.items);
        const totalPagesToLoad = Math.max(firstPage.totalPages, 1);

        for (let currentPage = 2; currentPage <= totalPagesToLoad; currentPage += 1) {
          const pageResponse = await searchCatalogVariants({
            page: currentPage,
            limit: 100,
            sort: "relevance",
          });
          merged = mergeProductOptions(merged, extractProductsFromVariants(pageResponse.items));
        }

        if (!cancelled) {
          setProducts((current) => mergeProductOptions(current, merged));
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Không thể tải danh sách sản phẩm.");
        }
      }
    }

    void loadAllProductsForFilter();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedProductSlug || !legacyProductId || products.length === 0) {
      return;
    }

    const matchedProduct = products.find((product) => product.id === legacyProductId);
    if (!matchedProduct?.slug) {
      return;
    }

    updateQuery({ productSlug: matchedProduct.slug, productId: null });
  }, [selectedProductSlug, legacyProductId, products, updateQuery]);

  useEffect(() => {
    async function loadVariants() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await searchCatalogVariants({
          q: keyword.trim() || undefined,
          productId: selectedProductId || undefined,
          sort,
          page: Number.isFinite(page) && page > 0 ? page : 1,
          limit,
          brandId: selectedBrandId || undefined,
          categoryId: selectedCategoryId || undefined,
          priceMax: priceMax.trim() ? Number(priceMax) : undefined,
          priceMin: priceMin.trim() ? Number(priceMin) : undefined,
        });

        setVariants(response.items);
        setTotal(response.total);
        setTotalPages(Math.max(response.totalPages, 1));

        const productsFromVariants = extractProductsFromVariants(response.items);
        if (productsFromVariants.length > 0) {
          setProducts((current) => mergeProductOptions(current, productsFromVariants));
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Không thể tải danh sách sản phẩm.");
        setVariants([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    }

    void loadVariants();
  }, [keyword, selectedProductId, sort, page, limit, priceMax, priceMin, selectedBrandId, selectedCategoryId]);

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);
  const activeFilterCount = [
    keyword.trim(),
    selectedCategorySlug,
    selectedProductSlugValue,
    selectedBrandSlug,
    priceMin,
    priceMax,
  ].filter(Boolean).length;

  return (
    <main className="border-t border-border bg-background">
      <section className="container mx-auto px-4 py-6 sm:py-8 lg:py-12">
        <div ref={catalogTopRef} />

        <header className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-8 sm:gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Danh mục sản phẩm
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">Sản phẩm công nghiệp</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Tìm theo tên, SKU, thương hiệu, danh mục và khoảng giá.
            </p>
          </div>
          <p className="w-full border border-border bg-muted/10 px-3 py-2 text-sm font-semibold text-muted-foreground sm:w-auto sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
            {total === 0 ? "Không có kết quả" : `Hiển thị ${startItem}-${endItem} / ${total}`}
          </p>
        </header>

        <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
          <button
            type="button"
            className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center border border-border px-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
            onClick={() => setIsFilterPanelOpen((currentState) => !currentState)}
          >
            {isFilterPanelOpen ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
            {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
          <button
            type="button"
            onClick={resetAllFilters}
            className="inline-flex h-10 cursor-pointer items-center justify-center border border-border px-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
          >
            Xóa
          </button>
        </div>
        <section className={`${isFilterPanelOpen ? "grid" : "hidden"} mb-6 gap-4 lg:grid lg:grid-cols-3`}>
          <div className="border border-border bg-background p-4 lg:col-span-2">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Bộ lọc</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <label className="grid gap-2 text-sm sm:col-span-2 xl:col-span-5">
                <span className="font-semibold">Từ khóa</span>
                <input
                  className="h-11 border border-border px-3 outline-none focus:border-primary sm:h-10"
                  defaultValue={keyword}
                  ref={keywordInputRef}
                  onChange={(event) => handleKeywordChange(event.target.value)}
                  placeholder="VD: schneider, MCB-2P-20A..."
                  type="text"
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-semibold">Sắp xếp</span>
                <select
                  className="h-11 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary sm:h-10"
                  onChange={(event) => updateQuery({ sort: event.target.value as SortOption }, { resetPage: true })}
                  value={sort}
                >
                  <option value="relevance">Liên quan</option>
                  <option value="score">Điểm đánh giá</option>
                  <option value="newest">Mới nhất</option>
                  <option value="price_asc">Giá tăng dần</option>
                  <option value="price_desc">Giá giảm dần</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-semibold">Danh mục</span>
                <select
                  className="h-11 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary sm:h-10"
                  onChange={(event) => updateQuery({ categorySlug: event.target.value }, { resetPage: true })}
                  value={selectedCategorySlug}
                >
                  <option value="">Tất cả danh mục</option>
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-semibold">Sản phẩm</span>
                <select
                  className="h-11 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary sm:h-10"
                  onChange={(event) =>
                    updateQuery(
                      {
                        productSlug: event.target.value,
                        productId: null,
                      },
                      { resetPage: true },
                    )
                  }
                  value={selectedProductSlugValue}
                >
                  <option value="">Tất cả sản phẩm</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.slug}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-semibold">Thương hiệu</span>
                <select
                  className="h-11 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary sm:h-10"
                  onChange={(event) => updateQuery({ brandSlug: event.target.value }, { resetPage: true })}
                  value={selectedBrandSlug}
                >
                  <option value="">Tất cả thương hiệu</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.slug}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="inline-flex h-11 w-full cursor-pointer items-center justify-center border border-border px-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary sm:h-10"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          </div>

          <div className="border border-border bg-background p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Khoảng giá</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <label className="grid gap-2 text-sm">
                <span className="font-semibold">Giá thấp nhất</span>
                <input
                  className="input-no-spin h-11 border border-border px-3 outline-none focus:border-primary sm:h-10"
                  min={0}
                  onWheel={(event) => event.currentTarget.blur()}
                  onChange={(event) => updateQuery({ priceMin: event.target.value }, { resetPage: true })}
                  placeholder="VD: 100000"
                  type="number"
                  value={priceMin}
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-semibold">Giá cao nhất</span>
                <input
                  className="input-no-spin h-11 border border-border px-3 outline-none focus:border-primary sm:h-10"
                  min={0}
                  onWheel={(event) => event.currentTarget.blur()}
                  onChange={(event) => updateQuery({ priceMax: event.target.value }, { resetPage: true })}
                  placeholder="VD: 5000000"
                  type="number"
                  value={priceMax}
                />
              </label>
            </div>
          </div>
        </section>

        {!isLoading && !errorMessage && variants.length > 0 ? (
          <PaginationControls
            className="mb-6"
            page={page}
            totalPages={totalPages}
            onNext={() => handlePageChange(page + 1)}
            onPrev={() => handlePageChange(page - 1)}
          />
        ) : null}

        {isLoading ? (
          <CatalogSkeleton />
        ) : errorMessage ? (
          <div className="min-h-[24rem] border border-border p-8 text-sm text-destructive">{errorMessage}</div>
        ) : variants.length === 0 ? (
          <div className="min-h-[24rem] border border-border p-8 text-sm text-muted-foreground">
            Không có sản phẩm phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <>
            <div className="grid min-h-[24rem] content-start grid-cols-1 gap-3 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {variants.map((variant) => (
                <ProductCard
                  key={variant.id}
                  onNavigate={handleVariantCardNavigate}
                  variant={variant}
                />
              ))}
            </div>

            <PaginationControls
              className="mt-6"
              page={page}
              totalPages={totalPages}
              onNext={() => handlePageChange(page + 1)}
              onPrev={() => handlePageChange(page - 1)}
            />
          </>
        )}
      </section>
    </main>
  );
}

function ProductCard({
  onNavigate,
  variant,
}: {
  onNavigate: (variantSlug: string, eventTarget: EventTarget | null) => void;
  variant: CatalogVariant;
}) {
  const isOutOfStock = variant.stockQuantity <= 0;
  const requiresQuote = isContactForPrice(variant.pricingStatus);
  const imageUrl = variant.effectiveImageUrls?.[0] ?? FALLBACK_LOGO_IMAGE;
  const isFallbackImage = imageUrl === FALLBACK_LOGO_IMAGE;
  const stockLabel = isOutOfStock ? "Hết hàng" : `${variant.stockQuantity} ${variant.unit ?? ""}`.trim();

  return (
    <article
      aria-label={`Xem chi tiết ${variant.name}`}
      className={[
        "group relative flex min-h-[30rem] cursor-pointer flex-col overflow-hidden border border-border bg-background transition-[border-color,box-shadow,transform] duration-200",
        "hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_10px_24px_rgba(15,23,42,0.12)]",
        "focus-visible:border-primary focus-visible:outline-none",
        isOutOfStock ? "text-muted-foreground" : "",
      ].join(" ")}
      onClick={(event) => onNavigate(variant.slug, event.target)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onNavigate(variant.slug, event.target);
        }
      }}
      role="link"
      tabIndex={0}
    >
      {isOutOfStock ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-muted/35">
          <div className="-rotate-6 border-2 border-foreground/45 px-6 py-3 text-center shadow-[0_0_0_1px_rgba(15,23,42,0.08)_inset]">
            <span className="block text-lg font-black uppercase tracking-[0.22em] text-foreground/70 sm:text-xl">
              Hết hàng
            </span>
          </div>
        </div>
      ) : null}

      <div className={`relative border-b border-border ${isOutOfStock ? "bg-muted/30" : "bg-muted/10"}`}>
        <div className="relative aspect-[5/4] w-full">
          <Image
            alt={variant.name}
            className={`${isFallbackImage ? "object-contain p-8" : "object-cover"} ${isOutOfStock ? "opacity-50 grayscale" : ""}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
            src={imageUrl}
          />
        </div>

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {!isOutOfStock && requiresQuote ? (
            <span className="border border-yellow-500 bg-yellow-400 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-foreground">
              Báo giá
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {variant.category.name}
          </p>
          <p className="shrink-0 font-mono text-[11px] text-muted-foreground">{variant.sku}</p>
        </div>

        <h2 className="mt-2 line-clamp-2 min-h-11 text-base font-black leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
          {variant.name}
        </h2>

        <div className="mt-4 grid grid-cols-2 border border-border text-xs">
          <ProductMetaItem label="Thương hiệu" value={variant.brand?.name ?? "Chưa gắn"} />
          <ProductMetaItem label="Tồn kho" value={stockLabel} />
        </div>

        <div className="mt-auto pt-4">
          <CatalogPrice variant={variant} />
        </div>
      </div>

      <div className="grid grid-cols-[0.9fr_1.1fr] gap-2 border-t border-border p-3">
        <ButtonLink href={`/san-pham/${variant.slug}`} label="Chi tiết" />
        <AddToCartButton
          active={variant.active}
          className="h-10 w-full sm:h-9"
          label="Thêm"
          pricingStatus={variant.pricingStatus}
          stockQuantity={variant.stockQuantity}
          variantId={variant.id}
        />
      </div>
    </article>
  );
}

function ProductMetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-b border-r border-border px-3 py-2 even:border-r-0 [&:nth-last-child(-n+2)]:border-b-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-semibold text-foreground">{value}</p>
    </div>
  );
}

function PaginationControls({
  className,
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  className?: string;
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className={`${className ?? ""} flex items-center justify-center gap-2`}>
      <button
        type="button"
        disabled={page <= 1}
        onClick={onPrev}
        className="inline-flex h-9 min-w-20 cursor-pointer items-center justify-center border border-border px-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        Trước
      </button>
      <p className="px-2 text-sm text-muted-foreground">Trang {page}/{totalPages}</p>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={onNext}
        className="inline-flex h-9 min-w-20 cursor-pointer items-center justify-center border border-border px-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        Sau
      </button>
    </div>
  );
}

function ButtonLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 w-full cursor-pointer items-center justify-center border border-border px-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary sm:h-9"
    >
      {label}
    </Link>
  );
}

function CatalogPrice({ variant }: { variant: CatalogVariant }) {
  if (isContactForPrice(variant.pricingStatus)) {
    return (
      <div className="border-t border-border pt-3">
        <p className="text-lg font-black text-primary">Liên hệ báo giá</p>
        <p className="mt-1 text-xs text-muted-foreground">Giá xác nhận theo số lượng và thời điểm đặt hàng.</p>
      </div>
    );
  }

  const pricing = getCatalogPricingDisplay({
    fallbackPrice: variant.salePrice ?? variant.price,
    pricing: variant.pricing,
    tax: variant.tax,
  });

  return (
    <div className="border-t border-border pt-3">
      <p className="text-lg font-black text-primary">{formatCatalogMoney(pricing.totalWithTax)}</p>
      <p className="text-xs text-muted-foreground">
        Đã gồm thuế {pricing.taxPercent}% ({formatCatalogMoney(pricing.taxAmount)})
      </p>
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div className="grid min-h-[24rem] content-start grid-cols-1 gap-3 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <article key={`catalog-skeleton-${index}`} className="flex flex-col border border-border bg-background">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="space-y-2 border-b border-border px-4 py-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
          </div>
          <div className="flex flex-1 flex-col gap-2 px-4 py-4">
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="mt-1 h-6 w-1/2" />
          </div>
          <div className="border-t border-border px-4 py-3">
            <Skeleton className="h-9 w-full" />
          </div>
        </article>
      ))}
    </div>
  );
}
