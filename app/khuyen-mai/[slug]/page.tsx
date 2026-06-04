import PublicPromotionDetailPage from "@/components/promotions/PublicPromotionDetailPage";

type PromotionDetailRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PromotionDetailRoute({ params }: PromotionDetailRouteProps) {
  const { slug } = await params;

  return <PublicPromotionDetailPage slug={slug} />;
}
