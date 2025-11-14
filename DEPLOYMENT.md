# Deployment Guide

## Vercel Deployment

This project has been configured for deployment on Vercel with the following setup:

### Files Added
- `vercel.json` - Vercel build configuration
- `.vercelignore` - Excludes backend files from Vercel

### Configuration

**vercel.json:**
```json
{
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "env": {
    "NEXT_PUBLIC_WS_URL": "@NEXT_PUBLIC_WS_URL"
  }
}
```

### Important Notes

1. **Frontend-Only Deployment**: Vercel hosts the Next.js frontend only. The backend WebSocket server must be deployed separately.

2. **Environment Variables**: Set `NEXT_PUBLIC_WS_URL` in Vercel environment variables to point to your backend server.
   - Example: `wss://your-backend.example.com/ws`

3. **Backend Deployment**: Deploy `server.mjs` separately on a server that supports Node.js:
   - Railway
   - Heroku
   - AWS
   - Your own VPS
   - Digital Ocean

### Deployment Steps

#### Frontend (Next.js on Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variable `NEXT_PUBLIC_WS_URL`
4. Vercel will auto-deploy on push

#### Backend (Node.js Server)
1. Choose hosting (e.g., Railway, Heroku)
2. Deploy `server.mjs`
3. Get the public URL
4. Add to Vercel env as `NEXT_PUBLIC_WS_URL` (with `wss://` prefix)

### Local Development

```bash
# Terminal 1: Start backend
node server.mjs

# Terminal 2: Start frontend with dev server
pnpm dev
```

Visit `http://localhost:3000`

### Production Build

```bash
# Build the Next.js app
pnpm build

# Start the production server (frontend only)
pnpm start

# Backend runs separately
node server.mjs
```

### Troubleshooting

**WebSocket connection fails in production:**
- Check `NEXT_PUBLIC_WS_URL` environment variable
- Ensure backend server is running and accessible
- Check CORS and WebSocket settings on backend

**Build fails on Vercel:**
- Check build logs in Vercel dashboard
- Ensure `vercel.json` is correct
- Verify no missing dependencies in `package.json`

### Optional: Self-hosted

If hosting both frontend and backend on same server:

1. Build frontend: `pnpm build`
2. Use a process manager (PM2, systemctl, etc.)
3. Run both `next start` and `node server.mjs` together

---

**Current Setup:**
- ✅ Frontend: Ready for Vercel
- ⚠️ Backend: Requires separate deployment
- 📝 Environment: Requires `NEXT_PUBLIC_WS_URL` configuration
