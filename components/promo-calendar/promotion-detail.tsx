"use client";

import { type Promotion, getSportsbook } from "@/data/promotions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Copy,
  DollarSign,
  Gift,
  Percent,
  Shield,
  Zap,
  Users,
} from "lucide-react";
import { useState } from "react";

interface PromotionDetailProps {
  promotion: Promotion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PromotionDetail({
  promotion,
  open,
  onOpenChange,
}: PromotionDetailProps) {
  const [copied, setCopied] = useState(false);

  if (!promotion) return null;

  const sportsbook = getSportsbook(promotion.sportsbook);

  const getCategoryIcon = () => {
    switch (promotion.category) {
      case "odds-boost":
        return <Zap className="h-4 w-4" />;
      case "risk-free":
        return <Shield className="h-4 w-4" />;
      case "deposit-match":
        return <Percent className="h-4 w-4" />;
      case "free-bet":
        return <Gift className="h-4 w-4" />;
      case "parlay-insurance":
        return <Calendar className="h-4 w-4" />;
      case "referral":
        return <Users className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
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

  const copyPromoCode = () => {
    if (promotion.code) {
      navigator.clipboard.writeText(promotion.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-md overflow-hidden">
              <img
                src={sportsbook?.logo || "/placeholder.svg"}
                alt={sportsbook?.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg">
                {promotion.title}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {sportsbook?.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <Badge className={`${getCategoryColor()} w-fit`}>
              <span className="mr-1">{getCategoryIcon()}</span>
              {promotion.category
                .split("-")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
            </Badge>
            <span className="text-xs sm:text-sm font-medium">
              {formatDate(promotion.date)}
            </span>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Value</h4>
            <p className="text-xl sm:text-2xl font-bold text-primary">
              {promotion.value}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Description</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {promotion.description}
            </p>
          </div>

          {promotion.sports && promotion.sports.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Eligible Sports</h4>
              <div className="flex flex-wrap gap-1">
                {promotion.sports.map((sport) => (
                  <Badge key={sport} variant="secondary" className="text-xs">
                    {sport}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {promotion.code && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Promo Code</h4>
              <div className="flex items-center gap-2">
                <div className="bg-muted px-3 py-2 rounded-md text-xs sm:text-sm font-mono flex-grow overflow-x-auto">
                  {promotion.code}
                </div>
                <Button size="sm" variant="outline" onClick={copyPromoCode}>
                  {copied ? "Copied!" : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {promotion.terms && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Terms & Conditions</h4>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {promotion.terms}
              </p>
            </div>
          )}

          <div className="pt-4">
            <Button className="w-full">Visit {sportsbook?.name}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
