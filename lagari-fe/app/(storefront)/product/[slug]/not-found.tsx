import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="font-display text-3xl text-lagari-primary">Scent not found</h1>
      <Link href="/shop" className="mt-6 inline-block font-label text-lagari-brass">
        Return to shop
      </Link>
    </div>
  );
}
