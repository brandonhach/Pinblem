import { useState } from "react";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/utils/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

interface Review {
  id: string;
  reviewer_id: string;
  reviewer_username: string;
  reviewer_avatar_url: string | null;
  rating: number;
  comment: string;
  created_at: string;
}

interface ReviewFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerId: string;
  sellerName: string;
  onReviewSubmitted?: (review: Review) => void;
}

const ReviewFormDialog = ({
  open,
  onOpenChange,
  sellerId,
  sellerName,
  onReviewSubmitted,
}: ReviewFormDialogProps) => {
  const { user, profile } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !profile) {
      toast.error("You must be logged in to leave a review");
      return;
    }
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please write a comment");
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        seller_id: sellerId,
        reviewer_id: user.id,
        reviewer_username: profile.username,
        reviewer_avatar_url: profile.avatar_url ?? null,
        rating,
        comment: comment.trim(),
      })
      .select()
      .single();

    setIsSubmitting(false);

    if (error) {
      if (error.code === "23505") {
        toast.error("You've already reviewed this seller");
      } else {
        toast.error("Could not submit review. Please try again.");
      }
      return;
    }

    toast.success("Review submitted!");
    onReviewSubmitted?.(data as Review);
    setRating(0);
    setComment("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review {sellerName}</DialogTitle>
          <DialogDescription>Share your experience with this seller.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Star rating */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Rating</label>
            <div className="flex gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  className="p-0.5"
                  onMouseEnter={() => setHoveredRating(i + 1)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(i + 1)}
                >
                  <Star
                    className={cn(
                      "h-7 w-7 transition-colors",
                      (hoveredRating || rating) > i
                        ? "fill-warning text-warning"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Comment</label>
            <Textarea
              placeholder="How was your experience?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Submitting…
              </span>
            ) : (
              "Submit Review"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewFormDialog;
