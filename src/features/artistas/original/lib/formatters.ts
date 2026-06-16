export function formatDate(value?: string | null) {
  if (!value) return "Por definir";
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export function formatCurrency(value?: string | number | null, currency = "COP") {
  if (value === undefined || value === null) return "A convenir";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(Number(value));
}
