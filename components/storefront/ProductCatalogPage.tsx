"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  listCatalogBrands,
  listCatalogCategoriesTree,
  searchCatalogVariants,
} from "@/lib/api/services/catalog-variants.service";
import type { Brand } from "@/lib/brand/types";
import type { CategoryTreeNode } from "@/lib/category/types";
import type { CatalogVariant } from "@/lib/catalog/types";

function flattenCategories(tree: CategoryTreeNode[]) {
  const items: Array<{ id: string; slug: string; label: string }> = [];

  function walk(nodes: CategoryTreeNode[], depth: number) {
    nodes.forEach((node) => {
      items.push({
        id: node.id,
        slug: node.slug,
        label: `${"— ".repeat(depth)}${node.name}`,
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

export default function ProductCatalogPage() {
  const [variants, setVariants] = useState<CatalogVariant[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categoryOptions = useMemo(() => flattenCategories(categoryTree), [categoryTree]);
  const keyword = searchParams.get("q") ?? "";
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

  function updateQuery(
    updates: Record<string, string | null | undefined>,
    options?: { resetPage?: boolean },
  ) {
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
  }

  useEffect(() => {
    async function loadInitialFilters() {
      try {
        const [brandsResponse, categoriesResponse] = await Promise.all([
          listCatalogBrands(),
          listCatalogCategoriesTree(),
        ]);
        setBrands(brandsResponse);
        setCategoryTree(categoriesResponse);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thể tải bộ lọc sản phẩm.");
      }
    }

    void loadInitialFilters();
  }, []);

  useEffect(() => {
    async function loadVariants() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await searchCatalogVariants({
          q: keyword.trim() || undefined,
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
  }, [keyword, sort, page, limit, priceMax, priceMin, selectedBrandId, selectedCategoryId]);

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  function resetAllFilters() {
    router.replace(pathname, { scroll: false });
  }

  return (
    <main className="border-t border-border bg-background">
      <section className="container mx-auto px-4 py-10 lg:py-12">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Danh mục sản phẩm
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight lg:text-4xl">Sản phẩm công nghiệp</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Tìm theo tên, SKU, thương hiệu, danh mục và khoảng giá.
            </p>
          </div>
          <p className="text-sm font-semibold text-muted-foreground">
            {total === 0 ? "Không có kết quả" : `Hiển thị ${startItem}-${endItem} / ${total}`}
          </p>
        </header>

        <section className="mb-6 grid gap-3 border border-border bg-background p-4 lg:grid-cols-5">
          <label className="grid gap-2 text-sm lg:col-span-2">
            <span className="font-semibold">Từ khóa</span>
            <input
              className="h-10 border border-border px-3 outline-none focus:border-primary"
              onChange={(event) => updateQuery({ q: event.target.value }, { resetPage: true })}
              placeholder="VD: schneider, MCB-2P-20A..."
              type="text"
              value={keyword}
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-semibold">Sắp xếp</span>
            <select
              className="h-10 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary"
              onChange={(event) =>
                updateQuery({ sort: event.target.value as SortOption }, { resetPage: true })
              }
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
              className="h-10 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary"
              onChange={(event) =>
                updateQuery({ categorySlug: event.target.value }, { resetPage: true })
              }
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
            <span className="font-semibold">Thương hiệu</span>
            <select
              className="h-10 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary"
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

          <label className="grid gap-2 text-sm">
            <span className="font-semibold">Giá thấp nhất</span>
            <input
              className="h-10 border border-border px-3 outline-none focus:border-primary"
              min={0}
              onChange={(event) => updateQuery({ priceMin: event.target.value }, { resetPage: true })}
              placeholder="VD: 100000"
              type="number"
              value={priceMin}
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-semibold">Giá cao nhất</span>
            <input
              className="h-10 border border-border px-3 outline-none focus:border-primary"
              min={0}
              onChange={(event) => updateQuery({ priceMax: event.target.value }, { resetPage: true })}
              placeholder="VD: 5000000"
              type="number"
              value={priceMax}
            />
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex h-10 w-full cursor-pointer items-center justify-center border border-border px-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
            >
              Xóa bộ lọc
            </button>
          </div>
        </section>

        {isLoading ? (
          <div className="border border-border p-8 text-sm text-muted-foreground">Đang tải sản phẩm...</div>
        ) : errorMessage ? (
          <div className="border border-border p-8 text-sm text-destructive">{errorMessage}</div>
        ) : variants.length === 0 ? (
          <div className="border border-border p-8 text-sm text-muted-foreground">
            Không có sản phẩm phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {variants.map((variant) => (
                <article key={variant.id} className="flex flex-col border border-border bg-background">
                  <div className="border-b border-border bg-muted/15">
                    <div className="relative aspect-[4/3] w-full">
                      {variant.effectiveImageUrls?.[0] ? (
                        <Image
                          alt={variant.name}
                          className="object-cover"
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                          src={variant.effectiveImageUrls[0]}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Chưa có ảnh
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="border-b border-border bg-muted/20 px-4 py-3">
                    <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {variant.category.name}
                    </p>
                    <h2 className="mt-2 line-clamp-2 min-h-12 text-base font-black tracking-tight">{variant.name}</h2>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 px-4 py-4">
                    <p className="text-xs text-muted-foreground">SKU: {variant.sku}</p>
                    <p className="text-xs text-muted-foreground">
                      Thương hiệu: {variant.brand?.name ?? "Không gắn thương hiệu"}
                    </p>
                    <p className="text-xs text-muted-foreground">Tồn kho: {variant.stockQuantity}</p>
                    <p className="text-lg font-black text-primary">{Number(variant.price).toLocaleString("vi-VN")} đ</p>
                  </div>
                  <div className="border-t border-border px-4 py-3">
                    <ButtonLink href={`/san-pham/${variant.slug}`} label="Xem chi tiết" />
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => updateQuery({ page: String(page - 1) })}
                className="inline-flex h-9 min-w-20 cursor-pointer items-center justify-center border border-border px-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                Trước
              </button>
              <p className="px-2 text-sm text-muted-foreground">
                Trang {page}/{totalPages}
              </p>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => updateQuery({ page: String(page + 1) })}
                className="inline-flex h-9 min-w-20 cursor-pointer items-center justify-center border border-border px-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function ButtonLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 w-full cursor-pointer items-center justify-center border border-border px-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
    >
      {label}
    </Link>
  );
}
