"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import StaffLayout from "@/components/staff/StaffLayout";
import { Button } from "@/components/ui/button";
import { listBackofficeProducts } from "@/lib/api/services/products.service";
import type { ProductSummary } from "@/lib/product/types";

function sortProducts(items: ProductSummary[]) {
  return [...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export default function StaffProductList() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await listBackofficeProducts();
      setProducts(sortProducts(response));
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể tải danh sách sản phẩm.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) {
      return products;
    }
    return products.filter((item) => item.name.toLowerCase().includes(keyword) || item.slug.toLowerCase().includes(keyword));
  }, [products, searchKeyword]);

  return (
    <StaffLayout>
      <div className="flex h-full min-h-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <section className="flex h-full min-h-0 w-full flex-col border border-border bg-background">
          <header className="border-b border-border px-6 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Sản phẩm</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-black tracking-tight">Danh sách sản phẩm</h2>
              <Button asChild className="h-10 px-4 text-sm font-semibold">
                <Link href="/nhan-vien/san-pham/tao">Tạo sản phẩm</Link>
              </Button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Nhấn vào một sản phẩm để mở trang quản lý chi tiết sản phẩm và biến thể.</p>
          </header>

          <div className="border-b border-border px-6 py-4">
            <label className="grid gap-2 text-sm">
              <span className="font-semibold">Tìm sản phẩm</span>
              <input
                className="h-11 border border-border px-3 outline-none focus:border-primary"
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="Nhập tên hoặc slug..."
                value={searchKeyword}
              />
            </label>
          </div>

          {isLoading ? (
            <div className="px-6 py-8 text-sm text-muted-foreground">Đang tải sản phẩm...</div>
          ) : errorMessage ? (
            <div className="space-y-4 px-6 py-8">
              <p className="text-sm text-destructive">{errorMessage}</p>
              <Button className="h-10 px-4 text-sm font-semibold" onClick={() => void loadProducts()} type="button" variant="outline">
                Tải lại
              </Button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="px-6 py-8 text-sm text-muted-foreground">
              {searchKeyword.trim() ? "Không tìm thấy sản phẩm phù hợp." : "Chưa có sản phẩm nào."}
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              <div className="grid grid-cols-[minmax(0,1fr)_100px_140px] border border-border bg-muted/20 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <p>Thông tin sản phẩm</p>
                <p className="text-center">Trạng thái</p>
                <p className="text-right">Mở quản lý</p>
              </div>
              <ul className="divide-y divide-border border-x border-b border-border">
                {filteredProducts.map((product) => (
                  <li key={product.id} className="grid grid-cols-[minmax(0,1fr)_100px_140px] items-center gap-3 px-4 py-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{product.name}</p>
                      <p className="truncate text-xs text-muted-foreground">slug: {product.slug}</p>
                      <p className="truncate text-xs text-muted-foreground">variants: {product._count.variants}</p>
                    </div>
                    <div className="text-center text-xs font-semibold">
                      <p>{product.status}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {product.active ? "Hoạt động" : "Tạm ẩn"}
                      </p>
                    </div>
                    <div className="text-right">
                      <Button asChild className="h-9 px-3 text-xs font-semibold" variant="outline">
                        <Link href={`/nhan-vien/san-pham/${product.id}`}>Quản lý</Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </StaffLayout>
  );
}
