const state = {
  menu: [],
  cart: new Map(),
  category: "All",
  orders: [],
  currentOrder: null,
  view: "customer"
};

const $ = selector => document.querySelector(selector);

const money = value =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  }).format(value);

const escapeHtml = value =>
  String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));

let toastTimer;

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(
    () => element.classList.remove("show"),
    2800
  );
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

// Switch between customer, kitchen, and admin screens.
function setView(view) {
  state.view = view;

  document.querySelectorAll(".view").forEach(section => {
    section.classList.add("hidden");
  });

  const target = {
    customer: "#customerView",
    kitchen: "#kitchenView",
    admin: "#adminView"
  }[view] || "#customerView";

  $(target).classList.remove("hidden");

  document.querySelectorAll(".nav-button").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.view === view
    );
  });

  if (view === "kitchen") loadKitchen();
  if (view === "admin") loadAdmin();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Render category filters.
function renderFilters() {
  const categories = [
    "All",
    ...new Set(state.menu.map(item => item.category))
  ];

  $("#categoryFilters").innerHTML = categories.map(category => `
    <button
      class="filter-button ${
        state.category === category ? "active" : ""
      }"
      data-category="${escapeHtml(category)}"
    >
      ${escapeHtml(category)}
    </button>
  `).join("");
}

// Render menu cards using real food photographs.
function renderMenu() {
  const query = $("#searchInput").value.trim().toLowerCase();

  const items = state.menu.filter(item =>
    (state.category === "All" ||
      item.category === state.category) &&
    `${item.name} ${item.description} ${item.category}`
      .toLowerCase()
      .includes(query)
  );

  $("#menuGrid").innerHTML = items.length
    ? items.map((item, index) => `
      <article
        class="food-card reveal"
        style="--card-index: ${index}"
      >
        <div class="food-art">
          <img
            class="food-image"
            src="${escapeHtml(item.image || "")}"
            alt="${escapeHtml(item.name)}"
            loading="lazy"
            decoding="async"
            onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"
          >

          <span
            class="food-image-fallback"
            style="display:${item.image ? "none" : "grid"}"
            aria-hidden="true"
          >
            ${escapeHtml(item.emoji || "🍽️")}
          </span>

          <span class="veg-label ${
            item.vegetarian ? "veg" : "non-veg"
          }">
            <span></span>
            ${item.vegetarian ? "VEG" : "NON-VEG"}
          </span>

          <span class="food-category">
            ${escapeHtml(item.category)}
          </span>
        </div>

        <div class="food-info">
          <h3>${escapeHtml(item.name)}</h3>

          <p>${escapeHtml(item.description)}</p>

          <div class="food-bottom">
            <div class="price-block">
              <span class="price-caption">PRICE</span>
              <span class="food-price">${money(item.price)}</span>
            </div>

            <button
              class="add-button"
              data-add="${escapeHtml(item.id)}"
              aria-label="Add ${escapeHtml(item.name)} to cart"
              title="Add to cart"
            >
              <span>+</span>
            </button>
          </div>
        </div>
      </article>
    `).join("")
    : `<div class="empty-state">
         No dishes found. Try another search or category.
       </div>`;

  observeRevealElements();
}

// Animate cards when they enter the viewport.
let revealObserver;

function observeRevealElements() {
  const elements = document.querySelectorAll(
    ".reveal:not(.revealed)"
  );

  if (!("IntersectionObserver" in window)) {
    elements.forEach(element => element.classList.add("revealed"));
    return;
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
  }

  elements.forEach(element => revealObserver.observe(element));
}

// Cart management.
function addToCart(id, delta = 1) {
  const current = state.cart.get(id) || 0;
  const next = current + delta;

  if (next <= 0) {
    state.cart.delete(id);
  } else if (next <= 20) {
    state.cart.set(id, next);
  } else {
    toast("Maximum quantity is 20 per dish.");
    return;
  }

  renderCart();

  if (delta > 0) {
    toast("Added to your order.");
  }
}

function renderCart() {
  const lines = [...state.cart.entries()]
    .map(([id, quantity]) => {
      const item = state.menu.find(menuItem => menuItem.id === id);

      return item
        ? {
            ...item,
            quantity,
            lineTotal: item.price * quantity
          }
        : null;
    })
    .filter(Boolean);

  const count = lines.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const subtotal = lines.reduce(
    (sum, item) => sum + item.lineTotal,
    0
  );

  const tax = subtotal * 0.05;

  $("#cartCount").textContent =
    `${count} ${count === 1 ? "item" : "items"}`;

  $("#subtotal").textContent = money(subtotal);
  $("#tax").textContent = money(tax);
  $("#total").textContent = money(subtotal + tax);

  $("#placeOrderButton").disabled = lines.length === 0;

  $("#cartItems").innerHTML = lines.length
    ? lines.map(item => `
      <div class="cart-line">
        <div class="cart-product">
          <strong>${escapeHtml(item.name)}</strong>
          <small>${money(item.price)} each</small>
        </div>

        <div class="quantity-control">
          <button
            class="quantity-button"
            data-change="${escapeHtml(item.id)}"
            data-delta="-1"
            aria-label="Decrease quantity"
          >−</button>

          <span>${item.quantity}</span>

          <button
            class="quantity-button"
            data-change="${escapeHtml(item.id)}"
            data-delta="1"
            aria-label="Increase quantity"
          >+</button>
        </div>

        <span class="line-total">
          ${money(item.lineTotal)}
        </span>
      </div>
    `).join("")
    : `<div class="cart-empty">
         <span>🛍️</span>
         <p>Your cart is waiting for something delicious.</p>
       </div>`;
}

// Submit a new order to the backend.
async function placeOrder() {
  const items = [...state.cart.entries()].map(
    ([id, quantity]) => ({ id, quantity })
  );

  const button = $("#placeOrderButton");
  button.disabled = true;
  button.textContent = "Placing order…";

  try {
    const order = await api("/api/orders", {
      method: "POST",
      body: JSON.stringify({
        tableNumber: Number($("#tableNumber").value),
        customerName: $("#customerName").value,
        notes: $("#orderNotes").value,
        items
      })
    });

    state.cart.clear();
    renderCart();
    renderTracking(order);

    await loadOrders();

    toast(`Order ${order.orderNumber} placed successfully.`);

    $("#trackingSection").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  } catch (error) {
    toast(error.message);
  } finally {
    button.innerHTML = 'Place order <span>→</span>';
    button.disabled = state.cart.size === 0;
  }
}

// Order status tracking.
function renderTracking(order) {
  state.currentOrder = order;

  $("#trackingSection").classList.remove("hidden");

  $("#trackingIntro").textContent =
    `Order ${order.orderNumber} · Table ${order.tableNumber} · ` +
    `Total ${money(order.total)} · Current status: ${order.status}`;

  const stages = [
    "Placed",
    "Confirmed",
    "Preparing",
    "Ready",
    "Served"
  ];

  const currentIndex = stages.indexOf(order.status);

  $("#trackingTimeline").innerHTML =
    order.status === "Cancelled"
      ? `<p class="muted">
           This order was cancelled. Contact the restaurant team
           if you need help.
         </p>`
      : stages.map((stage, index) => `
          <div class="timeline-step ${
            index <= currentIndex ? "done" : ""
          }">
            ${stage}
          </div>
        `).join("");
}

function orderNextStatus(order) {
  const next = {
    Placed: "Confirmed",
    Confirmed: "Preparing",
    Preparing: "Ready",
    Ready: "Served"
  };

  return next[order.status] || null;
}

// Kitchen dashboard.
function renderKitchen() {
  const active = state.orders.filter(order =>
    !["Served", "Cancelled"].includes(order.status)
  );

  const counts = [
    ["New", state.orders.filter(o => o.status === "Placed").length],
    ["Preparing", state.orders.filter(o => o.status === "Preparing").length],
    ["Ready", state.orders.filter(o => o.status === "Ready").length],
    ["Active", active.length]
  ];

  $("#kitchenStats").innerHTML = counts.map(([label, value]) => `
    <div class="stat-card">
      <span>${label} orders</span>
      <b>${value}</b>
    </div>
  `).join("");

  $("#kitchenOrders").innerHTML = active.length
    ? active.map(order => {
        const next = orderNextStatus(order);

        const options = [
          "Placed",
          "Confirmed",
          "Preparing",
          "Ready",
          "Served",
          "Cancelled"
        ];

        return `
          <article class="order-card">
            <div class="order-card-head">
              <div>
                <h3>${escapeHtml(order.orderNumber)}</h3>
                <small>
                  Table ${order.tableNumber} ·
                  ${new Date(order.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </small>
              </div>

              <span class="status-badge">
                ${escapeHtml(order.status)}
              </span>
            </div>

            <div class="order-items">
              ${order.items.map(item => `
                <div>
                  ${item.quantity} × ${escapeHtml(item.name)}
                </div>
              `).join("")}

              ${order.notes
                ? `<p><b>Note:</b> ${escapeHtml(order.notes)}</p>`
                : ""}
            </div>

            <div class="order-card-foot">
              <b>${money(order.total)}</b>

              <select
                data-status-order="${escapeHtml(order.id)}"
                aria-label="Update order status"
              >
                ${options.map(status => `
                  <option value="${status}" ${
                    status === order.status ? "selected" : ""
                  }>
                    ${status}
                  </option>
                `).join("")}
              </select>
            </div>

            ${next ? `
              <button
                class="primary-button full-width"
                data-next-order="${escapeHtml(order.id)}"
                data-next-status="${next}"
              >
                Mark ${next} →
              </button>
            ` : ""}
          </article>
        `;
      }).join("")
    : `<div class="empty-state">
         No active orders. New customer orders will appear here live.
       </div>`;
}

// Admin overview.
function renderAdmin(analytics) {
  const cards = [
    ["Total orders", analytics.totalOrders],
    ["Active orders", analytics.activeOrders],
    ["Orders served", analytics.servedOrders],
    ["Revenue from served orders", money(analytics.revenue)]
  ];

  $("#analyticsCards").innerHTML = cards.map(([label, value]) => `
    <div class="analytics-card">
      <span>${label}</span>
      <b>${value}</b>
    </div>
  `).join("");

  $("#popularItems").innerHTML = analytics.topItems.length
    ? analytics.topItems.map(item => `
        <div class="popular-row">
          <span>${escapeHtml(item.name)}</span>
          <span>${item.quantity} sold</span>
        </div>
      `).join("")
    : `<p class="muted">Popular dishes will appear after orders.</p>`;

  $("#recentOrders").innerHTML = state.orders.slice(0, 7).length
    ? state.orders.slice(0, 7).map(order => `
        <div class="recent-row">
          <span>
            <b>${escapeHtml(order.orderNumber)}</b><br>
            <small>
              Table ${order.tableNumber} ·
              ${escapeHtml(order.status)}
            </small>
          </span>
          <span>
            ${money(order.total)}<br>
            ${new Date(order.createdAt).toLocaleDateString()}
          </span>
        </div>
      `).join("")
    : `<p class="muted">No orders yet.</p>`;
}

async function loadMenu() {
  state.menu = await api("/api/menu");

  renderFilters();
  renderMenu();
  renderCart();
}

async function loadOrders() {
  state.orders = await api("/api/orders");

  if (state.view === "kitchen") {
    renderKitchen();
  }

  if (state.view === "admin") {
    renderAdmin(await api("/api/analytics"));
  }

  if (state.currentOrder) {
    const latest = state.orders.find(
      order => order.id === state.currentOrder.id
    );

    if (latest) renderTracking(latest);
  }
}

async function loadKitchen() {
  try {
    await loadOrders();
  } catch (error) {
    toast(error.message);
  }
}

async function loadAdmin() {
  try {
    await loadOrders();
    renderAdmin(await api("/api/analytics"));
  } catch (error) {
    toast(error.message);
  }
}

async function updateStatus(id, status) {
  try {
    await api(
      `/api/orders/${encodeURIComponent(id)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status })
      }
    );

    await loadOrders();
    toast(`Order updated to ${status}.`);
  } catch (error) {
    toast(error.message);
    await loadOrders();
  }
}

// Event delegation keeps dynamically generated buttons working.
document.addEventListener("click", event => {
  const viewButton = event.target.closest("[data-view]");

  if (viewButton) {
    setView(viewButton.dataset.view);
    return;
  }

  const filterButton = event.target.closest("[data-category]");

  if (filterButton) {
    state.category = filterButton.dataset.category;
    renderFilters();
    renderMenu();
    return;
  }

  const addButton = event.target.closest("[data-add]");

  if (addButton) {
    addToCart(addButton.dataset.add);
    return;
  }

  const changeButton = event.target.closest("[data-change]");

  if (changeButton) {
    addToCart(
      changeButton.dataset.change,
      Number(changeButton.dataset.delta)
    );
    return;
  }

  const nextButton = event.target.closest("[data-next-order]");

  if (nextButton) {
    updateStatus(
      nextButton.dataset.nextOrder,
      nextButton.dataset.nextStatus
    );
  }
});

document.addEventListener("change", event => {
  if (event.target.matches("[data-status-order]")) {
    updateStatus(
      event.target.dataset.statusOrder,
      event.target.value
    );
  }
});

$("#searchInput").addEventListener("input", renderMenu);
$("#placeOrderButton").addEventListener("click", placeOrder);
$("#refreshKitchen").addEventListener("click", loadKitchen);
$("#refreshAdmin").addEventListener("click", loadAdmin);

// Preselect the table when the customer opens a QR table URL.
const queryTable = new URLSearchParams(
  window.location.search
).get("table");

if (
  queryTable &&
  /^\d{1,3}$/.test(queryTable) &&
  Number(queryTable) >= 1 &&
  Number(queryTable) <= 200
) {
  $("#tableNumber").value = Number(queryTable);
}

$("#year").textContent = new Date().getFullYear();

async function init() {
  try {
    await loadMenu();
    await loadOrders();
  } catch (error) {
    $("#menuGrid").innerHTML = `
      <p class="muted">
        Could not load the menu. Make sure the server is running
        and refresh this page.
      </p>
    `;

    toast(error.message);
  }

  if (typeof window.io === "function") {
    const socket = window.io();

    socket.on("connect", () => {
      $("#connectionDot").classList.add("online");
      $("#connectionText").textContent = "Live updates on";
    });

    socket.on("disconnect", () => {
      $("#connectionDot").classList.remove("online");
      $("#connectionText").textContent = "Reconnecting";
    });

    socket.on("orders:changed", async payload => {
      await loadOrders();

      if (
        payload.type === "created" &&
        state.view === "kitchen"
      ) {
        toast(`New order: ${payload.order.orderNumber}`);
      }
    });
  }
}

init();
