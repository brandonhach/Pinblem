import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpCircle, Eye, MessageCircle, Edit, Trash2, Clock, MapPin, Calendar } from "lucide-react";
import Navbar from "@/components/Navbar";
import SignedOutGuard from "@/components/SignedOutGuard";
import { Button } from "@/components/ui/button";
import { mockPins } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CURRENT_USER_ID = 1;

const MyListings = () => {
  const [listings, setListings] = useState(
    mockPins.filter(p => p.sellerId === CURRENT_USER_ID).map(p => ({
      ...p,
      views: Math.floor(Math.random() * 200) + 20,
      inquiries: Math.floor(Math.random() * 10),
      bumpedAt: p.bumpedAt || null,
    }))
  );

  const conditionStyles: Record<string, string> = {
    new: "bg-success-light text-success",
    "like-new": "bg-accent text-accent-foreground",
    good: "bg-warning-light text-warning",
    fair: "bg-muted text-muted-foreground",
  };

  const handleBump = (pinId: number) => {
    setListings(prev =>
      prev.map(p =>
        p.id === pinId
          ? { ...p, bumpedAt: new Date().toISOString() }
          : p
      )
    );
    toast.success("Listing bumped to the top! 🚀");
  };

  const handleDelete = (pinId: number) => {
    setListings(prev => prev.filter(p => p.id !== pinId));
    toast.success("Listing deleted");
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <SignedOutGuard message="Sign in to view and manage your listings.">

      <div className="container px-4 py-3">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <main className="container px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display text-2xl font-bold text-foreground">My Listings</h1>
            <Link to="/create">
              <Button className="gap-2">
                <Edit className="h-4 w-4" />
                New Listing
              </Button>
            </Link>
          </div>

          {listings.length === 0 ? (
            <div className="card-tactile p-12 text-center">
              <div className="text-4xl mb-4">📌</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No listings yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Start selling your pins!</p>
              <Link to="/create">
                <Button>Create Your First Listing</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map((listing) => (
                <div key={listing.id} className="card-tactile overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    {/* Image */}
                    <Link to={`/pin/${listing.id}`} className="sm:w-40 shrink-0">
                      <div className="aspect-video sm:aspect-square bg-muted overflow-hidden">
                        <img
                          src={listing.image}
                          alt={listing.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    </Link>

                    {/* Details */}
                    <div className="flex-1 p-4 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link to={`/pin/${listing.id}`}>
                            <h3 className="font-display font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                              {listing.title}
                            </h3>
                          </Link>
                          <span className="text-lg font-bold text-primary">
                            {listing.isTradeOnly ? "Trade Only" : `$${listing.price}`}
                          </span>
                        </div>
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium capitalize shrink-0",
                          conditionStyles[listing.condition]
                        )}>
                          {listing.condition.replace("-", " ")}
                        </span>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Listed {formatDate(listing.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {listing.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {listing.views} views
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {listing.inquiries} inquiries
                        </span>
                      </div>

                      {listing.bumpedAt && (
                        <div className="flex items-center gap-1 text-xs text-primary font-medium">
                          <ArrowUpCircle className="h-3 w-3" />
                          Bumped {formatDate(listing.bumpedAt)}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 mt-auto pt-2 border-t border-border">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-primary border-primary/30 hover:bg-primary/10"
                          onClick={() => handleBump(listing.id)}
                        >
                          <ArrowUpCircle className="h-3.5 w-3.5" />
                          Bump Listing
                        </Button>
                        <Link to={`/create?edit=${listing.id}`}>
                          <Button size="sm" variant="outline" className="gap-1.5">
                            <Edit className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => handleDelete(listing.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      </SignedOutGuard>
    </div>
  );
};

export default MyListings;