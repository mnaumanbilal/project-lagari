export function formatPkr(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-PK")}`;
}
