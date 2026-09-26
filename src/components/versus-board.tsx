import { useCallback, useEffect, useState } from "react";
import { useVersus } from "../hooks/use-versus";
import { useVersusAudio } from "../hooks/use-versus-audio";
import type { VersusSceneStatus } from "../lib/versus-scene";
import type { Fighter } from "../types/fighter";
import { CharacterPickerDialog } from "./character-picker-dialog";
import { ModeSwitch, type AppMode } from "./mode-switch";
import { VersusStage } from "./versus-stage";
import "../king-of-hill.css";
import "../versus.css";

type Props = { fighters: Fighter[]; isOverlay: boolean; onChangeMode: (mode: AppMode) => void };

export function VersusBoard({ fighters, isOverlay, onChangeMode }: Props) {
  const { state, setFighter, setName } = useVersus();
  const audio = useVersusAudio();
  const [editingSide, setEditingSide] = useState<"left" | "right" | null>(null);
  const [status, setStatus] = useState<VersusSceneStatus>("loading");
  const [playToken, setPlayToken] = useState(0);
  const [sceneVersion, setSceneVersion] = useState(0);
  const stopAudio = audio.stop;
  const updateStatus = useCallback((nextStatus: VersusSceneStatus) => {
    if (nextStatus === "fallback") stopAudio();
    setStatus(nextStatus);
  }, [stopAudio]);
  const left = fighters.find((fighter) => fighter.id === state.leftFighterId) ?? fighters[0];
  const right = fighters.find((fighter) => fighter.id === state.rightFighterId) ?? fighters[1];
  const busy = status === "playing" || status === "holding";

  const playAudio = audio.play;
  const fight = useCallback(() => {
    if (status === "fallback") { setStatus("loading"); setPlayToken(0); setSceneVersion((value) => value + 1); return; }
    if (status !== "ready") return;
    playAudio();
    setPlayToken((value) => value + 1);
  }, [status, playAudio]);

  useEffect(() => {
    if (isOverlay || editingSide !== null) return;
    const keyDown = (event: KeyboardEvent) => {
      const shortcut = event.code === "Space" || event.key === " " || event.code === "KeyF" || event.key.toLowerCase() === "f";
      if (!shortcut || event.defaultPrevented || event.isComposing || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("input, textarea, select, [contenteditable]:not([contenteditable='false']), [role='dialog'], dialog")) return;
      // Holding Space must not activate BACK after focus moves into the scene.
      if (event.repeat) { event.preventDefault(); return; }
      if (target?.closest("button, a, [role='button']") && !target.closest(".versus-fight")) return;
      if (status !== "ready") return;
      event.preventDefault();
      fight();
    };
    window.addEventListener("keydown", keyDown);
    return () => window.removeEventListener("keydown", keyDown);
  }, [editingSide, fight, isOverlay, status]);

  return (
    <div className={`versus-board${isOverlay ? " versus-board--overlay" : ""}${busy ? " is-playing" : ""}`}>
      {!isOverlay && <div className="versus-chrome" inert={busy}>
        <header className="app-page-header"><div className="app-page-header__top">
          <div><p className="page-eyebrow">ELKAMUSAEV EVENTS CENTER</p><h1 className="page-title">VERSUS</h1></div>
          <div className="versus-audio" title={audio.message || "Volume"}>
            <svg className="versus-audio__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" />{audio.volume > 0 ? <path d="M16 8q4 4 0 8M19 5q7 7 0 14" /> : <path d="m17 9 5 6m0-6-5 6" />}</svg>
            <input className="versus-audio__volume" type="range" aria-label="Sound volume" min="0" max="1" step="0.05" value={audio.volume} onChange={(event) => audio.setVolume(Number(event.target.value))} />
            {audio.message && <span className="sr-only" role="status">{audio.message}</span>}
          </div>
        </div></header>
        <div className="app-page-nav page-mode-row"><ModeSwitch activeMode="versus" onChange={onChangeMode} /></div>
      </div>}
      <div className="versus-curtain" aria-hidden="true" />
      <div className="versus-stage-slot">
        <VersusStage key={`${left.id}:${right.id}:${sceneVersion}`} left={left} right={right} leftName={state.leftName} rightName={state.rightName} playToken={playToken} onStatus={updateStatus}
          status={status} isOverlay={isOverlay} onFight={fight} onName={setName} onChoose={setEditingSide} onSkip={audio.stop} />
      </div>
      {editingSide !== null && <CharacterPickerDialog fighters={fighters} selectedId={state[`${editingSide}FighterId`]} onClose={() => setEditingSide(null)} onSelect={(id) => {
        if (id !== state[`${editingSide}FighterId`]) { audio.stop(); setStatus("loading"); setPlayToken(0); setFighter(editingSide, id); }
        setEditingSide(null);
      }} />}
    </div>
  );
}
