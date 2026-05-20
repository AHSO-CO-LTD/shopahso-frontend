import UserOrderDetailPage from "@/components/orders/UserOrderDetailPage";

export const metadata = {
  title: "Chi tiết đơn hàng | ShopAHSO",
};

export default async function OrderDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <UserOrderDetailPage orderId={id} />;
}
