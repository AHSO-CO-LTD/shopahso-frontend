"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import StaffLayout from "@/components/staff/StaffLayout";
import ProductFilterSidebar from "@/components/staff/products/ProductFilterSidebar";
import ProductManagementFilters from "@/components/staff/products/ProductManagementFilters";
import { Button } from "@/components/ui/button";
import { listBackofficeCategories, listCatalogCategoryTree } from "@/lib/api/services/categories.service";
import { listBackofficeProducts, updateBackofficeProduct } from "@/lib/api/services/products.service";
import { listCatalogVariants } from "@/lib/api/services/catalog-variants.service";
import type { BackofficeCategory, CategoryTreeNode } from "@/lib/category/types";
import type { Brand } from "@/lib/brand/types";
import type { ProductStatus, ProductSummary } from "@/lib/product/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function sortProducts(items: ProductSummary[]) {
  return [...items].sort((a, b) => {
    const ta = a.createdAt ? +new Date(a.createdAt) : 0;
    const tb = b.createdAt ? +new Date(b.createdAt) : 0;
    return tb - ta;
  });
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

/** Flatten CategoryTreeNode[] (public API) → BackofficeCategory[] (backoffice format). */
function flattenCategoryTree(nodes: CategoryTreeNode[], parentId: string | null = null): BackofficeCategory[] {
  const result: BackofficeCategory[] = [];
  for (const node of nodes) {
    result.push({
      id: node.id,
      parentId,
      name: node.name,
      slug: node.slug,
      description: node.description,
      active: true,
      sortOrder: node.sortOrder,
      createdAt: "",
      updatedAt: "",
      parent: null,
    });
    if (node.children?.length) {
      result.push(...flattenCategoryTree(node.children, node.id));
    }
  }
  return result;
}

/** Return the ID set of a category and all its descendants. O(n) BFS. */
function collectDescendantIds(categories: BackofficeCategory[], rootId: string): Set<string> {
  const childrenOf = new Map<string, string[]>();
  for (const cat of categories) {
    if (cat.parentId) {
      const arr = childrenOf.get(cat.parentId) ?? [];
      arr.push(cat.id);
      childrenOf.set(cat.parentId, arr);
    }
  }
  const result = new Set<string>();
  const queue = [rootId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    result.add(id);
    for (const childId of childrenOf.get(id) ?? []) queue.push(childId);
  }
  return result;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function StaffProductList() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [categories, setCategories] = useState<BackofficeCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sidebar filters
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  // Top-bar filters
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | ProductStatus>("");

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Optimistic-update trackers
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  // Sequence counter to discard stale concurrent loadData results
  const loadSeqRef = useRef(0);

  // ── Load ────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    setIsLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        listBackofficeProducts(),
        listBackofficeCategories(),
      ]);
      if (seq !== loadSeqRef.current) return;
      setProducts(sortProducts(productsRes));
      setCategories(categoriesRes);
      setIsReadOnlyMode(false);
      setErrorMessage(null);
    } catch (primaryError) {
      // Always surface the error — never fail silently (AGENTS.md)
      toast.warning(
        primaryError instanceof Error ? primaryError.message : "Không kết nối được backoffice.",
        { description: "Đang hiển thị dữ liệu công khai — chỉ xem.", duration: 6000 },
      );
      // Fallback: load from public catalog APIs (no auth required)
      try {
        const [variantsRes, treeRes] = await Promise.all([
          listCatalogVariants({ limit: 500 }),
          listCatalogCategoryTree(),
        ]);
        const productMap = new Map<string, ProductSummary>();
        const fallbackTime = new Date().toISOString();
        for (const v of variantsRes) {
          if (!productMap.has(v.product.id)) {
            const cat: BackofficeCategory = {
              id: v.category.id,
              parentId: null,
              name: v.category.name,
              slug: v.category.slug,
              description: null,
              active: true,
              sortOrder: 0,
              createdAt: "",
              updatedAt: "",
              parent: null,
            };
            const brand: Brand | null = v.brand
              ? { id: v.brand.id, name: v.brand.name, slug: v.brand.slug, logoUrl: v.brand.logoUrl, logoPublicId: null, bannerUrl: null, bannerPublicId: null, active: true, createdAt: "", updatedAt: "" }
              : null;
            productMap.set(v.product.id, {
              id: v.product.id,
              categoryId: v.category.id,
              brandId: v.brand?.id ?? null,
              name: v.product.name,
              slug: v.product.slug,
              description: v.product.description ?? null,
              datasheetUrl: v.product.datasheetUrl ?? null,
              imageUrls: v.effectiveImageUrls ?? [],
              imagePublicIds: [],
              status: "PUBLISHED",
              active: v.active,
              createdAt: fallbackTime,
              updatedAt: fallbackTime,
              category: cat,
              brand,
              _count: { variants: 1, attributes: 0 },
            });
          } else {
            productMap.get(v.product.id)!._count.variants += 1;
          }
        }
        if (seq !== loadSeqRef.current) return;
        setProducts(sortProducts([...productMap.values()]));
        setCategories(flattenCategoryTree(treeRes));
        setIsReadOnlyMode(true);
        setErrorMessage(null);
      } catch (fallbackError) {
        if (seq !== loadSeqRef.current) return;
        setErrorMessage(fallbackError instanceof Error ? fallbackError.message : "Không thể tải dữ liệu.");
      }
    } finally {
      if (seq === loadSeqRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  // ── Derived data for sidebar ─────────────────────────────────────────────

  const uniqueBrands = useMemo(() => {
    const map = new Map<string, Brand>();
    for (const p of products) {
      if (p.brand && !map.has(p.brand.id)) map.set(p.brand.id, p.brand);
    }
    return [...map.values()];
  }, [products]);

  const brandCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      if (p.brandId) counts.set(p.brandId, (counts.get(p.brandId) ?? 0) + 1);
    }
    return counts;
  }, [products]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1);
    }
    return counts;
  }, [products]);

  // ── Descendant set for selected category ────────────────────────────────

  const selectedCategoryDescendants = useMemo(() => {
    if (!selectedCategoryId) return null;
    return collectDescendantIds(categories, selectedCategoryId);
  }, [categories, selectedCategoryId]);

  // ── Filtered products ────────────────────────────────────────────────────

  const filteredProducts = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase();
    return products.filter((p) => {
      if (selectedBrandId && p.brandId !== selectedBrandId) return false;
      if (selectedCategoryDescendants && !selectedCategoryDescendants.has(p.categoryId)) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (kw && !p.name.toLowerCase().includes(kw) && !p.slug.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [products, selectedBrandId, selectedCategoryDescendants, statusFilter, searchKeyword]);

  // ── Filter reset ─────────────────────────────────────────────────────────

  const handleReset = () => {
    setSelectedBrandId("");
    setSelectedCategoryId("");
    setSearchKeyword("");
    setStatusFilter("");
    setSelectedIds(new Set());
  };

  const hasFilters = Boolean(selectedBrandId || selectedCategoryId || searchKeyword.trim() || statusFilter);

  // ── Bulk selection ───────────────────────────────────────────────────────

  const allFilteredIds = useMemo(() => filteredProducts.map((p) => p.id), [filteredProducts]);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allFilteredIds));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  // ── Inline update ────────────────────────────────────────────────────────

  const applyUpdate = async (
    ids: string[],
    payload: { active?: boolean; status?: ProductStatus },
    label: string,
  ) => {
    setUpdatingIds((prev) => new Set([...prev, ...ids]));
    // Optimistic
    setProducts((current) =>
      current.map((p) => ids.includes(p.id) ? { ...p, ...payload } : p),
    );
    const loadingId = toast.loading(label);
    try {
      await Promise.all(ids.map((id) => updateBackofficeProduct(id, payload)));
      toast.success("Đã cập nhật.", { id: loadingId });
    } catch (error) {
      // Revert — increment seq so concurrent in-flight loadData calls are discarded
      void loadData();
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật.", { id: loadingId });
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    }
  };

  const handleToggleActive = (product: ProductSummary) => {
    void applyUpdate([product.id], { active: !product.active }, `Đang cập nhật "${product.name}"...`);
  };

  const handleStatusChange = (product: ProductSummary, status: ProductStatus) => {
    if (status === product.status) return;
    void applyUpdate([product.id], { status }, `Đang chuyển trạng thái "${product.name}"...`);
  };

  const handleBulkActive = (active: boolean) => {
    // Exclude products already being updated to prevent concurrent races
    const ids = [...selectedIds].filter((id) => !updatingIds.has(id));
    if (ids.length === 0) return;
    void applyUpdate(ids, { active }, `Đang ${active ? "bật" : "tắt"} ${ids.length} sản phẩm...`);
    setSelectedIds(new Set());
  };

  const handleBulkStatus = (status: ProductStatus) => {
    const ids = [...selectedIds].filter((id) => !updatingIds.has(id));
    if (ids.length === 0) return;
    void applyUpdate(ids, { status }, `Đang chuyển ${ids.length} sản phẩm sang ${status}...`);
    setSelectedIds(new Set());
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <StaffLayout>
      <div className="flex h-full min-h-0 flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        <ProductFilterSidebar
          brands={uniqueBrands}
          brandCounts={brandCounts}
          categories={categories}
          categoryCounts={categoryCounts}
          selectedBrandId={selectedBrandId}
          selectedCategoryId={selectedCategoryId}
          totalProducts={products.length}
          onBrandChange={(id) => { setSelectedBrandId(id); setSelectedIds(new Set()); }}
          onCategoryChange={(id) => { setSelectedCategoryId(id); setSelectedIds(new Set()); }}
        />

        {/* ── Main ── */}
        <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden border-l-0 border border-border bg-background">
          {/* Header */}
          <header className="border-b border-border px-6 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Sản phẩm</p>
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black tracking-tight">Danh sách sản phẩm</h2>
              <Button asChild className="h-9 px-4 text-sm font-semibold">
                <Link href="/nhan-vien/san-pham/tao">+ Tạo sản phẩm</Link>
              </Button>
            </div>
          </header>

          {/* Filter bar */}
          <ProductManagementFilters
            filteredCount={filteredProducts.length}
            hasFilters={hasFilters}
            searchKeyword={searchKeyword}
            statusFilter={statusFilter}
            totalProducts={products.length}
            onReset={handleReset}
            onSearchChange={setSearchKeyword}
            onStatusChange={setStatusFilter}
          />

          {/* Read-only mode banner */}
          {isReadOnlyMode && (
            <div className="flex items-center gap-2 border-b border-border bg-amber-50 px-6 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              <span className="font-semibold">Chế độ chỉ xem</span>
              <span className="text-amber-700 dark:text-amber-400">— Dữ liệu từ catalog công khai. Đăng nhập để chỉnh sửa.</span>
              <button
                type="button"
                className="ml-auto cursor-pointer text-amber-700 underline hover:text-amber-900 dark:text-amber-400"
                onClick={() => void loadData()}
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Bulk action bar */}
          {!isReadOnlyMode && selectedIds.size > 0 && (
            <div className="flex items-center gap-2 border-b border-border bg-muted/20 px-6 py-2">
              <span className="text-xs font-semibold text-foreground">
                {selectedIds.size} đã chọn
              </span>
              <span className="mx-1 h-4 w-px bg-border" />
              <button
                type="button"
                className="h-7 cursor-pointer border border-border bg-background px-3 text-xs font-semibold transition-colors hover:border-primary hover:text-primary"
                onClick={() => handleBulkActive(true)}
              >
                Bật active
              </button>
              <button
                type="button"
                className="h-7 cursor-pointer border border-border bg-background px-3 text-xs font-semibold transition-colors hover:border-primary hover:text-primary"
                onClick={() => handleBulkActive(false)}
              >
                Tắt active
              </button>
              <button
                type="button"
                className="h-7 cursor-pointer border border-border bg-background px-3 text-xs font-semibold transition-colors hover:border-primary hover:text-primary"
                onClick={() => handleBulkStatus("PUBLISHED")}
              >
                → PUBLISHED
              </button>
              <button
                type="button"
                className="h-7 cursor-pointer border border-border bg-background px-3 text-xs font-semibold transition-colors hover:border-primary hover:text-primary"
                onClick={() => handleBulkStatus("DRAFT")}
              >
                → DRAFT
              </button>
              <button
                type="button"
                className="ml-auto h-7 cursor-pointer border border-border bg-background px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setSelectedIds(new Set())}
              >
                Bỏ chọn
              </button>
            </div>
          )}

          {/* Content */}
          {isLoading ? (
            <div className="px-6 py-8 text-sm text-muted-foreground">Đang tải sản phẩm...</div>
          ) : errorMessage ? (
            <div className="space-y-3 px-6 py-8">
              <p className="text-sm text-destructive">{errorMessage}</p>
              <Button className="h-9 px-4 text-sm font-semibold" onClick={() => void loadData()} type="button" variant="outline">
                Tải lại
              </Button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="px-6 py-8 text-sm text-muted-foreground">
              {hasFilters ? "Không tìm thấy sản phẩm phù hợp." : "Chưa có sản phẩm nào."}
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="overflow-x-auto">
                <div className="min-w-[860px]">
                  {/* Table header */}
                  <div className="grid grid-cols-[32px_72px_minmax(280px,1fr)_90px_80px_150px_160px] items-center gap-3 border-b border-border bg-muted/20 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    <input
                      type="checkbox"
                      aria-label="Chọn tất cả"
                      checked={allSelected}
                      className="cursor-pointer"
                      onChange={toggleSelectAll}
                    />
                    <span>Ảnh</span>
                    <span>Sản phẩm</span>
                    <span>Biến thể</span>
                    <span>Active</span>
                    <span>Trạng thái</span>
                    <span className="text-right">Thao tác</span>
                  </div>

                  {/* Table rows */}
                  <ul className="divide-y divide-border">
                    {filteredProducts.map((product) => {
                      const imageUrl = product.imageUrls[0];
                      const isUpdating = updatingIds.has(product.id);
                      const isChecked = selectedIds.has(product.id);
                      const canEdit = !isReadOnlyMode;

                      return (
                        <li
                          key={product.id}
                          className={[
                            "grid grid-cols-[32px_72px_minmax(280px,1fr)_90px_80px_150px_160px] items-center gap-3 px-4 py-3 transition-colors",
                            isChecked ? "bg-muted/30" : "hover:bg-muted/10",
                          ].join(" ")}
                        >
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            aria-label={`Chọn ${product.name}`}
                            checked={isChecked}
                            className="cursor-pointer"
                            onChange={() => toggleSelectOne(product.id)}
                          />

                          {/* Image */}
                          <div className="relative flex h-14 w-[68px] items-center justify-center overflow-hidden border border-border bg-muted/20">
                            {imageUrl ? (
                              <Image
                                alt={`Ảnh ${product.name}`}
                                className="object-contain"
                                fill
                                sizes="68px"
                                src={imageUrl}
                                unoptimized
                              />
                            ) : (
                              <ImageOff aria-hidden="true" className="size-4 text-muted-foreground" />
                            )}
                          </div>

                          {/* Product info */}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{product.name}</p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {product.brand?.name ?? <span className="italic">Chưa gắn hãng</span>}
                              {" · "}
                              {product.category.name}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {formatDate(product.createdAt)}
                            </p>
                          </div>

                          {/* Variant count */}
                          <div className="text-sm">
                            <span className="font-semibold">{product._count.variants}</span>
                            <span className="text-[11px] text-muted-foreground"> biến thể</span>
                          </div>

                          {/* Active toggle */}
                          <button
                            type="button"
                            disabled={isUpdating || !canEdit}
                            aria-label={product.active ? "Đang bật — nhấn để tắt" : "Đang tắt — nhấn để bật"}
                            className={[
                              "h-7 w-16 border text-[11px] font-semibold transition-colors disabled:opacity-50",
                              canEdit ? "cursor-pointer disabled:cursor-wait" : "cursor-not-allowed",
                              product.active
                                ? "border-primary bg-primary text-primary-foreground hover:bg-primary/80"
                                : "border-border bg-background text-muted-foreground hover:border-primary hover:text-primary",
                            ].join(" ")}
                            onClick={() => canEdit && handleToggleActive(product)}
                          >
                            {product.active ? "ON" : "OFF"}
                          </button>

                          {/* Status */}
                          <select
                            aria-label={`Trạng thái của ${product.name}`}
                            className="h-9 w-full border border-border bg-background px-2 text-xs font-semibold outline-none transition-colors hover:border-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isUpdating || !canEdit}
                            value={product.status}
                            onChange={(e) => handleStatusChange(product, e.target.value as ProductStatus)}
                          >
                            <option value="DRAFT">DRAFT</option>
                            <option value="PUBLISHED">PUBLISHED</option>
                          </select>

                          {/* Actions */}
                          <div className="flex justify-end gap-1.5">
                            <Button
                              asChild
                              className="h-8 cursor-pointer px-3 text-xs font-semibold"
                              variant="outline"
                            >
                              <Link href={`/nhan-vien/san-pham/${product.id}`}>Sửa</Link>
                            </Button>
                            <Button
                              asChild
                              className="h-8 cursor-pointer px-3 text-xs font-semibold"
                              variant="outline"
                            >
                              <Link href={`/nhan-vien/san-pham/${product.id}/bien-the`}>Biến thể</Link>
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </StaffLayout>
  );
}
