import { useEffect, useRef, useState } from "react";

type MkSelectOption = {
  label: string;
  value: string;
};

type MkSelectProps = {
  ariaLabel: string;
  options: MkSelectOption[];
  value: string;
  onChange: (value: string) => void;
};

export function MkSelect({ ariaLabel, options, value, onChange }: MkSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div className={`mk-select ${isOpen ? "is-open" : ""}`} ref={rootRef}>
      <button aria-expanded={isOpen} aria-haspopup="listbox" aria-label={ariaLabel} type="button" onClick={() => setIsOpen((open) => !open)}>
        <span>{selected?.label}</span>
        <i aria-hidden="true" />
      </button>
      {isOpen ? (
        <div className="mk-select__menu" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => (
            <button
              aria-selected={option.value === value}
              className={option.value === value ? "is-selected" : ""}
              key={option.value}
              role="option"
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
