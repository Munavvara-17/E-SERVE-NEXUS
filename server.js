require("dotenv").config();

const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs/promises");
const { randomUUID } = require("crypto");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = Number(process.env.PORT) || 3000;

const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

const DEFAULT_MENU = [
  {
    id: "m1",
    name: "Paneer Tikka",
    category: "Starters",
    description: "Smoky paneer with mint chutney",
    price: 220,
    emoji: "🧀",
    image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=900&q=85",
    available: true,
    vegetarian: true
  },
  {
    id: "m2",
    name: "Crispy Corn",
    category: "Starters",
    description: "Crunchy corn with herbs and spices",
    price: 160,
    emoji: "🌽",
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=85",
    available: true,
    vegetarian: true
  },
  {
    id: "m3",
    name: "Classic Veg Burger",
    category: "Main Course",
    description: "Crispy patty, fresh lettuce, house sauce",
    price: 190,
    emoji: "🍔",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85",
    available: true,
    vegetarian: true
  },
  {
    id: "m4",
    name: "Margherita Pizza",
    category: "Main Course",
    description: "Mozzarella, basil, tomato",
    price: 299,
    emoji: "🍕",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=85",
    available: true,
    vegetarian: true
  },
  {
    id: "m5",
    name: "Chicken Biryani",
    category: "Main Course",
    description: "Aromatic rice, spices, and chicken",
    price: 320,
    emoji: "🍛",
    image: "https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=900&q=85",
    available: true,
    vegetarian: false
  },
  {
    id: "m6",
    name: "Dal Makhani",
    category: "Main Course",
    description: "Slow-cooked black lentils",
    price: 240,
    emoji: "🥘",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=85",
    available: true,
    vegetarian: true
  },
  {
    id: "m7",
    name: "Chocolate Brownie",
    category: "Desserts",
    description: "Rich chocolate dessert",
    price: 140,
    emoji: "🍫",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=85",
    available: true,
    vegetarian: true
  },
  {
    id: "m8",
    name: "Mango Cooler",
    category: "Beverages",
    description: "Chilled mango and lime drink",
    price: 95,
    emoji: "🥭",
    image: "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=900&q=85",
    available: true,
    vegetarian: true
  }
];

const VALID_STATUSES = [
  "Placed",
  "Confirmed",
  "Preparing",
  "Ready",
  "Served",
  "Cancelled"
];

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(STORE_FILE);
  } catch {
    await fs.writeFile(
      STORE_FILE,
      JSON.stringify({ menu: DEFAULT_MENU, orders: [] }, null, 2)
    );
  }
}

async function readStore() {
  await ensureStore();

  const raw = await fs.readFile(STORE_FILE, "utf8");
  const store = JSON.parse(raw);

  // Add new image fields to existing menu records without
  // removing existing orders or changing existing prices.
  let changed = false;

  store.menu = store.menu.map(item => {
    const defaults = DEFAULT_MENU.find(entry => entry.id === item.id);

    if (!defaults) return item;

    const updated = { ...item };

    for (const key of ["image", "emoji", "vegetarian"]) {
      if (updated[key] === undefined && defaults[key] !== undefined) {
        updated[key] = defaults[key];
        changed = true;
      }
    }

    return updated;
  });

  if (changed) {
    await writeStore(store);
  }

  return store;
}

async function writeStore(store) {
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2));
}

function money(value) {
  return Math.round(value * 100) / 100;
}

app.use(express.json({ limit: "100kb" }));
app.use(express.static(PUBLIC_DIR));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, name: "E-SERVE Nexus" });
});

app.get("/api/menu", async (_req, res, next) => {
  try {
    const store = await readStore();
    res.json(store.menu.filter(item => item.available));
  } catch (error) {
    next(error);
  }
});

app.get("/api/orders", async (_req, res, next) => {
  try {
    const store = await readStore();

    res.json(
      store.orders
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 100)
    );
  } catch (error) {
    next(error);
  }
});

app.post("/api/orders", async (req, res, next) => {
  try {
    const {
      tableNumber,
      customerName = "",
      items,
      notes = ""
    } = req.body || {};

    const table = Number(tableNumber);

    if (!Number.isInteger(table) || table < 1 || table > 200) {
      return res.status(400).json({
        error: "Enter a valid table number (1–200)."
      });
    }

    if (!Array.isArray(items) || items.length < 1 || items.length > 30) {
      return res.status(400).json({
        error: "Your cart must contain between 1 and 30 item types."
      });
    }

    if (
      typeof customerName !== "string" ||
      customerName.length > 80 ||
      typeof notes !== "string" ||
      notes.length > 300
    ) {
      return res.status(400).json({
        error: "Name or notes are too long."
      });
    }

    const store = await readStore();
    const normalizedItems = [];

    for (const requested of items) {
      const menuItem = store.menu.find(
        item => item.id === requested.id && item.available
      );

      const quantity = Number(requested.quantity);

      if (!menuItem) {
        return res.status(400).json({
          error: "A selected item is unavailable. Refresh the menu."
        });
      }

      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        return res.status(400).json({
          error: "Each quantity must be between 1 and 20."
        });
      }

      normalizedItems.push({
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity,
        lineTotal: money(menuItem.price * quantity)
      });
    }

    const subtotal = money(
      normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0)
    );

    const tax = money(subtotal * 0.05);

    const order = {
      id: randomUUID(),
      orderNumber: `ES-${Date.now().toString().slice(-7)}`,
      tableNumber: table,
      customerName: customerName.trim() || "Guest",
      items: normalizedItems,
      notes: notes.trim(),
      subtotal,
      tax,
      total: money(subtotal + tax),
      status: "Placed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    store.orders.push(order);
    await writeStore(store);

    io.emit("orders:changed", { type: "created", order });

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

app.patch("/api/orders/:id/status", async (req, res, next) => {
  try {
    const status = req.body && req.body.status;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid order status." });
    }

    const store = await readStore();
    const order = store.orders.find(item => item.id === req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    const allowed = {
      Placed: ["Confirmed", "Cancelled"],
      Confirmed: ["Preparing", "Cancelled"],
      Preparing: ["Ready", "Cancelled"],
      Ready: ["Served"],
      Served: [],
      Cancelled: []
    };

    if (
      status !== order.status &&
      !allowed[order.status].includes(status)
    ) {
      return res.status(409).json({
        error: `Cannot move an order from ${order.status} to ${status}.`
      });
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();

    await writeStore(store);

    io.emit("orders:changed", { type: "updated", order });

    res.json(order);
  } catch (error) {
    next(error);
  }
});

app.get("/api/analytics", async (_req, res, next) => {
  try {
    const store = await readStore();

    const activeOrders = store.orders.filter(
      order => order.status !== "Cancelled"
    );

    const servedOrders = activeOrders.filter(
      order => order.status === "Served"
    );

    const revenue = money(
      servedOrders.reduce((sum, order) => sum + order.total, 0)
    );

    const countsByStatus = {};

    for (const status of VALID_STATUSES) {
      countsByStatus[status] = store.orders.filter(
        order => order.status === status
      ).length;
    }

    const popular = {};

    for (const order of activeOrders) {
      for (const item of order.items) {
        popular[item.name] = (popular[item.name] || 0) + item.quantity;
      }
    }

    const topItems = Object.entries(popular)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, quantity]) => ({ name, quantity }));

    res.json({
      totalOrders: store.orders.length,
      activeOrders: store.orders.filter(
        order => !["Served", "Cancelled"].includes(order.status)
      ).length,
      servedOrders: servedOrders.length,
      revenue,
      countsByStatus,
      topItems
    });
  } catch (error) {
    next(error);
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    error: "Something went wrong on the server."
  });
});

io.on("connection", socket => {
  socket.emit("connection:ready", { connected: true });
});

ensureStore()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`E-SERVE Nexus running at http://localhost:${PORT}`);
    });
  })
  .catch(error => {
    console.error("Could not initialize data store:", error);
    process.exit(1);
  });
