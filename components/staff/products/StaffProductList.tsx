"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import StaffLayout from "@/components/staff/StaffLayout";
import ProductManagementFilters, {
  UNBRANDED_FILTER_VALUE,
} from "@/components/staff/products/ProductManagementFilters";
import { Button } from "@/components/ui/button";
import { listBackofficeProducts, updateBackofficeProduct } from "@/lib/api/services/products.service";
import { listBackofficeVariants } from "@/lib/api/services/variants.service";
import type { ProductStatus, ProductSummary, VariantSummary } from "@/lib/product/types";

function sortProducts(items: ProductSummary[]) {
  return [...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

function formatPublishedTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Không xác định";
  }

  return date.toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function StaffProductList() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [variants, setVariants] = useState<VariantSummary[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updatingStatusIds, setUpdatingStatusIds] = useState<string[]>([]);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const [productsResponse, variantsResponse] = await Promise.all([
        listBackofficeProducts(),
        listBackofficeVariants(),
      ]);
      setProducts(sortProducts(productsResponse));
      setVariants(variantsResponse);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể tải danh sách sản phẩm.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    const selectedVariant = variants.find((variant) => variant.id === selectedVariantId);

    return products.filter((item) => {
      const matchesKeyword =
        !keyword
        || item.name.toLowerCase().includes(keyword)
        || item.slug.toLowerCase().includes(keyword);
      const matchesBrand =
        !selectedBrandId
        || (selectedBrandId === UNBRANDED_FILTER_VALUE
          ? item.brandId === null
          : item.brandId === selectedBrandId);
      const matchesProduct = !selectedProductId || item.id === selectedProductId;
      const matchesVariant = !selectedVariant || item.id === selectedVariant.productId;

      return matchesKeyword && matchesBrand && matchesProduct && matchesVariant;
    });
  }, [
    products,
    searchKeyword,
    selectedBrandId,
    selectedProductId,
    selectedVariantId,
    variants,
  ]);

  const handleBrandChange = (brandId: string) => {
    setSelectedBrandId(brandId);
    setSelectedProductId("");
    setSelectedVariantId("");
  };

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    setSelectedVariantId("");
  };

  const handleResetFilters = () => {
    setSearchKeyword("");
    setSelectedBrandId("");
    setSelectedProductId("");
    setSelectedVariantId("");
  };
  const hasActiveFilters = Boolean(
    searchKeyword.trim() || selectedBrandId || selectedProductId || selectedVariantId,
  );

  const handleStatusChange = async (product: ProductSummary, status: ProductStatus) => {
    if (status === product.status || updatingStatusIds.includes(product.id)) {
      return;
    }

    const previousStatus = product.status;
    setUpdatingStatusIds((current) => [...current, product.id]);
    setProducts((current) =>
      current.map((item) => (item.id === product.id ? { ...item, status } : item)),
    );

    const loadingId = toast.loading(`Đang chuyển "${product.name}" sang ${status}...`);

    try {
      const updatedProduct = await updateBackofficeProduct(product.id, { status });
      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                status: updatedProduct.status,
                updatedAt: updatedProduct.updatedAt,
              }
            : item,
        ),
      );
      toast.success("Đã cập nhật trạng thái sản phẩm.", { id: loadingId });
    } catch (error) {
      setProducts((current) =>
        current.map((item) =>
          item.id === product.id ? { ...item, status: previousStatus } : item,
        ),
      );
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật trạng thái sản phẩm.", {
        id: loadingId,
      });
    } finally {
      setUpdatingStatusIds((current) => current.filter((id) => id !== product.id));
    }
  };

  return (
    <StaffLayout>
      <div className="flex h-full min-h-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <section className="flex h-full min-h-0 w-full flex-col border border-border bg-background">
          <header className="border-b border-border px-6 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Sản phẩm</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-black tracking-tight">Danh sách sản phẩm</h2>
              <Button asChild className="h-10 px-4 text-sm font-semibold">
                <Link href="/nhan-vien/san-pham/tao">Tạo sản phẩm</Link>
              </Button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Nhấn vào một sản phẩm để mở trang quản lý chi tiết sản phẩm và biến thể.</p>
          </header>

          <ProductManagementFilters
            filteredCount={filteredProducts.length}
            onBrandChange={handleBrandChange}
            onProductChange={handleProductChange}
            onReset={handleResetFilters}
            onSearchChange={setSearchKeyword}
            onVariantChange={setSelectedVariantId}
            products={products}
            searchKeyword={searchKeyword}
            selectedBrandId={selectedBrandId}
            selectedProductId={selectedProductId}
            selectedVariantId={selectedVariantId}
            variants={variants}
          />

          {isLoading ? (
            <div className="px-6 py-8 text-sm text-muted-foreground">Đang tải sản phẩm...</div>
          ) : errorMessage ? (
            <div className="space-y-4 px-6 py-8">
              <p className="text-sm text-destructive">{errorMessage}</p>
              <Button className="h-10 px-4 text-sm font-semibold" onClick={() => void loadProducts()} type="button" variant="outline">
                Tải lại
              </Button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="px-6 py-8 text-sm text-muted-foreground">
              {hasActiveFilters
                ? "Không tìm thấy sản phẩm phù hợp với bộ lọc."
                : "Chưa có sản phẩm nào."}
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              <div className="overflow-x-auto">
                <div className="min-w-[1040px]">
                  <div className="grid grid-cols-[88px_minmax(300px,1fr)_170px_180px_220px] items-center gap-4 border border-border bg-muted/20 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    <p>Ảnh</p>
                    <p>Thông tin sản phẩm</p>
                    <p>Thời gian đăng</p>
                    <p>Trạng thái</p>
                    <p className="text-right">Thao tác nhanh</p>
                  </div>
                  <ul className="divide-y divide-border border-x border-b border-border">
                    {filteredProducts.map((product) => {
                      const imageUrl = product.imageUrls[0];
                      const isUpdatingStatus = updatingStatusIds.includes(product.id);

                      return (
                        <li
                          className="grid grid-cols-[88px_minmax(300px,1fr)_170px_180px_220px] items-center gap-4 px-4 py-4"
                          key={product.id}
                        >
                          <div className="relative flex h-16 w-20 items-center justify-center overflow-hidden border border-border bg-muted/20">
                            {imageUrl ? (
                              <Image
                                alt={`Ảnh ${product.name}`}
                                className="object-contain"
                                fill
                                sizes="80px"
                                src={imageUrl}
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                <ImageOff aria-hidden="true" className="size-5" />
                                <span className="text-[10px] font-semibold">Chưa có ảnh</span>
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold">{product.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              Hãng: {product.brand?.name ?? "Chưa gắn"} · Danh mục: {product.category.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">slug: {product.slug}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              variants: {product._count.variants}
                              {product.imageUrls.length > 0 ? ` · ${product.imageUrls.length} ảnh` : ""}
                            </p>
                          </div>

                          <time className="text-xs font-medium" dateTime={product.createdAt}>
                            {formatPublishedTime(product.createdAt)}
                          </time>

                          <div>
                            <select
                              aria-label={`Trạng thái của ${product.name}`}
                              className="h-9 w-full cursor-pointer border border-border bg-background px-2 text-xs font-semibold outline-none transition-colors hover:border-primary focus:border-primary disabled:cursor-wait disabled:opacity-60"
                              disabled={isUpdatingStatus}
                              onChange={(event) =>
                                void handleStatusChange(product, event.target.value as ProductStatus)
                              }
                              value={product.status}
                            >
                              <option value="DRAFT">DRAFT</option>
                              <option value="PUBLISHED">PUBLISHED</option>
                            </select>
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              {isUpdatingStatus
                                ? "Đang cập nhật..."
                                : product.active
                                  ? "Hoạt động"
                                  : "Tạm ẩn"}
                            </p>
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button asChild className="h-9 cursor-pointer px-3 text-xs font-semibold" variant="outline">
                              <Link href={`/nhan-vien/san-pham/${product.id}`}>Sửa sản phẩm</Link>
                            </Button>
                            <Button asChild className="h-9 cursor-pointer px-3 text-xs font-semibold" variant="outline">
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
