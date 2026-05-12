"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import ConfirmModal from "@/components/common/ConfirmModal";
import StaffLayout from "@/components/staff/StaffLayout";
import BrandForm, {
  DEFAULT_BRAND_FORM_VALUE,
  type BrandFormValue,
} from "@/components/staff/brands/BrandForm";
import { Button } from "@/components/ui/button";
import {
  createBackofficeBrand,
  deleteBackofficeBrand,
  listBackofficeBrands,
  updateBackofficeBrand,
} from "@/lib/api/services/brands.service";
import { ApiError } from "@/lib/api/client";
import type { Brand, CreateBrandPayload } from "@/lib/brand/types";

function sortBrands(items: Brand[]) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

export default function StaffBrandManager() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingBrandId, setEditingBrandId] = useState<string>("");
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");

  const loadBrands = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await listBackofficeBrands();
      setBrands(sortBrands(response));
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể tải danh sách thương hiệu.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBrands();
  }, [loadBrands]);

  const handleReloadBrands = () => {
    void loadBrands();
  };

  const selectedBrand = useMemo(
    () => brands.find((item) => item.id === editingBrandId) ?? null,
    [brands, editingBrandId],
  );

  const isEditMode = Boolean(selectedBrand);

  const brandFormDefaultValue: BrandFormValue = useMemo(() => {
    if (!selectedBrand) {
      return DEFAULT_BRAND_FORM_VALUE;
    }

    return {
      name: selectedBrand.name,
      slug: selectedBrand.slug,
      logoUrl: selectedBrand.logoUrl ?? "",
      active: selectedBrand.active,
    };
  }, [selectedBrand]);

  const filteredBrands = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) {
      return brands;
    }

    return brands.filter((brand) => {
      return (
        brand.name.toLowerCase().includes(keyword) ||
        brand.slug.toLowerCase().includes(keyword)
      );
    });
  }, [brands, searchKeyword]);

  const handleCreateBrand = async (payload: CreateBrandPayload) => {
    if (!payload.name?.trim() || !payload.slug?.trim()) {
      toast.warning("Vui lòng nhập đầy đủ tên thương hiệu và slug.");
      return;
    }

    setIsSubmitting(true);
    const loadingId = toast.loading("Đang tạo thương hiệu...");

    try {
      const createdBrand = await createBackofficeBrand(payload);
      setBrands((current) => sortBrands([...current, createdBrand]));
      toast.success("Tạo thương hiệu thành công.", { id: loadingId });
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message, { id: loadingId });
      } else {
        toast.error("Không thể tạo thương hiệu.", { id: loadingId });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitBrand = async (payload: CreateBrandPayload) => {
    if (isEditMode && selectedBrand) {
      setIsSubmitting(true);
      const loadingId = toast.loading("Đang cập nhật thương hiệu...");

      try {
        const updatedBrand = await updateBackofficeBrand(selectedBrand.id, payload);
        setBrands((current) =>
          sortBrands(current.map((item) => (item.id === updatedBrand.id ? updatedBrand : item))),
        );
        toast.success("Cập nhật thương hiệu thành công.", { id: loadingId });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thể cập nhật thương hiệu.", {
          id: loadingId,
        });
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    await handleCreateBrand(payload);
  };

  const handleDeleteBrand = async () => {
    if (!deletingBrand) {
      return;
    }

    setIsDeleting(true);
    const loadingId = toast.loading("Đang ẩn thương hiệu...");

    try {
      const deletedBrand = await deleteBackofficeBrand(deletingBrand.id);
      setBrands((current) =>
        sortBrands(current.map((item) => (item.id === deletedBrand.id ? deletedBrand : item))),
      );

      if (editingBrandId === deletedBrand.id) {
        setEditingBrandId("");
      }

      toast.success("Đã ẩn thương hiệu.", { id: loadingId });
      setDeletingBrand(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể ẩn thương hiệu.", {
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
                Thương hiệu
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Quản lý thương hiệu</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {isEditMode
                  ? `Đang chỉnh sửa: ${selectedBrand?.name ?? "Thương hiệu"}`
                  : "Nhập thông tin để tạo thương hiệu mới."}
              </p>
            </header>
            <div className="flex-1 px-6 py-6">
              <BrandForm
                key={selectedBrand?.id ?? "create-brand-form"}
                defaultValue={brandFormDefaultValue}
                isDeleting={isDeleting}
                isEditMode={isEditMode}
                isSubmitting={isSubmitting}
                onCancelEdit={() => setEditingBrandId("")}
                onDelete={() => {
                  if (selectedBrand) {
                    setDeletingBrand(selectedBrand);
                  }
                }}
                onSubmit={handleSubmitBrand}
              />
            </div>
          </article>

          <aside className="flex h-full min-h-0 flex-col border border-border bg-background">
            <header className="border-b border-border px-6 py-5">
              <h3 className="text-xl font-black tracking-tight">Danh sách thương hiệu</h3>
            </header>
            <div className="border-b border-border px-6 py-4">
              <label className="grid gap-2 text-sm">
                <span className="font-semibold">Tìm nhanh thương hiệu</span>
                <input
                  className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  placeholder="Nhập tên hoặc slug..."
                  type="text"
                  value={searchKeyword}
                />
              </label>
            </div>

            {isLoading ? (
              <div className="px-6 py-8 text-sm text-muted-foreground">Đang tải thương hiệu...</div>
            ) : errorMessage ? (
              <div className="space-y-4 px-6 py-8">
                <p className="text-sm text-destructive">{errorMessage}</p>
                <Button
                  className="h-10 cursor-pointer px-4 text-sm font-semibold"
                  onClick={handleReloadBrands}
                  type="button"
                  variant="outline"
                >
                  Tải lại
                </Button>
              </div>
            ) : filteredBrands.length === 0 ? (
              <div className="px-6 py-8 text-sm text-muted-foreground">
                {searchKeyword.trim()
                  ? "Không tìm thấy thương hiệu phù hợp với từ khóa."
                  : "Chưa có thương hiệu nào. Hãy tạo thương hiệu đầu tiên."}
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
                    {filteredBrands.map((brand) => {
                      const isEditing = editingBrandId === brand.id;

                      return (
                        <li
                          key={brand.id}
                          className="grid grid-cols-[minmax(0,1fr)_92px_86px] items-center gap-3 px-4 py-4"
                        >
                          <div className="min-w-0 space-y-1">
                            <p className="truncate font-semibold">{brand.name}</p>
                            <p className="truncate text-xs text-muted-foreground">slug: {brand.slug}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              logo: {brand.logoUrl || "Chưa có logo"}
                            </p>
                          </div>
                          <div className="text-center">
                            <span
                              className={[
                                "inline-flex min-w-20 justify-center border px-2 py-1 text-[11px] font-semibold",
                                brand.active
                                  ? "border-primary/40 bg-primary/10 text-primary"
                                  : "border-border bg-muted text-muted-foreground",
                              ].join(" ")}
                            >
                              {brand.active ? "Hoạt động" : "Tạm ẩn"}
                            </span>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              className="h-8 cursor-pointer px-2 text-[11px] font-semibold"
                              onClick={() => setEditingBrandId(brand.id)}
                              type="button"
                              variant={isEditing ? "default" : "outline"}
                            >
                              Sửa
                            </Button>
                            <Button
                              className="h-8 cursor-pointer px-2 text-[11px] font-semibold"
                              onClick={() => setDeletingBrand(brand)}
                              type="button"
                              variant="destructive"
                            >
                              Ẩn
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
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
        confirmText="Ẩn thương hiệu"
        description={
          deletingBrand
            ? `Thương hiệu "${deletingBrand.name}" sẽ được ẩn (active=false). Bạn có chắc muốn tiếp tục?`
            : ""
        }
        isLoading={isDeleting}
        onCancel={() => setDeletingBrand(null)}
        onConfirm={() => void handleDeleteBrand()}
        open={Boolean(deletingBrand)}
        title="Xác nhận ẩn thương hiệu"
      />
    </StaffLayout>
  );
}
