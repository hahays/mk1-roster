import { useState } from "react";
import portraitFraming from "../data/king-portrait-framing.json";
import "../king-of-hill.css";
import { useKingOfHill } from "../hooks/use-king-of-hill";
import { getAssetUrl } from "../lib/assets";
import type { Fighter } from "../types/fighter";
import { CharacterPickerDialog } from "./character-picker-dialog";
import { ModeSwitch, type AppMode } from "./mode-switch";

type Props = {
  fighters: Fighter[];
  isOverlay: boolean;
  onChangeMode: (mode: AppMode) => void;
};

export function KingOfHillBoard({ fighters, isOverlay, onChangeMode }: Props) {
  const { state, updatePlayer, toggleLife, setPrizePool, changeDonatedLife } = useKingOfHill();
  const [editingSlot, setEditingSlot] = useState<number | null>(null);

  function renderPlayer(index: number) {
    const player = state.players[index];
    const fighter = fighters.find(({ id }) => id === player.fighterId) ?? fighters[0];
    const isKing = index === 0;
    const label = isKing ? "King" : `Challenger ${index}`;
    const framing = portraitFraming as Record<string, { viewBox: string; challengerViewBox: string }>;

    return (
      <article className={`king-player ${isKing ? "king-player--king" : "king-player--challenger"}`} key={index} aria-label={label}>
        <button className="king-player__portrait" type="button" onClick={() => setEditingSlot(index)} disabled={isOverlay} aria-label={`Choose character: ${label}`}>
          <svg viewBox={framing[fighter.slug]?.[isKing ? "viewBox" : "challengerViewBox"] ?? "0 0 1280 742"} preserveAspectRatio="xMidYMax meet" role="img" aria-label={fighter.name}>
            <image href={getAssetUrl(`/fighters/portraits/${fighter.slug}.webp`)} width="1280" height="1280" />
          </svg>
          {!isOverlay && <span className="king-player__change">Change character <span aria-hidden="true">↗</span></span>}
        </button>
        <div className="king-player__identity">
          <div className="king-player__life-row">
          <div className="king-player__lives" role="group" aria-label={`Lives: ${label}`}>
            {player.lives.map((alive, lifeIndex) => (
              <button key={lifeIndex} className={`king-life ${alive ? "is-alive" : ""}`} type="button" disabled={isOverlay} aria-pressed={alive} aria-label={`${label}: life ${lifeIndex + 1}`} onClick={() => toggleLife(index, lifeIndex)} />
            ))}
          </div>
          <div className="king-donations" role="group" aria-label={`Donated lives: ${label}`}>
            {player.donatedLives.map((alive, lifeIndex) => (
              <button key={lifeIndex} className={`king-life king-life--donated ${alive ? "is-alive" : ""}`} type="button" disabled={isOverlay} aria-pressed={alive} aria-label={`${label}: donated life ${lifeIndex + 1}`} onClick={() => changeDonatedLife(index, lifeIndex)} />
            ))}
          </div>
          </div>
          <input className="king-player__nickname" aria-label={`Nickname: ${label}`} placeholder="Nickname" value={player.nickname} maxLength={32} readOnly={isOverlay} onChange={(event) => updatePlayer(index, { nickname: event.target.value })} autoComplete="off" spellCheck={false} />
          <div className="king-player__caption">
            <span>{fighter.name}</span>
            {!isOverlay && <div className="king-player__life-count king-donations__controls">
              <span>Donated {player.donatedLives.filter(Boolean).length}/{isKing ? 5 : 2}</span>
              <button type="button" aria-label={`Remove donated life: ${label}`} disabled={player.donatedLives.length === 0} onClick={() => changeDonatedLife(index, "remove")}><span className="king-count-icon" aria-hidden="true" /></button>
              <button type="button" aria-label={`Add donated life: ${label}`} disabled={player.donatedLives.length >= (isKing ? 5 : 2)} onClick={() => changeDonatedLife(index, "add")}><span className="king-count-icon king-count-icon--plus" aria-hidden="true" /></button>
            </div>}
          </div>
        </div>
      </article>
    );
  }

  return (
    <>
      <header className="app-page-header king-header">
        <div className="app-page-header__top">
          <div><p className="page-eyebrow">ELKAMUSAEV EVENTS CENTER</p><h1 className="page-title">MONEY KING OF THE HILL</h1></div>
        </div>
      </header>
      {!isOverlay && <div className="app-page-nav page-mode-row"><ModeSwitch activeMode="king" onChange={onChangeMode} /></div>}
      <section className={`king-board ${isOverlay ? "king-board--overlay" : ""}`} aria-label="Money King of the Hill">
        <div className="king-arena">
          {renderPlayer(0)}
          <div className="king-challengers">{[1, 2, 3].map(renderPlayer)}</div>
        </div>
        <div className="king-prize">
          <label htmlFor="king-prize-pool"><span>PRIZE POOL</span></label>
          <input id="king-prize-pool" aria-label="Prize pool" placeholder="Enter amount" value={state.prizePool} maxLength={40} readOnly={isOverlay} onChange={(event) => setPrizePool(event.target.value)} autoComplete="off" />
        </div>
      </section>
      {editingSlot !== null && <CharacterPickerDialog fighters={fighters} selectedId={state.players[editingSlot].fighterId} onSelect={(fighterId) => { updatePlayer(editingSlot, { fighterId }); setEditingSlot(null); }} onClose={() => setEditingSlot(null)} />}
    </>
  );
}
