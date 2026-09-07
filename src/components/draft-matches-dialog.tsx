import type { DraftMatchParticipants, DraftMatchWinner, DraftTeamId, DraftTeamNames } from "../types/draft";
import type { RatingResult } from "../types/rating";
import type { Fighter } from "../types/fighter";
import { getAssetUrl } from "../lib/assets";

type DraftMatchesDialogProps = {
  fightersById: Map<string, Fighter>;
  matchParticipants: DraftMatchParticipants[];
  matchWinners: DraftMatchWinner[];
  picks: Record<"fire" | "shadow", string[]>;
  ratingRecorded: boolean;
  sessionId: string;
  teamNames: DraftTeamNames;
  teamPlayers: Record<DraftTeamId, string[]>;
  onClose: () => void;
  onRecordResults: (results: RatingResult[]) => void;
  onSelectParticipant: (matchIndex: number, teamId: DraftTeamId, playerIndex: number) => void;
  onSelectWinner: (matchIndex: number, fighterId: string) => void;
};

export function DraftMatchesDialog({
  fightersById,
  matchParticipants,
  matchWinners,
  picks,
  ratingRecorded,
  sessionId,
  teamNames,
  teamPlayers,
  onClose,
  onRecordResults,
  onSelectParticipant,
  onSelectWinner,
}: DraftMatchesDialogProps) {
  const winnerByMatch = new Map(matchWinners.map((winner) => [winner.matchIndex, winner.fighterId]));
  const participantByMatch = new Map(matchParticipants.map((participant) => [participant.matchIndex, participant]));
  const isComplete = matchWinners.length === picks.fire.length;
  const fireWins = matchWinners.filter((winner) => picks.fire.includes(winner.fighterId)).length;
  const shadowWins = matchWinners.length - fireWins;
  const winningTeam = fireWins > shadowWins ? teamNames.fire : teamNames.shadow;

  function getParticipant(matchIndex: number) {
    return participantByMatch.get(matchIndex) ?? {
      matchIndex,
      firePlayerIndex: matchIndex % teamPlayers.fire.length,
      shadowPlayerIndex: matchIndex % teamPlayers.shadow.length,
    };
  }

  function recordResults() {
    if (!isComplete || ratingRecorded) return;

    const playedAt = new Date().toISOString();
    const month = playedAt.slice(0, 7);
    const results = picks.fire.flatMap((fireId, matchIndex) => {
      const shadowId = picks.shadow[matchIndex];
      const winnerId = winnerByMatch.get(matchIndex);
      const participant = getParticipant(matchIndex);
      if (!shadowId || !winnerId) return [];

      const firePlayer = teamPlayers.fire[participant.firePlayerIndex];
      const shadowPlayer = teamPlayers.shadow[participant.shadowPlayerIndex];
      if (!firePlayer || !shadowPlayer) return [];

      return [{
        sourceId: `${sessionId}:fight:${matchIndex}`,
        playedAt,
        month,
        winner: winnerId === fireId ? firePlayer : shadowPlayer,
        loser: winnerId === fireId ? shadowPlayer : firePlayer,
      }];
    });

    onRecordResults(results);
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="draft-matches" aria-modal="true" aria-label="Матч" role="dialog" onMouseDown={(event) => event.stopPropagation()}>
        <header className="draft-matches__header">
          <h2>МАТЧ</h2>
          <button aria-label="Закрыть" type="button" onClick={onClose}>×</button>
        </header>
        {isComplete && <p className="draft-matches__winner"><span className="draft-matches__winner-label">ПОБЕДА:</span><strong>{winningTeam}</strong><em>{fireWins} : {shadowWins}</em></p>}
        <div className="draft-matches__list">
          {picks.fire.map((fireId, index) => {
            const shadowId = picks.shadow[index];
            const fire = fightersById.get(fireId);
            const shadow = fightersById.get(shadowId);
            const winnerId = winnerByMatch.get(index);
            const participant = getParticipant(index);
            if (!fire || !shadow) return null;

            return (
              <article className="draft-match" key={`${fireId}-${shadowId}`}>
                <span className="draft-match__number">БОЙ {String(index + 1).padStart(2, "0")}</span>
                <div className="draft-match__side">
                  <button className={`draft-match__fighter draft-match__fighter--fire ${winnerId === fire.id ? "is-winner" : winnerId ? "is-defeated" : ""}`} disabled={ratingRecorded} type="button" onClick={() => onSelectWinner(index, fire.id)}>
                    <img alt="" src={getAssetUrl(fire.image)} />
                    <span>{fire.name}</span>
                    <small>{teamNames.fire}</small>
                  </button>
                  <select aria-label={`Игрок ${teamNames.fire} в бою ${index + 1}`} disabled={ratingRecorded} value={participant.firePlayerIndex} onChange={(event) => onSelectParticipant(index, "fire", Number(event.target.value))}>
                    {teamPlayers.fire.map((player, playerIndex) => <option key={playerIndex} value={playerIndex}>{player}</option>)}
                  </select>
                </div>
                <b>VS</b>
                <div className="draft-match__side">
                  <button className={`draft-match__fighter draft-match__fighter--shadow ${winnerId === shadow.id ? "is-winner" : winnerId ? "is-defeated" : ""}`} disabled={ratingRecorded} type="button" onClick={() => onSelectWinner(index, shadow.id)}>
                    <img alt="" src={getAssetUrl(shadow.image)} />
                    <span>{shadow.name}</span>
                    <small>{teamNames.shadow}</small>
                  </button>
                  <select aria-label={`Игрок ${teamNames.shadow} в бою ${index + 1}`} disabled={ratingRecorded} value={participant.shadowPlayerIndex} onChange={(event) => onSelectParticipant(index, "shadow", Number(event.target.value))}>
                    {teamPlayers.shadow.map((player, playerIndex) => <option key={playerIndex} value={playerIndex}>{player}</option>)}
                  </select>
                </div>
              </article>
            );
          })}
        </div>
        <footer className="draft-matches__footer">
          <span>{ratingRecorded ? "РЕЗУЛЬТАТЫ УЧТЕНЫ В РЕЙТИНГЕ" : "ПОБЕДА В МАТЧЕ: +3 · ПОБЕДА В БОЮ: +1"}</span>
          <button className="draft-matches__record" disabled={!isComplete || ratingRecorded} type="button" onClick={recordResults}>
            {ratingRecorded ? "УЧТЕНО" : "ЗАВЕРШИТЬ И НАЧИСЛИТЬ"}
          </button>
        </footer>
      </section>
    </div>
  );
}
