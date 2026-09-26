import { useCallback, useEffect, useRef, useState } from "react";
import { createVersusAudio } from "../lib/versus-audio";
import { getAssetUrl } from "../lib/assets";

function readVolume() {
  try {
    const value = JSON.parse(localStorage.getItem("mk1-versus-audio:v1") ?? "null");
    if (value?.enabled === false) return 0;
    return typeof value?.volume === "number" && Number.isFinite(value.volume)
      ? Math.min(1, Math.max(0, value.volume)) : 0.35;
  } catch { return 0.35; }
}

export function useVersusAudio() {
  const [volume, updateVolume] = useState(readVolume);
  const [message, setMessage] = useState("");
  const engine = useRef<ReturnType<typeof createVersusAudio> | null>(null);
  const data = useRef<ArrayBuffer | undefined>(undefined);
  const alive = useRef(false);
  const stop = useCallback(() => engine.current?.stop(), []);

  useEffect(() => {
    alive.current = true;
    const controller = new AbortController();
    fetch(getAssetUrl("/audio/mk3-vs-screen.mp3"), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Could not load MK3 audio");
        return response.arrayBuffer();
      })
      .then((buffer) => { if (!controller.signal.aborted) data.current = buffer; })
      .catch(() => {
        if (!controller.signal.aborted) setMessage("Could not load MK3 audio. Reload the page.");
      });
    const stopWhenHidden = () => { if (document.hidden) engine.current?.stop(); };
    document.addEventListener("visibilitychange", stopWhenHidden);
    return () => {
      alive.current = false;
      controller.abort();
      engine.current?.dispose();
      engine.current = null;
      document.removeEventListener("visibilitychange", stopWhenHidden);
    };
  }, []);

  useEffect(() => {
    try { localStorage.setItem("mk1-versus-audio:v1", JSON.stringify({ volume })); } catch { /* Session controls still work. */ }
  }, [volume]);

  function play() {
    if (volume === 0 || !data.current) return;
    try {
      engine.current ??= createVersusAudio();
      void engine.current.play(volume, data.current).catch(() => {
        if (alive.current) setMessage("Could not play MK3 audio. Reload the page.");
      });
    } catch { setMessage("Audio is unavailable in this browser."); }
  }

  function setVolume(value: number) {
    const next = Math.min(1, Math.max(0, value));
    engine.current?.setVolume(next);
    updateVolume(next);
  }

  return { volume, message, play, stop, setVolume };
}
