"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import StaffLayout from "@/components/staff/StaffLayout";
import ImageUploadFieldset from "@/components/staff/products/ImageUploadFieldset";
import VariantForm, { DEFAULT_VARIANT_FORM_VALUE } from "@/components/staff/products/VariantForm";
import { Button } from "@/components/ui/button";
import { getBackofficeProduct } from "@/lib/api/services/products.service";
import { createBackofficeVariant, uploadBackofficeVariantImage } from "@/lib/api/services/variants.service";
import type { CreateVariantPayload, ProductDetail } from "@/lib/product/types";

export default function StaffProductVariantCreate({ productId }: { productId: string }) {
  const router = useRouter();
  const [productDetail, setProductDetail] = useState<ProductDetail | null>(null);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedPreviewUrls = useMemo(
    () => selectedImageFiles.map((file) => URL.createObjectURL(file)),
    [selectedImageFiles],
  );

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

  useEffect(() => {
    return () => {
      selectedPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedPreviewUrls]);

  const handleUploadImagesForCreatedVariant = async (variantId: string) => {
    if (selectedImageFiles.length === 0) {
      return;
    }

    setIsUploadingImages(true);
    const uploadToastId = toast.loading("Đang tải ảnh biến thể...");
    try {
      for (const file of selectedImageFiles) {
        await uploadBackofficeVariantImage(variantId, file);
      }
      setSelectedImageFiles([]);
      toast.success("Tải ảnh biến thể thành công.", { id: uploadToastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải ảnh biến thể.", {
        id: uploadToastId,
      });
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleSubmit = async (payload: CreateVariantPayload) => {
    setIsSubmitting(true);
    const loadingId = toast.loading("Đang tạo biến thể...");
    try {
      const createdVariant = await createBackofficeVariant(payload);
      toast.success("Tạo biến thể thành công.", { id: loadingId });
      await handleUploadImagesForCreatedVariant(createdVariant.id);
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
              <div className="mb-4 flex justify-start">
                <Button asChild className="h-9 px-3 text-xs font-semibold" variant="outline">
                  <Link href={`/nhan-vien/san-pham/${productId}/bien-the`}>Quay lại trang trước</Link>
                </Button>
              </div>

              <div className="mb-6 border border-border bg-muted/20 px-4 py-3">
                <p className="text-sm font-semibold">Biến thể hiện có: {productDetail.variants.length}</p>
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
                          <p className="truncate text-xs text-muted-foreground">SKU: {variant.sku} | Slug: {variant.slug}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            Giá bán: {variant.price} | Giá sau giảm: {variant.salePrice ?? "N/A"} | Tồn kho: {variant.stockQuantity}
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
                imageUploadSlot={
                  <ImageUploadFieldset
                    description="Tải ảnh trực tiếp, không dùng đường dẫn URL thủ công."
                    emptyExistingText="Biến thể chưa được tạo, ảnh sẽ được tải lên ngay sau khi tạo thành công."
                    isUploading={isUploadingImages}
                    onClearSelected={() => setSelectedImageFiles([])}
                    onSelectFiles={setSelectedImageFiles}
                    onUploadSelected={() => {
                      toast.warning("Ảnh sẽ được tải tự động sau khi tạo biến thể thành công.");
                    }}
                    selectedFiles={selectedImageFiles}
                    selectedPreviewUrls={selectedPreviewUrls}
                    title="Ảnh biến thể"
                    uploadButtonText="Sẽ tải sau khi tạo"
                  />
                }
                isEditMode={false}
                isSubmitting={isSubmitting || isUploadingImages}
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
