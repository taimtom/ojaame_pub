# Vercel Deployment Guide

This guide will help you deploy the POS frontend to Vercel.

## Prerequisites

- Vercel account (sign up at https://vercel.com)
- GitHub repository with your frontend code
- Backend API URL (EC2 instance or other hosting)

## Step 1: Connect Repository to Vercel

1. Go to https://vercel.com and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Select the repository containing `pos_fe`

## Step 2: Configure Project Settings

### Build Settings

- **Framework Preset**: Vite
- **Root Directory**: `pos_fe` (if monorepo) or leave blank if root
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Environment Variables

Add environment variables in Vercel Dashboard → Settings → Environment Variables.

**Required:**
- `VITE_SERVER_URL` = `http://44.221.61.21:8004`

**Optional:** See `pos_fe/.env.example` for complete list of optional variables.

For detailed configuration, see `ENVIRONMENT_VARIABLES.md` in the root directory.

#### Preview Environment (for PR previews)

```bash
VITE_SERVER_URL=https://your-ec2-ip:8004
# Or use staging backend URL
```

#### Development Environment (optional, for local dev)

```bash
VITE_SERVER_URL=http://localhost:8004
```

## Step 3: Deploy

1. Click "Deploy" button
2. Vercel will automatically:
   - Install dependencies
   - Build the project
   - Deploy to production

## Step 4: Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. SSL certificate is automatically provisioned

## Step 5: Update Backend CORS

Make sure your EC2 backend allows requests from Vercel domain:

```python
# In your FastAPI CORS configuration
allow_origins=[
    "http://localhost:3030",  # Local dev
    "https://your-app.vercel.app",  # Vercel production
    "https://*.vercel.app",  # All Vercel previews
]
```

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SERVER_URL` | Backend API URL | Yes |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | No |
| `VITE_MAPBOX_API_KEY` | Mapbox API Key | No |
| `VITE_FIREBASE_*` | Firebase config (if using) | No |
| `VITE_AUTH0_*` | Auth0 config (if using) | No |

## Automatic Deployments

- **Production**: Deploys automatically on push to `main`/`master` branch
- **Preview**: Creates preview URL for every pull request
- **Branch**: Can deploy any branch as preview

## Troubleshooting

### Build Fails

1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Verify Node.js version (Vercel uses Node 18 by default)

### API Connection Issues

1. Verify `VITE_SERVER_URL` is set correctly
2. Check backend CORS configuration
3. Ensure backend is accessible from internet
4. Check browser console for CORS errors

### Environment Variables Not Working

1. Variables must start with `VITE_` to be exposed to client
2. Redeploy after adding/changing environment variables
3. Check variable names match exactly (case-sensitive)

## Updating Deployment

Simply push to your repository:

```bash
git add .
git commit -m "Update frontend"
git push origin main
```

Vercel will automatically deploy the changes.

## Cost

- **Free Tier**: Unlimited deployments, 100GB bandwidth/month
- **Pro Tier**: $20/month (if you need more features)

For staging/testing, free tier is usually sufficient.

## Next Steps

1. Set up custom domain (optional)
2. Configure preview deployments for PRs
3. Set up monitoring/analytics
4. Configure automatic deployments
