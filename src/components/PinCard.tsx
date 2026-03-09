import { Heart, MessageCircle, MapPin } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

interface PinCardProps {
  id: number;
  title: string;
  price: number;
  image: string;
  location: string;
  seller: string;
  sellerId?: number;
  sellerAvatar: string;
  isTradeOnly?: boolean;
  isFavorite?: boolean;
  condition: "new" | "like-new" | "good" | "fair";
}

const PinCard = ({
  id,
  title,
  price,
  image,
  location,
  seller,
  sellerId = 1,
  sellerAvatar,
  isTradeOnly = false,
  isFavorite = false,
  condition,
}: PinCardProps) => {
  const [liked, setLiked] = useState(isFavorite);

  const conditionColors = {
    new: "badge-success",
    "like-new": "badge-info",
    good: "badge-warning",
    fair: "badge-neutral",
  };

  return (
    <div className="card bg-card shadow-md hover:shadow-lg transition-shadow duration-200 border border-border">
      {/* Image Container */}
      <Link to={`/pin/${id}`}>
        <figure className="relative aspect-square bg-muted">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
          {/* Favorite Button */}
          <button
            className="absolute top-2 right-2 btn btn-circle btn-sm bg-card/80 backdrop-blur border-none hover:bg-card"
            onClick={(e) => {
              e.preventDefault();
              setLiked(!liked);
            }}
          >
            <Heart
              className={`h-4 w-4 ${liked ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`}
            />
          </button>
          {/* Trade Only Badge */}
          {isTradeOnly && (
            <div className="absolute top-2 left-2 badge bg-accent text-accent-foreground border-none">
              Trade Only
            </div>
          )}
          {/* Condition Badge */}
          <div className={`absolute bottom-2 left-2 badge ${conditionColors[condition]} border-none capitalize`}>
            {condition.replace("-", " ")}
          </div>
        </figure>
      </Link>

      <div className="card-body p-3 gap-2">
        {/* Title */}
        <Link to={`/pin/${id}`}>
          <h3 className="card-title text-sm font-medium text-foreground line-clamp-2 hover:text-primary transition-colors">
            {title}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">
            {isTradeOnly ? "Trade" : `$${price}`}
          </span>
          <button className="btn btn-ghost btn-xs text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
          </button>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>{location}</span>
        </div>

        {/* Seller */}
        <Link to={`/profile/${sellerId}`} className="flex items-center gap-2 pt-2 border-t border-border hover:opacity-80 transition-opacity">
          <div className="avatar placeholder">
            <div className="bg-secondary text-secondary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">
              {sellerAvatar}
            </div>
          </div>
          <span className="text-xs text-muted-foreground truncate">{seller}</span>
        </Link>
      </div>
    </div>
  );
};

export default PinCard;
