"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateSlug } from "@/lib/api/services/slug.service";
import type { CreateVariantPayload, ProductSummary } from "@/lib/product/types";

export type VariantFormValue = {
  sku: string;
  manufacturerPartNumber: string;
  name: string;
  slug: string;
  price: string;
  stockQuantity: string;
  unit: string;
  minOrderQuantity: string;
  viewCount: string;
  orderCount: string;
  specSnapshot: string;
  active: boolean;
};

type VariantFormProps = {
  defaultValue: VariantFormValue;
  isEditMode: boolean;
  isSubmitting: boolean;
  isDeleting?: boolean;
  product: ProductSummary | null;
  onCancelEdit?: () => void;
  onDelete?: () => void;
  onSubmit: (payload: CreateVariantPayload) => Promise<void>;
};

export const DEFAULT_VARIANT_FORM_VALUE: VariantFormValue = {
  sku: "",
  manufacturerPartNumber: "",
  name: "",
  slug: "",
  price: "0",
  stockQuantity: "0",
  unit: "",
  minOrderQuantity: "1",
  viewCount: "0",
  orderCount: "0",
  specSnapshot: "{}",
  active: true,
};

function parseNonNegativeInt(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function parsePositiveInt(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
}

export default function VariantForm({
  defaultValue,
  isEditMode,
  isSubmitting,
  isDeleting = false,
  product,
  onCancelEdit,
  onDelete,
  onSubmit,
}: VariantFormProps) {
  const [formValue, setFormValue] = useState<VariantFormValue>(defaultValue);
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

    if (!product) {
      toast.warning("Vui lòng chọn sản phẩm trước khi tạo biến thể.");
      return;
    }

    const price = parseNonNegativeInt(formValue.price);
    const stockQuantity = parseNonNegativeInt(formValue.stockQuantity);
    const minOrderQuantity = parsePositiveInt(formValue.minOrderQuantity);
    const viewCount = parseNonNegativeInt(formValue.viewCount);
    const orderCount = parseNonNegativeInt(formValue.orderCount);

    if ([price, stockQuantity, minOrderQuantity, viewCount, orderCount].some((value) => value === null)) {
      toast.warning("Giá, tồn kho, số lượng tối thiểu, lượt xem và lượt mua phải là số hợp lệ.");
      return;
    }

    let specSnapshot: Record<string, unknown> = {};
    try {
      specSnapshot = formValue.specSnapshot.trim() ? JSON.parse(formValue.specSnapshot) : {};
    } catch {
      toast.warning("Spec snapshot phải là JSON hợp lệ.");
      return;
    }

    await onSubmit({
      productId: product.id,
      sku: formValue.sku.trim(),
      manufacturerPartNumber: formValue.manufacturerPartNumber.trim() || undefined,
      name: formValue.name.trim(),
      slug: formValue.slug.trim(),
      price: price!,
      stockQuantity: stockQuantity!,
      unit: formValue.unit.trim() || undefined,
      minOrderQuantity: minOrderQuantity!,
      score: 0,
      viewCount: viewCount!,
      orderCount: orderCount!,
      specSnapshot,
      active: formValue.active,
    });

    if (!isEditMode) {
      setFormValue(DEFAULT_VARIANT_FORM_VALUE);
    }

    setIsSlugEditedManually(false);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm">
        <span className="font-semibold">SKU</span>
        <input className="h-10 border border-border px-3 outline-none focus:border-primary" onChange={(event) => setFormValue((current) => ({ ...current, sku: event.target.value }))} required type="text" value={formValue.sku} />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="font-semibold">Tên biến thể</span>
        <input className="h-10 border border-border px-3 outline-none focus:border-primary" onBlur={() => void handleGenerateSlug(formValue.name)} onChange={(event) => setFormValue((current) => ({ ...current, name: event.target.value }))} required type="text" value={formValue.name} />
      </label>
      <div className="grid gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Slug</span>
          <Button className="h-7 px-2 text-xs font-semibold" disabled={!formValue.name.trim() || isGeneratingSlug} onClick={() => void handleGenerateSlug(formValue.name, true)} type="button" variant="outline">
            {isGeneratingSlug ? "..." : "Tạo lại"}
          </Button>
        </div>
        <input className="h-10 border border-border px-3 outline-none focus:border-primary" onChange={(event) => { setIsSlugEditedManually(true); setFormValue((current) => ({ ...current, slug: event.target.value })); }} required type="text" value={formValue.slug} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-2 text-sm"><span className="font-semibold">Giá</span><input className="h-10 border border-border px-3 outline-none focus:border-primary" onChange={(event) => setFormValue((current) => ({ ...current, price: event.target.value }))} required type="number" value={formValue.price} /></label>
        <label className="grid gap-2 text-sm"><span className="font-semibold">Tồn kho</span><input className="h-10 border border-border px-3 outline-none focus:border-primary" onChange={(event) => setFormValue((current) => ({ ...current, stockQuantity: event.target.value }))} required type="number" value={formValue.stockQuantity} /></label>
        <label className="grid gap-2 text-sm"><span className="font-semibold">Tối thiểu</span><input className="h-10 border border-border px-3 outline-none focus:border-primary" onChange={(event) => setFormValue((current) => ({ ...current, minOrderQuantity: event.target.value }))} required type="number" value={formValue.minOrderQuantity} /></label>
      </div>
      <label className="grid gap-2 text-sm"><span className="font-semibold">Thông số JSON</span><textarea className="min-h-16 border border-border px-3 py-2 outline-none focus:border-primary" onChange={(event) => setFormValue((current) => ({ ...current, specSnapshot: event.target.value }))} value={formValue.specSnapshot} /></label>
      <div className="flex justify-end gap-2">
        {isEditMode && onCancelEdit ? <Button className="h-10 px-3 text-sm font-semibold" onClick={onCancelEdit} type="button" variant="outline">Hủy</Button> : null}
        {isEditMode && onDelete ? <Button className="h-10 px-3 text-sm font-semibold" onClick={onDelete} type="button" variant="destructive">{isDeleting ? "Đang ẩn..." : "Ẩn biến thể"}</Button> : null}
        <Button className="h-10 px-3 text-sm font-semibold" disabled={isSubmitting || isDeleting} type="submit">
          {isSubmitting ? (isEditMode ? "Đang lưu..." : "Đang tạo...") : isEditMode ? "Lưu biến thể" : "Tạo biến thể"}
        </Button>
      </div>
    </form>
  );
}
