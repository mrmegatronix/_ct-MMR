export interface RaffleState {
  status: 'idle' | 'buildup' | 'drawing' | 'finished';
  numberRange: { min: number; max: number };
  excludedNumbers: number[];
  drawnNumbers: number[];
  secondChanceNumbers: number[];
  currentDraw: number | null;
  drawSettings: { amountToDraw: number };
}
