"use client";

import { useState } from "react";
import QuoteRequestModal from "@/components/quote-requests/QuoteRequestModal";
import CatalogVariantCard from "@/components/storefront/CatalogVariantCard";
import type { CatalogVariant } from "@/lib/catalog/types";

export default function DiscountedVariantGrid({ variants }: { variants: CatalogVariant[] }) {
  const [quoteVariant, setQuoteVariant] = useState<CatalogVariant | null>(null);

  if (variants.length === 0) {
    return (
      <div className="border border-border bg-muted/20 p-6 text-sm text-muted-foreground">
        Chưa có sản phẩm đang giảm giá.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
        {variants.map((variant) => (
          <CatalogVariantCard key={variant.id} onRequestQuote={setQuoteVariant} variant={variant} />
        ))}
      </div>
      <QuoteRequestModal
        open={Boolean(quoteVariant)}
        variant={quoteVariant}
        onClose={() => setQuoteVariant(null)}
      />
    </>
  );
}
