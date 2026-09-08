import { useEffect, useMemo, useState } from "react";
import { ModeSwitch } from "./mode-switch";
import type { RatingResult } from "../types/rating";

type BracketMatch = { id: string; players: [string, string]; scores: [string, string] };
type BracketState = { matches: BracketMatch[]; ratingRecorded: boolean; tournamentId: string };

type BracketBoardProps = {
  isOverlay: boolean;
  onRecordRating: (results: RatingResult[]) => void;
  onShowDraft: () => void;
  onShowRating: () => void;
  onShowRoster: () => void;
};

const STORAGE_KEY = "mk1-tournament-bracket:v1";
const initialMatches: BracketMatch[] = [
  { id: "semi-1", players: ["Игрок 01", "Игрок 02"], scores: ["", ""] },
  { id: "semi-2", players: ["Игрок 03", "Игрок 04"], scores: ["", ""] },
  { id: "final", players: ["", ""], scores: ["", ""] },
];

function createTournamentId() {
  return `bracket-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createInitialState(): BracketState {
  return {
    matches: initialMatches.map((match) => ({ ...match, players: [...match.players], scores: [...match.scores] } as BracketMatch)),
    ratingRecorded: false,
    tournamentId: createTournamentId(),
  };
}

function readBracketState(): BracketState {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as BracketState | BracketMatch[] | null;
    if (!Array.isArray(stored) && stored && Array.isArray(stored.matches) && stored.matches.length === initialMatches.length) {
      return { matches: stored.matches, ratingRecorded: Boolean(stored.ratingRecorded), tournamentId: stored.tournamentId || createTournamentId() };
    }
  } catch {
    // Start a clean four-player bracket.
  }
  return createInitialState();
}

function isCompleteMatch(match: BracketMatch) {
  const [firstScore, secondScore] = match.scores.map(Number);
  return Boolean(match.players[0].trim() && match.players[1].trim() && match.scores[0] !== "" && match.scores[1] !== "" && firstScore !== secondScore);
}

function MatchCard({ disabled, match, onChange }: { disabled: boolean; match: BracketMatch; onChange: (id: string, row: 0 | 1, field: "player" | "score", value: string) => void }) {
  return <div className="bracket-match">
    {([0, 1] as const).map((row) => <div className="bracket-match__row" key={row}>
      <input aria-label={`Ник игрока ${row + 1}`} disabled={disabled} placeholder="Ник игрока" value={match.players[row]} onChange={(event) => onChange(match.id, row, "player", event.target.value)} />
      <input aria-label={`Счёт игрока ${row + 1}`} className="bracket-match__score" disabled={disabled} inputMode="numeric" maxLength={2} placeholder="–" value={match.scores[row]} onChange={(event) => onChange(match.id, row, "score", event.target.value.replace(/[^0-9]/g, ""))} />
    </div>)}
  </div>;
}

export function BracketBoard({ isOverlay, onRecordRating, onShowDraft, onShowRating, onShowRoster }: BracketBoardProps) {
  const [state, setState] = useState<BracketState>(readBracketState);
  const [isResetConfirming, setIsResetConfirming] = useState(false);
  const completeMatches = useMemo(() => state.matches.filter(isCompleteMatch), [state.matches]);
  const canRecord = completeMatches.length === state.matches.length && !state.ratingRecorded;

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);

  function updateMatch(id: string, row: 0 | 1, field: "player" | "score", value: string) {
    if (state.ratingRecorded) return;
    setState((current) => ({ ...current, matches: current.matches.map((match) => {
      if (match.id !== id) return match;
      if (field === "player") {
        const players = [...match.players] as [string, string]; players[row] = value;
        return { ...match, players };
      }
      const scores = [...match.scores] as [string, string]; scores[row] = value;
      return { ...match, scores };
    }) }));
  }

  function recordTournament() {
    if (!canRecord) return;
    const playedAt = new Date().toISOString();
    const month = playedAt.slice(0, 7);
    onRecordRating(completeMatches.map((match) => ({
      sourceId: `${state.tournamentId}:${match.id}`,
      playedAt,
      month,
      winner: Number(match.scores[0]) > Number(match.scores[1]) ? match.players[0].trim() : match.players[1].trim(),
      loser: Number(match.scores[0]) > Number(match.scores[1]) ? match.players[1].trim() : match.players[0].trim(),
    })));
    setState((current) => ({ ...current, ratingRecorded: true }));
  }

  function resetTournament() {
    if (!isResetConfirming) {
      setIsResetConfirming(true);
      return;
    }
    setState(createInitialState());
    setIsResetConfirming(false);
  }

  const byId = (id: string) => state.matches.find((match) => match.id === id)!;
  const props = (id: string) => ({ disabled: state.ratingRecorded, match: byId(id), onChange: updateMatch });

  return <>
    <header className="bracket-header">
      <div><p className="page-eyebrow">MK1 TOURNAMENT</p><h1 className="page-title">ТУРНИРНАЯ СЕТКА</h1></div>
      {!isOverlay && <ModeSwitch activeMode="bracket" onChange={(mode) => { if (mode === "roster") onShowRoster(); if (mode === "draft") onShowDraft(); if (mode === "rating") onShowRating(); }} />}
    </header>
    <div className="bracket-tournament-actions">
      <button disabled={!canRecord} title={canRecord ? "" : "Заполните результаты трёх матчей"} type="button" onClick={recordTournament}>{state.ratingRecorded ? "ТУРНИР УЧТЕН" : "ЗАВЕРШИТЬ ТУРНИР"}</button>
      {state.ratingRecorded ? <button className={`is-reset ${isResetConfirming ? "is-confirming" : ""}`} type="button" onClick={resetTournament}>{isResetConfirming ? "ПОДТВЕРДИТЬ НОВУЮ СЕТКУ" : "НОВАЯ СЕТКА"}</button> : null}
    </div>
    <section className="bracket-grid bracket-grid--four" aria-label="Турнирная сетка">
      <div className="bracket-lane bracket-lane--upper bracket-lane--four">
        <div className="bracket-column bracket-column--opening"><MatchCard {...props("semi-1")} /><MatchCard {...props("semi-2")} /></div>
        <div className="bracket-column bracket-column--middle"><MatchCard {...props("final")} /></div>
      </div>
    </section>
  </>;
}
