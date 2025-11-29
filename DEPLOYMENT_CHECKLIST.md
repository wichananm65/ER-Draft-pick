# Production Deployment Checklist

Use this checklist to ensure a smooth deployment to Render.com.

## Pre-Deployment

### Code Preparation
- [ ] All features tested locally
- [ ] No console errors in browser
- [ ] WebSocket connections working locally
- [ ] Game mechanics functioning correctly
- [ ] All TypeScript errors resolved
- [ ] Code committed to Git
- [ ] Code pushed to GitHub

### Environment Configuration
- [ ] Created `.env.example` files (frontend & backend)
- [ ] Never committed actual `.env` files
- [ ] Documented all environment variables
- [ ] Verified `render.yaml` exists and is correct
- [ ] Updated `.gitignore` to exclude sensitive files

### Build Verification
- [ ] Frontend builds successfully: `cd frontend && npm run build`
- [ ] Backend dependencies install: `cd backend && npm install`
- [ ] No build errors or warnings
- [ ] TypeScript compilation passes
- [ ] All imports resolve correctly

## Render.com Setup

### Account Setup
- [ ] Created Render.com account
- [ ] Connected GitHub account to Render
- [ ] Verified repository access
- [ ] Chosen deployment region (Oregon recommended)

### Backend Service Configuration
- [ ] Created new Web Service
- [ ] Connected to correct GitHub repository
- [ ] Set root directory (if monorepo)
- [ ] Build command: `cd backend && npm install`
- [ ] Start command: `cd backend && npm start`
- [ ] Set environment variables:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=10000`
  - [ ] `ALLOWED_ORIGINS` (will update after frontend deployed)
- [ ] Enabled auto-deploy
- [ ] Configured health check: `/health`
- [ ] Noted backend URL: `_________________.onrender.com`

### Frontend Service Configuration
- [ ] Created new Web Service
- [ ] Connected to correct GitHub repository
- [ ] Set root directory (if monorepo)
- [ ] Build command: `cd frontend && npm install && npm run build`
- [ ] Start command: `cd frontend && npm start`
- [ ] Set environment variables:
  - [ ] `NODE_ENV=production`
  - [ ] `NEXT_PUBLIC_WS_URL=wss://[BACKEND-URL]/ws`
  - [ ] `NEXT_PUBLIC_API_URL=https://[BACKEND-URL]`
- [ ] Enabled auto-deploy
- [ ] Noted frontend URL: `_________________.onrender.com`

## Post-Deployment

### Configuration Updates
- [ ] Updated backend `ALLOWED_ORIGINS` with actual frontend URL
- [ ] Triggered manual redeploy of backend service
- [ ] Verified both services show "Live" status
- [ ] Checked deployment logs for errors

### Testing
- [ ] Opened frontend URL in browser
- [ ] No 404 or 500 errors
- [ ] No CORS errors in console
- [ ] WebSocket connects successfully (check console logs)
- [ ] Can create a game room
- [ ] Can join a game room
- [ ] Can spectate a game
- [ ] Hero selection works
- [ ] Timer functions correctly
- [ ] Game state syncs across tabs/browsers
- [ ] Team names persist
- [ ] Save functionality works
- [ ] Restart functionality works

### Security & Performance
- [ ] All connections use HTTPS/WSS (not HTTP/WS)
- [ ] CORS restricted to specific domains (not '*')
- [ ] No sensitive data in environment variables exposed to client
- [ ] Checked Lighthouse score
- [ ] Verified page load time < 3 seconds

## Production Monitoring

### Set Up Monitoring
- [ ] Bookmarked backend health endpoint
- [ ] Bookmarked active rooms endpoint
- [ ] Set up UptimeRobot or similar (optional)
- [ ] Configured email notifications in Render
- [ ] Documented how to access logs

### Documentation
- [ ] Updated README with production URLs
- [ ] Documented deployment process
- [ ] Created runbook for common issues
- [ ] Shared access with team members (if applicable)

## Optional Enhancements

### Custom Domain
- [ ] Purchased domain name
- [ ] Configured DNS records for frontend
- [ ] Configured DNS records for backend
- [ ] Updated environment variables with custom domain
- [ ] Verified SSL certificates active

### Upgrades
- [ ] Evaluated need for paid tier
- [ ] Considered persistent storage for database
- [ ] Evaluated auto-scaling requirements
- [ ] Set up staging environment (optional)

### Analytics & Monitoring
- [ ] Integrated Google Analytics (optional)
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configured performance monitoring
- [ ] Set up user analytics

## Troubleshooting Checklist

If something doesn't work:

### WebSocket Connection Issues
- [ ] Backend service is running and "Live"
- [ ] `NEXT_PUBLIC_WS_URL` uses `wss://` (not `ws://`)
- [ ] Backend URL is correct in frontend env vars
- [ ] No typos in WebSocket path (`/ws`)
- [ ] Firewall not blocking WebSocket connections

### CORS Errors
- [ ] `ALLOWED_ORIGINS` includes frontend URL
- [ ] No trailing slashes in URLs
- [ ] Redeployed backend after changing env vars
- [ ] Using correct protocol (https/wss)

### Service Won't Start
- [ ] Checked deployment logs
- [ ] Build command is correct
- [ ] Start command is correct
- [ ] All dependencies in package.json
- [ ] Node.js version compatible

### Cold Start Issues (Free Tier)
- [ ] Expected behavior on free tier
- [ ] First request after 15min takes 30-60s
- [ ] Consider upgrading to paid tier
- [ ] Or set up external ping service

## Rollback Plan

If deployment fails:

1. [ ] Identify which service is failing
2. [ ] Check deployment logs
3. [ ] Rollback to previous version in Render dashboard
4. [ ] Fix issues locally
5. [ ] Test thoroughly
6. [ ] Redeploy

## Sign-Off

- **Deployed by**: ___________________
- **Date**: ___________________
- **Frontend URL**: ___________________
- **Backend URL**: ___________________
- **Status**: ⬜ Deployed ⬜ Tested ⬜ Production Ready

---

**Note**: Keep this checklist updated as your deployment process evolves.
