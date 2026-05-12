"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import StaffLayout from "@/components/staff/StaffLayout";
import VariantForm, { DEFAULT_VARIANT_FORM_VALUE } from "@/components/staff/products/VariantForm";
import { Button } from "@/components/ui/button";
import { createBackofficeVariant } from "@/lib/api/services/variants.service";
import { getBackofficeProduct } from "@/lib/api/services/products.service";
import type { CreateVariantPayload, ProductDetail } from "@/lib/product/types";

export default function StaffProductVariantCreate({ productId }: { productId: string }) {
  const router = useRouter();
  const [productDetail, setProductDetail] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProduct = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getBackofficeProduct(productId);
      setProductDetail(response);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể tải thông tin sản phẩm.");
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProduct();
  }, [loadProduct]);

  const handleSubmit = async (payload: CreateVariantPayload) => {
    setIsSubmitting(true);
    const loadingId = toast.loading("Đang tạo biến thể...");
    try {
      await createBackofficeVariant(payload);
      toast.success("Tạo biến thể thành công.", { id: loadingId });
      router.replace(`/nhan-vien/san-pham/${productId}/bien-the`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo biến thể.", { id: loadingId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <StaffLayout>
      <div className="flex h-full min-h-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <section className="flex h-full min-h-0 w-full flex-col border border-border bg-background">
          <header className="border-b border-border px-6 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Biến thể</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Tạo biến thể mới</h2>
            <div className="mt-3">
              <Button asChild className="h-9 px-3 text-xs font-semibold" variant="outline">
                <Link href={`/nhan-vien/san-pham/${productId}/bien-the`}>Quay lại danh sách biến thể</Link>
              </Button>
            </div>
          </header>

          {isLoading ? (
            <div className="px-6 py-8 text-sm text-muted-foreground">Đang tải dữ liệu...</div>
          ) : errorMessage || !productDetail ? (
            <div className="space-y-4 px-6 py-8">
              <p className="text-sm text-destructive">{errorMessage ?? "Không tìm thấy sản phẩm."}</p>
              <Button className="h-10 px-4 text-sm font-semibold" onClick={() => void loadProduct()} type="button" variant="outline">
                Tải lại
              </Button>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              <div className="mb-6 border border-border bg-muted/20 px-4 py-3">
                <p className="text-sm font-semibold">
                  Biến thể hiện có: {productDetail.variants.length}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Kiểm tra danh sách bên dưới để tránh tạo trùng SKU, tên hoặc slug.
                </p>
              </div>

              {productDetail.variants.length > 0 ? (
                <div className="mb-6 border border-border">
                  <div className="grid grid-cols-[minmax(0,1fr)_100px] border-b border-border bg-muted/20 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    <p>Biến thể đã có</p>
                    <p className="text-right">Trạng thái</p>
                  </div>
                  <ul className="divide-y divide-border">
                    {productDetail.variants.map((variant) => (
                      <li key={variant.id} className="grid grid-cols-[minmax(0,1fr)_100px] items-center gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{variant.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            SKU: {variant.sku} | Slug: {variant.slug}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            Giá: {variant.price} | Tồn kho: {variant.stockQuantity}
                          </p>
                        </div>
                        <p className="text-right text-xs font-semibold">{variant.active ? "Hoạt động" : "Tạm ẩn"}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <VariantForm
                defaultValue={DEFAULT_VARIANT_FORM_VALUE}
                isEditMode={false}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                product={productDetail}
              />
            </div>
          )}
        </section>
      </div>
    </StaffLayout>
  );
}
