type TabItem = { id: string; label: string };
type TabsProps = { items: TabItem[]; active: string; onChange: (id: string) => void };

export function Tabs({ items, active, onChange }: TabsProps) {
  return (
    <div className="flex overflow-x-auto rounded-xl border border-brand-border bg-brand-bgGreen p-1 gap-1">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            item.id === active
              ? "bg-white text-brand-dark shadow-card"
              : "text-brand-muted hover:text-brand-ink"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
