import ProductVariantDetailPage from "@/components/storefront/ProductVariantDetailPage";

type ProductVariantDetailRouteProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductVariantDetailRoute({ params }: ProductVariantDetailRouteProps) {
  const { slug } = await params;
  return <ProductVariantDetailPage slug={slug} />;
}
