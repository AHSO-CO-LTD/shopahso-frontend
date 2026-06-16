"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import HomeProductCluster from "@/components/home/HomeProductCluster";
import { useHomeReveal } from "@/components/home/useHomeReveal";
import {
  listCatalogFeaturedVariants,
  searchCatalogVariants,
} from "@/lib/api/services/catalog-variants.service";
import type { CatalogVariant } from "@/lib/catalog/types";

type ClusterState = {
  errorMessage: string | null;
  isLoading: boolean;
  products: CatalogVariant[];
};

const INITIAL_STATE: ClusterState = { errorMessage: null, isLoading: true, products: [] };

async function fetchFeatured(): Promise<CatalogVariant[]> {
  const variants = await listCatalogFeaturedVariants({ limit: 12 });
  return variants.slice(0, 12);
}

async function fetchNewArrivals(excludeIds: Set<string>): Promise<CatalogVariant[]> {
  const response = await searchCatalogVariants({ limit: 20, page: 1, sort: "newest" });
  return response.items.filter((v) => !excludeIds.has(v.id)).slice(0, 8);
}

export default function HomeMerchandiseSections() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [featured, setFeatured] = useState<ClusterState>(INITIAL_STATE);
  const [newArrivals, setNewArrivals] = useState<ClusterState>(INITIAL_STATE);

  useHomeReveal(rootRef, `${featured.products.length}-${newArrivals.products.length}`);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        const featuredProducts = await fetchFeatured();
        if (cancelled) return;

        const excludeIds = new Set(featuredProducts.map((v) => v.id));
        const newArrivalProducts = await fetchNewArrivals(excludeIds);
        if (cancelled) return;

        setFeatured({ errorMessage: null, isLoading: false, products: featuredProducts });
        setNewArrivals({ errorMessage: null, isLoading: false, products: newArrivalProducts });
      } catch {
        if (cancelled) return;
        const msg = "Không thể tải sản phẩm.";
        setFeatured({ errorMessage: msg, isLoading: false, products: [] });
        setNewArrivals({ errorMessage: msg, isLoading: false, products: [] });
        toast.error(msg);
      }
    }

    void loadAll();

    return () => {
      cancelled = true;
    };
  }, []);

  const retryFeatured = useCallback(async () => {
    setFeatured((s) => ({ ...s, errorMessage: null, isLoading: true }));
    const toastId = toast.loading("Đang tải lại sản phẩm nổi bật...");
    try {
      const products = await fetchFeatured();
      setFeatured({ errorMessage: null, isLoading: false, products });
      toast.success("Đã cập nhật sản phẩm nổi bật.", { id: toastId });
    } catch {
      const msg = "Không thể tải sản phẩm nổi bật.";
      setFeatured({ errorMessage: msg, isLoading: false, products: [] });
      toast.error(msg, { id: toastId });
    }
  }, []);

  const retryNewArrivals = useCallback(async () => {
    setNewArrivals((s) => ({ ...s, errorMessage: null, isLoading: true }));
    const toastId = toast.loading("Đang tải lại sản phẩm mới...");
    try {
      const excludeIds = new Set(featured.products.map((v) => v.id));
      const products = await fetchNewArrivals(excludeIds);
      setNewArrivals({ errorMessage: null, isLoading: false, products });
      toast.success("Đã cập nhật sản phẩm mới.", { id: toastId });
    } catch {
      const msg = "Không thể tải sản phẩm mới cập nhật.";
      setNewArrivals({ errorMessage: msg, isLoading: false, products: [] });
      toast.error(msg, { id: toastId });
    }
  }, [featured.products]);

  return (
    <div ref={rootRef}>
      <HomeProductCluster
        description=""
        emptyText="Chưa có sản phẩm nổi bật."
        errorMessage={featured.errorMessage}
        eyebrow="04 / Featured"
        href="/san-pham?sort=score"
        isLoading={featured.isLoading}
        onRetry={() => void retryFeatured()}
        products={featured.products}
        title="Sản phẩm nổi bật"
      />

      <HomeProductCluster
        description=""
        emptyText="Chưa có sản phẩm mới cập nhật."
        errorMessage={newArrivals.errorMessage}
        eyebrow="05 / New stock"
        href="/san-pham?sort=newest"
        isLoading={newArrivals.isLoading}
        onRetry={() => void retryNewArrivals()}
        products={newArrivals.products}
        title="Mới cập nhật"
      />
    </div>
  );
}
