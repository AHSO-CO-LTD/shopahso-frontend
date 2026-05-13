import StaffCategoryAttributeTemplateManage from "@/components/staff/categories/StaffCategoryAttributeTemplateManage";

type StaffCategoryAttributeTemplateManagePageProps = {
  params: Promise<{ id: string }>;
};

export default async function StaffCategoryAttributeTemplateManagePage({
  params,
}: StaffCategoryAttributeTemplateManagePageProps) {
  const { id } = await params;
  return <StaffCategoryAttributeTemplateManage categoryId={id} />;
}
