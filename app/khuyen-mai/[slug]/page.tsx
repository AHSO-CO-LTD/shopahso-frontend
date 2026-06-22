import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicPromotionDetailPage from "@/components/promotions/PublicPromotionDetailPage";
import JsonLd from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/seo/config";
import { buildPromotionBreadcrumbJsonLd, getPromotionSeoDescription } from "@/lib/seo/schema";
import { getPromotionForRoute } from "@/lib/seo/route-data";

type PromotionDetailRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PromotionDetailRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const promotion = await getPromotionForRoute(slug);

  if (!promotion) {
    return {
      robots: {
        follow: false,
        index: false,
      },
      title: "Không tìm thấy khuyến mãi",
    };
  }

  const title = `${promotion.name} | ShopAHSO`;
  const description = getPromotionSeoDescription(promotion);
  const url = absoluteUrl(`/khuyen-mai/${promotion.slug}`);

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
      images: promotion.bannerImageUrl ? [absoluteUrl(promotion.bannerImageUrl)] : [absoluteUrl("/logo.png")],
      title,
      type: "website",
      url,
    },
  };
}

export default async function PromotionDetailRoute({ params }: PromotionDetailRouteProps) {
  const { slug } = await params;
  const promotion = await getPromotionForRoute(slug);

  if (!promotion) {
    notFound();
  }

  return (
    <>
      <JsonLd id="shopahso-promotion-breadcrumb-jsonld" data={buildPromotionBreadcrumbJsonLd(promotion)} />
      <PublicPromotionDetailPage slug={promotion.slug} />
    </>
  );
}
