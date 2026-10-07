import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Stars, StarInput } from "@/components/Stars";
import { PageSpinner } from "@/components/PageState";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api, ApiError } from "@/lib/api";
import { useEligibleReviews, useReviews } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import type { Product } from "@/types";

const PAGE = 5;

/** Verified-purchase reviews: only buyers with a delivered order for this product can write one. */
const ProductReviews: React.FC<{ product: Product }> = ({ product }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [limit, setLimit] = useState(PAGE);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const reviews = useReviews(product.id, limit);
  const eligible = useEligibleReviews(product.id, profile?.role === "Buyer");
  const target = eligible.data?.items[0];

  const submit = useMutation({
    mutationFn: () => api.post("/reviews", { orderItemId: target!.orderItemId, rating, comment }),
    onSuccess: () => {
      setRating(0);
      setComment("");
      setFormError(null);
      for (const key of ["reviews", "reviews-eligible", "product", "products", "my-reviews"]) queryClient.invalidateQueries({ queryKey: [key] });
      toast({ title: "Thanks for your review" });
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : "Couldn't save your review."),
  });

  const total = reviews.data?.total ?? 0;
  const items = reviews.data?.items ?? [];

  return (
    <section className="panel mt-4 p-4 md:p-6" aria-labelledby="reviews-heading" id="reviews">
      <h2 id="reviews-heading" className="text-lg font-bold">Ratings &amp; reviews</h2>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
        <div>
          {product.reviews > 0 ? (
            <div className="flex items-center gap-4 lg:flex-col lg:items-start">
              <span className="figure text-5xl font-extrabold leading-none">{product.rating.toFixed(1)}</span>
              <div>
                <Stars value={product.rating} className="[&_svg]:h-5 [&_svg]:w-5" />
                <p className="mt-1 text-[13px] text-ink-soft"><span className="figure">{product.reviews}</span> verified {product.reviews === 1 ? "review" : "reviews"}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-soft">No reviews yet. Only buyers whose order was delivered can review a product.</p>
          )}

          {target && (
            <form
              className="mt-5 space-y-3 rounded-lg border border-rule bg-field-wash/50 p-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!rating) return setFormError("Choose a star rating first.");
                setFormError(null);
                submit.mutate();
              }}
            >
              <div>
                <h3 className="font-bold">Rate this product</h3>
                <p className="text-xs text-ink-soft">You received it, so you can review it.</p>
              </div>
              <StarInput id="review-rating" value={rating} onChange={setRating} />
              <div className="space-y-1.5">
                <Label htmlFor="review-comment">Your review (optional)</Label>
                <Textarea id="review-comment" rows={3} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Freshness, quality, how it arrived…" />
              </div>
              {formError && <p className="text-[13px] font-medium text-chili" role="alert">{formError}</p>}
              <Button type="submit" disabled={submit.isPending}>{submit.isPending && <Loader2 className="animate-spin" />} Submit review</Button>
            </form>
          )}
        </div>

        <div>
          {reviews.isLoading ? (
            <PageSpinner />
          ) : reviews.isError ? (
            <p className="rounded-lg bg-paper-sunk py-8 text-center text-ink-soft">Reviews couldn't be loaded right now.</p>
          ) : items.length === 0 ? (
            <p className="rounded-lg bg-paper-sunk py-8 text-center text-ink-soft">Be the first to review this product after your order arrives.</p>
          ) : (
            <>
              <ul className="divide-y divide-rule">
                {items.map((r) => (
                  <li key={r.id} className="py-4 first:pt-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-field-wash text-sm font-bold text-field" aria-hidden="true">{r.reviewerName.charAt(0).toUpperCase()}</span>
                        <div>
                          <p className="text-sm font-semibold">{r.reviewerName}</p>
                          <p className="flex items-center gap-1 text-xs text-ink-soft"><BadgeCheck className="h-3.5 w-3.5 text-field" /> Verified purchase · <span className="figure">{formatDate(r.created_at)}</span></p>
                        </div>
                      </div>
                      <Stars value={r.rating} />
                    </div>
                    {r.comment && <p className="mt-2 whitespace-pre-line text-[14.5px] leading-relaxed">{r.comment}</p>}
                  </li>
                ))}
              </ul>
              {total > items.length && (
                <div className="mt-3">
                  <Button variant="outline" onClick={() => setLimit((l) => l + PAGE)} disabled={reviews.isFetching}>Show more reviews ({total - items.length})</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductReviews;
