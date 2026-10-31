# ThreadSwap: Clothing Exchange & Swap Marketplace
Stack: React (served from `public/`), Node.js + Express, MongoDB (Mongoose), JWT auth, bcrypt.

## 1. Run on your computer
Install Node.js 18+ and MongoDB (or use a free MongoDB Atlas URI).
```bash
cd threadswap
npm install
cp .env.example .env        # then edit MONGO_URI and JWT_SECRET
npm run seed                # loads realistic clothing data and demo accounts
npm start                   # open http://localhost:3000
```
Logins: member `demo@swap.in` / `Demo@1234`, admin `admin@swap.in` / `Admin@123`.

## 2. Put the code on GitHub
```bash
git init
git add .
git commit -m "ThreadSwap clothing exchange marketplace"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/threadswap.git
git push -u origin main
```

## 3. Create the database (MongoDB Atlas, free)
1. Create a free M0 cluster at mongodb.com/atlas.
2. Database Access: add a user and password.
3. Network Access: allow `0.0.0.0/0`.
4. Connect, Drivers: copy the URI, e.g. `mongodb+srv://USER:PASS@cluster0.xxxx.mongodb.net/threadswap`.
5. Load the demo data once from your computer: put that URI in `.env`, then run `npm run seed`.

## 4. Deploy live (Render, free)
1. render.com, New, Web Service, connect your GitHub repo.
2. Build command: `npm install`. Start command: `npm start`.
3. Environment variables: `MONGO_URI` (Atlas URI) and `JWT_SECRET` (any long random text).
4. Deploy. Submit the `https://threadswap.onrender.com` style link. Test login, a swap, chat and admin on the live link first.

## Pages
Login, Clothing Listings, Item Detail, Swap Request, Chat, User Dashboard, Admin Panel.

## API summary
`/api/auth/*`, `/api/items`, `/api/value`, `/api/swaps/*` (respond, cancel, confirm, dispute, messages), `/api/admin/*` (stats, users, items, swaps).
