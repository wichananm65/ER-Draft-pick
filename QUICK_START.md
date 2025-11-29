# Quick Start Guide - ER Draft Pick

Get up and running in 5 minutes!

## Local Development

### 1. Clone & Install

```bash
# Clone repository
git clone https://github.com/wichananm65/ER-Draft-pick.git
cd ER-Draft-pick

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Start Backend Server

```bash
cd backend
npm run dev
```

Backend will start on `http://localhost:3001`

### 3. Start Frontend

Open a new terminal:

```bash
cd frontend
npm run dev
```

Frontend will open at `http://localhost:3000`

### 4. Play!

1. Open `http://localhost:3000` in your browser
2. Click "Create Room" to start a new game
3. Share the room code with another player
4. Or open in another browser tab to test

## Environment Setup (Optional)

### Frontend (.env.local)

```bash
# Create file: frontend/.env.local
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
```

### Backend (.env)

```bash
# Create file: backend/.env
PORT=3001
NODE_ENV=development
```

## Common Issues

### Backend won't start
- **Port in use**: Change PORT in backend/.env
- **Dependencies missing**: Run `npm install` in backend folder

### Frontend won't connect
- **Backend not running**: Start backend server first
- **Wrong URL**: Check NEXT_PUBLIC_WS_URL matches backend port

### Game not syncing
- **WebSocket failed**: Check browser console for errors
- **Firewall**: Allow localhost connections

## Testing the Game

### Single Player Test
1. Create room
2. Open `http://localhost:3000` in incognito mode
3. Join room with the code
4. Play against yourself

### Multi-Browser Test
1. Create room in Chrome
2. Join room in Firefox
3. Test real-time synchronization

### Spectator Test
1. Create room with 2 players
2. Open third browser/tab
3. Join as spectator
4. Verify you can watch but not interact

## Next Steps

- Read [README.md](./README.md) for full features
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for production hosting
- Check [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) before deploying

## Need Help?

- Check browser console for errors
- Verify both frontend and backend are running
- Ensure you're using Node.js 18 or higher
- Try restarting both servers

**Happy Gaming!** 🎮
