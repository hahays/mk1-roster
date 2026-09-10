import { useEffect, useId, useRef, useState } from "react";
import { getAssetUrl } from "../lib/assets";
import type { Fighter } from "../types/fighter";

type CharacterPickerDialogProps = {
  fighters: Fighter[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
};

export function CharacterPickerDialog({ fighters, selectedId, onSelect, onClose }: CharacterPickerDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const visibleFighters = fighters.filter((fighter) => fighter.group === "fighter" && fighter.name.toLowerCase().includes(query));

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    dialog?.showModal();
    searchRef.current?.focus();
    return () => {
      dialog?.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="king-picker"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}
    >
      <div className="king-picker__header">
        <h2 id={titleId}>Выберите персонажа</h2>
        <button className="king-picker__close" type="button" aria-label="Закрыть выбор персонажа" onClick={onClose}><span aria-hidden="true" /></button>
      </div>
      <input
        ref={searchRef}
        className="king-picker__search"
        type="search"
        aria-label="Поиск персонажа"
        placeholder="Поиск персонажа..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="king-picker__grid">
        {visibleFighters.map((fighter) => (
          <button
            className={`king-picker__fighter${fighter.id === selectedId ? " is-selected" : ""}`}
            type="button"
            key={fighter.id}
            aria-pressed={fighter.id === selectedId}
            onClick={() => onSelect(fighter.id)}
          >
            <img src={getAssetUrl(fighter.image)} alt="" loading="lazy" width="150" height="150" />
            <span>{fighter.name}</span>
          </button>
        ))}
      </div>
      {visibleFighters.length === 0 ? <p className="king-picker__empty" role="status">Персонажи не найдены.</p> : null}
    </dialog>
  );
}
