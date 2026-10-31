import type { KameoBans, KameoSide } from "../hooks/use-kameo-bans";
import type { Fighter } from "../types/fighter";
import { FighterCard } from "./fighter-card";

type KameoRostersProps = {
  fighters: Fighter[];
  bans: KameoBans;
  onToggle: (side: KameoSide, id: string) => void;
};

const sides: KameoSide[] = ["left", "right"];

export function KameoRosters({ fighters, bans, onToggle }: KameoRostersProps) {
  return (
    <section className="kameo-rosters mt-3 flex-1 sm:mt-4" aria-label="Kameo bans">
      {sides.map((side) => (
        <div className="kameo-rosters__side" role="group" aria-label={`${side === "left" ? "Left" : "Right"} player kameos`} key={side}>
          {fighters.map((fighter, index) => (
            <FighterCard
              fighter={fighter}
              index={index}
              isEliminated={bans[side].has(fighter.id)}
              key={fighter.id}
              onToggle={(id) => onToggle(side, id)}
              eliminationLabel="BANNED"
            />
          ))}
        </div>
      ))}
    </section>
  );
}
