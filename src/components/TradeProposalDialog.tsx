import { useState } from "react";
import { RefreshCw, ImagePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface TradeProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingTitle: string;
}

const TradeProposalDialog = ({ open, onOpenChange, listingTitle }: TradeProposalDialogProps) => {
  const [itemName, setItemName] = useState("");
  const [condition, setCondition] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!itemName.trim()) {
      toast.error("Please enter the item name");
      return;
    }
    if (!condition) {
      toast.error("Please select a condition");
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsSubmitting(false);
    toast.success("Trade proposal sent!");
    setItemName("");
    setCondition("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Propose a Trade
          </DialogTitle>
          <DialogDescription>
            What would you like to trade for <span className="font-medium text-foreground">"{listingTitle}"</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Your Item Name</label>
            <Input
              placeholder="e.g. Mickey Mouse 25th Anniversary Pin"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Condition</label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger>
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="like-new">Like New</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Description</label>
            <Textarea
              placeholder="Describe your item, including any details about rarity, edition, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Photo (optional)</label>
            <button
              type="button"
              className="w-full border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
            >
              <ImagePlus className="h-8 w-8" />
              <span className="text-sm">Click to upload a photo</span>
            </button>
          </div>

          <Button onClick={handleSubmit} className="w-full gap-2" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Sending Proposal…
              </span>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Send Trade Proposal
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TradeProposalDialog;
