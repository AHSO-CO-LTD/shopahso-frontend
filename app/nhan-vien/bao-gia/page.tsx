import { BackofficeQuoteRequestManager } from "@/components/backoffice/quote-requests/BackofficeQuoteRequestManager";
import StaffLayout from "@/components/staff/StaffLayout";

export default function StaffQuoteRequestsPage() {
  return (
    <StaffLayout>
      <BackofficeQuoteRequestManager />
    </StaffLayout>
  );
}
