import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { RaffleState } from '../types';

let socket: Socket | null = null;

export function useRaffleSocket() {
  const [state, setState] = useState<RaffleState | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket) {
      socket = io();
    }

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('stateUpdate', (newState: RaffleState) => {
      setState(newState);
    });

    return () => {
      socket?.off('connect');
      socket?.off('disconnect');
      socket?.off('stateUpdate');
    };
  }, []);

  const updateState = (newState: Partial<RaffleState>) => {
    socket?.emit('updateState', newState);
  };

  const drawNumber = (isSecondChance: boolean = false) => {
    socket?.emit('drawNumber', isSecondChance);
  };

  const resetDraw = () => {
    socket?.emit('resetDraw');
  };

  const excludeNumber = (num: number) => {
    socket?.emit('excludeNumber', num);
  };

  const removeExcludedNumber = (num: number) => {
    socket?.emit('removeExcludedNumber', num);
  };

  return {
    state,
    isConnected,
    updateState,
    drawNumber,
    resetDraw,
    excludeNumber,
    removeExcludedNumber,
  };
}
