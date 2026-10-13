# E-SERVE Nexus

A beginner-friendly restaurant ordering MVP built with HTML, CSS, JavaScript, Node.js, Express, and Socket.IO.

## Features
- Responsive customer menu with search and category filters
- Cart and server-side price calculation
- Table-number-based ordering
- Live order updates with Socket.IO
- Kitchen dashboard to advance order status
- Admin summary with revenue and order counts
- JSON-file persistence for a zero-database local setup

> This is a learning/demo starter. Before public production use, add staff authentication/authorization, rate limiting, stronger validation, a real database, payment-provider verification, and privacy/security review.

## Requirements
- Node.js 18+
- VS Code

## Run locally
1. Extract the ZIP and open the `eserve-nexus` folder in VS Code.
2. Open Terminal → New Terminal.
3. Run `npm install`.
4. Optional: copy `.env.example` to `.env`.
5. Run `npm run dev` (or `npm start`).
6. Open `http://localhost:3000`.

The app creates `data/store.json` on first run. Do not commit real customer data.

## Project structure
```text
eserve-nexus/
├── data/
│   └── .gitkeep
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## API routes
- `GET /api/menu` — list available menu items
- `GET /api/orders` — list recent orders (demo; protect this in production)
- `POST /api/orders` — create an order
- `PATCH /api/orders/:id/status` — update order status (demo; protect this in production)
- `GET /api/analytics` — summary metrics (demo; protect this in production)

## QR table links
A QR code can point to `https://your-deployed-domain.example/?table=5`. Locally, test with `http://localhost:3000/?table=5`.
