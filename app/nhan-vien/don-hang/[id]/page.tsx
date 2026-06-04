import { BackofficeOrderDetailPage } from "@/components/backoffice/orders/BackofficeOrderDetailPage";
import StaffLayout from "@/components/staff/StaffLayout";

type StaffOrderDetailRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function StaffOrderDetailRoute({ params }: StaffOrderDetailRouteProps) {
  const { id } = await params;

  return (
    <StaffLayout>
      <BackofficeOrderDetailPage orderId={id} />
    </StaffLayout>
  );
}
