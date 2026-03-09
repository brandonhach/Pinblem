import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Star,
  Shield,
  MessageCircle,
  RefreshCw,
  ShoppingCart,
  Send,
} from "lucide-react";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import ListingCard from "@/components/ListingCard";
import TradeProposalDialog from "@/components/TradeProposalDialog";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { mockPins, mockSellers } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const PinDetail = () => {
  const { id } = useParams();
  const pinId = parseInt(id || "1");

  const pin = mockPins.find((p) => p.id === pinId) || mockPins[0];
  const seller = mockSellers.find((s) => s.id === pin.sellerId) || mockSellers[0];

  const [liked, setLiked] = useState(pin.isFavorite || false);
  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const [isTradeLoading, setIsTradeLoading] = useState(false);
  const [messageDrawerOpen, setMessageDrawerOpen] = useState(false);
  const [firstMessage, setFirstMessage] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSendFirstMessage = () => {
    if (!firstMessage.trim()) return;
    toast({ title: "Message sent!", description: `Your message to ${seller.username} has been sent.` });
    setMessageDrawerOpen(false);
    setFirstMessage("");
  };

  const handleProposeTrade = async () => {
    setIsTradeLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsTradeLoading(false);
    setIsTradeOpen(true);
  };

  const similarPins = mockPins
    .filter((p) => p.category === pin.category && p.id !== pin.id)
    .slice(0, 4);
  const sellerPins = mockPins
    .filter((p) => p.sellerId === pin.sellerId && p.id !== pin.id)
    .slice(0, 4);

  const conditionStyles: Record<string, string> = {
    new: "bg-success-light text-success",
    "like-new": "bg-accent text-accent-foreground",
    good: "bg-warning-light text-warning",
    fair: "bg-muted text-muted-foreground",
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < Math.floor(rating) ? "fill-warning text-warning" : "text-muted-foreground"
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Back Button */}
      <div className="container px-4 py-3">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <main className="container px-4 pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Image Section */}
            <div className="space-y-3">
              <div className="relative aspect-square bg-muted rounded-xl overflow-hidden">
                <img src={pin.image} alt={pin.title} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    className="w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
                    onClick={() => setLiked(!liked)}
                  >
                    <Heart
                      className={cn(
                        "h-4 w-4",
                        liked
                          ? "fill-destructive text-destructive"
                          : "text-muted-foreground"
                      )}
                    />
                  </button>
                  <button className="w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors">
                    <Share2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                {pin.isTradeOnly && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    Trade Only
                  </div>
                )}
                <div
                  className={cn(
                    "absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                    conditionStyles[pin.condition]
                  )}
                >
                  {pin.condition.replace("-", " ")}
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="space-y-4">
              <div>
                <h1 className="font-display text-xl md:text-2xl font-bold text-foreground">
                  {pin.title}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-2xl font-bold text-primary">
                    {pin.isTradeOnly ? "Trade Only" : `$${pin.price}`}
                  </span>
                  <span className="px-2.5 py-1 rounded-full border border-border text-xs font-medium capitalize text-foreground">
                    {pin.listingType}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{pin.location}</span>
              </div>

              {/* Seller Card */}
              <Link to={`/profile/${seller.id}`} className="block card-tactile p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl">
                    {seller.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{seller.username}</span>
                      {seller.verified && (
                        <span className="group/badge relative">
                          <Shield className="h-4 w-4 text-primary" />
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover/badge:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            Verified
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="flex">{renderStars(seller.rating)}</div>
                      <span className="text-xs text-muted-foreground">({seller.totalReviews})</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {seller.totalSales} sales
                  </div>
                </div>
              </Link>

              <div>
                <h3 className="font-display font-semibold text-foreground mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{pin.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {pin.isTradeOnly ? (
                  <Button className="flex-1 gap-2" onClick={handleProposeTrade} disabled={isTradeLoading}>
                    {isTradeLoading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Loading…
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Propose Trade
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button className="flex-1 gap-2" onClick={() => toast({ title: "Order placed!", description: `You bought "${pin.title}" for $${pin.price}.` })}>
                      <ShoppingCart className="h-4 w-4" />
                      Buy Now
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={handleProposeTrade} disabled={isTradeLoading}>
                      {isTradeLoading ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Loading…
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Offer Trade
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
              <Button variant="ghost" className="w-full gap-2" onClick={() => setMessageDrawerOpen(true)}>
                <MessageCircle className="h-4 w-4" />
                Message Seller
              </Button>
            </div>
          </div>

          {/* Similar Items */}
          {similarPins.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-lg font-semibold text-foreground mb-4">
                Similar Items
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-stretch auto-rows-fr">
                {similarPins.map((p) => (
                  <ListingCard key={p.id} pin={p} to={`/pin/${p.id}`} />
                ))}
              </div>
            </section>
          )}

          {/* More from Seller */}
          {sellerPins.length > 0 && (
            <section className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  More from {seller.username}
                </h2>
                <Link to={`/profile/${seller.id}`}>
                  <Button variant="ghost" size="sm" className="text-primary">
                    View All
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-stretch auto-rows-fr">
                {sellerPins.map((p) => (
                  <ListingCard key={p.id} pin={p} to={`/pin/${p.id}`} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <TradeProposalDialog
        open={isTradeOpen}
        onOpenChange={setIsTradeOpen}
        listingTitle={pin.title}
      />

      {/* Message Seller Drawer */}
      <Drawer open={messageDrawerOpen} onOpenChange={setMessageDrawerOpen}>
        <DrawerContent>
          <div className="p-5 pb-8 max-w-lg mx-auto w-full">
            {/* Header with live indicator */}
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-muted/60">
              <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl shrink-0">
                {seller.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground text-sm">{seller.username}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  <span className="text-xs text-muted-foreground">Usually responds {seller.responseTime}</span>
                </div>
              </div>
            </div>

            {/* Pin context */}
            <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-muted/40 border border-border">
              <img src={pin.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-foreground truncate">{pin.title}</div>
                <div className="text-xs text-primary font-semibold">
                  {pin.isTradeOnly ? "Trade Only" : `$${pin.price}`}
                </div>
              </div>
            </div>

            {/* Message input */}
            <Textarea
              placeholder={`Hi ${seller.username}, I'm interested in "${pin.title}"...`}
              value={firstMessage}
              onChange={(e) => setFirstMessage(e.target.value)}
              className="min-h-[100px] mb-3 resize-none"
              autoFocus
            />
            <Button
              onClick={handleSendFirstMessage}
              disabled={!firstMessage.trim()}
              className="w-full gap-2"
            >
              <Send className="h-4 w-4" />
              Send Message
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default PinDetail;
