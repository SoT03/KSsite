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
  IconBolt,
  IconSparkles,
  IconX,
  IconStarFilled,
} from "@tabler/icons-react";
import { ITEMS, ITEM_MAP, UNIVERSES, TIERS, type UniverseId, type WatchItem, type SignificanceBadge } from "@/lib/marvel-watchlist-data";

// Tabler icons render as SVG and default to currentColor for stroke/fill, so
// the existing CSS classes (which just set `color`) keep working unchanged —
// this just makes the icon glyph itself inherit the surrounding font-size.
const ICON_STYLE = { width: "1em", height: "1em" } as const;

// Fixed display order for the top-left significance pills, independent of how
// each item's `badges` array happens to be written in the data file.
const BADGE_ORDER: SignificanceBadge[] = ["D", "M", "R", "OS"];
const BADGE_LABEL: Record<SignificanceBadge, string> = { D: "Wymagane przed Doomsday", M: "Kluczowe dla MCU", R: "Polecane", OS: "Krótka forma (One-Shot)" };
const sortedBadges = (item: WatchItem) => BADGE_ORDER.filter((b) => item.badges?.includes(b));

// M shows a star glyph instead of its letter; every other badge just prints its own text.
const BadgePillContent = ({ badge }: { badge: SignificanceBadge }) =>
  badge === "M" ? <IconStarFilled style={ICON_STYLE} /> : <>{badge}</>;

type ViewId = UniverseId | "tier-list";

// "skip" (not important) and "one-shot" (short bonus film) items never enter the
// tier list, even once watched — they're not the kind of thing you rank against
// full movies/seasons.
const isTierable = (item: WatchItem) => item.tag !== "skip" && item.tag !== "one-shot";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function MarvelMultiverseWatchlist() {
  const [watched, setWatched] = useState<Set<string>>(() => new Set());
  const [tiers, setTiers] = useState<Record<string, string>>({});
  const [orders, setOrders] = useState<Record<string, number>>({});
  const [posters, setPosters] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<ViewId>("mcu");
  const [loaded, setLoaded] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverTier, setDragOverTier] = useState<string | null>(null);
  const [pendingWatchItem, setPendingWatchItem] = useState<WatchItem | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const WATCH_CONFIRM_PASSWORD = "616";

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
          setOrders(data.orders ?? {});
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

  // Marking something watched requires the confirmation password; unwatching (undoing a
  // mistaken click) does not, so it goes straight through to applyWatchedChange.
  const handleCardClick = (item: WatchItem) => {
    if (isLocked(item)) return;
    if (isWatched(item.id)) {
      applyWatchedChange(item, false);
      return;
    }
    setPasswordInput("");
    setPasswordError(false);
    setPendingWatchItem(item);
  };

  const confirmPendingWatch = () => {
    if (!pendingWatchItem) return;
    if (passwordInput !== WATCH_CONFIRM_PASSWORD) {
      setPasswordError(true);
      return;
    }
    applyWatchedChange(pendingWatchItem, true);
    setPendingWatchItem(null);
    setPasswordInput("");
    setPasswordError(false);
  };

  const cancelPendingWatch = () => {
    setPendingWatchItem(null);
    setPasswordInput("");
    setPasswordError(false);
  };

  const applyWatchedChange = (item: WatchItem, nextWatchedState: boolean) => {
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
      // Unwatching deletes the WatchedItem row server-side, which takes its tier placement and
      // order with it — mirror that locally so the tier list doesn't show a stale placement.
      setTiers((prev) => {
        if (!(item.id in prev)) return prev;
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      setOrders((prev) => {
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

  const tierBoard = useMemo(() => {
    const unrankedRaw: WatchItem[] = [];
    const byTierRaw: Record<string, WatchItem[]> = {};
    for (const t of TIERS) byTierRaw[t.key] = [];
    for (const item of ITEMS) {
      if (!watched.has(item.id) || !isTierable(item)) continue;
      const t = tiers[item.id];
      if (t && byTierRaw[t]) byTierRaw[t].push(item);
      else unrankedRaw.push(item);
    }
    const unranked = [...unrankedRaw].sort((a, b) => (orders[a.id] ?? 0) - (orders[b.id] ?? 0));
    const byTier: Record<string, WatchItem[]> = {};
    for (const t of TIERS) {
      byTier[t.key] = [...byTierRaw[t.key]].sort((a, b) => (orders[a.id] ?? 0) - (orders[b.id] ?? 0));
    }
    return { unranked, byTier };
  }, [watched, tiers, orders]);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData("text/plain", itemId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(itemId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverTier(null);
  };

  const reorderTier = (tier: string | null, itemIds: string[]) => {
    setTiers((prev) => {
      const next = { ...prev };
      for (const id of itemIds) {
        if (tier === null) delete next[id];
        else next[id] = tier;
      }
      return next;
    });
    setOrders((prev) => {
      const next = { ...prev };
      itemIds.forEach((id, index) => {
        next[id] = index;
      });
      return next;
    });
    fetch("/api/watchlist/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier, itemIds }),
    }).catch(() => {
      // Best-effort sync — same reasoning as toggleWatched above.
    });
  };

  // Dropping onto a lane both moves the item into that tier and — by checking which sibling
  // card the pointer landed on — decides where in the left-to-right order it lands, so dragging
  // within a single tier reorders it instead of just re-confirming the same tier.
  const handleDropOnLane = (e: React.DragEvent, tier: string | null, laneKey: string) => {
    e.preventDefault();
    setDragOverTier((cur) => (cur === laneKey ? null : cur));

    const draggedId = e.dataTransfer.getData("text/plain") || draggingId;
    if (!draggedId) return;

    if (tier === "best") {
      // A single reserved slot — no meaningful left-to-right order to compute.
      tierItem(draggedId, "best");
      return;
    }

    const currentItems = (tier === null ? tierBoard.unranked : tierBoard.byTier[tier])
      .map((it) => it.id)
      .filter((id) => id !== draggedId);

    const targetEl = (document.elementFromPoint(e.clientX, e.clientY) as Element | null)?.closest(
      "[data-tier-card-id]"
    );
    const targetId = targetEl?.getAttribute("data-tier-card-id");

    let newOrder: string[];
    if (targetId && targetId !== draggedId && currentItems.includes(targetId)) {
      const rect = targetEl!.getBoundingClientRect();
      const isBefore = e.clientX < rect.left + rect.width / 2;
      const targetIndex = currentItems.indexOf(targetId);
      const insertAt = isBefore ? targetIndex : targetIndex + 1;
      newOrder = [...currentItems.slice(0, insertAt), draggedId, ...currentItems.slice(insertAt)];
    } else {
      // Dropped on empty lane background (or on itself) — send it to the end.
      newOrder = [...currentItems, draggedId];
    }

    reorderTier(tier, newOrder);
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

  // Denominator for the Tier List tab's progress bar: watched items that are
  // actually eligible to be tiered, so it can reach 100% instead of being
  // permanently capped by skip/one-shot items that never appear on the board.
  const tierableWatchedCount = useMemo(
    () => ITEMS.filter((item) => watched.has(item.id) && isTierable(item)).length,
    [watched]
  );

  const renderTierCard = (item: WatchItem, removable: boolean) => {
    const posterUrl = posters[item.id];
    return (
      <div
        key={item.id}
        data-testid={`tier-${item.id}`}
        data-tier-card-id={item.id}
        className={`mmw-card-item mmw-card-item--tier${draggingId === item.id ? " mmw-card-item--dragging" : ""}`}
        title={item.title}
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
        <div className="mmw-card mmw-global-card">Ładowanie Twojej listy…</div>
      </div>
    );
  }

  return (
    <div className="mmw-root">
      <style>{CSS}</style>

      {/* Section 1: Global Progress */}
      <div className="mmw-card mmw-global-card">
        <div className="mmw-global-header">
          <h2 className="mmw-heading">Postęp Multiwersum</h2>
          <span className="mmw-global-count">
            {watchedCount} z {totalCount}
          </span>
        </div>
        <div className="mmw-progress-track mmw-progress-track--lg">
          <div
            className="mmw-progress-fill"
            style={{ width: `${globalPercent}%` }}
          />
        </div>
        <div className="mmw-global-percent">{globalPercent}% ukończone</div>
        <div className="mmw-legend">
          {BADGE_ORDER.map((badge) => (
            <span key={badge} className="mmw-legend-item">
              <span className={`mmw-tag-pill mmw-tag-pill--${badge.toLowerCase()}`}><BadgePillContent badge={badge} /></span>
              <span className={`mmw-legend-label mmw-legend-label--${badge.toLowerCase()}`}>{BADGE_LABEL[badge]}</span>
            </span>
          ))}
        </div>
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
                  {tieredCount}/{tierableWatchedCount}
                </span>
              </div>
              <div className="mmw-progress-track mmw-progress-track--sm">
                <div
                  className="mmw-progress-fill"
                  style={{ width: `${tierableWatchedCount === 0 ? 0 : Math.round((tieredCount / tierableWatchedCount) * 100)}%` }}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Section 3: Movie Grid / Tier List */}
        <div className={`mmw-grid-col${activeTab === "tier-list" ? " mmw-grid-col--tier" : ""}`}>
          {activeTab === "tier-list" ? (
            <>
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
                    Everything you&apos;ve watched is already placed in a tier above.
                  </p>
                ) : (
                  <div className="mmw-grid mmw-grid--tier">
                    {tierBoard.unranked.map((item) => renderTierCard(item, false))}
                  </div>
                )}
              </div>
            </>
          ) : (
            groupedPhases.map(({ phase, items }) => {
            const phaseComplete = items.every((item) => watched.has(item.id));
            return (
              <div key={phase} className="mmw-phase-block">
                <div className="mmw-phase-header">
                  <h4 className="mmw-phase-title">{phase}</h4>
                  {phaseComplete && <span className="mmw-badge mmw-badge--success">Ukończono</span>}
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
                            <IconLock className="mmw-lock-icon" style={ICON_STYLE} title="Zablokowane" />
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
                        onClick={() => handleCardClick(item)}
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
                          {sortedBadges(item).length > 0 && (
                            <div className="mmw-tag-badges">
                              {sortedBadges(item).map((badge) => (
                                <span key={badge} className={`mmw-tag-pill mmw-tag-pill--${badge.toLowerCase()}`} title={BADGE_LABEL[badge]}>
                                  <BadgePillContent badge={badge} />
                                </span>
                              ))}
                            </div>
                          )}
                          {watchedFlag && (
                            <div className="mmw-watched-stamp" title="Obejrzane">
                              <IconCheck style={ICON_STYLE} />
                            </div>
                          )}
                          <div className="mmw-card-badges">
                            {recommended.length > 0 && (
                              <IconAlertCircle className="mmw-badge-icon mmw-badge-icon--warning" style={ICON_STYLE} title="Ma rekomendacje" />
                            )}
                            {item.tag === "together" && (
                              <IconHeart className="mmw-badge-icon mmw-badge-icon--together" style={ICON_STYLE} title="Obejrzeć razem" />
                            )}
                            {item.tag === "skip" && (
                              <IconCircleMinus className="mmw-badge-icon mmw-badge-icon--skip" style={ICON_STYLE} title="Nieistotne" />
                            )}
                            {item.tag === "one-shot" && (
                              <IconBolt className="mmw-badge-icon mmw-badge-icon--one-shot" style={ICON_STYLE} title="Krótka forma (One-Shot)" />
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
                                <IconAlertCircle className="mmw-icon" style={ICON_STYLE} /> Polecane: {recommended.join(", ")}
                              </div>
                            )}
                            {nextUnlocks.length > 0 && (
                              <div className="mmw-card-hover-line mmw-card-hover-line--accent">
                                <IconSparkles className="mmw-icon" style={ICON_STYLE} /> Odblokowuje: {nextUnlocks.join(", ")}
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

      {pendingWatchItem && (
        <div className="mmw-modal-overlay" onClick={cancelPendingWatch}>
          <div className="mmw-modal" onClick={(e) => e.stopPropagation()}>
            <h4 className="mmw-modal-title">Potwierdź obejrzenie</h4>
            <p className="mmw-modal-text">
              Wpisz hasło, aby oznaczyć &quot;{pendingWatchItem.title}&quot; jako obejrzane.
            </p>
            <input
              type="password"
              className="mmw-modal-input"
              value={passwordInput}
              autoFocus
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setPasswordError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmPendingWatch();
                if (e.key === "Escape") cancelPendingWatch();
              }}
            />
            {passwordError && <p className="mmw-modal-error">Nieprawidłowe hasło.</p>}
            <div className="mmw-modal-actions">
              <button type="button" className="mmw-modal-btn mmw-modal-btn--cancel" onClick={cancelPendingWatch}>
                Anuluj
              </button>
              <button type="button" className="mmw-modal-btn mmw-modal-btn--confirm" onClick={confirmPendingWatch}>
                Potwierdź
              </button>
            </div>
          </div>
        </div>
      )}
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
  border-top: 0.5px solid var(--mmw-border);
  padding-top: 0.85rem;
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

.mmw-tag-badges {
  position: absolute;
  top: 0.4rem;
  left: 0.4rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.22rem;
  z-index: 2;
  max-width: calc(100% - 0.8rem);
}

.mmw-tag-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.62rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.03em;
  padding: 0.28rem 0.44rem;
  border-radius: 6px;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.5),
    0 2px 6px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    inset 0 0 0 1px rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(2px);
  text-shadow: 0 1px 1.5px rgba(0, 0, 0, 0.35);
  white-space: nowrap;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.mmw-card-item:hover .mmw-tag-pill {
  transform: translateY(-1px);
}

.mmw-tag-pill--d {
  background: linear-gradient(160deg, #34d071, #15803d);
  color: #fff;
}

.mmw-tag-pill--m {
  background: linear-gradient(160deg, #fde047, #ea580c);
  color: #fff;
}

.mmw-tag-pill--m svg {
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.35));
}

.mmw-tag-pill--r {
  background: linear-gradient(160deg, #60a5fa, #1d4ed8);
  color: #fff;
}

.mmw-tag-pill--os {
  background: linear-gradient(160deg, #e2e6eb, #9aa0ab);
  color: #14161a;
  text-shadow: none;
}

.mmw-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0.9rem;
  margin-top: 0.75rem;
  padding-top: 0.65rem;
  border-top: 0.5px solid var(--mmw-border);
}

.mmw-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.mmw-legend-label {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--mmw-text-secondary);
}

.mmw-legend-label--d {
  color: #4ade80;
}

.mmw-legend-label--m {
  color: #fb923c;
}

.mmw-legend-label--r {
  color: #60a5fa;
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

.mmw-badge-icon--one-shot {
  color: var(--mmw-text-warning);
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
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 0.7rem;
}

/* Compact tier-list layout: tighter lane spacing and smaller cards make it
   easier to see and hit a drop target instead of scrolling past huge gaps. */
.mmw-grid-col--tier {
  gap: 0.45rem;
}

.mmw-grid-col--tier .mmw-tier-lane {
  padding: 0.5rem 0.65rem;
}

.mmw-grid-col--tier .mmw-phase-header {
  margin-bottom: 0.35rem;
}

.mmw-grid-col--tier .mmw-phase-title {
  font-size: 0.8rem;
}

.mmw-grid-col--tier .mmw-tier-empty {
  padding: 0.5rem;
  font-size: 0.75rem;
}

.mmw-grid-col--tier .mmw-grid--tier {
  grid-template-columns: repeat(auto-fill, minmax(58px, 1fr));
  gap: 0.4rem;
}

.mmw-grid-col--tier .mmw-card-title-strip {
  padding: 0.3rem 0.35rem;
  min-height: 1.7rem;
}

.mmw-grid-col--tier .mmw-card-title {
  font-size: 0.62rem;
  -webkit-line-clamp: 1;
}

.mmw-grid-col--tier .mmw-tier-remove-btn {
  width: 18px;
  height: 18px;
  font-size: 0.65rem;
  top: 0.25rem;
  right: 0.25rem;
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

.mmw-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
}

.mmw-modal {
  background: var(--mmw-surface-1);
  border: 0.5px solid var(--mmw-border);
  border-radius: var(--mmw-radius);
  padding: 1.25rem;
  width: 100%;
  max-width: 320px;
}

.mmw-modal-title {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.mmw-modal-text {
  margin: 0 0 0.75rem 0;
  font-size: 0.85rem;
  color: var(--mmw-text-secondary);
}

.mmw-modal-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.5rem 0.65rem;
  border-radius: calc(var(--mmw-radius) - 4px);
  border: 0.5px solid var(--mmw-border);
  background: var(--mmw-surface-2);
  color: var(--mmw-text-primary);
  font-size: 0.9rem;
}

.mmw-modal-error {
  margin: 0.5rem 0 0 0;
  font-size: 0.78rem;
  color: var(--mmw-text-danger);
}

.mmw-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

.mmw-modal-btn {
  border-radius: calc(var(--mmw-radius) - 4px);
  padding: 0.45rem 0.9rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border: 0.5px solid var(--mmw-border);
}

.mmw-modal-btn--cancel {
  background: var(--mmw-surface-2);
  color: var(--mmw-text-primary);
}

.mmw-modal-btn--confirm {
  background: var(--mmw-fill-accent);
  color: #fff;
  border-color: var(--mmw-fill-accent);
}
`;
