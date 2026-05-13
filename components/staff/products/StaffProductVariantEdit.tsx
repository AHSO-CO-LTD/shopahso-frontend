"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ConfirmModal from "@/components/common/ConfirmModal";
import StaffLayout from "@/components/staff/StaffLayout";
import ImageUploadFieldset from "@/components/staff/products/ImageUploadFieldset";
import VariantForm, { type VariantFormValue } from "@/components/staff/products/VariantForm";
import VariantAttributeValuesEditor, { type VariantAttributeValuesEditorHandle } from "@/components/staff/products/VariantAttributeValuesEditor";
import { Button } from "@/components/ui/button";
import { getBackofficeProduct } from "@/lib/api/services/products.service";
import {
  deleteBackofficeVariant,
  deleteBackofficeVariantImage,
  getBackofficeVariant,
  updateBackofficeVariant,
  uploadBackofficeVariantImage,
} from "@/lib/api/services/variants.service";
import type { CreateVariantPayload, ProductDetail, VariantSummary } from "@/lib/product/types";
import { useRef } from "react";

function toVariantFormValue(variant: VariantSummary): VariantFormValue {
  return {
    sku: variant.sku,
    manufacturerPartNumber: variant.manufacturerPartNumber ?? "",
    name: variant.name,
    slug: variant.slug,
    price: String(variant.price),
    costPrice: variant.costPrice == null ? "" : String(variant.costPrice),
    salePrice: variant.salePrice == null ? "" : String(variant.salePrice),
    discountPercent: variant.discountPercent == null ? "" : String(variant.discountPercent),
    taxPercent: variant.taxPercent == null ? "" : String(variant.taxPercent),
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
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isUnsavedConfirmOpen, setIsUnsavedConfirmOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [deletingImagePublicId, setDeletingImagePublicId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVariantFormDirty, setIsVariantFormDirty] = useState(false);
  const [isAttributeFormDirty, setIsAttributeFormDirty] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<"list" | "back" | null>(null);
  const attributeEditorRef = useRef<VariantAttributeValuesEditorHandle | null>(null);
  const hasUnsavedChanges = isVariantFormDirty || isAttributeFormDirty;
  const hasUnsavedChangesRef = useRef(false);
  const allowNextBackRef = useRef(false);

  const selectedPreviewUrls = useMemo(
    () => selectedImageFiles.map((file) => URL.createObjectURL(file)),
    [selectedImageFiles],
  );

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

  useEffect(() => {
    return () => {
      selectedPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedPreviewUrls]);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  useEffect(() => {
    window.history.pushState({ variantEditGuard: true }, "", window.location.href);

    const handlePopState = () => {
      if (allowNextBackRef.current) {
        allowNextBackRef.current = false;
        return;
      }

      if (hasUnsavedChangesRef.current) {
        window.history.pushState({ variantEditGuard: true }, "", window.location.href);
        setPendingNavigation("back");
        setIsUnsavedConfirmOpen(true);
        return;
      }

      allowNextBackRef.current = true;
      router.back();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);

  const formDefaultValue = useMemo(() => {
    if (!variantDetail) {
      return undefined;
    }
    return toVariantFormValue(variantDetail);
  }, [variantDetail]);

  const existingImages = useMemo(() => {
    if (!variantDetail) {
      return [];
    }
    return variantDetail.imagePublicIds.map((publicId, index) => ({
      publicId,
      url: variantDetail.imageUrls[index] ?? null,
    }));
  }, [variantDetail]);

  const handleSubmit = async (payload: CreateVariantPayload) => {
    const attributeSaved = await attributeEditorRef.current?.submit();
    if (attributeSaved === false) {
      return;
    }

    setIsSubmitting(true);
    const loadingId = toast.loading("Đang cập nhật biến thể...");
    try {
      await updateBackofficeVariant(variantId, payload);
      toast.success("Cập nhật biến thể thành công.", { id: loadingId });
      attributeEditorRef.current?.markSaved();
      setIsVariantFormDirty(false);
      setIsAttributeFormDirty(false);
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

  const handleRequestNavigate = (target: "list" | "back") => {
    if (hasUnsavedChanges) {
      setPendingNavigation(target);
      setIsUnsavedConfirmOpen(true);
      return;
    }

    if (target === "list") {
      router.replace(`/nhan-vien/san-pham/${productId}/bien-the`);
      return;
    }

    allowNextBackRef.current = true;
    router.back();
  };

  const handleConfirmUnsavedNavigation = () => {
    if (!pendingNavigation) {
      setIsUnsavedConfirmOpen(false);
      return;
    }

    setIsUnsavedConfirmOpen(false);
    if (pendingNavigation === "list") {
      router.replace(`/nhan-vien/san-pham/${productId}/bien-the`);
      setPendingNavigation(null);
      return;
    }

    allowNextBackRef.current = true;
    router.back();
    setPendingNavigation(null);
  };

  const handleUploadVariantImages = async () => {
    if (!variantDetail || selectedImageFiles.length === 0) {
      toast.warning("Vui lòng chọn ảnh trước khi tải lên.");
      return;
    }

    setIsUploadingImage(true);
    const loadingId = toast.loading("Đang tải ảnh biến thể...");
    try {
      for (const file of selectedImageFiles) {
        await uploadBackofficeVariantImage(variantDetail.id, file);
      }
      const updated = await getBackofficeVariant(variantDetail.id);
      setVariantDetail(updated);
      setSelectedImageFiles([]);
      toast.success("Tải ảnh biến thể thành công.", { id: loadingId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải ảnh biến thể.", {
        id: loadingId,
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteVariantImage = async (publicId: string) => {
    if (!variantDetail) {
      return;
    }
    setDeletingImagePublicId(publicId);
    const loadingId = toast.loading("Đang xóa ảnh biến thể...");
    try {
      const updated = await deleteBackofficeVariantImage(variantDetail.id, publicId);
      setVariantDetail(updated);
      toast.success("Xóa ảnh biến thể thành công.", { id: loadingId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa ảnh biến thể.", {
        id: loadingId,
      });
    } finally {
      setDeletingImagePublicId(null);
    }
  };

  return (
    <StaffLayout>
      <div className="flex h-full min-h-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <section className="flex h-full min-h-0 w-full flex-col border border-border bg-background">
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
              <div className="mb-4 flex justify-start">
                <Button className="h-9 px-3 text-xs font-semibold" onClick={() => handleRequestNavigate("back")} type="button" variant="outline">
                  Quay lại trang trước
                </Button>
              </div>

              <VariantForm
                key={variantDetail.id}
                attributeValuesSlot={
                  <VariantAttributeValuesEditor
                    ref={attributeEditorRef}
                    attributes={productDetail.attributes}
                    onDirtyChange={setIsAttributeFormDirty}
                    onReloadAttributes={loadData}
                    productId={productId}
                    variantId={variantDetail.id}
                  />
                }
                defaultValue={formDefaultValue}
                imageUploadSlot={
                  <ImageUploadFieldset
                    deletingPublicId={deletingImagePublicId}
                    description="Tải ảnh trực tiếp, không dùng đường dẫn URL thủ công."
                    existingImages={existingImages}
                    isUploading={isUploadingImage}
                    onClearSelected={() => setSelectedImageFiles([])}
                    onDeleteExistingImage={(publicId) => void handleDeleteVariantImage(publicId)}
                    onSelectFiles={setSelectedImageFiles}
                    onUploadSelected={() => void handleUploadVariantImages()}
                    selectedFiles={selectedImageFiles}
                    selectedPreviewUrls={selectedPreviewUrls}
                    title="Ảnh biến thể"
                    uploadButtonText="Tải ảnh lên"
                  />
                }
                isDeleting={isDeleting}
                isEditMode
                isSubmitting={isSubmitting}
                onCancelEdit={() => handleRequestNavigate("list")}
                onDirtyChange={setIsVariantFormDirty}
                onDelete={() => setIsDeleteConfirmOpen(true)}
                onSubmit={handleSubmit}
                product={productDetail}
              />
            </div>
          )}
        </section>
      </div>

      <ConfirmModal
        cancelText="Tiếp tục chỉnh sửa"
        confirmText="Rời trang"
        description="Bạn có thay đổi chưa lưu. Nếu rời trang bây giờ, toàn bộ thay đổi vừa thao tác sẽ chưa được lưu."
        isLoading={false}
        onCancel={() => {
          setIsUnsavedConfirmOpen(false);
          setPendingNavigation(null);
        }}
        onConfirm={() => handleConfirmUnsavedNavigation()}
        open={isUnsavedConfirmOpen}
        title="Xác nhận rời trang"
      />

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
