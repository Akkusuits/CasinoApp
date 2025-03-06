// Slot machine symbols and payouts
export const SLOT_SYMBOLS = ['🍒', '🍊', '🍋', '🍇', '💎', '7️⃣'] as const;
export const SLOT_PAYOUTS = {
  '🍒': 2,
  '🍊': 3,
  '🍋': 4,
  '🍇': 5,
  '💎': 10,
  '7️⃣': 20,
} as const;

export function generateSlotOutcome(): string[][] {
  const grid: string[][] = [];
  for (let i = 0; i < 3; i++) {
    grid[i] = [];
    for (let j = 0; j < 3; j++) {
      const randomIndex = Math.floor(Math.random() * SLOT_SYMBOLS.length);
      grid[i][j] = SLOT_SYMBOLS[randomIndex];
    }
  }
  return grid;
}

export function calculateSlotPayout(grid: string[][], bet: number): number {
  let multiplier = 0;

  // Check rows
  for (let i = 0; i < 3; i++) {
    if (grid[i][0] === grid[i][1] && grid[i][1] === grid[i][2]) {
      multiplier += SLOT_PAYOUTS[grid[i][0] as keyof typeof SLOT_PAYOUTS];
    }
  }

  // Check diagonals
  if (grid[0][0] === grid[1][1] && grid[1][1] === grid[2][2]) {
    multiplier += SLOT_PAYOUTS[grid[0][0] as keyof typeof SLOT_PAYOUTS];
  }
  if (grid[0][2] === grid[1][1] && grid[1][1] === grid[2][0]) {
    multiplier += SLOT_PAYOUTS[grid[0][2] as keyof typeof SLOT_PAYOUTS];
  }

  return bet * multiplier;
}

// Dice game logic
export function rollDice(): number {
  return Math.floor(Math.random() * 100) + 1;
}

export function calculateDiceWin(roll: number, prediction: 'over' | 'under', target: number): boolean {
  if (prediction === 'over') {
    return roll > target;
  }
  return roll < target;
}

// Crash game logic
export function generateCrashPoint(): number {
  const e = Math.E;
  const r = Math.random();
  return Math.floor((100 * e) / (r + 0.1) - 100) / 100;
}
