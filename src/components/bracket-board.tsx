import { useEffect, useMemo, useState } from "react";
import { ModeSwitch } from "./mode-switch";
import type { RatingResult } from "../types/rating";

type Match = { id: string; players: [string, string]; scores: [string, string] };
type State = { matches: Match[]; ratingRecorded: boolean; tournamentId: string };
type Props = { isOverlay: boolean; onRecordRating: (results: RatingResult[]) => void; onShowDraft: () => void; onShowRating: () => void; onShowKing: () => void; onShowRoster: () => void };
type Outcome = "winner" | "loser";

const storageKey = "mk1-tournament-bracket:v3";
const editable = new Set(["upper-1", "upper-2", "lower-1", "lower-2"]);
const initial: Match[] = [
  ["upper-1", "Игрок 01", "Игрок 02"], ["upper-2", "Игрок 03", "Игрок 04"], ["upper-final", "", ""],
  ["lower-1", "Игрок 05", "Игрок 06"], ["lower-2", "Игрок 07", "Игрок 08"], ["lower-3", "", ""], ["lower-4", "", ""], ["lower-5", "", ""], ["lower-6", "", ""], ["grand-final", "", ""],
].map(([id, first, second]) => ({ id, players: [first, second] as [string, string], scores: ["", ""] as [string, string] }));

const newId = () => `bracket-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const fresh = (): State => ({ matches: initial.map((match) => ({ ...match, players: [...match.players] as Match["players"], scores: ["", ""] as Match["scores"] })), ratingRecorded: false, tournamentId: newId() });
const complete = (match: Match) => Boolean(match.players[0].trim() && match.players[1].trim() && match.scores[0] !== "" && match.scores[1] !== "" && Number(match.scores[0]) !== Number(match.scores[1]));
const result = (match: Match, outcome: Outcome) => { if (!complete(match)) return ""; const winner = Number(match.scores[0]) > Number(match.scores[1]) ? match.players[0] : match.players[1]; return outcome === "winner" ? winner : winner === match.players[0] ? match.players[1] : match.players[0]; };

function read(): State { try { const stored = JSON.parse(localStorage.getItem(storageKey) ?? "null") as State | null; if (stored?.matches?.length === initial.length) return { ...stored, tournamentId: stored.tournamentId || newId() }; } catch { /* stale data is replaced */ } return fresh(); }
function cascade(matches: Match[]) {
  const next = matches.map((match) => ({ ...match, players: [...match.players] as Match["players"], scores: [...match.scores] as Match["scores"] }));
  const get = (id: string) => next.find((match) => match.id === id)!;
  const place = (from: string, outcome: Outcome, to: string, slot: 0 | 1) => { const target = get(to); const value = result(get(from), outcome); if (target.players[slot] !== value) { target.players[slot] = value; target.scores[slot] = ""; } };
  place("upper-1", "winner", "upper-final", 0); place("upper-2", "winner", "upper-final", 1);
  place("lower-1", "winner", "lower-3", 0); place("upper-1", "loser", "lower-3", 1);
  place("lower-2", "winner", "lower-4", 0); place("upper-2", "loser", "lower-4", 1);
  place("lower-3", "winner", "lower-5", 0); place("lower-4", "winner", "lower-5", 1);
  place("lower-5", "winner", "lower-6", 0); place("upper-final", "loser", "lower-6", 1);
  place("upper-final", "winner", "grand-final", 0); place("lower-6", "winner", "grand-final", 1);
  return next;
}

function Card({ match, disabled, editable: canEdit, onChange }: { match: Match; disabled: boolean; editable: boolean; onChange: (id: string, row: 0 | 1, field: "player" | "score", value: string) => void }) {
  const canScore = !disabled && Boolean(match.players[0].trim() && match.players[1].trim());
  return <div className="bracket-match">{([0, 1] as const).map((row) => <div className="bracket-match__row" key={row}><input aria-label={`Ник игрока ${row + 1}`} disabled={disabled || !canEdit} placeholder="Ник игрока" value={match.players[row]} onChange={(event) => onChange(match.id, row, "player", event.target.value)} /><input aria-label={`Счёт игрока ${row + 1}`} className="bracket-match__score" disabled={!canScore} inputMode="numeric" maxLength={2} placeholder="–" value={match.scores[row]} onChange={(event) => onChange(match.id, row, "score", event.target.value.replace(/[^0-9]/g, ""))} /></div>)}</div>;
}

export function BracketBoard({ isOverlay, onRecordRating, onShowDraft, onShowRating, onShowKing, onShowRoster }: Props) {
  const [state, setState] = useState<State>(read); const [confirming, setConfirming] = useState(false);
  const completed = useMemo(() => state.matches.filter(complete), [state.matches]); const canRecord = completed.length === state.matches.length && !state.ratingRecorded;
  const champion = result(state.matches.find((match) => match.id === "grand-final")!, "winner").trim();
  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(state)); }, [state]);
  const update = (id: string, row: 0 | 1, field: "player" | "score", value: string) => { if (state.ratingRecorded) return; setState((current) => ({ ...current, matches: cascade(current.matches.map((match) => { if (match.id !== id) return match; const next = { ...match, players: [...match.players] as Match["players"], scores: [...match.scores] as Match["scores"] }; if (field === "player") { next.players[row] = value; next.scores[row] = ""; } else next.scores[row] = value; return next; })) })); };
  const record = () => { if (!canRecord) return; const playedAt = new Date().toISOString(); onRecordRating(completed.map((match) => ({ sourceId: `${state.tournamentId}:${match.id}`, playedAt, month: playedAt.slice(0, 7), winner: result(match, "winner").trim(), loser: result(match, "loser").trim() }))); setState((current) => ({ ...current, ratingRecorded: true })); };
  const reset = () => { if (!confirming) { setConfirming(true); return; } setState(fresh()); setConfirming(false); };
  const byId = (id: string) => state.matches.find((match) => match.id === id)!;
  const card = (id: string) => ({ match: byId(id), disabled: state.ratingRecorded, editable: editable.has(id), onChange: update });
  return <><header className="app-page-header bracket-header"><div className="app-page-header__top"><div><p className="page-eyebrow">ELKAMUSAEV EVENTS CENTER</p><h1 className="page-title">ТУРНИРНАЯ СЕТКА</h1></div></div></header>{!isOverlay && <div className="page-mode-row"><ModeSwitch activeMode="bracket" onChange={(mode) => { if (mode === "roster") onShowRoster(); if (mode === "draft") onShowDraft(); if (mode === "rating") onShowRating(); if (mode === "king") onShowKing(); }} /><div className="bracket-tournament-actions"><button disabled={!canRecord} type="button" onClick={record}>{state.ratingRecorded ? "ТУРНИР УЧТЕН" : "ЗАВЕРШИТЬ ТУРНИР"}</button>{state.ratingRecorded && <button className={`is-reset ${confirming ? "is-confirming" : ""}`} type="button" onClick={reset}>{confirming ? "ПОДТВЕРДИТЬ НОВУЮ СЕТКУ" : "НОВАЯ СЕТКА"}</button>}</div></div>}<section className="bracket-grid bracket-grid--top8" aria-label="Турнирная сетка Top 8"><div className="bracket-lane bracket-lane--upper bracket-lane--top8"><div className="bracket-column bracket-column--opening"><Card {...card("upper-1")} /><Card {...card("upper-2")} /></div><div className="bracket-column bracket-column--middle"><Card {...card("upper-final")} /></div><div className="bracket-column bracket-column--final"><Card {...card("grand-final")} /></div><div className="bracket-champion"><span>ЧЕМПИОН</span>{champion && <strong>{champion}</strong>}</div></div><div className="bracket-divider" /><div className="bracket-lane bracket-lane--lower bracket-lane--top8"><div className="bracket-column bracket-column--opening"><Card {...card("lower-1")} /><Card {...card("lower-2")} /></div><div className="bracket-column bracket-column--middle"><Card {...card("lower-3")} /><Card {...card("lower-4")} /></div><div className="bracket-column bracket-column--final"><Card {...card("lower-5")} /></div><div className="bracket-column bracket-column--grand"><Card {...card("lower-6")} /></div></div></section></>;
}
