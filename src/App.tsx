import { useEffect, useState } from "react";
import rosterData from "./data/roster.json";
import { DraftBoard } from "./components/draft-board";
import { FighterCard } from "./components/fighter-card";
import { ResetDialog } from "./components/reset-dialog";
import { RosterControls } from "./components/roster-controls";
import { useEliminatedFighters } from "./hooks/use-eliminated-fighters";
import { getAssetUrl } from "./lib/assets";
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
    mode: params.get("mode") === "draft" ? "draft" as const : "roster" as const,
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
  const visibleRoster = filter === "all" ? roster : roster.filter((fighter) => fighter.group === filter);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
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

    if (nextMode === "draft") {
      url.searchParams.set("mode", "draft");
    } else {
      url.searchParams.delete("mode");
    }

    window.history.replaceState(null, "", url);
  }

  return (
    <main
      className={`app-shell ${pageSettings.isTransparent ? "app-shell--transparent" : ""}`}
      data-view={mode === "draft" ? "draft" : filter}
    >
      <div className="ambient-layer" aria-hidden="true">
        <div className="ambient-smoke-field">
          <video className="ambient-smoke" src={getAssetUrl("/effects/roster-smoke.mp4")} autoPlay muted loop playsInline />
          <video className="ambient-smoke ambient-smoke--mirror" src={getAssetUrl("/effects/roster-smoke.mp4")} autoPlay muted loop playsInline />
        </div>
        <div className="ambient-fire-field">
          <video className="ambient-fire" src={getAssetUrl("/effects/fire-line.mp4")} autoPlay muted loop playsInline />
          <video className="ambient-fire ambient-fire--mirror" src={getAssetUrl("/effects/fire-line.mp4")} autoPlay muted loop playsInline />
        </div>
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1920px] flex-col px-3 py-3 sm:px-5 sm:py-4 lg:px-8 lg:py-5">
        {mode === "draft" ? (
          <DraftBoard
            fighters={roster.filter((fighter) => fighter.group === "fighter")}
            isOverlay={pageSettings.isOverlay}
            onShowRoster={() => changeMode("roster")}
          />
        ) : (
          <>
            <RosterControls
              activeFilter={filter}
              eliminatedCount={eliminated.size}
              isOverlay={pageSettings.isOverlay}
              onFilterChange={setFilter}
              onResetRequest={() => setIsResetOpen(true)}
              onShowDraft={() => changeMode("draft")}
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
