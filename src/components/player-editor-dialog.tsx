import { useState } from "react";
import type { DraftAssignments, DraftTeamId, DraftTeamNames } from "../types/draft";

type PlayerEditorDialogProps = {
  players: string[];
  assignments: DraftAssignments;
  teamNames: DraftTeamNames;
  onCancel: () => void;
  onSave: (players: string[], teamNames: DraftTeamNames, assignments: DraftAssignments) => void;
};

export function PlayerEditorDialog({
  players,
  assignments,
  teamNames,
  onCancel,
  onSave,
}: PlayerEditorDialogProps) {
  const [draftPlayers, setDraftPlayers] = useState(players);
  const [draftTeamNames, setDraftTeamNames] = useState(teamNames);
  const [draftAssignments, setDraftAssignments] = useState<DraftAssignments>(() =>
    assignments.fire.length === 2 && assignments.shadow.length === 2
      ? { fire: [...assignments.fire], shadow: [...assignments.shadow] }
      : { fire: [0, 2], shadow: [1, 3] },
  );
  const [draggedPlayerIndex, setDraggedPlayerIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  function updatePlayer(index: number, value: string) {
    setDraftPlayers((current) => current.map((player, playerIndex) => (playerIndex === index ? value : player)));
  }

  function swapPlayers(sourceIndex: number, targetIndex: number) {
    if (sourceIndex === targetIndex) return;

    setDraftAssignments((current) => {
      const next = { fire: [...current.fire], shadow: [...current.shadow] };
      const sourceTeam = next.fire.includes(sourceIndex) ? "fire" : "shadow";
      const targetTeam = next.fire.includes(targetIndex) ? "fire" : "shadow";
      const sourceSlot = next[sourceTeam].indexOf(sourceIndex);
      const targetSlot = next[targetTeam].indexOf(targetIndex);
      next[sourceTeam][sourceSlot] = targetIndex;
      next[targetTeam][targetSlot] = sourceIndex;
      return next;
    });
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    onSave(
      draftPlayers.map((player, index) => player.trim() || `Player ${String(index + 1).padStart(2, "0")}`),
      {
        fire: draftTeamNames.fire.trim() || "Team X",
        shadow: draftTeamNames.shadow.trim() || "Team Y",
      },
      draftAssignments,
    );
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <form className="player-editor" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <div className="player-editor__heading">
          <div>
            <h2>PLAYERS</h2>
          </div>
          <button type="button" onClick={onCancel} aria-label="Close">×</button>
        </div>

        <div className="player-editor__teams">
          <label>
            <span>TEAM</span>
            <input
              aria-label="Team name X"
              value={draftTeamNames.fire}
              onChange={(event) => setDraftTeamNames((current) => ({ ...current, fire: event.target.value }))}
            />
          </label>
          <label>
            <span>TEAM</span>
            <input
              aria-label="Team name Y"
              value={draftTeamNames.shadow}
              onChange={(event) => setDraftTeamNames((current) => ({ ...current, shadow: event.target.value }))}
            />
          </label>
        </div>

        <div className="player-editor__grid">
          {(["fire", "shadow"] as DraftTeamId[]).map((teamId) => (
            <div className="player-editor__team-column" key={teamId}>
              {draftAssignments[teamId].map((playerIndex) => (
                <label
                  className={`player-editor__player ${draggedPlayerIndex === playerIndex ? "is-dragging" : ""} ${dropTargetIndex === playerIndex ? "is-drop-target" : ""}`}
                  key={playerIndex}
                  onDragLeave={() => setDropTargetIndex((current) => current === playerIndex ? null : current)}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (draggedPlayerIndex !== playerIndex) setDropTargetIndex(playerIndex);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (draggedPlayerIndex !== null) swapPlayers(draggedPlayerIndex, playerIndex);
                    setDraggedPlayerIndex(null);
                    setDropTargetIndex(null);
                  }}
                  title="Drag onto a player on the other team to swap places"
                >
                  <span>{String(playerIndex + 1).padStart(2, "0")}</span>
                  <input value={draftPlayers[playerIndex]} onChange={(event) => updatePlayer(playerIndex, event.target.value)} />
                  <button
                    aria-label={`Move ${draftPlayers[playerIndex]}`}
                    className="player-editor__drag-handle"
                    draggable
                    type="button"
                    onDragEnd={() => {
                      setDraggedPlayerIndex(null);
                      setDropTargetIndex(null);
                    }}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", String(playerIndex));
                      setDraggedPlayerIndex(playerIndex);
                    }}
                    title="Drag onto a player on the other team"
                  >
                    ⠿
                  </button>
                </label>
              ))}
            </div>
          ))}
        </div>

        <div className="player-editor__actions">
          <button className="dialog-button" type="button" onClick={onCancel}>Cancel</button>
          <button className="dialog-button dialog-button--accent" type="submit">Save</button>
        </div>
      </form>
    </div>
  );
}
