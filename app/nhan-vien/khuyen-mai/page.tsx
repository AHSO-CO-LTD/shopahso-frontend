import StaffLayout from "@/components/staff/StaffLayout";
import StaffPromotionManager from "@/components/staff/promotions/StaffPromotionManager";

export default function StaffPromotionsPage() {
  return (
    <StaffLayout>
      <StaffPromotionManager />
    </StaffLayout>
  );
}
