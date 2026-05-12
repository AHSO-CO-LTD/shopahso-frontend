import StaffProductVariantList from "@/components/staff/products/StaffProductVariantList";

type StaffProductVariantListPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StaffProductVariantListPage({ params }: StaffProductVariantListPageProps) {
  const { id } = await params;
  return <StaffProductVariantList productId={id} />;
}
