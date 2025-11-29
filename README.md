# ER Draft Pick

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![WebSocket](https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=websocket&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
[![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/)

A real-time multiplayer draft pick game where players compete to build the best team by selecting heroes in a turn-based format. Built with modern web technologies for seamless real-time gameplay across multiple browsers.

## ✨ Key Features

- **Real-time Synchronization**: Instant game state updates via WebSocket connections
- **Room Management**: Create and join private game rooms with unique codes
- **Spectator Mode**: Watch live games without participating
- **Turn-based Gameplay**: 60-second timers with automatic progression
- **Hero Selection**: Comprehensive hero database with search and filtering
- **Game Persistence**: Automatic saving of game state and rounds
- **Multi-browser Support**: Works across all modern web browsers
- **Responsive Design**: Optimized for desktop and mobile devices
- **Audio Feedback**: Sound effects for game actions and timers

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16.0.3 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19.2.0
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Hooks + Custom Hooks
- **Real-time Communication**: WebSocket Client

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Real-time**: WebSocket (ws library)
- **Database**: LowDB (JSON-based storage)
- **Language**: TypeScript
- **Process Management**: Native Node.js

### Development & Deployment
- **Package Manager**: npm
- **Build Tool**: Next.js (Turbopack)
- **Linting**: ESLint
- **Deployment**: Render.com (separate services)
- **Version Control**: Git

## 📁 Project Structure

```
er-pick-ban/
├── frontend/                    # Next.js React application
│   ├── app/                     # Next.js App Router
│   │   ├── components/          # Reusable React components
│   │   │   ├── common/         # Shared UI components
│   │   │   ├── features/       # Feature-specific components
│   │   │   │   ├── game/       # Game room components
│   │   │   │   └── menu/       # Menu components
│   │   │   └── ui/             # UI primitives
│   │   ├── hooks/              # Custom React hooks
│   │   ├── menu/               # Menu pages
│   │   ├── room/               # Game room pages
│   │   └── types/              # TypeScript type definitions
│   ├── lib/                    # Utility libraries
│   │   ├── api/               # API clients and services
│   │   ├── services/          # Business logic services
│   │   └── utils/             # Helper functions
│   ├── public/                # Static assets and game data
│   │   └── characters/        # Hero images and assets
│   ├── types/                 # Custom type declarations
│   └── package.json
└── backend/                     # Express WebSocket server
    ├── lib/                    # Server utilities
    │   └── storage.ts          # Data persistence layer
    ├── server.mjs              # Main Express server
    ├── rooms.json              # Game data storage
    ├── types.ts                # TypeScript definitions
    └── package.json
```

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (comes with Node.js)
- **Git**: For cloning the repository

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/wichananm65/ER-Draft-pick.git
   cd ER-Draft-pick
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../backend
   npm install
   ```

## ⚙️ Setup & Configuration

### Environment Variables

Create environment files for local development:

**Frontend (.env.local)**
```bash
# WebSocket server URL (use localhost for development)
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
```

**Backend (.env)**
```bash
# Server port (optional, defaults to 3001)
PORT=3001

# Environment
NODE_ENV=development
```

### Game Configuration

The game includes pre-configured hero data and game rules:

- **Hero Database**: Located in `frontend/lib/gameData.ts`
- **Game Phases**: Ban → Pick → Ban → Pick (configurable)
- **Timer Settings**: 60 seconds per action, 10-second countdown
- **Team Composition**: 5 heroes per team (configurable)

## 🏃‍♂️ Running the Project

### Development Mode

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   Server will start on `http://localhost:3001`

2. **Start the frontend application**
   ```bash
   cd frontend
   npm run dev
   ```
   Application will open at `http://localhost:3000`

### Production Mode

1. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   npm start
   ```

2. **Start the backend**
   ```bash
   cd backend
   npm start
   ```

## 📖 Usage

### Creating a Game Room

1. Open the application in your browser
2. Click "Create Room" to generate a new game room
3. Share the room code with other players
4. Wait for players to join or start spectating

### Joining a Game

1. Click "Join Room" on the main menu
2. Enter the room code provided by the host
3. Choose your side (Left or Right team)
4. Wait for the game to begin

### Gameplay

- **Phase 1-2**: Ban Phase - Remove heroes from the pool
- **Phase 3-4**: Pick Phase - Select heroes for your team
- **Timers**: 60 seconds per action, automatic progression
- **Spectating**: Watch live games without participating

## 🌐 API Endpoints

### Backend REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check endpoint |
| `GET` | `/api/rooms` | List all active game rooms |

### WebSocket Events

**Client → Server**
- `init-room`: Create a new game room
- `join-room`: Join an existing room
- `spectate-room`: Join as spectator
- `update-state`: Update game state
- `ready-to-start`: Signal ready to begin
- `ready-to-restart`: Signal ready for rematch

**Server → Client**
- `room-initialized`: Room creation confirmation
- `room-joined`: Join confirmation
- `state-updated`: Game state changes
- `player-joined/left`: Player status updates
- `ready-to-start-status`: Ready status updates

## 🚀 Deployment

### Render.com Deployment

#### Frontend (Static Site)
1. Connect your GitHub repository to Render
2. Create a new **Static Site** service
3. Configure the following:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `.next`
   - **Environment Variables**:
     ```
     NEXT_PUBLIC_WS_URL=wss://your-backend-service.onrender.com/ws
     ```

#### Backend (Web Service)
1. Create a new **Web Service** on Render
2. Configure the following:
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     NODE_ENV=production
     PORT=10000
     ```

### Production URLs

After deployment:
- **Frontend**: `https://your-frontend-app.onrender.com`
- **Backend**: `https://your-backend-service.onrender.com`
- **WebSocket**: `wss://your-backend-service.onrender.com/ws`

## 🤝 Contributing

We welcome contributions to improve ER Draft Pick!

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Run tests and linting**
   ```bash
   cd frontend && npm run lint
   cd ../backend && npm run type-check
   ```
5. **Commit your changes**
   ```bash
   git commit -m "Add: Brief description of changes"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request**

### Code Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Follow the configured linting rules
- **Commits**: Use conventional commit format
- **Documentation**: Update README for significant changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Hero Assets**: Game character images and data
- **Open Source Libraries**: Thanks to the maintainers of Next.js, React, Express, and WebSocket libraries
- **Community**: Beta testers and contributors

---

**Built with ❤️ for the gaming community**
