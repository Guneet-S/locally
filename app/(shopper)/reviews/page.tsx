import { redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { formatDistanceToNow } from "date-fns";
import { Star, MessageSquare } from "lucide-react";

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  shoppee_id: string;
};

export default async function ReviewsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?role=shopper");

  const supabase = createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", profile.id)
    .maybeSingle();

  if (!store) redirect("/setup");

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, shoppee_id")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .returns<ReviewRow[]>();

  const shoppeeIds = reviews?.map((r) => r.shoppee_id) ?? [];
  const { data: reviewers } =
    shoppeeIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", shoppeeIds)
      : { data: [] };

  const reviewerMap = new Map(reviewers?.map((r) => [r.id, r.full_name]) ?? []);

  return (
    <div className="px-4 pb-20 pt-10">
      <h1 className="text-h1 text-text-primary">Reviews</h1>

      {reviews && reviews.length > 0 ? (
        <div className="mt-5 flex flex-col gap-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-[10px] border-[0.5px] border-border-subtle bg-surface p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-h3 text-text-primary">
                  {reviewerMap.get(review.shoppee_id) ?? "Anonymous"}
                </p>
                <span className="text-meta text-text-tertiary">
                  {formatDistanceToNow(new Date(review.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <div className="mt-1 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    strokeWidth={1.5}
                    fill={i < review.rating ? "currentColor" : "none"}
                    className={
                      i < review.rating
                        ? "text-shopper-primary"
                        : "text-surface-dim"
                    }
                  />
                ))}
              </div>
              {review.comment && (
                <p className="mt-2 text-body text-text-secondary">
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-16 flex flex-col items-center text-center">
          <MessageSquare size={40} strokeWidth={1.5} className="text-surface-dim" />
          <p className="mt-3 text-h3 text-text-primary">No reviews yet</p>
          <p className="mt-1 text-body text-text-secondary">
            Reviews from customers will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
