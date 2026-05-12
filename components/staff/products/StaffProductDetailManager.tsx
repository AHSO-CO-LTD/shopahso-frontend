"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import ConfirmModal from "@/components/common/ConfirmModal";
import StaffLayout from "@/components/staff/StaffLayout";
import ProductForm, { type ProductFormValue } from "@/components/staff/products/ProductForm";
import { Button } from "@/components/ui/button";
import { listBackofficeBrands } from "@/lib/api/services/brands.service";
import { listBackofficeCategories } from "@/lib/api/services/categories.service";
import { deleteBackofficeProduct, getBackofficeProduct, updateBackofficeProduct } from "@/lib/api/services/products.service";
import type { Brand } from "@/lib/brand/types";
import type { BackofficeCategory } from "@/lib/category/types";
import type { CreateProductPayload, ProductDetail } from "@/lib/product/types";

function toProductFormValue(product: ProductDetail): ProductFormValue {
  return {
    categoryId: product.categoryId,
    brandId: product.brandId ?? "",
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    datasheetUrl: product.datasheetUrl ?? "",
    active: product.active,
  };
}

export default function StaffProductDetailManager({ productId }: { productId: string }) {
  const [categories, setCategories] = useState<BackofficeCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [productDetail, setProductDetail] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [categoriesResponse, brandsResponse, detailResponse] = await Promise.all([
        listBackofficeCategories(),
        listBackofficeBrands(),
        getBackofficeProduct(productId),
      ]);
      setCategories(categoriesResponse.filter((item) => item.active));
      setBrands(brandsResponse);
      setProductDetail(detailResponse);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể tải dữ liệu sản phẩm.");
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  const productFormDefault = useMemo(
    () => (productDetail ? toProductFormValue(productDetail) : undefined),
    [productDetail],
  );

  const handleSubmitProduct = async (payload: CreateProductPayload) => {
    if (!productDetail) {
      return;
    }
    setIsSubmittingProduct(true);
    const loadingId = toast.loading("Đang cập nhật sản phẩm...");
    try {
      await updateBackofficeProduct(productDetail.id, payload);
      await loadData();
      toast.success("Cập nhật sản phẩm thành công.", { id: loadingId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật sản phẩm.", { id: loadingId });
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productDetail) {
      return;
    }
    setIsDeletingProduct(true);
    const loadingId = toast.loading("Đang ẩn sản phẩm...");
    try {
      await deleteBackofficeProduct(productDetail.id);
      toast.success("Đã ẩn sản phẩm và các biến thể liên quan.", { id: loadingId });
      setDeletingProduct(false);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể ẩn sản phẩm.", { id: loadingId });
    } finally {
      setIsDeletingProduct(false);
    }
  };

  return (
    <StaffLayout>
      <div className="flex h-full min-h-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <section className="grid h-full min-h-0 w-full gap-8 lg:grid-cols-[minmax(0,1fr)_460px]">
          <article className="flex h-full min-h-0 flex-col border border-border bg-background">
            <header className="border-b border-border px-6 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Sản phẩm</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Quản lý chi tiết sản phẩm</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild className="h-9 px-3 text-xs font-semibold" variant="outline">
                  <Link href="/nhan-vien/san-pham">Quay lại danh sách sản phẩm</Link>
                </Button>
                <Button asChild className="h-9 px-3 text-xs font-semibold">
                  <Link href={`/nhan-vien/san-pham/${productId}/bien-the`}>Quản lý biến thể</Link>
                </Button>
              </div>
            </header>

            {isLoading ? (
              <div className="px-6 py-8 text-sm text-muted-foreground">Đang tải dữ liệu sản phẩm...</div>
            ) : errorMessage || !productDetail ? (
              <div className="space-y-4 px-6 py-8">
                <p className="text-sm text-destructive">{errorMessage ?? "Không tìm thấy sản phẩm."}</p>
                <Button className="h-10 px-4 text-sm font-semibold" onClick={() => void loadData()} type="button" variant="outline">
                  Tải lại
                </Button>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                <ProductForm
                  key={productDetail.id}
                  brands={brands}
                  categories={categories}
                  defaultValue={productFormDefault}
                  isDeleting={isDeletingProduct}
                  isEditMode
                  isSubmitting={isSubmittingProduct}
                  onDelete={() => setDeletingProduct(true)}
                  onSubmit={handleSubmitProduct}
                />
              </div>
            )}
          </article>

          <aside className="flex h-full min-h-0 flex-col border border-border bg-background">
            <header className="border-b border-border px-6 py-5">
              <h3 className="text-xl font-black tracking-tight">Biến thể sản phẩm</h3>
            </header>
            {isLoading ? (
              <div className="px-6 py-8 text-sm text-muted-foreground">Đang tải biến thể...</div>
            ) : !productDetail ? (
              <div className="px-6 py-8 text-sm text-muted-foreground">Không có dữ liệu biến thể.</div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                <p className="text-sm text-muted-foreground">
                  Quản lý đầy đủ biến thể (tạo, sửa, ẩn) đã được tách sang trang riêng để tối ưu quy trình.
                </p>
                <div className="mt-4">
                  <Button asChild className="h-10 px-4 text-sm font-semibold">
                    <Link href={`/nhan-vien/san-pham/${productId}/bien-the`}>Mở trang quản lý biến thể</Link>
                  </Button>
                </div>
                <div className="mt-6 grid grid-cols-[minmax(0,1fr)_100px] border border-border bg-muted/20 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <p>Biến thể hiện có</p>
                  <p className="text-right">Trạng thái</p>
                </div>
                <div className="space-y-2">
                  {productDetail.variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="grid w-full grid-cols-[minmax(0,1fr)_100px] items-center gap-2 border border-t-0 border-border px-3 py-3 text-left"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{variant.name}</p>
                        <p className="truncate text-xs text-muted-foreground">SKU: {variant.sku}</p>
                      </div>
                      <span className="text-right text-xs font-semibold">{variant.active ? "Hoạt động" : "Tạm ẩn"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </section>
      </div>

      <ConfirmModal
        cancelText="Giữ lại"
        confirmText="Ẩn sản phẩm"
        description={productDetail ? `Sản phẩm "${productDetail.name}" và toàn bộ biến thể sẽ được ẩn. Bạn có chắc muốn tiếp tục?` : ""}
        isLoading={isDeletingProduct}
        onCancel={() => setDeletingProduct(false)}
        onConfirm={() => void handleDeleteProduct()}
        open={deletingProduct}
        title="Xác nhận ẩn sản phẩm"
      />
    </StaffLayout>
  );
}
