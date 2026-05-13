"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createProductAttribute } from "@/lib/api/services/product-attributes.service";
import {
  listVariantAttributeValues,
  upsertVariantAttributeValues,
} from "@/lib/api/services/variant-attribute-values.service";
import { generateAttributeCodePreview } from "@/lib/product/attribute-code";
import type {
  AttributeDataType,
  CreateProductAttributePayload,
  ProductAttributeDefinition,
  UpsertVariantAttributeValuesPayload,
  VariantAttributeValue,
} from "@/lib/product/types";

type VariantAttributeValuesEditorProps = {
  variantId: string;
  productId: string;
  attributes: ProductAttributeDefinition[];
  onReloadAttributes?: () => Promise<void>;
  onDirtyChange?: (isDirty: boolean) => void;
};

export type VariantAttributeValuesEditorHandle = {
  buildPayload: () => UpsertVariantAttributeValuesPayload | null;
  submit: () => Promise<boolean>;
  markSaved: () => void;
};

type FormValueItem = {
  text: string;
  number: string;
  boolean: string;
  enum: string;
};

type QuickAttributeFormValue = {
  categoryTemplateId: string;
  name: string;
  code: string;
  dataType: AttributeDataType;
  unit: string;
  isFilterable: boolean;
  isSearchable: boolean;
  isRequired: boolean;
  sortOrder: string;
  active: boolean;
};

type QuickCreateModalProps = {
  formValue: QuickAttributeFormValue;
  isSubmitting: boolean;
  onChange: (nextValue: QuickAttributeFormValue) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  open: boolean;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
};

const DEFAULT_QUICK_ATTRIBUTE_FORM_VALUE: QuickAttributeFormValue = {
  categoryTemplateId: "",
  name: "",
  code: "",
  dataType: "TEXT",
  unit: "",
  isFilterable: true,
  isSearchable: true,
  isRequired: false,
  sortOrder: "0",
  active: true,
};

const EMPTY_FORM_VALUE: FormValueItem = {
  text: "",
  number: "",
  boolean: "",
  enum: "",
};

function getInitialValue(item?: VariantAttributeValue): FormValueItem {
  return {
    text: item?.valueText ?? "",
    number: item?.valueNumber != null ? String(item.valueNumber) : "",
    boolean: item?.valueBoolean == null ? "" : item.valueBoolean ? "true" : "false",
    enum: item?.valueEnum ?? "",
  };
}

function toQuickCreatePayload(formValue: QuickAttributeFormValue): CreateProductAttributePayload | null {
  const sortOrder = Number(formValue.sortOrder);
  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    return null;
  }

  return {
    categoryTemplateId: formValue.categoryTemplateId.trim() || undefined,
    name: formValue.name.trim(),
    code: formValue.code.trim(),
    dataType: formValue.dataType,
    unit: formValue.unit.trim() || undefined,
    isFilterable: formValue.isFilterable,
    isSearchable: formValue.isSearchable,
    isRequired: formValue.isRequired,
    sortOrder,
    active: formValue.active,
  };
}

function QuickCreateVariantAttributeModal({
  formValue,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
  open,
  showAdvanced,
  onToggleAdvanced,
}: QuickCreateModalProps) {
  const codePreview = useMemo(
    () => generateAttributeCodePreview(formValue.code.trim() || formValue.name.trim()),
    [formValue.code, formValue.name],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/25 px-4"
      role="dialog"
    >
      <div className="w-full max-w-3xl border border-border bg-background">
        <div className="border-b border-border px-6 py-5">
          <h3 className="text-xl font-black tracking-tight">Tạo nhanh thông số kỹ thuật mới</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Nhập cơ bản tên, loại dữ liệu, đơn vị. Trường còn lại nằm trong phần nâng cao.
          </p>
        </div>

        <form className="space-y-4 px-6 py-5" onSubmit={onSubmit}>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-2 text-sm md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Tên thông số *</span>
              <input
                className="h-10 border border-border bg-background px-3 outline-none focus:border-primary"
                onChange={(event) => onChange({ ...formValue, name: event.target.value })}
                required
                value={formValue.name}
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Kiểu dữ liệu</span>
              <select
                className="h-10 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary"
                onChange={(event) =>
                  onChange({
                    ...formValue,
                    dataType: event.target.value as AttributeDataType,
                  })
                }
                value={formValue.dataType}
              >
                <option value="TEXT">TEXT</option>
                <option value="NUMBER">NUMBER</option>
                <option value="BOOLEAN">BOOLEAN</option>
                <option value="ENUM">ENUM</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Đơn vị</span>
              <input
                className="h-10 border border-border bg-background px-3 outline-none focus:border-primary"
                onChange={(event) => onChange({ ...formValue, unit: event.target.value })}
                placeholder="Ví dụ: V, mm, kg"
                value={formValue.unit}
              />
            </label>
          </div>

          <div className="flex justify-end">
            <Button
              className="h-8 cursor-pointer px-3 text-xs font-semibold"
              onClick={onToggleAdvanced}
              type="button"
              variant="ghost"
            >
              {showAdvanced ? "Ẩn nâng cao" : "Mở nâng cao"}
            </Button>
          </div>

          {showAdvanced ? (
            <div className="space-y-3 border border-border p-3">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Code (không bắt buộc)</span>
                  <input
                    className="h-10 border border-border bg-background px-3 outline-none focus:border-primary"
                    onChange={(event) => onChange({ ...formValue, code: event.target.value })}
                    placeholder="Để trống sẽ gửi chuỗi rỗng"
                    value={formValue.code}
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Xem trước code</span>
                  <input className="h-10 border border-border bg-muted/20 px-3 text-muted-foreground outline-none" disabled value={codePreview} />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-2 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Thứ tự hiển thị</span>
                  <input
                    className="h-10 border border-border bg-background px-3 outline-none focus:border-primary"
                    min={0}
                    onChange={(event) => onChange({ ...formValue, sortOrder: event.target.value })}
                    step="1"
                    type="number"
                    value={formValue.sortOrder}
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Trạng thái</span>
                  <select
                    className="h-10 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary"
                    onChange={(event) => onChange({ ...formValue, active: event.target.value === "true" })}
                    value={String(formValue.active)}
                  >
                    <option value="true">Hoạt động</option>
                    <option value="false">Tạm ẩn</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Category template ID</span>
                  <input
                    className="h-10 border border-border bg-background px-3 outline-none focus:border-primary"
                    onChange={(event) => onChange({ ...formValue, categoryTemplateId: event.target.value })}
                    placeholder="Không bắt buộc"
                    value={formValue.categoryTemplateId}
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-2 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Dùng để lọc</span>
                  <select
                    className="h-10 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary"
                    onChange={(event) => onChange({ ...formValue, isFilterable: event.target.value === "true" })}
                    value={String(formValue.isFilterable)}
                  >
                    <option value="true">Có</option>
                    <option value="false">Không</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Dùng để tìm kiếm</span>
                  <select
                    className="h-10 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary"
                    onChange={(event) => onChange({ ...formValue, isSearchable: event.target.value === "true" })}
                    value={String(formValue.isSearchable)}
                  >
                    <option value="true">Có</option>
                    <option value="false">Không</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Bắt buộc</span>
                  <select
                    className="h-10 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary"
                    onChange={(event) => onChange({ ...formValue, isRequired: event.target.value === "true" })}
                    value={String(formValue.isRequired)}
                  >
                    <option value="true">Có</option>
                    <option value="false">Không</option>
                  </select>
                </label>
              </div>
            </div>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button className="h-10 cursor-pointer px-4 text-sm font-semibold" disabled={isSubmitting} onClick={onClose} type="button" variant="outline">
              Hủy
            </Button>
            <Button className="h-10 cursor-pointer px-4 text-sm font-semibold" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Đang tạo..." : "Tạo thông số"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

const VariantAttributeValuesEditor = forwardRef<VariantAttributeValuesEditorHandle, VariantAttributeValuesEditorProps>(
  function VariantAttributeValuesEditor(
    { variantId, productId, attributes, onReloadAttributes, onDirtyChange }: VariantAttributeValuesEditorProps,
    ref,
  ) {
    const [formValuesByCode, setFormValuesByCode] = useState<Record<string, FormValueItem>>({});
    const [initialValuesByCode, setInitialValuesByCode] = useState<Record<string, FormValueItem>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isQuickCreateModalOpen, setIsQuickCreateModalOpen] = useState(false);
    const [quickFormValue, setQuickFormValue] = useState<QuickAttributeFormValue>(
      DEFAULT_QUICK_ATTRIBUTE_FORM_VALUE,
    );
    const [showQuickAdvanced, setShowQuickAdvanced] = useState(false);
    const [isQuickSubmitting, setIsQuickSubmitting] = useState(false);

    const activeAttributes = useMemo(
      () =>
        attributes
          .filter((item) => item.active)
          .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "vi")),
      [attributes],
    );

    const isDirty = useMemo(() => {
      return activeAttributes.some((attribute) => {
        const current = formValuesByCode[attribute.code] ?? EMPTY_FORM_VALUE;
        const initial = initialValuesByCode[attribute.code] ?? EMPTY_FORM_VALUE;
        return (
          current.text !== initial.text
          || current.number !== initial.number
          || current.boolean !== initial.boolean
          || current.enum !== initial.enum
        );
      });
    }, [activeAttributes, formValuesByCode, initialValuesByCode]);

    useEffect(() => {
      onDirtyChange?.(isDirty);
    }, [isDirty, onDirtyChange]);

    const loadValues = useCallback(async () => {
      setIsLoading(true);
      try {
        const values = await listVariantAttributeValues(variantId);
        const mappedByCode = Object.fromEntries(
          activeAttributes.map((attribute) => {
            const currentValue = values.find(
              (item) =>
                item.productAttributeDefinitionId === attribute.id
                || item.code === attribute.code
                || item.definition?.id === attribute.id
                || item.definition?.code === attribute.code,
            );
            return [attribute.code, getInitialValue(currentValue)];
          }),
        );
        setFormValuesByCode(mappedByCode);
        setInitialValuesByCode(mappedByCode);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Không thể tải giá trị thông số.");
      } finally {
        setIsLoading(false);
      }
    }, [activeAttributes, variantId]);

    useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadValues();
    }, [loadValues]);

    const handleChange = (code: string, key: keyof FormValueItem, value: string) => {
      setFormValuesByCode((current) => ({
        ...current,
        [code]: {
          ...(current[code] ?? EMPTY_FORM_VALUE),
          [key]: value,
        },
      }));
    };

    const buildPayload = useCallback((): UpsertVariantAttributeValuesPayload | null => {
      const values: UpsertVariantAttributeValuesPayload["values"] = [];

      for (const attribute of activeAttributes) {
        const formValue = formValuesByCode[attribute.code] ?? EMPTY_FORM_VALUE;

        if (attribute.dataType === "TEXT") {
          const value = formValue.text.trim();
          if (!value && attribute.isRequired) {
            toast.warning(`Thông số "${attribute.name}" là bắt buộc.`);
            return null;
          }
          if (value) {
            values.push({
              productAttributeDefinitionId: attribute.id,
              code: attribute.code,
              valueText: value,
            });
          }
          continue;
        }

        if (attribute.dataType === "NUMBER") {
          const value = formValue.number.trim();
          if (!value && attribute.isRequired) {
            toast.warning(`Thông số "${attribute.name}" là bắt buộc.`);
            return null;
          }
          if (value) {
            const numericValue = Number(value);
            if (!Number.isFinite(numericValue)) {
              toast.warning(`Thông số "${attribute.name}" phải là số hợp lệ.`);
              return null;
            }
            values.push({
              productAttributeDefinitionId: attribute.id,
              code: attribute.code,
              valueNumber: numericValue,
            });
          }
          continue;
        }

        if (attribute.dataType === "BOOLEAN") {
          const value = formValue.boolean.trim();
          if (!value && attribute.isRequired) {
            toast.warning(`Thông số "${attribute.name}" là bắt buộc.`);
            return null;
          }
        if (value) {
          values.push({
            productAttributeDefinitionId: attribute.id,
            code: attribute.code,
            valueBoolean: value === "true",
          });
        }
        continue;
      }

        const enumValue = formValue.enum.trim();
        if (!enumValue && attribute.isRequired) {
          toast.warning(`Thông số "${attribute.name}" là bắt buộc.`);
          return null;
        }
      if (enumValue) {
        values.push({
          productAttributeDefinitionId: attribute.id,
          code: attribute.code,
          valueEnum: enumValue,
        });
      }
      }

      return { values };
    }, [activeAttributes, formValuesByCode]);

    const submit = useCallback(async () => {
      const payload = buildPayload();
      if (!payload) {
        return false;
      }

      const loadingId = toast.loading("Đang cập nhật thông số biến thể...");
      try {
        await upsertVariantAttributeValues(variantId, payload);
        toast.success("Cập nhật thông số biến thể thành công.", { id: loadingId });
        setInitialValuesByCode(() => {
          const next: Record<string, FormValueItem> = {};
          for (const attribute of activeAttributes) {
            next[attribute.code] = formValuesByCode[attribute.code] ?? EMPTY_FORM_VALUE;
          }
          return next;
        });
        return true;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thể cập nhật thông số biến thể.", {
          id: loadingId,
        });
        return false;
      }
    }, [activeAttributes, buildPayload, formValuesByCode, variantId]);

    const markSaved = useCallback(() => {
      setInitialValuesByCode(() => {
        const next: Record<string, FormValueItem> = {};
        for (const attribute of activeAttributes) {
          next[attribute.code] = formValuesByCode[attribute.code] ?? EMPTY_FORM_VALUE;
        }
        return next;
      });
    }, [activeAttributes, formValuesByCode]);

    useImperativeHandle(
      ref,
      () => ({
        buildPayload,
        submit,
        markSaved,
      }),
      [buildPayload, markSaved, submit],
    );

    const closeQuickModal = () => {
      if (isQuickSubmitting) {
        return;
      }
      setIsQuickCreateModalOpen(false);
      setQuickFormValue(DEFAULT_QUICK_ATTRIBUTE_FORM_VALUE);
      setShowQuickAdvanced(false);
    };

    const handleQuickCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!quickFormValue.name.trim()) {
        toast.warning("Vui lòng nhập tên thông số.");
        return;
      }

      const payload = toQuickCreatePayload(quickFormValue);
      if (!payload) {
        toast.warning("Thứ tự hiển thị phải là số nguyên lớn hơn hoặc bằng 0.");
        return;
      }

      setIsQuickSubmitting(true);
      const loadingId = toast.loading("Đang tạo thông số mới...");
      try {
        await createProductAttribute(productId, payload);
        if (onReloadAttributes) {
          await onReloadAttributes();
        }
        await loadValues();
        toast.success("Tạo thông số kỹ thuật thành công.", { id: loadingId });
        setIsQuickCreateModalOpen(false);
        setQuickFormValue(DEFAULT_QUICK_ATTRIBUTE_FORM_VALUE);
        setShowQuickAdvanced(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thể tạo thông số kỹ thuật.", {
          id: loadingId,
        });
      } finally {
        setIsQuickSubmitting(false);
      }
    };

    if (isLoading) {
      return (
        <section className="space-y-2 border border-border p-4">
          <h3 className="text-sm font-semibold">Thông số kỹ thuật biến thể</h3>
          <p className="text-xs text-muted-foreground">Đang tải dữ liệu thông số...</p>
        </section>
      );
    }

    return (
      <section className="space-y-4 border border-border p-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Thông số kỹ thuật biến thể</h3>
            <Button
              className="h-9 cursor-pointer px-3 text-xs font-semibold"
              onClick={() => setIsQuickCreateModalOpen(true)}
              type="button"
              variant="outline"
            >
              Tạo nhanh thông số mới
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Nhập giá trị trực tiếp theo form có sẵn để đồng bộ thông số kỹ thuật của biến thể.</p>
        </div>

        {errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}

        {activeAttributes.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sản phẩm chưa có thông số nào. Hãy tạo thông số mới rồi quay lại nhập giá trị.</p>
        ) : (
          <div className="overflow-x-auto border border-border">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="bg-muted/20 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="w-16 border-b border-border px-3 py-2 text-left">Thứ tự</th>
                  <th className="border-b border-border px-3 py-2 text-left">Tên thông số</th>
                  <th className="border-b border-border px-3 py-2 text-left">Nội dung</th>
                  <th className="w-28 border-b border-border px-3 py-2 text-left">Đơn vị</th>
                </tr>
              </thead>
              <tbody>
                {activeAttributes.map((attribute) => {
                  const value = formValuesByCode[attribute.code] ?? EMPTY_FORM_VALUE;

                  return (
                    <tr key={attribute.id} className="border-t border-border">
                      <td className="px-3 py-2 align-top text-xs text-muted-foreground">{attribute.sortOrder}</td>
                      <td className="px-3 py-2 align-top">
                        <p className="font-semibold">{attribute.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {attribute.code} | {attribute.dataType}
                          {attribute.isRequired ? " | Bắt buộc" : ""}
                        </p>
                      </td>
                      <td className="px-3 py-2 align-top">
                        {attribute.dataType === "TEXT" ? (
                          <input
                            className="h-10 w-full border border-border bg-background px-3 outline-none focus:border-primary"
                            onChange={(event) => handleChange(attribute.code, "text", event.target.value)}
                            value={value.text}
                          />
                        ) : null}

                        {attribute.dataType === "NUMBER" ? (
                          <input
                            className="h-10 w-full border border-border bg-background px-3 outline-none focus:border-primary"
                            onChange={(event) => handleChange(attribute.code, "number", event.target.value)}
                            step="0.01"
                            type="number"
                            value={value.number}
                          />
                        ) : null}

                        {attribute.dataType === "BOOLEAN" ? (
                          <select
                            className="h-10 w-full cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary"
                            onChange={(event) => handleChange(attribute.code, "boolean", event.target.value)}
                            value={value.boolean}
                          >
                            <option value="">Chưa chọn</option>
                            <option value="true">Đúng</option>
                            <option value="false">Sai</option>
                          </select>
                        ) : null}

                        {attribute.dataType === "ENUM" ? (
                          <input
                            className="h-10 w-full border border-border bg-background px-3 outline-none focus:border-primary"
                            onChange={(event) => handleChange(attribute.code, "enum", event.target.value)}
                            placeholder="Ví dụ: inox"
                            value={value.enum}
                          />
                        ) : null}
                      </td>
                      <td className="px-3 py-2 align-top text-xs text-muted-foreground">{attribute.unit ?? "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <QuickCreateVariantAttributeModal
          formValue={quickFormValue}
          isSubmitting={isQuickSubmitting}
          onChange={setQuickFormValue}
          onClose={closeQuickModal}
          onSubmit={handleQuickCreateSubmit}
          onToggleAdvanced={() => setShowQuickAdvanced((current) => !current)}
          open={isQuickCreateModalOpen}
          showAdvanced={showQuickAdvanced}
        />
      </section>
    );
  },
);

export default VariantAttributeValuesEditor;
