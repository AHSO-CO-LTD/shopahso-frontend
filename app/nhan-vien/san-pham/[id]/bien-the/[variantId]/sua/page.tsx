import StaffProductVariantEdit from "@/components/staff/products/StaffProductVariantEdit";

type StaffProductVariantEditPageProps = {
  params: Promise<{ id: string; variantId: string }>;
};

export default async function StaffProductVariantEditPage({ params }: StaffProductVariantEditPageProps) {
  const { id, variantId } = await params;
  return <StaffProductVariantEdit productId={id} variantId={variantId} />;
}
