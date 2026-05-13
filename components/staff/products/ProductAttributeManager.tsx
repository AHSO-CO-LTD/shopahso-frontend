"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  createProductAttribute,
  deleteProductAttribute,
  updateProductAttribute,
} from "@/lib/api/services/product-attributes.service";
import { generateAttributeCodePreview } from "@/lib/product/attribute-code";
import type {
  AttributeDataType,
  CreateProductAttributePayload,
  ProductAttributeDefinition,
} from "@/lib/product/types";

type ProductAttributeManagerProps = {
  productId: string;
  attributes: ProductAttributeDefinition[];
  onReload?: () => Promise<void>;
  mode?: "full" | "table";
  manageHref?: string;
};

type AttributeFormValue = {
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
  formValue: AttributeFormValue;
  isSubmitting: boolean;
  onChange: (nextValue: AttributeFormValue) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  open: boolean;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
};

const DEFAULT_FORM_VALUE: AttributeFormValue = {
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

function toPayload(formValue: AttributeFormValue): CreateProductAttributePayload | null {
  const sortOrder = Number(formValue.sortOrder);
  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    return null;
  }

  const name = formValue.name.trim();
  const code = formValue.code.trim();

  return {
    categoryTemplateId: formValue.categoryTemplateId.trim() || undefined,
    name,
    code,
    dataType: formValue.dataType,
    unit: formValue.unit.trim() || undefined,
    isFilterable: formValue.isFilterable,
    isSearchable: formValue.isSearchable,
    isRequired: formValue.isRequired,
    sortOrder,
    active: formValue.active,
  };
}

function toFormValue(attribute: ProductAttributeDefinition): AttributeFormValue {
  return {
    categoryTemplateId: attribute.categoryTemplateId ?? "",
    name: attribute.name,
    code: attribute.code,
    dataType: attribute.dataType,
    unit: attribute.unit ?? "",
    isFilterable: attribute.isFilterable,
    isSearchable: attribute.isSearchable,
    isRequired: attribute.isRequired,
    sortOrder: String(attribute.sortOrder),
    active: attribute.active,
  };
}

function QuickCreateAttributeModal({
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/25 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-3xl border border-border bg-background">
        <div className="border-b border-border px-6 py-5">
          <h3 className="text-xl font-black tracking-tight">Thêm thông số mới</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Mặc định chỉ cần nhập tên, loại dữ liệu và đơn vị. Các trường còn lại nằm trong phần nâng cao.
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
                    placeholder="Để trống để backend tự sinh"
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

          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            <Button className="h-10 cursor-pointer px-4 text-sm font-semibold" disabled={isSubmitting} onClick={onClose} type="button" variant="outline">
              Hủy
            </Button>
            <Button className="h-10 cursor-pointer px-4 text-sm font-semibold" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Đang lưu..." : "Thêm thông số"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

export default function ProductAttributeManager({
  productId,
  attributes,
  onReload,
  mode = "full",
  manageHref,
}: ProductAttributeManagerProps) {
  const [formValue, setFormValue] = useState<AttributeFormValue>(DEFAULT_FORM_VALUE);
  const [editingAttributeId, setEditingAttributeId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingAttributeId, setDeletingAttributeId] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoAttributeIds, setAutoAttributeIds] = useState<Record<string, boolean>>({});
  const [isQuickCreateModalOpen, setIsQuickCreateModalOpen] = useState(false);
  const [quickFormValue, setQuickFormValue] = useState<AttributeFormValue>(DEFAULT_FORM_VALUE);
  const [showQuickAdvanced, setShowQuickAdvanced] = useState(false);
  const [isQuickSubmitting, setIsQuickSubmitting] = useState(false);

  const sortedAttributes = useMemo(
    () =>
      [...attributes].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "vi"),
      ),
    [attributes],
  );

  const codePreview = useMemo(
    () => generateAttributeCodePreview(formValue.code.trim() || formValue.name.trim()),
    [formValue.code, formValue.name],
  );

  const resetForm = () => {
    setFormValue(DEFAULT_FORM_VALUE);
    setEditingAttributeId("");
    setShowAdvanced(false);
  };

  const closeQuickCreateModal = () => {
    if (isQuickSubmitting) {
      return;
    }
    setIsQuickCreateModalOpen(false);
    setQuickFormValue(DEFAULT_FORM_VALUE);
    setShowQuickAdvanced(false);
  };

  const openQuickCreateModal = () => {
    if (!onReload) {
      toast.error("Thiếu hàm tải lại dữ liệu thông số.");
      return;
    }
    setIsQuickCreateModalOpen(true);
  };

  const handleQuickCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!quickFormValue.name.trim()) {
      toast.warning("Vui lòng nhập tên thông số.");
      return;
    }

    const payload = toPayload(quickFormValue);
    if (!payload) {
      toast.warning("Thứ tự hiển thị phải là số nguyên lớn hơn hoặc bằng 0.");
      return;
    }

    if (!onReload) {
      toast.error("Thiếu hàm tải lại dữ liệu thông số.");
      return;
    }

    const isAutoCode = !quickFormValue.code.trim();

    setIsQuickSubmitting(true);
    const loadingId = toast.loading("Đang tạo thông số...");
    try {
      const created = await createProductAttribute(productId, payload);
      if (isAutoCode) {
        setAutoAttributeIds((current) => ({ ...current, [created.id]: true }));
      }
      await onReload();
      toast.success("Tạo thông số thành công.", { id: loadingId });
      setIsQuickCreateModalOpen(false);
      setQuickFormValue(DEFAULT_FORM_VALUE);
      setShowQuickAdvanced(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo thông số.", {
        id: loadingId,
      });
    } finally {
      setIsQuickSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formValue.name.trim()) {
      toast.warning("Vui lòng nhập tên thông số.");
      return;
    }

    const payload = toPayload(formValue);
    if (!payload) {
      toast.warning("Thứ tự hiển thị phải là số nguyên lớn hơn hoặc bằng 0.");
      return;
    }

    if (!onReload) {
      toast.error("Thiếu hàm tải lại dữ liệu thông số.");
      return;
    }

    const isAutoCode = !formValue.code.trim();

    setIsSubmitting(true);
    const loadingId = toast.loading(
      editingAttributeId ? "Đang cập nhật thông số..." : "Đang tạo thông số...",
    );

    try {
      if (editingAttributeId) {
        const updated = await updateProductAttribute(editingAttributeId, payload);
        setAutoAttributeIds((current) => {
          if (isAutoCode) {
            return { ...current, [updated.id]: true };
          }
          const next = { ...current };
          delete next[updated.id];
          return next;
        });
        toast.success("Cập nhật thông số thành công.", { id: loadingId });
      } else {
        const created = await createProductAttribute(productId, payload);
        if (isAutoCode) {
          setAutoAttributeIds((current) => ({ ...current, [created.id]: true }));
        }
        toast.success("Tạo thông số thành công.", { id: loadingId });
      }
      await onReload();
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu thông số.", {
        id: loadingId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (attributeId: string) => {
    if (!onReload) {
      toast.error("Thiếu hàm tải lại dữ liệu thông số.");
      return;
    }

    setDeletingAttributeId(attributeId);
    const loadingId = toast.loading("Đang ẩn thông số...");
    try {
      await deleteProductAttribute(attributeId);
      toast.success("Đã ẩn thông số.", { id: loadingId });
      if (editingAttributeId === attributeId) {
        resetForm();
      }
      await onReload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể ẩn thông số.", {
        id: loadingId,
      });
    } finally {
      setDeletingAttributeId("");
    }
  };

  return (
    <section className="space-y-4 border border-border p-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">Thông số kỹ thuật của sản phẩm</h3>
        <p className="text-xs text-muted-foreground">
          Tạo hoặc cập nhật định nghĩa thông số để áp dụng cho toàn bộ biến thể của sản phẩm.
        </p>
        {mode === "table" ? (
          <div className="flex flex-wrap gap-2 pt-2">
            <Button className="h-9 cursor-pointer px-3 text-xs font-semibold" onClick={openQuickCreateModal} type="button">
              Thêm thông số mới
            </Button>
            {manageHref ? (
              <Button asChild className="h-9 cursor-pointer px-3 text-xs font-semibold" variant="outline">
                <Link href={manageHref}>Quản lý thông số</Link>
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {mode === "full" ? (
        <form className="space-y-3 border border-border p-3" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-2 text-sm md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Tên thông số *
              </span>
              <input
                className="h-10 border border-border bg-background px-3 outline-none focus:border-primary"
                onChange={(event) =>
                  setFormValue((current) => ({ ...current, name: event.target.value }))
                }
                required
                value={formValue.name}
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Kiểu dữ liệu
              </span>
              <select
                className="h-10 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary"
                onChange={(event) =>
                  setFormValue((current) => ({
                    ...current,
                    dataType: event.target.value as AttributeDataType,
                  }))
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
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Đơn vị
              </span>
              <input
                className="h-10 border border-border bg-background px-3 outline-none focus:border-primary"
                onChange={(event) =>
                  setFormValue((current) => ({ ...current, unit: event.target.value }))
                }
                value={formValue.unit}
              />
            </label>
          </div>

          <div className="flex justify-end">
            <Button
              className="h-8 cursor-pointer px-3 text-xs font-semibold"
              onClick={() => setShowAdvanced((current) => !current)}
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
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Code (không bắt buộc)
                  </span>
                  <input
                    className="h-10 border border-border bg-background px-3 outline-none focus:border-primary"
                    onChange={(event) =>
                      setFormValue((current) => ({ ...current, code: event.target.value }))
                    }
                    placeholder="Để trống sẽ gửi chuỗi rỗng"
                    value={formValue.code}
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Xem trước code
                  </span>
                  <input
                    className="h-10 border border-border bg-muted/20 px-3 text-muted-foreground outline-none"
                    disabled
                    value={codePreview}
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-2 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Thứ tự hiển thị
                  </span>
                  <input
                    className="h-10 border border-border bg-background px-3 outline-none focus:border-primary"
                    min={0}
                    onChange={(event) =>
                      setFormValue((current) => ({ ...current, sortOrder: event.target.value }))
                    }
                    step="1"
                    type="number"
                    value={formValue.sortOrder}
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Trạng thái
                  </span>
                  <select
                    className="h-10 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary"
                    onChange={(event) =>
                      setFormValue((current) => ({
                        ...current,
                        active: event.target.value === "true",
                      }))
                    }
                    value={String(formValue.active)}
                  >
                    <option value="true">Hoạt động</option>
                    <option value="false">Tạm ẩn</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Category template ID
                  </span>
                  <input
                    className="h-10 border border-border bg-background px-3 outline-none focus:border-primary"
                    onChange={(event) =>
                      setFormValue((current) => ({
                        ...current,
                        categoryTemplateId: event.target.value,
                      }))
                    }
                    placeholder="Không bắt buộc"
                    value={formValue.categoryTemplateId}
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-2 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Dùng để lọc
                  </span>
                  <select
                    className="h-10 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary"
                    onChange={(event) =>
                      setFormValue((current) => ({
                        ...current,
                        isFilterable: event.target.value === "true",
                      }))
                    }
                    value={String(formValue.isFilterable)}
                  >
                    <option value="true">Có</option>
                    <option value="false">Không</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Dùng để tìm kiếm
                  </span>
                  <select
                    className="h-10 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary"
                    onChange={(event) =>
                      setFormValue((current) => ({
                        ...current,
                        isSearchable: event.target.value === "true",
                      }))
                    }
                    value={String(formValue.isSearchable)}
                  >
                    <option value="true">Có</option>
                    <option value="false">Không</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Bắt buộc
                  </span>
                  <select
                    className="h-10 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary"
                    onChange={(event) =>
                      setFormValue((current) => ({
                        ...current,
                        isRequired: event.target.value === "true",
                      }))
                    }
                    value={String(formValue.isRequired)}
                  >
                    <option value="true">Có</option>
                    <option value="false">Không</option>
                  </select>
                </label>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            {editingAttributeId ? (
              <Button
                className="h-9 cursor-pointer px-3 text-xs font-semibold"
                disabled={isSubmitting}
                onClick={resetForm}
                type="button"
                variant="outline"
              >
                Hủy chỉnh sửa
              </Button>
            ) : null}
            <Button className="h-9 cursor-pointer px-3 text-xs font-semibold" disabled={isSubmitting} type="submit">
              {isSubmitting
                ? "Đang lưu..."
                : editingAttributeId
                  ? "Cập nhật thông số"
                  : "Thêm thông số"}
            </Button>
          </div>
        </form>
      ) : null}

      {sortedAttributes.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sản phẩm chưa có định nghĩa thông số nào.</p>
      ) : (
        <div className="space-y-2">
          {sortedAttributes.map((attribute) => (
            <div
              key={attribute.id}
              className="grid grid-cols-[minmax(0,1fr)_116px] items-center gap-3 border border-border p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {attribute.name} ({attribute.code}){" "}
                  {autoAttributeIds[attribute.id] ? (
                    <span className="ml-2 border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]">
                      Auto
                    </span>
                  ) : null}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  Kiểu: {attribute.dataType} | Đơn vị: {attribute.unit ?? "N/A"} | Thứ tự: {attribute.sortOrder}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  Filter: {attribute.isFilterable ? "Có" : "Không"} | Search: {attribute.isSearchable ? "Có" : "Không"} | Required: {attribute.isRequired ? "Có" : "Không"} | {attribute.active ? "Hoạt động" : "Tạm ẩn"}
                </p>
              </div>
              {mode === "full" ? (
                <div className="flex justify-end gap-2">
                  <Button
                    className="h-8 cursor-pointer px-2 text-[11px] font-semibold"
                    onClick={() => {
                      setEditingAttributeId(attribute.id);
                      setFormValue(toFormValue(attribute));
                      setShowAdvanced(true);
                    }}
                    type="button"
                    variant="outline"
                  >
                    Sửa
                  </Button>
                  <Button
                    className="h-8 cursor-pointer px-2 text-[11px] font-semibold"
                    disabled={deletingAttributeId === attribute.id}
                    onClick={() => void handleDelete(attribute.id)}
                    type="button"
                    variant="destructive"
                  >
                    {deletingAttributeId === attribute.id ? "..." : "Ẩn"}
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <QuickCreateAttributeModal
        formValue={quickFormValue}
        isSubmitting={isQuickSubmitting}
        onChange={setQuickFormValue}
        onClose={closeQuickCreateModal}
        onSubmit={handleQuickCreateSubmit}
        onToggleAdvanced={() => setShowQuickAdvanced((current) => !current)}
        open={isQuickCreateModalOpen}
        showAdvanced={showQuickAdvanced}
      />
    </section>
  );
}
