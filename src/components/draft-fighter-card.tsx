import type { CSSProperties } from "react";
import { getAssetUrl } from "../lib/assets";
import type { DraftSelection, DraftStep } from "../types/draft";
import type { Fighter } from "../types/fighter";

type DraftFighterCardProps = {
  fighter: Fighter;
  index: number;
  selection?: DraftSelection;
  teamName?: string;
  currentStep: DraftStep | null;
  disabled: boolean;
  onSelect: (id: string) => void;
};

type CardStyle = CSSProperties & {
  "--card-index": number;
};

export function DraftFighterCard({
  fighter,
  index,
  selection,
  teamName,
  currentStep,
  disabled,
  onSelect,
}: DraftFighterCardProps) {
  const style: CardStyle = { "--card-index": index };
  const stateClass = selection
    ? `is-${selection.action} team-${selection.teamId}`
    : currentStep
      ? `is-available team-${currentStep.teamId}`
      : "";

  return (
    <button
      className={`draft-fighter-card ${stateClass}`}
      type="button"
      disabled={disabled || Boolean(selection)}
      aria-label={selection ? `${fighter.name} ${selection.action} ${teamName ?? ""}`.trim() : `Select ${fighter.name}`}
      onClick={() => onSelect(fighter.id)}
      style={style}
    >
      <img
        className="draft-fighter-card__portrait"
        src={getAssetUrl(fighter.image)}
        alt=""
        loading="eager"
        decoding="async"
        draggable="false"
      />
      <span className="draft-fighter-card__shade" />
      {selection && (
        <span className="draft-fighter-card__result">
          <strong>{selection.action === "ban" ? "BANNED" : "PICKED"}</strong>
          <span>{teamName}</span>
        </span>
      )}
      <span className="draft-fighter-card__name">{fighter.name}</span>
    </button>
  );
}
