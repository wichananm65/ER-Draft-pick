# Deployment Guide - Render.com

This guide will help you deploy the ER Draft Pick application to Render.com with both frontend and backend services.

## Prerequisites

- GitHub account with the repository pushed
- Render.com account (free tier available)
- Both frontend and backend code in the same repository

## Quick Start Deployment

### Option 1: Automatic Deployment via render.yaml

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin master
   ```

2. **Connect to Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml` and create both services

3. **Configure Environment Variables**
   
   **Backend Service:**
   - `NODE_ENV` = `production` (auto-set)
   - `PORT` = `10000` (auto-set)
   - `ALLOWED_ORIGINS` = `https://your-frontend-url.onrender.com` (set manually)

   **Frontend Service:**
   - `NODE_ENV` = `production` (auto-set)
   - `NEXT_PUBLIC_WS_URL` = `wss://your-backend-url.onrender.com/ws` (set manually)
   - `NEXT_PUBLIC_API_URL` = `https://your-backend-url.onrender.com` (set manually)

4. **Deploy**
   - Render will automatically build and deploy both services
   - Wait for both services to show "Live" status

### Option 2: Manual Service Creation

#### Deploy Backend First

1. **Create Web Service**
   - Go to Render Dashboard → "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     ```
     Name: er-draft-pick-backend
     Region: Oregon (or nearest to users)
     Branch: master
     Root Directory: (leave empty or set to 'backend')
     Runtime: Node
     Build Command: cd backend && npm install
     Start Command: cd backend && npm start
     Plan: Free
     ```

2. **Set Environment Variables**
   ```
   NODE_ENV=production
   PORT=10000
   ALLOWED_ORIGINS=https://your-frontend-url.onrender.com
   ```

3. **Deploy** and note your backend URL: `https://er-draft-pick-backend.onrender.com`

#### Deploy Frontend Second

1. **Create Web Service**
   - Go to Render Dashboard → "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     ```
     Name: er-draft-pick-frontend
     Region: Oregon (same as backend for low latency)
     Branch: master
     Root Directory: (leave empty or set to 'frontend')
     Runtime: Node
     Build Command: cd frontend && npm install && npm run build
     Start Command: cd frontend && npm start
     Plan: Free
     ```

2. **Set Environment Variables**
   ```
   NODE_ENV=production
   NEXT_PUBLIC_WS_URL=wss://er-draft-pick-backend.onrender.com/ws
   NEXT_PUBLIC_API_URL=https://er-draft-pick-backend.onrender.com
   ```

3. **Deploy** and note your frontend URL: `https://er-draft-pick-frontend.onrender.com`

4. **Update Backend CORS**
   - Go back to backend service settings
   - Update `ALLOWED_ORIGINS` with your actual frontend URL
   - Trigger manual redeploy

## Post-Deployment Configuration

### 1. Update CORS Origins

After both services are deployed, update the backend's `ALLOWED_ORIGINS`:

```bash
# In Render Dashboard → Backend Service → Environment
ALLOWED_ORIGINS=https://er-draft-pick-frontend.onrender.com,https://www.yourdomain.com
```

### 2. Custom Domain (Optional)

**Frontend:**
1. Go to Frontend Service → Settings → Custom Domain
2. Add your domain (e.g., `draft.yourdomain.com`)
3. Update DNS records as instructed

**Backend:**
1. Go to Backend Service → Settings → Custom Domain
2. Add your domain (e.g., `api.yourdomain.com`)
3. Update DNS records as instructed
4. Update frontend's `NEXT_PUBLIC_WS_URL` to use new domain

### 3. Enable Auto-Deploy

Both services are configured for auto-deploy:
- Any push to `master` branch triggers redeployment
- Disable in Settings → Auto-Deploy if needed

## Important Notes

### Free Tier Limitations

- **Spin Down**: Services sleep after 15 minutes of inactivity
- **Cold Start**: First request after sleep takes 30-60 seconds
- **Solution**: Upgrade to paid plan or use external monitoring service

### WebSocket Connections

- Use `wss://` (secure WebSocket) in production, not `ws://`
- Ensure backend URL uses HTTPS for secure connections
- Free tier supports WebSocket connections

### Database Persistence

- `rooms.json` is stored in ephemeral storage
- Data persists during service uptime
- Data is lost on service restart or redeploy
- **Solution**: Upgrade to persistent disk or use external database

### Environment Variables

- Never commit `.env` files to Git
- Use Render Dashboard to set sensitive variables
- Update variables require service restart

## Monitoring & Logs

### View Logs

1. **Real-time Logs**
   - Render Dashboard → Select Service → Logs tab
   - View live application logs

2. **Error Tracking**
   - Monitor logs for WebSocket connection issues
   - Check CORS errors in browser console

### Health Checks

- Backend health endpoint: `https://your-backend.onrender.com/health`
- Check service status: Render Dashboard shows "Live" or "Build Failed"

### Performance Monitoring

```bash
# Check active rooms
curl https://your-backend.onrender.com/api/rooms
```

## Troubleshooting

### WebSocket Connection Failed

**Problem**: Frontend can't connect to backend WebSocket

**Solutions**:
1. Verify `NEXT_PUBLIC_WS_URL` uses `wss://` not `ws://`
2. Check backend is running (visit health endpoint)
3. Ensure CORS is configured correctly
4. Check browser console for specific errors

### CORS Errors

**Problem**: Browser blocks requests with CORS errors

**Solutions**:
1. Verify `ALLOWED_ORIGINS` includes your frontend URL
2. Ensure no trailing slashes in URLs
3. Check protocol matches (https/wss for production)
4. Redeploy backend after changing environment variables

### Service Won't Start

**Problem**: Service shows "Build Failed" or crashes

**Solutions**:
1. Check logs in Render Dashboard
2. Verify build/start commands are correct
3. Ensure all dependencies are in package.json
4. Check Node.js version compatibility

### Data Loss on Restart

**Problem**: Game rooms disappear after deployment

**Solutions**:
1. This is expected behavior with free tier ephemeral storage
2. Upgrade to persistent disk in service settings
3. Or migrate to external database (MongoDB, PostgreSQL)

## Upgrading Services

### Add Persistent Storage

1. Go to Service → Storage
2. Add Disk with mount path: `/var/data`
3. Update `DB_PATH` environment variable:
   ```
   DB_PATH=/var/data/rooms.json
   ```

### Prevent Cold Starts

1. Upgrade to paid plan (Starter: $7/month)
2. Or use external monitoring (UptimeRobot, Cronitor)
3. Set up cron job to ping health endpoint every 10 minutes

## Maintenance

### Manual Redeployment

1. Render Dashboard → Select Service
2. Click "Manual Deploy" → "Deploy latest commit"

### Rollback

1. Render Dashboard → Select Service → Events
2. Find previous successful deployment
3. Click "Rollback to this version"

### Scaling

- Free tier: 1 instance
- Paid plans: Add horizontal scaling
- Configure in Service Settings → Scaling

## Security Best Practices

1. **Environment Variables**: Never commit secrets
2. **CORS**: Restrict to specific domains in production
3. **HTTPS**: Always use HTTPS/WSS in production
4. **Updates**: Regularly update dependencies
5. **Monitoring**: Set up alerts for service downtime

## Cost Estimation

### Free Tier (Both Services)
- Cost: $0/month
- Limitations: Spin down, 750 hours/month

### Starter Plan (Recommended)
- Backend: $7/month (always on)
- Frontend: $7/month (always on)
- Total: $14/month

### Standard Plan (High Traffic)
- Backend: $25/month (more resources)
- Frontend: $25/month (more resources)
- Total: $50/month

## Support Resources

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com/)
- [Deploy Logs](https://dashboard.render.com/)
- [Status Page](https://status.render.com/)

## Next Steps

1. Test your deployment thoroughly
2. Set up custom domain (optional)
3. Configure monitoring/alerts
4. Consider upgrading for production use
5. Implement analytics and error tracking

---

**Deployment Complete!** 🎉

Your ER Draft Pick application is now live and ready for multiplayer gaming.
