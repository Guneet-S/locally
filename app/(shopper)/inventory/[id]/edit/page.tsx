import Link from "next/link";

export default function EditProductPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-h2 text-text-primary">Edit product coming soon</p>
      <Link
        href="/inventory"
        className="mt-4 text-meta text-shopper-primary"
      >
        Back to inventory
      </Link>
    </div>
  );
}
