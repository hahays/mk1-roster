type ResetDialogProps = {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ResetDialog({ isOpen, onCancel, onConfirm }: ResetDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        className="reset-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="reset-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <p className="mb-2 text-[0.65rem] font-bold tracking-[0.3em] text-red-500">CONFIRM ACTION</p>
        <h2 className="font-display text-3xl text-stone-100" id="reset-title">
          Reset the roster?
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-stone-400">
          Every eliminated fighter will return to the roster.
        </p>
        <div className="mt-7 flex justify-end gap-3">
          <button className="dialog-button" type="button" onClick={onCancel} autoFocus>
            Cancel
          </button>
          <button className="dialog-button dialog-button--danger" type="button" onClick={onConfirm}>
            Reset all
          </button>
        </div>
      </section>
    </div>
  );
}
