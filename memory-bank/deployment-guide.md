# Deployment Guide: Vercel

## Prerequisites
- GitHub account
- Vercel account (free)
- Project pushed to GitHub repository

---

## Step 1: Prepare Your Project

### 1.1 Verify Build Works Locally
```bash
npm run build
```
✅ Should create a `dist` folder with no errors

### 1.2 Check Environment Variables
Open `.env` and note these values (you'll need them):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

⚠️ **DO NOT** commit `.env` to GitHub (already in `.gitignore`)

### 1.3 Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

---

## Step 2: Create Vercel Account

1. Go to **https://vercel.com**
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account

---

## Step 3: Import Project

### 3.1 Add New Project
1. Click **"Add New..."** → **"Project"**
2. Find your repository: `eCRM_Audit-Platform` (or your repo name)
3. Click **"Import"**

### 3.2 Configure Project Settings
Vercel auto-detects Vite, but verify:

| Setting | Value |
|---------|-------|
| Framework Preset | **Vite** |
| Root Directory | `./` (default) |
| Build Command | `npm run build` |
| Output Directory | `dist` |

✅ Leave as default if auto-detected

---

## Step 4: Add Environment Variables

### 4.1 Open Environment Variables Section
Scroll down to **"Environment Variables"**

### 4.2 Add Variables One by One

**Variable 1:**
- **Name**: `VITE_SUPABASE_URL`
- **Value**: (paste from your `.env` file)
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

**Variable 2:**
- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Value**: (paste from your `.env` file)
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

---

## Step 5: Deploy

1. Click **"Deploy"**
2. Wait 1-2 minutes while Vercel:
   - Installs dependencies (`npm install`)
   - Builds your app (`npm run build`)
   - Deploys to global CDN

### 5.1 Deployment Success
✅ You'll see: **"Congratulations! Your project has been deployed."**

---

## Step 6: Access Your App

### 6.1 Get Your URL
Vercel assigns a URL like:
```
https://ecrm-audit-platform.vercel.app
```

### 6.2 Test the App
1. Click the URL
2. Try logging in
3. Verify dashboard loads
4. Test audio playback

---

## Step 7: Custom Domain (Optional)

### 7.1 Add Your Domain
1. Go to **Project Settings** → **Domains**
2. Click **"Add"**
3. Enter your domain (e.g., `audit.yourcompany.com`)
4. Follow DNS configuration instructions

### 7.2 Update DNS Records
Add these records at your domain provider:

| Type | Name | Value |
|------|------|-------|
| CNAME | audit | cname.vercel-dns.com |

⏱️ DNS propagation takes 5-60 minutes

---

## Step 8: Enable Auto-Deploy

✅ **Already enabled by default!**

Every time you push to GitHub:
```bash
git push origin main
```
Vercel automatically:
1. Detects the push
2. Rebuilds the app
3. Deploys the new version

---

## Troubleshooting

### ❌ Build Failed
**Check:**
- Build logs in Vercel dashboard
- Run `npm run build` locally first
- Verify all dependencies in `package.json`

### ❌ Blank Page After Deploy
**Check:**
1. Browser console for errors (F12)
2. Environment variables are set correctly
3. Supabase URL is accessible

### ❌ "Failed to fetch" errors
**Check:**
- `VITE_SUPABASE_URL` is correct
- `VITE_SUPABASE_ANON_KEY` is correct
- Supabase project is active (not paused)

### ❌ Audio Not Playing
**Check:**
- S3 bucket has CORS enabled
- Audio URLs are publicly accessible
- Browser allows audio autoplay

---

## Vercel Dashboard Overview

### Key Sections

**Deployments**
- View all deployment history
- Rollback to previous versions
- Preview branch deployments

**Settings**
- Environment Variables
- Custom Domains
- Build & Development Settings

**Analytics** (Free Tier)
- Page views
- Unique visitors
- Performance metrics

---

## Production Checklist

Before going live:

- [ ] Test login with real user accounts
- [ ] Upload sample CSV and verify import
- [ ] Complete one full audit workflow
- [ ] Test export functionality
- [ ] Verify all 15 users can access
- [ ] Check mobile responsiveness (if needed)
- [ ] Set up custom domain (optional)
- [ ] Share production URL with team

---

## Maintenance

### Update Environment Variables
1. Go to **Project Settings** → **Environment Variables**
2. Edit existing variable
3. Click **"Save"**
4. Redeploy: **Deployments** → **"Redeploy"**

### Monitor Performance
- Check **Analytics** tab weekly
- Review **Build Logs** if issues occur
- Monitor Supabase usage in Supabase dashboard

### Rollback if Needed
1. Go to **Deployments**
2. Find last working version
3. Click **"..."** → **"Promote to Production"**

---

## Cost Breakdown

### Vercel Free Tier
✅ 100GB bandwidth/month  
✅ Unlimited deployments  
✅ Automatic HTTPS  
✅ Global CDN  
✅ Analytics included  

**Your Usage**: ~2-5GB/month (well within limits)

### Supabase Free Tier
✅ 500MB database  
✅ 1GB file storage  
✅ 50,000 monthly active users  

**Your Usage**: ~25k rows/month (well within limits)

**Total Monthly Cost: $0** 🎉

---

## Quick Reference Commands

```bash
# Local development
npm run dev

# Test production build locally
npm run build
npm run preview

# Deploy (automatic on push)
git push origin main

# Force redeploy (if needed)
# Use Vercel dashboard → Deployments → Redeploy
```

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Vite Deployment**: https://vitejs.dev/guide/static-deploy
- **Supabase Docs**: https://supabase.com/docs

---

**Last Updated**: 2025-12-30  
**Deployment Platform**: Vercel  
**Estimated Setup Time**: 15-20 minutes
