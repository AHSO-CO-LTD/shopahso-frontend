"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import StaffLayout from "@/components/staff/StaffLayout";
import ImageUploadFieldset from "@/components/staff/products/ImageUploadFieldset";
import ProductForm, { DEFAULT_PRODUCT_FORM_VALUE } from "@/components/staff/products/ProductForm";
import { Button } from "@/components/ui/button";
import { listBackofficeBrands } from "@/lib/api/services/brands.service";
import { listBackofficeCategories } from "@/lib/api/services/categories.service";
import { createBackofficeProduct, uploadBackofficeProductImage } from "@/lib/api/services/products.service";
import type { Brand } from "@/lib/brand/types";
import type { BackofficeCategory } from "@/lib/category/types";
import type { CreateProductPayload } from "@/lib/product/types";

export default function StaffProductCreate() {
  const router = useRouter();
  const [categories, setCategories] = useState<BackofficeCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedPreviewUrls = useMemo(
    () => selectedImageFiles.map((file) => URL.createObjectURL(file)),
    [selectedImageFiles],
  );

  const loadBaseData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [categoriesResponse, brandsResponse] = await Promise.all([
        listBackofficeCategories(),
        listBackofficeBrands(),
      ]);
      setCategories(categoriesResponse.filter((item) => item.active));
      setBrands(brandsResponse);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể tải dữ liệu tạo sản phẩm.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBaseData();
  }, [loadBaseData]);

  useEffect(() => {
    return () => {
      selectedPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedPreviewUrls]);

  const handleUploadImagesForCreatedProduct = async (productId: string) => {
    if (selectedImageFiles.length === 0) {
      return;
    }

    setIsUploadingImages(true);
    const uploadToastId = toast.loading("Đang tải ảnh sản phẩm...");
    try {
      for (const file of selectedImageFiles) {
        await uploadBackofficeProductImage(productId, file);
      }
      setSelectedImageFiles([]);
      toast.success("Tải ảnh sản phẩm thành công.", { id: uploadToastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải ảnh sản phẩm.", {
        id: uploadToastId,
      });
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleSubmit = async (payload: CreateProductPayload) => {
    setIsSubmitting(true);
    const loadingId = toast.loading("Đang tạo sản phẩm...");
    try {
      const created = await createBackofficeProduct(payload);
      toast.success("Tạo sản phẩm thành công.", { id: loadingId });
      await handleUploadImagesForCreatedProduct(created.id);
      router.replace(`/nhan-vien/san-pham/${created.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo sản phẩm.", { id: loadingId });
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
          ) : errorMessage ? (
            <div className="space-y-4 px-6 py-8">
              <p className="text-sm text-destructive">{errorMessage}</p>
              <Button className="h-10 px-4 text-sm font-semibold" onClick={() => void loadBaseData()} type="button" variant="outline">
                Tải lại
              </Button>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              <div className="mb-4 flex justify-start">
                <Button asChild className="h-9 px-3 text-xs font-semibold" variant="outline">
                  <Link href="/nhan-vien/san-pham">Quay lại trang trước</Link>
                </Button>
              </div>

              <ProductForm
                brands={brands}
                categories={categories}
                defaultValue={DEFAULT_PRODUCT_FORM_VALUE}
                imageUploadSlot={
                  <ImageUploadFieldset
                    description="Tải ảnh trực tiếp, không dùng đường dẫn URL thủ công."
                    emptyExistingText="Sản phẩm chưa được tạo, ảnh sẽ được tải lên ngay sau khi tạo thành công."
                    isUploading={isUploadingImages}
                    onClearSelected={() => setSelectedImageFiles([])}
                    onSelectFiles={setSelectedImageFiles}
                    onUploadSelected={() => {
                      toast.warning("Ảnh sẽ được tải tự động sau khi tạo sản phẩm thành công.");
                    }}
                    selectedFiles={selectedImageFiles}
                    selectedPreviewUrls={selectedPreviewUrls}
                    title="Ảnh sản phẩm"
                    uploadButtonText="Sẽ tải sau khi tạo"
                  />
                }
                isSubmitting={isSubmitting || isUploadingImages}
                onSubmit={handleSubmit}
              />
            </div>
          )}
        </section>
      </div>
    </StaffLayout>
  );
}
