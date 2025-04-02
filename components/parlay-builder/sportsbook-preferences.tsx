"use client";

import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { sportsbooks } from "@/data/sportsbooks";
import { useSportsbooks } from "@/contexts/sportsbook-context";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

export function SportsbookPreferences() {
  const { userSportsbooks, setUserSportsbooks } = useSportsbooks();

  const toggleSportsbook = (sportsbookId: string) => {
    if (userSportsbooks.includes(sportsbookId)) {
      // Don't allow deselecting if it's the last one
      if (userSportsbooks.length === 1) return;
      setUserSportsbooks(userSportsbooks.filter(id => id !== sportsbookId));
    } else {
      // Don't allow more than 5 selections
      if (userSportsbooks.length >= 5) return;
      setUserSportsbooks([...userSportsbooks, sportsbookId]);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sportsbook Preferences</DialogTitle>
          <DialogDescription>
            Select up to 5 sportsbooks to compare odds from. You must select at least one sportsbook.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {sportsbooks.map((sportsbook) => (
              <div
                key={sportsbook.id}
                className="flex items-center space-x-4 rounded-lg border p-4"
              >
                <Checkbox
                  id={sportsbook.id}
                  checked={userSportsbooks.includes(sportsbook.id)}
                  onCheckedChange={() => toggleSportsbook(sportsbook.id)}
                  disabled={
                    !userSportsbooks.includes(sportsbook.id) &&
                    userSportsbooks.length >= 5
                  }
                />
                <div className="flex flex-1 items-center space-x-3">
                  <img
                    src={sportsbook.logo}
                    alt={sportsbook.name}
                    className="h-6 w-6"
                  />
                  <label
                    htmlFor={sportsbook.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {sportsbook.name}
                  </label>
                </div>
                {userSportsbooks.includes(sportsbook.id) && (
                  <span className="text-xs text-muted-foreground">
                    Selected
                  </span>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="text-xs text-muted-foreground mt-4">
          {userSportsbooks.length}/5 sportsbooks selected
        </div>
      </DialogContent>
    </Dialog>
  );
} 