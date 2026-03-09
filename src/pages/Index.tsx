import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";

import ListingCard from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { mockPins, categories } from "@/data/mockData";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-accent via-background to-primary/5 py-12 md:py-20">
        <div className="container px-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              <span>The premium pin marketplace</span>
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              Trade & Collect
              <br />
              <span className="text-primary">Rare Pins</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-lg">
              Join thousands of collectors buying, selling, and trading unique pins. 
              No clutter, no ads — just pins.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/search">
                <Button size="lg" className="gap-2">
                  Browse Listings
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/create">
                <Button variant="outline" size="lg">
                  Start Selling
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-accent/50 blur-3xl" />
      </section>

      {/* Categories */}
      <section className="py-8 border-b border-border">
        <div className="container px-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/search?category=${cat.id}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card border border-border text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors whitespace-nowrap"
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Listings */}
      <main className="container px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold text-foreground">
            Latest Listings
          </h2>
          <Link
            to="/search"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mockPins.map((pin) => (
            <ListingCard
              key={pin.id}
              pin={pin}
              to={`/pin/${pin.id}`}
            />
          ))}
        </div>

        {/* Load More */}
        <div className="flex justify-center mt-10">
          <Link to="/search">
            <Button variant="outline" size="lg">
              Browse All Pins
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Index;
