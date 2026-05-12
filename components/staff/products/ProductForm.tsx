"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateSlug } from "@/lib/api/services/slug.service";
import type { Brand } from "@/lib/brand/types";
import type { BackofficeCategory } from "@/lib/category/types";
import type { CreateProductPayload } from "@/lib/product/types";

export type ProductFormValue = {
  categoryId: string;
  brandId: string;
  name: string;
  slug: string;
  description: string;
  datasheetUrl: string;
  active: boolean;
};

type ProductFormProps = {
  categories: BackofficeCategory[];
  brands: Brand[];
  defaultValue?: ProductFormValue;
  isDeleting?: boolean;
  isEditMode?: boolean;
  isSubmitting: boolean;
  onCancelEdit?: () => void;
  onDelete?: () => void;
  onSubmit: (payload: CreateProductPayload) => Promise<void>;
};

export const DEFAULT_PRODUCT_FORM_VALUE: ProductFormValue = {
  categoryId: "",
  brandId: "",
  name: "",
  slug: "",
  description: "",
  datasheetUrl: "",
  active: true,
};

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizePayload(formValue: ProductFormValue): CreateProductPayload {
  return {
    categoryId: formValue.categoryId,
    brandId: formValue.brandId || undefined,
    name: formValue.name.trim(),
    slug: formValue.slug.trim(),
    description: formValue.description.trim() || undefined,
    datasheetUrl: formValue.datasheetUrl.trim() || undefined,
    active: formValue.active,
  };
}

export default function ProductForm({
  categories,
  brands,
  defaultValue = DEFAULT_PRODUCT_FORM_VALUE,
  isDeleting = false,
  isEditMode = false,
  isSubmitting,
  onCancelEdit,
  onDelete,
  onSubmit,
}: ProductFormProps) {
  const [formValue, setFormValue] = useState<ProductFormValue>(defaultValue);
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

    if (!formValue.categoryId) {
      toast.warning("Vui lòng chọn danh mục cho sản phẩm.");
      return;
    }

    if (formValue.datasheetUrl.trim() && !isValidHttpUrl(formValue.datasheetUrl.trim())) {
      toast.warning("Datasheet URL phải là đường dẫn hợp lệ, bắt đầu bằng http:// hoặc https://.");
      return;
    }

    await onSubmit(normalizePayload(formValue));

    if (!isEditMode) {
      setFormValue(DEFAULT_PRODUCT_FORM_VALUE);
    }

    setIsSlugEditedManually(false);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm">
        <span className="font-semibold">Danh mục</span>
        <select
          className="h-11 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary"
          onChange={(event) => setFormValue((current) => ({ ...current, categoryId: event.target.value }))}
          required
          value={formValue.categoryId}
        >
          <option value="">Chọn danh mục</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm">
        <span className="font-semibold">Thương hiệu</span>
        <select
          className="h-11 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary"
          onChange={(event) => setFormValue((current) => ({ ...current, brandId: event.target.value }))}
          value={formValue.brandId}
        >
          <option value="">Không gắn thương hiệu</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm">
        <span className="font-semibold">Tên sản phẩm</span>
        <input
          className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
          onBlur={() => void handleGenerateSlug(formValue.name)}
          onChange={(event) => setFormValue((current) => ({ ...current, name: event.target.value }))}
          required
          type="text"
          value={formValue.name}
        />
      </label>

      <div className="grid gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Slug</span>
          <Button
            className="h-8 px-3 text-xs font-semibold"
            disabled={!formValue.name.trim() || isGeneratingSlug || isSubmitting}
            onClick={() => void handleGenerateSlug(formValue.name, true)}
            type="button"
            variant="outline"
          >
            {isGeneratingSlug ? "Đang tạo..." : "Tạo lại slug"}
          </Button>
        </div>
        <input
          className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
          onChange={(event) => {
            setIsSlugEditedManually(true);
            setFormValue((current) => ({ ...current, slug: event.target.value }));
          }}
          required
          type="text"
          value={formValue.slug}
        />
      </div>

      <label className="grid gap-2 text-sm">
        <span className="font-semibold">Mô tả</span>
        <textarea
          className="min-h-20 border border-border bg-background px-3 py-2 outline-none focus:border-primary"
          onChange={(event) => setFormValue((current) => ({ ...current, description: event.target.value }))}
          value={formValue.description}
        />
      </label>

      <label className="grid gap-2 text-sm">
        <span className="font-semibold">Datasheet URL</span>
        <input
          className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
          onChange={(event) => setFormValue((current) => ({ ...current, datasheetUrl: event.target.value }))}
          type="url"
          value={formValue.datasheetUrl}
        />
      </label>

      <label className="grid gap-2 text-sm">
        <span className="font-semibold">Trạng thái</span>
        <select
          className="h-11 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary"
          onChange={(event) => setFormValue((current) => ({ ...current, active: event.target.value === "true" }))}
          value={String(formValue.active)}
        >
          <option value="true">Hoạt động</option>
          <option value="false">Tạm ẩn</option>
        </select>
      </label>

      <div className="flex justify-end gap-2">
        {isEditMode && onCancelEdit ? (
          <Button className="h-10 px-4 text-sm font-semibold" onClick={onCancelEdit} type="button" variant="outline">
            Hủy chọn
          </Button>
        ) : null}
        {isEditMode && onDelete ? (
          <Button className="h-10 px-4 text-sm font-semibold" onClick={onDelete} type="button" variant="destructive">
            {isDeleting ? "Đang ẩn..." : "Ẩn sản phẩm"}
          </Button>
        ) : null}
        <Button className="h-10 px-4 text-sm font-semibold" disabled={isSubmitting || isDeleting} type="submit">
          {isSubmitting ? (isEditMode ? "Đang lưu..." : "Đang tạo...") : isEditMode ? "Lưu thay đổi" : "Tạo sản phẩm"}
        </Button>
      </div>
    </form>
  );
}
