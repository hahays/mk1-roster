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
  const { state, updatePlayer, toggleLife, setLifeCount, setPrizePool } = useKingOfHill();
  const [editingSlot, setEditingSlot] = useState<number | null>(null);

  function renderPlayer(index: number) {
    const player = state.players[index];
    const fighter = fighters.find(({ id }) => id === player.fighterId) ?? fighters[0];
    const isKing = index === 0;
    const label = isKing ? "Царь горы" : `Соперник ${index}`;
    const framing = portraitFraming as Record<string, { viewBox: string; challengerViewBox: string }>;

    return (
      <article className={`king-player ${isKing ? "king-player--king" : "king-player--challenger"}`} key={index} aria-label={label}>
        <button className="king-player__portrait" type="button" onClick={() => setEditingSlot(index)} disabled={isOverlay} aria-label={`Выбрать персонажа: ${label}`}>
          <svg viewBox={framing[fighter.slug]?.[isKing ? "viewBox" : "challengerViewBox"] ?? "0 0 1280 742"} preserveAspectRatio="xMidYMax meet" role="img" aria-label={fighter.name}>
            <image href={getAssetUrl(`/fighters/portraits/${fighter.slug}.webp`)} width="1280" height="1280" />
          </svg>
          {!isOverlay && <span className="king-player__change">Сменить персонажа <span aria-hidden="true">↗</span></span>}
        </button>
        <div className="king-player__identity">
          <div className="king-player__lives" role="group" aria-label={`Жизни: ${label}`}>
            {player.lives.map((alive, lifeIndex) => (
              <button key={lifeIndex} className={`king-life ${alive ? "is-alive" : ""}`} type="button" disabled={isOverlay} aria-pressed={alive} aria-label={`${label}: жизнь ${lifeIndex + 1}`} onClick={() => toggleLife(index, lifeIndex)} />
            ))}
          </div>
          <input className="king-player__nickname" aria-label={`Никнейм: ${label}`} placeholder="Никнейм" value={player.nickname} maxLength={32} readOnly={isOverlay} onChange={(event) => updatePlayer(index, { nickname: event.target.value })} autoComplete="off" spellCheck={false} />
          <div className="king-player__caption">
            <span>{fighter.name}</span>
            {!isOverlay && <div className="king-player__life-count" role="group" aria-label={`Количество жизней: ${label}`}>
              <button type="button" aria-label={`Уменьшить количество жизней: ${label}`} disabled={player.lives.length <= 1} onClick={() => setLifeCount(index, player.lives.length - 1)}>−</button>
              <span>{player.lives.filter(Boolean).length}/{player.lives.length}</span>
              <button type="button" aria-label={`Увеличить количество жизней: ${label}`} disabled={player.lives.length >= 10} onClick={() => setLifeCount(index, player.lives.length + 1)}>+</button>
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
          <div><p className="page-eyebrow">ELKAMUSAEV EVENTS CENTER</p><h1 className="page-title">ДЕНЕЖНЫЙ ЦАРЬ ГОРЫ</h1></div>
        </div>
      </header>
      {!isOverlay && <div className="app-page-nav page-mode-row"><ModeSwitch activeMode="king" onChange={onChangeMode} /></div>}
      <section className={`king-board ${isOverlay ? "king-board--overlay" : ""}`} aria-label="Денежный царь горы">
        <div className="king-arena">
          {renderPlayer(0)}
          <div className="king-versus" aria-label="Против"><span aria-hidden="true">VS</span></div>
          <div className="king-challengers">{[1, 2, 3].map(renderPlayer)}</div>
        </div>
        <div className="king-prize">
          <label htmlFor="king-prize-pool"><span>PRIZEPOOL</span><span>Призовой фонд</span></label>
          <input id="king-prize-pool" aria-label="Призовой фонд" placeholder="Введите сумму" value={state.prizePool} maxLength={40} readOnly={isOverlay} onChange={(event) => setPrizePool(event.target.value)} autoComplete="off" />
        </div>
      </section>
      {editingSlot !== null && <CharacterPickerDialog fighters={fighters} selectedId={state.players[editingSlot].fighterId} onSelect={(fighterId) => { updatePlayer(editingSlot, { fighterId }); setEditingSlot(null); }} onClose={() => setEditingSlot(null)} />}
    </>
  );
}
