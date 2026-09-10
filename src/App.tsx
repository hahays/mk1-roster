import { useEffect, useState } from "react";
import rosterData from "./data/roster.json";
import { DraftBoard } from "./components/draft-board";
import { BracketBoard } from "./components/bracket-board";
import { RatingBoard } from "./components/rating-board";
import { KingOfHillBoard } from "./components/king-of-hill-board";
import { FighterCard } from "./components/fighter-card";
import { ResetDialog } from "./components/reset-dialog";
import { RosterControls } from "./components/roster-controls";
import { useEliminatedFighters } from "./hooks/use-eliminated-fighters";
import { useRating } from "./hooks/use-rating";
import type { AppMode } from "./components/mode-switch";
import type { Fighter, RosterFilter } from "./types/fighter";

const roster = rosterData as Fighter[];
const fighterIds = roster.map(({ id }) => id);

function readPageSettings() {
  const params = new URLSearchParams(window.location.search);
  const requestedFilter = params.get("view");
  const filter: RosterFilter =
    requestedFilter === "fighter" || requestedFilter === "kameo" || requestedFilter === "all"
      ? requestedFilter
      : "fighter";

  return {
    filter,
    mode: ["draft", "bracket", "rating", "king"].includes(params.get("mode") ?? "")
      ? params.get("mode") as AppMode
      : "roster" as const,
    isOverlay: params.get("overlay") === "1",
    isTransparent: params.get("background") === "transparent",
  };
}

const pageSettings = readPageSettings();

function App() {
  const [filter, setFilter] = useState<RosterFilter>(pageSettings.filter);
  const [mode, setMode] = useState<AppMode>(pageSettings.mode);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const { eliminated, reset, toggle } = useEliminatedFighters(fighterIds);
  const rating = useRating();
  const visibleRoster = filter === "all" ? roster : roster.filter((fighter) => fighter.group === filter);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLElement && (event.target.closest("input, textarea, select, dialog") || event.target.isContentEditable)) return;
      if (event.key === "Escape") {
        setIsResetOpen(false);
      }

      if (event.shiftKey && event.key.toLowerCase() === "r" && eliminated.size > 0) {
        event.preventDefault();
        setIsResetOpen(true);
      }

      if (!pageSettings.isOverlay && !event.metaKey && !event.ctrlKey && !event.altKey) {
        if (event.key === "1") setFilter("fighter");
        if (event.key === "2") setFilter("kameo");
        if (event.key === "3") setFilter("all");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [eliminated.size]);

  function confirmReset() {
    reset();
    setIsResetOpen(false);
  }

  function changeMode(nextMode: AppMode) {
    const url = new URL(window.location.href);
    setMode(nextMode);

    if (nextMode !== "roster") {
      url.searchParams.set("mode", nextMode);
    } else {
      url.searchParams.delete("mode");
    }

    window.history.replaceState(null, "", url);
  }

  return (
    <main
      className={`app-shell ${pageSettings.isTransparent ? "app-shell--transparent" : ""}`}
      data-view={mode !== "roster" ? mode : filter}
    >
      <div className="app-shell__content relative z-10 flex min-h-screen w-full flex-col px-3 py-3 sm:px-5 sm:py-4 lg:px-8 lg:py-5">
        {mode === "king" ? (
          <KingOfHillBoard fighters={roster.filter((fighter) => fighter.group === "fighter")} isOverlay={pageSettings.isOverlay} onChangeMode={changeMode} />
        ) : mode === "draft" ? (
          <DraftBoard
            onShowKing={() => changeMode("king")}
            fighters={roster.filter((fighter) => fighter.group === "fighter")}
            isOverlay={pageSettings.isOverlay}
            onShowBracket={() => changeMode("bracket")}
            onShowRating={() => changeMode("rating")}
            onShowRoster={() => changeMode("roster")}
            onRecordRating={rating.recordResults}
          />
        ) : mode === "bracket" ? (
          <BracketBoard
            onShowKing={() => changeMode("king")}
            isOverlay={pageSettings.isOverlay}
            onRecordRating={rating.recordResults}
            onShowDraft={() => changeMode("draft")}
            onShowRating={() => changeMode("rating")}
            onShowRoster={() => changeMode("roster")}
          />
        ) : mode === "rating" ? (
          <RatingBoard
            onShowKing={() => changeMode("king")}
            entries={rating.entries}
            isOverlay={pageSettings.isOverlay}
            months={rating.months}
            results={rating.results}
            onShowBracket={() => changeMode("bracket")}
            onShowDraft={() => changeMode("draft")}
            onShowRoster={() => changeMode("roster")}
            onResetRating={rating.resetRating}
          />
        ) : (
          <>
            <RosterControls
              onShowKing={() => changeMode("king")}
              activeFilter={filter}
              eliminatedCount={eliminated.size}
              isOverlay={pageSettings.isOverlay}
              onFilterChange={setFilter}
              onResetRequest={() => setIsResetOpen(true)}
              onShowBracket={() => changeMode("bracket")}
              onShowDraft={() => changeMode("draft")}
              onShowRating={() => changeMode("rating")}
              totalCount={roster.length}
            />

            <section
              className="roster-grid mt-3 flex-1 sm:mt-4"
              aria-label={filter === "fighter" ? "Fighters" : filter === "kameo" ? "Kameo fighters" : "All fighters"}
            >
              {visibleRoster.map((fighter, index) => (
                <FighterCard
                  fighter={fighter}
                  index={index}
                  isEliminated={eliminated.has(fighter.id)}
                  key={fighter.id}
                  onToggle={toggle}
                />
              ))}
            </section>
          </>
        )}

      </div>

      <ResetDialog isOpen={isResetOpen} onCancel={() => setIsResetOpen(false)} onConfirm={confirmReset} />
    </main>
  );
}

export default App;
