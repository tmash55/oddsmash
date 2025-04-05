"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings2, Loader2, Check, Info, AlertCircle } from "lucide-react";
import { sportsbooks } from "@/data/sportsbooks";
import { useSportsbookPreferences } from "@/hooks/use-sportsbook-preferences";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function SportsbookSelector() {
  const {
    selectedSportsbooks,
    toggleSportsbook,
    selectAll,
    clearAll,
    maxSelections,
  } = useSportsbookPreferences();

  const [tempSelections, setTempSelections] =
    useState<string[]>(selectedSportsbooks);
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Reset temp selections when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setTempSelections(selectedSportsbooks);
    }
    setOpen(open);
  };

  const handleToggle = (id: string) => {
    setTempSelections((prev) => {
      if (prev.includes(id)) {
        // Don't allow deselecting if it's the last one
        if (prev.length === 1) return prev;
        return prev.filter((sbId) => sbId !== id);
      }
      // Don't allow adding if already at max selections
      if (prev.length >= maxSelections) return prev;
      return [...prev, id];
    });
  };

  const handleSelectAll = () => {
    setTempSelections(sportsbooks.map((sb) => sb.id).slice(0, maxSelections));
  };

  const handleClearAll = () => {
    setTempSelections([tempSelections[0]]);
  };

  const handleSave = async () => {
    // Only trigger a refresh if the selections have changed
    const hasChanges =
      tempSelections.length !== selectedSportsbooks.length ||
      tempSelections.some((id) => !selectedSportsbooks.includes(id));

    if (hasChanges) {
      setIsSaving(true);
      try {
        // Update the stored preferences
        toggleSportsbook(tempSelections);

        // Force a full page refresh instead of client-side navigation
        window.location.reload();
      } finally {
        setIsSaving(false);
      }
    }

    setOpen(false);
  };

  // Auto-hide the tooltip after 3 seconds
  useEffect(() => {
    if (showTooltip) {
      const timer = setTimeout(() => {
        setShowTooltip(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showTooltip]);

  // Calculate selection percentage for progress bar
  const selectionPercentage = (tempSelections.length / maxSelections) * 100;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-border/60 bg-background/80 hover:bg-background/90 hover:border-primary/30 transition-all duration-200"
          >
            <Settings2 className="h-4 w-4 text-primary/70" />
            <span>Sportsbooks</span>
            <Badge
              variant="outline"
              className={cn(
                "ml-1 bg-primary/10 text-primary text-xs",
                tempSelections.length === maxSelections &&
                  "bg-green-500/10 text-green-500"
              )}
            >
              {selectedSportsbooks.length}/{maxSelections}
            </Badge>
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl">Select Sportsbooks</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <span>
              Select up to {maxSelections} sportsbooks to compare odds.
            </span>
            <TooltipProvider>
              <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
                <TooltipTrigger asChild onClick={(e) => e.preventDefault()}>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[300px] p-3">
                  <p className="text-sm">
                    Selecting more sportsbooks allows you to compare more odds,
                    but may affect performance.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-2">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm text-muted-foreground">
              {tempSelections.length} of {maxSelections} selected
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-8 text-xs font-medium"
                disabled={tempSelections.length === maxSelections}
              >
                Select First {maxSelections}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-8 text-xs font-medium"
                disabled={tempSelections.length <= 1}
              >
                Clear All
              </Button>
            </div>
          </div>

          <Progress value={selectionPercentage} className="h-1.5" />
        </div>

        <ScrollArea className="h-[400px] px-6 py-4">
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {sportsbooks.map((sportsbook) => {
                const isSelected = tempSelections.includes(sportsbook.id);
                const atMaxSelections = tempSelections.length >= maxSelections;
                const disabled = !isSelected && atMaxSelections;

                return (
                  <motion.div
                    key={sportsbook.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-all duration-200",
                        isSelected
                          ? "bg-primary/5 border-primary/30"
                          : "hover:bg-accent/50",
                        disabled
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      )}
                      onClick={() => !disabled && handleToggle(sportsbook.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 relative flex-shrink-0">
                          <img
                            src={sportsbook.logo || "/placeholder.svg"}
                            alt={sportsbook.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="font-medium">{sportsbook.name}</span>
                      </div>

                      <div className="flex items-center">
                        {isSelected ? (
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            className="h-5 w-5 rounded-full bg-primary flex items-center justify-center"
                          >
                            <Check className="h-3 w-3 text-white" />
                          </motion.div>
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {tempSelections.length === maxSelections && (
          <div className="px-6 py-2 bg-green-500/10 border-t border-green-500/20 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600 dark:text-green-400">
              Maximum number of sportsbooks selected
            </span>
          </div>
        )}

        <DialogFooter className="px-6 py-4 border-t">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSaving}
            className="border-border/60"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "relative overflow-hidden transition-all",
              isSaving ? "pl-10" : ""
            )}
          >
            {isSaving && (
              <Loader2 className="absolute left-3 h-4 w-4 animate-spin" />
            )}
            {isSaving ? "Saving Changes..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
