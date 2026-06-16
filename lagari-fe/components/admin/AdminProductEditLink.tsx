import Link from "next/link";

type Props = {
  productId: string;
  children: React.ReactNode;
  className?: string;
};

export function AdminProductEditLink({ productId, children, className }: Props) {
  return (
    <Link
      href={`/admin-panel-route/products/${productId}/edit`}
      className={className ?? "text-lagari-brass hover:underline"}
    >
      {children}
    </Link>
  );
}
