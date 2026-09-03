import { useEffect, useMemo, useRef, useState } from "react";
import { draftRoundRules } from "../lib/draft";
import { useDraft } from "../hooks/use-draft";
import type { Fighter } from "../types/fighter";
import { DraftFighterCard } from "./draft-fighter-card";
import { DraftTeamPanel } from "./draft-team-panel";
import { ModeSwitch } from "./mode-switch";
import { PlayerEditorDialog } from "./player-editor-dialog";
import { DraftMatchesDialog } from "./draft-matches-dialog";

type DraftBoardProps = {
  fighters: Fighter[];
  isOverlay: boolean;
  onShowRoster: () => void;
};

export function DraftBoard({ fighters, isOverlay, onShowRoster }: DraftBoardProps) {
  const draft = useDraft();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isMatchesOpen, setIsMatchesOpen] = useState(false);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const randomizeTimer = useRef<number | null>(null);
  const fightersById = useMemo(() => new Map(fighters.map((fighter) => [fighter.id, fighter])), [fighters]);
  const selectionsByFighter = useMemo(
    () => new Map(draft.selections.map((selection) => [selection.fighterId, selection])),
    [draft.selections],
  );
  const firePlayers = draft.assignments.fire.map((index) => draft.players[index]);
  const shadowPlayers = draft.assignments.shadow.map((index) => draft.players[index]);
  const currentTeamName = draft.currentStep ? draft.teamNames[draft.currentStep.teamId] : "";
  const picks = useMemo(() => ({
    fire: draft.selections.filter((selection) => selection.teamId === "fire" && selection.action === "pick").map((selection) => selection.fighterId),
    shadow: draft.selections.filter((selection) => selection.teamId === "shadow" && selection.action === "pick").map((selection) => selection.fighterId),
  }), [draft.selections]);

  useEffect(() => () => {
    if (randomizeTimer.current !== null) window.clearTimeout(randomizeTimer.current);
  }, []);

  function randomizeTeams() {
    if (randomizeTimer.current !== null) window.clearTimeout(randomizeTimer.current);
    setIsRandomizing(true);
    draft.randomizeTeams();
    randomizeTimer.current = window.setTimeout(() => setIsRandomizing(false), 1450);
  }

  return (
    <>
      <header className="draft-header">
        <div>
          <p className="page-eyebrow">MK1 TOURNAMENT</p>
          <h1 className="page-title">КОМАНДНЫЙ ДРАФТ</h1>
        </div>

        <div className="draft-header__status">
          <strong>
            {isRandomizing
              ? "ФОРМИРУЕМ КОМАНДЫ"
              : !draft.hasTeams
              ? "РАСПРЕДЕЛИТЕ ИГРОКОВ"
              : draft.isComplete
                ? "ДРАФТ ЗАВЕРШЁН"
                : `РАУНД ${draft.currentStep?.round} · ${currentTeamName} · ${draft.currentStep?.action === "ban" ? "БАН" : "ПИК"}`}
          </strong>
        </div>

        {!isOverlay && (
          <div className="draft-header__controls">
            <ModeSwitch activeMode="draft" onChange={(mode) => mode === "roster" && onShowRoster()} />
            <button type="button" onClick={() => setIsEditorOpen(true)}>Игроки</button>
            <button className="is-accent" type="button" disabled={isRandomizing} onClick={randomizeTeams}>
              {isRandomizing ? "Распределяем..." : "Распределить"}
            </button>
            <button type="button" disabled={draft.selections.length === 0} onClick={draft.undo}>Отменить ход</button>
            <button type="button" disabled={draft.selections.length === 0} onClick={draft.resetDraft}>Сбросить драфт</button>
            <button className="is-match" type="button" disabled={!draft.isComplete} onClick={() => setIsMatchesOpen(true)}>Матч</button>
          </div>
        )}

        <div className="draft-rounds">
          {draftRoundRules.map((rule) => (
            <div className={draft.currentStep?.round === rule.round ? "is-active" : ""} key={rule.round}>
              <span>РАУНД {rule.round}</span>
              <strong>{rule.bans} {rule.bans === 1 ? "БАН" : "БАНА"} · {rule.picks} {rule.picks === 1 ? "ПИК" : "ПИКА"}</strong>
            </div>
          ))}
        </div>

      </header>

      <section className="draft-layout">
        <DraftTeamPanel
          teamId="fire"
          name={draft.teamNames.fire}
          players={firePlayers}
          selections={draft.selections}
          fightersById={fightersById}
          isActive={draft.currentStep?.teamId === "fire"}
          isDealing={isRandomizing}
          revealVersion={draft.shuffleVersion}
        />

        <div className="draft-roster" aria-label="Draft fighter roster">
          {fighters.map((fighter, index) => {
            const selection = selectionsByFighter.get(fighter.id);

            return (
              <DraftFighterCard
                fighter={fighter}
                index={index}
                key={fighter.id}
                selection={selection}
                teamName={selection ? draft.teamNames[selection.teamId] : undefined}
                currentStep={draft.currentStep}
                disabled={!draft.hasTeams || draft.isComplete || isRandomizing}
                onSelect={draft.selectFighter}
              />
            );
          })}
        </div>

        <DraftTeamPanel
          teamId="shadow"
          name={draft.teamNames.shadow}
          players={shadowPlayers}
          selections={draft.selections}
          fightersById={fightersById}
          isActive={draft.currentStep?.teamId === "shadow"}
          isDealing={isRandomizing}
          revealVersion={draft.shuffleVersion}
        />
      </section>

      {isEditorOpen && (
        <PlayerEditorDialog
          players={draft.players}
          teamNames={draft.teamNames}
          onCancel={() => setIsEditorOpen(false)}
          onSave={(players, teamNames) => {
            draft.updateSetup(players, teamNames);
            setIsEditorOpen(false);
          }}
        />
      )}

      {isMatchesOpen && (
        <DraftMatchesDialog
          fightersById={fightersById}
          matchWinners={draft.matchWinners}
          picks={picks}
          teamNames={draft.teamNames}
          onClose={() => setIsMatchesOpen(false)}
          onSelectWinner={draft.selectMatchWinner}
        />
      )}
    </>
  );
}
