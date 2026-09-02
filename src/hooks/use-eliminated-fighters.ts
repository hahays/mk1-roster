import { useCallback, useEffect, useState } from "react";

const storageKey = "mk1-stream-roster:eliminated:v1";

function readStoredFighters(validIds: Set<string>) {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? "[]");

    if (!Array.isArray(stored)) {
      return new Set<string>();
    }

    return new Set(stored.filter((id): id is string => typeof id === "string" && validIds.has(id)));
  } catch {
    return new Set<string>();
  }
}

export function useEliminatedFighters(fighterIds: string[]) {
  const [eliminated, setEliminated] = useState(() => readStoredFighters(new Set(fighterIds)));

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify([...eliminated]));
  }, [eliminated]);

  const toggle = useCallback((id: string) => {
    setEliminated((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }, []);

  const reset = useCallback(() => setEliminated(new Set()), []);

  return { eliminated, reset, toggle };
}
