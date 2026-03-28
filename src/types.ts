export interface RaffleState {
  status: 'idle' | 'buildup' | 'drawing' | 'results' | 'thankyou';
  numberRange: {
    min: number;
    max: number;
  };
  excludedNumbers: number[];
  drawnNumbers: number[];
  secondChanceNumbers: number[];
  currentDraw: number | null;
  drawSettings: {
    amountToDraw: number;
  };
  prizePool: string;
  numberOfPrizes: string;
  prizeSizes: string;
  slide1Title: string;
  slide1Subtitle: string;
  slide2Title: string;
  slide2Subtitle: string;
  slide3Title: string;
  slide3Subtitle: string;
  ticketPriceSingle: string;
  ticketPricePack: string;
  ticketPackQuantity: string;
  titleSize?: number;
  subtitleSize?: number;
}
