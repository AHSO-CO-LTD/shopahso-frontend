"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import ConfirmModal from "@/components/common/ConfirmModal";
import StaffLayout from "@/components/staff/StaffLayout";
import CategoryCreateForm, {
  DEFAULT_CATEGORY_FORM_VALUE,
  type CategoryFormValue,
} from "@/components/staff/categories/CategoryCreateForm";
import { Button } from "@/components/ui/button";
import {
  createBackofficeCategory,
  deleteBackofficeCategory,
  listBackofficeCategories,
  updateBackofficeCategory,
} from "@/lib/api/services/categories.service";
import { ApiError } from "@/lib/api/client";
import type {
  BackofficeCategory,
  CreateBackofficeCategoryPayload,
} from "@/lib/category/types";

function sortCategories(items: BackofficeCategory[]) {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "vi"));
}

export default function StaffCategoryCreate() {
  const [categories, setCategories] = useState<BackofficeCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string>("");
  const [deletingCategory, setDeletingCategory] = useState<BackofficeCategory | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchKeywordDebounced, setSearchKeywordDebounced] = useState("");
  const sharedFormContainerRef = useRef<HTMLDivElement | null>(null);

  const loadCategories = useCallback(async (keyword?: string) => {
    setIsLoading(true);

    try {
      const response = await listBackofficeCategories({
        q: keyword?.trim() ? keyword.trim() : undefined,
      });
      const sorted = sortCategories(response);
      setCategories(sorted);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không thể tải danh sách danh mục.",
      );
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCategories(searchKeywordDebounced);
  }, [loadCategories, searchKeywordDebounced]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchKeywordDebounced(searchKeyword);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchKeyword]);

  const handleReloadCategories = () => {
    setIsLoading(true);
    setErrorMessage(null);
    if (searchKeywordDebounced.trim()) {
      setIsSearching(true);
    }
    void loadCategories(searchKeywordDebounced);
  };

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === editingCategoryId) ?? null,
    [categories, editingCategoryId],
  );

  const isEditMode = Boolean(selectedCategory);

  const categoryFormDefaultValue: CategoryFormValue = useMemo(() => {
    if (!selectedCategory) {
      return DEFAULT_CATEGORY_FORM_VALUE;
    }

    return {
      parentId: selectedCategory.parentId ?? "",
      name: selectedCategory.name,
      slug: selectedCategory.slug,
      description: selectedCategory.description ?? "",
      active: selectedCategory.active,
    };
  }, [selectedCategory]);

  const parentCategoryOptions = useMemo(() => {
    if (!selectedCategory) {
      return categories;
    }

    return categories.filter((item) => item.id !== selectedCategory.id);
  }, [categories, selectedCategory]);

  const handleCreateCategory = async (payload: CreateBackofficeCategoryPayload) => {
    if (!payload.name || !payload.slug) {
      toast.warning("Vui lòng nhập đầy đủ tên danh mục và slug.");
      return;
    }

    if (!Number.isInteger(payload.sortOrder) || payload.sortOrder < 0) {
      toast.warning("Thứ tự sắp xếp phải là số nguyên lớn hơn hoặc bằng 0.");
      return;
    }

    setIsSubmitting(true);
    const loadingId = toast.loading("Đang tạo danh mục...");

    try {
      const createdCategory = await createBackofficeCategory(payload);
      setCategories((current) => sortCategories([...current, createdCategory]));
      toast.success("Tạo danh mục thành công.", { id: loadingId });
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message, { id: loadingId });
      } else {
        toast.error("Không thể tạo danh mục.", { id: loadingId });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitCategory = async (payload: CreateBackofficeCategoryPayload) => {
    if (isEditMode && selectedCategory) {
      if (!payload.name.trim() || !payload.slug.trim()) {
        toast.warning("Vui lòng nhập đầy đủ tên danh mục và slug.");
        return;
      }

      setIsSubmitting(true);
      const loadingId = toast.loading("Đang cập nhật danh mục...");

      try {
        const updatedCategory = await updateBackofficeCategory(selectedCategory.id, payload);
        setCategories((current) =>
          sortCategories(
            current.map((item) => (item.id === updatedCategory.id ? updatedCategory : item)),
          ),
        );
        toast.success("Cập nhật danh mục thành công.", { id: loadingId });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thể cập nhật danh mục.", {
          id: loadingId,
        });
      } finally {
        setIsSubmitting(false);
      }

      return;
    }
    await handleCreateCategory(payload);
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) {
      return;
    }

    setIsDeleting(true);
    const loadingId = toast.loading("Đang xóa danh mục...");

    try {
      const deletedCategory = await deleteBackofficeCategory(deletingCategory.id);
      setCategories((current) =>
        sortCategories(current.map((item) => (item.id === deletedCategory.id ? deletedCategory : item))),
      );

      if (editingCategoryId === deletedCategory.id) {
        setEditingCategoryId("");
      }

      toast.success("Đã xóa mềm danh mục.", { id: loadingId });
      setDeletingCategory(null);
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
        <section className="grid h-full min-h-0 w-full gap-8 lg:grid-cols-2">
          <article className="flex h-full min-h-0 flex-col border border-border bg-background">
            <header className="border-b border-border px-6 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Danh mục
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Tạo danh mục mới</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {isEditMode
                  ? `Đang chỉnh sửa: ${selectedCategory?.name ?? "Danh mục"}`
                  : "Nhập thông tin để tạo danh mục cho hệ thống cửa hàng."}
              </p>
            </header>
            <div ref={sharedFormContainerRef} className="flex-1 px-6 py-6">
              <CategoryCreateForm
                key={selectedCategory?.id ?? "create-category-form"}
                categories={parentCategoryOptions}
                defaultValue={categoryFormDefaultValue}
                isDeleting={isDeleting}
                isEditMode={isEditMode}
                isSubmitting={isSubmitting}
                onCancelEdit={() => setEditingCategoryId("")}
                onDelete={() => {
                  if (selectedCategory) {
                    setDeletingCategory(selectedCategory);
                  }
                }}
                onSubmit={handleSubmitCategory}
              />
            </div>
          </article>

          <aside className="flex h-full min-h-0 flex-col border border-border bg-background">
            <header className="border-b border-border px-6 py-5">
              <h3 className="text-xl font-black tracking-tight">Danh sách danh mục</h3>
            </header>
            <div className="border-b border-border px-6 py-4">
              <label className="grid gap-2 text-sm">
                <span className="font-semibold">Tìm nhanh danh mục</span>
                <input
                  className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
                  onChange={(event) => {
                    const keyword = event.target.value;
                    setSearchKeyword(keyword);
                    setIsSearching(Boolean(keyword.trim()));
                  }}
                  placeholder="Nhập tên hoặc slug, ví dụ: dien, aptomat..."
                  type="text"
                  value={searchKeyword}
                />
              </label>
            </div>

            {isLoading ? (
              <div className="px-6 py-8 text-sm text-muted-foreground">Đang tải danh mục...</div>
            ) : errorMessage ? (
              <div className="space-y-4 px-6 py-8">
                <p className="text-sm text-destructive">{errorMessage}</p>
                <Button
                  className="h-10 cursor-pointer px-4 text-sm font-semibold"
                  onClick={handleReloadCategories}
                  type="button"
                  variant="outline"
                >
                  Tải lại
                </Button>
              </div>
            ) : categories.length === 0 ? (
              <div className="px-6 py-8 text-sm text-muted-foreground">
                {searchKeywordDebounced.trim()
                  ? "Không tìm thấy danh mục phù hợp với từ khóa."
                  : "Chưa có danh mục nào. Hãy tạo danh mục đầu tiên."}
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col space-y-4 px-6 py-6">
                <div className="grid grid-cols-[minmax(0,1fr)_92px_86px] border border-border bg-muted/20 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <p>Thông tin</p>
                  <p className="text-center">Trạng thái</p>
                  <p className="text-right">Thao tác</p>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto border border-border">
                  <ul className="divide-y divide-border">
                    {categories.map((category) => {
                      const isEditing = editingCategoryId === category.id;

                      return (
                        <li key={category.id} className="grid grid-cols-[minmax(0,1fr)_92px_86px] items-center gap-3 px-4 py-4">
                          <div className="min-w-0 space-y-1">
                            <p className="truncate font-semibold">{category.name}</p>
                            <p className="truncate text-xs text-muted-foreground">slug: {category.slug}</p>
                            {category.parent ? (
                              <p className="truncate text-xs text-muted-foreground">
                                cha: {category.parent.name}
                              </p>
                            ) : null}
                          </div>
                          <div className="text-center">
                            <span
                              className={[
                                "inline-flex min-w-20 justify-center border px-2 py-1 text-[11px] font-semibold",
                                category.active
                                  ? "border-primary/40 bg-primary/10 text-primary"
                                  : "border-border bg-muted text-muted-foreground",
                              ].join(" ")}
                            >
                              {category.active ? "Hoạt động" : "Tạm ẩn"}
                            </span>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              className="h-8 cursor-pointer px-2 text-[11px] font-semibold"
                              onClick={() => setEditingCategoryId(category.id)}
                              type="button"
                              variant={isEditing ? "default" : "outline"}
                            >
                              Sửa
                            </Button>
                            <Button
                              className="h-8 cursor-pointer px-2 text-[11px] font-semibold"
                              onClick={() => setDeletingCategory(category)}
                              type="button"
                              variant="destructive"
                            >
                              Xóa
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                {isSearching ? (
                  <p className="text-xs text-muted-foreground">Đang tìm kiếm danh mục...</p>
                ) : null}
                <div className="text-sm text-muted-foreground">
                  Nhấn nút Sửa ở danh sách để nạp dữ liệu vào form bên trái.
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
          deletingCategory
            ? `Danh mục "${deletingCategory.name}" sẽ được xóa mềm (active=false). Bạn có chắc muốn tiếp tục?`
            : ""
        }
        isLoading={isDeleting}
        onCancel={() => setDeletingCategory(null)}
        onConfirm={() => void handleDeleteCategory()}
        open={Boolean(deletingCategory)}
        title="Xác nhận xóa danh mục"
      />
    </StaffLayout>
  );
}
