import { useEffect, useMemo, useState } from "react";
import { draftSteps, shufflePlayerIndexes } from "../lib/draft";
import type { DraftAssignments, DraftMatchParticipants, DraftMatchWinner, DraftSelection, DraftTeamId, DraftTeamNames } from "../types/draft";

const STORAGE_KEY = "mk1-draft-state:v3";
const PLAYER_COUNT = 4;

type DraftState = {
  sessionId: string;
  players: string[];
  teamNames: DraftTeamNames;
  assignments: DraftAssignments;
  selections: DraftSelection[];
  matchWinners: DraftMatchWinner[];
  matchParticipants: DraftMatchParticipants[];
  ratingRecorded: boolean;
};

function createSessionId() {
  return `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const defaultState: DraftState = {
  sessionId: createSessionId(),
  players: Array.from({ length: PLAYER_COUNT }, (_, index) => `Player ${String(index + 1).padStart(2, "0")}`),
  teamNames: { fire: "Team X", shadow: "Team Y" },
  assignments: { fire: [], shadow: [] },
  selections: [],
  matchWinners: [],
  matchParticipants: [],
  ratingRecorded: false,
};

function readDraftState(): DraftState {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<DraftState> | null;

    if (!stored || !Array.isArray(stored.players) || stored.players.length !== PLAYER_COUNT) {
      return defaultState;
    }

    return {
      sessionId: typeof stored.sessionId === "string" ? stored.sessionId : createSessionId(),
      players: stored.players.map((player, index) => player?.replace(/^Игрок (\d+)$/, "Player $1") || defaultState.players[index]),
      teamNames: {
        fire: stored.teamNames?.fire === "TEAM FIRE" || ["Команда один", "Команда X"].includes(stored.teamNames?.fire ?? "") ? defaultState.teamNames.fire : stored.teamNames?.fire || defaultState.teamNames.fire,
        shadow: stored.teamNames?.shadow === "TEAM SHADOW" || ["Команда два", "Команда Y"].includes(stored.teamNames?.shadow ?? "") ? defaultState.teamNames.shadow : stored.teamNames?.shadow || defaultState.teamNames.shadow,
      },
      assignments: {
        fire: Array.isArray(stored.assignments?.fire) ? stored.assignments.fire : [],
        shadow: Array.isArray(stored.assignments?.shadow) ? stored.assignments.shadow : [],
      },
      selections: Array.isArray(stored.selections) ? stored.selections.slice(0, draftSteps.length) : [],
      matchWinners: Array.isArray(stored.matchWinners) ? stored.matchWinners : [],
      matchParticipants: Array.isArray(stored.matchParticipants) ? stored.matchParticipants : [],
      ratingRecorded: Boolean(stored.ratingRecorded),
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
    setState((current) => ({
      ...current,
      sessionId: createSessionId(),
      players,
      teamNames,
      assignments,
      selections: [],
      matchWinners: [],
      matchParticipants: [],
      ratingRecorded: false,
    }));
  }

  function randomizeTeams() {
    const shuffled = shufflePlayerIndexes(PLAYER_COUNT);
    setShuffleVersion((version) => version + 1);
    setState((current) => ({
      ...current,
      sessionId: createSessionId(),
      assignments: { fire: shuffled.slice(0, 2), shadow: shuffled.slice(2, 4) },
      selections: [],
      matchWinners: [],
      matchParticipants: [],
      ratingRecorded: false,
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
    setState((current) => ({
      ...current,
      selections: current.selections.slice(0, -1),
      matchWinners: [],
      matchParticipants: [],
      ratingRecorded: false,
    }));
  }

  function resetDraft() {
    setState((current) => ({
      ...current,
      sessionId: createSessionId(),
      selections: [],
      matchWinners: [],
      matchParticipants: [],
      ratingRecorded: false,
    }));
  }

  function selectMatchWinner(matchIndex: number, fighterId: string) {
    if (state.ratingRecorded) return;

    setState((current) => ({
      ...current,
      matchWinners: [
        ...current.matchWinners.filter((winner) => winner.matchIndex !== matchIndex),
        { matchIndex, fighterId },
      ],
    }));
  }

  function selectMatchParticipant(matchIndex: number, teamId: DraftTeamId, playerIndex: number) {
    if (state.ratingRecorded) return;

    setState((current) => {
      const existing = current.matchParticipants.find((participant) => participant.matchIndex === matchIndex);
      const participant: DraftMatchParticipants = {
        matchIndex,
        firePlayerIndex: teamId === "fire" ? playerIndex : existing?.firePlayerIndex ?? matchIndex % 2,
        shadowPlayerIndex: teamId === "shadow" ? playerIndex : existing?.shadowPlayerIndex ?? matchIndex % 2,
      };

      return {
        ...current,
        matchParticipants: [
          ...current.matchParticipants.filter((item) => item.matchIndex !== matchIndex),
          participant,
        ],
      };
    });
  }

  function markRatingRecorded() {
    setState((current) => ({ ...current, ratingRecorded: true }));
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
    selectMatchParticipant,
    markRatingRecorded,
  };
}
