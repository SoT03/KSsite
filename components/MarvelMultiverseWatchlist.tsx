"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  IconMovie,
  IconLock,
  IconCheck,
  IconAlertCircle,
  IconHeart,
  IconCircleMinus,
  IconSparkles,
  IconX,
} from "@tabler/icons-react";
import { ITEMS, ITEM_MAP, UNIVERSES, TIERS, type UniverseId, type WatchItem } from "@/lib/marvel-watchlist-data";

// Tabler icons render as SVG and default to currentColor for stroke/fill, so
// the existing CSS classes (which just set `color`) keep working unchanged —
// this just makes the icon glyph itself inherit the surrounding font-size.
const ICON_STYLE = { width: "1em", height: "1em" } as const;

type ViewId = UniverseId | "tier-list";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function MarvelMultiverseWatchlist() {
  const [watched, setWatched] = useState<Set<string>>(() => new Set());
  const [tiers, setTiers] = useState<Record<string, string>>({});
  const [posters, setPosters] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<ViewId>("mcu");
  const [loaded, setLoaded] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverTier, setDragOverTier] = useState<string | null>(null);

  // Load this user's watch progress, tier placements, and cached poster art from the server on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [watchlistRes, postersRes] = await Promise.all([fetch("/api/watchlist"), fetch("/api/posters")]);
        if (!cancelled && watchlistRes.ok) {
          const data = await watchlistRes.json();
          const ids: string[] = data.watchedItemIds ?? [];
          setWatched(new Set(ids.filter((id: string) => id in ITEM_MAP)));
          setTiers(data.tiers ?? {});
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
    if (!nextWatchedState) {
      // Unwatching deletes the WatchedItem row server-side, which takes its tier placement with
      // it — mirror that locally so the tier list doesn't show a stale placement for an unwatched item.
      setTiers((prev) => {
        if (!(item.id in prev)) return prev;
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }
    fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, watched: nextWatchedState }),
    }).catch(() => {
      // Best-effort sync — local state already reflects the toggle so the UI stays responsive;
      // the next successful load will reconcile with the server if this write was lost.
    });
  };

  const tierItem = (itemId: string, tier: string | null) => {
    setTiers((prev) => {
      const next = { ...prev };
      if (tier === "best") {
        // "best" is a single reserved slot — bump whoever previously held it back to Unranked.
        for (const [id, t] of Object.entries(next)) {
          if (t === "best" && id !== itemId) delete next[id];
        }
      }
      if (tier === null) {
        delete next[itemId];
      } else {
        next[itemId] = tier;
      }
      return next;
    });
    fetch("/api/watchlist/tier", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, tier }),
    }).catch(() => {
      // Best-effort sync — same reasoning as toggleWatched above.
    });
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData("text/plain", itemId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(itemId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverTier(null);
  };

  const handleDropOnLane = (e: React.DragEvent, tier: string | null, laneKey: string) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData("text/plain") || draggingId;
    if (itemId) tierItem(itemId, tier);
    setDragOverTier((cur) => (cur === laneKey ? null : cur));
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

  const tieredCount = useMemo(
    () => Object.keys(tiers).filter((id) => watched.has(id)).length,
    [tiers, watched]
  );

  const tierBoard = useMemo(() => {
    const unranked: WatchItem[] = [];
    const byTier: Record<string, WatchItem[]> = {};
    for (const t of TIERS) byTier[t.key] = [];
    for (const item of ITEMS) {
      if (!watched.has(item.id)) continue;
      const t = tiers[item.id];
      if (t && byTier[t]) byTier[t].push(item);
      else unranked.push(item);
    }
    return { unranked, byTier };
  }, [watched, tiers]);

  const renderTierCard = (item: WatchItem, removable: boolean) => {
    const posterUrl = posters[item.id];
    return (
      <div
        key={item.id}
        data-testid={`tier-${item.id}`}
        className={`mmw-card-item mmw-card-item--tier${draggingId === item.id ? " mmw-card-item--dragging" : ""}`}
        draggable
        onDragStart={(e) => handleDragStart(e, item.id)}
        onDragEnd={handleDragEnd}
      >
        <div className="mmw-poster-slot">
          {posterUrl ? (
            <Image src={posterUrl} alt="" fill sizes="200px" className="mmw-poster-img" unoptimized />
          ) : (
            <div className="mmw-poster-fallback">
              <IconMovie style={ICON_STYLE} />
            </div>
          )}
          {removable && (
            <button
              type="button"
              className="mmw-tier-remove-btn"
              onClick={() => tierItem(item.id, null)}
              aria-label={`Remove ${item.title} from tier`}
              title="Move back to Unranked"
            >
              <IconX style={ICON_STYLE} />
            </button>
          )}
        </div>
        <div className="mmw-card-title-strip">
          <span className="mmw-card-title">{item.title}</span>
        </div>
      </div>
    );
  };

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

            <button
              type="button"
              className={`mmw-tab mmw-tab--tier-list${activeTab === "tier-list" ? " mmw-tab--active" : ""}`}
              onClick={() => setActiveTab("tier-list")}
            >
              <div className="mmw-tab-row">
                <span className="mmw-tab-name">🏆 Tier List</span>
                <span className="mmw-tab-count">
                  {tieredCount}/{watchedCount}
                </span>
              </div>
              <div className="mmw-progress-track mmw-progress-track--sm">
                <div
                  className="mmw-progress-fill"
                  style={{ width: `${watchedCount === 0 ? 0 : Math.round((tieredCount / watchedCount) * 100)}%` }}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Section 3: Movie Grid / Tier List */}
        <div className="mmw-grid-col">
          {activeTab === "tier-list" ? (
            <>
              <div
                data-testid="tier-lane-unranked"
                className={`mmw-phase-block mmw-tier-lane${dragOverTier === "unranked" ? " mmw-tier-lane--over" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverTier("unranked");
                }}
                onDragLeave={() => setDragOverTier((cur) => (cur === "unranked" ? null : cur))}
                onDrop={(e) => handleDropOnLane(e, null, "unranked")}
              >
                <div className="mmw-phase-header">
                  <h4 className="mmw-phase-title">Unranked</h4>
                  <span className="mmw-badge">{tierBoard.unranked.length}</span>
                </div>
                {tierBoard.unranked.length === 0 ? (
                  <p className="mmw-tier-empty">
                    Everything you&apos;ve watched is already placed in a tier below.
                  </p>
                ) : (
                  <div className="mmw-grid mmw-grid--tier">
                    {tierBoard.unranked.map((item) => renderTierCard(item, false))}
                  </div>
                )}
              </div>

              {TIERS.map((tierDef) => {
                const items = tierBoard.byTier[tierDef.key];
                return (
                  <div
                    key={tierDef.key}
                    data-testid={`tier-lane-${tierDef.key}`}
                    className={`mmw-phase-block mmw-tier-lane${dragOverTier === tierDef.key ? " mmw-tier-lane--over" : ""}${tierDef.key === "best" ? " mmw-tier-lane--best" : ""}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverTier(tierDef.key);
                    }}
                    onDragLeave={() => setDragOverTier((cur) => (cur === tierDef.key ? null : cur))}
                    onDrop={(e) => handleDropOnLane(e, tierDef.key, tierDef.key)}
                  >
                    <div className="mmw-phase-header">
                      <h4 className="mmw-phase-title">{tierDef.label}</h4>
                      <span className="mmw-badge">
                        {items.length}
                        {tierDef.max ? `/${tierDef.max}` : ""}
                      </span>
                    </div>
                    {items.length === 0 ? (
                      <p className="mmw-tier-empty">Drag a watched movie here.</p>
                    ) : (
                      <div className="mmw-grid mmw-grid--tier">{items.map((item) => renderTierCard(item, true))}</div>
                    )}
                  </div>
                );
              })}
            </>
          ) : (
            groupedPhases.map(({ phase, items }) => {
            const phaseComplete = items.every((item) => watched.has(item.id));
            return (
              <div key={phase} className="mmw-phase-block">
                <div className="mmw-phase-header">
                  <h4 className="mmw-phase-title">{phase}</h4>
                  {phaseComplete && <span className="mmw-badge mmw-badge--success">Complete</span>}
                </div>
                <div className="mmw-grid">
                  {items.map((item) => {
                    const watchedFlag = isWatched(item.id);
                    const locked = !watchedFlag && isLocked(item);

                    if (locked) {
                      return (
                        <div
                          key={item.id}
                          data-testid={item.id}
                          className="mmw-card-item mmw-card-item--locked"
                          aria-disabled="true"
                          tabIndex={-1}
                        >
                          <div className="mmw-poster-slot mmw-poster-slot--locked">
                            <IconLock className="mmw-lock-icon" style={ICON_STYLE} title="Locked" />
                          </div>
                          <div className="mmw-card-title-strip" />
                        </div>
                      );
                    }

                    const recommended = (item.recommended ?? []).map((id) => ITEM_MAP[id]?.title ?? id);
                    const nextUnlocks = (unlocksMap[item.id] ?? [])
                      .filter((id) => isWatched(id) || !isLocked(ITEM_MAP[id]))
                      .map((id) => ITEM_MAP[id].title);
                    const posterUrl = posters[item.id];
                    const hasDetails = recommended.length > 0 || nextUnlocks.length > 0;

                    return (
                      <div
                        key={item.id}
                        data-testid={item.id}
                        className={`mmw-card-item${watchedFlag ? " mmw-card-item--watched" : ""}`}
                        onClick={() => toggleWatched(item)}
                        role="button"
                        aria-disabled={false}
                        tabIndex={0}
                      >
                        <div className="mmw-poster-slot">
                          {posterUrl ? (
                            <Image
                              src={posterUrl}
                              alt=""
                              fill
                              sizes="200px"
                              className={`mmw-poster-img${watchedFlag ? " mmw-poster-img--watched" : ""}`}
                              unoptimized
                            />
                          ) : (
                            <div className="mmw-poster-fallback">
                              <IconMovie style={ICON_STYLE} />
                            </div>
                          )}
                          {watchedFlag && (
                            <div className="mmw-watched-stamp" title="Watched">
                              <IconCheck style={ICON_STYLE} />
                            </div>
                          )}
                          <div className="mmw-card-badges">
                            {recommended.length > 0 && (
                              <IconAlertCircle className="mmw-badge-icon mmw-badge-icon--warning" style={ICON_STYLE} title="Has recommendations" />
                            )}
                            {item.tag === "together" && (
                              <IconHeart className="mmw-badge-icon mmw-badge-icon--together" style={ICON_STYLE} title="Want to watch together" />
                            )}
                            {item.tag === "skip" && (
                              <IconCircleMinus className="mmw-badge-icon mmw-badge-icon--skip" style={ICON_STYLE} title="Not that important" />
                            )}
                          </div>
                        </div>

                        <div className="mmw-card-title-strip">
                          <span className={`mmw-card-title${watchedFlag ? " mmw-card-title--watched" : ""}`}>
                            {item.title}
                            {item.episodes && <span className="mmw-item-episodes"> ({item.episodes} ep)</span>}
                          </span>
                        </div>

                        {hasDetails && (
                          <div className="mmw-card-hover-details">
                            <div className="mmw-card-hover-title">{item.title}</div>
                            {recommended.length > 0 && (
                              <div className="mmw-card-hover-line mmw-card-hover-line--warning">
                                <IconAlertCircle className="mmw-icon" style={ICON_STYLE} /> Recommended: {recommended.join(", ")}
                              </div>
                            )}
                            {nextUnlocks.length > 0 && (
                              <div className="mmw-card-hover-line mmw-card-hover-line--accent">
                                <IconSparkles className="mmw-icon" style={ICON_STYLE} /> Unlocks: {nextUnlocks.join(", ")}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
          )}
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

.mmw-tab--tier-list {
  margin-top: 0.5rem;
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

.mmw-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 1rem;
}

.mmw-card-item {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--mmw-surface-2);
  border: 0.5px solid var(--mmw-border);
  border-radius: var(--mmw-radius);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
}

.mmw-card-item:hover {
  transform: translateY(-3px);
  border-color: var(--mmw-fill-accent);
}

.mmw-card-item--watched {
  border-width: 1.5px;
  border-color: var(--mmw-text-success);
}

.mmw-card-item--locked {
  cursor: not-allowed;
  opacity: 0.7;
}

.mmw-card-item--locked:hover {
  transform: none;
  border-color: var(--mmw-border);
}

.mmw-poster-slot {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  background: var(--mmw-surface-1);
  overflow: hidden;
}

.mmw-poster-img {
  object-fit: cover;
  transition: filter 0.2s ease;
}

.mmw-poster-img--watched {
  filter: grayscale(0.55) brightness(0.6);
}

.mmw-watched-stamp {
  position: absolute;
  bottom: 0.4rem;
  right: 0.4rem;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  background: var(--mmw-text-success);
  color: #0b0c10;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  z-index: 2;
}

.mmw-poster-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--mmw-text-secondary);
  font-size: 1.8rem;
  opacity: 0.5;
}

.mmw-poster-slot--locked {
  display: flex;
  align-items: center;
  justify-content: center;
  background: repeating-linear-gradient(
    135deg,
    var(--mmw-surface-1) 0 10px,
    var(--mmw-surface-2) 10px 20px
  );
}

.mmw-lock-icon {
  font-size: 1.6rem;
  color: var(--mmw-text-secondary);
  opacity: 0.6;
}

.mmw-card-badges {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  display: flex;
  gap: 0.25rem;
  z-index: 2;
}

.mmw-badge-icon {
  font-size: 0.85rem;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 999px;
  padding: 0.3rem;
  line-height: 1;
  backdrop-filter: blur(2px);
}

.mmw-badge-icon--success {
  color: var(--mmw-text-success);
}

.mmw-badge-icon--warning {
  color: var(--mmw-text-warning);
}

.mmw-badge-icon--together {
  color: #f43f5e;
}

.mmw-badge-icon--skip {
  color: var(--mmw-text-secondary);
}

.mmw-card-title-strip {
  padding: 0.5rem 0.55rem;
  min-height: 2.6rem;
  display: flex;
  align-items: center;
}

.mmw-card-title {
  font-size: 0.78rem;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.mmw-card-title--watched {
  color: var(--mmw-text-secondary);
}

.mmw-item-episodes {
  color: var(--mmw-text-secondary);
  font-weight: 400;
}

.mmw-card-item--tier {
  cursor: grab;
}

.mmw-card-item--dragging {
  opacity: 0.4;
}

.mmw-tier-remove-btn {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  z-index: 3;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: none;
  background: rgba(0, 0, 0, 0.55);
  color: var(--mmw-text-primary);
  cursor: pointer;
  font-size: 0.8rem;
  opacity: 0;
  transition: opacity 0.15s ease, background 0.15s ease;
}

.mmw-card-item--tier:hover .mmw-tier-remove-btn {
  opacity: 1;
}

.mmw-tier-remove-btn:hover {
  background: var(--mmw-text-danger);
}

.mmw-tier-empty {
  color: var(--mmw-text-secondary);
  font-size: 0.85rem;
  text-align: center;
  padding: 1.5rem 1rem;
  margin: 0;
}

.mmw-tier-lane {
  transition: border-color 0.15s ease, background 0.15s ease;
}

.mmw-tier-lane--over {
  border-color: var(--mmw-fill-accent);
  background: var(--mmw-surface-2);
}

.mmw-tier-lane--best .mmw-phase-title {
  color: var(--mmw-text-warning);
}

.mmw-grid--tier {
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
}

.mmw-icon {
  font-size: 0.95rem;
}

.mmw-card-hover-details {
  position: absolute;
  inset: 0;
  background: rgba(8, 9, 12, 0.94);
  color: var(--mmw-text-primary);
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.72rem;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  overflow-y: auto;
  z-index: 3;
}

.mmw-card-item:hover .mmw-card-hover-details,
.mmw-card-item:focus .mmw-card-hover-details,
.mmw-card-item:focus-within .mmw-card-hover-details {
  opacity: 1;
  pointer-events: auto;
}

.mmw-card-hover-title {
  font-weight: 600;
  font-size: 0.8rem;
}

.mmw-card-hover-line {
  display: flex;
  align-items: flex-start;
  gap: 0.3rem;
}

.mmw-card-hover-line--warning {
  color: var(--mmw-text-warning);
}

.mmw-card-hover-line--accent {
  color: var(--mmw-text-accent);
}

/* Devices without real hover (touch) can't reveal the overlay above, so fall
   back to always-visible detail text flowing under the title instead. */
@media (hover: none) {
  .mmw-card-hover-details {
    position: static;
    opacity: 1;
    pointer-events: auto;
    background: none;
    color: inherit;
    padding: 0 0.55rem 0.55rem;
  }
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
