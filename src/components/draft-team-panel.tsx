import type { CSSProperties } from "react";
import type { DraftSelection, DraftTeamId } from "../types/draft";
import type { Fighter } from "../types/fighter";

type DraftTeamPanelProps = {
  teamId: DraftTeamId;
  name: string;
  players: string[];
  selections: DraftSelection[];
  fightersById: Map<string, Fighter>;
  isActive: boolean;
  isDealing: boolean;
  revealVersion: number;
};

type PlayerStyle = CSSProperties & {
  "--player-index": number;
};

export function DraftTeamPanel({
  teamId,
  name,
  players,
  selections,
  fightersById,
  isActive,
  isDealing,
  revealVersion,
}: DraftTeamPanelProps) {
  const picks = selections.filter((selection) => selection.teamId === teamId && selection.action === "pick");
  const bans = selections.filter((selection) => selection.teamId === teamId && selection.action === "ban");

  return (
    <aside className={`draft-team draft-team--${teamId} ${isActive ? "is-active" : ""} ${isDealing ? "is-dealing" : ""}`}>
      <div className="draft-team__heading">
        <span className="draft-team__sigil">{teamId === "fire" ? "A" : "B"}</span>
        <div>
          <p>8 PLAYERS</p>
          <h2>{name}</h2>
        </div>
      </div>

      <ol className="draft-team__players">
        {players.length > 0 ? (
          players.map((player, index) => {
            const style: PlayerStyle = { "--player-index": index * 2 + (teamId === "shadow" ? 1 : 0) };

            return (
            <li key={`${revealVersion}-${index}`} style={style}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{player}</strong>
            </li>
            );
          })
        ) : (
          <li className="draft-team__empty">Команда не распределена</li>
        )}
      </ol>

      <div className="draft-team__selection-group">
        <div className="draft-team__selection-title">
          <span>PICKS</span>
          <strong>{picks.length}/5</strong>
        </div>
        <div className="draft-team__slots">
          {Array.from({ length: 5 }, (_, index) => {
            const selection = picks[index];
            return <span key={index}>{selection ? fightersById.get(selection.fighterId)?.name : "—"}</span>;
          })}
        </div>
      </div>

      <div className="draft-team__bans">
        <span>BANS {bans.length}/5</span>
        <p>{bans.map(({ fighterId }) => fightersById.get(fighterId)?.name).join(" · ") || "—"}</p>
      </div>
    </aside>
  );
}
