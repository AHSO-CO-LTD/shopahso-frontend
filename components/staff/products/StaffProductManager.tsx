"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import ConfirmModal from "@/components/common/ConfirmModal";
import StaffLayout from "@/components/staff/StaffLayout";
import ProductForm, { DEFAULT_PRODUCT_FORM_VALUE, type ProductFormValue } from "@/components/staff/products/ProductForm";
import VariantForm, { DEFAULT_VARIANT_FORM_VALUE, type VariantFormValue } from "@/components/staff/products/VariantForm";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { listBackofficeBrands } from "@/lib/api/services/brands.service";
import { listBackofficeCategories } from "@/lib/api/services/categories.service";
import {
  createBackofficeProduct,
  deleteBackofficeProduct,
  getBackofficeProduct,
  listBackofficeProducts,
  updateBackofficeProduct,
} from "@/lib/api/services/products.service";
import {
  createBackofficeVariant,
  deleteBackofficeVariant,
  updateBackofficeVariant,
} from "@/lib/api/services/variants.service";
import type { Brand } from "@/lib/brand/types";
import type { BackofficeCategory } from "@/lib/category/types";
import type { CreateProductPayload, CreateVariantPayload, ProductDetail, ProductSummary, VariantSummary } from "@/lib/product/types";

function sortProducts(items: ProductSummary[]) {
  return [...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

function toProductFormValue(product: ProductSummary): ProductFormValue {
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

function toVariantFormValue(variant: VariantSummary): VariantFormValue {
  return {
    sku: variant.sku,
    manufacturerPartNumber: variant.manufacturerPartNumber ?? "",
    originCountryCode: variant.originCountryCode ?? "",
    name: variant.name,
    slug: variant.slug,
    pricingStatus: variant.pricingStatus ?? "HAS_PRICE",
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

export default function StaffProductManager() {
  const [categories, setCategories] = useState<BackofficeCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedProductDetail, setSelectedProductDetail] = useState<ProductDetail | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [isSubmittingVariant, setIsSubmittingVariant] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [isDeletingVariant, setIsDeletingVariant] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductSummary | null>(null);
  const [deletingVariant, setDeletingVariant] = useState<VariantSummary | null>(null);

  const loadBaseData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [categoriesResponse, brandsResponse, productsResponse] = await Promise.all([
        listBackofficeCategories(),
        listBackofficeBrands(),
        listBackofficeProducts(),
      ]);

      setCategories(categoriesResponse.filter((item) => item.active));
      setBrands(brandsResponse);
      setProducts(sortProducts(productsResponse));
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể tải dữ liệu sản phẩm.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBaseData();
  }, [loadBaseData]);

  const filteredProducts = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) {
      return products;
    }
    return products.filter((item) => item.name.toLowerCase().includes(keyword) || item.slug.toLowerCase().includes(keyword));
  }, [products, searchKeyword]);

  const selectedProduct = useMemo(
    () => products.find((item) => item.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );

  const selectedVariant = useMemo(
    () => selectedProductDetail?.variants.find((item) => item.id === selectedVariantId) ?? null,
    [selectedProductDetail, selectedVariantId],
  );

  const productFormDefault = useMemo(() => {
    if (!selectedProduct) {
      return DEFAULT_PRODUCT_FORM_VALUE;
    }
    return toProductFormValue(selectedProduct);
  }, [selectedProduct]);

  const variantFormDefault = useMemo(() => {
    if (!selectedVariant) {
      return DEFAULT_VARIANT_FORM_VALUE;
    }
    return toVariantFormValue(selectedVariant);
  }, [selectedVariant]);

  const loadProductDetail = async (productId: string) => {
    try {
      const detail = await getBackofficeProduct(productId);
      setSelectedProductDetail(detail);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải danh sách biến thể.");
      setSelectedProductDetail(null);
    }
  };

  const handleSelectProduct = async (productId: string) => {
    setSelectedProductId(productId);
    setSelectedVariantId("");
    await loadProductDetail(productId);
  };

  const handleSubmitProduct = async (payload: CreateProductPayload) => {
    if (selectedProduct) {
      setIsSubmittingProduct(true);
      const loadingId = toast.loading("Đang cập nhật sản phẩm...");
      try {
        const updated = await updateBackofficeProduct(selectedProduct.id, payload);
        setProducts((current) => sortProducts(current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))));
        await loadProductDetail(updated.id);
        toast.success("Cập nhật sản phẩm thành công.", { id: loadingId });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thể cập nhật sản phẩm.", { id: loadingId });
      } finally {
        setIsSubmittingProduct(false);
      }
      return;
    }

    setIsSubmittingProduct(true);
    const loadingId = toast.loading("Đang tạo sản phẩm...");
    try {
      const created = await createBackofficeProduct(payload);
      setProducts((current) => sortProducts([created, ...current]));
      toast.success("Tạo sản phẩm thành công.", { id: loadingId });
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message, { id: loadingId });
      } else {
        toast.error("Không thể tạo sản phẩm.", { id: loadingId });
      }
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) {
      return;
    }
    setIsDeletingProduct(true);
    const loadingId = toast.loading("Đang ẩn sản phẩm...");
    try {
      const deleted = await deleteBackofficeProduct(deletingProduct.id);
      setProducts((current) => sortProducts(current.map((item) => (item.id === deleted.id ? { ...item, ...deleted } : item))));
      if (selectedProductId === deleted.id) {
        setSelectedProductId("");
        setSelectedProductDetail(null);
        setSelectedVariantId("");
      }
      setDeletingProduct(null);
      toast.success("Đã ẩn sản phẩm và toàn bộ biến thể liên quan.", { id: loadingId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể ẩn sản phẩm.", { id: loadingId });
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const handleSubmitVariant = async (payload: CreateVariantPayload) => {
    if (!selectedProduct) {
      toast.warning("Vui lòng chọn sản phẩm trước.");
      return;
    }

    if (selectedVariant) {
      setIsSubmittingVariant(true);
      const loadingId = toast.loading("Đang cập nhật biến thể...");
      try {
        await updateBackofficeVariant(selectedVariant.id, payload);
        await loadProductDetail(selectedProduct.id);
        toast.success("Cập nhật biến thể thành công.", { id: loadingId });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thể cập nhật biến thể.", { id: loadingId });
      } finally {
        setIsSubmittingVariant(false);
      }
      return;
    }

    setIsSubmittingVariant(true);
    const loadingId = toast.loading("Đang tạo biến thể...");
    try {
      await createBackofficeVariant(payload);
      await loadProductDetail(selectedProduct.id);
      toast.success("Tạo biến thể thành công.", { id: loadingId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo biến thể.", { id: loadingId });
    } finally {
      setIsSubmittingVariant(false);
    }
  };

  const handleDeleteVariant = async () => {
    if (!deletingVariant || !selectedProduct) {
      return;
    }
    setIsDeletingVariant(true);
    const loadingId = toast.loading("Đang ẩn biến thể...");
    try {
      await deleteBackofficeVariant(deletingVariant.id);
      await loadProductDetail(selectedProduct.id);
      if (selectedVariantId === deletingVariant.id) {
        setSelectedVariantId("");
      }
      setDeletingVariant(null);
      toast.success("Đã ẩn biến thể.", { id: loadingId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể ẩn biến thể.", { id: loadingId });
    } finally {
      setIsDeletingVariant(false);
    }
  };

  return (
    <StaffLayout>
      <div className="flex h-full min-h-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <section className="grid h-full min-h-0 w-full gap-8 lg:grid-cols-2">
          <article className="flex h-full min-h-0 flex-col border border-border bg-background">
            <header className="border-b border-border px-6 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Sản phẩm</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Quản lý sản phẩm</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {selectedProduct ? `Đang chỉnh sửa: ${selectedProduct.name}` : "Tạo mới sản phẩm và quản lý biến thể cùng màn hình."}
              </p>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              <ProductForm
                key={selectedProduct?.id ?? "product-create-form"}
                brands={brands}
                categories={categories}
                defaultValue={productFormDefault}
                isDeleting={isDeletingProduct}
                isEditMode={Boolean(selectedProduct)}
                isSubmitting={isSubmittingProduct}
                onCancelEdit={() => {
                  setSelectedProductId("");
                  setSelectedProductDetail(null);
                  setSelectedVariantId("");
                }}
                onDelete={() => selectedProduct && setDeletingProduct(selectedProduct)}
                onSubmit={handleSubmitProduct}
              />
            </div>
          </article>

          <aside className="flex h-full min-h-0 flex-col border border-border bg-background">
            <header className="border-b border-border px-6 py-5">
              <h3 className="text-xl font-black tracking-tight">Danh sách sản phẩm và biến thể</h3>
            </header>
            <div className="border-b border-border px-6 py-4">
              <label className="grid gap-2 text-sm">
                <span className="font-semibold">Tìm sản phẩm</span>
                <input className="h-11 border border-border px-3 outline-none focus:border-primary" onChange={(event) => setSearchKeyword(event.target.value)} value={searchKeyword} />
              </label>
            </div>

            {isLoading ? (
              <div className="px-6 py-8 text-sm text-muted-foreground">Đang tải sản phẩm...</div>
            ) : errorMessage ? (
              <div className="space-y-4 px-6 py-8">
                <p className="text-sm text-destructive">{errorMessage}</p>
                <Button className="h-10 px-4 text-sm font-semibold" onClick={() => void loadBaseData()} type="button" variant="outline">Tải lại</Button>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                <div className="space-y-3">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      className={[
                        "grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_70px] items-center gap-3 border px-4 py-3 text-left",
                        selectedProductId === product.id ? "border-primary bg-muted/20" : "border-border hover:bg-muted/20",
                      ].join(" ")}
                      onClick={() => void handleSelectProduct(product.id)}
                      type="button"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{product.name}</p>
                        <p className="truncate text-xs text-muted-foreground">slug: {product.slug}</p>
                        <p className="truncate text-xs text-muted-foreground">variants: {product._count.variants}</p>
                      </div>
                      <div className="text-right text-xs font-semibold">
                        <p>{product.status}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">{product.active ? "ON" : "OFF"}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {selectedProductDetail ? (
                  <section className="mt-6 space-y-4 border-t border-border pt-6">
                    <h4 className="text-lg font-black tracking-tight">Biến thể của {selectedProductDetail.name}</h4>
                    <div className="space-y-2">
                      {selectedProductDetail.variants.map((variant) => (
                        <button
                          key={variant.id}
                          className={[
                            "grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_70px] items-center gap-3 border px-3 py-3 text-left",
                            selectedVariantId === variant.id ? "border-primary bg-muted/20" : "border-border hover:bg-muted/20",
                          ].join(" ")}
                          onClick={() => setSelectedVariantId(variant.id)}
                          type="button"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{variant.name}</p>
                            <p className="truncate text-xs text-muted-foreground">SKU: {variant.sku}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              Giá bán: {variant.price} | Giá sau giảm: {variant.salePrice ?? "N/A"}
                            </p>
                          </div>
                          <span className="text-right text-xs font-semibold">{variant.active ? "ON" : "OFF"}</span>
                        </button>
                      ))}
                    </div>

                    <div className="border border-border p-4">
                      <p className="mb-3 text-sm font-semibold">{selectedVariant ? "Sửa biến thể" : "Tạo biến thể mới"}</p>
                      <VariantForm
                        key={selectedVariant?.id ?? `variant-create-${selectedProductDetail.id}`}
                        defaultValue={variantFormDefault}
                        isDeleting={isDeletingVariant}
                        isEditMode={Boolean(selectedVariant)}
                        isSubmitting={isSubmittingVariant}
                        onCancelEdit={() => setSelectedVariantId("")}
                        onDelete={() => selectedVariant && setDeletingVariant(selectedVariant)}
                        onSubmit={handleSubmitVariant}
                        product={selectedProduct}
                      />
                    </div>
                  </section>
                ) : (
                  <p className="mt-6 text-sm text-muted-foreground">Chọn sản phẩm để xem và quản lý biến thể tương ứng.</p>
                )}
              </div>
            )}
          </aside>
        </section>
      </div>

      <ConfirmModal
        cancelText="Giữ lại"
        confirmText="Ẩn sản phẩm"
        description={
          deletingProduct
            ? `Sản phẩm "${deletingProduct.name}" và toàn bộ biến thể sẽ được ẩn. Bạn có chắc muốn tiếp tục?`
            : ""
        }
        isLoading={isDeletingProduct}
        onCancel={() => setDeletingProduct(null)}
        onConfirm={() => void handleDeleteProduct()}
        open={Boolean(deletingProduct)}
        title="Xác nhận ẩn sản phẩm"
      />

      <ConfirmModal
        cancelText="Giữ lại"
        confirmText="Ẩn biến thể"
        description={
          deletingVariant
            ? `Biến thể "${deletingVariant.name}" sẽ được ẩn (active=false). Bạn có chắc muốn tiếp tục?`
            : ""
        }
        isLoading={isDeletingVariant}
        onCancel={() => setDeletingVariant(null)}
        onConfirm={() => void handleDeleteVariant()}
        open={Boolean(deletingVariant)}
        title="Xác nhận ẩn biến thể"
      />
    </StaffLayout>
  );
}
