/** Polish-style whole złoty amounts for the marketing phone demo (e.g. "23 100 zł"). */
export function formatHeroPhoneCurrency(value: number): string {
  const rounded = Math.round(value);
  const amount = new Intl.NumberFormat("pl-PL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded);

  return `${amount} zł`;
}
