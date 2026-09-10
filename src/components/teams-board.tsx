import { useEffect, useState, type CSSProperties } from "react";
import { ModeSwitch, type AppMode } from "./mode-switch";
import "../teams.css";

const STORAGE_KEY = "mk1-stream-teams:v1";
const emptyTeams = () => Array.from({ length: 16 }, () => ["", ""]);

function readTeams(): string[][] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (Array.isArray(saved) && saved.length === 16 && saved.every((team) =>
      Array.isArray(team) && team.length === 2 && team.every((name) => typeof name === "string" && name.length <= 40))) return saved;
  } catch { /* The board also works without browser storage. */ }
  return emptyTeams();
}

const sparks = Array.from({ length: 36 }, (_, index) => (
  <i key={index} style={{
    "--x": `${(index * 47) % 101}%`, "--drift": `${(index % 7 - 3) * 24}px`,
    "--duration": `${6 + index % 6}s`, "--delay": `${-index * 0.73}s`,
    "--size": `${index % 3 === 0 ? 3 : 2}px`,
  } as CSSProperties} />
));

export function TeamsBoard({ isOverlay, onChangeMode }: { isOverlay: boolean; onChangeMode: (mode: AppMode) => void }) {
  const [teams, setTeams] = useState(readTeams);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(teams)); } catch { /* Keep edits usable. */ }
  }, [teams]);

  return <>
    <div className="teams-sparks" aria-hidden="true">{sparks}</div>
    <header className="app-page-header">
      <div className="app-page-header__top">
        <div><p className="page-eyebrow">ELKAMUSAEV EVENTS CENTER</p><h1 className="page-title">TEAMS</h1></div>
      </div>
    </header>
    {!isOverlay && <div className="app-page-nav page-mode-row"><ModeSwitch activeMode="teams" onChange={onChangeMode} /></div>}
    <section className="teams-grid" aria-label="Teams">
      {teams.map((team, index) => <article className="stream-team" key={index} aria-label={`Team ${index + 1}`}>
        <span className="stream-team__number">{String(index + 1).padStart(2, "0")}</span>
        {team.map((name, player) => <input key={player} aria-label={`Team ${index + 1}, player ${player + 1}`} placeholder={isOverlay ? "" : `Player ${player + 1}`} value={name} readOnly={isOverlay} maxLength={40} autoComplete="off" spellCheck={false}
          onChange={(event) => setTeams((current) => current.map((entry, position) => position === index ? entry.map((value, slot) => slot === player ? event.target.value : value) : entry))} />)}
      </article>)}
    </section>
  </>;
}
