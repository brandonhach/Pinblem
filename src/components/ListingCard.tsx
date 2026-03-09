import { Heart, MapPin, Star, Clock, Shield } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { Pin } from "@/data/mockData";
import { getSellerById } from "@/data/mockData";

interface ListingCardProps {
  pin: Pin;
  /** When provided, the card navigates to this route on click */
  to?: string;
  /** Optional click handler (e.g. open drawer) */
  onClick?: () => void;
}

const ListingCard = ({ pin, to, onClick }: ListingCardProps) => {
  const [isSaved, setIsSaved] = useState(pin.isFavorite || false);
  const seller = getSellerById(pin.sellerId);
  const navigate = useNavigate();

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = diff / (1000 * 60 * 60);
    if (hours < 1) return `${Math.floor(diff / (1000 * 60))}m ago`;
    if (hours < 24) return `${Math.floor(hours)}h ago`;
    if (hours < 48) return "Yesterday";
    return `${Math.floor(hours / 24)}d ago`;
  };

  const conditionStyles = {
    new: "bg-success-light text-success",
    "like-new": "bg-accent text-accent-foreground",
    good: "bg-warning-light text-warning",
    fair: "bg-muted text-muted-foreground",
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
  };

  const handleActivate = () => {
    if (onClick) return onClick();
    if (to) return navigate(to);
  };

  return (
    <article
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (!to || onClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(to);
        }
      }}
      role={to && !onClick ? "link" : undefined}
      tabIndex={to && !onClick ? 0 : undefined}
      className="group cursor-pointer card-tactile overflow-hidden h-full flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={pin.image}
          alt={pin.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Save Button */}
        <button
          onClick={handleSaveClick}
          className={cn(
            "absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all",
            isSaved
              ? "bg-destructive text-destructive-foreground"
              : "bg-card/90 backdrop-blur-sm text-muted-foreground hover:text-foreground"
          )}
        >
          <Heart className={cn("h-4 w-4", isSaved && "fill-current")} />
        </button>

        {/* Trade Badge */}
        {pin.isTradeOnly && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
            Trade Only
          </div>
        )}

        {/* Condition Badge */}
        <div
          className={cn(
            "absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium capitalize",
            conditionStyles[pin.condition]
          )}
        >
          {pin.condition.replace("-", " ")}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 flex-1 flex flex-col gap-2">
        {/* Title */}
        <h3 className="font-display text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {pin.title}
        </h3>

        {/* Price & Location */}
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-primary">
            {pin.isTradeOnly ? "Trade" : `$${pin.price}`}
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate max-w-[80px]">{pin.location}</span>
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formatTimeAgo(pin.createdAt)}</span>
        </div>

        {/* Seller with Rating */}
        <Link
          to={`/profile/${seller.id}`}
          onClick={(e) => e.stopPropagation()}
          className="mt-auto flex items-center gap-2 pt-2 border-t border-border hover:opacity-80 transition-opacity"
        >
          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs shrink-0">
            {seller.avatar}
          </div>
          <span className="text-xs text-muted-foreground truncate flex-1 inline-flex items-center gap-1">
            {seller.username}
            {seller.verified && (
              <span className="group/badge relative shrink-0" title="Verified">
                <Shield className="h-3 w-3 text-primary" />
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover/badge:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Verified
                </span>
              </span>
            )}
          </span>
          <div className="flex items-center gap-0.5 shrink-0">
            <Star className="h-3 w-3 fill-warning text-warning" />
            <span className="text-xs font-medium text-foreground">{seller.rating}</span>
          </div>
        </Link>
      </div>
    </article>
  );
};

export default ListingCard;