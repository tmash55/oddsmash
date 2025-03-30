"use client";

import { useState } from "react";
import Image from "next/image";
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
import { Settings2, Loader2 } from "lucide-react";
import { sportsbooks } from "@/data/sportsbooks";
import { useSportsbookPreferences } from "@/hooks/use-sportsbook-preferences";
import { useRouter, usePathname } from "next/navigation";

export function SportsbookSelector() {
  const { selectedSportsbooks, toggleSportsbook, selectAll, clearAll, maxSelections } = useSportsbookPreferences();
  const [tempSelections, setTempSelections] = useState<string[]>(selectedSportsbooks);
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Reset temp selections when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setTempSelections(selectedSportsbooks);
    }
    setOpen(open);
  };

  const handleToggle = (id: string) => {
    setTempSelections(prev => {
      if (prev.includes(id)) {
        // Don't allow deselecting if it's the last one
        if (prev.length === 1) return prev;
        return prev.filter(sbId => sbId !== id);
      }
      // Don't allow adding if already at max selections
      if (prev.length >= maxSelections) return prev;
      return [...prev, id];
    });
  };

  const handleSelectAll = () => {
    setTempSelections(sportsbooks.map(sb => sb.id).slice(0, maxSelections));
  };

  const handleClearAll = () => {
    setTempSelections([tempSelections[0]]);
  };

  const handleSave = async () => {
    // Only trigger a refresh if the selections have changed
    const hasChanges = tempSelections.length !== selectedSportsbooks.length ||
      tempSelections.some(id => !selectedSportsbooks.includes(id));

    if (hasChanges) {
      setIsSaving(true);
      try {
        // Update the stored preferences
        toggleSportsbook(tempSelections);
        
        // Force a hard navigation to the current page to reset all server components
        router.push(pathname);
      } finally {
        setIsSaving(false);
      }
    }

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Sportsbooks ({selectedSportsbooks.length}/{maxSelections})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Sportsbooks</DialogTitle>
          <DialogDescription>
            Select up to {maxSelections} sportsbooks to compare odds.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={handleSelectAll}>
            Select First {maxSelections}
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearAll}>
            Clear All
          </Button>
        </div>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {sportsbooks.map((sportsbook) => {
              const isSelected = tempSelections.includes(sportsbook.id);
              const atMaxSelections = tempSelections.length >= maxSelections;
              const disabled = !isSelected && atMaxSelections;

              return (
                <div
                  key={sportsbook.id}
                  className={`flex items-center justify-between p-2 rounded-lg border hover:bg-accent ${
                    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  onClick={() => !disabled && handleToggle(sportsbook.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-8 w-8">
                      <Image
                        src={sportsbook.logo}
                        alt={sportsbook.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="font-medium">{sportsbook.name}</span>
                  </div>
                  <div
                    className={`h-4 w-4 rounded-full border-2 ${
                      isSelected
                        ? "bg-primary border-primary"
                        : "border-muted-foreground"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 