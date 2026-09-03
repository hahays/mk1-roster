import type { DraftMatchWinner, DraftTeamNames } from "../types/draft";
import type { Fighter } from "../types/fighter";
import { getAssetUrl } from "../lib/assets";

type DraftMatchesDialogProps = {
  fightersById: Map<string, Fighter>;
  matchWinners: DraftMatchWinner[];
  picks: Record<"fire" | "shadow", string[]>;
  teamNames: DraftTeamNames;
  onClose: () => void;
  onSelectWinner: (matchIndex: number, fighterId: string) => void;
};

export function DraftMatchesDialog({
  fightersById,
  matchWinners,
  picks,
  teamNames,
  onClose,
  onSelectWinner,
}: DraftMatchesDialogProps) {
  const winnerByMatch = new Map(matchWinners.map((winner) => [winner.matchIndex, winner.fighterId]));
  const isComplete = matchWinners.length === picks.fire.length;
  const fireWins = matchWinners.filter((winner) => picks.fire.includes(winner.fighterId)).length;
  const shadowWins = matchWinners.length - fireWins;
  const winningTeam = fireWins > shadowWins ? teamNames.fire : teamNames.shadow;

  function chooseWinner(matchIndex: number, fighterId: string) {
    onSelectWinner(matchIndex, fighterId);
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
            if (!fire || !shadow) return null;

            return (
              <article className="draft-match" key={`${fireId}-${shadowId}`}>
                <span className="draft-match__number">БОЙ {String(index + 1).padStart(2, "0")}</span>
                <button className={`draft-match__fighter draft-match__fighter--fire ${winnerId === fire.id ? "is-winner" : winnerId ? "is-defeated" : ""}`} type="button" onClick={() => chooseWinner(index, fire.id)}>
                  <img alt="" src={getAssetUrl(fire.image)} />
                  <span>{fire.name}</span>
                  <small>{teamNames.fire}</small>
                </button>
                <b>VS</b>
                <button className={`draft-match__fighter draft-match__fighter--shadow ${winnerId === shadow.id ? "is-winner" : winnerId ? "is-defeated" : ""}`} type="button" onClick={() => chooseWinner(index, shadow.id)}>
                  <img alt="" src={getAssetUrl(shadow.image)} />
                  <span>{shadow.name}</span>
                  <small>{teamNames.shadow}</small>
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
