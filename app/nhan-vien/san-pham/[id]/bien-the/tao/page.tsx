import StaffProductVariantCreate from "@/components/staff/products/StaffProductVariantCreate";

type StaffProductVariantCreatePageProps = {
  params: Promise<{ id: string }>;
};

export default async function StaffProductVariantCreatePage({ params }: StaffProductVariantCreatePageProps) {
  const { id } = await params;
  return <StaffProductVariantCreate productId={id} />;
}
