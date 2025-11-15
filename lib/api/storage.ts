/**
 * lib/api/storage.ts
 * WebSocket-based storage API for game state management
 */

import { wsClient } from './websocket';
import type { WSMessage } from './websocket';
import type { GameState } from '@/app/types';

const waitForMessage = (type: string, timeout = 5000): Promise<WSMessage> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      unsubscribe();
      reject(new Error(`Timeout waiting for ${type}`));
    }, timeout);

    const unsubscribe = wsClient.on(type as unknown as 'init-room', (message) => {
      clearTimeout(timer);
      unsubscribe();
      resolve(message);
    });
  });
};

export const initializeRoom = async (roomCode: string): Promise<void> => {
  try {
    if (!wsClient.isConnected()) {
      await wsClient.connect();
    }

    const wait = waitForMessage('room-initialized');
    wsClient.send({ type: 'init-room', roomCode });
    await wait;
    console.log(`Room ${roomCode} initialized`);
  } catch (err) {
    console.error('Failed to initialize room:', err);
    throw err;
  }
};

export const loadGameState = async (roomCode: string): Promise<GameState | null> => {
  try {
    if (!wsClient.isConnected()) {
      await wsClient.connect();
    }

    const wait = waitForMessage('room-state');
    wsClient.send({ type: 'get-room-state', roomCode });
    const response = await wait;
    const roomState = response.roomState as unknown as GameState;
    return roomState;
  } catch (err) {
    console.log('Failed to load game state:', err);
    return null;
  }
};

export const saveGameState = async (roomCode: string, state: GameState): Promise<void> => {
  try {
    if (!wsClient.isConnected()) {
      await wsClient.connect();
    }

    wsClient.send({
      type: 'update-state',
      roomCode,
      state: state as unknown as Record<string, unknown>,
    });

    console.log(`Game state saved for room ${roomCode}`);
  } catch (err) {
    console.error('Failed to save game state:', err);
    throw err;
  }
};

export const checkRoomCapacity = async (roomCode: string): Promise<{ hasLeft: boolean; hasRight: boolean }> => {
  try {
    if (!wsClient.isConnected()) {
      await wsClient.connect();
    }

    const wait = waitForMessage('capacity-check');
    wsClient.send({ type: 'check-room-capacity', roomCode });
    const response = await wait;
    return {
      hasLeft: response.hasLeft as boolean,
      hasRight: response.hasRight as boolean,
    };
  } catch (err) {
    console.error('Failed to check room capacity:', err);
    return { hasLeft: false, hasRight: false };
  }
};

export const registerPlayer = async (roomCode: string, side: 'left' | 'right'): Promise<boolean> => {
  try {
    if (!wsClient.isConnected()) {
      await wsClient.connect();
    }

    const wait = waitForMessage('room-joined', 5000);
    wsClient.send({ type: 'join-room', roomCode, side });
    const response = await wait;
    return response.type === 'room-joined';
  } catch (err) {
    console.error('Failed to register player:', err);
    return false;
  }
};

export const registerSpectator = async (roomCode: string): Promise<boolean> => {
  try {
    if (!wsClient.isConnected()) {
      await wsClient.connect();
    }

    const promise = new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        unsubscribe();
        reject(new Error('Timeout waiting for room-spectated'));
      }, 5000);

      const unsubscribe = wsClient.on('room-spectated', (message) => {
        clearTimeout(timer);
        unsubscribe();
        resolve(message);
      });
    });

    wsClient.send({ type: 'spectate-room', roomCode });

    await promise;
    return true;
  } catch (err) {
    console.error('Failed to register spectator:', err);
    return false;
  }
};
