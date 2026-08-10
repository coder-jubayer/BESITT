export function formatMoney(amount: number): string {
  const formatted = Number(amount || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
  return `Tk ${formatted}`;
}
