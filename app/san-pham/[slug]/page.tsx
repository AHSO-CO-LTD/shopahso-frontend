import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductVariantDetailPage from "@/components/storefront/ProductVariantDetailPage";
import JsonLd from "@/components/seo/JsonLd";
import {
  buildProductBreadcrumbJsonLd,
  buildProductJsonLd,
  getProductSeoDescription,
  getProductSeoImage,
} from "@/lib/seo/schema";
import { absoluteUrl } from "@/lib/seo/config";
import { getVariantForRoute } from "@/lib/seo/route-data";

type ProductVariantDetailRouteProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ProductVariantDetailRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const variant = await getVariantForRoute(slug);

  if (!variant) {
    return {
      robots: {
        follow: false,
        index: false,
      },
      title: "Không tìm thấy sản phẩm",
    };
  }

  const title = `${variant.name} | ShopAHSO — Giá & Tồn kho`;
  const description = getProductSeoDescription(variant);
  const url = absoluteUrl(`/san-pham/${variant.slug}`);
  const image = getProductSeoImage(variant);

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      description,
      images: [image],
      title,
      type: "website",
      url,
    },
  };
}

export default async function ProductVariantDetailRoute({ params }: ProductVariantDetailRouteProps) {
  const { slug } = await params;
  const variant = await getVariantForRoute(slug);

  if (!variant) {
    notFound();
  }

  return (
    <>
      <JsonLd id="shopahso-product-jsonld" data={buildProductJsonLd(variant)} />
      <JsonLd id="shopahso-product-breadcrumb-jsonld" data={buildProductBreadcrumbJsonLd(variant)} />
      <ProductVariantDetailPage slug={variant.slug} />
    </>
  );
}
