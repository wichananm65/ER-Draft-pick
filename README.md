# ER Pick Ban - Clean Code Structure

Clean, organized Next.js app with proper feature-based architecture.

## 📁 Project Structure

```
app/
├── types/
│   └── index.ts                 ← Shared types
├── components/
│   ├── common/
│   │   └── Header.tsx
│   ├── menu/
│   │   └── MenuContainer.tsx
│   └── game/
│       ├── GameRoomContainer.tsx
│       ├── PhaseInfo.tsx
│       ├── TeamPanel.tsx
│       └── HeroGrid.tsx
├── hooks/                       ← Ready for custom hooks
├── page.tsx                     ← App entry point
├── layout.tsx
└── globals.css

lib/
├── api/
│   ├── websocket.ts            ← WebSocket client
│   └── storage.ts              ← Storage/API layer
└── gameData.ts                 ← Game configuration

server.mjs                       ← Node.js WebSocket server
```

## 🚀 Quick Start

### Terminal 1: Start WebSocket Server
```bash
node server.mjs
```

### Terminal 2: Start Next.js Dev Server
```bash
pnpm dev
```

Visit `http://localhost:3000`

## 📝 Key Files

| Purpose | Location |
|---------|----------|
| App entry point | `app/page.tsx` |
| Type definitions | `app/types/index.ts` |
| Game logic & state | `app/components/game/GameRoomContainer.tsx` |
| Menu UI | `app/components/menu/MenuContainer.tsx` |
| API calls | `lib/api/storage.ts` |
| WebSocket client | `lib/api/websocket.ts` |
| Game config | `lib/gameData.ts` |
| Backend server | `server.mjs` |

## ✨ Features

- ✅ Real-time WebSocket synchronization
- ✅ Menu creation and room joining
- ✅ Spectator mode
- ✅ 10-second start countdown
- ✅ 60-second per-action timer
- ✅ Auto-advance with random hero selection
- ✅ Hero search and filtering
- ✅ Game state persistence
- ✅ Multi-browser support

## 📚 Documentation

For detailed information, see:
- **CODE_ORGANIZATION.md** - Complete usage guide
- **STRUCTURE_GUIDE.md** - Visual guide and tips
- **VERIFICATION_CHECKLIST.md** - Verification items

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
