import StaffProductVariantImport from "@/components/staff/products/StaffProductVariantImport";

type StaffProductVariantImportPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StaffProductVariantImportPage({ params }: StaffProductVariantImportPageProps) {
  const { id } = await params;
  return <StaffProductVariantImport productId={id} />;
}
