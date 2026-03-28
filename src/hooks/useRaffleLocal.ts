import { useEffect, useState, useCallback, useRef } from 'react';
import { RaffleState } from '../types';

const STORAGE_KEY = 'mmr_raffle_state';
const CHANNEL_NAME = 'mmr_sync';

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
  titleSize: 100,
  subtitleSize: 100,
};

export function useRaffleSocket() {
  const [state, setState] = useState<RaffleState | null>(null);
  const [isConnected, setIsConnected] = useState(true); // Always true for local
  const [error, setError] = useState<string | null>(null);
  
  const bc = useRef<BroadcastChannel | null>(null);

  // Load initial state
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setState(JSON.parse(saved));
      } catch (e) {
        setState(initialState);
      }
    } else {
      setState(initialState);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
    }

    // Set up BroadcastChannel
    bc.current = new BroadcastChannel(CHANNEL_NAME);
    bc.current.onmessage = (event) => {
      console.log("Sync Message Received:", event.data);
      if (event.data && typeof event.data === 'object') {
        setState(event.data);
      }
    };

    // Listen for storage changes (backup sync)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setState(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      bc.current?.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const updateState = useCallback(async (newState: Partial<RaffleState>) => {
    setState(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...newState };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      bc.current?.postMessage(updated);
      return updated;
    });
  }, []);

  const drawNumber = useCallback(async (isSecondChance: boolean = false) => {
    setState(prev => {
        if (!prev || prev.status === 'drawing') return prev;

        const amount = prev.drawSettings?.amountToDraw || 1;
        const drawnThisRound: number[] = [];
        const currentDrawn = [...(prev.drawnNumbers || [])];
        const currentSC = [...(prev.secondChanceNumbers || [])];
        const excluded = [...(prev.excludedNumbers || [])];

        for (let j = 0; j < amount; j++) {
            const availableNumbers: number[] = [];
            const min = prev.numberRange?.min ?? 1;
            const max = prev.numberRange?.max ?? 1000;
            for (let i = min; i <= max; i++) {
                if (!excluded.includes(i) && 
                    !currentDrawn.includes(i) && 
                    !currentSC.includes(i) && 
                    !drawnThisRound.includes(i)) {
                    availableNumbers.push(i);
                }
            }
            if (availableNumbers.length === 0) break;
            const randomIndex = Math.floor(Math.random() * availableNumbers.length);
            drawnThisRound.push(availableNumbers[randomIndex]);
        }

        if (drawnThisRound.length === 0) return prev;

        const drawingState = {
            ...prev,
            currentDraw: drawnThisRound[drawnThisRound.length - 1],
            status: 'drawing' as const,
        };
        
        // Persist and Sync Drawing State
        localStorage.setItem(STORAGE_KEY, JSON.stringify(drawingState));
        bc.current?.postMessage(drawingState);

        // Animation Timer
        setTimeout(() => {
            setState(afterAnim => {
                if (!afterAnim) return null;
                const finalState = {
                    ...afterAnim,
                    secondChanceNumbers: isSecondChance 
                      ? [...(afterAnim.secondChanceNumbers || []), ...drawnThisRound] 
                      : (afterAnim.secondChanceNumbers || []),
                    drawnNumbers: !isSecondChance 
                      ? [...(afterAnim.drawnNumbers || []), ...drawnThisRound] 
                      : (afterAnim.drawnNumbers || []),
                    status: 'idle' as const,
                    currentDraw: drawnThisRound[drawnThisRound.length - 1],
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(finalState));
                bc.current?.postMessage(finalState);
                return finalState;
            });
        }, 4500);

        return drawingState;
    });
  }, []);

  const resetDraw = useCallback(async () => {
    const fresh = {
      ...state,
      drawnNumbers: [],
      secondChanceNumbers: [],
      currentDraw: null,
      status: 'idle' as const,
    } as RaffleState;
    setState(fresh);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    bc.current?.postMessage(fresh);
  }, [state]);

  const excludeNumber = useCallback(async (num: number) => {
    if (!state) return;
    if (!state.excludedNumbers.includes(num)) {
      const updated = {
        ...state,
        excludedNumbers: [...state.excludedNumbers, num],
      };
      setState(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      bc.current?.postMessage(updated);
    }
  }, [state]);

  const removeExcludedNumber = useCallback(async (num: number) => {
    if (!state) return;
    const updated = {
      ...state,
      excludedNumbers: state.excludedNumbers.filter(n => n !== num),
    };
    setState(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    bc.current?.postMessage(updated);
  }, [state]);

  return {
    state,
    isConnected,
    error,
    updateState,
    drawNumber,
    resetDraw,
    excludeNumber,
    removeExcludedNumber,
  };
}
