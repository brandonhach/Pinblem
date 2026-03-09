import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Heart, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import SignedOutGuard from "@/components/SignedOutGuard";
import ListingCard from "@/components/ListingCard";
import ListingDrawer from "@/components/ListingDrawer";
import { Button } from "@/components/ui/button";
import { mockPins, type Pin } from "@/data/mockData";
import { toast } from "sonner";

const SavedItems = () => {
  const [savedPins, setSavedPins] = useState<Pin[]>(
    mockPins.filter(p => p.isFavorite)
  );
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleRemove = (pinId: number) => {
    setSavedPins(prev => prev.filter(p => p.id !== pinId));
    toast.success("Removed from saved items");
  };

  const handleCardClick = (pin: Pin) => {
    setSelectedPin(pin);
    setIsDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <SignedOutGuard message="Sign in to view your saved items.">

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
          <div className="flex items-center gap-3 mb-6">
            <Heart className="h-6 w-6 text-destructive fill-destructive" />
            <h1 className="font-display text-2xl font-bold text-foreground">Saved Items</h1>
            <span className="text-sm text-muted-foreground">({savedPins.length})</span>
          </div>

          {savedPins.length === 0 ? (
            <div className="card-tactile p-12 text-center">
              <div className="text-4xl mb-4">💝</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No saved items yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Tap the heart icon on any listing to save it here
              </p>
              <Link to="/search">
                <Button>Browse Listings</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch auto-rows-fr">
              {savedPins.map((pin) => (
                <div key={pin.id} className="relative group/saved h-full">
                  <ListingCard pin={pin} onClick={() => handleCardClick(pin)} />
                  <button
                    onClick={() => handleRemove(pin.id)}
                    className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center opacity-0 group-hover/saved:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <ListingDrawer
        pin={selectedPin}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
      </SignedOutGuard>
    </div>
  );
};

export default SavedItems;