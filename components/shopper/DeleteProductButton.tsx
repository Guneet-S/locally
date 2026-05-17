"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteProductAction } from "@/app/(shopper)/inventory/actions";

export default function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Delete this product?")) return;
    const result = await deleteProductAction(productId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Product deleted");
      router.refresh();
    }
  };

  return (
    <button onClick={handleDelete} className="text-meta text-danger">
      Delete
    </button>
  );
}
