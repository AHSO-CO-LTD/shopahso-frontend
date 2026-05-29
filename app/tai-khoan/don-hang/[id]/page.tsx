import UserOrderDetailPage from "@/components/orders/UserOrderDetailPage";

export const metadata = {
  title: "Chi tiết đơn hàng | ShopAHSO",
};

export default async function AccountOrderDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <UserOrderDetailPage orderId={id} />;
}
