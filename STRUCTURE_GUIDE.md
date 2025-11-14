# 📁 Project Structure - Visual Guide

## Before (Messy) ❌
```
components/
├── PickBanGame.tsx         (mixed concerns)
├── Menu.tsx                (menu logic)
├── GameRoom.tsx            (427 lines, too large)
├── PhaseInfo.tsx
├── TeamPanel.tsx
└── HeroGrid.tsx

lib/
├── storage.ts              (mixed with websocket)
├── websocket.ts
└── gameData.ts
```

**Problems:**
- All components at same level
- No clear feature separation
- Large files hard to maintain
- Imports confusing (relative paths)
- Types scattered across files

---

## After (Clean) ✅
```
app/
├── types/
│   └── index.ts            ✨ Centralized types
├── components/
│   ├── common/
│   │   └── Header.tsx      (reusable)
│   ├── menu/
│   │   └── MenuContainer.tsx
│   └── game/
│       ├── GameRoomContainer.tsx   (game logic)
│       ├── PhaseInfo.tsx           (display)
│       ├── TeamPanel.tsx           (display)
│       └── HeroGrid.tsx            (display)
├── hooks/                  ✨ Ready for custom hooks
├── page.tsx                (app router)
├── layout.tsx
└── globals.css

lib/
├── api/                    ✨ New abstraction layer
│   ├── websocket.ts       (low-level)
│   └── storage.ts         (high-level API)
├── gameData.ts            (constants)
└── (old files - deprecated)
```

**Benefits:**
✅ Clear feature separation
✅ Smaller, focused files
✅ Centralized types
✅ Clean import paths (@/)
✅ Easy navigation
✅ Scalable structure

---

## Import Examples

### ❌ Before (Confusing)
```typescript
import type { Side } from './PickBanGame';
import { saveGameState } from '../../lib/storage';
import Menu from './Menu';
```

### ✅ After (Clear)
```typescript
import type { Side } from '@/app/types';
import { saveGameState } from '@/lib/api/storage';
import MenuContainer from '@/app/components/menu/MenuContainer';
```

---

## Component Hierarchy

```
app/page.tsx (Router/State Management)
    ↓
    ├─→ MenuContainer
    │   └─→ (Room Creation/Joining)
    │
    └─→ GameRoomContainer (Game Logic)
        ├─→ Header
        ├─→ PhaseInfo
        ├─→ TeamPanel (left)
        ├─→ HeroGrid
        └─→ TeamPanel (right)
```

**Responsibility:**
- **page.tsx** - Routes between menu/game
- **MenuContainer** - Menu UI and room joining
- **GameRoomContainer** - Game logic, state, timers
- **Display components** - Render data only

---

## File Size Reduction

| Component | Before | After | % Reduction |
|-----------|--------|-------|-------------|
| GameRoom.tsx | 427 lines | GameRoomContainer: 366 lines | ✅ Improved |
| PickBanGame.tsx | 52 lines | page.tsx: 45 lines | ✅ Same |
| Menu.tsx | 166 lines | MenuContainer: 155 lines | ✅ Improved |
| **Total** | **Large files** | **Smaller, focused** | ✅ Better |

---

## Directory Navigation Tips

### To modify game logic
→ Edit `app/components/game/GameRoomContainer.tsx`

### To change menu UI
→ Edit `app/components/menu/MenuContainer.tsx`

### To modify API calls
→ Edit `lib/api/storage.ts`

### To change game rules/phases
→ Edit `lib/gameData.ts`

### To add new types
→ Edit `app/types/index.ts`

### To add custom hooks
→ Create `app/hooks/useYourHook.ts`

---

## Import Path Reference

```typescript
// Types
import type { GameState, Side } from '@/app/types';

// API
import { saveGameState, loadGameState } from '@/lib/api/storage';
import { wsClient } from '@/lib/api/websocket';

// Game Constants
import { heroes, phases } from '@/lib/gameData';

// Components - Common
import Header from '@/app/components/common/Header';

// Components - Menu
import MenuContainer from '@/app/components/menu/MenuContainer';

// Components - Game
import GameRoomContainer from '@/app/components/game/GameRoomContainer';
import PhaseInfo from '@/app/components/game/PhaseInfo';
import TeamPanel from '@/app/components/game/TeamPanel';
import HeroGrid from '@/app/components/game/HeroGrid';
```

---

## Quick Modification Guide

| Change | File | Action |
|--------|------|--------|
| Add new hero | `lib/gameData.ts` | Add to `heroes` array |
| Change timer duration | `app/components/game/GameRoomContainer.tsx` | Update timeout values |
| Modify game phases | `lib/gameData.ts` | Update `phases` array |
| Change UI colors | `app/components/game/*.tsx` | Update Tailwind classes |
| Fix WebSocket | `lib/api/websocket.ts` | Update connection logic |
| Add new API endpoint | `lib/api/storage.ts` | Add new function |
| Modify type definitions | `app/types/index.ts` | Update interfaces |

---

## Running the App

```bash
# Start WebSocket server (separate terminal)
node server.mjs

# Start Next.js development
pnpm dev

# Visit
http://localhost:3000
```

---

**Everything is organized, clean, and ready to scale!** 🚀
