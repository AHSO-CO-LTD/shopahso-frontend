"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import ConfirmModal from "@/components/common/ConfirmModal";
import StaffLayout from "@/components/staff/StaffLayout";
import ImageUploadFieldset from "@/components/staff/products/ImageUploadFieldset";
import ProductForm, { type ProductFormValue } from "@/components/staff/products/ProductForm";
import ProductAttributeManager from "@/components/staff/products/ProductAttributeManager";
import { Button } from "@/components/ui/button";
import { listBackofficeBrands } from "@/lib/api/services/brands.service";
import { listBackofficeCategories } from "@/lib/api/services/categories.service";
import {
  deleteBackofficeProduct,
  deleteBackofficeProductImage,
  getBackofficeProduct,
  updateBackofficeProduct,
  uploadBackofficeProductImage,
} from "@/lib/api/services/products.service";
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
    status: product.status ?? "DRAFT",
    active: product.active,
  };
}

export default function StaffProductDetailManager({ productId }: { productId: string }) {
  const [categories, setCategories] = useState<BackofficeCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [productDetail, setProductDetail] = useState<ProductDetail | null>(null);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [deletingImagePublicId, setDeletingImagePublicId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<"attributes" | "variants">("attributes");

  const selectedPreviewUrls = useMemo(
    () => selectedImageFiles.map((file) => URL.createObjectURL(file)),
    [selectedImageFiles],
  );

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

  useEffect(() => {
    return () => {
      selectedPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedPreviewUrls]);

  const productFormDefault = useMemo(
    () => (productDetail ? toProductFormValue(productDetail) : undefined),
    [productDetail],
  );

  const existingImages = useMemo(() => {
    if (!productDetail) {
      return [];
    }
    return productDetail.imagePublicIds.map((publicId, index) => ({
      publicId,
      url: productDetail.imageUrls[index] ?? null,
    }));
  }, [productDetail]);

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

  const handleUploadProductImages = async () => {
    if (!productDetail || selectedImageFiles.length === 0) {
      toast.warning("Vui lòng chọn ảnh trước khi tải lên.");
      return;
    }

    setIsUploadingImage(true);
    const loadingId = toast.loading("Đang tải ảnh sản phẩm...");
    try {
      for (const file of selectedImageFiles) {
        await uploadBackofficeProductImage(productDetail.id, file);
      }
      setSelectedImageFiles([]);
      await loadData();
      toast.success("Tải ảnh sản phẩm thành công.", { id: loadingId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải ảnh sản phẩm.", {
        id: loadingId,
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteProductImage = async (publicId: string) => {
    if (!productDetail) {
      return;
    }
    setDeletingImagePublicId(publicId);
    const loadingId = toast.loading("Đang xóa ảnh sản phẩm...");
    try {
      await deleteBackofficeProductImage(productDetail.id, publicId);
      await loadData();
      toast.success("Xóa ảnh sản phẩm thành công.", { id: loadingId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa ảnh sản phẩm.", {
        id: loadingId,
      });
    } finally {
      setDeletingImagePublicId(null);
    }
  };

  return (
    <StaffLayout>
      <div className="flex h-full min-h-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <section className="grid h-full min-h-0 w-full gap-8 lg:grid-cols-[minmax(0,1fr)_460px]">
          <article className="flex h-full min-h-0 flex-col border border-border bg-background">
            {isLoading ? (
              <div className="px-6 py-8 text-sm text-muted-foreground">Đang tải dữ liệu sản phẩm...</div>
            ) : errorMessage || !productDetail || !productFormDefault ? (
              <div className="space-y-4 px-6 py-8">
                <p className="text-sm text-destructive">{errorMessage ?? "Không tìm thấy sản phẩm."}</p>
                <Button className="h-10 px-4 text-sm font-semibold" onClick={() => void loadData()} type="button" variant="outline">
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
                  key={productDetail.id}
                  brands={brands}
                  categories={categories}
                  defaultValue={productFormDefault}
                  imageUploadSlot={
                    <ImageUploadFieldset
                      deletingPublicId={deletingImagePublicId}
                      description="Tải ảnh trực tiếp, không dùng đường dẫn URL thủ công."
                      existingImages={existingImages}
                      isUploading={isUploadingImage}
                      onClearSelected={() => setSelectedImageFiles([])}
                      onDeleteExistingImage={(publicId) => void handleDeleteProductImage(publicId)}
                      onSelectFiles={setSelectedImageFiles}
                      onUploadSelected={() => void handleUploadProductImages()}
                      selectedFiles={selectedImageFiles}
                      selectedPreviewUrls={selectedPreviewUrls}
                      title="Ảnh sản phẩm"
                      uploadButtonText="Tải ảnh lên"
                    />
                  }
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
            {isLoading ? (
              <div className="px-6 py-8 text-sm text-muted-foreground">Đang tải biến thể...</div>
            ) : !productDetail ? (
              <div className="px-6 py-8 text-sm text-muted-foreground">Không có dữ liệu biến thể.</div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                <div className="mb-4 flex gap-2 border border-border p-1">
                  <Button
                    className="h-9 cursor-pointer px-3 text-xs font-semibold"
                    onClick={() => setActiveSidebarTab("attributes")}
                    type="button"
                    variant={activeSidebarTab === "attributes" ? "default" : "outline"}
                  >
                    Thông số kỹ thuật
                  </Button>
                  <Button
                    className="h-9 cursor-pointer px-3 text-xs font-semibold"
                    onClick={() => setActiveSidebarTab("variants")}
                    type="button"
                    variant={activeSidebarTab === "variants" ? "default" : "outline"}
                  >
                    Danh sách biến thể
                  </Button>
                </div>

                {activeSidebarTab === "attributes" ? (
                  <ProductAttributeManager
                    attributes={productDetail.attributes}
                    manageHref={`/nhan-vien/san-pham/${productId}/thong-so`}
                    mode="table"
                    onReload={loadData}
                    productId={productId}
                  />
                ) : (
                  <>
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
                  </>
                )}
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
