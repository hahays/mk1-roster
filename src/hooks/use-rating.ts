import { useEffect, useMemo, useState } from "react";
import type { RatingEntry, RatingResult } from "../types/rating";

const STORAGE_KEY = "mk1-player-rating:v1";

type RatingState = {
  results: RatingResult[];
};

function readRatingState(): RatingState {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<RatingState> | null;
    return { results: Array.isArray(stored?.results) ? stored.results : [] };
  } catch {
    return { results: [] };
  }
}

function toEntryMap(results: RatingResult[]) {
  const entries = new Map<string, RatingEntry>();

  function ensure(name: string) {
    const existing = entries.get(name);
    if (existing) return existing;

    const entry: RatingEntry = {
      name,
      points: 0,
      matches: 0,
      wins: 0,
      losses: 0,
      fightsWon: 0,
      fightsLost: 0,
      lastPlayedAt: "",
    };
    entries.set(name, entry);
    return entry;
  }

  results.forEach((result) => {
    const winner = ensure(result.winner);
    const loser = ensure(result.loser);

    winner.points += 4;
    winner.matches += 1;
    winner.wins += 1;
    winner.fightsWon += 1;
    winner.lastPlayedAt = winner.lastPlayedAt > result.playedAt ? winner.lastPlayedAt : result.playedAt;

    loser.matches += 1;
    loser.losses += 1;
    loser.fightsLost += 1;
    loser.lastPlayedAt = loser.lastPlayedAt > result.playedAt ? loser.lastPlayedAt : result.playedAt;
  });

  return [...entries.values()].sort((left, right) => (
    right.points - left.points || right.wins - left.wins || left.name.localeCompare(right.name, "ru")
  ));
}

export function useRating() {
  const [state, setState] = useState<RatingState>(readRatingState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  function recordResults(nextResults: RatingResult[]) {
    setState((current) => {
      const sourceIds = new Set(current.results.map((result) => result.sourceId));
      const uniqueResults = nextResults.filter((result) => !sourceIds.has(result.sourceId));
      return uniqueResults.length === 0 ? current : { results: [...current.results, ...uniqueResults] };
    });
  }

  function resetRating() {
    setState({ results: [] });
  }

  const entries = useMemo(() => toEntryMap(state.results), [state.results]);
  const months = useMemo(() => [...new Set(state.results.map((result) => result.month))].sort().reverse(), [state.results]);

  return { entries, months, recordResults, resetRating, results: state.results };
}
