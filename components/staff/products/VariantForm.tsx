"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { listCatalogCountries } from "@/lib/api/services/catalog-variants.service";
import { generateSlug } from "@/lib/api/services/slug.service";
import type { Country } from "@/lib/country/types";
import type { CreateVariantPayload, ProductSummary } from "@/lib/product/types";
import type { PricingStatus } from "@/lib/pricing-status";

export type VariantFormValue = {
  sku: string;
  manufacturerPartNumber: string;
  originCountryCode: string;
  name: string;
  slug: string;
  pricingStatus: PricingStatus;
  price: string;
  costPrice: string;
  salePrice: string;
  discountPercent: string;
  taxPercent: string;
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
  imageUploadSlot?: ReactNode;
  attributeValuesSlot?: ReactNode;
  isEditMode: boolean;
  isSubmitting: boolean;
  isDeleting?: boolean;
  product: ProductSummary | null;
  onDirtyChange?: (isDirty: boolean) => void;
  onCancelEdit?: () => void;
  onDelete?: () => void;
  onSubmit: (payload: CreateVariantPayload) => Promise<void>;
};

export const DEFAULT_VARIANT_FORM_VALUE: VariantFormValue = {
  sku: "",
  manufacturerPartNumber: "",
  originCountryCode: "",
  name: "",
  slug: "",
  pricingStatus: "HAS_PRICE",
  price: "",
  costPrice: "",
  salePrice: "",
  discountPercent: "",
  taxPercent: "",
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

function parseOptionalNonNegativeNumber(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function parseOptionalPercentage(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : null;
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

export default function VariantForm({
  defaultValue,
  imageUploadSlot,
  attributeValuesSlot,
  isEditMode,
  isSubmitting,
  isDeleting = false,
  product,
  onDirtyChange,
  onCancelEdit,
  onDelete,
  onSubmit,
}: VariantFormProps) {
  const [formValue, setFormValue] = useState<VariantFormValue>(defaultValue);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);
  const [isSlugEditedManually, setIsSlugEditedManually] = useState(false);

  const initialViewCount = parseNonNegativeInt(defaultValue.viewCount) ?? 0;
  const initialOrderCount = parseNonNegativeInt(defaultValue.orderCount) ?? 0;
  const isDirty = useMemo(
    () => JSON.stringify(formValue) !== JSON.stringify(defaultValue),
    [defaultValue, formValue],
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    let isMounted = true;

    async function loadCountries() {
      setIsLoadingCountries(true);
      try {
        const response = await listCatalogCountries();
        if (isMounted) {
          setCountries(response);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thể tải danh sách xuất xứ.");
      } finally {
        if (isMounted) {
          setIsLoadingCountries(false);
        }
      }
    }

    void loadCountries();

    return () => {
      isMounted = false;
    };
  }, []);

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

    const price = parseOptionalNonNegativeNumber(formValue.price);
    const costPrice = parseOptionalNonNegativeNumber(formValue.costPrice);
    const salePrice = parseOptionalNonNegativeNumber(formValue.salePrice);
    const discountPercent = parseOptionalPercentage(formValue.discountPercent);
    const taxPercent = parseOptionalPercentage(formValue.taxPercent);

    const stockQuantity = parseNonNegativeInt(formValue.stockQuantity);
    const minOrderQuantity = parsePositiveInt(formValue.minOrderQuantity);
    const parsedViewCount = parseNonNegativeInt(formValue.viewCount);
    const parsedOrderCount = parseNonNegativeInt(formValue.orderCount);

    if (formValue.pricingStatus === "HAS_PRICE" && (price === undefined || price === null)) {
      toast.warning("Giá bán là bắt buộc và phải là số không âm.");
      return;
    }

    if (price === null) {
      toast.warning("Giá bán phải là số không âm nếu được nhập.");
      return;
    }

    if (costPrice === null || salePrice === null) {
      toast.warning("Giá nhập và giá sau giảm phải là số không âm nếu được nhập.");
      return;
    }

    if (discountPercent === null || taxPercent === null) {
      toast.warning("Phần trăm giảm giá và thuế phải nằm trong khoảng 0 đến 100.");
      return;
    }

    if ([stockQuantity, minOrderQuantity].some((value) => value === null)) {
      toast.warning("Tồn kho và số lượng tối thiểu phải là số hợp lệ.");
      return;
    }

    const viewCount = parsedViewCount ?? initialViewCount;
    const orderCount = parsedOrderCount ?? initialOrderCount;
    let specSnapshot: Record<string, unknown> = {};
    try {
      specSnapshot = formValue.specSnapshot.trim() ? (JSON.parse(formValue.specSnapshot) as Record<string, unknown>) : {};
    } catch {
      specSnapshot = {};
    }

    await onSubmit({
      productId: product.id,
      sku: formValue.sku.trim(),
      manufacturerPartNumber: formValue.manufacturerPartNumber.trim() || undefined,
      originCountryCode: formValue.originCountryCode || undefined,
      name: formValue.name.trim(),
      slug: formValue.slug.trim(),
      price: price ?? 0,
      pricingStatus: formValue.pricingStatus,
      costPrice,
      salePrice,
      discountPercent,
      taxPercent,
      stockQuantity: stockQuantity!,
      unit: formValue.unit.trim() || undefined,
      minOrderQuantity: minOrderQuantity!,
      score: 0,
      viewCount,
      orderCount,
      specSnapshot,
      active: formValue.active,
    });

    if (!isEditMode) {
      setFormValue(DEFAULT_VARIANT_FORM_VALUE);
      toast.success("Đã reset form tạo biến thể.");
    }

    setIsSlugEditedManually(false);
  };

  const handleResetCreateForm = () => {
    setFormValue(DEFAULT_VARIANT_FORM_VALUE);
    setIsSlugEditedManually(false);
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
          <Button className="h-9 cursor-pointer px-3 text-xs font-semibold" disabled={isSubmitting || isDeleting} type="submit">
            {isSubmitting ? "Đang tạo..." : "Tạo biến thể"}
          </Button>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-5">
          <article className="space-y-4 border border-border p-4 md:p-5">
            <SectionTitle title="Chi tiết biến thể" description="Thông tin nhận diện biến thể và dữ liệu kỹ thuật nền." />

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <FieldLabel required>SKU</FieldLabel>
                <input
                  className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
                  onChange={(event) => setFormValue((current) => ({ ...current, sku: event.target.value }))}
                  required
                  type="text"
                  value={formValue.sku}
                />
              </label>
              <label className="grid gap-2 text-sm">
                <FieldLabel>Mã hãng sản xuất</FieldLabel>
                <input
                  className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
                  onChange={(event) =>
                    setFormValue((current) => ({
                      ...current,
                      manufacturerPartNumber: event.target.value,
                    }))
                  }
                  type="text"
                  value={formValue.manufacturerPartNumber}
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm">
              <FieldLabel>Xuất xứ</FieldLabel>
              <select
                className="h-11 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isLoadingCountries}
                onChange={(event) => setFormValue((current) => ({ ...current, originCountryCode: event.target.value }))}
                value={formValue.originCountryCode}
              >
                <option value="">{isLoadingCountries ? "Đang tải xuất xứ..." : "Chưa chọn xuất xứ"}</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.nameVi} ({country.code})
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <FieldLabel required>Tên biến thể</FieldLabel>
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

          </article>

          {imageUploadSlot}
          {attributeValuesSlot}
        </section>

        <aside className="space-y-5">
          <article className="space-y-4 border border-border p-4 md:p-5">
            <SectionTitle
              title="Giá bán và thuế"
              description="Chọn cần báo giá khi chưa công bố giá bán. Khi đó hệ thống ẩn giá và không cho thêm giỏ."
            />

            <label className="grid gap-2 text-sm">
              <FieldLabel>Trạng thái giá</FieldLabel>
              <select
                className="h-11 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary"
                onChange={(event) =>
                  setFormValue((current) => ({
                    ...current,
                    pricingStatus: event.target.value as PricingStatus,
                    price: event.target.value === "CONTACT_FOR_PRICE" && !current.price.trim() ? "0" : current.price,
                  }))
                }
                value={formValue.pricingStatus}
              >
                <option value="HAS_PRICE">Có giá</option>
                <option value="CONTACT_FOR_PRICE">Cần báo giá</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <FieldLabel required={formValue.pricingStatus === "HAS_PRICE"}>Giá bán</FieldLabel>
              <input
                className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
                min={0}
                onChange={(event) => setFormValue((current) => ({ ...current, price: event.target.value }))}
                required={formValue.pricingStatus === "HAS_PRICE"}
                step="0.01"
                type="number"
                value={formValue.price}
              />
            </label>

            <label className="grid gap-2 text-sm">
              <FieldLabel>Giá nhập</FieldLabel>
              <input
                className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
                min={0}
                onChange={(event) => setFormValue((current) => ({ ...current, costPrice: event.target.value }))}
                step="0.01"
                type="number"
                value={formValue.costPrice}
              />
            </label>

            <label className="grid gap-2 text-sm">
              <FieldLabel>Giá sau giảm</FieldLabel>
              <input
                className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
                min={0}
                onChange={(event) => setFormValue((current) => ({ ...current, salePrice: event.target.value }))}
                step="0.01"
                type="number"
                value={formValue.salePrice}
              />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <FieldLabel>% giảm giá</FieldLabel>
                <input
                  className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
                  max={100}
                  min={0}
                  onChange={(event) =>
                    setFormValue((current) => ({
                      ...current,
                      discountPercent: event.target.value,
                    }))
                  }
                  step="0.01"
                  type="number"
                  value={formValue.discountPercent}
                />
              </label>
              <label className="grid gap-2 text-sm">
                <FieldLabel>% thuế</FieldLabel>
                <input
                  className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
                  max={100}
                  min={0}
                  onChange={(event) => setFormValue((current) => ({ ...current, taxPercent: event.target.value }))}
                  step="0.01"
                  type="number"
                  value={formValue.taxPercent}
                />
              </label>
            </div>
          </article>

          <article className="space-y-4 border border-border p-4 md:p-5">
            <SectionTitle title="Tồn kho và trạng thái" description="Quản lý tồn kho, đơn vị và trạng thái hiển thị." />

            <div className="grid gap-3">
              <label className="grid gap-2 text-sm">
                <FieldLabel required>Tồn kho</FieldLabel>
                <input
                  className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
                  min={0}
                  onChange={(event) => setFormValue((current) => ({ ...current, stockQuantity: event.target.value }))}
                  required
                  step="1"
                  type="number"
                  value={formValue.stockQuantity}
                />
              </label>
              <label className="grid gap-2 text-sm">
                <FieldLabel required>Số lượng tối thiểu (MOQ)</FieldLabel>
                <input
                  className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
                  min={1}
                  onChange={(event) =>
                    setFormValue((current) => ({
                      ...current,
                      minOrderQuantity: event.target.value,
                    }))
                  }
                  required
                  step="1"
                  type="number"
                  value={formValue.minOrderQuantity}
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm">
              <FieldLabel>Đơn vị</FieldLabel>
              <input
                className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
                onChange={(event) => setFormValue((current) => ({ ...current, unit: event.target.value }))}
                placeholder="cái, bộ, chiếc..."
                type="text"
                value={formValue.unit}
              />
            </label>

            <label className="grid gap-2 text-sm">
              <FieldLabel>Trạng thái</FieldLabel>
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
              className="h-10 cursor-pointer px-3 text-sm font-semibold"
              onClick={onCancelEdit}
              type="button"
              variant="outline"
            >
              Hủy
            </Button>
          ) : null}
          {onDelete ? (
            <Button
              className="h-10 cursor-pointer px-3 text-sm font-semibold"
              disabled={isSubmitting}
              onClick={onDelete}
              type="button"
              variant="destructive"
            >
              {isDeleting ? "Đang ẩn..." : "Ẩn biến thể"}
            </Button>
          ) : null}
          <Button className="h-10 cursor-pointer px-3 text-sm font-semibold" disabled={isSubmitting || isDeleting} type="submit">
            {isSubmitting ? "Đang lưu..." : "Lưu biến thể"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
