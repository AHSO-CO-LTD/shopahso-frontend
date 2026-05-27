"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import RichDescriptionEditor from "@/components/staff/products/RichDescriptionEditor";
import { generateSlug } from "@/lib/api/services/slug.service";
import type { Brand } from "@/lib/brand/types";
import type { BackofficeCategory } from "@/lib/category/types";
import type { CreateProductPayload, ProductStatus } from "@/lib/product/types";

export type ProductFormValue = {
  categoryId: string;
  brandId: string;
  name: string;
  slug: string;
  description: string;
  datasheetUrl: string;
  status: ProductStatus;
  active: boolean;
};

type ProductFormProps = {
  categories: BackofficeCategory[];
  brands: Brand[];
  defaultValue?: ProductFormValue;
  imageUploadSlot?: ReactNode;
  isDeleting?: boolean;
  isEditMode?: boolean;
  isSubmitting: boolean;
  onCancelEdit?: () => void;
  onDelete?: () => void;
  onSubmit: (payload: CreateProductPayload) => Promise<void>;
  productId?: string;
};

export const DEFAULT_PRODUCT_FORM_VALUE: ProductFormValue = {
  categoryId: "",
  brandId: "",
  name: "",
  slug: "",
  description: "",
  datasheetUrl: "",
  status: "DRAFT",
  active: true,
};

type SubmitIntent = "default" | "draft" | "publish";

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizePayload(formValue: ProductFormValue, submitIntent: SubmitIntent): CreateProductPayload {
  const normalizedStatus: ProductStatus =
    submitIntent === "draft" ? "DRAFT" : submitIntent === "publish" ? "PUBLISHED" : formValue.status;

  return {
    categoryId: formValue.categoryId,
    brandId: formValue.brandId || undefined,
    name: formValue.name.trim(),
    slug: formValue.slug.trim(),
    description: formValue.description.trim() || undefined,
    datasheetUrl: formValue.datasheetUrl.trim() || undefined,
    status: normalizedStatus,
    active: formValue.active,
  };
}

function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h3 className="text-base font-black tracking-tight">{title}</h3>
      {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
    </div>
  );
}

function FieldLabel({ children, required = false }: { children: string; required?: boolean }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      {children}
      {required ? " *" : ""}
    </span>
  );
}

export default function ProductForm({
  categories,
  brands,
  defaultValue = DEFAULT_PRODUCT_FORM_VALUE,
  imageUploadSlot,
  isDeleting = false,
  isEditMode = false,
  isSubmitting,
  onCancelEdit,
  onDelete,
  onSubmit,
  productId,
}: ProductFormProps) {
  const [formValue, setFormValue] = useState<ProductFormValue>(defaultValue);
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);
  const [isSlugEditedManually, setIsSlugEditedManually] = useState(false);
  const [submitIntent, setSubmitIntent] = useState<SubmitIntent>("default");

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

    await onSubmit(normalizePayload(formValue, submitIntent));

    if (!isEditMode) {
      setFormValue(DEFAULT_PRODUCT_FORM_VALUE);
      toast.success("Đã reset form tạo sản phẩm.");
    }

    setIsSlugEditedManually(false);
    setSubmitIntent("default");
  };

  const handleResetCreateForm = () => {
    setFormValue(DEFAULT_PRODUCT_FORM_VALUE);
    setIsSlugEditedManually(false);
    setSubmitIntent("default");
    toast.success("Đã hủy thay đổi tạm thời.");
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {!isEditMode ? (
        <div className="flex flex-wrap items-center justify-end gap-2 border border-border bg-muted/10 px-4 py-3">
          <Button
            className="h-9 cursor-pointer px-3 text-xs font-semibold"
            disabled={isSubmitting || isDeleting}
            onClick={handleResetCreateForm}
            type="button"
            variant="outline"
          >
            Hủy nháp
          </Button>
          <Button
            className="h-9 cursor-pointer px-3 text-xs font-semibold"
            disabled={isSubmitting || isDeleting}
            onClick={() => setSubmitIntent("draft")}
            type="submit"
            variant="outline"
          >
            {isSubmitting && submitIntent === "draft" ? "Đang lưu nháp..." : "Lưu nháp"}
          </Button>
          <Button
            className="h-9 cursor-pointer px-3 text-xs font-semibold"
            disabled={isSubmitting || isDeleting}
            onClick={() => setSubmitIntent("publish")}
            type="submit"
          >
            {isSubmitting && submitIntent === "publish" ? "Đang xuất bản..." : "Xuất bản"}
          </Button>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-5">
          <article className="space-y-4 border border-border p-4 md:p-5">
            <SectionTitle title="Chi tiết sản phẩm" description="Thông tin cốt lõi để tạo sản phẩm và hiển thị catalog." />

            <label className="grid gap-2 text-sm">
              <FieldLabel required>Tên sản phẩm</FieldLabel>
              <input
                className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
                onBlur={() => void handleGenerateSlug(formValue.name)}
                onChange={(event) => setFormValue((current) => ({ ...current, name: event.target.value }))}
                required
                type="text"
                value={formValue.name}
              />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <FieldLabel required>Slug</FieldLabel>
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
              </label>

              <div className="grid content-end">
                <Button
                  className="h-11 w-full cursor-pointer px-3 text-sm font-semibold"
                  disabled={!formValue.name.trim() || isGeneratingSlug || isSubmitting}
                  onClick={() => void handleGenerateSlug(formValue.name, true)}
                  type="button"
                  variant="outline"
                >
                  {isGeneratingSlug ? "Đang tạo slug..." : "Tạo lại slug"}
                </Button>
              </div>
            </div>

            <div className="grid gap-2 text-sm">
              <FieldLabel>Mô tả HTML (không bắt buộc)</FieldLabel>
              <RichDescriptionEditor
                onChange={(description) => setFormValue((current) => ({ ...current, description }))}
                productId={productId}
                value={formValue.description}
              />
            </div>
          </article>

          {imageUploadSlot}
        </section>

        <aside className="space-y-5">
          <article className="space-y-4 border border-border p-4 md:p-5">
            <SectionTitle title="Phân loại" description="Gán danh mục, thương hiệu và tài liệu kỹ thuật." />

            <label className="grid gap-2 text-sm">
              <FieldLabel required>Danh mục</FieldLabel>
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
              <FieldLabel>Thương hiệu</FieldLabel>
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
              <FieldLabel>Datasheet URL</FieldLabel>
              <input
                className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
                onChange={(event) => setFormValue((current) => ({ ...current, datasheetUrl: event.target.value }))}
                placeholder="https://example.com/datasheet.pdf"
                type="url"
                value={formValue.datasheetUrl}
              />
            </label>
          </article>

          <article className="space-y-4 border border-border p-4 md:p-5">
            <SectionTitle title="Trạng thái" description="DRAFT để nháp, PUBLISHED để xuất bản ra catalog." />

            <label className="grid gap-2 text-sm">
              <FieldLabel required>Trạng thái xuất bản</FieldLabel>
              <select
                className="h-11 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary"
                onChange={(event) =>
                  setFormValue((current) => ({
                    ...current,
                    status: event.target.value as ProductStatus,
                  }))
                }
                value={formValue.status}
              >
                <option value="DRAFT">DRAFT</option>
                <option value="PUBLISHED">PUBLISHED</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <FieldLabel>Kích hoạt</FieldLabel>
              <select
                className="h-11 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary"
                onChange={(event) => setFormValue((current) => ({ ...current, active: event.target.value === "true" }))}
                value={String(formValue.active)}
              >
                <option value="true">Hoạt động</option>
                <option value="false">Tạm ẩn</option>
              </select>
            </label>
          </article>
        </aside>
      </div>

      {isEditMode ? (
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          {onCancelEdit ? (
            <Button
              className="h-10 cursor-pointer px-4 text-sm font-semibold"
              onClick={onCancelEdit}
              type="button"
              variant="outline"
            >
              Hủy chọn
            </Button>
          ) : null}
          {onDelete ? (
            <Button
              className="h-10 cursor-pointer px-4 text-sm font-semibold"
              disabled={isSubmitting}
              onClick={onDelete}
              type="button"
              variant="destructive"
            >
              {isDeleting ? "Đang ẩn..." : "Ẩn sản phẩm"}
            </Button>
          ) : null}
          <Button className="h-10 cursor-pointer px-4 text-sm font-semibold" disabled={isSubmitting || isDeleting} type="submit">
            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
