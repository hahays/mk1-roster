import type { CSSProperties } from "react";
import { getAssetUrl } from "../lib/assets";
import type { Fighter } from "../types/fighter";
import { DeathMark } from "./death-mark";

type FighterCardProps = {
  fighter: Fighter;
  index: number;
  isEliminated: boolean;
  onToggle: (id: string) => void;
  eliminationLabel?: "DEAD" | "BANNED";
};

type CardStyle = CSSProperties & {
  "--card-index": number;
};

export function FighterCard({ fighter, index, isEliminated, onToggle, eliminationLabel = "DEAD" }: FighterCardProps) {
  const action = eliminationLabel === "BANNED" ? (isEliminated ? "Unban" : "Ban") : (isEliminated ? "Return" : "Eliminate");
  const style: CardStyle = { "--card-index": index };

  return (
    <button
      className={`fighter-card group ${isEliminated ? "is-eliminated" : ""}`}
      type="button"
      aria-label={`${action} ${fighter.name}`}
      aria-pressed={isEliminated}
      onClick={() => onToggle(fighter.id)}
      style={style}
    >
      <span className="fighter-card__surface">
        <span className="fighter-card__glow" />
        <img
          className="fighter-card__portrait"
          src={getAssetUrl(fighter.image)}
          alt=""
          loading="eager"
          decoding="async"
          draggable="false"
        />
        <span className="fighter-card__blood" aria-hidden="true" />
        <DeathMark label={eliminationLabel} />
        {fighter.group === "kameo" && <span className="fighter-card__type">KAMEO</span>}
        <span className="fighter-card__name">{fighter.name}</span>
      </span>
    </button>
  );
}
