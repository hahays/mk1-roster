import type { DraftStep } from "../types/draft";

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
  ...roundTurn(1, 2, 2),
  ...roundTurn(2, 2, 2),
  ...roundTurn(3, 1, 1),
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
