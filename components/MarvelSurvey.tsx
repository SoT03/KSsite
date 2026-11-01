"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { IconCheck, IconLock, IconSearch, IconSparkles, IconUser, IconMovie, IconX } from "@tabler/icons-react";
import { ITEMS, ITEM_MAP, TIERS } from "@/lib/marvel-watchlist-data";
import { CHARACTERS, type MarvelCharacter } from "@/lib/marvel-characters";
import {
  SURVEY_QUESTIONS,
  CUSTOM_PREFIX,
  CUSTOM_MAX_LENGTH,
  type SurveyQuestion,
} from "@/lib/marvel-survey-data";

const ICON_STYLE = { width: "1em", height: "1em" } as const;
const TMDB_PROFILE_BASE = "https://image.tmdb.org/t/p/w185";
// Character pickers can have hundreds of unlocked entries — render only this many until the search narrows it.
const MAX_VISIBLE_OPTIONS = 60;
const SEARCH_THRESHOLD = 12;

interface Person {
  userId: string;
  name: string;
  mine: boolean;
  answers: Record<string, string>;
}

interface ResolvedOption {
  id: string;
  label: string;
  sub?: string;
  image?: string;
}

interface Props {
  watched: Set<string>;
  tiers: Record<string, string>;
  orders: Record<string, number>;
  posters: Record<string, string>;
}

const CHARACTER_MAP: Record<string, MarvelCharacter> = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));
const TIER_RANK: Record<string, number> = Object.fromEntries(TIERS.map((t, i) => [t.key, i]));

export default function MarvelSurvey({ watched, tiers, orders, posters }: Props) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<"form" | "results">("form");
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [customText, setCustomText] = useState("");
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/survey")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setPeople(data.people ?? []);
      })
      .catch(() => {
        // Network hiccup — the form still renders, just without saved answers this load.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const myAnswers = useMemo(() => people.find((p) => p.mine)?.answers ?? {}, [people]);
  const answeredCount = SURVEY_QUESTIONS.filter((q) => myAnswers[q.id]).length;

  const isCharacterUnlocked = (c: MarvelCharacter) => c.appearances.some((id) => watched.has(id));

  // Everything the viewer may pick for a question — i.e. only options from titles they've watched.
  const optionsFor = (q: SurveyQuestion): ResolvedOption[] => {
    switch (q.kind) {
      case "movie":
      case "series": {
        const mediaType = q.kind === "movie" ? "movie" : "tv";
        return ITEMS.filter((it) => it.mediaType === mediaType && it.tag !== "one-shot" && watched.has(it.id)).map((it) => ({
          id: it.id,
          label: it.title,
          image: posters[it.id],
        }));
      }
      case "character-m":
      case "character-f": {
        const gender = q.kind === "character-m" ? "m" : "f";
        return CHARACTERS.filter((c) => c.gender === gender && isCharacterUnlocked(c)).map((c) => ({
          id: c.id,
          label: c.name,
          sub: c.actor,
          image: c.profilePath ? `${TMDB_PROFILE_BASE}${c.profilePath}` : undefined,
        }));
      }
      case "options":
        return (q.options ?? []).filter((o) => o.from.some((id) => watched.has(id))).map((o) => ({ id: o.id, label: o.label }));
    }
  };

  const totalOptionsFor = (q: SurveyQuestion): number => {
    switch (q.kind) {
      case "movie":
        return ITEMS.filter((it) => it.mediaType === "movie" && it.tag !== "one-shot").length;
      case "series":
        return ITEMS.filter((it) => it.mediaType === "tv" && it.tag !== "one-shot").length;
      case "character-m":
        return CHARACTERS.filter((c) => c.gender === "m").length;
      case "character-f":
        return CHARACTERS.filter((c) => c.gender === "f").length;
      case "options":
        return q.options?.length ?? 0;
    }
  };

  // Resolves a stored answer to something displayable, and whether the viewer has unlocked it —
  // other people's answers about titles the viewer hasn't watched yet are spoilers.
  const resolveAnswer = (q: SurveyQuestion, value: string): { option: ResolvedOption; unlocked: boolean } | null => {
    if (value.startsWith(CUSTOM_PREFIX)) {
      return { option: { id: value, label: value.slice(CUSTOM_PREFIX.length) }, unlocked: true };
    }
    switch (q.kind) {
      case "movie":
      case "series": {
        const item = ITEM_MAP[value];
        if (!item) return null;
        return { option: { id: item.id, label: item.title, image: posters[item.id] }, unlocked: watched.has(item.id) };
      }
      case "character-m":
      case "character-f": {
        const c = CHARACTER_MAP[value];
        if (!c) return null;
        return {
          option: { id: c.id, label: c.name, sub: c.actor, image: c.profilePath ? `${TMDB_PROFILE_BASE}${c.profilePath}` : undefined },
          unlocked: isCharacterUnlocked(c),
        };
      }
      case "options": {
        const o = q.options?.find((opt) => opt.id === value);
        if (!o) return null;
        return { option: { id: o.id, label: o.label }, unlocked: o.from.some((id) => watched.has(id)) };
      }
    }
  };

  // Favourite movie/series suggestion: the highest-placed item of that type on the tier list.
  const tierSuggestion = (q: SurveyQuestion): ResolvedOption | null => {
    if (q.kind !== "movie" && q.kind !== "series") return null;
    const mediaType = q.kind === "movie" ? "movie" : "tv";
    const ranked = ITEMS.filter((it) => it.mediaType === mediaType && watched.has(it.id) && tiers[it.id] in TIER_RANK).sort(
      (a, b) => TIER_RANK[tiers[a.id]] - TIER_RANK[tiers[b.id]] || (orders[a.id] ?? 0) - (orders[b.id] ?? 0)
    );
    const best = ranked[0];
    return best ? { id: best.id, label: best.title, image: posters[best.id] } : null;
  };

  // Optimistic: the viewer's display name isn't known client-side, so a first answer shows
  // under "Ty" in the results until the next load fetches the real name.
  const saveAnswer = (questionId: string, value: string | null) => {
    setPeople((prev) => {
      const hasMe = prev.some((p) => p.mine);
      const base = hasMe ? prev : [...prev, { userId: "me", name: "Ty", mine: true, answers: {} }];
      return base.map((p) => {
        if (!p.mine) return p;
        const answers = { ...p.answers };
        if (value === null) delete answers[questionId];
        else answers[questionId] = value;
        return { ...p, answers };
      });
    });
    fetch("/api/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, value }),
    })
      .then((res) => setSaveFailed(!res.ok))
      // Local state already shows the answer, so a lost write would otherwise look saved
      // until the next reload — flag it so the user knows to try again.
      .catch(() => setSaveFailed(true));
  };

  const toggleQuestion = (q: SurveyQuestion) => {
    const opening = openQuestionId !== q.id;
    setOpenQuestionId(opening ? q.id : null);
    setSearch("");
    const current = myAnswers[q.id];
    setCustomText(current?.startsWith(CUSTOM_PREFIX) ? current.slice(CUSTOM_PREFIX.length) : "");
  };

  const pick = (questionId: string, value: string) => {
    saveAnswer(questionId, value);
    setOpenQuestionId(null);
  };

  const renderThumb = (option: ResolvedOption, fallback: "movie" | "user") => (
    <span className="mms-thumb">
      {option.image ? (
        <Image src={option.image} alt="" fill sizes="64px" className="mms-thumb-img" unoptimized />
      ) : fallback === "movie" ? (
        <IconMovie style={ICON_STYLE} />
      ) : (
        <IconUser style={ICON_STYLE} />
      )}
    </span>
  );

  const thumbKind = (q: SurveyQuestion): "movie" | "user" | null =>
    q.kind === "movie" || q.kind === "series" ? "movie" : q.kind === "character-m" || q.kind === "character-f" ? "user" : null;

  const renderPicker = (q: SurveyQuestion) => {
    const all = optionsFor(q);
    const hidden = totalOptionsFor(q) - all.length;
    const query = search.trim().toLowerCase();
    const filtered = query
      ? all.filter((o) => o.label.toLowerCase().includes(query) || o.sub?.toLowerCase().includes(query))
      : all;
    const visible = filtered.slice(0, MAX_VISIBLE_OPTIONS);
    const kind = thumbKind(q);
    const current = myAnswers[q.id];

    return (
      <div className="mms-picker">
        {all.length > SEARCH_THRESHOLD && (
          <label className="mms-search">
            <IconSearch style={ICON_STYLE} />
            <input
              type="text"
              value={search}
              autoFocus
              placeholder="Szukaj…"
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        )}

        {all.length === 0 ? (
          <p className="mms-empty">
            <IconLock style={ICON_STYLE} /> Obejrzyj więcej, żeby odblokować odpowiedzi.
          </p>
        ) : (
          <div className={`mms-options${kind ? " mms-options--thumbs" : ""}`}>
            {visible.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`mms-option${current === o.id ? " mms-option--chosen" : ""}`}
                onClick={() => pick(q.id, o.id)}
              >
                {kind && renderThumb(o, kind)}
                <span className="mms-option-text">
                  <span className="mms-option-label">{o.label}</span>
                  {o.sub && <span className="mms-option-sub">{o.sub}</span>}
                </span>
                {current === o.id && <IconCheck className="mms-option-check" style={ICON_STYLE} />}
              </button>
            ))}
          </div>
        )}

        {filtered.length > visible.length && (
          <p className="mms-note">…i {filtered.length - visible.length} więcej — wpisz, żeby zawęzić.</p>
        )}
        {query && filtered.length === 0 && <p className="mms-note">Nic nie pasuje do „{search}”.</p>}
        {hidden > 0 && (
          <p className="mms-note">
            <IconLock style={ICON_STYLE} /> {hidden} ukrytych — z tytułów, których jeszcze nie obejrzałeś/aś.
          </p>
        )}

        {q.allowCustom && (
          <form
            className="mms-custom"
            onSubmit={(e) => {
              e.preventDefault();
              const text = customText.trim();
              if (text) pick(q.id, `${CUSTOM_PREFIX}${text}`);
            }}
          >
            <input
              type="text"
              value={customText}
              maxLength={CUSTOM_MAX_LENGTH}
              placeholder="Albo wpisz własną…"
              onChange={(e) => setCustomText(e.target.value)}
            />
            <button type="submit" className="mms-btn mms-btn--primary" disabled={!customText.trim()}>
              Zapisz
            </button>
          </form>
        )}

        {current && (
          <button
            type="button"
            className="mms-btn mms-btn--ghost"
            onClick={() => {
              saveAnswer(q.id, null);
              setOpenQuestionId(null);
            }}
          >
            <IconX style={ICON_STYLE} /> Usuń odpowiedź
          </button>
        )}
      </div>
    );
  };

  const renderForm = () =>
    SURVEY_QUESTIONS.map((q, index) => {
      const value = myAnswers[q.id];
      const resolved = value ? resolveAnswer(q, value) : null;
      const suggestion = !value ? tierSuggestion(q) : null;
      const isOpen = openQuestionId === q.id;
      const kind = thumbKind(q);
      return (
        <div key={q.id} className={`mms-question${isOpen ? " mms-question--open" : ""}`}>
          <button type="button" className="mms-question-head" onClick={() => toggleQuestion(q)}>
            <span className="mms-question-num">{index + 1}</span>
            <span className="mms-question-main">
              <span className="mms-question-label">{q.label}</span>
              {resolved ? (
                <span className="mms-answer">
                  {kind && renderThumb(resolved.option, kind)}
                  <span className="mms-answer-label">{resolved.option.label}</span>
                </span>
              ) : (
                <span className="mms-answer mms-answer--empty">Brak odpowiedzi</span>
              )}
            </span>
            <span className="mms-question-action">{isOpen ? "Zamknij" : value ? "Zmień" : "Wybierz"}</span>
          </button>

          {suggestion && !isOpen && (
            <button type="button" className="mms-suggestion" onClick={() => saveAnswer(q.id, suggestion.id)}>
              <IconSparkles style={ICON_STYLE} /> Z tier listy: <strong>{suggestion.label}</strong> — kliknij, żeby zatwierdzić
            </button>
          )}

          {isOpen && renderPicker(q)}
        </div>
      );
    });

  const renderResults = () => {
    const respondents = people.filter((p) => Object.keys(p.answers).length > 0);
    if (respondents.length === 0) {
      return <p className="mms-empty mms-empty--block">Nikt jeszcze nie wypełnił ankiety — bądź pierwszy/a!</p>;
    }
    return SURVEY_QUESTIONS.map((q, index) => {
      // Group respondents by answer; answers the viewer hasn't unlocked collapse into one hidden row.
      const groups = new Map<string, { option: ResolvedOption; names: string[]; mineIncluded: boolean }>();
      const hiddenNames: string[] = [];
      for (const p of respondents) {
        const value = p.answers[q.id];
        if (!value) continue;
        const resolved = resolveAnswer(q, value);
        if (!resolved) continue;
        if (!resolved.unlocked) {
          hiddenNames.push(p.name);
          continue;
        }
        const group = groups.get(value) ?? { option: resolved.option, names: [], mineIncluded: false };
        group.names.push(p.name);
        if (p.mine) group.mineIncluded = true;
        groups.set(value, group);
      }
      const sorted = [...groups.values()].sort((a, b) => b.names.length - a.names.length);
      const answeredTotal = sorted.reduce((n, g) => n + g.names.length, 0) + hiddenNames.length;
      const kind = thumbKind(q);

      return (
        <div key={q.id} className="mms-question">
          <div className="mms-result-head">
            <span className="mms-question-num">{index + 1}</span>
            <span className="mms-question-label">{q.label}</span>
            <span className="mms-result-total">{answeredTotal} odp.</span>
          </div>
          {answeredTotal === 0 && <p className="mms-note">Brak odpowiedzi.</p>}
          {sorted.map((g) => (
            <div key={g.option.id} className={`mms-result-row${g.mineIncluded ? " mms-result-row--mine" : ""}`}>
              {kind && renderThumb(g.option, kind)}
              <div className="mms-result-body">
                <div className="mms-result-line">
                  <span className="mms-answer-label">{g.option.label}</span>
                  <span className="mms-result-count">{g.names.length}</span>
                </div>
                <div className="mms-result-bar">
                  <div className="mms-result-bar-fill" style={{ width: `${Math.round((g.names.length / answeredTotal) * 100)}%` }} />
                </div>
                <div className="mms-result-names">{g.names.join(", ")}</div>
              </div>
            </div>
          ))}
          {hiddenNames.length > 0 && (
            <div className="mms-result-row mms-result-row--hidden">
              <span className="mms-thumb">
                <IconLock style={ICON_STYLE} />
              </span>
              <div className="mms-result-body">
                <div className="mms-result-line">
                  <span className="mms-answer-label">Ukryte — spoiler z tytułu, którego nie obejrzałeś/aś</span>
                  <span className="mms-result-count">{hiddenNames.length}</span>
                </div>
                <div className="mms-result-names">{hiddenNames.join(", ")}</div>
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="mms-root">
      <style>{CSS}</style>
      <div className="mmw-phase-block mms-header">
        <div>
          <h4 className="mmw-phase-title">Ankieta Marvela</h4>
          <span className="mms-progress-label">
            Odpowiedziano {answeredCount} z {SURVEY_QUESTIONS.length}
          </span>
        </div>
        <div className="mms-view-toggle" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={view === "form"}
            className={`mms-view-btn${view === "form" ? " mms-view-btn--active" : ""}`}
            onClick={() => setView("form")}
          >
            Moje odpowiedzi
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "results"}
            className={`mms-view-btn${view === "results" ? " mms-view-btn--active" : ""}`}
            onClick={() => setView("results")}
          >
            Wyniki
          </button>
        </div>
      </div>

      {saveFailed && (
        <p className="mms-save-error">
          Nie udało się zapisać odpowiedzi — odśwież stronę i spróbuj ponownie.
        </p>
      )}

      {!loaded ? <p className="mms-empty mms-empty--block">Ładowanie ankiety…</p> : view === "form" ? renderForm() : renderResults()}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles — rendered inside .mmw-root, so the --mmw-* tokens resolve  */
/* ------------------------------------------------------------------ */

const CSS = `
.mms-root {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.mms-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.mms-progress-label {
  font-size: 0.78rem;
  color: var(--mmw-text-secondary);
}

.mms-view-toggle {
  display: inline-flex;
  background: var(--mmw-surface-2);
  border: 0.5px solid var(--mmw-border);
  border-radius: 999px;
  padding: 0.2rem;
}

.mms-view-btn {
  border: none;
  background: none;
  color: var(--mmw-text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  cursor: pointer;
}

.mms-view-btn--active {
  background: var(--mmw-fill-accent);
  color: #fff;
}

.mms-question {
  background: var(--mmw-surface-1);
  border: 0.5px solid var(--mmw-border);
  border-radius: var(--mmw-radius);
  padding: 0.7rem 0.85rem;
}

.mms-question--open {
  border-color: var(--mmw-fill-accent);
}

.mms-question-head {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 100%;
  background: none;
  border: none;
  padding: 0;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.mms-question-num {
  flex: 0 0 auto;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--mmw-surface-2);
  color: var(--mmw-text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
}

.mms-question-main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.mms-question-label {
  font-size: 0.9rem;
  font-weight: 600;
}

.mms-question-action {
  flex: 0 0 auto;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--mmw-text-accent);
}

.mms-answer {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
}

.mms-answer--empty {
  font-size: 0.8rem;
  color: var(--mmw-text-secondary);
}

.mms-answer-label {
  font-size: 0.82rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mms-thumb {
  position: relative;
  flex: 0 0 auto;
  width: 32px;
  height: 44px;
  border-radius: 5px;
  overflow: hidden;
  background: var(--mmw-surface-2);
  color: var(--mmw-text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
}

.mms-thumb-img {
  object-fit: cover;
}

.mms-suggestion {
  margin-top: 0.55rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
  width: 100%;
  text-align: left;
  background: var(--mmw-bg-warning);
  color: var(--mmw-text-warning);
  border: 0.5px dashed var(--mmw-text-warning);
  border-radius: calc(var(--mmw-radius) - 4px);
  padding: 0.45rem 0.6rem;
  font-size: 0.78rem;
  cursor: pointer;
}

.mms-picker {
  margin-top: 0.7rem;
  padding-top: 0.7rem;
  border-top: 0.5px solid var(--mmw-border);
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.mms-search {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  background: var(--mmw-surface-2);
  border: 0.5px solid var(--mmw-border);
  border-radius: calc(var(--mmw-radius) - 4px);
  padding: 0 0.6rem;
  color: var(--mmw-text-secondary);
}

.mms-search input,
.mms-custom input {
  flex: 1 1 auto;
  min-width: 0;
  background: none;
  border: none;
  outline: none;
  color: var(--mmw-text-primary);
  font-size: 0.85rem;
  padding: 0.5rem 0;
}

.mms-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.4rem;
  max-height: 360px;
  overflow-y: auto;
  padding-right: 0.15rem;
}

.mms-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-align: left;
  background: var(--mmw-surface-2);
  border: 0.5px solid var(--mmw-border);
  border-radius: calc(var(--mmw-radius) - 4px);
  padding: 0.45rem 0.55rem;
  color: var(--mmw-text-primary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.mms-options--thumbs .mms-option {
  padding: 0.3rem 0.45rem 0.3rem 0.3rem;
}

.mms-option:hover {
  border-color: var(--mmw-fill-accent);
  transform: translateY(-1px);
}

.mms-option--chosen {
  border-color: var(--mmw-text-success);
  background: var(--mmw-bg-success);
}

.mms-option-text {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.mms-option-label {
  line-height: 1.25;
}

.mms-option-sub {
  font-size: 0.7rem;
  color: var(--mmw-text-secondary);
}

.mms-option-check {
  flex: 0 0 auto;
  color: var(--mmw-text-success);
}

.mms-custom {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--mmw-surface-2);
  border: 0.5px solid var(--mmw-border);
  border-radius: calc(var(--mmw-radius) - 4px);
  padding: 0.2rem 0.25rem 0.2rem 0.6rem;
}

.mms-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border-radius: calc(var(--mmw-radius) - 4px);
  padding: 0.4rem 0.8rem;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  border: 0.5px solid var(--mmw-border);
}

.mms-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mms-btn--primary {
  background: var(--mmw-fill-accent);
  border-color: var(--mmw-fill-accent);
  color: #fff;
}

.mms-btn--ghost {
  align-self: flex-start;
  background: none;
  color: var(--mmw-text-secondary);
}

.mms-btn--ghost:hover {
  color: var(--mmw-text-danger);
}

.mms-note {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  color: var(--mmw-text-secondary);
}

.mms-empty {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  color: var(--mmw-text-secondary);
}

.mms-empty--block {
  justify-content: center;
  padding: 1.5rem 1rem;
  background: var(--mmw-surface-1);
  border: 0.5px solid var(--mmw-border);
  border-radius: var(--mmw-radius);
}

.mms-result-head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.5rem;
}

.mms-result-total {
  margin-left: auto;
  font-size: 0.72rem;
  color: var(--mmw-text-secondary);
}

.mms-result-row {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.4rem 0;
  border-top: 0.5px solid var(--mmw-border);
}

.mms-result-row--mine .mms-answer-label {
  color: var(--mmw-text-success);
  font-weight: 600;
}

.mms-result-row--hidden {
  opacity: 0.7;
}

.mms-result-body {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.mms-result-line {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.mms-result-count {
  font-size: 0.78rem;
  font-weight: 700;
}

.mms-result-bar {
  height: 5px;
  border-radius: 999px;
  background: var(--mmw-surface-2);
  overflow: hidden;
}

.mms-result-bar-fill {
  height: 100%;
  background: var(--mmw-fill-accent);
  border-radius: 999px;
}

.mms-save-error {
  margin: 0;
  padding: 0.6rem 0.85rem;
  border-radius: var(--mmw-radius);
  border: 0.5px solid var(--mmw-text-danger);
  background: rgba(248, 113, 113, 0.12);
  color: var(--mmw-text-danger);
  font-size: 0.82rem;
}

.mms-result-names {
  font-size: 0.72rem;
  color: var(--mmw-text-secondary);
}
`;
