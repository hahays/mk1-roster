import { useEffect, useMemo, useState } from "react";
import { ModeSwitch } from "./mode-switch";
import type { RatingResult } from "../types/rating";

type Match = { id: string; players: [string, string]; scores: [string, string] };
type State = { matches: Match[]; ratingRecorded: boolean; tournamentId: string };
type Route = { from: string; outcome: "winner" | "loser"; to: string; slot: 0 | 1 };
type Props = { isOverlay: boolean; onRecordRating: (results: RatingResult[]) => void; onShowDraft: () => void; onShowRating: () => void; onShowRoster: () => void };

const storageKey = "mk1-tournament-bracket:v1";
const opening = ["upper-1", "upper-2", "upper-3", "upper-4"];
const initial: Match[] = [
  ["upper-1", "Игрок 01", "Игрок 02"], ["upper-2", "Игрок 03", "Игрок 04"], ["upper-3", "Игрок 05", "Игрок 06"], ["upper-4", "Игрок 07", "Игрок 08"],
  ["upper-5", "", ""], ["upper-6", "", ""], ["upper-7", "", ""], ["lower-1", "", ""], ["lower-2", "", ""], ["lower-3", "", ""], ["lower-4", "", ""], ["lower-5", "", ""], ["lower-6", "", ""], ["grand-final", "", ""],
].map(([id, first, second]) => ({ id, players: [first, second] as [string, string], scores: ["", ""] as [string, string] }));
const routes: Route[] = [
  ["upper-1", "winner", "upper-5", 0], ["upper-1", "loser", "lower-1", 0], ["upper-2", "winner", "upper-5", 1], ["upper-2", "loser", "lower-1", 1],
  ["upper-3", "winner", "upper-6", 0], ["upper-3", "loser", "lower-2", 0], ["upper-4", "winner", "upper-6", 1], ["upper-4", "loser", "lower-2", 1],
  ["upper-5", "winner", "upper-7", 0], ["upper-5", "loser", "lower-3", 1], ["upper-6", "winner", "upper-7", 1], ["upper-6", "loser", "lower-4", 1],
  ["lower-1", "winner", "lower-3", 0], ["lower-2", "winner", "lower-4", 0], ["lower-3", "winner", "lower-5", 0], ["lower-4", "winner", "lower-5", 1],
  ["lower-5", "winner", "lower-6", 0], ["upper-7", "loser", "lower-6", 1], ["upper-7", "winner", "grand-final", 0], ["lower-6", "winner", "grand-final", 1],
].map(([from, outcome, to, slot]) => ({ from: from as string, outcome: outcome as Route["outcome"], to: to as string, slot: slot as 0 | 1 }));

const newId = () => `bracket-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const fresh = (): State => ({ matches: initial.map((match) => ({ ...match, players: [...match.players] as Match["players"], scores: ["", ""] })), ratingRecorded: false, tournamentId: newId() });
const complete = (match: Match) => Boolean(match.players[0].trim() && match.players[1].trim() && match.scores[0] !== "" && match.scores[1] !== "" && Number(match.scores[0]) !== Number(match.scores[1]));
const result = (match: Match, kind: Route["outcome"]) => { if (!complete(match)) return ""; const winner = Number(match.scores[0]) > Number(match.scores[1]) ? match.players[0] : match.players[1]; return kind === "winner" ? winner : winner === match.players[0] ? match.players[1] : match.players[0]; };
function read(): State { try { const stored = JSON.parse(localStorage.getItem(storageKey) ?? "null") as State | null; if (stored?.matches?.length === initial.length) return { ...stored, tournamentId: stored.tournamentId || newId() }; } catch { /* reset stale data */ } return fresh(); }
function cascade(matches: Match[]) { const next = matches.map((match) => ({ ...match, players: [...match.players] as Match["players"], scores: [...match.scores] as Match["scores"] })); const find = (id: string) => next.find((match) => match.id === id)!; routes.forEach((route) => { const target = find(route.to); const value = result(find(route.from), route.outcome); if (target.players[route.slot] !== value) { target.players[route.slot] = value; target.scores[route.slot] = ""; } }); return next; }

function Card({ match, disabled, editable, onChange }: { match: Match; disabled: boolean; editable: boolean; onChange: (id: string, row: 0 | 1, field: "player" | "score", value: string) => void }) {
  const canScore = !disabled && Boolean(match.players[0].trim() && match.players[1].trim());
  return <div className="bracket-match">{([0, 1] as const).map((row) => <div className="bracket-match__row" key={row}><input aria-label={`Ник игрока ${row + 1}`} disabled={disabled || !editable} placeholder="Ник игрока" value={match.players[row]} onChange={(event) => onChange(match.id, row, "player", event.target.value)} /><input aria-label={`Счёт игрока ${row + 1}`} className="bracket-match__score" disabled={!canScore} inputMode="numeric" maxLength={2} placeholder="–" value={match.scores[row]} onChange={(event) => onChange(match.id, row, "score", event.target.value.replace(/[^0-9]/g, ""))} /></div>)}</div>;
}

export function BracketBoard({ isOverlay, onRecordRating, onShowDraft, onShowRating, onShowRoster }: Props) {
  const [state, setState] = useState<State>(read); const [confirming, setConfirming] = useState(false);
  const completed = useMemo(() => state.matches.filter(complete), [state.matches]); const canRecord = completed.length === state.matches.length && !state.ratingRecorded;
  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(state)); }, [state]);
  const update = (id: string, row: 0 | 1, field: "player" | "score", value: string) => { if (state.ratingRecorded) return; setState((current) => ({ ...current, matches: cascade(current.matches.map((match) => { if (match.id !== id) return match; const next = { ...match, players: [...match.players] as Match["players"], scores: [...match.scores] as Match["scores"] }; if (field === "player") { next.players[row] = value; next.scores[row] = ""; } else next.scores[row] = value; return next; })) })); };
  const record = () => { if (!canRecord) return; const playedAt = new Date().toISOString(); onRecordRating(completed.map((match) => ({ sourceId: `${state.tournamentId}:${match.id}`, playedAt, month: playedAt.slice(0, 7), winner: result(match, "winner").trim(), loser: result(match, "loser").trim() }))); setState((current) => ({ ...current, ratingRecorded: true })); };
  const reset = () => { if (!confirming) { setConfirming(true); return; } setState(fresh()); setConfirming(false); };
  const byId = (id: string) => state.matches.find((match) => match.id === id)!;
  const card = (id: string) => ({ match: byId(id), disabled: state.ratingRecorded, editable: opening.includes(id), onChange: update });
  return <><header className="bracket-header"><div><p className="page-eyebrow">ELKAMUSAEV EVENTS CENTER</p><h1 className="page-title">ТУРНИРНАЯ СЕТКА</h1></div></header>{!isOverlay && <div className="page-mode-row"><ModeSwitch activeMode="bracket" onChange={(mode) => { if (mode === "roster") onShowRoster(); if (mode === "draft") onShowDraft(); if (mode === "rating") onShowRating(); }} /><div className="bracket-tournament-actions"><button disabled={!canRecord} type="button" onClick={record}>{state.ratingRecorded ? "ТУРНИР УЧТЕН" : "ЗАВЕРШИТЬ ТУРНИР"}</button>{state.ratingRecorded && <button className={`is-reset ${confirming ? "is-confirming" : ""}`} type="button" onClick={reset}>{confirming ? "ПОДТВЕРДИТЬ НОВУЮ СЕТКУ" : "НОВАЯ СЕТКА"}</button>}</div></div>}<section className="bracket-grid bracket-grid--top8" aria-label="Турнирная сетка Top 8"><div className="bracket-lane bracket-lane--upper bracket-lane--top8"><div className="bracket-column bracket-column--opening"><Card {...card("upper-1")} /><Card {...card("upper-2")} /><Card {...card("upper-3")} /><Card {...card("upper-4")} /></div><div className="bracket-column bracket-column--middle"><Card {...card("upper-5")} /><Card {...card("upper-6")} /></div><div className="bracket-column bracket-column--final"><Card {...card("upper-7")} /></div><div className="bracket-column bracket-column--grand"><Card {...card("grand-final")} /></div></div><div className="bracket-divider" /><div className="bracket-lane bracket-lane--lower bracket-lane--top8"><div className="bracket-column bracket-column--opening"><Card {...card("lower-1")} /><Card {...card("lower-2")} /></div><div className="bracket-column bracket-column--middle"><Card {...card("lower-3")} /><Card {...card("lower-4")} /></div><div className="bracket-column bracket-column--final"><Card {...card("lower-5")} /></div><div className="bracket-column bracket-column--grand"><Card {...card("lower-6")} /></div></div></section></>;
}
