# Retail Store Business Software

A full-stack retail store management system: point-of-sale, inventory,
purchasing, customers, staff accounts, and reporting — built as a
production-shaped monorepo you can run locally in minutes.

## Stack

- **Backend**: Node.js, Express, TypeScript, Prisma ORM, SQLite (swap the
  `DATABASE_URL` for Postgres/MySQL in production), JWT auth, Zod validation
- **Frontend**: React 18, Vite, TypeScript, React Router, Tailwind CSS, Axios

## Features

- **Authentication & roles** — JWT login, three roles (`ADMIN`, `MANAGER`,
  `CASHIER`) with route- and endpoint-level authorization
- **Point of Sale (POS)** — searchable product grid, cart, discounts, tax,
  multiple payment methods, invoice generation, automatic stock deduction,
  loyalty points on checkout
- **Inventory management** — products, categories, SKUs, cost/selling price,
  tax rate, reorder levels, low-stock alerts, manual stock adjustments
- **Purchasing** — suppliers, purchase orders, receiving stock (auto stock
  increment + cost price update on receipt)
- **Customers** — customer directory with loyalty points and purchase history
- **Sales history** — invoice lookup, sale detail, voiding a sale (restores
  stock)
- **Reporting** — dashboard KPIs, daily revenue charts, top products,
  inventory valuation, low-stock report
- **Staff management** (admin only) — create/edit/deactivate/delete users

## Project layout

```
server/   Express + Prisma API (port 4000)
client/   React + Vite SPA (port 5173, proxies /api to the server)
```

## Getting started

### 1. Backend

```bash
cd server
cp .env.example .env
npm install
npm run prisma:migrate   # creates the SQLite database + tables
npm run seed             # demo users, categories, suppliers, products, customers
npm run dev              # starts the API on http://localhost:4000
```

Demo accounts created by the seed script (password for all: `password123`):

| Role    | Email               |
| ------- | -------------------- |
| Admin   | admin@store.com      |
| Manager | manager@store.com    |
| Cashier | cashier@store.com    |

### 2. Frontend

```bash
cd client
npm install
npm run dev               # starts the app on http://localhost:5173
```

Open `http://localhost:5173` and log in with one of the demo accounts.

### Production build

```bash
# Backend
cd server && npm run build && npm start

# Frontend
cd client && npm run build   # outputs static assets to client/dist
```

For production, point `DATABASE_URL` in `server/.env` at a real Postgres/MySQL
instance, set a strong `JWT_SECRET`, and serve `client/dist` from a static host
or CDN with the API reverse-proxied at `/api`.

## Role permissions

| Area              | Admin | Manager | Cashier |
| ----------------- | :---: | :-----: | :-----: |
| Dashboard         | ✅    | ✅      | ✅      |
| POS / checkout    | ✅    | ✅      | ✅      |
| Sales history     | ✅    | ✅      | ✅      |
| Void a sale       | ✅    | ✅      | ❌      |
| Products          | ✅    | ✅      | 👁 view via POS |
| Categories        | ✅    | ✅      | ❌      |
| Suppliers         | ✅    | ✅      | ❌      |
| Purchase orders   | ✅    | ✅      | ❌      |
| Customers         | ✅    | ✅      | ✅ (create/edit) |
| Reports           | ✅    | ✅      | ❌      |
| Staff / users     | ✅    | ❌      | ❌      |

## API overview

All endpoints are namespaced under `/api` and (except `/auth/login` and
`/health`) require a `Authorization: Bearer <token>` header.

- `POST /api/auth/login`, `GET /api/auth/me`
- `GET/POST/PUT/DELETE /api/users` (admin only)
- `GET/POST/PUT/DELETE /api/categories`
- `GET/POST/PUT/DELETE /api/suppliers`
- `GET/POST/PUT/DELETE /api/products`, `POST /api/products/:id/adjust`
- `GET/POST/PUT/DELETE /api/customers`
- `GET/POST /api/sales`, `GET /api/sales/:id`, `POST /api/sales/:id/void`
- `GET/POST /api/purchase-orders`, `POST /api/purchase-orders/:id/receive`,
  `POST /api/purchase-orders/:id/cancel`
- `GET /api/reports/dashboard`, `GET /api/reports/sales`,
  `GET /api/reports/inventory`

## Data model

`User`, `Category`, `Supplier`, `Product`, `Customer`, `Sale` + `SaleItem`,
`PurchaseOrder` + `PurchaseOrderItem`, `StockAdjustment` — see
`server/prisma/schema.prisma` for the full schema.
