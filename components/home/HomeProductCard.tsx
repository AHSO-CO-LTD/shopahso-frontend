import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HomeProductCardItem } from "@/components/home/home-product-card";

export default function HomeProductCard({ product }: { product: HomeProductCardItem }) {
  return (
    <Link
      className="group flex min-h-[25rem] cursor-pointer flex-col border border-border bg-background transition-[border-color,transform] hover:-translate-y-0.5 hover:border-primary focus-visible:border-primary focus-visible:outline-none"
      data-home-reveal
      href={product.href}
    >
      <div className="relative aspect-[4/3] border-b border-border bg-muted/20">
        <Image
          alt={product.name}
          className={product.isFallbackImage ? "object-contain p-7" : "object-cover"}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          src={product.imageUrl}
        />
        {product.badge ? (
          <span className="absolute left-2 top-2 border border-red-700 bg-red-600 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
            {product.badge}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 truncate text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {product.categoryName}
          </p>
          <p className="shrink-0 font-mono text-[10px] text-primary">{product.sku}</p>
        </div>

        <h3 className="mt-2 line-clamp-2 min-h-11 text-sm font-black leading-snug tracking-tight transition-colors group-hover:text-primary sm:text-base">
          {product.name}
        </h3>
        {product.productName && product.productName !== product.name ? (
          <p className="mt-1 line-clamp-1 text-xs font-semibold text-muted-foreground">
            {product.productName}
          </p>
        ) : null}

        <div className="mt-3 border border-border px-2 py-2 text-xs">
          <p className="truncate text-muted-foreground">Thương hiệu</p>
          <p className="mt-1 truncate font-bold">{product.brandName}</p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div className="min-w-0">
            <p className="truncate text-base font-black text-primary">{product.priceLabel}</p>
            {product.originalPriceLabel ? (
              <p className="mt-0.5 truncate text-xs font-semibold text-muted-foreground line-through">
                {product.originalPriceLabel}
              </p>
            ) : product.meta ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{product.meta}</p>
            ) : null}
          </div>
          <span className="inline-flex size-9 shrink-0 items-center justify-center border border-border transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
            <ArrowRight className="size-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
