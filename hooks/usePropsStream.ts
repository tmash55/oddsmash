"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchPropsTable, fetchPropsRows, PropsRow, PropsScope } from "@/lib/props-client";

type DiffMsg = { v?: number; add?: string[]; upd?: string[]; del?: string[] };

export function usePropsStream(opts: {
  enabled: boolean; // pro && auto
  market: string;
  scope: PropsScope;
  pageSize?: number;
}) {
  const { enabled, market, scope, pageSize = 100 } = opts;

  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sidsRef = useRef<string[]>([]);
  const [sids, setSids] = useState<string[]>([]);
  const cacheRef = useRef<Map<string, PropsRow>>(new Map());

  // initial load / reload
  const loadPage = useCallback(async (reset: boolean = false) => {
    setLoading(true);
    try {
      const res = await fetchPropsTable({ market, scope, limit: pageSize, cursor: reset ? 0 : cursor || 0 });
      sidsRef.current = res.sids;
      setSids(res.sids);
      setNextCursor(res.nextCursor);
      // hydrate cache
      const cache = cacheRef.current;
      res.rows.forEach((row, i) => {
        const sid = res.sids[i];
        if (sid && row) cache.set(sid, row);
      });
      if (reset) setCursor("0");
    } catch (e: any) {
      setError(e?.message || "fetch failed");
    } finally {
      setLoading(false);
    }
  }, [market, scope, pageSize, cursor]);

  useEffect(() => { loadPage(true); }, [market, scope, pageSize]);

  const nextPage = useCallback(async () => {
    if (!nextCursor) return;
    setCursor(nextCursor);
    await loadPage(false);
  }, [nextCursor, loadPage]);

  const prevPage = useCallback(async () => {
    const cur = Number(cursor || 0);
    const newCur = Math.max(0, cur - pageSize);
    setCursor(String(newCur));
    await loadPage(false);
  }, [cursor, pageSize, loadPage]);

  // SSE
  useEffect(() => {
    if (!enabled) { setConnected(false); return; }
    let es: EventSource | null = null;
    let backoff = 1000;
    const maxBackoff = 15000;
    const open = () => {
      es = new EventSource("/api/sse/props", { withCredentials: true });
      es.onopen = () => { setConnected(true); backoff = 1000; };
      es.onerror = () => {
        setConnected(false);
        try { es?.close(); } catch {}
        es = null;
        setTimeout(() => { backoff = Math.min(backoff * 2, maxBackoff); open(); }, backoff);
      };
      es.onmessage = async (ev) => {
        const idx = ev.data.indexOf("{");
        const json = idx >= 0 ? ev.data.slice(idx) : ev.data;
        let msg: DiffMsg;
        try { msg = JSON.parse(json); } catch { return; }

        const toUpdate = [...new Set([...(msg.add || []), ...(msg.upd || [])])]
          .filter((sid) => sidsRef.current.includes(sid));
        if (toUpdate.length) {
          for (let i = 0; i < toUpdate.length; i += 200) {
            const chunk = toUpdate.slice(i, i + 200);
            const rows = await fetchPropsRows(chunk);
            const cache = cacheRef.current;
            rows.forEach(({ sid, row }) => {
              if (row) cache.set(sid, row);
            });
          }
        }
        if (msg.del?.length) {
          const del = new Set(msg.del);
          sidsRef.current = sidsRef.current.filter((sid) => !del.has(sid));
          setSids((cur) => cur.filter((sid) => !del.has(sid)));
          const cache = cacheRef.current;
          msg.del.forEach((sid) => cache.delete(sid));
        }
      };
    };
    open();
    return () => { try { es?.close(); } catch {}; };
  }, [enabled]);

  const rows = useMemo(() => sids.map((sid) => cacheRef.current.get(sid)).filter(Boolean) as PropsRow[], [sids]);

  const refresh = useCallback(async () => { await loadPage(false); }, [loadPage]);

  const canPrev = useMemo(() => Number(cursor || 0) > 0, [cursor]);
  const hasNext = useMemo(() => nextCursor != null, [nextCursor]);

  return { rows, sids, loading, connected, error, nextPage, prevPage, refresh, canPrev, hasNext };
}


