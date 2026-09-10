import { useEffect, useState } from "react";
import roster from "../data/roster.json";

const STORAGE_KEY = "mk1-king-of-hill:v1";
const fighterIds = new Set(roster.filter((fighter) => fighter.group === "fighter").map((fighter) => fighter.id));

export type KingPlayer = {
  fighterId: string;
  nickname: string;
  lives: boolean[];
  donatedLives: boolean[];
};

export type KingOfHillState = {
  players: KingPlayer[];
  prizePool: string;
};

function createDefaultState(): KingOfHillState {
  return {
    players: ["scorpion", "sub-zero", "kitana", "liu-kang"].map((slug, index) => ({
      fighterId: `fighter-${slug}`,
      nickname: "",
      lives: Array<boolean>(index === 0 ? 5 : 3).fill(true),
      donatedLives: [],
    })),
    prizePool: "",
  };
}

function isPlayer(value: unknown): value is KingPlayer {
  if (!value || typeof value !== "object") return false;
  const player = value as Record<string, unknown>;
  return typeof player.fighterId === "string" && fighterIds.has(player.fighterId)
    && typeof player.nickname === "string" && player.nickname.length <= 40
    && Array.isArray(player.lives) && player.lives.length >= 1 && player.lives.length <= 10
    && player.lives.every((life) => typeof life === "boolean");
}

function readState(): KingOfHillState {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (saved && typeof saved === "object") {
      const record = saved as Record<string, unknown>;
      if (record.version === 1 && Array.isArray(record.players) && record.players.length === 4
        && record.players.every(isPlayer) && typeof record.prizePool === "string" && record.prizePool.length <= 80) {
        return {
          players: record.players.map(({ fighterId, nickname, lives, donatedLives }, index) => ({
            fighterId, nickname, lives: Array.from({ length: index === 0 ? 5 : 3 }, (_, life) => lives[life] ?? true),
            donatedLives: Array.isArray(donatedLives) && donatedLives.every((life) => typeof life === "boolean")
              ? donatedLives.slice(0, index === 0 ? 5 : 2) : [],
          })),
          prizePool: record.prizePool,
        };
      }
    }
  } catch {
    // A corrupt save or disabled storage should not prevent using the board.
  }
  return createDefaultState();
}

export function useKingOfHill() {
  const [state, setState] = useState<KingOfHillState>(readState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ...state }));
    } catch {
      // Keep the board editable when browser storage is unavailable or full.
    }
  }, [state]);

  function updatePlayer(index: number, patch: Partial<KingPlayer>) {
    setState((current) => {
      const player = current.players[index];
      if (!player) return current;
      const next = { ...player, ...patch };
      if (!isPlayer(next)) return current;
      return { ...current, players: current.players.map((entry, position) => position === index ? { ...next, lives: [...next.lives] } : entry) };
    });
  }

  function toggleLife(index: number, lifeIndex: number) {
    setState((current) => {
      const player = current.players[index];
      if (!player || !Number.isInteger(lifeIndex) || lifeIndex < 0 || lifeIndex >= player.lives.length) return current;
      return {
        ...current,
        players: current.players.map((entry, position) => position === index
          ? { ...entry, lives: entry.lives.map((alive, life) => life === lifeIndex ? !alive : alive) }
          : entry),
      };
    });
  }

  function setPrizePool(value: string) {
    setState((current) => ({ ...current, prizePool: value.slice(0, 80) }));
  }

  function changeDonatedLife(index: number, action: "add" | "remove" | number) {
    setState((current) => ({
      ...current,
      players: current.players.map((player, position) => {
        if (position !== index) return player;
        const lives = player.donatedLives;
        if (action === "add") return lives.length < (index === 0 ? 5 : 2)
          ? { ...player, donatedLives: [...lives, true] } : player;
        if (action === "remove") return { ...player, donatedLives: lives.slice(0, -1) };
        return { ...player, donatedLives: lives.map((alive, life) => life === action ? !alive : alive) };
      }),
    }));
  }

  return { state, updatePlayer, toggleLife, setPrizePool, changeDonatedLife };
}
