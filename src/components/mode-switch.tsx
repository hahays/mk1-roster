export type AppMode = "roster" | "draft" | "bracket" | "rating";

type ModeSwitchProps = {
  activeMode: AppMode;
  onChange: (mode: AppMode) => void;
};

const modes: Array<{ label: string; value: AppMode }> = [
  { label: "Roster", value: "roster" },
  { label: "Draft", value: "draft" },
  { label: "Bracket", value: "bracket" },
  { label: "Rating", value: "rating" },
];

export function ModeSwitch({ activeMode, onChange }: ModeSwitchProps) {
  return (
    <div className="mode-switch" role="group" aria-label="Application mode">
      {modes.map((mode) => (
        <button
          className={`mode-switch__button ${activeMode === mode.value ? "is-active" : ""}`}
          key={mode.value}
          type="button"
          aria-pressed={activeMode === mode.value}
          onClick={() => onChange(mode.value)}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
