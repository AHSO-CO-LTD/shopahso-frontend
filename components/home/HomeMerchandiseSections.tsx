"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import HomeProductCluster from "@/components/home/HomeProductCluster";
import { hasVariantDiscount } from "@/components/home/home-product-card";
import { useHomeReveal } from "@/components/home/useHomeReveal";
import {
  listCatalogFeaturedVariants,
  searchCatalogVariants,
} from "@/lib/api/services/catalog-variants.service";
import type { CatalogVariant } from "@/lib/catalog/types";

type ProductClusterState = {
  errorMessage: string | null;
  isLoading: boolean;
  products: CatalogVariant[];
};

type ProductClusterKey = "bestSellers" | "deals" | "featured" | "newArrivals";

const INITIAL_CLUSTER_STATE: Record<ProductClusterKey, ProductClusterState> = {
  bestSellers: { errorMessage: null, isLoading: true, products: [] },
  deals: { errorMessage: null, isLoading: true, products: [] },
  featured: { errorMessage: null, isLoading: true, products: [] },
  newArrivals: { errorMessage: null, isLoading: true, products: [] },
};

async function fetchFeaturedVariants() {
  const variants = await listCatalogFeaturedVariants({ limit: 10 });
  return variants.slice(0, 10);
}

async function fetchNewArrivals() {
  const response = await searchCatalogVariants({
    limit: 10,
    page: 1,
    sort: "newest",
  });

  return response.items.slice(0, 10);
}

async function fetchDealProducts() {
  const response = await searchCatalogVariants({
    limit: 80,
    page: 1,
    sort: "relevance",
  });

  return response.items.filter(hasVariantDiscount).slice(0, 10);
}

async function fetchBestSellers() {
  const response = await searchCatalogVariants({
    limit: 40,
    page: 1,
    sort: "score",
  });

  return response.items
    .slice()
    .sort((a, b) => (b.orderCount ?? 0) - (a.orderCount ?? 0) || b.score - a.score)
    .slice(0, 10);
}

const FETCHERS: Record<ProductClusterKey, () => Promise<CatalogVariant[]>> = {
  bestSellers: fetchBestSellers,
  deals: fetchDealProducts,
  featured: fetchFeaturedVariants,
  newArrivals: fetchNewArrivals,
};

const ERROR_MESSAGES: Record<ProductClusterKey, string> = {
  bestSellers: "Không thể tải sản phẩm bán chạy.",
  deals: "Không thể tải sản phẩm đang giảm giá.",
  featured: "Không thể tải sản phẩm nổi bật.",
  newArrivals: "Không thể tải sản phẩm mới.",
};

const LOADING_MESSAGES: Record<ProductClusterKey, string> = {
  bestSellers: "Đang tải sản phẩm bán chạy...",
  deals: "Đang tải sản phẩm đang giảm giá...",
  featured: "Đang tải sản phẩm nổi bật...",
  newArrivals: "Đang tải sản phẩm mới...",
};

const SUCCESS_MESSAGES: Record<ProductClusterKey, string> = {
  bestSellers: "Đã tải sản phẩm bán chạy.",
  deals: "Đã tải sản phẩm đang giảm giá.",
  featured: "Đã tải sản phẩm nổi bật.",
  newArrivals: "Đã tải sản phẩm mới.",
};

export default function HomeMerchandiseSections() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [clusters, setClusters] = useState(INITIAL_CLUSTER_STATE);

  useHomeReveal(rootRef, Object.values(clusters).map((cluster) => cluster.products.length).join("-"));

  const loadCluster = useCallback(async (key: ProductClusterKey, showFeedback = false) => {
    const loadingToastId = showFeedback ? toast.loading(LOADING_MESSAGES[key]) : undefined;

    setClusters((current) => ({
      ...current,
      [key]: { ...current[key], errorMessage: null, isLoading: true },
    }));

    try {
      const products = await FETCHERS[key]();
      setClusters((current) => ({
        ...current,
        [key]: { errorMessage: null, isLoading: false, products },
      }));

      if (showFeedback) {
        toast.success(SUCCESS_MESSAGES[key], { id: loadingToastId });
      }
    } catch {
      setClusters((current) => ({
        ...current,
        [key]: { errorMessage: ERROR_MESSAGES[key], isLoading: false, products: [] },
      }));
      toast.error(ERROR_MESSAGES[key], { id: loadingToastId });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAllClusters() {
      const entries = await Promise.all(
        (Object.keys(FETCHERS) as ProductClusterKey[]).map(async (key) => {
          try {
            const products = await FETCHERS[key]();
            return [key, { errorMessage: null, isLoading: false, products }] as const;
          } catch {
            return [key, { errorMessage: ERROR_MESSAGES[key], isLoading: false, products: [] }] as const;
          }
        }),
      );

      if (cancelled) {
        return;
      }

      const nextClusters = entries.reduce(
        (accumulator, [key, value]) => ({
          ...accumulator,
          [key]: value,
        }),
        INITIAL_CLUSTER_STATE,
      );

      setClusters(nextClusters);

      entries.forEach(([key, value]) => {
        if (value.errorMessage) {
          toast.error(ERROR_MESSAGES[key]);
        }
      });
    }

    void loadAllClusters();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div ref={rootRef}>
      <HomeProductCluster
        description=""
        emptyText="Chưa có sản phẩm nổi bật."
        errorMessage={clusters.featured.errorMessage}
        eyebrow="01 / Featured"
        href="/san-pham?sort=score"
        isLoading={clusters.featured.isLoading}
        onRetry={() => void loadCluster("featured", true)}
        products={clusters.featured.products}
        title="Sản phẩm nổi bật"
      />

      <HomeProductCluster
        description=""
        emptyText="Hiện chưa có sản phẩm đang giảm giá."
        errorMessage={clusters.deals.errorMessage}
        eyebrow="02 / Promotion"
        href="/san-pham?sort=price_asc"
        isLoading={clusters.deals.isLoading}
        onRetry={() => void loadCluster("deals", true)}
        products={clusters.deals.products}
        title="Đang giảm giá"
      />

      <HomeProductCluster
        description=""
        emptyText="Chưa có dữ liệu sản phẩm bán chạy."
        errorMessage={clusters.bestSellers.errorMessage}
        eyebrow="03 / Best sellers"
        href="/san-pham?sort=score"
        isLoading={clusters.bestSellers.isLoading}
        onRetry={() => void loadCluster("bestSellers", true)}
        products={clusters.bestSellers.products}
        title="Sản phẩm bán chạy"
      />

      <HomeProductCluster
        description=""
        emptyText="Chưa có sản phẩm mới để hiển thị."
        errorMessage={clusters.newArrivals.errorMessage}
        eyebrow="04 / New stock"
        href="/san-pham?sort=newest"
        isLoading={clusters.newArrivals.isLoading}
        onRetry={() => void loadCluster("newArrivals", true)}
        products={clusters.newArrivals.products}
        title="Sản phẩm mới"
      />
    </div>
  );
}
