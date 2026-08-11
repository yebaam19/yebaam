import { CelestialText } from '../../celestial/CelestialText';
import {
  CLAVE_MAX_LENGTH,
  UMBRAL_INPUT_PLACEHOLDER,
  UMBRAL_LISTENING,
  UMBRAL_SUBMIT_CTA,
} from '../../constants';

interface ClaveFormProps {
  value: string;
  listening: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

/**
 * The clave input. As the visitor types, their words materialize above the
 * field in the angelic alphabet — the page teaching its own cipher.
 */
export function ClaveForm({ value, listening, onChange, onSubmit }: ClaveFormProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="flex w-full flex-col items-center gap-7"
    >
      <div
        className={`flex min-h-7 items-center justify-center transition-colors duration-700 ${
          listening ? 'animate-pulse text-emerald-200/70' : 'text-neutral-500'
        }`}
        aria-hidden="true"
      >
        {value.trim() && (
          <CelestialText
            text={value}
            glyphClassName="h-6 w-6"
            className="inline-flex max-w-lg flex-wrap items-center justify-center gap-x-2 gap-y-1"
          />
        )}
      </div>

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={CLAVE_MAX_LENGTH}
        placeholder={UMBRAL_INPUT_PLACEHOLDER}
        disabled={listening}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        aria-label="La clave"
        className="w-full max-w-sm border-0 border-b border-neutral-800 bg-transparent pb-3 text-center text-lg tracking-[0.25em] text-neutral-200 transition-colors placeholder:text-neutral-700 focus:border-emerald-800 focus:ring-0 focus:outline-none disabled:opacity-60"
      />

      <button
        type="submit"
        disabled={listening || !value.trim()}
        className="rounded-full border border-neutral-800 px-9 py-2.5 text-xs tracking-[0.4em] text-neutral-400 uppercase transition-all duration-500 hover:border-emerald-900 hover:text-emerald-200 hover:shadow-[0_0_28px_-8px_rgba(34,165,76,0.45)] disabled:cursor-default disabled:opacity-40 disabled:hover:border-neutral-800 disabled:hover:text-neutral-400 disabled:hover:shadow-none"
      >
        {listening ? UMBRAL_LISTENING : UMBRAL_SUBMIT_CTA}
      </button>
    </form>
  );
}
