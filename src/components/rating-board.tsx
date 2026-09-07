import { useMemo, useState } from "react";
import { ModeSwitch } from "./mode-switch";
import { MkSelect } from "./ui/mk-select";
import type { RatingEntry, RatingResult } from "../types/rating";

type RatingBoardProps = {
  entries: RatingEntry[];
  isOverlay: boolean;
  months: string[];
  onResetRating: () => void;
  onShowBracket: () => void;
  onShowDraft: () => void;
  onShowRoster: () => void;
  results: RatingResult[];
};

function monthLabel(month: string) {
  const [year, value] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(new Date(year, value - 1));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short" }).format(new Date(value));
}

function toEntries(results: RatingResult[]) {
  const points = new Map<string, RatingEntry>();
  results.forEach((result) => {
    const winner = points.get(result.winner) ?? { name: result.winner, points: 0, matches: 0, wins: 0, losses: 0, fightsWon: 0, fightsLost: 0, lastPlayedAt: "" };
    winner.points += 4; winner.matches += 1; winner.wins += 1; winner.fightsWon += 1;
    winner.lastPlayedAt = winner.lastPlayedAt > result.playedAt ? winner.lastPlayedAt : result.playedAt;
    points.set(winner.name, winner);

    const loser = points.get(result.loser) ?? { name: result.loser, points: 0, matches: 0, wins: 0, losses: 0, fightsWon: 0, fightsLost: 0, lastPlayedAt: "" };
    loser.matches += 1; loser.losses += 1; loser.fightsLost += 1;
    loser.lastPlayedAt = loser.lastPlayedAt > result.playedAt ? loser.lastPlayedAt : result.playedAt;
    points.set(loser.name, loser);
  });
  return [...points.values()].sort((left, right) => right.points - left.points || right.wins - left.wins || left.name.localeCompare(right.name, "ru"));
}

export function RatingBoard({ entries, isOverlay, months, onResetRating, onShowBracket, onShowDraft, onShowRoster, results }: RatingBoardProps) {
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [isResetConfirming, setIsResetConfirming] = useState(false);
  const filteredResults = useMemo(() => selectedMonth === "all" ? results : results.filter((result) => result.month === selectedMonth), [results, selectedMonth]);
  const filteredEntries = useMemo(() => selectedMonth === "all" ? entries : toEntries(filteredResults), [entries, filteredResults, selectedMonth]);
  const periodOptions = useMemo(() => [{ value: "all", label: "ВЕСЬ СЕЗОН" }, ...months.map((month) => ({ value: month, label: monthLabel(month).toUpperCase() }))], [months]);

  function handleReset() {
    if (!isResetConfirming) {
      setIsResetConfirming(true);
      return;
    }
    onResetRating();
    setSelectedMonth("all");
    setIsResetConfirming(false);
  }

  return (
    <>
      <header className="rating-header">
        <div><p className="page-eyebrow">MK1 TOURNAMENT</p><h1 className="page-title">РЕЙТИНГ ИГРОКОВ</h1></div>
        {!isOverlay && <ModeSwitch activeMode="rating" onChange={(mode) => { if (mode === "roster") onShowRoster(); if (mode === "draft") onShowDraft(); if (mode === "bracket") onShowBracket(); }} />}
      </header>

      <section className="rating-panel" aria-label="Рейтинг игроков">
        <div className="rating-panel__toolbar">
          <label className="rating-month"><span>ПЕРИОД</span><MkSelect ariaLabel="Период рейтинга" options={periodOptions} value={selectedMonth} onChange={setSelectedMonth} /></label>
          <button className={`rating-reset ${isResetConfirming ? "is-confirming" : ""}`} disabled={results.length === 0} type="button" onClick={handleReset}>
            {isResetConfirming ? "ПОДТВЕРДИТЬ СБРОС" : "СБРОСИТЬ РЕЙТИНГ"}
          </button>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="rating-empty"><strong>РЕЗУЛЬТАТОВ ПОКА НЕТ</strong></div>
        ) : (
          <div className="rating-table" role="table" aria-label="Таблица рейтинга">
            <div className="rating-table__head" role="row"><span>#</span><span>ИГРОК</span><span>ОЧКИ</span><span>В / П</span><span>БОИ</span><span>МАТЧИ</span><span>ПОСЛЕДНИЙ</span></div>
            {filteredEntries.map((entry, index) => (
              <div className="rating-table__row" key={entry.name} role="row">
                <strong>{String(index + 1).padStart(2, "0")}</strong><b>{entry.name}</b><em>{entry.points}</em><span>{entry.wins} / {entry.losses}</span><span>{entry.fightsWon} / {entry.fightsLost}</span><span>{entry.matches}</span><span>{formatDate(entry.lastPlayedAt)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
