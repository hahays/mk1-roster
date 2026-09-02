import type { RosterFilter } from "../types/fighter";

type RosterControlsProps = {
  activeFilter: RosterFilter;
  eliminatedCount: number;
  isOverlay: boolean;
  onFilterChange: (filter: RosterFilter) => void;
  onResetRequest: () => void;
  totalCount: number;
};

const filters: Array<{ label: string; value: RosterFilter }> = [
  { label: "Fighters", value: "fighter" },
  { label: "Kameos", value: "kameo" },
  { label: "All", value: "all" },
];

export function RosterControls({
  activeFilter,
  eliminatedCount,
  isOverlay,
  onFilterChange,
  onResetRequest,
  totalCount,
}: RosterControlsProps) {
  return (
    <header className={`roster-header ${isOverlay ? "roster-header--overlay" : ""}`}>
      <div className="min-w-0">
        <p className="mb-3 text-[0.62rem] font-bold tracking-[0.32em] text-amber-300/60 sm:mb-4 sm:text-xs">
          ЭЛЬ, ПРИДУМАЙ ТУТ НАЗВАНИЕ, ЧТО ХОТЕЛ БЫ ВИДЕТЬ
        </p>
        <h1 className="font-display text-[clamp(1.75rem,4vw,4.25rem)] leading-none tracking-[-0.035em] text-stone-100">
          ВЫБЕРИТЕ БОЙЦА
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="text-right">
          <span className="block text-[0.55rem] font-bold tracking-[0.22em] text-stone-500 sm:text-[0.65rem]">
            ELIMINATED
          </span>
          <span className="font-display text-xl leading-none text-red-500 sm:text-3xl">
            {eliminatedCount}
            <span className="text-sm text-stone-600 sm:text-base"> / {totalCount}</span>
          </span>
        </div>
      </div>

      {!isOverlay && (
        <div className="col-span-full flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-3">
          <div className="flex overflow-hidden rounded-sm border border-white/10 bg-black/30" role="group" aria-label="Roster view">
            {filters.map((filter) => (
              <button
                className={`filter-button ${activeFilter === filter.value ? "is-active" : ""}`}
                key={filter.value}
                type="button"
                aria-pressed={activeFilter === filter.value}
                onClick={() => onFilterChange(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <button
            className="reset-button"
            type="button"
            disabled={eliminatedCount === 0}
            onClick={onResetRequest}
          >
            Reset roster
          </button>
        </div>
      )}
    </header>
  );
}
