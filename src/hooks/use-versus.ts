import { useEffect, useState } from "react";
import roster from "../data/roster.json";

const STORAGE_KEY = "mk1-versus:v1";
const fighters = roster.filter((fighter) => fighter.group === "fighter");
const fighterIds = new Set(fighters.map((fighter) => fighter.id));

export type VersusState = {
  leftFighterId: string;
  rightFighterId: string;
  leftName: string;
  rightName: string;
};

const defaults: VersusState = {
  leftFighterId: fighters[0].id,
  rightFighterId: fighters[1].id,
  leftName: "Player 01",
  rightName: "Player 02",
};

function readState(): VersusState {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!stored || typeof stored !== "object") return defaults;
    const value = stored as Record<string, unknown>;
    return {
      leftFighterId: typeof value.leftFighterId === "string" && fighterIds.has(value.leftFighterId) ? value.leftFighterId : defaults.leftFighterId,
      rightFighterId: typeof value.rightFighterId === "string" && fighterIds.has(value.rightFighterId) ? value.rightFighterId : defaults.rightFighterId,
      leftName: typeof value.leftName === "string" ? value.leftName.slice(0, 32) : defaults.leftName,
      rightName: typeof value.rightName === "string" ? value.rightName.slice(0, 32) : defaults.rightName,
    };
  } catch {
    return defaults;
  }
}

export function useVersus() {
  const [state, setState] = useState(readState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* The intro remains usable without browser storage. */ }
  }, [state]);

  function setFighter(side: "left" | "right", fighterId: string) {
    if (!fighterIds.has(fighterId)) return;
    setState((current) => ({ ...current, [`${side}FighterId`]: fighterId }));
  }

  function setName(side: "left" | "right", name: string) {
    setState((current) => ({ ...current, [`${side}Name`]: name.slice(0, 32) }));
  }

  return { state, setFighter, setName };
}
