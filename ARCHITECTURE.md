# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     RENDER.COM DEPLOYMENT                    │
└─────────────────────────────────────────────────────────────┘

┌────────────────────────────┐      ┌────────────────────────────┐
│   FRONTEND SERVICE         │      │   BACKEND SERVICE          │
│   (Next.js 16)             │      │   (Node.js + Express)      │
├────────────────────────────┤      ├────────────────────────────┤
│                            │      │                            │
│  ┌──────────────────────┐  │      │  ┌──────────────────────┐  │
│  │   React Components   │  │      │  │   WebSocket Server   │  │
│  │   - GameRoom         │  │      │  │   - ws://host/ws     │  │
│  │   - Menu             │  │      │  │   - Real-time sync   │  │
│  │   - Hero Grid        │  │      │  └──────────────────────┘  │
│  └──────────────────────┘  │      │                            │
│                            │      │  ┌──────────────────────┐  │
│  ┌──────────────────────┐  │      │  │   REST API           │  │
│  │   WebSocket Client   │◄─┼──────┼─►│   - /health          │  │
│  │   - Auto reconnect   │  │      │  │   - /api/rooms       │  │
│  │   - State sync       │  │      │  └──────────────────────┘  │
│  └──────────────────────┘  │      │                            │
│                            │      │  ┌──────────────────────┐  │
│  ┌──────────────────────┐  │      │  │   Game Logic         │  │
│  │   Custom Hooks       │  │      │  │   - Room Manager     │  │
│  │   - useGameState     │  │      │  │   - Player Manager   │  │
│  │   - useHeroActions   │  │      │  │   - State Manager    │  │
│  └──────────────────────┘  │      │  └──────────────────────┘  │
│                            │      │                            │
│  Port: 10000               │      │  ┌──────────────────────┐  │
│  URL: your-frontend.com    │      │  │   Database (LowDB)   │  │
│                            │      │  │   - rooms.json       │  │
└────────────────────────────┘      │  │   - Ephemeral storage│  │
                                    │  └──────────────────────┘  │
                                    │                            │
                                    │  Port: 10000               │
                                    │  URL: your-backend.com     │
                                    └────────────────────────────┘
```

## Communication Flow

```
┌─────────┐                 ┌──────────────┐                ┌─────────┐
│ Player  │                 │   Frontend   │                │ Backend │
│ Browser │                 │   (Next.js)  │                │ (Node)  │
└────┬────┘                 └──────┬───────┘                └────┬────┘
     │                             │                             │
     │  1. Visit website           │                             │
     ├────────────────────────────►│                             │
     │                             │                             │
     │  2. Load React App          │                             │
     │◄────────────────────────────┤                             │
     │                             │                             │
     │  3. Initialize WebSocket    │                             │
     │                             ├────────────────────────────►│
     │                             │  4. Connect to /ws          │
     │                             │                             │
     │                             │◄────────────────────────────┤
     │                             │  5. Connection established  │
     │                             │                             │
     │  6. Create Room             │                             │
     ├────────────────────────────►│  7. Send 'init-room'       │
     │                             ├────────────────────────────►│
     │                             │                             │
     │                             │◄────────────────────────────┤
     │                             │  8. Return room code        │
     │◄────────────────────────────┤                             │
     │  9. Display room code       │                             │
     │                             │                             │
     │  10. Pick hero              │                             │
     ├────────────────────────────►│  11. Send 'update-state'   │
     │                             ├────────────────────────────►│
     │                             │                             │
     │                             │◄────────────────────────────┤
     │                             │  12. Broadcast to all       │
     │◄────────────────────────────┤                             │
     │  13. Update UI              │                             │
     │                             │                             │
```

## Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT STATE                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  React State (useState)        Custom Hooks (useGameState)       │
│  ├─ heroes                     ├─ currentPhase                   │
│  ├─ showHistory                ├─ leftBans, rightBans            │
│  ├─ isStarted                  ├─ leftPicks, rightPicks          │
│  └─ isProcessingAction         ├─ leftName, rightName            │
│                                ├─ swapSides                       │
│                                └─ hasBeenSaved                    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                                   │
                          WebSocket │ Real-time Sync
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                        SERVER STATE                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  In-Memory (GameRoom)          Persistent (LowDB)                │
│  ├─ rooms (Map)                ├─ rooms.json                     │
│  ├─ playerConnections          │  ├─ code                        │
│  ├─ readyToStart               │  ├─ ownerSide                   │
│  └─ readyToRestart             │  └─ state                       │
│                                │     ├─ currentPhase              │
│                                │     ├─ bans/picks                │
│                                │     ├─ team names                │
│                                │     ├─ savedRounds               │
│                                │     └─ hasBeenSaved              │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Environment Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT ENVIRONMENT                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Frontend (.env.local)              Backend (.env)              │
│  ├─ NEXT_PUBLIC_WS_URL              ├─ PORT=3001                │
│  │  = ws://localhost:3001/ws        ├─ NODE_ENV=development     │
│  ├─ NEXT_PUBLIC_API_URL             ├─ ALLOWED_ORIGINS          │
│  │  = http://localhost:3001         │  = http://localhost:3000  │
│  └─ NODE_ENV=development            └─ DB_PATH=./rooms.json     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCTION ENVIRONMENT                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Frontend (Render Dashboard)        Backend (Render Dashboard)  │
│  ├─ NEXT_PUBLIC_WS_URL              ├─ PORT=10000               │
│  │  = wss://backend.com/ws          ├─ NODE_ENV=production      │
│  ├─ NEXT_PUBLIC_API_URL             ├─ ALLOWED_ORIGINS          │
│  │  = https://backend.com           │  = https://frontend.com   │
│  └─ NODE_ENV=production             └─ DB_PATH=/var/data/...    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment Pipeline

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│   Code   │───►│  GitHub  │───►│  Render  │───►│   Live   │
│   Push   │    │   Repo   │    │  Deploy  │    │   Site   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │               │               │
     │               │               │               │
     ▼               ▼               ▼               ▼
  Commit         Trigger          Build           Serve
   Code          Deploy           Apps            Users
```

### Detailed Deployment Steps

```
1. LOCAL
   ├─ Write code
   ├─ Test locally
   ├─ Run deploy-prepare.sh
   └─ Commit & push

2. GITHUB
   ├─ Webhook triggered
   └─ Notify Render

3. RENDER (Backend)
   ├─ Clone repository
   ├─ cd backend && npm install
   ├─ Run health checks
   └─ Start: npm start

4. RENDER (Frontend)
   ├─ Clone repository
   ├─ cd frontend && npm install
   ├─ npm run build
   └─ Start: npm start

5. PRODUCTION
   ├─ Services running
   ├─ WebSocket connected
   └─ Users can play
```

## Technology Stack

```
┌────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
├────────────────────────────────────────────────────────────────┤
│  Framework:   Next.js 16.0.3 (App Router, Turbopack)          │
│  UI Library:  React 19.2.0                                     │
│  Language:    TypeScript                                       │
│  Styling:     Tailwind CSS 4.1.17                             │
│  Icons:       Lucide React                                     │
│  State:       React Hooks (useState, useEffect, useRef)        │
│  WebSocket:   Native WebSocket API                             │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                         BACKEND                                 │
├────────────────────────────────────────────────────────────────┤
│  Runtime:     Node.js                                          │
│  Framework:   Express.js                                       │
│  WebSocket:   ws (WebSocket library)                           │
│  Database:    LowDB (JSON file-based)                          │
│  Language:    JavaScript (ESM modules)                         │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                      INFRASTRUCTURE                             │
├────────────────────────────────────────────────────────────────┤
│  Hosting:     Render.com                                       │
│  CI/CD:       Render Auto-Deploy                               │
│  Protocol:    HTTPS/WSS (TLS)                                  │
│  Storage:     Ephemeral (Free Tier)                            │
│  Monitoring:  Render Logs                                      │
└────────────────────────────────────────────────────────────────┘
```

## Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Transport Security                                 │
│  ├─ HTTPS (TLS) for frontend                                │
│  ├─ WSS (WebSocket Secure) for real-time                    │
│  └─ Render.com automatic SSL certificates                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Layer 2: CORS Protection                                    │
│  ├─ Origin whitelisting                                      │
│  ├─ Dynamic origin validation                               │
│  └─ Credentials allowed for same-origin                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Environment Isolation                              │
│  ├─ Environment variables (not in code)                     │
│  ├─ Separate dev/staging/prod configs                       │
│  └─ .gitignore for sensitive files                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Layer 4: Application Logic                                  │
│  ├─ Room code validation                                     │
│  ├─ Player side assignment                                   │
│  └─ State validation on server                              │
└─────────────────────────────────────────────────────────────┘
```

## Scaling Considerations

```
Current Setup (Free Tier)
┌────────────────────────────┐
│  1 Frontend Instance       │
│  1 Backend Instance        │
│  Ephemeral Storage         │
│  Cold starts after 15min   │
└────────────────────────────┘

Future Scaling (Paid Tier)
┌────────────────────────────┐
│  N Frontend Instances      │
│  ├─ Load balanced          │
│  ├─ Auto-scaling           │
│  └─ Always-on              │
│                            │
│  N Backend Instances       │
│  ├─ Horizontal scaling     │
│  ├─ Session affinity       │
│  └─ Always-on              │
│                            │
│  Persistent Storage        │
│  ├─ Persistent disk        │
│  └─ External database      │
└────────────────────────────┘
```

---

**Architecture Version**: 1.0  
**Last Updated**: November 29, 2025  
**Status**: Production Ready
