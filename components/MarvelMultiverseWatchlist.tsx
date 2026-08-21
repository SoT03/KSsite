"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ITEMS, ITEM_MAP, UNIVERSES, type UniverseId, type WatchItem } from "@/lib/marvel-watchlist-data";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function MarvelMultiverseWatchlist() {
  const [watched, setWatched] = useState<Set<string>>(() => new Set());
  const [posters, setPosters] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<UniverseId>("mcu");
  const [loaded, setLoaded] = useState(false);

  // Load this user's watch progress and cached poster art from the server on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [watchlistRes, postersRes] = await Promise.all([fetch("/api/watchlist"), fetch("/api/posters")]);
        if (!cancelled && watchlistRes.ok) {
          const data = await watchlistRes.json();
          const ids: string[] = data.watchedItemIds ?? [];
          setWatched(new Set(ids.filter((id: string) => id in ITEM_MAP)));
        }
        if (!cancelled && postersRes.ok) {
          const data = await postersRes.json();
          setPosters(data.posters ?? {});
        }
      } catch {
        // Network hiccup — the widget still works, just without saved progress/art this load.
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isWatched = (id: string) => watched.has(id);

  const isLocked = (item: WatchItem) => (item.requires ?? []).some((reqId) => !watched.has(reqId));

  // Reverse lookup: which items does watching this item help unlock next? Stores ids, not
  // titles, so the render can hide the name of anything that's still locked by other
  // prerequisites — otherwise this would leak locked titles as spoilers.
  const unlocksMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const item of ITEMS) {
      for (const reqId of item.requires ?? []) {
        if (!map[reqId]) map[reqId] = [];
        map[reqId].push(item.id);
      }
    }
    return map;
  }, []);

  const toggleWatched = (item: WatchItem) => {
    if (!isWatched(item.id) && isLocked(item)) return;
    const nextWatchedState = !isWatched(item.id);
    setWatched((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      return next;
    });
    fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, watched: nextWatchedState }),
    }).catch(() => {
      // Best-effort sync — local state already reflects the toggle so the UI stays responsive;
      // the next successful load will reconcile with the server if this write was lost.
    });
  };

  const totalCount = ITEMS.length;
  const watchedCount = watched.size;
  const globalPercent = totalCount === 0 ? 0 : Math.round((watchedCount / totalCount) * 100);

  const universeStats = useMemo(() => {
    const stats: Record<UniverseId, { watched: number; total: number; percent: number }> = {} as Record<
      UniverseId,
      { watched: number; total: number; percent: number }
    >;
    for (const universe of UNIVERSES) {
      const items = ITEMS.filter((item) => item.universe === universe.id);
      const watchedInUniverse = items.filter((item) => watched.has(item.id)).length;
      stats[universe.id] = {
        watched: watchedInUniverse,
        total: items.length,
        percent: items.length === 0 ? 0 : Math.round((watchedInUniverse / items.length) * 100),
      };
    }
    return stats;
  }, [watched]);

  const groupedPhases = useMemo(() => {
    const items = ITEMS.filter((item) => item.universe === activeTab);
    const order: string[] = [];
    const groups: Record<string, WatchItem[]> = {};
    for (const item of items) {
      if (!groups[item.phase]) {
        groups[item.phase] = [];
        order.push(item.phase);
      }
      groups[item.phase].push(item);
    }
    return order.map((phase) => ({ phase, items: groups[phase] }));
  }, [activeTab]);

  if (!loaded) {
    return (
      <div className="mmw-root">
        <style>{CSS}</style>
        <div className="mmw-card mmw-global-card">Loading your watchlist…</div>
      </div>
    );
  }

  return (
    <div className="mmw-root">
      <style>{CSS}</style>

      {/* Section 1: Global Progress */}
      <div className="mmw-card mmw-global-card">
        <div className="mmw-global-header">
          <h2 className="mmw-heading">Multiverse Progress</h2>
          <span className="mmw-global-count">
            {watchedCount} of {totalCount}
          </span>
        </div>
        <div className="mmw-progress-track mmw-progress-track--lg">
          <div
            className="mmw-progress-fill"
            style={{ width: `${globalPercent}%` }}
          />
        </div>
        <div className="mmw-global-percent">{globalPercent}% complete</div>
      </div>

      <div className="mmw-layout">
        {/* Section 2: Universe Tabs */}
        <div className="mmw-tabs-col">
          <h3 className="mmw-subheading">Universes</h3>
          <div className="mmw-tabs">
            {UNIVERSES.map((universe) => {
              const stats = universeStats[universe.id];
              const isActive = activeTab === universe.id;
              const isComplete = stats.total > 0 && stats.watched === stats.total;
              return (
                <button
                  key={universe.id}
                  type="button"
                  className={`mmw-tab${isActive ? " mmw-tab--active" : ""}`}
                  onClick={() => setActiveTab(universe.id)}
                >
                  <div className="mmw-tab-row">
                    <span className="mmw-tab-name">{universe.name}</span>
                    <span className="mmw-tab-count">
                      {stats.watched}/{stats.total}
                    </span>
                  </div>
                  <div className="mmw-progress-track mmw-progress-track--sm">
                    <div
                      className={`mmw-progress-fill${isComplete ? " mmw-progress-fill--success" : ""}`}
                      style={{ width: `${stats.percent}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Movie Grid */}
        <div className="mmw-grid-col">
          {groupedPhases.map(({ phase, items }) => {
            const phaseComplete = items.every((item) => watched.has(item.id));
            return (
              <div key={phase} className="mmw-phase-block">
                <div className="mmw-phase-header">
                  <h4 className="mmw-phase-title">{phase}</h4>
                  {phaseComplete && <span className="mmw-badge mmw-badge--success">Complete</span>}
                </div>
                <div className="mmw-items">
                  {items.map((item) => {
                    const watchedFlag = isWatched(item.id);
                    const locked = !watchedFlag && isLocked(item);

                    if (locked) {
                      return (
                        <div
                          key={item.id}
                          data-testid={item.id}
                          className="mmw-item mmw-item--locked"
                          aria-disabled="true"
                          tabIndex={-1}
                        >
                          <div className="mmw-item-main">
                            <i className="ti ti-lock mmw-icon mmw-icon--danger" title="Locked" />
                            <span className="mmw-item-title mmw-item-title--hidden">Locked</span>
                          </div>
                        </div>
                      );
                    }

                    const recommended = (item.recommended ?? []).map((id) => ITEM_MAP[id]?.title ?? id);
                    const nextUnlocks = (unlocksMap[item.id] ?? [])
                      .filter((id) => isWatched(id) || !isLocked(ITEM_MAP[id]))
                      .map((id) => ITEM_MAP[id].title);
                    const posterUrl = posters[item.id];

                    return (
                      <div
                        key={item.id}
                        data-testid={item.id}
                        className={`mmw-item${watchedFlag ? " mmw-item--watched" : ""}`}
                        onClick={() => toggleWatched(item)}
                        role="button"
                        aria-disabled={false}
                        tabIndex={0}
                      >
                        <div className="mmw-item-main">
                          {posterUrl && (
                            <Image
                              src={posterUrl}
                              alt=""
                              width={80}
                              height={120}
                              className="mmw-item-poster"
                              unoptimized
                            />
                          )}
                          <input
                            type="checkbox"
                            checked={watchedFlag}
                            readOnly
                            className="mmw-checkbox"
                          />
                          <span className={`mmw-item-title${watchedFlag ? " mmw-item-title--watched" : ""}`}>
                            {item.title}
                            {item.episodes && <span className="mmw-item-episodes"> ({item.episodes} ep)</span>}
                          </span>
                          <span className="mmw-item-icons">
                            {watchedFlag && <i className="ti ti-check mmw-icon mmw-icon--success" title="Watched" />}
                            {recommended.length > 0 && (
                              <i className="ti ti-alert-circle mmw-icon mmw-icon--warning" title="Has recommendations" />
                            )}
                          </span>
                        </div>

                        {recommended.length > 0 && (
                          <div className="mmw-recommend-badge">
                            <i className="ti ti-alert-circle mmw-icon" />
                            Recommended: {recommended.join(", ")}
                          </div>
                        )}

                        {nextUnlocks.length > 0 && (
                          <div className="mmw-unlocks-hint">
                            <i className="ti ti-sparkles mmw-icon mmw-icon--accent" />
                            Unlocks: {nextUnlocks.join(", ")}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const CSS = `
.mmw-root {
  /* Internal aliases (--mmw-*) avoid self-referencing the public token names
     directly — "--surface-1: var(--surface-1, #fallback)" is a cyclic
     declaration per the CSS spec and resolves to an invalid/empty value in
     every browser, silently killing colors and backgrounds. Consumers can
     still override by defining --surface-1 etc. higher in the DOM. */
  --mmw-surface-1: var(--surface-1, #16181d);
  --mmw-surface-2: var(--surface-2, #1e2128);
  --mmw-text-primary: var(--text-primary, #f2f3f5);
  --mmw-text-secondary: var(--text-secondary, #9aa0ab);
  --mmw-text-danger: var(--text-danger, #f87171);
  --mmw-text-warning: var(--text-warning, #facc15);
  --mmw-text-accent: var(--text-accent, #818cf8);
  --mmw-text-success: var(--text-success, #4ade80);
  --mmw-border: var(--border, rgba(255, 255, 255, 0.12));
  --mmw-bg-success: var(--bg-success, rgba(74, 222, 128, 0.14));
  --mmw-bg-warning: var(--bg-warning, rgba(250, 204, 21, 0.14));
  --mmw-fill-accent: var(--fill-accent, #6366f1);
  --mmw-radius: var(--radius, 10px);

  font-family: inherit;
  color: var(--mmw-text-primary);
  max-width: 1100px;
  margin: 0 auto;
}

.mmw-card {
  background: var(--mmw-surface-1);
  border: 0.5px solid var(--mmw-border);
  border-radius: var(--mmw-radius);
  padding: 1rem 1.25rem;
}

.mmw-global-card {
  margin-bottom: 1rem;
}

.mmw-global-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 0.6rem;
}

.mmw-heading {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0;
}

.mmw-subheading {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--mmw-text-secondary);
  margin: 0 0 0.6rem 0;
}

.mmw-global-count {
  font-size: 0.85rem;
  color: var(--mmw-text-secondary);
}

.mmw-global-percent {
  margin-top: 0.4rem;
  font-size: 0.8rem;
  color: var(--mmw-text-secondary);
}

.mmw-progress-track {
  width: 100%;
  background: var(--mmw-surface-2);
  border-radius: 999px;
  overflow: hidden;
  border: 0.5px solid var(--mmw-border);
}

.mmw-progress-track--lg {
  height: 10px;
}

.mmw-progress-track--sm {
  height: 6px;
  margin-top: 0.45rem;
}

.mmw-progress-fill {
  height: 100%;
  background: var(--mmw-fill-accent);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.mmw-progress-fill--success {
  background: var(--mmw-text-success);
}

.mmw-layout {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  flex-wrap: wrap;
}

.mmw-tabs-col {
  flex: 0 0 260px;
  min-width: 220px;
}

.mmw-tabs {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mmw-tab {
  display: block;
  width: 100%;
  text-align: left;
  background: var(--mmw-surface-1);
  border: 0.5px solid var(--mmw-border);
  border-radius: var(--mmw-radius);
  padding: 0.65rem 0.8rem;
  cursor: pointer;
  color: var(--mmw-text-primary);
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.mmw-tab:hover {
  background: var(--mmw-surface-2);
  transform: translateY(-1px);
}

.mmw-tab--active {
  background: var(--mmw-surface-2);
  border-color: var(--mmw-fill-accent);
}

.mmw-tab-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.mmw-tab-name {
  font-size: 0.9rem;
  font-weight: 600;
}

.mmw-tab-count {
  font-size: 0.78rem;
  color: var(--mmw-text-secondary);
}

.mmw-grid-col {
  flex: 1 1 480px;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mmw-phase-block {
  background: var(--mmw-surface-1);
  border: 0.5px solid var(--mmw-border);
  border-radius: var(--mmw-radius);
  padding: 0.9rem 1rem;
}

.mmw-phase-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.7rem;
}

.mmw-phase-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
}

.mmw-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.mmw-badge--success {
  background: var(--mmw-bg-success);
  color: var(--mmw-text-success);
}

.mmw-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mmw-item {
  background: var(--mmw-surface-2);
  border: 0.5px solid var(--mmw-border);
  border-radius: var(--mmw-radius);
  padding: 0.6rem 0.75rem;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
}

.mmw-item:hover {
  border-color: var(--mmw-fill-accent);
}

.mmw-item--watched {
  background: var(--mmw-bg-success);
}

.mmw-item--locked {
  cursor: not-allowed;
  opacity: 0.6;
}

.mmw-item--locked:hover {
  border-color: var(--mmw-border);
}

.mmw-item-main {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.mmw-item-poster {
  width: 80px;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
}

.mmw-checkbox {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  accent-color: var(--mmw-fill-accent);
}

.mmw-item-title {
  flex: 1;
  font-size: 0.88rem;
}

.mmw-item-title--watched {
  text-decoration: line-through;
  color: var(--mmw-text-secondary);
}

.mmw-item-title--hidden {
  color: var(--mmw-text-secondary);
  font-style: italic;
  letter-spacing: 0.03em;
}

.mmw-item-episodes {
  color: var(--mmw-text-secondary);
  font-weight: 400;
}

.mmw-item-icons {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.mmw-icon {
  font-size: 0.95rem;
}

.mmw-icon--danger {
  color: var(--mmw-text-danger);
}

.mmw-icon--success {
  color: var(--mmw-text-success);
}

.mmw-icon--warning {
  color: var(--mmw-text-warning);
}

.mmw-icon--accent {
  color: var(--mmw-text-accent);
}

.mmw-recommend-badge {
  margin-top: 0.35rem;
  font-size: 0.76rem;
  color: var(--mmw-text-warning);
  background: var(--mmw-bg-warning);
  border-radius: var(--mmw-radius);
  padding: 0.25rem 0.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.3rem;
}

.mmw-unlocks-hint {
  margin-top: 0.35rem;
  font-size: 0.76rem;
  color: var(--mmw-text-accent);
  display: flex;
  align-items: flex-start;
  gap: 0.3rem;
}

@media (max-width: 720px) {
  .mmw-layout {
    flex-direction: column;
  }

  .mmw-tabs-col {
    flex: 1 1 auto;
    width: 100%;
  }
}
`;
