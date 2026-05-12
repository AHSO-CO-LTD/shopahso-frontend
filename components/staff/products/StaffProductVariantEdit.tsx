"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ConfirmModal from "@/components/common/ConfirmModal";
import StaffLayout from "@/components/staff/StaffLayout";
import VariantForm, { type VariantFormValue } from "@/components/staff/products/VariantForm";
import { Button } from "@/components/ui/button";
import { deleteBackofficeVariant, getBackofficeVariant, updateBackofficeVariant } from "@/lib/api/services/variants.service";
import { getBackofficeProduct } from "@/lib/api/services/products.service";
import type { CreateVariantPayload, ProductDetail, VariantSummary } from "@/lib/product/types";

function toVariantFormValue(variant: VariantSummary): VariantFormValue {
  return {
    sku: variant.sku,
    manufacturerPartNumber: variant.manufacturerPartNumber ?? "",
    name: variant.name,
    slug: variant.slug,
    price: String(variant.price),
    stockQuantity: String(variant.stockQuantity),
    unit: variant.unit ?? "",
    minOrderQuantity: String(variant.minOrderQuantity),
    viewCount: String(variant.viewCount),
    orderCount: String(variant.orderCount),
    specSnapshot: JSON.stringify(variant.specSnapshot ?? {}, null, 2),
    active: variant.active,
  };
}

export default function StaffProductVariantEdit({
  productId,
  variantId,
}: {
  productId: string;
  variantId: string;
}) {
  const router = useRouter();
  const [productDetail, setProductDetail] = useState<ProductDetail | null>(null);
  const [variantDetail, setVariantDetail] = useState<VariantSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [productResponse, variantResponse] = await Promise.all([
        getBackofficeProduct(productId),
        getBackofficeVariant(variantId),
      ]);
      setProductDetail(productResponse);
      setVariantDetail(variantResponse);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể tải dữ liệu biến thể.");
    } finally {
      setIsLoading(false);
    }
  }, [productId, variantId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  const formDefaultValue = useMemo(() => {
    if (!variantDetail) {
      return undefined;
    }
    return toVariantFormValue(variantDetail);
  }, [variantDetail]);

  const handleSubmit = async (payload: CreateVariantPayload) => {
    setIsSubmitting(true);
    const loadingId = toast.loading("Đang cập nhật biến thể...");
    try {
      await updateBackofficeVariant(variantId, payload);
      toast.success("Cập nhật biến thể thành công.", { id: loadingId });
      router.replace(`/nhan-vien/san-pham/${productId}/bien-the`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật biến thể.", { id: loadingId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const loadingId = toast.loading("Đang ẩn biến thể...");
    try {
      await deleteBackofficeVariant(variantId);
      toast.success("Đã ẩn biến thể.", { id: loadingId });
      setIsDeleteConfirmOpen(false);
      router.replace(`/nhan-vien/san-pham/${productId}/bien-the`);
      router.refresh();
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
              Sửa biến thể {variantDetail ? `- ${variantDetail.name}` : ""}
            </h2>
            <div className="mt-3">
              <Button asChild className="h-9 px-3 text-xs font-semibold" variant="outline">
                <Link href={`/nhan-vien/san-pham/${productId}/bien-the`}>Quay lại danh sách biến thể</Link>
              </Button>
            </div>
          </header>

          {isLoading ? (
            <div className="px-6 py-8 text-sm text-muted-foreground">Đang tải dữ liệu...</div>
          ) : errorMessage || !productDetail || !variantDetail || !formDefaultValue ? (
            <div className="space-y-4 px-6 py-8">
              <p className="text-sm text-destructive">{errorMessage ?? "Không tìm thấy biến thể."}</p>
              <Button className="h-10 px-4 text-sm font-semibold" onClick={() => void loadData()} type="button" variant="outline">
                Tải lại
              </Button>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              <VariantForm
                key={variantDetail.id}
                defaultValue={formDefaultValue}
                isDeleting={isDeleting}
                isEditMode
                isSubmitting={isSubmitting}
                onCancelEdit={() => router.replace(`/nhan-vien/san-pham/${productId}/bien-the`)}
                onDelete={() => setIsDeleteConfirmOpen(true)}
                onSubmit={handleSubmit}
                product={productDetail}
              />
            </div>
          )}
        </section>
      </div>

      <ConfirmModal
        cancelText="Giữ lại"
        confirmText="Ẩn biến thể"
        description={variantDetail ? `Biến thể "${variantDetail.name}" sẽ được ẩn (active=false). Bạn có chắc muốn tiếp tục?` : ""}
        isLoading={isDeleting}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
        open={isDeleteConfirmOpen}
        title="Xác nhận ẩn biến thể"
      />
    </StaffLayout>
  );
}
