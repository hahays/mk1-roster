import { useCallback, useEffect, useState } from "react";

const storageKey = "mk1-stream-roster:kameo-bans:v1";

export type KameoSide = "left" | "right";
export type KameoBans = Record<KameoSide, Set<string>>;

function emptyBans(): KameoBans {
  return { left: new Set(), right: new Set() };
}

function readStoredBans(validIds: Set<string>): KameoBans {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return emptyBans();

    const readSide = (value: unknown) => new Set<string>(
      Array.isArray(value)
        ? value.filter((id): id is string => typeof id === "string" && validIds.has(id))
        : [],
    );
    const sides = stored as Record<string, unknown>;
    return { left: readSide(sides.left), right: readSide(sides.right) };
  } catch {
    return emptyBans();
  }
}

export function useKameoBans(kameoIds: string[]) {
  const [bans, setBans] = useState(() => readStoredBans(new Set(kameoIds)));

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ left: [...bans.left], right: [...bans.right] }));
    } catch {
      // Keep the controls usable when browser storage is unavailable.
    }
  }, [bans]);

  const toggle = useCallback((side: KameoSide, id: string) => {
    setBans((current) => {
      const next = new Set(current[side]);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...current, [side]: next };
    });
  }, []);

  const reset = useCallback(() => setBans(emptyBans()), []);

  return { bans, count: bans.left.size + bans.right.size, reset, toggle };
}
