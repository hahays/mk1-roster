import { useEffect, useRef } from "react";
import portraitFraming from "../data/king-portrait-framing.json";
import { getAssetUrl } from "../lib/assets";
import { createVersusScene, type VersusSceneStatus } from "../lib/versus-scene";
import type { Fighter } from "../types/fighter";

type Props = {
  left: Fighter; right: Fighter; leftName: string; rightName: string;
  playToken: number; onStatus: (status: VersusSceneStatus) => void;
  status: VersusSceneStatus; isOverlay: boolean;
  onFight: () => void; onSkip: () => void;
  onName: (side: "left" | "right", name: string) => void;
  onChoose: (side: "left" | "right") => void;
};

export function VersusStage({ left, right, leftName, rightName, playToken, onStatus, status, isOverlay, onFight, onSkip, onName, onChoose }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const effectsRef = useRef<HTMLDivElement>(null);
  const fightRef = useRef<HTMLButtonElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const sceneRef = useRef<ReturnType<typeof createVersusScene> | null>(null);
  const busy = status === "playing" || status === "holding";

  useEffect(() => {
    const root = rootRef.current!;
    root.dataset.engine = "loading";
    try {
      const scene = createVersusScene({
        host: hostRef.current!, effectsHost: effectsRef.current!,
        slugs: [left.slug, right.slug],
        onStatus(nextStatus) {
          root.dataset.engine = nextStatus;
          if (nextStatus === "fallback") root.removeAttribute("style");
          onStatus(nextStatus);
        },
        onFrame(frame) {
          root.style.setProperty("--plate-offset", `${(1 - frame.plate) * 150}%`);
          root.style.setProperty("--plate-opacity", `${Math.min(1, frame.entrance * 4)}`);
          root.style.setProperty("--impact-flash", `${frame.flash}`);
          root.style.setProperty("--impact-shake", `${frame.shake * 13}px`);
          root.style.setProperty("--collision", `${frame.collision}`);
          root.style.setProperty("--recoil", `${frame.recoil * 28}px`);
          root.style.setProperty("--plate-tilt", `${frame.recoil * 3}deg`);
          root.style.setProperty("--energy", `${frame.energy}`);
          root.style.setProperty("--ring-scale", `${frame.burst >= 0 ? 0.3 + frame.burst * 5 : 0}`);
          root.style.setProperty("--ring-opacity", `${frame.burst >= 0 ? Math.max(0, 1 - frame.burst / 0.6) : 0}`);
          root.dataset.phase = frame.finished ? "hold" : frame.burst >= 0 ? "impact" : "enter";
        },
      });
      sceneRef.current = scene;
      return () => { sceneRef.current = null; scene.dispose(); };
    } catch { root.dataset.engine = "fallback"; onStatus("fallback"); }
  }, [left.slug, right.slug, onStatus]);

  useEffect(() => { if (playToken > 0) sceneRef.current?.play(); }, [playToken]);

  useEffect(() => {
    if (!busy) return;
    const trigger = fightRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    skipRef.current?.focus({ preventScroll: true });
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); sceneRef.current?.finish(); onSkip(); }
      // Only Skip is interactive during the cinematic.
      if (event.key === "Tab") { event.preventDefault(); skipRef.current?.focus(); }
    };
    window.addEventListener("keydown", keyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", keyDown);
      requestAnimationFrame(() => { if (trigger?.isConnected && !trigger.disabled) trigger.focus({ preventScroll: true }); });
    };
  }, [busy, onSkip]);

  const framing = portraitFraming as Record<string, { viewBox: string }>;
  function plate(side: "left" | "right", name: string, fighter: Fighter) {
    const fallback = side === "left" ? "Player 01" : "Player 02";
    return <div className={`versus-plate versus-plate--${side}`}>
      {!isOverlay && <span className="versus-plate__edit-hint" aria-hidden="true">EDIT NAME ↙</span>}
      <textarea className={`versus-plate__name${name.length > 18 ? " is-long" : ""}`} aria-label={`${side === "left" ? "Left" : "Right"} player nickname`} value={name} placeholder={fallback} rows={name.length > 18 ? 2 : 1} maxLength={32} readOnly={isOverlay || busy} tabIndex={busy || isOverlay ? -1 : 0} spellCheck={false} autoComplete="off"
        onChange={(event) => onName(side, event.target.value.replace(/[\r\n]/g, ""))}
        onKeyDown={(event) => { if (event.key === "Enter" || event.key === "Escape") { event.preventDefault(); event.currentTarget.blur(); } }}
        onBlur={() => { if (!name.trim()) onName(side, fallback); }} />
      <button className="versus-plate__fighter" type="button" disabled={isOverlay || busy} onClick={() => onChoose(side)} aria-label={`Change ${side} character: ${fighter.name}`}>{fighter.name}{!isOverlay && <span aria-hidden="true"> ↗</span>}</button>
    </div>;
  }

  return (
    <section ref={rootRef} className="versus-stage" aria-label="Versus arena">
      <div className="versus-stage__light versus-stage__light--left" aria-hidden="true" />
      <div className="versus-stage__light versus-stage__light--right" aria-hidden="true" />
      <div className="versus-stage__canvas" ref={hostRef} />
      <div className="versus-stage__fallback" aria-hidden="true">
        {[left, right].map((fighter, index) => <svg key={index} className={`versus-stage__portrait versus-stage__portrait--${index === 0 ? "left" : "right"}`} viewBox={framing[fighter.slug]?.viewBox ?? "0 0 1280 742"} preserveAspectRatio="xMidYMid meet"><image href={getAssetUrl(`/fighters/portraits/${fighter.slug}.webp`)} width="1280" height="1280" onError={(event) => { const fallback = getAssetUrl(fighter.image); if (event.currentTarget.getAttribute("href") !== fallback) event.currentTarget.setAttribute("href", fallback); }} /></svg>)}
      </div>
      <div className="versus-stage__vignette" aria-hidden="true" />
      {!isOverlay && <>
        {(["left", "right"] as const).map((side) => <button key={side} className={`versus-stage__choose versus-stage__choose--${side}`} type="button" disabled={busy} aria-label={`Choose ${side} fighter: ${side === "left" ? left.name : right.name}`} onClick={() => onChoose(side)}><span>CHANGE FIGHTER ↗</span></button>)}
        <div className="versus-stage__heading">
          <button ref={fightRef} className="versus-fight" type="button" onClick={onFight} disabled={status === "loading" || busy} aria-keyshortcuts="Space F" title="FIGHT · Space / F" aria-label={status === "fallback" ? "Retry animation" : "FIGHT"}>{status === "fallback" ? "RETRY" : "FIGHT"}</button>
          <span className="versus-stage__status" role="status">{status === "loading" ? "LOADING" : status === "fallback" ? "STATIC PREVIEW" : ""}</span>
        </div>
        {busy && <button ref={skipRef} className="versus-skip" type="button" onClick={() => { sceneRef.current?.finish(); onSkip(); }}>BACK <kbd>ESC</kbd></button>}
      </>}
      <div className="versus-stage__matchup">
        {plate("left", leftName, left)}
        <span className="versus-stage__vs" aria-hidden="true">VS</span>
        {plate("right", rightName, right)}
      </div>
      <div className="versus-stage__effects" ref={effectsRef} aria-hidden="true" />
      <div className="versus-stage__ring" aria-hidden="true" />
      <div className="versus-stage__flash" aria-hidden="true" />
    </section>
  );
}
