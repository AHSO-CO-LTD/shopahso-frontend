"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import StaffLayout from "@/components/staff/StaffLayout";
import ProductAttributeManager from "@/components/staff/products/ProductAttributeManager";
import { Button } from "@/components/ui/button";
import { getBackofficeProduct } from "@/lib/api/services/products.service";
import type { ProductDetail } from "@/lib/product/types";

export default function StaffProductAttributeManage({
  productId,
}: {
  productId: string;
}) {
  const [productDetail, setProductDetail] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProduct = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getBackofficeProduct(productId);
      setProductDetail(response);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể tải thông tin sản phẩm.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProduct();
  }, [loadProduct]);

  return (
    <StaffLayout>
      <div className="flex h-full min-h-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <section className="flex h-full min-h-0 w-full flex-col border border-border bg-background">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            <div className="mb-4 flex justify-start">
              <Button asChild className="h-9 px-3 text-xs font-semibold" variant="outline">
                <Link href={`/nhan-vien/san-pham/${productId}`}>Quay lại trang trước</Link>
              </Button>
            </div>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Đang tải thông tin sản phẩm...</p>
            ) : errorMessage || !productDetail ? (
              <p className="text-sm text-destructive">{errorMessage ?? "Không tìm thấy sản phẩm."}</p>
            ) : (
              <ProductAttributeManager
                attributes={productDetail.attributes}
                mode="full"
                onReload={loadProduct}
                productId={productDetail.id}
              />
            )}
          </div>
        </section>
      </div>
    </StaffLayout>
  );
}
