import { useState } from "react";

const categories = [
  { id: "all", label: "All", emoji: "✨" },
  { id: "disney", label: "Disney", emoji: "🏰" },
  { id: "universal", label: "Universal", emoji: "🎢" },
  { id: "marvel", label: "Marvel", emoji: "🦸" },
  { id: "starwars", label: "Star Wars", emoji: "⭐" },
  { id: "pixar", label: "Pixar", emoji: "🎬" },
  { id: "apparel", label: "Apparel", emoji: "👕" },
  { id: "rare", label: "Rare", emoji: "💎" },
];

interface CategoryFilterProps {
  onCategoryChange?: (category: string) => void;
}

const CategoryFilter = ({ onCategoryChange }: CategoryFilterProps) => {
  const [activeCategory, setActiveCategory] = useState("all");

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    onCategoryChange?.(categoryId);
  };

  return (
    <div className="w-full overflow-x-auto scrollbar-hide py-3">
      <div className="flex gap-2 px-4 min-w-max">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`btn btn-sm gap-1 ${
              activeCategory === category.id
                ? 'btn-primary'
                : 'btn-ghost bg-card border border-border'
            }`}
          >
            <span>{category.emoji}</span>
            <span>{category.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
