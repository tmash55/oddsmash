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
import {
  Settings2,
  Loader2,
  Check,
  Info,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { sportsbooks } from "@/data/sportsbooks";
import {
  useSportsbookPreferences,
  STATE_CODES,
  LEGAL_BETTING_STATES,
} from "@/hooks/use-sportsbook-preferences";
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
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export function SportsbookSelector() {
  const {
    selectedSportsbooks,
    toggleSportsbook,
    selectAll,
    clearAll,
    maxSelections,
    userState,
    setUserState,
  } = useSportsbookPreferences();
  const { toast } = useToast();

  const [tempSelections, setTempSelections] =
    useState<string[]>(selectedSportsbooks);
  const [tempState, setTempState] = useState<string>(userState);
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [activeTab, setActiveTab] = useState<"sportsbooks" | "location">(
    "sportsbooks"
  );

  // Improved media queries for better responsiveness
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isSmallMobile = useMediaQuery("(max-width: 380px)");

  // Reset temp selections when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setTempSelections(selectedSportsbooks);
      setTempState(userState);
      setActiveTab("sportsbooks");
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
    // Check what has changed
    const sportsbooksChanged =
      tempSelections.length !== selectedSportsbooks.length ||
      tempSelections.some((id) => !selectedSportsbooks.includes(id));

    const stateChanged = tempState !== userState;

    // Only trigger a refresh if something has changed
    const hasChanges = sportsbooksChanged || stateChanged;

    if (hasChanges) {
      setIsSaving(true);
      try {
        // Show appropriate toast message based on what changed
        if (sportsbooksChanged && stateChanged) {
          toast({
            title: "Settings Updated",
            description: `Your sportsbooks and location (${tempState}) have been updated. Refreshing page...`,
            duration: 3000,
          });
        } else if (sportsbooksChanged) {
          toast({
            title: "Sportsbooks Updated",
            description:
              "Your sportsbook selections have been updated. Refreshing page...",
            duration: 3000,
          });
        } else if (stateChanged) {
          toast({
            title: "Location Updated",
            description: `Your location has been updated to ${tempState}. Refreshing page...`,
            duration: 3000,
          });
        }

        // Update the stored preferences
        toggleSportsbook(tempSelections);

        // Update the state if changed
        if (stateChanged) {
          setUserState(tempState);
        }

        // Add a small delay before refreshing to allow the toast to be seen
        setTimeout(() => {
          // Force a full page refresh instead of client-side navigation
          window.location.reload();
        }, 1000);
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

  // Group states by legal status
  const legalStates = Object.entries(STATE_CODES)
    .filter(([_, code]) => LEGAL_BETTING_STATES.includes(code))
    .sort((a, b) => a[0].localeCompare(b[0]));

  const otherStates = Object.entries(STATE_CODES)
    .filter(([_, code]) => !LEGAL_BETTING_STATES.includes(code))
    .sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            size={isSmallMobile ? "sm" : "default"}
            className="gap-1.5 border-border/60 bg-background/80 hover:bg-background/90 hover:border-primary/30 transition-all duration-200"
          >
            <Settings2
              className={cn(
                "text-primary/70",
                isSmallMobile ? "h-3.5 w-3.5" : "h-4 w-4"
              )}
            />
            <span className={isSmallMobile ? "text-sm" : ""}>Sportsbooks</span>
            <Badge
              variant="outline"
              className={cn(
                "ml-1 bg-primary/10 text-primary text-xs",
                isSmallMobile && "text-[10px] px-1.5 py-0",
                tempSelections.length === maxSelections &&
                  "bg-green-500/10 text-green-500"
              )}
            >
              {selectedSportsbooks.length}/{maxSelections}
            </Badge>
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent
        className={cn(
          "p-0 overflow-hidden",
          isMobile
            ? "w-[calc(100vw-32px)] max-w-[calc(100vw-32px)] h-[80vh] max-h-[80vh] rounded-lg"
            : "sm:max-w-[450px] max-h-[85vh]"
        )}
      >
        <DialogHeader className={cn("px-4 sm:px-6 pt-4 sm:pt-6 pb-2")}>
          <DialogTitle className={cn("text-xl", isSmallMobile && "text-lg")}>
            Sportsbook Settings
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1.5 flex-wrap">
            <span className={isSmallMobile ? "text-xs" : ""}>
              Customize your sportsbook preferences
            </span>
            <TooltipProvider>
              <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
                <TooltipTrigger asChild onClick={(e) => e.preventDefault()}>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent
                  side={isMobile ? "bottom" : "right"}
                  className="max-w-[300px] p-3"
                >
                  <p className="text-sm">
                    Select your state to get state-specific sportsbook links and
                    choose which sportsbooks to compare.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value: "sportsbooks" | "location") =>
            setActiveTab(value)
          }
          className="px-4 sm:px-6 py-2"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="sportsbooks"
              className="flex items-center gap-1.5"
            >
              <Settings2
                className={cn("h-4 w-4", isSmallMobile && "h-3.5 w-3.5")}
              />
              <span className={isSmallMobile ? "text-xs" : ""}>
                Sportsbooks
              </span>
            </TabsTrigger>
            <TabsTrigger value="location" className="flex items-center gap-1.5">
              <MapPin
                className={cn("h-4 w-4", isSmallMobile && "h-3.5 w-3.5")}
              />
              <span className={isSmallMobile ? "text-xs" : ""}>Location</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === "sportsbooks" && (
          <>
            <div className={cn("px-4 sm:px-6 py-2")}>
              <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                <div
                  className={cn(
                    "text-sm text-muted-foreground",
                    isSmallMobile && "text-xs"
                  )}
                >
                  {tempSelections.length} of {maxSelections} selected
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className={cn(
                      "h-8 font-medium",
                      isSmallMobile
                        ? "text-[10px] px-1.5 h-7"
                        : isMobile
                        ? "text-[11px] px-2"
                        : "text-xs"
                    )}
                    disabled={tempSelections.length === maxSelections}
                  >
                    Select First {maxSelections}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className={cn(
                      "h-8 font-medium",
                      isSmallMobile
                        ? "text-[10px] px-1.5 h-7"
                        : isMobile
                        ? "text-[11px] px-2"
                        : "text-xs"
                    )}
                    disabled={tempSelections.length <= 1}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              <Progress value={selectionPercentage} className="h-1.5" />
            </div>

            <ScrollArea
              className={cn(
                "px-4 sm:px-6 py-4",
                isMobile ? "flex-1 max-h-[calc(80vh-220px)]" : "max-h-[400px]"
              )}
            >
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {sportsbooks.map((sportsbook) => {
                    const isSelected = tempSelections.includes(sportsbook.id);
                    const atMaxSelections =
                      tempSelections.length >= maxSelections;
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
                              : "cursor-pointer",
                            isMobile && "p-3", // Adjusted padding
                            isSmallMobile && "p-2.5" // Even smaller padding for very small screens
                          )}
                          onClick={() =>
                            !disabled && handleToggle(sportsbook.id)
                          }
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "relative flex-shrink-0",
                                isSmallMobile
                                  ? "w-6 h-6"
                                  : isMobile
                                  ? "w-7 h-7"
                                  : "w-6 h-6"
                              )}
                            >
                              <img
                                src={sportsbook.logo || "/placeholder.svg"}
                                alt={sportsbook.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <span
                              className={cn(
                                "font-medium",
                                isSmallMobile
                                  ? "text-sm"
                                  : isMobile && "text-base"
                              )}
                            >
                              {sportsbook.name}
                            </span>
                          </div>

                          <div className="flex items-center">
                            {isSelected ? (
                              <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                className={cn(
                                  "rounded-full bg-primary flex items-center justify-center",
                                  isSmallMobile
                                    ? "h-5 w-5"
                                    : isMobile
                                    ? "h-6 w-6"
                                    : "h-5 w-5"
                                )}
                              >
                                <Check
                                  className={cn(
                                    "text-white",
                                    isSmallMobile
                                      ? "h-3 w-3"
                                      : isMobile
                                      ? "h-4 w-4"
                                      : "h-3 w-3"
                                  )}
                                />
                              </motion.div>
                            ) : (
                              <div
                                className={cn(
                                  "rounded-full border-2 border-muted-foreground/30",
                                  isSmallMobile
                                    ? "h-5 w-5"
                                    : isMobile
                                    ? "h-6 w-6"
                                    : "h-5 w-5"
                                )}
                              />
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
              <div
                className={cn(
                  "px-4 sm:px-6 py-2 bg-green-500/10 border-t border-green-500/20 flex items-center gap-2",
                  isMobile && "py-3"
                )}
              >
                <AlertCircle
                  className={cn(
                    "h-4 w-4 text-green-500",
                    isSmallMobile && "h-3.5 w-3.5"
                  )}
                />
                <span
                  className={cn(
                    "text-sm text-green-600 dark:text-green-400",
                    isSmallMobile && "text-xs"
                  )}
                >
                  Maximum number of sportsbooks selected
                </span>
              </div>
            )}
          </>
        )}

        {activeTab === "location" && (
          <div className="px-4 sm:px-6 py-4 flex-1 overflow-y-auto max-h-[calc(80vh-180px)]">
            <div className="space-y-4">
              <div>
                <label
                  className={cn(
                    "text-sm font-medium mb-1.5 block",
                    isSmallMobile && "text-xs"
                  )}
                >
                  Select Your State
                </label>
                <Select value={tempState} onValueChange={setTempState}>
                  <SelectTrigger className={isSmallMobile ? "h-8 text-xs" : ""}>
                    <SelectValue placeholder="Select a state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[40vh]">
                    <div className="py-1.5 px-2 text-xs font-semibold text-muted-foreground">
                      Legal Betting States
                    </div>
                    {legalStates.map(([stateName, stateCode]) => (
                      <SelectItem
                        key={stateCode}
                        value={stateCode}
                        className={isSmallMobile ? "text-xs" : ""}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-8 text-xs font-mono">
                            {stateCode}
                          </span>
                          <span className="capitalize">{stateName}</span>
                        </div>
                      </SelectItem>
                    ))}

                    <div className="py-1.5 px-2 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                      Other States
                    </div>

                    {otherStates.map(([stateName, stateCode]) => (
                      <SelectItem
                        key={stateCode}
                        value={stateCode}
                        className={isSmallMobile ? "text-xs" : ""}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-8 text-xs font-mono">
                            {stateCode}
                          </span>
                          <span className="capitalize">{stateName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <h3
                  className={cn(
                    "text-sm font-medium mb-2 flex items-center gap-1.5",
                    isSmallMobile && "text-xs"
                  )}
                >
                  <Info
                    className={cn(
                      "h-4 w-4 text-primary",
                      isSmallMobile && "h-3.5 w-3.5"
                    )}
                  />
                  Why set your state?
                </h3>
                <p
                  className={cn(
                    "text-sm text-muted-foreground",
                    isSmallMobile && "text-xs"
                  )}
                >
                  Setting your state helps us provide you with the correct
                  sportsbook links. Some sportsbooks like BetRivers and BetMGM
                  require state-specific URLs.
                </p>

                {!LEGAL_BETTING_STATES.includes(tempState) && (
                  <div
                    className={cn(
                      "mt-3 bg-yellow-500/10 p-3 rounded-md border border-yellow-500/20 text-sm text-yellow-600 dark:text-yellow-400",
                      isSmallMobile && "text-xs p-2.5"
                    )}
                  >
                    <AlertCircle
                      className={cn(
                        "h-4 w-4 inline-block mr-1.5",
                        isSmallMobile && "h-3.5 w-3.5"
                      )}
                    />
                    Sports betting may not be legal in {tempState}. Some links
                    may not work.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter
          className={cn(
            "px-4 sm:px-6 py-4 border-t",
            isMobile && "flex-col gap-2"
          )}
        >
          {isMobile ? (
            <>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                  "w-full relative overflow-hidden transition-all h-12 text-base",
                  isSmallMobile && "h-10 text-sm",
                  isSaving ? "pl-10" : ""
                )}
              >
                {isSaving && (
                  <Loader2
                    className={cn(
                      "absolute left-3 h-5 w-5 animate-spin",
                      isSmallMobile && "h-4 w-4"
                    )}
                  />
                )}
                {isSaving ? "Saving Changes..." : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSaving}
                className={cn(
                  "w-full h-11 text-base border-border/60",
                  isSmallMobile && "h-9 text-sm"
                )}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
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
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
