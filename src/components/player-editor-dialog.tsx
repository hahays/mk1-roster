import { useState } from "react";
import type { DraftTeamNames } from "../types/draft";

type PlayerEditorDialogProps = {
  players: string[];
  teamNames: DraftTeamNames;
  onCancel: () => void;
  onSave: (players: string[], teamNames: DraftTeamNames) => void;
};

export function PlayerEditorDialog({
  players,
  teamNames,
  onCancel,
  onSave,
}: PlayerEditorDialogProps) {
  const [draftPlayers, setDraftPlayers] = useState(players);
  const [draftTeamNames, setDraftTeamNames] = useState(teamNames);

  function updatePlayer(index: number, value: string) {
    setDraftPlayers((current) => current.map((player, playerIndex) => (playerIndex === index ? value : player)));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    onSave(
      draftPlayers.map((player, index) => player.trim() || `Игрок ${String(index + 1).padStart(2, "0")}`),
      {
        fire: draftTeamNames.fire.trim() || "TEAM FIRE",
        shadow: draftTeamNames.shadow.trim() || "TEAM SHADOW",
      },
    );
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <form className="player-editor" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <div className="player-editor__heading">
          <div>
            <p>TOURNAMENT SETUP</p>
            <h2>16 ИГРОКОВ</h2>
          </div>
          <button type="button" onClick={onCancel} aria-label="Закрыть">×</button>
        </div>

        <div className="player-editor__teams">
          <label>
            <span>КОМАНДА A</span>
            <input
              value={draftTeamNames.fire}
              onChange={(event) => setDraftTeamNames((current) => ({ ...current, fire: event.target.value }))}
            />
          </label>
          <label>
            <span>КОМАНДА B</span>
            <input
              value={draftTeamNames.shadow}
              onChange={(event) => setDraftTeamNames((current) => ({ ...current, shadow: event.target.value }))}
            />
          </label>
        </div>

        <div className="player-editor__grid">
          {draftPlayers.map((player, index) => (
            <label key={index}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <input value={player} onChange={(event) => updatePlayer(index, event.target.value)} />
            </label>
          ))}
        </div>

        <div className="player-editor__actions">
          <button className="dialog-button" type="button" onClick={onCancel}>Отмена</button>
          <button className="dialog-button dialog-button--accent" type="submit">Сохранить</button>
        </div>
      </form>
    </div>
  );
}
