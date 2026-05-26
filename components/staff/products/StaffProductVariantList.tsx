"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import ConfirmModal from "@/components/common/ConfirmModal";
import StaffLayout from "@/components/staff/StaffLayout";
import { Button } from "@/components/ui/button";
import { getBackofficeProduct } from "@/lib/api/services/products.service";
import { deleteBackofficeVariant } from "@/lib/api/services/variants.service";
import { getPricingStatusBadgeClass, getPricingStatusLabel } from "@/lib/pricing-status";
import type { ProductDetail, VariantSummary } from "@/lib/product/types";

export default function StaffProductVariantList({ productId }: { productId: string }) {
  const [productDetail, setProductDetail] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingVariant, setDeletingVariant] = useState<VariantSummary | null>(null);

  const loadProductDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getBackofficeProduct(productId);
      setProductDetail(response);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể tải danh sách biến thể.");
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProductDetail();
  }, [loadProductDetail]);

  const handleDeleteVariant = async () => {
    if (!deletingVariant) {
      return;
    }

    setIsDeleting(true);
    const loadingId = toast.loading("Đang ẩn biến thể...");
    try {
      await deleteBackofficeVariant(deletingVariant.id);
      await loadProductDetail();
      setDeletingVariant(null);
      toast.success("Đã ẩn biến thể.", { id: loadingId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể ẩn biến thể.", { id: loadingId });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <StaffLayout>
      <div className="flex h-full min-h-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <section className="flex h-full min-h-0 w-full flex-col border border-border bg-background">
          <header className="border-b border-border px-6 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Biến thể</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Quản lý biến thể {productDetail ? `- ${productDetail.name}` : ""}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild className="h-9 px-3 text-xs font-semibold" variant="outline">
                <Link href={`/nhan-vien/san-pham/${productId}`}>Quay lại chi tiết sản phẩm</Link>
              </Button>
              <Button asChild className="h-9 px-3 text-xs font-semibold" variant="outline">
                <Link href={`/nhan-vien/san-pham/${productId}/bien-the/import`}>Import CSV</Link>
              </Button>
              <Button asChild className="h-9 px-3 text-xs font-semibold">
                <Link href={`/nhan-vien/san-pham/${productId}/bien-the/tao`}>Tạo biến thể</Link>
              </Button>
            </div>
          </header>

          {isLoading ? (
            <div className="px-6 py-8 text-sm text-muted-foreground">Đang tải danh sách biến thể...</div>
          ) : errorMessage ? (
            <div className="space-y-4 px-6 py-8">
              <p className="text-sm text-destructive">{errorMessage}</p>
              <Button className="h-10 px-4 text-sm font-semibold" onClick={() => void loadProductDetail()} type="button" variant="outline">
                Tải lại
              </Button>
            </div>
          ) : !productDetail || productDetail.variants.length === 0 ? (
            <div className="space-y-4 px-6 py-8">
              <p className="text-sm text-muted-foreground">Chưa có biến thể nào cho sản phẩm này.</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild className="h-9 px-3 text-xs font-semibold">
                  <Link href={`/nhan-vien/san-pham/${productId}/bien-the/tao`}>Tạo biến thể đầu tiên</Link>
                </Button>
                <Button asChild className="h-9 px-3 text-xs font-semibold" variant="outline">
                  <Link href={`/nhan-vien/san-pham/${productId}/bien-the/import`}>Import từ CSV</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              <div className="grid grid-cols-[minmax(0,1fr)_100px_140px] border border-border bg-muted/20 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <p>Thông tin biến thể</p>
                <p className="text-center">Trạng thái</p>
                <p className="text-right">Thao tác</p>
              </div>
              <ul className="divide-y divide-border border-x border-b border-border">
                {productDetail.variants.map((variant) => (
                  <li key={variant.id} className="grid grid-cols-[minmax(0,1fr)_100px_140px] items-center gap-3 px-4 py-4">
                    <div className="min-w-0">
                      <div className="mb-2 flex h-14 w-20 items-center justify-center border border-border bg-muted/15 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Ảnh
                      </div>
                      <p className="truncate font-semibold">{variant.name}</p>
                      <p className="truncate text-xs text-muted-foreground">SKU: {variant.sku}</p>
                      <p className="truncate text-xs text-muted-foreground">Slug: {variant.slug}</p>
                      <p className="truncate text-xs text-muted-foreground">MPN: {variant.manufacturerPartNumber || "Chưa có"}</p>
                      <p className="truncate text-xs text-muted-foreground">Xuất xứ: {variant.originCountryCode ?? "Chưa có"}</p>
                      <span className={`mt-2 inline-flex border px-2 py-1 text-[11px] font-semibold ${getPricingStatusBadgeClass(variant.pricingStatus)}`}>
                        {getPricingStatusLabel(variant.pricingStatus)}
                      </span>
                      <p className="truncate text-xs text-muted-foreground">
                        Giá bán: {variant.price} | Giá nhập: {variant.costPrice ?? "Theo giá bán"} | Giá sau giảm: {variant.salePrice ?? "N/A"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        Giảm giá: {variant.discountPercent ?? "N/A"}% | Thuế: {variant.taxPercent ?? "N/A"}% | Tồn kho: {variant.stockQuantity} |
                        Đơn vị: {variant.unit || "N/A"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        MOQ: {variant.minOrderQuantity} | Điểm: {variant.score} | Xem: {variant.viewCount} | Mua: {variant.orderCount}
                      </p>
                    </div>
                    <p className="text-center text-xs font-semibold">{variant.active ? "Hoạt động" : "Tạm ẩn"}</p>
                    <div className="flex justify-end gap-2">
                      <Button asChild className="h-8 px-2 text-[11px] font-semibold" variant="outline">
                        <Link href={`/nhan-vien/san-pham/${productId}/bien-the/${variant.id}/sua`}>Sửa</Link>
                      </Button>
                      <Button className="h-8 px-2 text-[11px] font-semibold" onClick={() => setDeletingVariant(variant)} type="button" variant="destructive">
                        Ẩn
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <ConfirmModal
        cancelText="Giữ lại"
        confirmText="Ẩn biến thể"
        description={deletingVariant ? `Biến thể "${deletingVariant.name}" sẽ được ẩn (active=false). Bạn có chắc muốn tiếp tục?` : ""}
        isLoading={isDeleting}
        onCancel={() => setDeletingVariant(null)}
        onConfirm={() => void handleDeleteVariant()}
        open={Boolean(deletingVariant)}
        title="Xác nhận ẩn biến thể"
      />
    </StaffLayout>
  );
}
