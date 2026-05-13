"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import StaffLayout from "@/components/staff/StaffLayout";
import CategoryAttributeTemplateManager from "@/components/staff/categories/CategoryAttributeTemplateManager";
import { Button } from "@/components/ui/button";
import { listBackofficeCategories } from "@/lib/api/services/categories.service";
import type { BackofficeCategory } from "@/lib/category/types";

export default function StaffCategoryAttributeTemplateManage({
  categoryId,
}: {
  categoryId: string;
}) {
  const [category, setCategory] = useState<BackofficeCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCategory = useCallback(async () => {
    setIsLoading(true);
    try {
      const categories = await listBackofficeCategories();
      const targetCategory = categories.find((item) => item.id === categoryId) ?? null;
      setCategory(targetCategory);
      setErrorMessage(targetCategory ? null : "Không tìm thấy danh mục.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể tải thông tin danh mục.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCategory();
  }, [loadCategory]);

  return (
    <StaffLayout>
      <div className="flex h-full min-h-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <section className="flex h-full min-h-0 w-full flex-col border border-border bg-background">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            <div className="mb-4 flex justify-start">
              <Button asChild className="h-9 px-3 text-xs font-semibold" variant="outline">
                <Link href={`/nhan-vien/danh-muc/${categoryId}`}>Quay lại trang trước</Link>
              </Button>
            </div>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Đang tải thông tin danh mục...</p>
            ) : errorMessage || !category ? (
              <p className="text-sm text-destructive">{errorMessage ?? "Không tìm thấy danh mục."}</p>
            ) : (
              <CategoryAttributeTemplateManager
                categoryId={category.id}
                categoryName={category.name}
                mode="full"
              />
            )}
          </div>
        </section>
      </div>
    </StaffLayout>
  );
}
