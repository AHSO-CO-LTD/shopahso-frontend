"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import ConfirmModal from "@/components/common/ConfirmModal";
import PromotionEditorPanel from "@/components/staff/promotions/PromotionEditorPanel";
import PromotionListPanel from "@/components/staff/promotions/PromotionListPanel";
import { ApiError } from "@/lib/api/client";
import {
  createBackofficePromotion,
  deleteBackofficePromotion,
  endBackofficePromotion,
  getBackofficePromotion,
  listBackofficePromotions,
  updateBackofficePromotion,
  uploadBackofficePromotionBanner,
} from "@/lib/api/services/promotions.service";
import { listBackofficeVariants } from "@/lib/api/services/variants.service";
import type { VariantSummary } from "@/lib/product/types";
import type {
  CreatePromotionPayload,
  PromotionDetail,
  PromotionStatus,
  PromotionSummary,
  PromotionVariantUsage,
  UpdatePromotionPayload,
} from "@/lib/promotion/types";

type PromotionFilters = {
  q: string;
  status: PromotionStatus | "";
};

function sortPromotions(items: PromotionSummary[]) {
  return [...items].sort((a, b) => {
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return bTime - aTime;
  });
}

function getPromotionErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 409) {
    return "Variant này đang nằm trong chương trình khuyến mãi khác.";
  }

  return error instanceof Error ? error.message : "Không thể xử lý chương trình khuyến mãi.";
}

export default function StaffPromotionManager() {
  const [filters, setFilters] = useState<PromotionFilters>({ q: "", status: "" });
  const [promotions, setPromotions] = useState<PromotionSummary[]>([]);
  const [selectedPromotionId, setSelectedPromotionId] = useState("");
  const [selectedPromotion, setSelectedPromotion] = useState<PromotionDetail | null>(null);
  const [variants, setVariants] = useState<VariantSummary[]>([]);
  const [variantUsage, setVariantUsage] = useState<PromotionVariantUsage>({});
  const [listErrorMessage, setListErrorMessage] = useState<string | null>(null);
  const [variantErrorMessage, setVariantErrorMessage] = useState<string | null>(null);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [endingPromotion, setEndingPromotion] = useState<PromotionDetail | null>(null);
  const [deletingPromotion, setDeletingPromotion] = useState<PromotionDetail | null>(null);

  const loadPromotions = useCallback(async () => {
    setIsListLoading(true);
    setListErrorMessage(null);

    try {
      const response = await listBackofficePromotions({
        q: filters.q.trim() || undefined,
        status: filters.status || undefined,
      });
      setPromotions(sortPromotions(response));
    } catch (error) {
      const message = getPromotionErrorMessage(error);
      setListErrorMessage(message);
      toast.error(message);
    } finally {
      setIsListLoading(false);
    }
  }, [filters.q, filters.status]);

  const loadVariants = useCallback(async () => {
    try {
      const response = await listBackofficeVariants();
      setVariants(response.filter((variant) => variant.active));
      setVariantErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải danh sách biến thể.";
      setVariantErrorMessage(message);
      toast.error(message);
    }
  }, []);

  const loadVariantUsage = useCallback(async () => {
    try {
      const response = await listBackofficePromotions();
      const promotionsWithItems = response.filter((promotion) => promotion.status !== "ENDED" && (promotion._count?.items ?? 0) > 0);
      const details = await Promise.all(promotionsWithItems.map((promotion) => getBackofficePromotion(promotion.id)));
      const nextUsage: PromotionVariantUsage = {};

      details.forEach((promotion) => {
        if (promotion.status === "ENDED") {
          return;
        }

        promotion.items.forEach((item) => {
          nextUsage[item.variantId] = {
            promotionId: promotion.id,
            promotionName: promotion.name,
            promotionStatus: promotion.status,
          };
        });
      });

      setVariantUsage(nextUsage);
    } catch (error) {
      const message = getPromotionErrorMessage(error);
      setVariantErrorMessage(message);
      toast.error(message);
    }
  }, []);

  const loadPromotionDetail = useCallback(async (promotionId: string) => {
    try {
      const response = await getBackofficePromotion(promotionId);
      setSelectedPromotion(response);
      setSelectedPromotionId(response.id);
    } catch (error) {
      const message = getPromotionErrorMessage(error);
      toast.error(message);
      setSelectedPromotion(null);
      setSelectedPromotionId("");
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPromotions();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadPromotions]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadVariants();
      void loadVariantUsage();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadVariantUsage, loadVariants]);

  function syncPromotionSummary(detail: PromotionDetail) {
    setPromotions((current) =>
      sortPromotions(
        current.some((item) => item.id === detail.id)
          ? current.map((item) => (item.id === detail.id ? { ...item, ...detail, _count: { items: detail.items.length } } : item))
          : [{ ...detail, _count: { items: detail.items.length } }, ...current],
      ),
    );
    setSelectedPromotion(detail);
    setSelectedPromotionId(detail.id);
    syncVariantUsage(detail);
  }

  function syncVariantUsage(detail: PromotionDetail) {
    setVariantUsage((current) => {
      const nextUsage: PromotionVariantUsage = {};

      Object.entries(current).forEach(([variantId, usage]) => {
        if (usage.promotionId !== detail.id) {
          nextUsage[variantId] = usage;
        }
      });

      if (detail.status !== "ENDED") {
        detail.items.forEach((item) => {
          nextUsage[item.variantId] = {
            promotionId: detail.id,
            promotionName: detail.name,
            promotionStatus: detail.status,
          };
        });
      }

      return nextUsage;
    });
  }

  async function handleSavePromotion(payload: UpdatePromotionPayload, promotion: PromotionDetail | null, bannerFile?: File) {
    setIsSubmitting(true);
    const loadingToastId = toast.loading(
      promotion ? "Đang cập nhật chương trình khuyến mãi..." : "Đang tạo chương trình khuyến mãi...",
    );

    try {
      const nextPromotion = promotion
        ? await updateBackofficePromotion(promotion.id, payload)
        : await createBackofficePromotion(payload as CreatePromotionPayload);

      if (!bannerFile) {
        syncPromotionSummary(nextPromotion);
        toast.success(promotion ? "Đã cập nhật chương trình" : "Đã tạo chương trình khuyến mãi", {
          id: loadingToastId,
        });
        return;
      }

      try {
        const nextPromotionWithBanner = await uploadBackofficePromotionBanner(nextPromotion.id, bannerFile);
        syncPromotionSummary(nextPromotionWithBanner);
        toast.success(promotion ? "Đã cập nhật chương trình và banner" : "Đã tạo chương trình và upload banner", {
          id: loadingToastId,
        });
      } catch (uploadError) {
        syncPromotionSummary(nextPromotion);
        toast.error(`Đã lưu chương trình nhưng chưa upload được banner: ${getPromotionErrorMessage(uploadError)}`, {
          id: loadingToastId,
        });
      }
    } catch (error) {
      const message = getPromotionErrorMessage(error);
      if (error instanceof ApiError && error.status === 409) {
        toast.warning(message, { id: loadingToastId });
      } else {
        toast.error(message, { id: loadingToastId });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUploadBanner(promotion: PromotionDetail, file: File) {
    setIsSubmitting(true);
    const loadingToastId = toast.loading("Đang cập nhật banner chương trình...");

    try {
      const nextPromotion = await uploadBackofficePromotionBanner(promotion.id, file);
      syncPromotionSummary(nextPromotion);
      toast.success("Đã cập nhật banner chương trình", { id: loadingToastId });
    } catch (error) {
      toast.error(getPromotionErrorMessage(error), { id: loadingToastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEndPromotion() {
    if (!endingPromotion) {
      return;
    }

    setIsSubmitting(true);
    const loadingToastId = toast.loading("Đang kết thúc chương trình...");

    try {
      const nextPromotion = await endBackofficePromotion(endingPromotion.id);
      syncPromotionSummary(nextPromotion);
      setEndingPromotion(null);
      toast.success("Đã kết thúc chương trình, giá sản phẩm đã trở về bình thường", {
        id: loadingToastId,
      });
    } catch (error) {
      toast.error(getPromotionErrorMessage(error), { id: loadingToastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeletePromotion() {
    if (!deletingPromotion) {
      return;
    }

    setIsSubmitting(true);
    const loadingToastId = toast.loading("Đang xóa chương trình...");

    try {
      await deleteBackofficePromotion(deletingPromotion.id);
      setPromotions((current) => current.filter((item) => item.id !== deletingPromotion.id));
      setVariantUsage((current) => {
        const nextUsage: PromotionVariantUsage = {};

        Object.entries(current).forEach(([variantId, usage]) => {
          if (usage.promotionId !== deletingPromotion.id) {
            nextUsage[variantId] = usage;
          }
        });

        return nextUsage;
      });
      if (selectedPromotionId === deletingPromotion.id) {
        setSelectedPromotion(null);
        setSelectedPromotionId("");
      }
      setDeletingPromotion(null);
      toast.success("Đã xóa chương trình khuyến mãi", { id: loadingToastId });
    } catch (error) {
      toast.error(getPromotionErrorMessage(error), { id: loadingToastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col px-4 py-6 lg:px-8 lg:py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Nhân viên
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Quản lý khuyến mãi</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Tạo chương trình, gắn SKU, override mức giảm, upload banner và điều phối trạng thái active.
          </p>
        </div>
        {variantErrorMessage ? (
          <p className="max-w-md border border-destructive bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
            {variantErrorMessage}
          </p>
        ) : null}
      </header>

      <section className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <PromotionListPanel
          errorMessage={listErrorMessage}
          filters={filters}
          isLoading={isListLoading}
          onCreate={() => {
            setSelectedPromotion(null);
            setSelectedPromotionId("");
          }}
          onFiltersChange={setFilters}
          onRefresh={() => void loadPromotions()}
          onSelect={(id) => void loadPromotionDetail(id)}
          promotions={promotions}
          selectedPromotionId={selectedPromotionId}
        />
        <PromotionEditorPanel
          isSubmitting={isSubmitting}
          key={selectedPromotionId || "new-promotion"}
          onDelete={setDeletingPromotion}
          onEnd={setEndingPromotion}
          onSave={(payload, promotion, bannerFile) => void handleSavePromotion(payload, promotion, bannerFile)}
          onUploadBanner={(promotion, file) => void handleUploadBanner(promotion, file)}
          promotion={selectedPromotion}
          variantUsage={variantUsage}
          variants={variants}
        />
      </section>

      <ConfirmModal
        cancelText="Giữ lại"
        confirmText="Kết thúc"
        description={
          endingPromotion
            ? `Chương trình "${endingPromotion.name}" sẽ kết thúc ngay, sản phẩm không còn áp dụng giá khuyến mãi này.`
            : ""
        }
        isLoading={isSubmitting}
        onCancel={() => setEndingPromotion(null)}
        onConfirm={() => void handleEndPromotion()}
        open={Boolean(endingPromotion)}
        title="Kết thúc chương trình?"
      />

      <ConfirmModal
        cancelText="Giữ lại"
        confirmText="Xóa"
        description={
          deletingPromotion
            ? `Chương trình "${deletingPromotion.name}" và banner Cloudinary liên quan sẽ bị xóa.`
            : ""
        }
        isLoading={isSubmitting}
        onCancel={() => setDeletingPromotion(null)}
        onConfirm={() => void handleDeletePromotion()}
        open={Boolean(deletingPromotion)}
        title="Xóa chương trình khuyến mãi?"
      />
    </div>
  );
}
