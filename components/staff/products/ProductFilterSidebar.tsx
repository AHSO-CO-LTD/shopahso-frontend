"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { BackofficeCategory } from "@/lib/category/types";
import type { Brand } from "@/lib/brand/types";

// ── Category tree ────────────────────────────────────────────────────────────

type CategoryNode = BackofficeCategory & {
  children: CategoryNode[];
  directCount: number;
  totalCount: number;
};

function buildCategoryTree(
  categories: BackofficeCategory[],
  directCounts: Map<string, number>,
): CategoryNode[] {
  const nodeMap = new Map<string, CategoryNode>();
  for (const cat of categories) {
    nodeMap.set(cat.id, { ...cat, children: [], directCount: directCounts.get(cat.id) ?? 0, totalCount: 0 });
  }

  const roots: CategoryNode[] = [];
  for (const node of nodeMap.values()) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  function sortAndPropagateCount(nodes: CategoryNode[]): number {
    nodes.sort((a, b) => a.name.localeCompare(b.name, "vi"));
    for (const node of nodes) {
      const childTotal = sortAndPropagateCount(node.children);
      node.totalCount = node.directCount + childTotal;
    }
    return nodes.reduce((sum, n) => sum + n.totalCount, 0);
  }
  sortAndPropagateCount(roots);

  return roots.filter((n) => n.totalCount > 0);
}

// ── CategoryTreeItem ─────────────────────────────────────────────────────────

function CategoryTreeItem({
  node,
  selectedCategoryId,
  onSelect,
  depth = 0,
}: {
  node: CategoryNode;
  selectedCategoryId: string;
  onSelect: (id: string) => void;
  depth?: number;
}) {
  const hasChildren = node.children.length > 0;
  const isSelected = selectedCategoryId === node.id;
  const childIsSelected = useMemo(() => {
    function hasSelected(nodes: CategoryNode[]): boolean {
      return nodes.some((n) => n.id === selectedCategoryId || hasSelected(n.children));
    }
    return hasSelected(node.children);
  }, [node.children, selectedCategoryId]);

  const [expanded, setExpanded] = useState(isSelected || childIsSelected);

  return (
    <li>
      <div
        className="flex items-center"
        style={{ paddingLeft: `${depth * 10}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-label={expanded ? "Thu gọn" : "Mở rộng"}
            className="flex size-5 shrink-0 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          </button>
        ) : (
          <span className="size-5 shrink-0" />
        )}

        <button
          type="button"
          className={[
            "flex min-w-0 flex-1 items-center gap-1 py-1 pr-1 text-left text-sm transition-colors",
            isSelected
              ? "font-semibold text-primary"
              : "text-foreground hover:text-primary",
          ].join(" ")}
          onClick={() => onSelect(isSelected ? "" : node.id)}
        >
          <span className="truncate">{node.name}</span>
          <span className="ml-auto shrink-0 text-[10px] tabular-nums text-muted-foreground">
            {node.totalCount}
          </span>
        </button>
      </div>

      {hasChildren && expanded && (
        <ul>
          {node.children.map((child) => (
            <CategoryTreeItem
              key={child.id}
              node={child}
              selectedCategoryId={selectedCategoryId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// ── Main sidebar ─────────────────────────────────────────────────────────────

type ProductFilterSidebarProps = {
  brands: Brand[];
  brandCounts: Map<string, number>;
  categories: BackofficeCategory[];
  categoryCounts: Map<string, number>;
  selectedBrandId: string;
  selectedCategoryId: string;
  totalProducts: number;
  onBrandChange: (brandId: string) => void;
  onCategoryChange: (categoryId: string) => void;
};

export default function ProductFilterSidebar({
  brands,
  brandCounts,
  categories,
  categoryCounts,
  selectedBrandId,
  selectedCategoryId,
  totalProducts,
  onBrandChange,
  onCategoryChange,
}: ProductFilterSidebarProps) {
  const categoryTree = useMemo(
    () => buildCategoryTree(categories, categoryCounts),
    [categories, categoryCounts],
  );

  const sortedBrands = useMemo(
    () => [...brands].sort((a, b) => a.name.localeCompare(b.name, "vi")),
    [brands],
  );

  return (
    <aside className="flex w-52 shrink-0 flex-col overflow-hidden border-r border-border bg-background">
      {/* Thương hiệu */}
      <div className="border-b border-border px-3 py-3">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Thương hiệu
        </p>
        <ul className="space-y-0.5">
          <li>
            <button
              type="button"
              className={[
                "flex w-full items-center gap-1 py-1 px-1 text-sm transition-colors",
                !selectedBrandId ? "font-semibold text-primary" : "text-foreground hover:text-primary",
              ].join(" ")}
              onClick={() => onBrandChange("")}
            >
              <span className="flex-1 text-left">Tất cả</span>
              <span className="text-[10px] tabular-nums text-muted-foreground">{totalProducts}</span>
            </button>
          </li>
          {sortedBrands.map((brand) => {
            const count = brandCounts.get(brand.id) ?? 0;
            const isSelected = selectedBrandId === brand.id;
            return (
              <li key={brand.id}>
                <button
                  type="button"
                  className={[
                    "flex w-full items-center gap-1 py-1 px-1 text-sm transition-colors",
                    isSelected ? "font-semibold text-primary" : "text-foreground hover:text-primary",
                  ].join(" ")}
                  onClick={() => onBrandChange(isSelected ? "" : brand.id)}
                >
                  <span className="flex-1 truncate text-left">{brand.name}</span>
                  <span className="text-[10px] tabular-nums text-muted-foreground">{count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Danh mục */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Danh mục
        </p>
        <ul className="space-y-0.5">
          <li>
            <button
              type="button"
              className={[
                "flex w-full items-center gap-1 py-1 px-1 text-sm transition-colors",
                !selectedCategoryId ? "font-semibold text-primary" : "text-foreground hover:text-primary",
              ].join(" ")}
              onClick={() => onCategoryChange("")}
            >
              <span className="flex-1 text-left">Tất cả</span>
              <span className="text-[10px] tabular-nums text-muted-foreground">{totalProducts}</span>
            </button>
          </li>
          {categoryTree.map((node) => (
            <CategoryTreeItem
              key={node.id}
              node={node}
              selectedCategoryId={selectedCategoryId}
              onSelect={onCategoryChange}
            />
          ))}
        </ul>
      </div>
    </aside>
  );
}
