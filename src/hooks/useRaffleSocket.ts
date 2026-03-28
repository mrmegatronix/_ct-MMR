import { useEffect, useState, useCallback } from 'react';
import { RaffleState } from '../types';
import { db } from '../lib/firebase';
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from 'firebase/firestore';

const RAFFLE_DOC_ID = 'default';
const RAFFLE_COLLECTION = 'raffles';

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

export function useRaffleSocket() {
  const [state, setState] = useState<RaffleState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raffleDoc = doc(db, RAFFLE_COLLECTION, RAFFLE_DOC_ID);

    // Initial check/create
    const init = async () => {
      try {
        const snap = await getDoc(raffleDoc);
        if (!snap.exists()) {
          console.log("Document does not exist, creating initial state...");
          await setDoc(raffleDoc, initialState);
        }
      } catch (e: any) {
        console.error("Firebase init error:", e);
        setError(`Initialization Error: ${e.message}`);
      }
    };
    init();

    const unsubscribe = onSnapshot(raffleDoc, (snapshot) => {
      if (snapshot.exists()) {
        setState(snapshot.data() as RaffleState);
        setIsConnected(true);
        setError(null);
      } else {
        setIsConnected(false);
        setError("Raffle document does not exist in Firestore.");
      }
    }, (err) => {
      console.error("Firestore error:", err);
      setIsConnected(false);
      setError(`Firestore Connection Error: ${err.message}`);
    });

    return () => unsubscribe();
  }, []);

  const updateState = useCallback(async (newState: Partial<RaffleState>) => {
    const raffleDoc = doc(db, RAFFLE_COLLECTION, RAFFLE_DOC_ID);
    try {
      await updateDoc(raffleDoc, newState);
    } catch (e: any) {
      console.error("Update error:", e);
      setError(`Update failed: ${e.message}`);
    }
  }, []);

  const drawNumber = useCallback(async (isSecondChance: boolean = false) => {
    if (!state || state.status === 'drawing') return;

    const amount = state.drawSettings?.amountToDraw || 1;
    const drawnThisRound: number[] = [];
    const currentDrawn = [...(state.drawnNumbers || [])];
    const currentSC = [...(state.secondChanceNumbers || [])];
    const excluded = [...(state.excludedNumbers || [])];

    for (let j = 0; j < amount; j++) {
      const availableNumbers: number[] = [];
      const min = state.numberRange?.min ?? 1;
      const max = state.numberRange?.max ?? 1000;
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

    if (drawnThisRound.length === 0) return;

    const raffleDoc = doc(db, RAFFLE_COLLECTION, RAFFLE_DOC_ID);
    
    try {
      // Step 1: Set status to drawing
      await updateDoc(raffleDoc, {
        currentDraw: drawnThisRound[drawnThisRound.length - 1],
        status: 'drawing',
      });

      // Step 2: Wait for animation (4.5 seconds) and then update results
      setTimeout(async () => {
        try {
          await updateDoc(raffleDoc, {
            secondChanceNumbers: isSecondChance 
              ? [...currentSC, ...drawnThisRound] 
              : currentSC,
            drawnNumbers: !isSecondChance 
              ? [...currentDrawn, ...drawnThisRound] 
              : currentDrawn,
            status: 'idle',
            currentDraw: drawnThisRound[drawnThisRound.length - 1],
          });
        } catch (e: any) {
          console.error("Update results error:", e);
          setError(`Drawing update failed: ${e.message}`);
        }
      }, 4500);
    } catch (e: any) {
      console.error("Start drawing error:", e);
      setError(`Failed to start drawing: ${e.message}`);
    }
  }, [state]);

  const resetDraw = useCallback(async () => {
    const raffleDoc = doc(db, RAFFLE_COLLECTION, RAFFLE_DOC_ID);
    try {
      await updateDoc(raffleDoc, {
        drawnNumbers: [],
        secondChanceNumbers: [],
        currentDraw: null,
        status: 'idle',
      });
    } catch (e: any) {
      console.error("Reset error:", e);
      setError(`Reset failed: ${e.message}`);
    }
  }, []);

  const excludeNumber = useCallback(async (num: number) => {
    if (!state) return;
    if (!state.excludedNumbers.includes(num)) {
      const raffleDoc = doc(db, RAFFLE_COLLECTION, RAFFLE_DOC_ID);
      try {
        await updateDoc(raffleDoc, {
          excludedNumbers: [...state.excludedNumbers, num],
        });
      } catch (e: any) {
        console.error("Exclude error:", e);
        setError(`Failed to exclude number: ${e.message}`);
      }
    }
  }, [state]);

  const removeExcludedNumber = useCallback(async (num: number) => {
    if (!state) return;
    const raffleDoc = doc(db, RAFFLE_COLLECTION, RAFFLE_DOC_ID);
    try {
      await updateDoc(raffleDoc, {
        excludedNumbers: state.excludedNumbers.filter(n => n !== num),
      });
    } catch (e: any) {
      console.error("Remove exclude error:", e);
      setError(`Failed to remove excluded number: ${e.message}`);
    }
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

