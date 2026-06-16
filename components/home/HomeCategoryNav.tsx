"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Boxes } from "lucide-react";
import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { listCatalogCategoryTree } from "@/lib/api/services/categories.service";
import type { CategoryTreeNode } from "@/lib/category/types";

const MAX_CATEGORIES = 10;

async function fetchTopLevelCategories(): Promise<CategoryTreeNode[]> {
  const tree = await listCatalogCategoryTree();
  return tree.filter((node) => node.parentId === null).slice(0, MAX_CATEGORIES);
}

export default function HomeCategoryNav() {
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchTopLevelCategories()
      .then((items) => {
        if (!cancelled) {
          setCategories(items);
        }
      })
      .catch(() => {
        // silent fail — section hides if categories unavailable
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!isLoading && categories.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-border bg-muted/20 py-10 sm:py-12">
      <div className="container mx-auto px-4">
        <HomeSectionHeader
          action={
            <Link
              className="inline-flex h-10 cursor-pointer items-center gap-2 border border-border bg-background px-3 text-sm font-black transition-colors hover:border-primary hover:text-primary"
              href="/san-pham"
            >
              Xem tất cả danh mục
              <ArrowRight className="size-4" />
            </Link>
          }
          description=""
          eyebrow="01 / Categories"
          title="Danh mục sản phẩm"
        />

        <div className="mt-5">
          {isLoading ? (
            <CategorySkeleton />
          ) : (
            <div className="grid grid-cols-2 border border-border bg-background sm:grid-cols-3 lg:grid-cols-5">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/san-pham?categorySlug=${category.slug}`}
                  className="group flex min-h-28 cursor-pointer flex-col border-b border-r border-border p-4 transition-colors hover:bg-muted hover:text-primary"
                  aria-label={`Xem sản phẩm danh mục ${category.name}`}
                >
                  <span className="inline-flex size-8 items-center justify-center border border-border bg-muted/40 text-primary transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                    <Boxes className="size-4" />
                  </span>
                  <p className="mt-3 line-clamp-2 text-sm font-black leading-tight">{category.name}</p>
                  {category.children.length > 0 && (
                    <p className="mt-auto pt-2 font-mono text-[10px] text-muted-foreground">
                      {category.children.length} nhóm con
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CategorySkeleton() {
  return (
    <div className="grid grid-cols-2 border border-border bg-background sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 10 }, (_, index) => (
        <article
          key={`home-category-skeleton-${index}`}
          className="min-h-28 border-b border-r border-border p-4"
        >
          <Skeleton className="size-8" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-1 h-4 w-3/4" />
        </article>
      ))}
    </div>
  );
}
