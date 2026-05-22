import { BackofficeOrderManager } from "@/components/backoffice/orders/BackofficeOrderManager";
import StaffLayout from "@/components/staff/StaffLayout";

export default function StaffOrdersPage() {
  return (
    <StaffLayout>
      <BackofficeOrderManager />
    </StaffLayout>
  );
}
