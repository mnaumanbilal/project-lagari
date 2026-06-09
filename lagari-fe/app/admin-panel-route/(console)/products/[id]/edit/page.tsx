import { AdminProductForm } from "@/components/admin/AdminProductForm";

type Props = { params: Promise<{ id: string }> };

export default async function AdminEditProductPage({ params }: Props) {
  const { id } = await params;
  return <AdminProductForm productId={id} />;
}
