"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import BrandDetailHeader from "@/components/storefront/BrandDetailHeader";
import CatalogVariantCard from "@/components/storefront/CatalogVariantCard";
import QuoteRequestModal from "@/components/quote-requests/QuoteRequestModal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  listCatalogBrands,
  listCatalogCategoriesTree,
  listCatalogVariants,
  searchCatalogVariants,
} from "@/lib/api/services/catalog-variants.service";
import type { Brand } from "@/lib/brand/types";
import type { CatalogVariant } from "@/lib/catalog/types";
import type { CategoryTreeNode } from "@/lib/category/types";

type SortOption = "relevance" | "score" | "newest" | "price_asc" | "price_desc";

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Phù hợp nhất", value: "relevance" },
  { label: "Điểm cao nhất", value: "score" },
  { label: "Mới nhất", value: "newest" },
  { label: "Giá tăng dần", value: "price_asc" },
  { label: "Giá giảm dần", value: "price_desc" },
];

const PAGE_LIMIT = 24;

type BrandDisplay = Pick<Brand, "name" | "slug" | "logoUrl" | "bannerUrl">;

function flattenCategories(nodes: CategoryTreeNode[], depth = 0): { id: string; name: string; depth: number }[] {
  return nodes.flatMap((node) => [
    { id: node.id, name: node.name, depth },
    ...flattenCategories(node.children, depth + 1),
  ]);
}

function hasBrandProducts(node: CategoryTreeNode, brandCategoryIds: Set<string>): boolean {
  if (brandCategoryIds.has(node.id)) return true;
  return node.children.some((child) => hasBrandProducts(child, brandCategoryIds));
}

function flattenCategoriesForBrand(
  nodes: CategoryTreeNode[],
  brandCategoryIds: Set<string>,
  depth = 0,
): { id: string; name: string; depth: number }[] {
  const result: { id: string; name: string; depth: number }[] = [];
  for (const node of nodes) {
    if (hasBrandProducts(node, brandCategoryIds)) {
      result.push({ id: node.id, name: node.name, depth });
      result.push(...flattenCategoriesForBrand(node.children, brandCategoryIds, depth + 1));
    }
  }
  return result;
}

export default function BrandDetailPage({ slug }: { slug: string }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; depth: number }[]>([]);
  const [variants, setVariants] = useState<CatalogVariant[]>([]);
  const [quoteVariant, setQuoteVariant] = useState<CatalogVariant | null>(null);

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sort, setSort] = useState<SortOption>("relevance");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  const selectedBrand = useMemo<BrandDisplay | null>(
    () => brands.find((b) => b.slug === slug) ?? null,
    [brands, slug],
  );

  const matchedBrandId = useMemo(
    () => brands.find((b) => b.slug === slug)?.id ?? null,
    [brands, slug],
  );

  const hasActiveFilter = debouncedQ !== "" || categoryId !== "" || sort !== "relevance";

  // Debounce keyword input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [q]);

  // Bootstrap: load brands + category tree in parallel
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      // Reset filter state when navigating between brands
      setQ("");
      setDebouncedQ("");
      setCategoryId("");
      setSort("relevance");
      setPage(1);
      setIsBootstrapping(true);
      setErrorMessage(null);

      try {
        const [brandsData, categoryTree] = await Promise.all([
          listCatalogBrands(),
          listCatalogCategoriesTree(),
        ]);

        if (cancelled) return;

        setBrands(brandsData);

        const resolvedBrandId = brandsData.find((b) => b.slug === slug)?.id;

        let filteredCats = flattenCategories(categoryTree);
        if (resolvedBrandId) {
          try {
            const brandVariants = await listCatalogVariants({ brandId: resolvedBrandId, limit: 500 });
            const brandCategoryIds = new Set(
              brandVariants.map((v) => v.category?.id).filter((id): id is string => Boolean(id)),
            );
            if (brandCategoryIds.size > 0) {
              filteredCats = flattenCategoriesForBrand(categoryTree, brandCategoryIds);
            }
          } catch {
            // optional — fall back to full category tree
          }
        }

        setCategories(filteredCats);
      } catch {
        if (!cancelled) {
          setErrorMessage("Không thể tải dữ liệu thương hiệu.");
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    }

    void bootstrap();
    return () => { cancelled = true; };
  }, [slug]);

  // Load variants whenever brandId, filters, or reloadKey change
  useEffect(() => {
    if (!matchedBrandId) return;
    let cancelled = false;

    async function loadVariants() {
      setIsLoadingVariants(true);
      try {
        const response = await searchCatalogVariants({
          brandId: matchedBrandId!,
          q: debouncedQ || undefined,
          categoryId: categoryId || undefined,
          sort,
          page,
          limit: PAGE_LIMIT,
        });
        if (cancelled) return;
        setVariants(response.items);
        setTotal(response.total);
        setTotalPages(Math.max(response.totalPages, 1));
      } catch {
        if (cancelled) return;
        toast.error("Không thể tải sản phẩm.");
        setVariants([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        if (!cancelled) setIsLoadingVariants(false);
      }
    }

    void loadVariants();
    return () => { cancelled = true; };
  }, [matchedBrandId, debouncedQ, categoryId, sort, page, reloadKey]);

  function handleCategoryChange(nextCategoryId: string) {
    setCategoryId(nextCategoryId);
    setPage(1);
  }

  function handleSortChange(nextSort: SortOption) {
    setSort(nextSort);
    setPage(1);
  }

  function handleReset() {
    setQ("");
    setDebouncedQ("");
    setCategoryId("");
    setSort("relevance");
    setPage(1);
    setReloadKey((k) => k + 1);
    inputRef.current?.focus();
  }

  const startItem = total === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1;
  const endItem = Math.min(page * PAGE_LIMIT, total);

  return (
    <main className="border-t border-border bg-background">
      <section className="container mx-auto px-4 py-10 lg:py-12">
        <div className="mb-6">
          <Link
            href="/thuong-hieu"
            className="inline-flex h-9 cursor-pointer items-center border border-border px-3 text-xs font-semibold transition-colors hover:border-primary hover:text-primary"
          >
            Quay lại danh sách thương hiệu
          </Link>
        </div>

        {isBootstrapping ? (
          <BootstrapSkeleton />
        ) : errorMessage ? (
          <div className="border border-border p-8 text-sm text-destructive">{errorMessage}</div>
        ) : !selectedBrand ? (
          <div className="border border-border p-8 text-sm text-muted-foreground">Không tìm thấy thương hiệu.</div>
        ) : (
          <>
            <BrandDetailHeader brand={selectedBrand} variantCount={total} />

            {/* Filter bar */}
            <div className="mb-4 flex flex-col gap-3 border border-border bg-muted/20 p-3 sm:flex-row sm:items-center">
              {/* Keyword search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tìm SKU, tên sản phẩm, thông số..."
                  className="h-10 w-full border border-border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                  aria-label="Tìm kiếm trong thương hiệu này"
                />
              </div>

              {/* Category filter */}
              {categories.length > 0 && (
                <select
                  value={categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="h-10 cursor-pointer border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary sm:w-52"
                  aria-label="Lọc theo danh mục"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.depth > 0 ? `${"  ".repeat(cat.depth)}↳ ` : ""}{cat.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Sort */}
              <select
                value={sort}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="h-10 cursor-pointer border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary sm:w-44"
                aria-label="Sắp xếp sản phẩm"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Reset */}
              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex h-10 cursor-pointer items-center gap-2 border border-border bg-background px-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
                  aria-label="Xoá bộ lọc"
                >
                  <RotateCcw className="size-4" />
                  Xoá lọc
                </button>
              )}
            </div>

            {/* Results summary */}
            {!isLoadingVariants && total > 0 && (
              <p className="mb-3 text-sm text-muted-foreground">
                Hiển thị {startItem}–{endItem} / {total} sản phẩm
              </p>
            )}

            {/* Grid */}
            {isLoadingVariants ? (
              <VariantsSkeleton />
            ) : variants.length === 0 ? (
              <div className="border border-border bg-muted/20 p-8 text-sm text-muted-foreground">
                {hasActiveFilter
                  ? "Không tìm thấy sản phẩm phù hợp. Thử bỏ bớt bộ lọc."
                  : "Nhóm này hiện chưa có sản phẩm đang mở bán."}
              </div>
            ) : (
              <div className="grid min-h-[24rem] content-start grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
                {variants.map((variant) => (
                  <CatalogVariantCard
                    key={variant.id}
                    variant={variant}
                    onRequestQuote={setQuoteVariant}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || isLoadingVariants}
                  onClick={() => setPage((p) => p - 1)}
                  className="inline-flex h-9 min-w-20 cursor-pointer items-center justify-center border border-border px-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Trước
                </button>
                <p className="px-2 text-sm text-muted-foreground">
                  Trang {page}/{totalPages}
                </p>
                <button
                  type="button"
                  disabled={page >= totalPages || isLoadingVariants}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex h-9 min-w-20 cursor-pointer items-center justify-center border border-border px-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Sau
                </button>
              </div>
            )}

            <QuoteRequestModal
              onClose={() => setQuoteVariant(null)}
              open={Boolean(quoteVariant)}
              variant={quoteVariant}
            />
          </>
        )}
      </section>
    </main>
  );
}

function BootstrapSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="aspect-[3/4] w-full" />
        ))}
      </div>
    </div>
  );
}

function VariantsSkeleton() {
  return (
    <div className="grid min-h-[24rem] content-start grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }, (_, i) => (
        <article key={i} className="flex flex-col border border-border bg-background">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-2 h-8 w-full" />
          </div>
        </article>
      ))}
    </div>
  );
}
