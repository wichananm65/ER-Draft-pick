# Code Organization Guide

## Project Structure (After Refactor)

```
er-pick-ban/
├── app/
│   ├── types/
│   │   └── index.ts                 # Shared type definitions
│   ├── components/
│   │   ├── common/
│   │   │   └── Header.tsx          # Shared header component
│   │   ├── menu/
│   │   │   └── MenuContainer.tsx   # Menu page container
│   │   └── game/
│   │       ├── GameRoomContainer.tsx   # Main game container with logic
│   │       ├── PhaseInfo.tsx           # Phase information display
│   │       ├── TeamPanel.tsx           # Team display (bans/picks)
│   │       └── HeroGrid.tsx            # Hero selection grid
│   ├── hooks/                       # Custom React hooks (future)
│   ├── page.tsx                    # App entry point (router)
│   ├── layout.tsx                  # Root layout
│   └── globals.css                 # Global styles
├── lib/
│   ├── api/
│   │   ├── websocket.ts           # WebSocket client
│   │   └── storage.ts             # Storage/API layer
│   ├── gameData.ts                # Game configuration (heroes, phases)
│   └── (moved old storage.ts)
├── server.mjs                      # Node.js WebSocket server
├── tsconfig.json                   # TypeScript config with @/ alias
└── package.json
```

## Key Improvements

### 1. **Centralized Types** (`app/types/index.ts`)
- Single source of truth for all type definitions
- Reduces import confusion and circular dependencies
- Types: `Mode`, `Side`, `GameState`, `HeroStatus`

### 2. **Component Organization**
- **common/** - Reusable components (Header)
- **menu/** - Menu-specific components
- **game/** - Game-specific components with logic
- Clear separation of concerns

### 3. **API Layer** (`lib/api/`)
- `websocket.ts` - Low-level WebSocket communication
- `storage.ts` - High-level game state API
- Clean abstraction between frontend and backend

### 4. **Clean Imports**
- Use `@/` path alias consistently
- Import types from `@/app/types`
- Import API from `@/lib/api/storage`
- Avoid relative imports (`../../`)

## Component Responsibilities

### GameRoomContainer
- Manages game state (phase, bans, picks, timers)
- Handles WebSocket listeners
- Orchestrates timer logic (start countdown, action timer)
- Auto-advance on timeout

### MenuContainer
- Room creation and joining UI
- Player registration (left/right/spectator)
- Error handling and validation

### PhaseInfo
- Displays current phase info
- Shows countdown timers
- Progress bar for action timer

### TeamPanel
- Shows team bans and picks
- Color-coded (blue/red by side)

### HeroGrid
- Searchable hero list
- Color-coded hero status (green/grey/blue/red)
- Click to ban/pick during active turn

### Header
- Room code display
- Copy to clipboard
- Player role indicator
- Exit button

## When to Modify

| File | When to Change |
|------|---|
| `app/types/index.ts` | Adding new type definitions |
| `app/components/game/GameRoomContainer.tsx` | Game logic, state management, timers |
| `app/components/menu/MenuContainer.tsx` | Menu UI, room joining flow |
| `app/components/game/PhaseInfo.tsx` | Phase/timer display format |
| `lib/api/storage.ts` | Message types, API requests |
| `lib/gameData.ts` | Heroes, phases, constants |
| `server.mjs` | Backend logic, room persistence |

## Development Tips

1. **Use 'use client'** at component level (already done)
2. **Import types from @/app/types** for consistency
3. **Avoid modifying old components** directory (deprecated)
4. **Keep old lib files** for reference during transition
5. **Test imports** after reorganization with `pnpm dev`

## Running the App

```bash
# Terminal 1: Start WebSocket server
node server.mjs

# Terminal 2: Start Next.js dev
pnpm dev
```

Visit `http://localhost:3000`
