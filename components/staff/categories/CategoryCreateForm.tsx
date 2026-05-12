"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateSlug } from "@/lib/api/services/slug.service";
import type { BackofficeCategory, CreateBackofficeCategoryPayload } from "@/lib/category/types";
import CategoryParentSelect from "./CategoryParentSelect";

export type CategoryFormValue = {
  parentId: string;
  name: string;
  slug: string;
  description: string;
  active: boolean;
};

type CategoryCreateFormProps = {
  categories: BackofficeCategory[];
  defaultValue?: CategoryFormValue;
  isDeleting?: boolean;
  isEditMode?: boolean;
  isSubmitting: boolean;
  onCancelEdit?: () => void;
  onDelete?: () => void;
  onSubmit: (payload: CreateBackofficeCategoryPayload) => Promise<void>;
};

export const DEFAULT_CATEGORY_FORM_VALUE: CategoryFormValue = {
  parentId: "",
  name: "",
  slug: "",
  description: "",
  active: true,
};

function normalizePayload(formValue: CategoryFormValue): CreateBackofficeCategoryPayload {
  return {
    parentId: formValue.parentId || undefined,
    name: formValue.name.trim(),
    slug: formValue.slug.trim(),
    description: formValue.description.trim() || undefined,
    active: formValue.active,
    sortOrder: 0,
  };
}

export default function CategoryCreateForm({
  categories,
  defaultValue = DEFAULT_CATEGORY_FORM_VALUE,
  isDeleting = false,
  isEditMode = false,
  isSubmitting,
  onCancelEdit,
  onDelete,
  onSubmit,
}: CategoryCreateFormProps) {
  const [formValue, setFormValue] = useState<CategoryFormValue>(defaultValue);
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);
  const [isSlugEditedManually, setIsSlugEditedManually] = useState(false);

  const handleGenerateSlug = async (sourceText: string, force = false) => {
    if (!sourceText.trim()) {
      return;
    }

    if (!force && isSlugEditedManually) {
      return;
    }

    setIsGeneratingSlug(true);
    try {
      const response = await generateSlug({ text: sourceText.trim() });
      setFormValue((current) => ({ ...current, slug: response.slug }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo slug tự động.");
    } finally {
      setIsGeneratingSlug(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(normalizePayload(formValue));

    if (!isEditMode) {
      setFormValue(DEFAULT_CATEGORY_FORM_VALUE);
    }

    setIsSlugEditedManually(false);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <CategoryParentSelect
        categories={categories}
        disabled={isSubmitting}
        onChange={(value) => setFormValue((current) => ({ ...current, parentId: value }))}
        value={formValue.parentId}
      />

      <label className="grid gap-2 text-sm">
        <span className="font-semibold">Tên danh mục</span>
        <input
          className="h-11 border border-border bg-background px-3 outline-none focus:border-primary disabled:opacity-60"
          disabled={isSubmitting}
          onBlur={() => void handleGenerateSlug(formValue.name)}
          onChange={(event) => setFormValue((current) => ({ ...current, name: event.target.value }))}
          placeholder="Ví dụ: Thiết bị điện"
          required
          type="text"
          value={formValue.name}
        />
      </label>

      <div className="grid gap-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold">Slug</span>
          <Button
            className="h-9 cursor-pointer px-3 text-xs font-semibold"
            disabled={isSubmitting || isGeneratingSlug || !formValue.name.trim()}
            onClick={() => void handleGenerateSlug(formValue.name, true)}
            type="button"
            variant="outline"
          >
            {isGeneratingSlug ? "Đang tạo slug..." : "Tạo lại slug"}
          </Button>
        </div>
        <input
          className="h-11 border border-border bg-background px-3 outline-none focus:border-primary disabled:opacity-60"
          disabled={isSubmitting}
          onChange={(event) => {
            setIsSlugEditedManually(true);
            setFormValue((current) => ({ ...current, slug: event.target.value }));
          }}
          placeholder="vi-du-thiet-bi-dien"
          required
          type="text"
          value={formValue.slug}
        />
      </div>

      <label className="grid gap-2 text-sm">
        <span className="font-semibold">Mô tả</span>
        <textarea
          className="min-h-24 border border-border bg-background px-3 py-2 outline-none focus:border-primary disabled:opacity-60"
          disabled={isSubmitting}
          onChange={(event) =>
            setFormValue((current) => ({ ...current, description: event.target.value }))
          }
          placeholder="Mô tả ngắn cho danh mục (không bắt buộc)"
          value={formValue.description}
        />
      </label>

      <div className="grid gap-4">
        <label className="grid gap-2 text-sm">
          <span className="font-semibold">Trạng thái</span>
          <select
            className="h-11 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            onChange={(event) =>
              setFormValue((current) => ({ ...current, active: event.target.value === "true" }))
            }
            value={String(formValue.active)}
          >
            <option value="true">Hoạt động</option>
            <option value="false">Tạm ẩn</option>
          </select>
        </label>
      </div>

      <div className="flex justify-end">
        <div className="flex gap-2">
          {isEditMode ? (
            <>
              {onCancelEdit ? (
                <Button
                  className="h-11 cursor-pointer px-4 text-sm font-semibold"
                  disabled={isSubmitting || isDeleting}
                  onClick={onCancelEdit}
                  type="button"
                  variant="outline"
                >
                  Hủy chọn
                </Button>
              ) : null}
              {onDelete ? (
                <Button
                  className="h-11 cursor-pointer px-4 text-sm font-semibold"
                  disabled={isSubmitting || isDeleting}
                  onClick={onDelete}
                  type="button"
                  variant="destructive"
                >
                  {isDeleting ? "Đang xóa..." : "Xóa danh mục"}
                </Button>
              ) : null}
            </>
          ) : null}
          <Button
            className="h-11 min-w-40 text-sm font-semibold"
            disabled={isSubmitting || isDeleting}
            type="submit"
          >
            {isSubmitting
              ? isEditMode
                ? "Đang lưu..."
                : "Đang tạo..."
              : isEditMode
                ? "Lưu thay đổi"
                : "Tạo danh mục"}
          </Button>
        </div>
      </div>
    </form>
  );
}
