import BrandDetailPage from "@/components/storefront/BrandDetailPage";

type BrandDetailRouteProps = {
  params: Promise<{ slug: string }>;
};

export default async function BrandDetailRoute({ params }: BrandDetailRouteProps) {
  const { slug } = await params;
  return <BrandDetailPage slug={slug} />;
}
