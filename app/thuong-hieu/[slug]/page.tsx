import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BrandDetailPage from "@/components/storefront/BrandDetailPage";
import JsonLd from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/seo/config";
import { buildBrandBreadcrumbJsonLd, getBrandSeoDescription } from "@/lib/seo/schema";
import { getBrandForRoute } from "@/lib/seo/route-data";

type BrandDetailRouteProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: BrandDetailRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandForRoute(slug);

  if (!brand) {
    return {
      robots: {
        follow: false,
        index: false,
      },
      title: "Không tìm thấy thương hiệu",
    };
  }

  const title = `${brand.name} | ShopAHSO — Sản phẩm chính hãng`;
  const description = getBrandSeoDescription(brand);
  const url = absoluteUrl(`/thuong-hieu/${brand.slug}`);

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
      images: brand.bannerUrl || brand.logoUrl ? [absoluteUrl(brand.bannerUrl || brand.logoUrl || "/logo.png")] : [absoluteUrl("/logo.png")],
      title,
      type: "website",
      url,
    },
  };
}

export default async function BrandDetailRoute({ params }: BrandDetailRouteProps) {
  const { slug } = await params;
  const brand = await getBrandForRoute(slug);

  if (!brand) {
    notFound();
  }

  return (
    <>
      <JsonLd id="shopahso-brand-breadcrumb-jsonld" data={buildBrandBreadcrumbJsonLd(brand)} />
      <BrandDetailPage slug={brand.slug} />
    </>
  );
}
