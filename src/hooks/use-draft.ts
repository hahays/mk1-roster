import { useEffect, useMemo, useState } from "react";
import { draftSteps, shufflePlayerIndexes } from "../lib/draft";
import type { DraftAssignments, DraftSelection, DraftTeamNames } from "../types/draft";

const STORAGE_KEY = "mk1-draft-state";
const PLAYER_COUNT = 16;

type DraftState = {
  players: string[];
  teamNames: DraftTeamNames;
  assignments: DraftAssignments;
  selections: DraftSelection[];
};

const defaultState: DraftState = {
  players: Array.from({ length: PLAYER_COUNT }, (_, index) => `Игрок ${String(index + 1).padStart(2, "0")}`),
  teamNames: { fire: "TEAM FIRE", shadow: "TEAM SHADOW" },
  assignments: { fire: [], shadow: [] },
  selections: [],
};

function readDraftState(): DraftState {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<DraftState> | null;

    if (!stored || !Array.isArray(stored.players) || stored.players.length !== PLAYER_COUNT) {
      return defaultState;
    }

    return {
      players: stored.players.map((player, index) => player || defaultState.players[index]),
      teamNames: {
        fire: stored.teamNames?.fire || defaultState.teamNames.fire,
        shadow: stored.teamNames?.shadow || defaultState.teamNames.shadow,
      },
      assignments: {
        fire: Array.isArray(stored.assignments?.fire) ? stored.assignments.fire : [],
        shadow: Array.isArray(stored.assignments?.shadow) ? stored.assignments.shadow : [],
      },
      selections: Array.isArray(stored.selections) ? stored.selections.slice(0, draftSteps.length) : [],
    };
  } catch {
    return defaultState;
  }
}

export function useDraft() {
  const [state, setState] = useState<DraftState>(readDraftState);
  const [shuffleVersion, setShuffleVersion] = useState(0);
  const currentStep = draftSteps[state.selections.length] ?? null;
  const hasTeams = state.assignments.fire.length === 8 && state.assignments.shadow.length === 8;
  const usedFighterIds = useMemo(
    () => new Set(state.selections.map(({ fighterId }) => fighterId)),
    [state.selections],
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  function updateSetup(players: string[], teamNames: DraftTeamNames) {
    setState((current) => ({ ...current, players, teamNames }));
  }

  function randomizeTeams() {
    const shuffled = shufflePlayerIndexes(PLAYER_COUNT);
    setShuffleVersion((version) => version + 1);
    setState((current) => ({
      ...current,
      assignments: { fire: shuffled.slice(0, 8), shadow: shuffled.slice(8) },
      selections: [],
    }));
  }

  function selectFighter(fighterId: string) {
    if (!hasTeams || !currentStep || usedFighterIds.has(fighterId)) return;

    setState((current) => ({
      ...current,
      selections: [...current.selections, { ...currentStep, fighterId }],
    }));
  }

  function undo() {
    setState((current) => ({ ...current, selections: current.selections.slice(0, -1) }));
  }

  function resetDraft() {
    setState((current) => ({ ...current, selections: [] }));
  }

  return {
    ...state,
    currentStep,
    hasTeams,
    isComplete: state.selections.length === draftSteps.length,
    shuffleVersion,
    usedFighterIds,
    randomizeTeams,
    resetDraft,
    selectFighter,
    undo,
    updateSetup,
  };
}
