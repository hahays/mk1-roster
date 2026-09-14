import type { CSSProperties } from "react";
import { getAssetUrl } from "../lib/assets";
import type { DraftSelection, DraftStep, DraftTeamNames } from "../types/draft";
import type { Fighter } from "../types/fighter";

type DraftFighterCardProps = {
  fighter: Fighter;
  index: number;
  selections: DraftSelection[];
  teamNames: DraftTeamNames;
  currentStep: DraftStep | null;
  locked: boolean;
  canSelect: boolean;
  onSelect: (id: string) => void;
};

type CardStyle = CSSProperties & {
  "--card-index": number;
};

export function DraftFighterCard({
  fighter,
  index,
  selections,
  teamNames,
  currentStep,
  locked,
  canSelect,
  onSelect,
}: DraftFighterCardProps) {
  const style: CardStyle = { "--card-index": index };
  const ban = selections.find((selection) => selection.action === "ban");
  const picks = selections.filter((selection) => selection.action === "pick");
  const isMirror = picks.length === 2;
  const isMirrorOpen = picks.length === 1 && canSelect;
  const owner = ban ?? picks[0];
  const stateClass = ban
    ? `is-ban team-${ban.teamId}`
    : isMirror
      ? "is-pick is-mirror"
      : isMirrorOpen
        ? `is-pick is-mirror-open team-${picks[0].teamId} is-available team-current-${currentStep?.teamId}`
        : picks[0]
          ? `is-pick team-${picks[0].teamId}`
          : currentStep
            ? `is-available team-${currentStep.teamId}`
            : "";
  const resultLabel = ban ? "BANNED" : isMirror || isMirrorOpen ? "MIRROR" : picks[0] ? "PICKED" : "";
  const resultDetail = ban
    ? teamNames[ban.teamId]
    : isMirror
      ? `${teamNames.fire} · ${teamNames.shadow}`
      : isMirrorOpen
        ? `Copy ${teamNames[picks[0].teamId]}`
        : picks[0]
          ? teamNames[picks[0].teamId]
          : "";

  return (
    <button
      className={`draft-fighter-card ${stateClass}`}
      type="button"
      disabled={locked || !canSelect}
      aria-label={
        owner
          ? `${fighter.name} ${isMirror || isMirrorOpen ? "mirror" : owner.action} ${resultDetail}`.trim()
          : `Select ${fighter.name}`
      }
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
      {resultLabel && (
        <span className="draft-fighter-card__result">
          <strong>{resultLabel}</strong>
          <span>{resultDetail}</span>
        </span>
      )}
      <span className="draft-fighter-card__name">{fighter.name}</span>
    </button>
  );
}
