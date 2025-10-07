"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { sportsbooks } from "@/data/sportsbooks";
import { useArbitragePreferences } from "@/contexts/preferences-context";
import { Filter, Building2, Percent } from "lucide-react";

export function FiltersSheet({ children }: { children?: React.ReactNode }) {
  const { filters, updateFilters } = useArbitragePreferences();
  const allBooks = useMemo(() => sportsbooks.filter(sb => sb.isActive !== false), []);
  const [open, setOpen] = useState(false);

  const [localBooks, setLocalBooks] = useState<string[]>(filters.selectedBooks || []);
  const [minArb, setMinArb] = useState<number>(filters.minArb ?? 0);
  const [maxArb, setMaxArb] = useState<number>(filters.maxArb ?? 20);
  const [totalBetAmount, setTotalBetAmount] = useState<number>(filters.totalBetAmount ?? 200);
  const [roundBets, setRoundBets] = useState<boolean>((filters as any).roundBets ?? false);
  // Detect pro via a global hint set in page; fallback to maxArb heuristic
  const isPro = (typeof window !== 'undefined' && (window as any).__isPro) ?? false;

  // Keep local UI state in sync when preferences load or change
  useEffect(() => {
    setLocalBooks(filters.selectedBooks || []);
    setMinArb(filters.minArb ?? 0);
    setMaxArb(filters.maxArb ?? 20);
    setTotalBetAmount(filters.totalBetAmount ?? 200);
    setRoundBets((filters as any).roundBets ?? false);
  }, [filters]);

  const toggleBook = (id: string) => {
    setLocalBooks(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
  };

  const apply = async () => {
    await updateFilters({ selectedBooks: localBooks, minArb, maxArb, totalBetAmount, roundBets });
    setOpen(false);
  };

  const reset = async () => {
    const defaults = allBooks.map(b => b.id);
    setLocalBooks(defaults);
    setMinArb(0);
    setMaxArb(20);
    setTotalBetAmount(200);
    setRoundBets(false);
    await updateFilters({ selectedBooks: defaults, minArb: 0, maxArb: 20, totalBetAmount: 200, roundBets: false });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children ?? (
          <Button
            variant="outline"
            className="h-9 inline-flex items-center gap-2 rounded-md border px-3 bg-white text-slate-900 border-slate-300 hover:bg-slate-50 dark:bg-neutral-900 dark:text-white dark:border-slate-700 dark:hover:bg-neutral-800"
            title="Filters & Settings"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto bg-white dark:bg-slate-900">
        <SheetHeader>
          <SheetTitle>Filters & Settings</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-4">
          <Tabs defaultValue="books" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="books" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Sportsbooks
              </TabsTrigger>
              <TabsTrigger value="roi" className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                ROI & Amount
              </TabsTrigger>
            </TabsList>

            <TabsContent value="books" className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-muted-foreground">Choose sportsbooks to include</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setLocalBooks(allBooks.map(b => b.id))}>Select All</Button>
                  <Button variant="outline" size="sm" onClick={() => setLocalBooks([])}>Clear</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {allBooks.map((sb) => {
                  const checked = localBooks.includes(sb.id);
                  return (
                    <label
                      key={sb.id}
                      className={`flex items-center gap-3 p-2 rounded-lg border transition-colors cursor-pointer hover:bg-muted/40 ${checked ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-900/10' : ''}`}
                    >
                      <Checkbox checked={checked} onCheckedChange={() => toggleBook(sb.id)} />
                      <img src={sb.logo} alt={sb.name} className="h-5 w-5 object-contain rounded" />
                      <span className="text-sm leading-none">{sb.name}</span>
                    </label>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="roi" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Min ROI %</Label>
                  <Input type="number" value={minArb} onChange={(e) => setMinArb(Number(e.target.value))} />
                  <p className="text-xs text-muted-foreground mt-1">Only show arbs at or above this percent.</p>
                </div>
                <div>
                  <Label className="text-xs">Max ROI %</Label>
                  <Input
                    type="number"
                    value={isPro ? maxArb : Math.min(maxArb, 2)}
                    onChange={(e) => setMaxArb(Number(e.target.value))}
                    disabled={!isPro}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Hide outliers above this percent.</p>
                  {!isPro && (
                    <p className="text-xs mt-1 text-amber-700 dark:text-amber-400">
                      Locked on Free plan (max 2%). Upgrade to Pro to view higher-ROI arbs and enable Live.
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Total Bet Amount ($)</Label>
                  <Input type="number" value={totalBetAmount} onChange={(e) => setTotalBetAmount(Number(e.target.value))} />
                  <p className="text-xs text-muted-foreground mt-1">Default total stake for equal-profit splits.</p>
                </div>
                <div className="col-span-2 flex items-center justify-between rounded-md border p-3">
                  <div>
                    <div className="text-sm font-medium">Round Bet Sizes</div>
                    <div className="text-xs text-muted-foreground">Rounds each side to whole dollars to avoid odd cents.</div>
                  </div>
                  <Switch checked={roundBets} onCheckedChange={(v) => setRoundBets(!!v)} />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          <div className="flex items-center justify-between gap-2 pt-2">
            <Button variant="outline" onClick={reset}>Reset</Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={apply}>Apply</Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}


