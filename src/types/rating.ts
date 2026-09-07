export type RatingResult = {
  sourceId: string;
  playedAt: string;
  month: string;
  winner: string;
  loser: string;
};

export type RatingEntry = {
  name: string;
  points: number;
  matches: number;
  wins: number;
  losses: number;
  fightsWon: number;
  fightsLost: number;
  lastPlayedAt: string;
};
