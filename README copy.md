# Purchase Order (Next.js + MongoDB, JavaScript)

Single-stack Next.js App Router app with built-in API routes (no separate backend, no TypeScript).

## 🚀 Getting Started

Prereqs: Node.js 18.17+ and npm.

Install deps:
```bash
npm install
```
Run dev server:
```bash
npm run dev
```
Open http://localhost:3000

## 📁 Project Structure

```
purchase-order/
├── src/
│   ├── app/                      # App Router
│   │   ├── layout.js             # Root layout
│   │   ├── page.js               # Dashboard UI
│   │   ├── bot/page.js           # Bot page UI
│   │   └── api/                  # Backend layer (Next API routes)
│   │       ├── purchase-orders/route.js  # CRUD APIs
│   │       ├── auth/route.js
│   │       ├── users/route.js
│   │       ├── bot/route.js              # Bot API
│   │       └── test-db/route.js
│   ├── components/               # UI components
│   │   ├── PurchaseOrderForm.js
│   │   ├── PurchaseOrderTable.js
│   │   ├── ChatBot.js
│   │   └── ui/                   # (scaffold)
│   ├── lib/                      # Core utilities
│   │   ├── mongodb.js            # Mongo connection
│   │   └── auth.js               # Auth helpers (stub)
│   ├── services/                 # Business logic
│   │   ├── purchaseOrderService.js
│   │   └── botService.js
│   └── models/                   # Mongoose models
│       ├── PurchaseOrder.js
│       └── User.js
├── public/                       # Static assets
├── .env.local                    # Env vars (e.g., MONGODB_URI)
├── package.json                  # Dependencies (JS only)
├── next.config.mjs
├── tailwind.config.mjs
└── README.md
```

## 🛠️ Tech Stack
- Next.js 15 (App Router) + React 19
- JavaScript only (no TypeScript)
- Tailwind CSS
- MongoDB via Mongoose

## 📝 Scripts
- `npm run dev` – start Next.js (frontend + API)
- `npm run build` – production build
- `npm start` – start production server
- `npm run lint` – ESLint

## 🌐 Environment
Create `.env.local` with at least:
```
MONGODB_URI=mongodb://localhost:27017/purchase_order_db
```

## 🚢 Deployment
Deploy on Vercel or any Node host; only the Next.js app is needed.
