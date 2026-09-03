import type { DraftStep, DraftTeamId } from "../types/draft";

const paired = (
  round: DraftStep["round"],
  action: DraftStep["action"],
  first: DraftTeamId,
  second: DraftTeamId,
): DraftStep[] => [
  { round, action, teamId: first },
  { round, action, teamId: second },
  { round, action, teamId: second },
  { round, action, teamId: first },
];

export const draftSteps: DraftStep[] = [
  ...paired(1, "ban", "fire", "shadow"),
  ...paired(1, "pick", "shadow", "fire"),
  ...paired(2, "ban", "shadow", "fire"),
  ...paired(2, "pick", "fire", "shadow"),
  { round: 3, action: "ban", teamId: "fire" },
  { round: 3, action: "ban", teamId: "shadow" },
  { round: 3, action: "pick", teamId: "shadow" },
  { round: 3, action: "pick", teamId: "fire" },
];

export const draftRoundRules = [
  { round: 1, bans: 2, picks: 2 },
  { round: 2, bans: 2, picks: 2 },
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
