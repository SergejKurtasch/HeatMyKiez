/**
 * Format number as Euro amount (de-DE locale, 2 decimal places).
 */
export function formatEuro(value: number): string {
  return value.toLocaleString("de-DE", { minimumFractionDigits: 2 });
}
