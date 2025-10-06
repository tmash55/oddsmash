"use client";

import { useEffect, useMemo, useState } from "react";
import { AutoToggle } from "@/components/arbs/AutoToggle";
import { Teaser } from "@/components/arbs/Teaser";
import { ArbTable } from "@/components/arbs/ArbTable";
import { useArbsView } from "@/hooks/useArbsView";
import { Button } from "@/components/ui/button";
import { TrendingUp, Target, Zap, Filter } from "lucide-react";
import { useArbitragePreferences } from "@/contexts/preferences-context";
import { FiltersSheet } from "@/components/arbs/FiltersSheet";

export default function ArbsPage() {
  // TODO: derive pro from plan cookie or tiny endpoint
  const [pro, setPro] = useState(false);
  const [auto, setAuto] = useState(false);
  const [eventId, setEventId] = useState<string | undefined>(undefined);
  const [mode, setMode] = useState<"prematch" | "live">("prematch");

  // Discover plan
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  useEffect(() => {
    const loadPlan = async () => {
      try {
        const r = await fetch("/api/me/plan", { cache: "no-store", credentials: "include" });
        if (!r.ok) throw new Error("unauth");
        const d = await r.json();
        setLoggedIn(true);
        let isPro = d.plan === "pro" || d.plan === "admin";
        if (!isPro) {
          // Silent refresh to recover from stale cookie; then re-check
          try { await fetch('/api/auth/refresh-plan?onlyIfExpLt=999999', { method: 'POST', credentials: 'include' }); } catch {}
          const r2 = await fetch("/api/me/plan", { cache: "no-store", credentials: "include" });
          if (r2.ok) {
            const d2 = await r2.json();
            isPro = d2.plan === "pro" || d2.plan === "admin";
          }
        }
        if (typeof window !== 'undefined') (window as any).__isPro = isPro;
        setPro(isPro);
        if (!isPro) setAuto(false);
      } catch {
        setLoggedIn(false);
        if (typeof window !== 'undefined') (window as any).__isPro = false;
        setPro(false);
        setAuto(false);
      }
    };
    loadPlan();
  }, []);

  const { rows, ids, changes, added, version, loading, connected, cursor, hasMore, nextPage, prevPage, refresh, prefs, prefsLoading, updateFilters, counts, authExpired, reconnectNow } = useArbsView({ pro: pro, live: auto, eventId, limit: 100, mode });
  const [refreshing, setRefreshing] = useState(false);
  const [searchLocal, setSearchLocal] = useState("");
  useEffect(() => { setSearchLocal(prefs.searchQuery || ""); }, [prefs.searchQuery]);
  useEffect(() => {
    const v = searchLocal;
    const t = setTimeout(() => {
      if (v !== prefs.searchQuery) {
        void updateFilters({ searchQuery: v });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [searchLocal]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const bestRoi = useMemo(() => rows.length ? Math.max(...rows.map(r => (r.roi_bps || 0) / 100)).toFixed(2) : "0.00", [rows]);
  const [freshFound, setFreshFound] = useState(false);
  const [freshBest, setFreshBest] = useState(false);
  const prevFoundRef = useState<number>(rows.length)[0];
  useEffect(() => {
    setFreshFound(true);
    const t = setTimeout(() => setFreshFound(false), 600);
    return () => clearTimeout(t);
  }, [rows.length]);
  useEffect(() => {
    setFreshBest(true);
    const t = setTimeout(() => setFreshBest(false), 600);
    return () => clearTimeout(t);
  }, [bestRoi]);

  // Preferences-based sportsbook filtering (client-side hide only)
  const { filters: arbFilters } = useArbitragePreferences();
  const allowed = new Set((arbFilters?.selectedBooks || []).map((s: string) => s.toLowerCase()));
  const norm = (s?: string) => (s || "").toLowerCase();
  const filteredPairs = rows.map((r, i) => ({ r, id: ids[i] }))
    .filter(({ r }) => {
      if (!arbFilters?.selectedBooks?.length) return true;
      const overOk = !r?.o?.bk || allowed.has(norm(r.o.bk));
      const underOk = !r?.u?.bk || allowed.has(norm(r.u.bk));
      return overOk && underOk;
    });
  const fRows = filteredPairs.map(p => p.r);
  const fIds = filteredPairs.map(p => p.id);

  return (
    <div className="p-4 space-y-4">
      {/* Gradient Header */}
      <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-md">
        <div className="bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 text-white px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shadow-md backdrop-blur-sm">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Arbitrage Opportunities</h2>
                <p className="text-white/80 text-sm">Risk-free profit opportunities</p>
              </div>
            </div>
            {mounted && (
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span className="text-sm text-white/80">Found</span>
                  </div>
                  <span className={`text-2xl font-bold transition-all duration-500 ${freshFound ? 'scale-110 bg-white/20 rounded px-1 -mx-1' : ''}`}>{rows.length}</span>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm text-white/80">Best</span>
                  </div>
                  <span className={`text-2xl font-bold transition-all duration-500 ${freshBest ? 'scale-110 bg-white/20 rounded px-1 -mx-1' : ''}`}>+{bestRoi}%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls Bar */}
        <div className="p-3 sm:p-4 bg-gradient-to-r from-muted/30 to-muted/10 border-t border-gray-200/60 dark:border-slate-700/60 flex items-center flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {(() => {
              const base = "h-9 px-4 rounded-md border text-sm font-medium transition-colors";
              const active = "bg-slate-900 text-white border-slate-900 dark:bg-slate-900 dark:text-white dark:border-slate-900";
              const inactive = "bg-white text-slate-900 border-slate-300 hover:bg-slate-50 dark:bg-transparent dark:text-slate-300 dark:border-slate-700";
              return (
                <>
                  <button
                    type="button"
                    className={`${base} ${mode !== 'live' ? active : inactive}`}
                    onClick={() => setMode('prematch')}
                  >
                    Pre-Match{counts ? ` ${counts.pregame}` : ''}
                  </button>
                  <button
                    type="button"
                    disabled={!pro}
                    className={`${base} ${!pro ? 'opacity-50 cursor-not-allowed' : ''} ${mode === 'live' ? active : inactive}`}
                    onClick={() => pro && setMode('live')}
                  >
                    Live{counts ? ` ${counts.live}` : ''}
                  </button>
                </>
              );
            })()}
          </div>

          <div className="flex items-center gap-2">
            <input
              className="h-9 px-3 rounded-md border bg-white/70 dark:bg-slate-900/60 text-sm"
              placeholder="Search player/team"
              value={searchLocal}
              onChange={(e) => setSearchLocal(e.target.value)}
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <AutoToggle
              enabled={auto}
              setEnabled={setAuto}
              pro={pro}
              connected={connected}
              refreshing={refreshing}
              onManual={async () => {
                try { setRefreshing(true); await refresh(); } finally { setRefreshing(false); }
              }}
            />
            <FiltersSheet />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        {authExpired && (
          <div className="w-full p-2 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-between">
            <span>Session expired. Please reconnect to resume live updates.</span>
            <Button variant="outline" onClick={reconnectNow}>Reconnect</Button>
          </div>
        )}
        {!pro && loggedIn && (
          <div className="w-full p-3 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <span>Free plan: viewing arbs up to 2% ROI. Upgrade to Pro to see all opportunities and enable auto refresh.</span>
            <Button asChild>
              <a href="/pricing">Upgrade to Pro</a>
            </Button>
          </div>
        )}
        {/* secondary controls removed to simplify UI */}
      </div>
      {!loggedIn && (
        <Teaser />
      )}
      {loggedIn && (loading || prefsLoading ? <div>Loading…</div> : <ArbTable rows={rows} ids={ids} changes={changes} added={added} totalBetAmount={prefs.totalBetAmount} />)}
    </div>
  );
}


