"use client";

import { useEffect, useMemo, useState } from "react";
import { usePropsStream } from "@/hooks/usePropsStream";
import { fetchMarkets } from "@/lib/props-client";

export default function PropsPage() {
  const [markets, setMarkets] = useState<string[]>([]);
  const [sport, setSport] = useState<string>("nfl");
  const [market, setMarket] = useState<string>("passing_yards");
  const [scope, setScope] = useState<"pregame" | "live">("pregame");
  const [auto, setAuto] = useState<boolean>(true);
  const pro = true; // TODO: wire to plan endpoint

  useEffect(() => {
    fetchMarkets(sport).then((d) => setMarkets(d.markets || [])).catch(() => {});
  }, [sport]);

  const { rows, sids, loading, connected, error, nextPage, prevPage, refresh, canPrev, hasNext } = usePropsStream({
    enabled: pro && auto,
    sport,
    market,
    scope,
    pageSize: 100,
  });

  const version = useMemo(() => rows.length, [rows]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Props (Beta)</h1>
        <span className="text-xs text-gray-500">v{version}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Sport:</label>
          <select className="border rounded px-2 py-1 text-sm" value={sport} onChange={(e) => setSport(e.target.value)}>
            <option value="nfl">NFL</option>
            <option value="mlb">MLB</option>
            <option value="nba">NBA</option>
            <option value="wnba">WNBA</option>
          </select>
        </div>
        <button onClick={() => void refresh()} className="px-3 py-1 rounded bg-neutral-800 text-white">Refresh</button>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={auto && pro} disabled={!pro} onChange={(e) => setAuto(e.target.checked)} />
          {pro ? (connected ? "Live (SSE)" : "Live (reconnecting…)") : "Auto refresh (Pro)"}
        </label>
        <div className="ml-4 flex items-center gap-2">
          <label className="text-sm text-gray-500">Market:</label>
          <select className="border rounded px-2 py-1 text-sm" value={market} onChange={(e) => setMarket(e.target.value)}>
            {markets.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Scope:</label>
          <select className="border rounded px-2 py-1 text-sm" value={scope} onChange={(e) => setScope(e.target.value as any)}>
            <option value="pregame">Pregame</option>
            <option value="live">Live</option>
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => void prevPage()} disabled={!canPrev} className="px-2 py-1 border rounded disabled:opacity-50">Prev</button>
          <button onClick={() => void nextPage()} disabled={!hasNext} className="px-2 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      </div>

      {error ? <div className="text-red-600 text-sm">{error}</div> : null}

      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Player/Entity</th>
                <th className="p-2">Market</th>
                <th className="p-2">Line</th>
                <th className="p-2">Best Over</th>
                <th className="p-2">Best Under</th>
                <th className="p-2">Avg</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={sids[i] || i} className="border-t">
                  <td className="p-2">{r.player || r.ent}</td>
                  <td className="p-2">{r.mkt}</td>
                  <td className="p-2">{r.ln}</td>
                  <td className="p-2">{r.best?.over ? `${r.best.over.bk} ${r.best.over.price}` : "-"}</td>
                  <td className="p-2">{r.best?.under ? `${r.best.under.bk} ${r.best.under.price}` : "-"}</td>
                  <td className="p-2">{r.avg ? `${r.avg.over ?? "-"} / ${r.avg.under ?? "-"}` : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


