**Project Overview**

This repository implements a small real-time Pick/Ban draft UI using Next.js (app router) on the frontend and a Node WebSocket server for real-time synchronization.

This document explains how to run the project locally, what the main files and components do, how the realtime protocol works, and common customization points (styling, layout, audio and behavior).

**Run Locally**

Prerequisites: Node 18+, pnpm installed.

From the repo root run (PowerShell):
```powershell
pnpm install
pnpm dev
```

The dev server uses Next.js app directory; open the browser at the printed local URL.

**Main Code Areas**

- `server.mjs` : Node WebSocket server. Manages in-memory rooms, broadcasts `state-updated`, and handles readiness/restart behavior. Important room fields include `leftPicks`, `rightPicks`, `leftBans`, `rightBans`, `swapSides`, names and `savedRounds`.
- `app/` : Next.js app code.
  - `app/components/game/GameRoomContainer.tsx` : Main client logic and layout. Holds room state, WebSocket subscriptions, timers, swap logic, and hero click handling. Key responsibilities:
    - load and save game state via `lib/api/storage` (which sends/receives the server messages).
    - subscribe to `wsClient` events (`state-updated`, `ready-to-start-status`, `restart-ready-status`, etc.).
    - compute `effectivePhase` (this respects `swapSides` so turn order and visual mapping remain consistent).
    - trigger audio and UI feedback on state diffs (picks/bans).
  - `app/components/game/TeamPanel.tsx` : Renders a team's panel (name input, bans, picks). The container determines which team data to send based on `swapSides`.
  - `app/components/game/PhaseInfo.tsx` : Shows the current phase, countdown timers, and ready/reset controls.
  - `app/components/game/HeroGrid.tsx` : Grid of hero tiles, controls which tiles are clickable via `getHeroStatus` and `isClickable` props.
  - `app/components/game/RecentActionBanner.tsx` : Presentational component that shows the latest pick/ban centered above the hero grid.

**Websocket / Message Protocol (client↔server)**

These are the message types used by the client and server. Payload shapes are simple JS objects.

- Client -> Server:
  - `ready-to-start` `{ roomCode, side }` : indicate player ready to start
  - `ready-to-restart` `{ roomCode, side }` : indicate player ready to restart
  - `get-room-state` / `load` : storage helper uses these to fetch state
  - (storage) `save-game-state` : persist current room state

- Server -> Clients:
  - `state-updated` `{ roomState }` : authoritative room state broadcast after changes
  - `ready-to-start-status` / `restart-ready-status` : show which sides pressed ready
  - `restart-approved` : server confirmed restart and cleared picks/bans; server toggles `swapSides` when appropriate

Design note: The client uses diffs against local refs (`leftPicksRef`, `rightPicksRef`, etc.) to detect newly added picks/bans and play sounds / show the banner. The server remains authoritative for actual state.

**Customizing Visuals & Spacing**

Tailwind utilities are used throughout. Common edits:

- To change vertical spacing between `PhaseInfo` and the three-column area, edit the container margin in `app/components/game/GameRoomContainer.tsx`:
  - `mt-2` or `mt-4` on the main columns wrapper (search for `swap-container` in that file).
- The centered action banner width and spacing are controlled in `app/components/game/RecentActionBanner.tsx`:
  - `max-w-[640px]` controls max width. Change to `max-w-[520px]` etc.
  - `mb-4` on the banner wrapper controls spacing below banner to the hero grid.
  - `rounded-2xl`, `shadow-lg`, `backdrop-blur-sm` control appearance.

**Customizing Behavior**

- Swap sides on restart: server toggles `swapSides` and broadcasts it. The client uses `swapSides` to compute `effectivePhase` (flip side). If you want to change swap behavior (for example: swap only colors but not turn order), modify how `effectivePhase` is computed in `GameRoomContainer.tsx`.
- Immediate local feedback: `addRecentAction(...)` in `GameRoomContainer.tsx` adds the latest pick/ban for the acting player immediately. If you want to remove local-only immediate display and rely only on server broadcasts, remove calls to `addRecentAction` from the local action path.
- Auto-pick when timer expires: that logic is in the action timer effect (search for `actionTimer` handling). To change timeout, adjust the `setActionTimer(60)` values.

**Audio**

Audio is synthesized via WebAudio helpers in `GameRoomContainer.tsx` (`playTone`, `playSequence`, `playSoundForEvent`). Notes:

- Browser autoplay policies can block sounds until user interacts; add a small pre-warm button that calls `ensureAudioContext()` on first click.
- To replace with audio files instead of synth, remove synth helpers and use HTMLAudio or WebAudio buffer playback with fetched assets.

**Extending / Refactoring**

- Move presentation into smaller components: `TeamPanel`, `PhaseInfo`, and `RecentActionBanner` are already separated. If you want to further split logic and view:
  - Move WebSocket subscription code to a custom hook (e.g., `useRoom(roomCode)`) that returns state and event helpers.
  - Move audio helpers into a `useAudio()` hook.

- If you convert to a stricter TypeScript->server contract, create explicit types for messages (in `app/types.ts`) and update `lib/api/websocket.ts` to enforce them.

**Common tweaks & examples**

- Change banner width to 520px: edit `RecentActionBanner.tsx` change `max-w-[640px]` -> `max-w-[520px]`.
- Remove timestamp from banner: remove the timestamp node in `RecentActionBanner.tsx`.
- Reduce space under the timer: in `GameRoomContainer.tsx` set `mt-2` -> `mt-1` (or `mt-0`) on the columns wrapper.

**Troubleshooting**

- Dev server exit code 1: run `pnpm dev` and read the terminal stack trace. Common issues are invalid Tailwind utilities (project uses `bg-linear-to-br`), missing imports, or TypeScript errors. Copy the first error message and paste here and I’ll help fix it.

**Where to look for logic**

- Immediate picks/bans handling: `handleHeroClick` in `GameRoomContainer.tsx`.
- Auto-advance / timer logic: the `useEffect` hook responding to `actionTimer` in `GameRoomContainer.tsx`.
- Swap animation & toggle: `swapSides` field from server, `performSwapTransition` in `GameRoomContainer.tsx`.

If you'd like, I can also:
- run the dev server here and fix any build errors (paste terminal output), or
- add a small `README.md` to the `app/components/game` folder documenting each component's props.

---
End of quick guide. If you want a shorter cheat-sheet or an annotated file-by-file walkthrough, tell me which format you prefer and I will add it.
