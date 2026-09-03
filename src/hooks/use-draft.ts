import { useEffect, useMemo, useState } from "react";
import { draftSteps, shufflePlayerIndexes } from "../lib/draft";
import type { DraftAssignments, DraftMatchWinner, DraftSelection, DraftTeamNames } from "../types/draft";

const STORAGE_KEY = "mk1-draft-state:v3";
const PLAYER_COUNT = 4;

type DraftState = {
  players: string[];
  teamNames: DraftTeamNames;
  assignments: DraftAssignments;
  selections: DraftSelection[];
  matchWinners: DraftMatchWinner[];
};

const defaultState: DraftState = {
  players: Array.from({ length: PLAYER_COUNT }, (_, index) => `Игрок ${String(index + 1).padStart(2, "0")}`),
  teamNames: { fire: "Команда X", shadow: "Команда Y" },
  assignments: { fire: [], shadow: [] },
  selections: [],
  matchWinners: [],
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
        fire: stored.teamNames?.fire === "TEAM FIRE" || stored.teamNames?.fire === "Команда один" ? defaultState.teamNames.fire : stored.teamNames?.fire || defaultState.teamNames.fire,
        shadow: stored.teamNames?.shadow === "TEAM SHADOW" || stored.teamNames?.shadow === "Команда два" ? defaultState.teamNames.shadow : stored.teamNames?.shadow || defaultState.teamNames.shadow,
      },
      assignments: {
        fire: Array.isArray(stored.assignments?.fire) ? stored.assignments.fire : [],
        shadow: Array.isArray(stored.assignments?.shadow) ? stored.assignments.shadow : [],
      },
      selections: Array.isArray(stored.selections) ? stored.selections.slice(0, draftSteps.length) : [],
      matchWinners: Array.isArray(stored.matchWinners) ? stored.matchWinners : [],
    };
  } catch {
    return defaultState;
  }
}

export function useDraft() {
  const [state, setState] = useState<DraftState>(readDraftState);
  const [shuffleVersion, setShuffleVersion] = useState(0);
  const currentStep = draftSteps[state.selections.length] ?? null;
  const hasTeams = state.assignments.fire.length === 2 && state.assignments.shadow.length === 2;
  const usedFighterIds = useMemo(
    () => new Set(state.selections.map(({ fighterId }) => fighterId)),
    [state.selections],
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  function updateSetup(players: string[], teamNames: DraftTeamNames, assignments: DraftAssignments) {
    setState((current) => ({ ...current, players, teamNames, assignments, selections: [], matchWinners: [] }));
  }

  function randomizeTeams() {
    const shuffled = shufflePlayerIndexes(PLAYER_COUNT);
    setShuffleVersion((version) => version + 1);
    setState((current) => ({
      ...current,
      assignments: { fire: shuffled.slice(0, 2), shadow: shuffled.slice(2, 4) },
      selections: [],
      matchWinners: [],
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
    setState((current) => ({ ...current, selections: current.selections.slice(0, -1), matchWinners: [] }));
  }

  function resetDraft() {
    setState((current) => ({ ...current, selections: [], matchWinners: [] }));
  }

  function selectMatchWinner(matchIndex: number, fighterId: string) {
    setState((current) => ({
      ...current,
      matchWinners: [
        ...current.matchWinners.filter((winner) => winner.matchIndex !== matchIndex),
        { matchIndex, fighterId },
      ],
    }));
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
    selectMatchWinner,
  };
}
