export type DraftTeamId = "fire" | "shadow";

export type DraftActionType = "ban" | "pick";

export type DraftStep = {
  round: 1 | 2 | 3;
  teamId: DraftTeamId;
  action: DraftActionType;
};

export type DraftSelection = DraftStep & {
  fighterId: string;
};

export type DraftTeamNames = Record<DraftTeamId, string>;

export type DraftAssignments = Record<DraftTeamId, number[]>;
