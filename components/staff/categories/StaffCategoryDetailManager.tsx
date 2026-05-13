"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import ConfirmModal from "@/components/common/ConfirmModal";
import StaffLayout from "@/components/staff/StaffLayout";
import CategoryAttributeTemplateManager from "@/components/staff/categories/CategoryAttributeTemplateManager";
import CategoryCreateForm, { type CategoryFormValue } from "@/components/staff/categories/CategoryCreateForm";
import { Button } from "@/components/ui/button";
import {
  deleteBackofficeCategory,
  listBackofficeCategories,
  updateBackofficeCategory,
} from "@/lib/api/services/categories.service";
import type {
  BackofficeCategory,
  CreateBackofficeCategoryPayload,
} from "@/lib/category/types";

function toCategoryFormValue(category: BackofficeCategory): CategoryFormValue {
  return {
    parentId: category.parentId ?? "",
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    active: category.active,
  };
}

export default function StaffCategoryDetailManager({
  categoryId,
}: {
  categoryId: string;
}) {
  const [categories, setCategories] = useState<BackofficeCategory[]>([]);
  const [category, setCategory] = useState<BackofficeCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const categoriesResponse = await listBackofficeCategories();
      const targetCategory = categoriesResponse.find((item) => item.id === categoryId) ?? null;
      setCategories(categoriesResponse);
      setCategory(targetCategory);
      setErrorMessage(targetCategory ? null : "Không tìm thấy danh mục.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể tải dữ liệu danh mục.");
    } finally {
      setIsLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  const formDefaultValue = useMemo(
    () => (category ? toCategoryFormValue(category) : undefined),
    [category],
  );

  const parentCategoryOptions = useMemo(() => {
    if (!category) {
      return categories;
    }

    return categories.filter((item) => item.id !== category.id);
  }, [categories, category]);

  const childCategories = useMemo(
    () => categories.filter((item) => item.parentId === categoryId),
    [categories, categoryId],
  );

  const handleSubmitCategory = async (payload: CreateBackofficeCategoryPayload) => {
    if (!category) {
      return;
    }

    setIsSubmitting(true);
    const loadingId = toast.loading("Đang cập nhật danh mục...");
    try {
      await updateBackofficeCategory(category.id, payload);
      await loadData();
      toast.success("Cập nhật danh mục thành công.", { id: loadingId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật danh mục.", {
        id: loadingId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!category) {
      return;
    }

    setIsDeleting(true);
    const loadingId = toast.loading("Đang xóa danh mục...");
    try {
      await deleteBackofficeCategory(category.id);
      toast.success("Đã xóa mềm danh mục.", { id: loadingId });
      setDeletingCategory(false);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa danh mục.", {
        id: loadingId,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <StaffLayout>
      <div className="flex h-full min-h-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <section className="grid h-full min-h-0 w-full gap-8 lg:grid-cols-[minmax(0,1fr)_460px]">
          <article className="flex h-full min-h-0 flex-col border border-border bg-background">
            {isLoading ? (
              <div className="px-6 py-8 text-sm text-muted-foreground">Đang tải dữ liệu danh mục...</div>
            ) : errorMessage || !category || !formDefaultValue ? (
              <div className="space-y-4 px-6 py-8">
                <p className="text-sm text-destructive">{errorMessage ?? "Không tìm thấy danh mục."}</p>
                <Button className="h-10 px-4 text-sm font-semibold" onClick={() => void loadData()} type="button" variant="outline">
                  Tải lại
                </Button>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                <div className="mb-4 flex justify-start">
                  <Button asChild className="h-9 px-3 text-xs font-semibold" variant="outline">
                    <Link href="/nhan-vien/danh-muc">Quay lại trang trước</Link>
                  </Button>
                </div>

                <CategoryCreateForm
                  key={category.id}
                  categories={parentCategoryOptions}
                  defaultValue={formDefaultValue}
                  isDeleting={isDeleting}
                  isEditMode
                  isSubmitting={isSubmitting}
                  onDelete={() => setDeletingCategory(true)}
                  onSubmit={handleSubmitCategory}
                />
              </div>
            )}
          </article>

          <aside className="flex h-full min-h-0 flex-col border border-border bg-background">
            {isLoading ? (
              <div className="px-6 py-8 text-sm text-muted-foreground">Đang tải thông số...</div>
            ) : !category ? (
              <div className="px-6 py-8 text-sm text-muted-foreground">Không có dữ liệu danh mục.</div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                <CategoryAttributeTemplateManager
                  categoryId={category.id}
                  categoryName={category.name}
                  manageHref={`/nhan-vien/danh-muc/${categoryId}/thong-so`}
                  mode="table"
                />

                <div className="mt-6 border-t border-border pt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Danh mục con</h3>
                    <span className="text-xs text-muted-foreground">{childCategories.length} mục</span>
                  </div>
                  {childCategories.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Danh mục này chưa có danh mục con.</p>
                  ) : (
                    <div className="space-y-2">
                      {childCategories.map((child) => (
                        <div key={child.id} className="border border-border px-3 py-2">
                          <p className="truncate text-sm font-semibold">{child.name}</p>
                          <p className="truncate text-xs text-muted-foreground">slug: {child.slug}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>
        </section>
      </div>

      <ConfirmModal
        cancelText="Giữ lại"
        confirmText="Xóa danh mục"
        description={
          category
            ? `Danh mục "${category.name}" sẽ được xóa mềm (active=false). Bạn có chắc muốn tiếp tục?`
            : ""
        }
        isLoading={isDeleting}
        onCancel={() => setDeletingCategory(false)}
        onConfirm={() => void handleDeleteCategory()}
        open={deletingCategory}
        title="Xác nhận xóa danh mục"
      />
    </StaffLayout>
  );
}
