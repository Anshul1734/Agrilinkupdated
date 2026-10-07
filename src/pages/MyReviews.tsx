import React from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import AccountLayout from "@/components/AccountLayout";
import { Stars } from "@/components/Stars";
import { PageMessage, PageSpinner } from "@/components/PageState";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { api, ApiError } from "@/lib/api";
import { useMyReviews } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import type { MyReview } from "@/types";

const MyReviews: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useMyReviews();
  const [deleting, setDeleting] = React.useState<MyReview | null>(null);

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/reviews/${id}`),
    onSuccess: () => {
      for (const key of ["my-reviews", "reviews", "reviews-eligible", "product", "products"]) queryClient.invalidateQueries({ queryKey: [key] });
      setDeleting(null);
      toast({ title: "Review deleted" });
    },
    onError: (err) => toast({ title: "Couldn't delete the review", description: err instanceof ApiError ? err.message : undefined, variant: "destructive" }),
  });

  const items = data?.items ?? [];

  return (
    <AccountLayout title="My reviews" subtitle="Each review is tied to a delivered order.">
      {isLoading ? (
        <PageSpinner />
      ) : isError ? (
        <div className="panel"><PageMessage plate="gate" title="Your reviews didn't load" action={{ label: "Try again", onClick: () => refetch() }} /></div>
      ) : items.length === 0 ? (
        <div className="panel"><PageMessage plate="ledger" title="No reviews yet" description="When an order is delivered, you can rate its products from the order page." action={{ label: "View my orders", to: "/orders" }} /></div>
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id} className="panel flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <Link to={`/product/${r.productId}`} className="text-[15px] font-semibold hover:text-field hover:underline">{r.productName}</Link>
                <div className="mt-1 flex items-center gap-2"><Stars value={r.rating} /><span className="figure text-xs text-ink-soft">{formatDate(r.created_at)}</span></div>
                {r.comment && <p className="mt-2 whitespace-pre-line text-[14.5px] leading-relaxed">{r.comment}</p>}
              </div>
              <Button variant="ghost" size="icon-sm" aria-label={`Delete review of ${r.productName}`} className="shrink-0 text-ink-soft hover:bg-chili-wash hover:text-chili" onClick={() => setDeleting(r)}><Trash2 /></Button>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this review?</AlertDialogTitle>
            <AlertDialogDescription>Your review of {deleting?.productName} is removed and the rating recalculated. You can write a new one for this purchase afterwards.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction className="bg-chili hover:bg-chili/90" onClick={() => deleting && remove.mutate(deleting.id)}>Delete review</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AccountLayout>
  );
};

export default MyReviews;
