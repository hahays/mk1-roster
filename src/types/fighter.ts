export type FighterGroup = "fighter" | "kameo";

export type Fighter = {
  id: string;
  slug: string;
  name: string;
  group: FighterGroup;
  image: string;
  source: string;
  categories: string[];
};

export type RosterFilter = FighterGroup | "all";
