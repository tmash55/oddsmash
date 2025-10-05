"use client";

import { type Promotion, getSportsbook } from "@/data/promotions";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  DollarSign,
  Gift,
  Percent,
  Shield,
  Zap,
  Users,
} from "lucide-react";

interface PromotionCardProps {
  promotion: Promotion;
  onClick?: () => void;
}

export function PromotionCard({ promotion, onClick }: PromotionCardProps) {
  const sportsbook = getSportsbook(promotion.sportsbook);

  const getCategoryIcon = () => {
    switch (promotion.category) {
      case "odds-boost":
        return <Zap className="h-3 w-3" />;
      case "risk-free":
        return <Shield className="h-3 w-3" />;
      case "deposit-match":
        return <Percent className="h-3 w-3" />;
      case "free-bet":
        return <Gift className="h-3 w-3" />;
      case "parlay-insurance":
        return <Calendar className="h-3 w-3" />;
      case "referral":
        return <Users className="h-3 w-3" />;
      default:
        return <DollarSign className="h-3 w-3" />;
    }
  };

  const getCategoryColor = () => {
    switch (promotion.category) {
      case "odds-boost":
        return "bg-yellow-500 text-yellow-50";
      case "risk-free":
        return "bg-blue-500 text-blue-50";
      case "deposit-match":
        return "bg-green-500 text-green-50";
      case "free-bet":
        return "bg-purple-500 text-purple-50";
      case "parlay-insurance":
        return "bg-red-500 text-red-50";
      case "referral":
        return "bg-orange-500 text-orange-50";
      default:
        return "bg-gray-500 text-gray-50";
    }
  };

  return (
    <div
      className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 rounded-md border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-md overflow-hidden">
        <img
          src={sportsbook?.logo || "/placeholder.svg"}
          alt={sportsbook?.name}
          className="w-full h-full object-contain"
        />
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-[10px] sm:text-xs font-medium truncate">
            {promotion.title}
          </p>
          <Badge
            variant="outline"
            className={`hidden sm:inline-flex text-[10px] px-1 py-0 h-4 ${getCategoryColor()}`}
          >
            <span className="mr-0.5">{getCategoryIcon()}</span>
            {promotion.category
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}
          </Badge>
        </div>
        <p className="text-[8px] sm:text-[10px] text-muted-foreground truncate">
          {promotion.value}
        </p>
      </div>
    </div>
  );
}
