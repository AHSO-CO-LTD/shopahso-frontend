"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { FileUp, Plus, Save, Square, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  formatPromotionDiscount,
  getPromotionStatusLabel,
} from "@/components/promotions/promotion-display";
import {
  formatAdminMoney,
  makeLocalPromotionItemId,
  parsePositiveNumber,
  PROMOTION_DISCOUNT_OPTIONS,
  PROMOTION_STATUS_OPTIONS,
  toDateTimeLocalValue,
  toIsoDateTime,
  validateImageFile,
} from "@/components/staff/promotions/promotion-admin-utils";
import { Button } from "@/components/ui/button";
import { generateSlug } from "@/lib/api/services/slug.service";
import type { VariantSummary } from "@/lib/product/types";
import type {
  PromotionDetail,
  PromotionDiscountType,
  PromotionItemPayload,
  PromotionVariantUsage,
  UpdatePromotionPayload,
} from "@/lib/promotion/types";

type EditablePromotionItem = {
  discountType: PromotionDiscountType | "";
  discountValue: string;
  id: string;
  variant: VariantSummary;
  variantId: string;
};

type PromotionEditorValue = {
  bannerImageUrl: string;
  bannerLinkUrl: string;
  defaultDiscountType: PromotionDiscountType;
  defaultDiscountValue: string;
  description: string;
  endsAt: string;
  name: string;
  slug: string;
  startsAt: string;
  status: PromotionDetail["status"];
};

type PromotionEditorPanelProps = {
  isSubmitting: boolean;
  onDelete: (promotion: PromotionDetail) => void;
  onEnd: (promotion: PromotionDetail) => void;
  onSave: (payload: UpdatePromotionPayload, promotion: PromotionDetail | null, bannerFile?: File) => void;
  onUploadBanner: (promotion: PromotionDetail, file: File) => void;
  promotion: PromotionDetail | null;
  variantUsage: PromotionVariantUsage;
  variants: VariantSummary[];
};

const DEFAULT_EDITOR_VALUE: PromotionEditorValue = {
  bannerImageUrl: "",
  bannerLinkUrl: "",
  defaultDiscountType: "PERCENT",
  defaultDiscountValue: "10",
  description: "",
  endsAt: "",
  name: "",
  slug: "",
  startsAt: "",
  status: "DRAFT",
};

function mapPromotionToEditorValue(promotion: PromotionDetail | null): PromotionEditorValue {
  if (!promotion) {
    return DEFAULT_EDITOR_VALUE;
  }

  return {
    bannerImageUrl: promotion.bannerImageUrl ?? "",
    bannerLinkUrl: promotion.bannerLinkUrl ?? "",
    defaultDiscountType: promotion.defaultDiscountType,
    defaultDiscountValue: String(promotion.defaultDiscountValue ?? ""),
    description: promotion.description ?? "",
    endsAt: toDateTimeLocalValue(promotion.endsAt),
    name: promotion.name,
    slug: promotion.slug,
    startsAt: toDateTimeLocalValue(promotion.startsAt),
    status: promotion.status,
  };
}

function mapPromotionItems(promotion: PromotionDetail | null, variants: VariantSummary[]): EditablePromotionItem[] {
  if (!promotion) {
    return [];
  }

  return promotion.items.map((item) => {
    const matchedVariant = variants.find((variant) => variant.id === item.variantId);

    return {
      discountType: item.discountType ?? "",
      discountValue: item.discountValue == null ? "" : String(item.discountValue),
      id: item.id,
      variant: (matchedVariant ?? item.variant) as VariantSummary,
      variantId: item.variantId,
    };
  });
}

export default function PromotionEditorPanel({
  isSubmitting,
  onDelete,
  onEnd,
  onSave,
  onUploadBanner,
  promotion,
  variantUsage,
  variants,
}: PromotionEditorPanelProps) {
  const [formValue, setFormValue] = useState<PromotionEditorValue>(DEFAULT_EDITOR_VALUE);
  const [items, setItems] = useState<EditablePromotionItem[]>([]);
  const [variantSearch, setVariantSearch] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);
  const [isSlugEditedManually, setIsSlugEditedManually] = useState(false);
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFormValue(mapPromotionToEditorValue(promotion));
      setItems(mapPromotionItems(promotion, variants));
      setSelectedVariantId("");
      setVariantSearch("");
      setIsSlugEditedManually(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [promotion, variants]);

  const selectedBannerPreviewUrl = useMemo(
    () => (!promotion && selectedBannerFile ? URL.createObjectURL(selectedBannerFile) : ""),
    [promotion, selectedBannerFile],
  );

  useEffect(() => {
    return () => {
      if (selectedBannerPreviewUrl) {
        URL.revokeObjectURL(selectedBannerPreviewUrl);
      }
    };
  }, [selectedBannerPreviewUrl]);

  const selectedVariantIds = useMemo(() => new Set(items.map((item) => item.variantId)), [items]);
  const availableVariants = useMemo(() => {
    const keyword = variantSearch.trim().toLowerCase();

    return variants
      .filter((variant) => {
        if (selectedVariantIds.has(variant.id)) {
          return false;
        }

        const usage = variantUsage[variant.id];
        return !usage || usage.promotionId === promotion?.id;
      })
      .filter((variant) => {
        if (!keyword) {
          return true;
        }

        return (
          variant.name.toLowerCase().includes(keyword) ||
          variant.sku.toLowerCase().includes(keyword) ||
          variant.product?.name?.toLowerCase().includes(keyword)
        );
      })
      .slice(0, 40);
  }, [promotion?.id, selectedVariantIds, variantSearch, variantUsage, variants]);

  function updateFormValue(patch: Partial<PromotionEditorValue>) {
    setFormValue((current) => ({ ...current, ...patch }));
  }

  async function handleGenerateSlug(sourceText: string, force = false) {
    if (!sourceText.trim()) {
      toast.warning("Vui lòng nhập tên chương trình trước khi tạo slug.");
      return;
    }

    if (!force && isSlugEditedManually) {
      return;
    }

    setIsGeneratingSlug(true);
    const loadingToastId = force ? toast.loading("Đang tạo slug chương trình...") : undefined;

    try {
      const response = await generateSlug({ text: sourceText.trim() });
      setFormValue((current) => ({ ...current, slug: response.slug }));
      if (force) {
        toast.success("Đã tạo slug chương trình.", { id: loadingToastId });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo slug tự động.", { id: loadingToastId });
    } finally {
      setIsGeneratingSlug(false);
    }
  }

  function addSelectedVariant() {
    const variant = variants.find((item) => item.id === selectedVariantId);

    if (!variant) {
      toast.warning("Vui lòng chọn biến thể cần thêm vào chương trình.");
      return;
    }

    const usage = variantUsage[variant.id];
    if (usage && usage.promotionId !== promotion?.id) {
      toast.warning(`Biến thể này đã thuộc chương trình "${usage.promotionName}".`);
      setSelectedVariantId("");
      return;
    }

    setItems((current) => [
      ...current,
      {
        discountType: "",
        discountValue: "",
        id: makeLocalPromotionItemId(variant.id),
        variant,
        variantId: variant.id,
      },
    ]);
    setSelectedVariantId("");
  }

  function updateItem(id: string, patch: Partial<EditablePromotionItem>) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              ...patch,
              discountValue: patch.discountType === "" ? "" : patch.discountValue ?? item.discountValue,
            }
          : item,
      ),
    );
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function buildItemPayloads() {
    const payloadItems: PromotionItemPayload[] = [];

    for (const item of items) {
      if (!item.discountType) {
        payloadItems.push({ variantId: item.variantId });
        continue;
      }

      const discountValue = parsePositiveNumber(item.discountValue);

      if (discountValue === null) {
        toast.warning(`Vui lòng nhập mức giảm riêng cho SKU ${item.variant.sku}.`);
        return null;
      }

      if (item.discountType === "PERCENT" && discountValue > 100) {
        toast.warning(`Mức giảm riêng của SKU ${item.variant.sku} không được vượt quá 100%.`);
        return null;
      }

      payloadItems.push({
        discountType: item.discountType,
        discountValue,
        variantId: item.variantId,
      });
    }

    return payloadItems;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formValue.name.trim() || !formValue.slug.trim()) {
      toast.warning("Vui lòng nhập tên và slug chương trình.");
      return;
    }

    const defaultDiscountValue = parsePositiveNumber(formValue.defaultDiscountValue);
    if (defaultDiscountValue === null) {
      toast.warning("Mức giảm mặc định phải là số lớn hơn hoặc bằng 0.");
      return;
    }

    if (formValue.defaultDiscountType === "PERCENT" && defaultDiscountValue > 100) {
      toast.warning("Mức giảm phần trăm mặc định không được vượt quá 100%.");
      return;
    }

    const startsAt = toIsoDateTime(formValue.startsAt);
    const endsAt = toIsoDateTime(formValue.endsAt);

    if (startsAt && endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      toast.warning("Thời gian kết thúc phải lớn hơn thời gian bắt đầu.");
      return;
    }

    const payloadItems = buildItemPayloads();
    if (!payloadItems) {
      return;
    }

    onSave(
      {
        bannerImageUrl: formValue.bannerImageUrl.trim() || undefined,
        bannerLinkUrl: formValue.bannerLinkUrl.trim() || undefined,
        defaultDiscountType: formValue.defaultDiscountType,
        defaultDiscountValue,
        description: formValue.description.trim() || undefined,
        endsAt: endsAt ?? null,
        items: payloadItems,
        name: formValue.name.trim(),
        slug: formValue.slug.trim(),
        startsAt,
        status: formValue.status,
      },
      promotion,
      promotion ? undefined : selectedBannerFile ?? undefined,
    );
  }

  function handleFileChange(file: File | null) {
    if (!file) {
      return;
    }

    const fileError = validateImageFile(file);
    if (fileError) {
      toast.error(fileError);
      return;
    }

    if (!promotion) {
      setSelectedBannerFile(file);
      toast.info("Banner sẽ được upload sau khi tạo chương trình.");
      return;
    }

    onUploadBanner(promotion, file);
  }

  const bannerPreviewUrl = selectedBannerPreviewUrl || formValue.bannerImageUrl;
  const hasPendingBannerFile = !promotion && Boolean(selectedBannerFile);

  return (
    <section className="flex min-h-0 flex-col border border-border bg-background">
      <header className="border-b border-border px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {promotion ? "Chỉnh sửa" : "Tạo mới"}
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight">
              {promotion ? promotion.name : "Chương trình khuyến mãi"}
            </h2>
          </div>
          {promotion ? (
            <div className="flex flex-wrap gap-2">
              <Button
                className="h-9 rounded-none px-3 text-xs font-semibold"
                disabled={isSubmitting || promotion.status === "ENDED"}
                onClick={() => onEnd(promotion)}
                type="button"
                variant="outline"
              >
                <Square className="size-4" />
                Kết thúc ngay
              </Button>
              <Button
                className="h-9 rounded-none px-3 text-xs font-semibold"
                disabled={isSubmitting}
                onClick={() => onDelete(promotion)}
                type="button"
                variant="destructive"
              >
                <Trash2 className="size-4" />
                Xóa
              </Button>
            </div>
          ) : null}
        </div>
      </header>

      <form className="min-h-0 flex-1 overflow-y-auto" onSubmit={handleSubmit}>
        <div className="grid gap-5 p-5">
          <section className="grid gap-4 lg:grid-cols-2">
            <TextField
              label="Tên chương trình"
              onBlur={() => void handleGenerateSlug(formValue.name)}
              onChange={(value) => updateFormValue({ name: value })}
              required
              value={formValue.name}
            />
            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">Slug</span>
                <Button
                  className="h-9 cursor-pointer rounded-none px-3 text-xs font-semibold"
                  disabled={isSubmitting || isGeneratingSlug || !formValue.name.trim()}
                  onClick={() => void handleGenerateSlug(formValue.name, true)}
                  type="button"
                  variant="outline"
                >
                  {isGeneratingSlug ? "Đang tạo slug..." : "Tạo lại slug"}
                </Button>
              </div>
              <input
                className="input-no-spin h-10 border border-border bg-background px-3 outline-none transition-colors hover:border-primary focus:border-primary"
                onChange={(event) => {
                  setIsSlugEditedManually(true);
                  updateFormValue({ slug: event.target.value });
                }}
                required
                type="text"
                value={formValue.slug}
              />
            </div>
            <label className="grid gap-2 text-sm lg:col-span-2">
              <span className="font-semibold">Mô tả</span>
              <textarea
                className="min-h-24 resize-y border border-border bg-background px-3 py-2 outline-none transition-colors hover:border-primary focus:border-primary"
                onChange={(event) => updateFormValue({ description: event.target.value })}
                value={formValue.description}
              />
            </label>
            <TextField
              label="Banner image URL"
              onChange={(value) => updateFormValue({ bannerImageUrl: value })}
              value={formValue.bannerImageUrl}
            />
            <TextField
              label="Banner link URL"
              onChange={(value) => updateFormValue({ bannerLinkUrl: value })}
              placeholder="/khuyen-mai/summer-sale"
              value={formValue.bannerLinkUrl}
            />
          </section>

          <section className="grid gap-4 border border-border p-4 lg:grid-cols-4">
            <SelectField
              label="Loại giảm mặc định"
              onChange={(value) => updateFormValue({ defaultDiscountType: value as PromotionDiscountType })}
              options={PROMOTION_DISCOUNT_OPTIONS.map((option) => ({
                label: option === "PERCENT" ? "Phần trăm" : "Số tiền cố định",
                value: option,
              }))}
              value={formValue.defaultDiscountType}
            />
            <TextField
              label="Mức giảm"
              min={0}
              onChange={(value) => updateFormValue({ defaultDiscountValue: value })}
              type="number"
              value={formValue.defaultDiscountValue}
            />
            <SelectField
              label="Trạng thái"
              onChange={(value) => updateFormValue({ status: value as PromotionDetail["status"] })}
              options={PROMOTION_STATUS_OPTIONS.map((status) => ({
                label: getPromotionStatusLabel(status),
                value: status,
              }))}
              value={formValue.status}
            />
            <div className="border border-border bg-muted/20 px-3 py-2 text-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Preview
              </p>
              <p className="mt-1 font-black">
                {formatPromotionDiscount(formValue.defaultDiscountType, formValue.defaultDiscountValue)}
              </p>
            </div>
            <TextField
              label="Bắt đầu"
              onChange={(value) => updateFormValue({ startsAt: value })}
              type="datetime-local"
              value={formValue.startsAt}
            />
            <TextField
              label="Kết thúc"
              onChange={(value) => updateFormValue({ endsAt: value })}
              type="datetime-local"
              value={formValue.endsAt}
            />
          </section>

          <section className="border border-border">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <h3 className="font-black tracking-tight">Banner chương trình</h3>
                <p className="mt-1 text-xs text-muted-foreground">File hình ảnh tối đa 8MB.</p>
              </div>
              <label className="inline-flex h-10 cursor-pointer items-center gap-2 border border-border px-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary">
                <FileUp className="size-4" />
                Upload banner
                <input
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    handleFileChange(event.currentTarget.files?.[0] ?? null);
                    event.currentTarget.value = "";
                  }}
                  type="file"
                />
              </label>
            </div>
            {bannerPreviewUrl ? (
              <div className="bg-muted/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="Banner chương trình" className="max-h-64 w-full object-cover" src={bannerPreviewUrl} />
                {hasPendingBannerFile ? (
                  <p className="border-t border-border px-4 py-2 text-xs font-semibold text-muted-foreground">
                    Banner đã chọn sẽ được upload khi lưu chương trình.
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="p-4 text-sm text-muted-foreground">Chưa có banner cho chương trình này.</p>
            )}
          </section>

          <section className="border border-border">
            <div className="border-b border-border px-4 py-3">
              <h3 className="font-black tracking-tight">Biến thể áp dụng</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Nếu không đặt override, biến thể sẽ dùng mức giảm mặc định của chương trình.
              </p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                Biến thể đã thuộc chương trình khuyến mãi khác sẽ không hiển thị trong danh sách chọn.
              </p>
            </div>

            <div className="grid gap-3 border-b border-border p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <TextField
                label="Tìm biến thể"
                onChange={setVariantSearch}
                placeholder="SKU, tên biến thể hoặc sản phẩm"
                value={variantSearch}
              />
              <SelectField
                label="Biến thể"
                onChange={setSelectedVariantId}
                options={availableVariants.map((variant) => ({
                  label: `${variant.sku} | ${variant.name}`,
                  value: variant.id,
                }))}
                placeholder="Chọn biến thể"
                value={selectedVariantId}
              />
              <div className="flex items-end">
                <Button className="h-10 rounded-none px-3 font-semibold" onClick={addSelectedVariant} type="button" variant="outline">
                  <Plus className="size-4" />
                  Thêm
                </Button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">Chưa chọn biến thể cho chương trình.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] border-collapse text-sm">
                  <thead className="bg-muted/20 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    <tr>
                      <th className="border-b border-border px-3 py-2 text-left">SKU</th>
                      <th className="border-b border-border px-3 py-2 text-left">Biến thể</th>
                      <th className="border-b border-border px-3 py-2 text-left">Giá gốc</th>
                      <th className="border-b border-border px-3 py-2 text-left">Override</th>
                      <th className="border-b border-border px-3 py-2 text-left">Mức giảm riêng</th>
                      <th className="border-b border-border px-3 py-2 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr className="border-b border-border last:border-b-0" key={item.id}>
                        <td className="px-3 py-3 font-mono text-xs font-semibold">{item.variant.sku}</td>
                        <td className="min-w-64 px-3 py-3">
                          <p className="font-semibold">{item.variant.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{item.variant.product?.name ?? "Chưa có sản phẩm"}</p>
                        </td>
                        <td className="px-3 py-3 font-semibold">{formatAdminMoney(item.variant.price)}</td>
                        <td className="px-3 py-3">
                          <select
                            className="h-9 w-full cursor-pointer border border-border bg-background px-2 outline-none hover:border-primary focus:border-primary"
                            onChange={(event) => updateItem(item.id, { discountType: event.target.value as PromotionDiscountType | "" })}
                            value={item.discountType}
                          >
                            <option value="">Dùng mặc định</option>
                            <option value="PERCENT">Phần trăm</option>
                            <option value="FIXED_AMOUNT">Số tiền cố định</option>
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          <input
                            className="input-no-spin h-9 w-full border border-border bg-background px-2 outline-none disabled:bg-muted/30"
                            disabled={!item.discountType}
                            min={0}
                            onChange={(event) => updateItem(item.id, { discountValue: event.target.value })}
                            type="number"
                            value={item.discountValue}
                          />
                        </td>
                        <td className="px-3 py-3 text-right">
                          <Button
                            className="size-9 rounded-none px-0"
                            onClick={() => removeItem(item.id)}
                            type="button"
                            variant="destructive"
                          >
                            <X className="size-4" />
                            <span className="sr-only">Xóa biến thể</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <footer className="sticky bottom-0 flex flex-wrap items-center justify-end gap-3 border-t border-border bg-background px-5 py-4">
          <Button className="h-11 rounded-none px-5 font-black" disabled={isSubmitting} type="submit">
            <Save className="size-4" />
            {isSubmitting ? "Đang lưu..." : promotion ? "Lưu chương trình" : "Tạo chương trình"}
          </Button>
        </footer>
      </form>
    </section>
  );
}

function TextField({
  label,
  min,
  onBlur,
  onChange,
  placeholder,
  required = false,
  type = "text",
  value,
}: {
  label: string;
  min?: number;
  onBlur?: () => void;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-semibold">{label}</span>
      <input
        className="input-no-spin h-10 border border-border bg-background px-3 outline-none transition-colors hover:border-primary focus:border-primary"
        min={min}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
    </label>
  );
}

function SelectField({
  label,
  onChange,
  options,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-semibold">{label}</span>
      <select
        className="h-10 cursor-pointer border border-border bg-background px-3 outline-none transition-colors hover:border-primary focus:border-primary"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
