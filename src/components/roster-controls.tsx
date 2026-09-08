import type { RosterFilter } from "../types/fighter";
import { ModeSwitch } from "./mode-switch";

type RosterControlsProps = {
  activeFilter: RosterFilter;
  eliminatedCount: number;
  isOverlay: boolean;
  onFilterChange: (filter: RosterFilter) => void;
  onResetRequest: () => void;
  onShowBracket: () => void;
  onShowDraft: () => void;
  onShowRating: () => void;
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
  onShowBracket,
  onShowDraft,
  onShowRating,
  totalCount,
}: RosterControlsProps) {
  return (
    <header className={`app-page-header roster-header ${isOverlay ? "roster-header--overlay" : ""}`}>
      <div className="app-page-header__top roster-header__top">
        <div className="min-w-0">
        <p className="page-eyebrow">
          ELKAMUSAEV EVENTS CENTR
        </p>
        <h1 className="page-title">
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
      </div>

      {!isOverlay && (
        <div className="app-page-nav roster-header__nav-row col-span-full flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <ModeSwitch activeMode="roster" onChange={(mode) => {
              if (mode === "draft") onShowDraft();
              if (mode === "bracket") onShowBracket();
              if (mode === "rating") onShowRating();
            }} />
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
