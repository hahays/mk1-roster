import type { DraftSelection, DraftStep, DraftTeamId } from "../types/draft";

const roundTurn = (
  round: DraftStep["round"],
  bans: number,
  picks: number,
): DraftStep[] => [
  ...Array.from({ length: bans }, () => ({ round, action: "ban" as const, teamId: "fire" as const })),
  ...Array.from({ length: bans }, () => ({ round, action: "ban" as const, teamId: "shadow" as const })),
  ...Array.from({ length: picks }, () => ({ round, action: "pick" as const, teamId: "fire" as const })),
  ...Array.from({ length: picks }, () => ({ round, action: "pick" as const, teamId: "shadow" as const })),
];

export const draftSteps: DraftStep[] = [
  ...roundTurn(1, 1, 2),
  ...roundTurn(2, 1, 2),
  ...roundTurn(3, 1, 1),
];

export const draftRoundRules = [
  { round: 1, bans: 1, picks: 2 },
  { round: 2, bans: 1, picks: 2 },
  { round: 3, bans: 1, picks: 1 },
] as const;

export function shufflePlayerIndexes(count: number) {
  const indexes = Array.from({ length: count }, (_, index) => index);

  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [indexes[index], indexes[target]] = [indexes[target], indexes[index]];
  }

  return indexes;
}

export function getFighterDraftState(selections: DraftSelection[], fighterId: string) {
  const related = selections.filter((selection) => selection.fighterId === fighterId);

  return {
    ban: related.find((selection) => selection.action === "ban"),
    picks: related.filter((selection) => selection.action === "pick"),
  };
}

export function canSelectFighter(
  selections: DraftSelection[],
  fighterId: string,
  currentStep: DraftStep | null,
  mirrorEnabled: boolean,
) {
  if (!currentStep) return false;

  const { ban, picks } = getFighterDraftState(selections, fighterId);
  if (ban || picks.some((selection) => selection.teamId === currentStep.teamId)) return false;
  if (picks.length === 0) return true;
  if (currentStep.action === "ban") return false;

  return mirrorEnabled && picks.length === 1;
}

export function getMirroredFighterIds(selections: DraftSelection[]) {
  const picksByTeam: Record<DraftTeamId, Set<string>> = { fire: new Set(), shadow: new Set() };

  for (const selection of selections) {
    if (selection.action === "pick") picksByTeam[selection.teamId].add(selection.fighterId);
  }

  return new Set([...picksByTeam.fire].filter((fighterId) => picksByTeam.shadow.has(fighterId)));
}
