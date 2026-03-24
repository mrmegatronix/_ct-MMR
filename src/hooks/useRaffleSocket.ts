import { useEffect, useState, useCallback } from 'react';
import { RaffleState } from '../types';

const initialState: RaffleState = {
  status: 'idle',
  numberRange: { min: 1, max: 1000 },
  excludedNumbers: [],
  drawnNumbers: [],
  secondChanceNumbers: [],
  currentDraw: null,
  drawSettings: { amountToDraw: 1 },
  prizePool: '$950',
  numberOfPrizes: '50',
  prizeSizes: '$15, $25 & $50',
  slide1Title: 'Monster Meat Raffle',
  slide1Subtitle: 'Tickets on sale NOW!',
  slide2Title: "Tonight's Prizes",
  slide2Subtitle: 'Massive Meat Trays to be won!',
  slide3Title: 'Ticket Prices',
  slide3Subtitle: 'Get yours before the draw!',
  ticketPriceSingle: '$5',
  ticketPricePack: '$20',
  ticketPackQuantity: '4',
};

// Global state
let globalState = initialState;

// Load from localStorage if available
try {
  const stored = localStorage.getItem('raffleState');
  if (stored) {
    globalState = { ...initialState, ...JSON.parse(stored) };
  }
} catch (e) {
  console.error('Failed to load state', e);
}

// Subscriptions
const listeners = new Set<(state: RaffleState) => void>();

function setGlobalState(newState: Partial<RaffleState> | ((prev: RaffleState) => RaffleState)) {
  const nextState = typeof newState === 'function' ? newState(globalState) : { ...globalState, ...newState };
  globalState = nextState;
  
  try {
    localStorage.setItem('raffleState', JSON.stringify(globalState));
  } catch (e) {
    console.error('Failed to save state', e);
  }

  listeners.forEach((listener) => listener(globalState));
}

// Keep track of the timeout so we can optionally clear it if needed
let animationTimeout: any = null;

export function useRaffleSocket() {
  const [state, setState] = useState<RaffleState>(globalState);

  useEffect(() => {
    // Sync React state with globalState and ensure it's valid
    if (globalState) {
      setState(globalState);
    } else {
      setState(initialState);
    }
    
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  const updateState = useCallback((newState: Partial<RaffleState>) => {
    setGlobalState(newState);
  }, []);

  const drawNumber = useCallback((isSecondChance: boolean = false) => {
    if (globalState.status === 'drawing') return; // Prevent concurrent draws
    
    const amount = globalState.drawSettings.amountToDraw || 1;
    const drawnThisRound: number[] = [];

    for (let j = 0; j < amount; j++) {
      const availableNumbers: number[] = [];
      for (let i = globalState.numberRange.min; i <= globalState.numberRange.max; i++) {
        if (!globalState.excludedNumbers.includes(i) && 
            !globalState.drawnNumbers.includes(i) && 
            !globalState.secondChanceNumbers.includes(i) && 
            !drawnThisRound.includes(i)) {
          availableNumbers.push(i);
        }
      }

      if (availableNumbers.length === 0) {
        if (j === 0) console.error("No more numbers available to draw.");
        break;
      }

      const randomIndex = Math.floor(Math.random() * availableNumbers.length);
      drawnThisRound.push(availableNumbers[randomIndex]);
    }

    if (drawnThisRound.length === 0) return;

    if (animationTimeout) {
      clearTimeout(animationTimeout);
    }

    setGlobalState({
      currentDraw: drawnThisRound[drawnThisRound.length - 1],
      status: 'drawing',
    });

    animationTimeout = setTimeout(() => {
      setGlobalState((prev) => ({
        ...prev,
        secondChanceNumbers: isSecondChance 
          ? [...prev.secondChanceNumbers, ...drawnThisRound] 
          : prev.secondChanceNumbers,
        drawnNumbers: !isSecondChance 
          ? [...prev.drawnNumbers, ...drawnThisRound] 
          : prev.drawnNumbers,
        status: 'idle',
      }));
    }, 3000);
  }, []);

  const resetDraw = useCallback(() => {
    if (animationTimeout) clearTimeout(animationTimeout);
    setGlobalState({
      drawnNumbers: [],
      secondChanceNumbers: [],
      currentDraw: null,
      status: 'idle',
    });
  }, []);

  const excludeNumber = useCallback((num: number) => {
    if (!globalState.excludedNumbers.includes(num)) {
      setGlobalState({
        excludedNumbers: [...globalState.excludedNumbers, num],
      });
    }
  }, []);

  const removeExcludedNumber = useCallback((num: number) => {
    setGlobalState({
      excludedNumbers: globalState.excludedNumbers.filter(n => n !== num),
    });
  }, []);

  return {
    state,
    isConnected: true, // Always true for local state
    updateState,
    drawNumber,
    resetDraw,
    excludeNumber,
    removeExcludedNumber,
  };
}
