/** All amounts are integer euro cents. */
export type Cents = number;

const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

export function formatEuro(cents: Cents): string {
  return euro.format(cents / 100);
}
