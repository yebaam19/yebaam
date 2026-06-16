type TableProps = {
  headers: string[];
  rows: (string | number | null | undefined)[][];
  caption?: string;
};

export function Table({ headers, rows, caption }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-brand-border bg-white shadow-card" role="region" aria-label={caption ?? "Tabla de datos"}>
      <table className="min-w-full text-sm" aria-label={caption ?? undefined}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-brand-border bg-brand-bgGreen">
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-brand-ink"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-border">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-8 text-center text-sm text-brand-muted">
                Sin registros
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="transition hover:bg-brand-bgGreen/40">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 text-brand-ink">
                    {cell ?? "—"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
