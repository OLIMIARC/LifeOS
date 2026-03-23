# Deployment Guide

Follow these steps to take your application from local mock mode to a live production environment.

## 1. Push to GitHub
I have already initialized git and created the initial commit for you.
1. Create a new **public or private** repository on [GitHub](https://github.com/new).
2. Run these commands in your terminal (replacing the URL with your own):
   ```powershell
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

## 2. Set Up Live Database (Supabase or Neon)
### Using Supabase (Recommended)
1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** and paste the contents of [database_schema.sql](file:///C:/Users/ORACLE13/.gemini/antigravity/brain/4267e81d-e6b3-4d97-bb21-1cb3f01a5dab/database_schema.sql). Run it to create your tables.
3. Go to **Project Settings > Database** and copy the **Connection string** (URI). It looks like `postgres://postgres.xxx:password@xxx.supabase.co:5432/postgres`.
4. Replace `[YOUR-PASSWORD]` with your actual database password.

### Using Neon
1. Create a project at [neon.tech](https://neon.tech).
2. Use the **SQL Editor** to run the same [database_schema.sql](file:///C:/Users/ORACLE13/.gemini/antigravity/brain/4267e81d-e6b3-4d97-bb21-1cb3f01a5dab/database_schema.sql).
3. Copy the connection string from the Dashboard.

## 3. Deploy to Render (Web Dashboard)
1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New > Web Service**.
3. Connect your GitHub repository.
4. Use these settings:
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build` (Run from root or `apps/web`)
   - **Start Command**: `npm start`
5. **Environment Variables**:
   - `DATABASE_URL`: (Your connection string from Step 2)
   - `ANYTHING_PROJECT_TOKEN`: (Copy from your local `apps/web/.env`)
   - `CORS_ORIGINS`: `*` (or your mobile app's URL eventually)

## 4. Run Mobile App with Live Backend
1. Update `apps/mobile/.env`:
   - Set `EXPO_PUBLIC_BASE_URL` to your new **Render URL** (e.g., `https://your-app.onrender.com`).
2. Restart Expo: `npx.cmd expo start`.

---
Your app is now live with a real database!
