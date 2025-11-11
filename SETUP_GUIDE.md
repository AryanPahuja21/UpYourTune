# Quick Setup & Troubleshooting Guide

## 🔧 Setup Instructions

### 1. Fix TypeScript Errors (if any)

If you see TypeScript errors about `prismaClient.subscription`, restart the TypeScript server:

**Option A: VS Code Command Palette**
1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
2. Type: "TypeScript: Restart TS Server"
3. Press Enter

**Option B: Restart VS Code**
- Simply close and reopen VS Code

**Option C: Regenerate Prisma Client**
```bash
cd /c/Users/gauta/Desktop/Minor-project/UpYourTune
npx prisma generate
```

### 2. Start Development Server

```bash
cd /c/Users/gauta/Desktop/Minor-project/UpYourTune
npm run dev
```

### 3. Test the Features

1. **Login to the app**
   - Visit `http://localhost:3000`
   - Login with Google

2. **View Subscription Page**
   - Navigate to `/subscription`
   - You should see FREE plan by default

3. **Test Upgrade**
   - Click "Upgrade to PREMIUM" button
   - See the instant upgrade (no payment required for testing)
   - Notice the crown badge appears in navbar

4. **Test Limits**
   - Go to a creator's room
   - Try adding 6 songs (should be blocked at 5 for FREE plan)
   - Upgrade to PREMIUM
   - Now you can add unlimited songs!

---

## 🐛 Common Issues & Solutions

### Issue 1: TypeScript Errors about `subscription`

**Error:**
```
Property 'subscription' does not exist on type 'PrismaClient'
```

**Solution:**
1. Run: `npx prisma generate`
2. Restart TypeScript server (see above)
3. Or restart VS Code

### Issue 2: Database Not Synced

**Error:**
```
Invalid `prisma.subscription.findUnique()` invocation
```

**Solution:**
```bash
npx prisma migrate dev
```

### Issue 3: Environment Variables Missing

**Error:**
```
Environment variable not found: DATABASE_URL
```

**Solution:**
Create `.env` file in project root:
```env
DATABASE_URL="your-database-url"
NEXTAUTH_SECRET="your-secret"
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

### Issue 4: Subscription API Returns 500

**Check:**
1. Database connection is working
2. User is authenticated
3. Prisma Client is generated

**Debug:**
```bash
# Check Prisma Client
npx prisma generate

# Check database
npx prisma studio
```

---

## 📊 Database Commands

### View Database
```bash
npx prisma studio
```
Opens GUI at `http://localhost:5555`

### Reset Database (Careful!)
```bash
npx prisma migrate reset
```

### Create New Migration
```bash
npx prisma migrate dev --name your_migration_name
```

### Apply Production Migrations
```bash
npx prisma migrate deploy
```

---

## 🧪 Testing Checklist

### Basic Flow
- [ ] Login works
- [ ] Default FREE subscription created
- [ ] Can view subscription page
- [ ] Can see usage stats
- [ ] Can add songs (within limit)

### Upgrade Flow
- [ ] Can upgrade to BASIC
- [ ] Can upgrade to PREMIUM
- [ ] Badge updates in navbar
- [ ] Limits increase
- [ ] Banner disappears

### Limit Enforcement
- [ ] Cannot add songs beyond limit
- [ ] Error message shows
- [ ] Upgrade prompt appears
- [ ] Banner shows at 80%
- [ ] Button disables at limit

### UI Elements
- [ ] Pricing cards display
- [ ] Premium badge shows
- [ ] Progress bar works
- [ ] Tooltips appear
- [ ] Responsive on mobile

---

## 🎨 Customization

### Change Subscription Limits

Edit `app/lib/subscription.ts`:

```typescript
export const SUBSCRIPTION_LIMITS = {
  FREE: {
    maxMembers: 10, // Change from 5
    maxSongs: 10,   // Change from 5
    price: 0,
  },
  // ...
};
```

### Change Pricing

Edit the same file:

```typescript
BASIC: {
  price: 14.99, // Change from 9.99
  // ...
},
```

### Change Colors

Update component files with Tailwind classes:
- Purple: `purple-600`, `purple-700`
- Pink: `pink-600`, `pink-700`
- Blue: `blue-600`, `blue-700`

---

## 📝 API Testing with cURL

### Get Subscription
```bash
curl http://localhost:3000/api/subscription \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

### Upgrade Subscription
```bash
curl -X POST http://localhost:3000/api/subscription \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{"plan":"PREMIUM"}'
```

### Get Plans
```bash
curl http://localhost:3000/api/subscription/plans
```

---

## 🚀 Production Deployment

### Before Deploy

1. **Environment Variables**
   ```env
   DATABASE_URL="production-database-url"
   NEXTAUTH_URL="https://yourdomain.com"
   NEXTAUTH_SECRET="production-secret"
   ```

2. **Run Migrations**
   ```bash
   npx prisma migrate deploy
   ```

3. **Build Application**
   ```bash
   npm run build
   ```

4. **Test Build Locally**
   ```bash
   npm start
   ```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

### Deploy to Other Platforms

- **Netlify:** Add build command `npm run build`
- **Railway:** Add Procfile with `web: npm start`
- **Heroku:** Add buildpack for Next.js

---

## 💡 Pro Tips

1. **Debug Mode**
   - Check browser console for `[Subscription]` logs
   - Use Prisma Studio to view database

2. **Development**
   - Keep Prisma Studio open while developing
   - Use React DevTools to inspect component state

3. **Performance**
   - Subscription data is cached in state
   - Refreshes every 10 seconds

4. **User Experience**
   - Banner auto-dismisses when not at limit
   - Tooltips explain why buttons are disabled
   - Error messages include upgrade links

---

## 📞 Need Help?

1. Check the main documentation: `SUBSCRIPTION_FEATURE.md`
2. Review code comments in implementation files
3. Check console logs for detailed debugging
4. Open browser DevTools Network tab for API calls

---

## ✅ Quick Verification

Run these commands to verify setup:

```bash
# 1. Check Prisma is ready
npx prisma generate

# 2. Check database connection
npx prisma db pull

# 3. View current migrations
npx prisma migrate status

# 4. Start dev server
npm run dev
```

If all commands succeed, you're ready to go! 🎉
