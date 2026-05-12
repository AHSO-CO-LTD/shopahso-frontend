"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import StaffLayout from "@/components/staff/StaffLayout";
import ProductForm, { DEFAULT_PRODUCT_FORM_VALUE } from "@/components/staff/products/ProductForm";
import { Button } from "@/components/ui/button";
import { createBackofficeProduct } from "@/lib/api/services/products.service";
import { listBackofficeCategories } from "@/lib/api/services/categories.service";
import { listBackofficeBrands } from "@/lib/api/services/brands.service";
import type { Brand } from "@/lib/brand/types";
import type { BackofficeCategory } from "@/lib/category/types";
import type { CreateProductPayload } from "@/lib/product/types";

export default function StaffProductCreate() {
  const router = useRouter();
  const [categories, setCategories] = useState<BackofficeCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleSubmit = async (payload: CreateProductPayload) => {
    setIsSubmitting(true);
    const loadingId = toast.loading("Đang tạo sản phẩm...");
    try {
      const created = await createBackofficeProduct(payload);
      toast.success("Tạo sản phẩm thành công.", { id: loadingId });
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
          <header className="border-b border-border px-6 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Sản phẩm</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Tạo sản phẩm mới</h2>
            <div className="mt-3">
              <Button asChild className="h-9 px-3 text-xs font-semibold" variant="outline">
                <Link href="/nhan-vien/san-pham">Quay lại danh sách sản phẩm</Link>
              </Button>
            </div>
          </header>

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
              <ProductForm
                brands={brands}
                categories={categories}
                defaultValue={DEFAULT_PRODUCT_FORM_VALUE}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
              />
            </div>
          )}
        </section>
      </div>
    </StaffLayout>
  );
}
