/**
 * Time-based greeting helper
 */
export function getGreeting(hour: number, name: string): string {
  if (hour < 12) return `Morning, ${name}! Who's pairing today?`;
  if (hour < 18) return `Good afternoon, ${name}. Ready to rotate?`;
  return `Good evening, ${name}. Late session?`;
}

/**
 * Board accent colors derived from ID
 */
export const BOARD_ACCENT_COLORS = [
  '#10b981', // tropical green
  '#f59e0b', // sunset amber
  '#f43f5e', // rose
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#d946ef', // fuchsia
  '#84cc16', // lime / cockatoo green
];

export function getBoardAccentColor(boardId: string): string {
  const hash = boardId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return BOARD_ACCENT_COLORS[hash % BOARD_ACCENT_COLORS.length];
}
