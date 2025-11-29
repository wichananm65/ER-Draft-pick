/**
 * lib/storage.ts
 * Server-side storage API for game state management
 */

import { LowSync, JSONFileSync } from 'lowdb';
import type { GameState } from '../types';

// Database schema
interface RoomRecord {
  code: string;
  ownerSide: string;
  state: GameState;
  createdAt: number;
}

interface DatabaseData {
  rooms: RoomRecord[];
}

// Initialize database with proper typing
const adapter = new JSONFileSync<DatabaseData>('./rooms.json');
const db = new LowSync<DatabaseData>(adapter);
db.read();
if (!db.data) db.data = { rooms: [] };

// In-memory storage for active rooms
const activeRooms = new Map<string, GameState>();

export const initializeRoom = async (roomCode: string): Promise<void> => {
  // Create room in memory
  const initialState: GameState = {
    currentPhase: 0,
    actionCount: 0,
    leftBans: [],
    rightBans: [],
    leftPicks: [],
    rightPicks: [],
    leftName: undefined,
    rightName: undefined,
    savedRounds: [],
    swapSides: false,
  };

  activeRooms.set(roomCode, initialState);

  // Persist to database
  db.read();
  if (!db.data) db.data = { rooms: [] };
  const existing = db.data.rooms.find((r) => r.code === roomCode);
  if (!existing) {
    db.data.rooms.push({
      code: roomCode,
      ownerSide: 'left',
      state: initialState,
      createdAt: Date.now()
    });
  } else {
    existing.state = initialState;
  }
  db.write();

  console.log(`Room ${roomCode} initialized`);
};

export const loadGameState = async (roomCode: string): Promise<GameState | null> => {
  // First check in-memory storage
  const memoryState = activeRooms.get(roomCode);
  if (memoryState) {
    return memoryState;
  }

  // Fallback to database
  db.read();
  if (!db.data) db.data = { rooms: [] };
  const room = db.data.rooms.find((r) => r.code === roomCode);
  if (room && room.state) {
    // Load into memory for faster access
    activeRooms.set(roomCode, room.state);
    return room.state;
  }

  return null;
};

export const saveGameState = async (roomCode: string, state: GameState): Promise<void> => {
  // Update in-memory storage
  activeRooms.set(roomCode, state);

  // Persist to database
  db.read();
  if (!db.data) db.data = { rooms: [] };
  const room = db.data.rooms.find((r) => r.code === roomCode);
  if (room) {
    room.state = state;
    db.write();
  }

  console.log(`Game state saved for room ${roomCode}`);
};

export const checkRoomCapacity = async (roomCode: string): Promise<{ hasLeft: boolean; hasRight: boolean; exists: boolean }> => {
  const state = await loadGameState(roomCode);
  if (!state) {
    return { hasLeft: false, hasRight: false, exists: false };
  }

  // For now, we don't track player connections in the state
  // This would need to be enhanced to track actual WebSocket connections
  return {
    hasLeft: false, // TODO: Track actual player connections
    hasRight: false,
    exists: true
  };
};

export const deleteRoom = async (roomCode: string): Promise<void> => {
  // Remove from memory
  activeRooms.delete(roomCode);

  // Remove from database
  db.read();
  if (!db.data) db.data = { rooms: [] };
  db.data.rooms = db.data.rooms.filter((r) => r.code !== roomCode);
  db.write();

  console.log(`Room ${roomCode} deleted`);
};

export const listRooms = async (): Promise<RoomRecord[]> => {
  db.read();
  if (!db.data) db.data = { rooms: [] };
  return (db.data.rooms || [])
    .slice()
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
};
