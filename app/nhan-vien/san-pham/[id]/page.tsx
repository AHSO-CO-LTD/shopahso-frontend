import StaffProductDetailManager from "@/components/staff/products/StaffProductDetailManager";

type StaffProductDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StaffProductDetailPage({ params }: StaffProductDetailPageProps) {
  const { id } = await params;
  return <StaffProductDetailManager productId={id} />;
}
