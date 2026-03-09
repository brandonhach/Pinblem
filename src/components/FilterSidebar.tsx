import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { categories } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface FilterSidebarProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  selectedConditions: string[];
  setSelectedConditions: (conditions: string[]) => void;
  listingType: string;
  setListingType: (type: string) => void;
  onClearFilters: () => void;
  className?: string;
}

const conditions = [
  { id: "new", label: "New" },
  { id: "like-new", label: "Like New" },
  { id: "good", label: "Good" },
  { id: "fair", label: "Fair" },
];

const listingTypes = [
  { id: "all", label: "All Listings" },
  { id: "buy", label: "Buy Now" },
  { id: "trade", label: "Trade Only" },
];

const FilterSidebar = ({
  selectedCategory,
  setSelectedCategory,
  priceRange,
  setPriceRange,
  selectedConditions,
  setSelectedConditions,
  listingType,
  setListingType,
  onClearFilters,
  className,
}: FilterSidebarProps) => {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    condition: true,
    type: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleConditionChange = (conditionId: string) => {
    if (selectedConditions.includes(conditionId)) {
      setSelectedConditions(selectedConditions.filter((c) => c !== conditionId));
    } else {
      setSelectedConditions([...selectedConditions, conditionId]);
    }
  };

  const hasActiveFilters =
    selectedCategory !== "all" ||
    priceRange[0] > 0 ||
    priceRange[1] < 200 ||
    selectedConditions.length > 0 ||
    listingType !== "all";

  return (
    <aside className={cn("w-64 shrink-0", className)}>
      <div className="sticky top-20 space-y-1">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h2 className="font-display font-semibold text-foreground">Filters</h2>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3 mr-1" />
              Clear all
            </Button>
          )}
        </div>

        {/* Categories */}
        <div className="py-4 border-b border-border">
          <button
            onClick={() => toggleSection("category")}
            className="flex items-center justify-between w-full text-sm font-medium text-foreground mb-3"
          >
            Categories
            {expandedSections.category ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {expandedSections.category && (
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                    selectedCategory === cat.id
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Price Range */}
        <div className="py-4 border-b border-border">
          <button
            onClick={() => toggleSection("price")}
            className="flex items-center justify-between w-full text-sm font-medium text-foreground mb-3"
          >
            Price Range
            {expandedSections.price ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {expandedSections.price && (
            <div className="space-y-4 px-1">
              <Slider
                value={priceRange}
                onValueChange={(value) => setPriceRange(value as [number, number])}
                max={200}
                min={0}
                step={5}
                className="w-full"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>${priceRange[0]}</span>
                <span>${priceRange[1]}+</span>
              </div>
            </div>
          )}
        </div>

        {/* Condition */}
        <div className="py-4 border-b border-border">
          <button
            onClick={() => toggleSection("condition")}
            className="flex items-center justify-between w-full text-sm font-medium text-foreground mb-3"
          >
            Condition
            {expandedSections.condition ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {expandedSections.condition && (
            <div className="space-y-2">
              {conditions.map((condition) => (
                <label
                  key={condition.id}
                  className="flex items-center gap-3 px-1 py-1.5 cursor-pointer group"
                >
                  <Checkbox
                    checked={selectedConditions.includes(condition.id)}
                    onCheckedChange={() => handleConditionChange(condition.id)}
                  />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {condition.label}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Listing Type */}
        <div className="py-4">
          <button
            onClick={() => toggleSection("type")}
            className="flex items-center justify-between w-full text-sm font-medium text-foreground mb-3"
          >
            Listing Type
            {expandedSections.type ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {expandedSections.type && (
            <div className="space-y-1">
              {listingTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setListingType(type.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    listingType === type.id
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;
