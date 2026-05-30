"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Trash2, Plus } from "lucide-react";
import {
  addProductsAction,
  removeProductAction,
  reorderProductAction,
  deleteCollectionAction,
} from "@/app/(shopper)/collections/actions";

type ProductLite = {
  id: string;
  name: string;
  photo_urls: string[];
  price: number | null;
};

interface Props {
  collectionId: string;
  collectionName: string;
  inCollection: ProductLite[];
  available: ProductLite[];
}

export default function CollectionProductManager({
  collectionId,
  collectionName,
  inCollection,
  available,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set());
  const [deleteOpen, setDeleteOpen] = useState(false);

  function togglePick(id: string) {
    setPickedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAdd() {
    if (pickedIds.size === 0) {
      setPickerOpen(false);
      return;
    }
    startTransition(async () => {
      const res = await addProductsAction({
        collection_id: collectionId,
        product_ids: Array.from(pickedIds),
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Products added");
      setPickedIds(new Set());
      setPickerOpen(false);
      router.refresh();
    });
  }

  function handleRemove(productId: string) {
    startTransition(async () => {
      const res = await removeProductAction({
        collection_id: collectionId,
        product_id: productId,
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleReorder(productId: string, direction: "up" | "down") {
    startTransition(async () => {
      const res = await reorderProductAction({
        collection_id: collectionId,
        product_id: productId,
        direction,
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteCollectionAction(collectionId);
      // deleteCollectionAction redirects, so we only get here on error
      if (res && "error" in res) {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Products in collection */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-h3 text-text-primary">
            Products ({inCollection.length})
          </h3>
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="flex items-center gap-1 rounded-[10px] border border-shopper-primary px-2.5 py-1.5 text-meta text-shopper-primary"
          >
            <Plus size={12} strokeWidth={1.5} />
            Add products
          </button>
        </div>

        {inCollection.length === 0 ? (
          <p className="mt-3 text-meta text-text-secondary italic">
            No products in this collection yet.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {inCollection.map((p, idx) => (
              <li
                key={p.id}
                className="flex items-center gap-2 rounded-[10px] border border-border-subtle bg-surface p-2"
              >
                {p.photo_urls?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.photo_urls[0]}
                    alt={p.name}
                    className="h-12 w-12 rounded-[6px] object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-[6px] bg-shopper-light" />
                )}
                <div className="flex-1">
                  <p className="line-clamp-1 text-body text-text-primary">
                    {p.name}
                  </p>
                  {p.price !== null && (
                    <p className="text-meta text-text-secondary">
                      Rs. {p.price.toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handleReorder(p.id, "up")}
                    disabled={pending || idx === 0}
                    className="rounded-[6px] border border-border-subtle p-1 disabled:opacity-30"
                  >
                    <ArrowUp size={12} strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReorder(p.id, "down")}
                    disabled={pending || idx === inCollection.length - 1}
                    className="rounded-[6px] border border-border-subtle p-1 disabled:opacity-30"
                  >
                    <ArrowDown size={12} strokeWidth={1.5} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(p.id)}
                  disabled={pending}
                  className="ml-1 rounded-[6px] p-1.5 text-[#DC2626] disabled:opacity-30"
                  aria-label="Remove from collection"
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add-products picker */}
      {pickerOpen && (
        <div className="rounded-[10px] border border-shopper-primary bg-surface p-3">
          <p className="text-meta text-text-secondary">
            Select products to add
          </p>
          {available.length === 0 ? (
            <p className="mt-2 text-meta text-text-secondary italic">
              All your active products are already in this collection.
            </p>
          ) : (
            <div className="mt-2 max-h-72 overflow-y-auto">
              {available.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center gap-2 rounded-[8px] p-2 hover:bg-shopper-light"
                >
                  <input
                    type="checkbox"
                    checked={pickedIds.has(p.id)}
                    onChange={() => togglePick(p.id)}
                    className="h-4 w-4 accent-shopper-primary"
                  />
                  {p.photo_urls?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.photo_urls[0]}
                      alt={p.name}
                      className="h-10 w-10 rounded-[6px] object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-[6px] bg-shopper-light" />
                  )}
                  <p className="line-clamp-1 flex-1 text-meta text-text-primary">
                    {p.name}
                  </p>
                </label>
              ))}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setPickedIds(new Set());
                setPickerOpen(false);
              }}
              className="flex-1 rounded-[10px] border border-border-subtle py-2 text-meta text-text-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={pending || pickedIds.size === 0}
              className="flex-1 rounded-[10px] bg-shopper-primary py-2 text-meta text-white disabled:opacity-50"
            >
              Add {pickedIds.size > 0 ? `(${pickedIds.size})` : ""}
            </button>
          </div>
        </div>
      )}

      {/* Delete collection */}
      <div className="mt-4 border-t border-border-subtle pt-4">
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="flex items-center gap-1.5 text-meta text-[#DC2626]"
        >
          <Trash2 size={12} strokeWidth={1.5} />
          Delete collection
        </button>
      </div>

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-[10px] bg-surface p-5">
            <p className="text-h3 text-text-primary">Delete collection?</p>
            <p className="mt-2 text-body text-text-secondary">
              &ldquo;{collectionName}&rdquo; will be permanently removed. Your
              products are not deleted.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="flex-1 rounded-[10px] border border-border-subtle py-2.5 text-button text-text-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                className="flex-1 rounded-[10px] bg-[#DC2626] py-2.5 text-button text-white disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
