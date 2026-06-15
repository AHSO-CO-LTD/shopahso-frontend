"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { ProductSummary, VariantSummary } from "@/lib/product/types";

export const UNBRANDED_FILTER_VALUE = "__UNBRANDED__";

type ProductManagementFiltersProps = {
  filteredCount: number;
  onBrandChange: (brandId: string) => void;
  onProductChange: (productId: string) => void;
  onReset: () => void;
  onSearchChange: (keyword: string) => void;
  onVariantChange: (variantId: string) => void;
  products: ProductSummary[];
  searchKeyword: string;
  selectedBrandId: string;
  selectedProductId: string;
  selectedVariantId: string;
  variants: VariantSummary[];
};

function matchesBrand(product: ProductSummary, brandId: string) {
  if (!brandId) {
    return true;
  }

  if (brandId === UNBRANDED_FILTER_VALUE) {
    return product.brandId === null;
  }

  return product.brandId === brandId;
}

export default function ProductManagementFilters({
  filteredCount,
  onBrandChange,
  onProductChange,
  onReset,
  onSearchChange,
  onVariantChange,
  products,
  searchKeyword,
  selectedBrandId,
  selectedProductId,
  selectedVariantId,
  variants,
}: ProductManagementFiltersProps) {
  const brandOptions = useMemo(() => {
    const uniqueBrands = new Map<string, string>();

    products.forEach((product) => {
      if (product.brand) {
        uniqueBrands.set(product.brand.id, product.brand.name);
      }
    });

    return [...uniqueBrands.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [products]);

  const hasUnbrandedProducts = products.some((product) => product.brandId === null);
  const productOptions = useMemo(
    () =>
      products
        .filter((product) => matchesBrand(product, selectedBrandId))
        .sort((a, b) => a.name.localeCompare(b.name, "vi")),
    [products, selectedBrandId],
  );
  const variantOptions = useMemo(
    () =>
      variants
        .filter((variant) => variant.productId === selectedProductId)
        .sort((a, b) => a.name.localeCompare(b.name, "vi")),
    [selectedProductId, variants],
  );
  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? null;
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? null;
  const hasFilters = Boolean(
    searchKeyword.trim() || selectedBrandId || selectedProductId || selectedVariantId,
  );

  return (
    <section className="border-b border-border px-6 py-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.2fr)_minmax(170px,0.7fr)_minmax(240px,1fr)_minmax(260px,1fr)]">
        <label className="grid gap-2 text-sm">
          <span className="font-semibold">Tìm sản phẩm</span>
          <input
            className="h-11 border border-border bg-background px-3 outline-none transition-colors hover:border-primary focus:border-primary"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Nhập tên hoặc slug..."
            value={searchKeyword}
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-semibold">Hãng</span>
          <select
            className="h-11 cursor-pointer border border-border bg-background px-3 outline-none transition-colors hover:border-primary focus:border-primary"
            onChange={(event) => onBrandChange(event.target.value)}
            value={selectedBrandId}
          >
            <option value="">Tất cả hãng</option>
            {brandOptions.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
            {hasUnbrandedProducts ? (
              <option value={UNBRANDED_FILTER_VALUE}>Chưa gắn hãng</option>
            ) : null}
          </select>
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-semibold">Chủng loại / sản phẩm</span>
          <select
            className="h-11 cursor-pointer border border-border bg-background px-3 outline-none transition-colors hover:border-primary focus:border-primary"
            onChange={(event) => onProductChange(event.target.value)}
            value={selectedProductId}
          >
            <option value="">Tất cả chủng loại</option>
            {productOptions.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product._count.variants})
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-semibold">Biến thể</span>
          <select
            className="h-11 cursor-pointer border border-border bg-background px-3 outline-none transition-colors hover:border-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!selectedProductId}
            onChange={(event) => onVariantChange(event.target.value)}
            value={selectedVariantId}
          >
            <option value="">
              {selectedProductId ? "Tất cả biến thể" : "Chọn chủng loại trước"}
            </option>
            {variantOptions.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.sku} - {variant.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-border bg-muted/15 p-3">
        <div className="min-w-0 text-xs text-muted-foreground">
          <p>
            Đang hiển thị <span className="font-semibold text-foreground">{filteredCount}</span>/
            {products.length} sản phẩm
          </p>
          {selectedVariant ? (
            <p className="mt-1 truncate">
              Đã chọn biến thể: <span className="font-semibold text-foreground">{selectedVariant.sku}</span>
            </p>
          ) : selectedProduct ? (
            <p className="mt-1 truncate">
              Đã chọn chủng loại: <span className="font-semibold text-foreground">{selectedProduct.name}</span>
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {selectedProduct ? (
            <>
              <Button asChild className="h-9 cursor-pointer px-3 text-xs font-semibold" variant="outline">
                <Link href={`/nhan-vien/san-pham/${selectedProduct.id}`}>Sửa chủng loại</Link>
              </Button>
              <Button asChild className="h-9 cursor-pointer px-3 text-xs font-semibold" variant="outline">
                <Link href={`/nhan-vien/san-pham/${selectedProduct.id}/bien-the`}>Danh sách biến thể</Link>
              </Button>
            </>
          ) : (
            <Button className="h-9 px-3 text-xs font-semibold" disabled type="button" variant="outline">
              Chọn chủng loại để sửa
            </Button>
          )}

          {selectedProduct && selectedVariant ? (
            <Button asChild className="h-9 cursor-pointer px-3 text-xs font-semibold">
              <Link href={`/nhan-vien/san-pham/${selectedProduct.id}/bien-the/${selectedVariant.id}/sua`}>
                Sửa biến thể
              </Link>
            </Button>
          ) : (
            <Button className="h-9 px-3 text-xs font-semibold" disabled type="button">
              Chọn biến thể để sửa
            </Button>
          )}

          {hasFilters ? (
            <Button
              className="h-9 cursor-pointer px-3 text-xs font-semibold"
              onClick={onReset}
              type="button"
              variant="outline"
            >
              Xóa bộ lọc
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
