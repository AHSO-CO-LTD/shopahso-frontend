"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateSlug } from "@/lib/api/services/slug.service";
import type { CreateBrandPayload } from "@/lib/brand/types";

export type BrandFormValue = {
  name: string;
  slug: string;
  bannerUrl: string;
  active: boolean;
};

type BrandFormProps = {
  defaultValue?: BrandFormValue;
  extraContentBeforeActions?: ReactNode;
  isDeleting?: boolean;
  isEditMode?: boolean;
  isSubmitting: boolean;
  onCancelEdit?: () => void;
  onDelete?: () => void;
  onSubmit: (payload: CreateBrandPayload) => Promise<void>;
};

export const DEFAULT_BRAND_FORM_VALUE: BrandFormValue = {
  name: "",
  slug: "",
  bannerUrl: "",
  active: true,
};

function normalizePayload(formValue: BrandFormValue): CreateBrandPayload {
  return {
    name: formValue.name.trim(),
    slug: formValue.slug.trim(),
    ...(formValue.bannerUrl.trim() ? { bannerUrl: formValue.bannerUrl.trim() } : {}),
    active: formValue.active,
  };
}

function isValidHttpUrl(value: string) {
  if (!value.trim()) {
    return true;
  }

  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function BrandForm({
  defaultValue = DEFAULT_BRAND_FORM_VALUE,
  extraContentBeforeActions,
  isDeleting = false,
  isEditMode = false,
  isSubmitting,
  onCancelEdit,
  onDelete,
  onSubmit,
}: BrandFormProps) {
  const [formValue, setFormValue] = useState<BrandFormValue>(defaultValue);
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

    if (!isValidHttpUrl(formValue.bannerUrl)) {
      toast.warning("Banner URL phải là đường dẫn hợp lệ bắt đầu bằng http:// hoặc https://.");
      return;
    }

    await onSubmit(normalizePayload(formValue));

    if (!isEditMode) {
      setFormValue(DEFAULT_BRAND_FORM_VALUE);
    }

    setIsSlugEditedManually(false);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm">
        <span className="font-semibold">Tên thương hiệu</span>
        <input
          className="h-11 border border-border bg-background px-3 outline-none focus:border-primary disabled:opacity-60"
          disabled={isSubmitting}
          onBlur={() => void handleGenerateSlug(formValue.name)}
          onChange={(event) => setFormValue((current) => ({ ...current, name: event.target.value }))}
          placeholder="Ví dụ: Schneider"
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
          placeholder="schneider"
          required
          type="text"
          value={formValue.slug}
        />
      </div>

      <label className="grid gap-2 text-sm">
        <span className="font-semibold">Banner URL</span>
        <input
          className="h-11 border border-border bg-background px-3 outline-none focus:border-primary disabled:opacity-60"
          disabled={isSubmitting}
          onChange={(event) => setFormValue((current) => ({ ...current, bannerUrl: event.target.value }))}
          placeholder="https://..."
          type="url"
          value={formValue.bannerUrl}
        />
        <span className="text-xs text-muted-foreground">Có thể để trống nếu dùng upload banner bên dưới.</span>
      </label>

      <label className="grid gap-2 text-sm">
        <span className="font-semibold">Trạng thái</span>
        <select
          className="h-11 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          onChange={(event) => setFormValue((current) => ({ ...current, active: event.target.value === "true" }))}
          value={String(formValue.active)}
        >
          <option value="true">Hoạt động</option>
          <option value="false">Tạm ẩn</option>
        </select>
      </label>

      {extraContentBeforeActions}

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
                  {isDeleting ? "Đang ẩn..." : "Ẩn thương hiệu"}
                </Button>
              ) : null}
            </>
          ) : null}
          <Button className="h-11 min-w-40 text-sm font-semibold" disabled={isSubmitting || isDeleting} type="submit">
            {isSubmitting ? (isEditMode ? "Đang lưu..." : "Đang tạo...") : isEditMode ? "Lưu thay đổi" : "Tạo thương hiệu"}
          </Button>
        </div>
      </div>
    </form>
  );
}
