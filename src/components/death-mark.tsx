export function DeathMark() {
  return (
    <div className="death-mark" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <path className="death-mark__shadow death-mark__line death-mark__line--first" d="M 8 10 C 27 29, 68 67, 93 91" />
        <path className="death-mark__stroke death-mark__line death-mark__line--first" d="M 8 10 C 27 29, 68 67, 93 91" />
        <path className="death-mark__shadow death-mark__line death-mark__line--second" d="M 92 8 C 69 31, 35 67, 7 92" />
        <path className="death-mark__stroke death-mark__line death-mark__line--second" d="M 92 8 C 69 31, 35 67, 7 92" />
        <circle className="death-mark__drop death-mark__drop--one" cx="15" cy="75" r="3" />
        <circle className="death-mark__drop death-mark__drop--two" cx="82" cy="68" r="2.5" />
        <circle className="death-mark__drop death-mark__drop--three" cx="61" cy="89" r="2" />
      </svg>
      <span className="death-mark__label">DEAD</span>
    </div>
  );
}
