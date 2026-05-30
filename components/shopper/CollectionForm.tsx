"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  createCollectionAction,
  updateCollectionAction,
} from "@/app/(shopper)/collections/actions";

export type ProductOption = {
  id: string;
  name: string;
  photo_urls: string[];
  price: number | null;
};

interface Props {
  mode: "create" | "edit";
  ownerId: string;
  storeId: string;
  initial?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    cover_image_url: string | null;
  };
  products: ProductOption[]; // for create: all active products; for edit: not used (handled separately)
  selectedProductIds?: string[]; // only used in create mode
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function CollectionForm({
  mode,
  ownerId,
  initial,
  products,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [coverUrl, setCoverUrl] = useState<string | null>(
    initial?.cover_image_url ?? null
  );
  const [uploading, setUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  function handleNameChange(v: string) {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  async function handleCoverUpload(file: File) {
    setUploading(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      });
      const supabase = createClient();
      const ext = compressed.name.split(".").pop() ?? "jpg";
      const path = `${ownerId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("collection-covers")
        .upload(path, compressed, { upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage
        .from("collection-covers")
        .getPublicUrl(path);
      setCoverUrl(pub.publicUrl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  function toggleProduct(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    startTransition(async () => {
      if (mode === "create") {
        const res = await createCollectionAction({
          name,
          slug,
          description,
          cover_image_url: coverUrl,
          product_ids: Array.from(selectedIds),
        });
        if ("error" in res) {
          toast.error(res.error);
          return;
        }
        toast.success("Collection created");
        router.push("/collections");
        router.refresh();
      } else {
        if (!initial) return;
        const res = await updateCollectionAction({
          id: initial.id,
          name,
          slug,
          description,
          cover_image_url: coverUrl,
        });
        if ("error" in res) {
          toast.error(res.error);
          return;
        }
        toast.success("Collection updated");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Name */}
      <div>
        <label className="block text-meta text-text-secondary">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="mt-1 w-full rounded-[10px] border border-border-subtle bg-surface px-3 py-2.5 text-body text-text-primary outline-none focus:border-shopper-primary"
          placeholder="Festive Collection"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-meta text-text-secondary">Slug</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => {
            setSlug(slugify(e.target.value));
            setSlugTouched(true);
          }}
          className="mt-1 w-full rounded-[10px] border border-border-subtle bg-surface px-3 py-2.5 text-body text-text-primary outline-none focus:border-shopper-primary"
          placeholder="festive-collection"
        />
        <p className="mt-1 text-[10px] text-text-tertiary">
          Used in the public URL: /store/your-store/collection/{slug || "..."}
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-meta text-text-secondary">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 w-full resize-none rounded-[10px] border border-border-subtle bg-surface px-3 py-2.5 text-body text-text-primary outline-none focus:border-shopper-primary"
          placeholder="A short description..."
        />
      </div>

      {/* Cover image */}
      <div>
        <label className="block text-meta text-text-secondary">
          Cover image (optional)
        </label>
        {coverUrl ? (
          <div className="relative mt-1 h-32 w-full overflow-hidden rounded-[10px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverUrl}
              alt="Cover"
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => setCoverUrl(null)}
              className="absolute right-2 top-2 rounded-full bg-black/70 p-1"
            >
              <X size={14} strokeWidth={1.5} className="text-white" />
            </button>
          </div>
        ) : (
          <label className="mt-1 flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-[10px] border border-dashed border-border-subtle bg-shopper-light">
            {uploading ? (
              <p className="text-meta text-text-secondary">Uploading...</p>
            ) : (
              <>
                <Upload
                  size={20}
                  strokeWidth={1.5}
                  className="text-shopper-primary"
                />
                <p className="mt-1 text-meta text-text-secondary">
                  Tap to upload
                </p>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleCoverUpload(f);
              }}
            />
          </label>
        )}
      </div>

      {/* Product picker (create mode only) */}
      {mode === "create" && (
        <div>
          <label className="block text-meta text-text-secondary">
            Add products ({selectedIds.size} selected)
          </label>
          {products.length === 0 ? (
            <p className="mt-2 text-meta text-text-secondary italic">
              You have no active products yet. Add products first, then return
              here.
            </p>
          ) : (
            <div className="mt-1 flex max-h-80 flex-col gap-1 overflow-y-auto rounded-[10px] border border-border-subtle bg-surface p-2">
              {products.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center gap-2 rounded-[8px] p-2 hover:bg-shopper-light"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p.id)}
                    onChange={() => toggleProduct(p.id)}
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
                  <div className="flex-1">
                    <p className="line-clamp-1 text-meta text-text-primary">
                      {p.name}
                    </p>
                    {p.price !== null && (
                      <p className="text-[10px] text-text-secondary">
                        Rs. {p.price.toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={pending || uploading}
        className="rounded-[10px] bg-shopper-primary py-3 text-button text-white disabled:opacity-50"
      >
        {pending
          ? "Saving..."
          : mode === "create"
            ? "Create collection"
            : "Save changes"}
      </button>
    </div>
  );
}
