import { Search } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";

type SearchBarProps = {
  defaultValue?: string;
  placeholder?: string;
  onSearch: (value: string) => void;
  className?: string;
};

export function SearchBar({ defaultValue = "", placeholder = "Buscar...", onSearch, className = "" }: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(value);
  }

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="min-h-10 w-full rounded-xl border border-brand-border bg-white py-2.5 pl-9 pr-4 text-sm text-brand-ink outline-none transition placeholder:text-brand-muted/60 focus:border-brand-greenDark focus:ring-2 focus:ring-brand-greenDark/15"
        />
      </div>
      <button
        type="submit"
        className="min-h-10 rounded-xl bg-brand-greenDark px-4 text-sm font-semibold text-white shadow-green transition hover:bg-brand-greenDeep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-greenDark focus-visible:ring-offset-2"
      >
        Buscar
      </button>
    </form>
  );
}
