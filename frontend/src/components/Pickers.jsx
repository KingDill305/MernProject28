import { THEMES } from '../themes.js';

export function EmojiPicker({ options, value, onChange, name = 'Emoji' }) {
  return (
    <fieldset className="picker">
      <legend>Emoji</legend>
      <div className="picker-options">
        {options.map((em) => (
          <label key={em} className="emoji-option">
            <input type="radio" name={name} value={em} checked={value === em} onChange={onChange} />
            <span aria-hidden="true">{em}</span>
            <span className="visually-hidden">{em}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ThemePicker({ value, onChange, name = 'Theme' }) {
  return (
    <fieldset className="picker">
      <legend>Color</legend>
      <div className="picker-options">
        {THEMES.map((t) => (
          <label key={t.id} className="theme-option" style={{ '--swatch': t.bg }}>
            <input type="radio" name={name} value={t.id} checked={value === t.id} onChange={onChange} />
            <span className="swatch" aria-hidden="true" />
            <span className="theme-name">{t.name}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
