// ======================================
// server.mjs - Real-time Pick/Ban Server (ESM)
// ======================================
import express from "express";
import WebSocket, { WebSocketServer } from "ws";
import http from "http";
import { LowSync, JSONFileSync } from "lowdb";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

// In-memory storage for active rooms (mirrors DB for fast access)
const rooms = new Map();
const playerConnections = new Map(); // playerSide+roomCode -> ws connection
const readyToStart = new Map(); // roomCode -> Set of sides ready to start initial game
const readyToRestart = new Map(); // roomCode -> Set of sides ready to restart game

// Lightweight JSON DB using lowdb (no native bindings)
const adapter = new JSONFileSync("./rooms.json");
const db = new LowSync(adapter);
db.read();
if (!db.data) db.data = { rooms: [] };

const roomClients = new Map(); // roomCode -> Set(ws)

// How long to keep an empty room in memory before deleting (ms)
const ROOM_EMPTY_TTL = 5 * 60 * 1000; // 5 minutes

function createRoomInDb(code, ownerSide, state = {}) {
  db.read();
  if (!db.data) db.data = { rooms: [] };
  const existing = db.data.rooms.find((r) => r.code === code);
  const now = Date.now();
  if (!existing) {
    db.data.rooms.push({ code, ownerSide, state: state || {}, createdAt: now });
  } else {
    existing.ownerSide = ownerSide;
    existing.state = state || existing.state;
  }
  db.write();
}


function updateRoomStateInDb(code, state = {}) {
  db.read();
  if (!db.data) db.data = { rooms: [] };
  const row = db.data.rooms.find((r) => r.code === code);
  if (!row) return;
  row.state = state || {};
  db.write();
}

function deleteRoomFromDb(code) {
  db.read();
  if (!db.data) db.data = { rooms: [] };
  db.data.rooms = db.data.rooms.filter((r) => r.code !== code);
  db.write();
}

function listRoomsFromDb() {
  db.read();
  if (!db.data) db.data = { rooms: [] };
  return (db.data.rooms || [])
    .slice()
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

// Room state interface
class Room {
  constructor(roomCode) {
    this.roomCode = roomCode;
    this.currentPhase = 0;
    this.actionCount = 0;
    this.leftBans = [];
    this.rightBans = [];
    this.leftPicks = [];
    this.rightPicks = [];
    this.leftName = undefined;
    this.rightName = undefined;
    this.savedRounds = [];
    this.swapSides = false;
    this.leftPlayer = null;
    this.rightPlayer = null;
    this.spectators = new Set();
    this.createdAt = Date.now();
  }

  getState() {
    return {
      currentPhase: this.currentPhase,
      actionCount: this.actionCount,
      leftBans: this.leftBans,
      rightBans: this.rightBans,
      leftPicks: this.leftPicks,
      rightPicks: this.rightPicks,
      leftName: this.leftName,
      rightName: this.rightName,
      savedRounds: this.savedRounds,
      swapSides: this.swapSides,
    };
  }

  updateState(newState) {
    if (newState.currentPhase !== undefined)
      this.currentPhase = newState.currentPhase;
    if (newState.actionCount !== undefined)
      this.actionCount = newState.actionCount;
    if (newState.leftBans !== undefined) this.leftBans = newState.leftBans;
    if (newState.rightBans !== undefined) this.rightBans = newState.rightBans;
    if (newState.leftPicks !== undefined) this.leftPicks = newState.leftPicks;
    if (newState.rightPicks !== undefined)
      this.rightPicks = newState.rightPicks;
    if (Object.prototype.hasOwnProperty.call(newState, 'leftName'))
      this.leftName = newState.leftName;
    if (Object.prototype.hasOwnProperty.call(newState, 'rightName'))
      this.rightName = newState.rightName;
    if (Object.prototype.hasOwnProperty.call(newState, 'savedRounds'))
      this.savedRounds = Array.isArray(newState.savedRounds) ? newState.savedRounds : this.savedRounds;
    if (Object.prototype.hasOwnProperty.call(newState, 'swapSides'))
      this.swapSides = !!newState.swapSides;
  }
}

// Helper function to broadcast to all room participants
function broadcastToRoom(roomCode, message, excludeWs = null) {
  const room = rooms.get(roomCode);
  if (!room) return;

  const participants = [
    room.leftPlayer,
    room.rightPlayer,
    ...room.spectators,
  ].filter(Boolean);

  participants.forEach((ws) => {
    if (ws && ws.readyState === WebSocket.OPEN && ws !== excludeWs) {
      ws.send(JSON.stringify(message));
    }
  });
}

// Helper function to clean up disconnected players
function cleanupConnection(ws) {
  for (const [key, connection] of playerConnections.entries()) {
    if (connection === ws) {
      playerConnections.delete(key);
      const [side, roomCode] = key.split(":");
      const room = rooms.get(roomCode);

      if (room) {
        if (side === "left") {
          room.leftPlayer = null;
          // if the disconnected player was the owner, delete room from DB and notify
          if (ws._isOwner) {
            deleteRoomFromDb(roomCode);
            // notify remaining participants
            const participants = [
              room.leftPlayer,
              room.rightPlayer,
              ...room.spectators,
            ].filter(Boolean);
            participants.forEach((p) => {
              try {
                p.send(JSON.stringify({ type: "room-closed", roomCode }));
              } catch {}
              try {
                p.close();
              } catch {}
            });
            rooms.delete(roomCode);
            break;
          }
        } else if (side === "right") {
          room.rightPlayer = null;
        } else if (side.startsWith("spectator")) {
          room.spectators.delete(ws);
        }

        // Notify others that player left
        broadcastToRoom(roomCode, {
          type: "player-left",
          side: side,
          roomState: room.getState(),
        });

        // Clean up empty rooms after 5 minutes
        if (
          !room.leftPlayer &&
          !room.rightPlayer &&
          room.spectators.size === 0
        ) {
          setTimeout(() => {
            if (
              !room.leftPlayer &&
              !room.rightPlayer &&
              room.spectators.size === 0
            ) {
              // remove from memory and DB after TTL if still empty
              try {
                deleteRoomFromDb(roomCode);
              } catch {
                // ignore DB deletion errors
              }
              rooms.delete(roomCode);
              console.log(`Deleted empty room ${roomCode} after ${ROOM_EMPTY_TTL}ms`);
            }
          }, ROOM_EMPTY_TTL);
        }
      }
      break;
    }
  }
}

// WebSocket connection handler
wss.on("connection", (ws) => {
  console.log("New WebSocket connection");

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log("Received message:", message.type);

      switch (message.type) {
        case "init-room":
          handleInitRoom(ws, message);
          break;
        case "join-room":
          handleJoinRoom(ws, message);
          break;
        case "spectate-room":
          handleSpectateRoom(ws, message);
          break;
        case "update-state":
          handleUpdateState(ws, message);
          break;
        case "get-room-state":
          handleGetRoomState(ws, message);
          break;
        case "check-room-capacity":
          handleCheckCapacity(ws, message);
          break;
        case "ready-to-start":
          handleReadyToStart(ws, message);
          break;
        case "ready-to-restart":
          handleReadyToRestart(ws, message);
          break;
        default:
          console.log("Unknown message type:", message.type);
      }
    } catch (err) {
      console.error("Error processing message:", err);
    }
  });

  ws.on("close", () => {
    console.log("Connection closed");
    cleanupConnection(ws);
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
    cleanupConnection(ws);
  });
});

// Handlers
function handleInitRoom(ws, message) {
  const { roomCode } = message;

  if (rooms.has(roomCode)) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Room already exists",
      })
    );
    return;
  }

  const room = new Room(roomCode);
  room.leftPlayer = ws;
  rooms.set(roomCode, room);
  playerConnections.set(`left:${roomCode}`, ws);
  // mark this connection as owner and persist to DB
  ws._isOwner = true;
  createRoomInDb(roomCode, "left", room.getState());
  // track clients set for broadcasting
  roomClients.set(roomCode, new Set([ws]));

  ws.send(
    JSON.stringify({
      type: "room-initialized",
      roomCode,
      side: "left",
      roomState: room.getState(),
    })
  );

  console.log(`Room ${roomCode} created`);
}

function handleJoinRoom(ws, message) {
  const { roomCode, side } = message;

  const room = rooms.get(roomCode);
  if (!room) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Room not found",
      })
    );
    return;
  }

  if (side === "left" && room.leftPlayer) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Left player slot already taken",
      })
    );
    return;
  }

  if (side === "right" && room.rightPlayer) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Right player slot already taken",
      })
    );
    return;
  }

  if (side === "left") {
    room.leftPlayer = ws;
  } else if (side === "right") {
    room.rightPlayer = ws;
  }

  playerConnections.set(`${side}:${roomCode}`, ws);

  // add to broadcasting set
  let clients = roomClients.get(roomCode);
  if (!clients) {
    clients = new Set();
    roomClients.set(roomCode, clients);
  }
  clients.add(ws);

  ws.send(
    JSON.stringify({
      type: "room-joined",
      roomCode,
      side,
      roomState: room.getState(),
    })
  );

  // Notify other players
  broadcastToRoom(
    roomCode,
    {
      type: "player-joined",
      side,
      roomState: room.getState(),
    },
    ws
  );

  console.log(`Player (${side}) joined room ${roomCode}`);
}

function handleSpectateRoom(ws, message) {
  const { roomCode } = message;

  const room = rooms.get(roomCode);
  if (!room) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Room not found",
      })
    );
    return;
  }

  room.spectators.add(ws);
  playerConnections.set(`spectator-${Date.now()}:${roomCode}`, ws);

  let clients = roomClients.get(roomCode);
  if (!clients) {
    clients = new Set();
    roomClients.set(roomCode, clients);
  }
  clients.add(ws);

  ws.send(
    JSON.stringify({
      type: "room-spectated",
      roomCode,
      side: "spectator",
      roomState: room.getState(),
    })
  );

  console.log(`Spectator joined room ${roomCode}`);
}

function handleUpdateState(ws, message) {
  const { roomCode, state } = message;

  const room = rooms.get(roomCode);
  if (!room) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Room not found",
      })
    );
    return;
  }

  room.updateState(state);

  // persist state to DB so other clients (and API) can read latest
  try {
    updateRoomStateInDb(roomCode, room.getState());
  } catch (e) {
    console.error("Failed to persist room state to DB", e);
  }

  broadcastToRoom(roomCode, {
    type: "state-updated",
    roomState: room.getState(),
  });

  console.log(`Room ${roomCode} state updated`);
}

function handleGetRoomState(ws, message) {
  const { roomCode } = message;

  const room = rooms.get(roomCode);
  if (!room) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Room not found",
      })
    );
    return;
  }

  ws.send(
    JSON.stringify({
      type: "room-state",
      roomState: room.getState(),
    })
  );
}

function handleCheckCapacity(ws, message) {
  const { roomCode } = message;

  const room = rooms.get(roomCode);
  if (!room) {
    ws.send(
      JSON.stringify({
        type: "capacity-check",
        hasLeft: false,
        hasRight: false,
        exists: false,
      })
    );
    return;
  }

  ws.send(
    JSON.stringify({
      type: "capacity-check",
      hasLeft: !!room.leftPlayer,
      hasRight: !!room.rightPlayer,
      exists: true,
    })
  );
}

function handleReadyToStart(ws, message) {
  const { roomCode, side } = message;

  const room = rooms.get(roomCode);
  if (!room) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Room not found",
      })
    );
    return;
  }

  // Initialize ready set for this room if not exists
  if (!readyToStart.has(roomCode)) {
    readyToStart.set(roomCode, new Set());
  }

  const readySet = readyToStart.get(roomCode);
  readySet.add(side);

  // Notify all about who's ready
  broadcastToRoom(roomCode, {
    type: "ready-to-start-status",
    readyLeft: readySet.has('left'),
    readyRight: readySet.has('right'),
    roomState: room.getState(),
  });

  console.log(`Player ${side} ready to start in room ${roomCode}`);

  // Both ready, clear the set (will start via client countdown)
  if (readySet.has('left') && readySet.has('right')) {
    readyToStart.delete(roomCode);
  }
}

function handleReadyToRestart(ws, message) {
  const { roomCode, side } = message;

  const room = rooms.get(roomCode);
  if (!room) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Room not found",
      })
    );
    return;
  }

  // Track ready-to-restart per room
  if (!readyToRestart.has(roomCode)) {
    readyToRestart.set(roomCode, new Set());
  }

  const readySet = readyToRestart.get(roomCode);
  readySet.add(side);

  // Log and immediately acknowledge to the sender to avoid perceived lag
  console.log(`Restart ready received from ${side} in room ${roomCode}. Ready set: left=${readySet.has('left')}, right=${readySet.has('right')}`);

  // Send immediate ack to the sender
  try {
    ws.send(JSON.stringify({
      type: "restart-ready-status",
      readyLeft: readySet.has('left'),
      readyRight: readySet.has('right'),
      roomState: room.getState(),
    }));
  } catch {
    // ignore send errors to sender
  }

  // Broadcast current readiness to all participants (including sender)
  broadcastToRoom(roomCode, {
    type: "restart-ready-status",
    readyLeft: readySet.has('left'),
    readyRight: readySet.has('right'),
    roomState: room.getState(),
  });

  // When both ready, reset the game state and notify
  if (readySet.has('left') && readySet.has('right')) {
    readyToRestart.delete(roomCode);

    // Toggle swapSides so clients flip positions/colors/order
    const newSwap = !room.swapSides;

    // Reset room state (keep names and saved rounds) and set swap flag
    room.updateState({
      currentPhase: 0,
      actionCount: 0,
      leftBans: [],
      rightBans: [],
      leftPicks: [],
      rightPicks: [],
      swapSides: newSwap,
    });

    // Broadcast updated state and a restart-approved event for clients to start countdown
    broadcastToRoom(roomCode, { type: "state-updated", roomState: room.getState() });
    broadcastToRoom(roomCode, { type: "restart-approved", roomState: room.getState() });
  }
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Server info endpoint
app.get("/api/rooms", (req, res) => {
  try {
    const rows = listRoomsFromDb();
    const roomList = rows.map((r) => ({
      code: r.code,
      ownerSide: r.ownerSide,
      createdAt: r.createdAt,
      players: {
        // best-effort from memory state
        hasLeft: rooms.has(r.code) ? !!rooms.get(r.code).leftPlayer : false,
        hasRight: rooms.has(r.code) ? !!rooms.get(r.code).rightPlayer : false,
      },
      spectators: rooms.has(r.code) ? rooms.get(r.code).spectators.size : 0,
    }));
    res.json({ rooms: roomList });
  } catch (err) {
    console.error("Failed to list rooms from DB", err);
    res.status(500).json({ error: "failed to list rooms" });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 Pick/Ban Server running on ws://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Active rooms: http://localhost:${PORT}/api/rooms\n`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
