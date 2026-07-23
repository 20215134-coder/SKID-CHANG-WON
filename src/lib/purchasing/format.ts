export function formatCurrency(amount: number | null): string {
  if (amount === null) return "-";
  return `${amount.toLocaleString("ko-KR")}원`;
}
