export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function orderNumber(id: string) {
  return `ISO-${id.slice(-6).toUpperCase()}`;
}

export function timeOfDayGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** "Dr. Maya Ellison, MD" → "Dr. Ellison" */
export function greetingName(prescriberName: string) {
  const cleaned = prescriberName.replace(/,?\s*(MD|DO|NP|PA-C|PA|RPh|PharmD)\.?$/i, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2 && /^dr\.?$/i.test(parts[0]!)) {
    return `Dr. ${parts[parts.length - 1]}`;
  }
  return cleaned || "Doctor";
}
