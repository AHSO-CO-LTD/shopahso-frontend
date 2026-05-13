import StaffProductAttributeManage from "@/components/staff/products/StaffProductAttributeManage";

type StaffProductAttributeManagePageProps = {
  params: Promise<{ id: string }>;
};

export default async function StaffProductAttributeManagePage({
  params,
}: StaffProductAttributeManagePageProps) {
  const { id } = await params;
  return <StaffProductAttributeManage productId={id} />;
}
