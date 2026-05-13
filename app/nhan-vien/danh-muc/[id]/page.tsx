import StaffCategoryDetailManager from "@/components/staff/categories/StaffCategoryDetailManager";

type StaffCategoryDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StaffCategoryDetailPage({
  params,
}: StaffCategoryDetailPageProps) {
  const { id } = await params;
  return <StaffCategoryDetailManager categoryId={id} />;
}

