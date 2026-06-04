"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, FileUp, ImagePlus, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ConfirmModal from "@/components/common/ConfirmModal";
import { BANNER_PLACEMENTS, getBannerPlacementLabel } from "@/components/staff/banners/banner-display";
import { validateImageFile } from "@/components/staff/promotions/promotion-admin-utils";
import { Button } from "@/components/ui/button";
import {
  createBackofficeBanner,
  deleteBackofficeBanner,
  listBackofficeBanners,
  updateBackofficeBanner,
  uploadBackofficeBannerImage,
} from "@/lib/api/services/banners.service";
import { formatBannerStandard, getBannerStandard } from "@/lib/banner/banner-standards";
import type { Banner, BannerPlacement, CreateBannerPayload } from "@/lib/banner/types";

type BannerFilters = {
  active: "" | "true" | "false";
  placement: BannerPlacement | "";
};

type BannerFormValue = {
  active: boolean;
  imageUrl: string;
  linkUrl: string;
  placement: BannerPlacement;
  sortOrder: string;
};

type BannerImageInspection = {
  height: number;
  warningMessage: string | null;
  width: number;
};

const DEFAULT_FORM_VALUE: BannerFormValue = {
  active: true,
  imageUrl: "",
  linkUrl: "",
  placement: "HOMEPAGE",
  sortOrder: "0",
};

function mapBannerToFormValue(banner: Banner | null): BannerFormValue {
  if (!banner) {
    return DEFAULT_FORM_VALUE;
  }

  return {
    active: banner.active,
    imageUrl: banner.imageUrl ?? "",
    linkUrl: banner.linkUrl ?? "",
    placement: banner.placement,
    sortOrder: String(banner.sortOrder ?? 0),
  };
}

function sortBanners(items: Banner[]) {
  return [...items].sort((a, b) => a.placement.localeCompare(b.placement) || a.sortOrder - b.sortOrder);
}

function inspectBannerImage(file: File, placement: BannerPlacement) {
  return new Promise<BannerImageInspection>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      const standard = getBannerStandard(placement);
      const ratio = width / height;
      const ratioDelta = Math.abs(ratio - standard.aspectRatio);
      const isExactSize = width === standard.width && height === standard.height;
      const hasStandardRatio = ratioDelta <= 0.01;
      const warningMessage = isExactSize
        ? null
        : hasStandardRatio
          ? `Ảnh đang có kích thước ${width} x ${height}px. Chuẩn đề xuất là ${formatBannerStandard(placement)}.`
          : `Ảnh đang có kích thước ${width} x ${height}px, tỷ lệ không khớp chuẩn ${formatBannerStandard(placement)}. Banner vẫn hiển thị đầy đủ nhưng có thể có khoảng trống.`;

      URL.revokeObjectURL(objectUrl);
      resolve({ height, warningMessage, width });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Không thể đọc kích thước ảnh banner."));
    };

    image.src = objectUrl;
  });
}

export default function StaffBannerManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [selectedBannerId, setSelectedBannerId] = useState("");
  const [filters, setFilters] = useState<BannerFilters>({ active: "", placement: "" });
  const [formValue, setFormValue] = useState<BannerFormValue>(DEFAULT_FORM_VALUE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageWarningMessage, setImageWarningMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const selectedBanner = useMemo(
    () => banners.find((banner) => banner.id === selectedBannerId) ?? null,
    [banners, selectedBannerId],
  );
  const selectedImagePreviewUrl = useMemo(
    () => (selectedImageFile ? URL.createObjectURL(selectedImageFile) : ""),
    [selectedImageFile],
  );
  const currentBannerStandard = getBannerStandard(formValue.placement);

  const loadBanners = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await listBackofficeBanners({
        active: filters.active ? filters.active === "true" : undefined,
        placement: filters.placement || undefined,
      });
      setBanners(sortBanners(response));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải danh sách banner.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [filters.active, filters.placement]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadBanners();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadBanners]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFormValue(mapBannerToFormValue(selectedBanner));
      setSelectedImageFile(null);
      setImageWarningMessage(null);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [selectedBanner]);

  useEffect(() => {
    return () => {
      if (selectedImagePreviewUrl) {
        URL.revokeObjectURL(selectedImagePreviewUrl);
      }
    };
  }, [selectedImagePreviewUrl]);

  function syncBanner(banner: Banner) {
    setBanners((current) =>
      sortBanners(
        current.some((item) => item.id === banner.id)
          ? current.map((item) => (item.id === banner.id ? banner : item))
          : [banner, ...current],
      ),
    );
    setSelectedBannerId(banner.id);
  }

  function updateFormValue(patch: Partial<BannerFormValue>) {
    setFormValue((current) => ({ ...current, ...patch }));
  }

  async function prepareImageFile(file: File) {
    const fileError = validateImageFile(file);
    if (fileError) {
      setImageWarningMessage(null);
      toast.error(fileError);
      return false;
    }

    try {
      const inspection = await inspectBannerImage(file, formValue.placement);
      setImageWarningMessage(inspection.warningMessage);
      if (inspection.warningMessage) {
        toast.warning(inspection.warningMessage);
      }
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể kiểm tra kích thước ảnh banner.";
      setImageWarningMessage(message);
      toast.error(message);
      return false;
    }
  }

  async function handleFileChange(file: File | null) {
    if (!file || !(await prepareImageFile(file))) {
      return;
    }

    if (!selectedBanner) {
      setSelectedImageFile(file);
      toast.info("Ảnh sẽ được upload sau khi bạn tạo banner.");
      return;
    }

    setIsSubmitting(true);
    const loadingToastId = toast.loading("Đang cập nhật ảnh banner...");

    try {
      const nextBanner = await uploadBackofficeBannerImage(selectedBanner.id, file);
      syncBanner(nextBanner);
      setSelectedImageFile(null);
      setImageWarningMessage(null);
      toast.success("Đã cập nhật ảnh banner", { id: loadingToastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể upload ảnh banner.", { id: loadingToastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const sortOrder = Number(formValue.sortOrder);
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      toast.warning("Thứ tự banner phải là số nguyên lớn hơn hoặc bằng 0.");
      return;
    }

    const payload: CreateBannerPayload = {
      active: formValue.active,
      imageUrl: formValue.imageUrl.trim() || undefined,
      linkUrl: formValue.linkUrl.trim() || undefined,
      placement: formValue.placement,
      sortOrder,
    };

    setIsSubmitting(true);
    const loadingToastId = toast.loading(selectedBanner ? "Đang cập nhật banner..." : "Đang tạo banner...");

    try {
      const savedBanner = selectedBanner
        ? await updateBackofficeBanner(selectedBanner.id, payload)
        : await createBackofficeBanner(payload);
      const nextBanner = selectedImageFile
        ? await uploadBackofficeBannerImage(savedBanner.id, selectedImageFile)
        : savedBanner;

      syncBanner(nextBanner);
      setSelectedImageFile(null);
      setImageWarningMessage(null);
      toast.success(selectedBanner ? "Đã cập nhật banner" : "Đã tạo banner", { id: loadingToastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu banner.", { id: loadingToastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(banner: Banner) {
    setIsSubmitting(true);
    const loadingToastId = toast.loading("Đang cập nhật banner...");

    try {
      const nextBanner = await updateBackofficeBanner(banner.id, { active: !banner.active });
      syncBanner(nextBanner);
      toast.success("Đã cập nhật banner", { id: loadingToastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật banner.", { id: loadingToastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteBanner() {
    if (!deletingBanner) {
      return;
    }

    setIsSubmitting(true);
    const loadingToastId = toast.loading("Đang xóa banner...");

    try {
      await deleteBackofficeBanner(deletingBanner.id);
      setBanners((current) => current.filter((banner) => banner.id !== deletingBanner.id));
      if (selectedBannerId === deletingBanner.id) {
        setSelectedBannerId("");
      }
      setDeletingBanner(null);
      toast.success("Đã xóa banner", { id: loadingToastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa banner.", { id: loadingToastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col px-4 py-6 lg:px-8 lg:py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Nhân viên</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Quản lý banner</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Điều phối banner homepage, promotion page và floating banner lần đầu truy cập.
          </p>
        </div>
        <Button
          className="h-10 rounded-none px-3 text-sm font-semibold"
          disabled={isLoading}
          onClick={() => void loadBanners()}
          type="button"
          variant="outline"
        >
          <RefreshCw className="size-4" />
          Tải lại
        </Button>
      </header>

      <section className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border border-border bg-background">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Banner</p>
              <h2 className="mt-1 text-xl font-black tracking-tight">Danh sách</h2>
            </div>
            <Button
              className="size-9 rounded-none px-0"
              onClick={() => {
                setSelectedBannerId("");
                setFormValue(DEFAULT_FORM_VALUE);
                setSelectedImageFile(null);
                setImageWarningMessage(null);
              }}
              type="button"
            >
              <Plus className="size-4" />
              <span className="sr-only">Tạo banner</span>
            </Button>
          </div>

          <div className="grid gap-3 border-b border-border p-4">
            <FilterSelect
              label="Placement"
              onChange={(value) => setFilters((current) => ({ ...current, placement: value as BannerPlacement | "" }))}
              options={[
                { label: "Tất cả", value: "" },
                ...BANNER_PLACEMENTS.map((placement) => ({
                  label: getBannerPlacementLabel(placement),
                  value: placement,
                })),
              ]}
              value={filters.placement}
            />
            <FilterSelect
              label="Active"
              onChange={(value) => setFilters((current) => ({ ...current, active: value as BannerFilters["active"] }))}
              options={[
                { label: "Tất cả", value: "" },
                { label: "Đang bật", value: "true" },
                { label: "Đang tắt", value: "false" },
              ]}
              value={filters.active}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="grid gap-3 p-4">
                {Array.from({ length: 5 }, (_, index) => (
                  <div className="h-24 animate-pulse border border-border bg-muted" key={index} />
                ))}
              </div>
            ) : errorMessage ? (
              <p className="p-5 text-sm text-destructive">{errorMessage}</p>
            ) : banners.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">Chưa có banner phù hợp.</p>
            ) : (
              <div className="divide-y divide-border">
                {banners.map((banner) => (
                  <button
                    className={[
                      "grid w-full cursor-pointer gap-2 px-4 py-4 text-left transition-colors hover:bg-muted/20",
                      selectedBannerId === banner.id ? "bg-muted/35" : "",
                    ].join(" ")}
                    key={banner.id}
                    onClick={() => setSelectedBannerId(banner.id)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-black">{getBannerPlacementLabel(banner.placement)}</p>
                      <span
                        className={`border px-2 py-1 text-[10px] font-black uppercase ${
                          banner.active ? "border-green-700 bg-green-600 text-white" : "border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        {banner.active ? "ON" : "OFF"}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{banner.linkUrl || "Không có link"}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">sort {banner.sortOrder}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col border border-border bg-background">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {selectedBanner ? "Chỉnh sửa" : "Tạo mới"}
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight">
                {selectedBanner ? getBannerPlacementLabel(selectedBanner.placement) : "Banner"}
              </h2>
            </div>
            {selectedBanner ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  className="h-9 rounded-none px-3 text-xs font-semibold"
                  disabled={isSubmitting}
                  onClick={() => void handleToggleActive(selectedBanner)}
                  type="button"
                  variant="outline"
                >
                  {selectedBanner.active ? "Tắt" : "Bật"}
                </Button>
                <Button
                  className="h-9 rounded-none px-3 text-xs font-semibold"
                  disabled={isSubmitting}
                  onClick={() => setDeletingBanner(selectedBanner)}
                  type="button"
                  variant="destructive"
                >
                  <Trash2 className="size-4" />
                  Xóa
                </Button>
              </div>
            ) : null}
          </header>

          <form className="min-h-0 flex-1 overflow-y-auto" onSubmit={handleSubmit}>
            <div className="grid gap-5 p-5">
              <section className="grid gap-4 lg:grid-cols-2">
                <FilterSelect
                  label="Placement"
                  onChange={(value) => updateFormValue({ placement: value as BannerPlacement })}
                  options={BANNER_PLACEMENTS.map((placement) => ({
                    label: getBannerPlacementLabel(placement),
                    value: placement,
                  }))}
                  value={formValue.placement}
                />
                <TextField
                  label="Thứ tự"
                  min={0}
                  onChange={(value) => updateFormValue({ sortOrder: value })}
                  type="number"
                  value={formValue.sortOrder}
                />
                <TextField
                  className="lg:col-span-2"
                  label="Image URL"
                  onChange={(value) => updateFormValue({ imageUrl: value })}
                  value={formValue.imageUrl}
                />
                <TextField
                  className="lg:col-span-2"
                  label="Link URL"
                  onChange={(value) => updateFormValue({ linkUrl: value })}
                  placeholder="/khuyen-mai"
                  value={formValue.linkUrl}
                />
                <label className="inline-flex h-10 w-fit cursor-pointer items-center gap-2 border border-border px-3 text-sm font-semibold hover:border-primary hover:text-primary">
                  <input
                    checked={formValue.active}
                    className="size-4 cursor-pointer accent-primary"
                    onChange={(event) => updateFormValue({ active: event.currentTarget.checked })}
                    type="checkbox"
                  />
                  Active
                </label>
              </section>

              <section className="border border-border">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                  <div>
                    <h3 className="font-black tracking-tight">Ảnh banner</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Chuẩn đề xuất: {formatBannerStandard(formValue.placement)}. File image/* tối đa {currentBannerStandard.maxSizeLabel}.
                    </p>
                  </div>
                  <label className="inline-flex h-10 cursor-pointer items-center gap-2 border border-border px-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary">
                    <FileUp className="size-4" />
                    Upload ảnh
                    <input
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => {
                        void handleFileChange(event.currentTarget.files?.[0] ?? null);
                        event.currentTarget.value = "";
                      }}
                      type="file"
                    />
                  </label>
                </div>

                {imageWarningMessage ? (
                  <div className="flex items-start gap-3 border-b border-border bg-yellow-500/10 px-4 py-3 text-sm font-semibold text-yellow-800">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <p>{imageWarningMessage}</p>
                  </div>
                ) : null}

                {selectedImagePreviewUrl || formValue.imageUrl ? (
                  <div className="bg-muted/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt="Preview banner"
                      className={`${currentBannerStandard.aspectClass} w-full object-contain`}
                      src={selectedImagePreviewUrl || formValue.imageUrl}
                    />
                    {selectedImageFile ? (
                      <div className="border-t border-border bg-background px-4 py-3 text-xs font-semibold text-muted-foreground">
                        Đã chọn: {selectedImageFile.name}. Ảnh sẽ được upload bằng field file khi lưu banner.
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className={`${currentBannerStandard.aspectClass} grid place-items-center p-5 text-center text-muted-foreground`}>
                    <div>
                      <ImagePlus className="mx-auto size-10" />
                      <p className="mt-3 text-sm">Chưa có ảnh banner.</p>
                    </div>
                  </div>
                )}
              </section>
            </div>

            <footer className="sticky bottom-0 flex justify-end border-t border-border bg-background px-5 py-4">
              <Button className="h-11 rounded-none px-5 font-black" disabled={isSubmitting} type="submit">
                <Save className="size-4" />
                {isSubmitting ? "Đang lưu..." : selectedBanner ? "Lưu banner" : "Tạo banner"}
              </Button>
            </footer>
          </form>
        </section>
      </section>

      <ConfirmModal
        cancelText="Giữ lại"
        confirmText="Xóa"
        description={
          deletingBanner
            ? `Banner ${getBannerPlacementLabel(deletingBanner.placement)} sẽ bị xóa khỏi hệ thống.`
            : ""
        }
        isLoading={isSubmitting}
        onCancel={() => setDeletingBanner(null)}
        onConfirm={() => void handleDeleteBanner()}
        open={Boolean(deletingBanner)}
        title="Xóa banner?"
      />
    </div>
  );
}

function FilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-semibold">{label}</span>
      <select
        className="h-10 cursor-pointer border border-border bg-background px-3 outline-none hover:border-primary focus:border-primary"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value || "all"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({
  className,
  label,
  min,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  className?: string;
  label: string;
  min?: number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <label className={`grid gap-2 text-sm ${className ?? ""}`}>
      <span className="font-semibold">{label}</span>
      <input
        className="input-no-spin h-10 border border-border bg-background px-3 outline-none hover:border-primary focus:border-primary"
        min={min}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}
