export const formatCurrency = (n: number): string => `₩${n.toLocaleString()}`;

export const formatCompactWon = (n: number): string =>
  n >= 100_000_000 ? `₩${(n / 100_000_000).toFixed(1)}억`
  : n >= 10_000 ? `₩${Math.round(n / 10_000).toLocaleString()}만`
  : `₩${n.toLocaleString()}`;

export const formatDate = (s: string): string => s.slice(0, 10).replace(/-/g, '.');
