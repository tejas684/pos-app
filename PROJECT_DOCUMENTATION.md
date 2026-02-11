# FoodGo – Complete Project Documentation

A single reference document for the **FoodGo** (Point of Sale) project: technologies, structure, how the POS works, UI, and common questions.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technologies Used & Why](#2-technologies-used--why)
3. [Project Structure](#3-project-structure)
4. [How the POS System Works](#4-how-the-pos-system-works)
5. [UI & Layout](#5-ui--layout)
6. [Component Architecture](#6-component-architecture)
7. [State Management & Data Flow](#7-state-management--data-flow)
8. [Types & Data Models](#8-types--data-models)
9. [Configuration](#9-configuration)
10. [Running & Developing](#10-running--developing)
11. [Frequently Asked Questions](#11-frequently-asked-questions)
12. [Future Enhancements](#12-future-enhancements)

---

## 1. Project Overview

### What is FoodGo?

**FoodGo** is a **Point of Sale (POS)** web application for **restaurants and retail**. Staff use it to:

- Create and manage orders (dine-in, take-away, delivery)
- Manage tables and assign orders to tables
- Browse and add products to a cart (with options/modifiers)
- Apply discounts and calculate tax
- Process payments (Cash, Card, Mobile Wallet)
- Track order status (pending → preparing → ready → served → completed)
- View active orders and print Kitchen Order Tickets (KOT)

### Project Name & Version

- **Name**: `foodgo` (from `package.json`)
- **Version**: 1.0.0
- **Type**: Single-page POS interface (no backend; data in browser `localStorage`)

### Key Characteristics

- **Frontend-only**: Next.js + React app; no API or database (yet).
- **Client-side state**: All logic and state live in the browser (custom hook + `localStorage`).
- **Responsive**: Desktop (three-panel layout) and mobile (tabbed panels).
- **TypeScript**: Full type safety and clear data structures.

---

## 2. Technologies Used & Why

### Core Stack

| Technology   | Version  | Purpose | Why chosen |
|-------------|----------|---------|------------|
| **Next.js** | 14.x     | React framework, routing, build | App Router, file-based routing, good DX and production defaults. |
| **React**   | 18.2     | UI library | Component-based UI, hooks, wide ecosystem. |
| **TypeScript** | 5.x  | Typed JavaScript | Catch errors at compile time, better refactors and IDE support. |
| **Tailwind CSS** | 3.3 | Styling | Utility-first CSS, fast UI building, consistent design tokens. |

### Supporting Tools

| Technology | Purpose |
|------------|--------|
| **PostCSS** | Process Tailwind and add vendor prefixes. |
| **Autoprefixer** | Add browser-prefixed CSS. |
| **ESLint** + **eslint-config-next** | Linting and Next.js-specific rules. |
| **@types/node, @types/react, @types/react-dom** | TypeScript types for Node and React. |

### Why These Choices?

- **Next.js**: Single app with one main route (`/`). Next.js gives a solid React setup, dev server, and production build without extra config.
- **TypeScript**: POS has many entities (Order, CartItem, Table, etc.). Types make the codebase easier to maintain and less error-prone.
- **Tailwind**: Many similar UI pieces (buttons, cards, modals). Tailwind + a small theme (e.g. `primary`, `accent`, `success`) keeps the UI consistent and quick to build.
- **Custom hook (`usePOS`)**: All POS state and logic in one hook keeps the main page simple and makes the flow easy to follow.

---

## 3. Project Structure

### Directory Tree (Relevant Parts)

```
reactnextjs/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (HTML, fonts, ToastProvider)
│   ├── page.tsx                  # Main POS page (orchestrates everything)
│   └── globals.css               # Global styles + Tailwind
│
├── components/
│   ├── POS/                      # POS-specific components (20 files)
│   │   ├── POSHeader.tsx         # Top bar: stats, time, actions
│   │   ├── OrderManagementPanel.tsx   # Cart + order details + actions
│   │   ├── ProductCatalogPanel.tsx     # Search, filters, product grid
│   │   ├── ProductCatalog.tsx          # Product grid/cards
│   │   ├── ExecutionOrdersSidebar.tsx # Active orders list
│   │   ├── OrderSummary.tsx            # Subtotal, discount, tax, total
│   │   ├── OrderItemsTable.tsx         # Cart lines (qty, price, edit)
│   │   ├── CustomerWaiterInfo.tsx       # Customer & waiter selection
│   │   ├── PaymentModal.tsx            # Payment method & amount
│   │   ├── DiscountModal.tsx           # Order-level discount
│   │   ├── AddCustomerModal.tsx        # Add/edit customer
│   │   ├── TablesModal.tsx              # Table selection (dine-in)
│   │   ├── ProductOptionsModal.tsx      # Size, modifiers, notes
│   │   ├── CartItemOptionsModal.tsx     # Edit cart line
│   │   ├── EditItemModal.tsx            # Edit item (alternative path)
│   │   ├── RepeatCustomisationModal.tsx # Repeat add with same options
│   │   ├── OrderDetailsModal.tsx        # View order details
│   │   ├── KitchenOrderTicket.tsx       # KOT view/print
│   │   ├── QuickActionsMenu.tsx         # Floating quick actions
│   │   └── KeyboardShortcuts.tsx        # Shortcuts help modal
│   │
│   └── ui/                       # Shared UI
│       ├── Toast.tsx             # Toasts (success, error, etc.)
│       └── InputModal.tsx        # Generic input modal
│
├── hooks/
│   └── usePOS.ts                 # All POS state and business logic
│
├── types/
│   └── pos.ts                    # Order, CartItem, Table, OrderType, etc.
│
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── next-env.d.ts
└── .gitignore
```

### What Each Area Does

- **`app/`**: Entry point and global shell. `layout.tsx` wraps the app; `page.tsx` is the only route and renders the full POS.
- **`components/POS/`**: All POS screens and modals (header, cart panel, product panel, sidebars, payment, discount, tables, etc.).
- **`components/ui/`**: Reusable pieces (Toast, InputModal) used across the app.
- **`hooks/usePOS.ts`**: Single source of truth for cart, orders, tables, modals, and all POS actions.
- **`types/pos.ts`**: Shared TypeScript types and helpers (e.g. cart item identity, customization snapshot).

---

## 4. How the POS System Works

### High-Level User Flow

1. **Open app** → `app/page.tsx` loads → `usePOS` initializes and loads orders from `localStorage`.
2. **Browse products** → User uses search/filters in `ProductCatalogPanel`, clicks a product.
3. **Add to cart** → If the product has options (sizes/modifiers), `ProductOptionsModal` opens; otherwise item is added directly. Same product + same customization can merge into one line (quantity increased).
4. **Set order context** → User picks order type (dine-in / take-away / delivery), and for dine-in selects a table. Optionally selects/creates customer and assigns waiter.
5. **Place order** → User clicks “Place Order”. Validation: cart not empty; for dine-in, table and waiter required. A new `Order` is created, appended to `orders`, cart is cleared, table marked occupied, and KOT modal can open.
6. **Track & modify** → Active orders appear in `ExecutionOrdersSidebar`. User can change status, modify order, or open “Account” (payment).
7. **Payment** → User opens Payment (from cart or from a running order). In `PaymentModal` they choose method (Cash/Card/Mobile), enter amount. On success, order is marked completed, table freed (if dine-in), and data is persisted to `localStorage`.

### Order Lifecycle (Statuses)

```
pending → preparing → ready → served → completed
   ↓
cancelled (at any time)
```

- **pending**: Just placed.
- **preparing**: Kitchen is preparing.
- **ready**: Ready for pickup/serve.
- **served**: Served to guest.
- **completed**: Paid and closed.
- **cancelled**: No longer active.

Only **pending / preparing / ready / served** keep a table “occupied”. **completed** or **cancelled** frees the table.

### Cart Logic (Customization & Merging)

- Each product can have **sizes** and **modifiers**. These are stored as a **customization snapshot** on the cart line (not on the product).
- Two lines are “the same” if **product id** and **customization snapshot** (size, modifiers, notes) match. Adding the same product with the same options **increments quantity**; different options create a **new line**.
- Helpers in `types/pos.ts`: `getCartItemCustomization`, `areCartItemCustomizationsEqual`, `areCartItemsIdentical`.

### Calculations

- **Subtotal**: Sum of (line price × quantity) per cart line (line price can include size/modifiers).
- **Discount**: Order-level discount (percentage of subtotal).
- **Tax**: e.g. `(Subtotal - Discount) × taxRate` (tax rate from env, default 10%).
- **Total**: Subtotal - Discount + Tax + optional Charge + Tips.

### Data Persistence

- **Orders**: Saved in `localStorage` under key `pos_orders`. Loaded on app init; saved whenever `orders` change.
- **Stale orders**: On load, orders that are not completed/cancelled and older than 12 hours are auto-marked completed so tables free up.
- **Tables**: Status (available/occupied) is derived from active orders in memory; not stored separately.
- **Customers**: Can be stored in `localStorage` (e.g. `pos_customers`) if the app uses it; the POS supports “Walk-in Customer” and add/edit customer.

---

## 5. UI & Layout

### Desktop (e.g. ≥ 1024px)

- **Top**: `POSHeader` – stats (e.g. active orders, revenue), time, quick actions.
- **Left**: `ExecutionOrdersSidebar` – list of active orders; filter by status; actions (Modify, View, Cancel, Pay, Print KOT).
- **Center**: `OrderManagementPanel` – customer/waiter, order type, table (dine-in), cart table (`OrderItemsTable`), order summary (`OrderSummary`), Place Order / Update Order / Payment.
- **Right**: `ProductCatalogPanel` – search, category filter, product grid (`ProductCatalog`).
- **Floating**: `QuickActionsMenu` – fast access to Discount, Payment, Table, Clear Cart, etc.

So: **three main columns** (Execution | Order + Cart | Products) plus header and quick actions.

### Mobile (< 1024px)

- **Tabs** (e.g. Dashboard, Orders, Cart, Products) switch between:
  - Dashboard (overview)
  - Execution orders
  - Cart / order panel
  - Product catalog
- One panel visible at a time; layout is stacked/tabbed instead of three columns.

### Modals (Overlays)

- **PaymentModal**: Payment method, amount, change (cash); confirm.
- **DiscountModal**: Order-level discount (percentage).
- **AddCustomerModal**: Add or edit customer (name, phone, etc.).
- **TablesModal**: Grid of tables (e.g. 18 tables); green = available, red = occupied; select for dine-in.
- **ProductOptionsModal**: Choose size, modifiers, notes before adding to cart.
- **CartItemOptionsModal** / **EditItemModal**: Edit quantity, discount, notes (or full options) for a cart line.
- **RepeatCustomisationModal**: Add another unit with same customization (e.g. “same as previous”).
- **OrderDetailsModal**: Read-only order info and items.
- **KitchenOrderTicket**: KOT content; print or close.
- **KeyboardShortcuts**: List of shortcuts (? or Shift+/).

### Styling (Tailwind & globals)

- **Theme**: Custom palette in `tailwind.config.js` – primary (blue), accent (purple), success, warning, danger, neutral.
- **globals.css**: Tailwind directives, CSS variables, body background (gradient), custom scrollbar, and any shared component classes.
- **Font**: Inter (from `next/font/google`) applied in `layout.tsx`.

---

## 6. Component Architecture

### Roles

- **Container**: `app/page.tsx` – holds `usePOS()`, modal visibility state, and passes props/callbacks to all POS components. No business logic; only wiring and layout.
- **Presentational**: Components under `components/POS/` and `components/ui/` – receive data and callbacks via props; no direct state management.
- **Logic**: `hooks/usePOS.ts` – all state (cart, orders, tables, customer, waiter, modals, etc.) and all actions (addToCart, handlePlaceOrder, handlePayment, etc.).

### Data Flow

- **Down**: State and computed values from `usePOS` → `page.tsx` → props to children.
- **Up**: User events in children → callbacks (e.g. `onPlaceOrder`, `onProductSelect`) → handlers in `page.tsx` that call `usePOS` functions (e.g. `handlePlaceOrder`, `handleProductSelect`).
- **Cross-cutting**: Toast via React Context (`ToastProvider` in `layout.tsx`); any component can show toasts without prop drilling.

### Key Components Summary

| Component | Role |
|-----------|------|
| `POSHeader` | Stats, time, global actions. |
| `OrderManagementPanel` | Cart + summary + customer/waiter/table/type + Place Order / Update / Payment. |
| `OrderItemsTable` | Renders cart lines; quantity controls; edit/remove. |
| `OrderSummary` | Subtotal, discount, tax, total (and charge/tips if used). |
| `CustomerWaiterInfo` | Customer dropdown + “Add customer”; waiter selection. |
| `ProductCatalogPanel` | Search, category filter, product grid. |
| `ProductCatalog` | Grid of product cards; click → add or open options modal. |
| `ExecutionOrdersSidebar` | List of non-completed orders; status filters; Modify, Pay, Cancel, KOT. |
| `PaymentModal` | Method, amount, validation, confirm. |
| `DiscountModal` | Order-level discount. |
| `TablesModal` | Table grid; select table for dine-in. |
| `ProductOptionsModal` | Size, modifiers, notes; “Add to cart”. |
| `KitchenOrderTicket` | KOT display/print. |
| `QuickActionsMenu` | Floating menu for discount, payment, table, clear cart. |
| `KeyboardShortcuts` | Help overlay for shortcuts. |

---

## 7. State Management & Data Flow

### Where State Lives

- **usePOS** (in `hooks/usePOS.ts`):
  - Cart: `cartItems`, `addingToCart`.
  - Order context: `orderType`, `selectedTable`, `customer`, `waiter`.
  - Orders: `orders`, `orderBeingModified`, `lastPlacedOrder`, `orderToPay`.
  - Tables: `tables` (availability derived from orders).
  - Discount / charge / tips: `discount`, `discountType`, `charge`, `tips`.
  - Modals: `showPaymentModal`, `showDiscountModal`, `showCustomerModal`, `showTableModal`, `showProductOptionsModal`, `showRepeatCustomisationModal`, `showShortcuts`, `showQuickStats`, `showQuickActions`, etc.
  - Product customization: `productToCustomize`, `repeatCustomisationContext`.
  - UI: `currentTime`, etc.

- **page.tsx** (local state for UI only):
  - Which order is selected in execution sidebar, which order is shown in Order Details modal, mobile active tab, customer being edited, cart item being edited in product modal, etc.

### Flow (Conceptual)

```
User action (e.g. “Place Order”)
  → Component calls callback (e.g. onPlaceOrder)
  → page.tsx calls usePOS action (e.g. handlePlaceOrder)
  → usePOS updates state (setOrders, setCartItems, setTables, …)
  → Optional: save to localStorage (orders)
  → React re-renders; components receive new props
  → UI updates (cart empty, new order in sidebar, table occupied, etc.)
```

### Performance

- **useMemo**: Used for derived values (subtotal, discount amount, tax, total, quick stats) so they don’t recompute every render.
- **useCallback**: Used for action functions passed to children to avoid unnecessary re-renders.

---

## 8. Types & Data Models

Defined in **`types/pos.ts`**:

- **OrderType**: `'dine-in' | 'take-away' | 'delivery'`.
- **CartItem**: id, lineItemId, name, price, quantity, category, image, modifiers, notes, discount, discountType, selectedSize (and optional fields). Represents one line in the cart with a customization snapshot.
- **CartItemCustomization**: selectedSize, modifiers, notes – used to compare/merge lines.
- **Order**: id, tableId, tableName, orderType, customer, items (CartItem[]), status, total, discount, tax, charge, tips, createdAt, waiter.
- **Table**: id, name, capacity, status ('available' | 'occupied' | 'reserved'), x, y, currentOrderId.

Helper functions:

- `getCartItemCustomization(item)` – get snapshot from a cart item.
- `areCartItemCustomizationsEqual(a, b)` – compare two snapshots.
- `areCartItemsIdentical(a, b)` – same product + same customization (for merging).

---

## 9. Configuration

### Environment Variables

- **NEXT_PUBLIC_TAX_RATE**: Tax rate (e.g. `10` for 10%). Used in tax calculation. Default can be 10 if not set.

Create `.env.local` in project root if you need to override.

### Next.js (`next.config.js`)

- `reactStrictMode: true`.
- Dev webpack cache set to `memory` (avoids Windows file lock issues).
- **images.remotePatterns**: Allowed image domains (e.g. unsplash, placehold).
- **headers**: Security headers (HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy).

### Tailwind (`tailwind.config.js`)

- **content**: `./pages/**/*`, `./components/**/*`, `./app/**/*` (so Tailwind scans all relevant files).
- **theme.extend**: Custom colors (primary, accent, success, warning, danger, neutral), shadows, border radius, gradients, font (Inter), animations/keyframes.

### TypeScript (`tsconfig.json`)

- Path alias: `@/*` → project root.
- Strict mode and standard Next.js TS settings.

---

## 10. Running & Developing

### Prerequisites

- **Node.js** 18+.
- **npm** (or yarn).

### Commands

```bash
# Install dependencies
npm install

# Development (hot reload)
npm run dev
# → http://localhost:3000

# Production build
npm run build

# Run production build
npm start

# Lint
npm run lint
```

### Scripts (from `package.json`)

- `dev`: `next dev`
- `build`: `next build`
- `start`: `next start`
- `lint`: `next lint`

---

## 11. Frequently Asked Questions

**Q: What is this project?**  
A: A restaurant POS web app (FoodGo) for taking orders, managing tables, applying discounts, and processing payments. It’s frontend-only with data in `localStorage`.

**Q: What tech stack is used?**  
A: Next.js 14, React 18, TypeScript 5, Tailwind CSS 3. See [Technologies Used & Why](#2-technologies-used--why).

**Q: Is there a backend or database?**  
A: No. Orders (and optionally customers) are stored in the browser’s `localStorage`. The app is built so a backend/API can be added later.

**Q: How does the POS flow work?**  
A: Browse products → add to cart (with optional size/modifiers) → set order type, table (dine-in), customer, waiter → Place Order → track in Execution sidebar → Payment → order completed, table freed. See [How the POS System Works](#4-how-the-pos-system-works).

**Q: Where is state kept?**  
A: In the `usePOS` hook (`hooks/usePOS.ts`). The main page only holds UI state (modals, selected order, mobile tab). See [State Management & Data Flow](#7-state-management--data-flow).

**Q: How is the UI structured?**  
A: Desktop: header + left sidebar (execution orders) + center (order/cart) + right (products) + quick actions. Mobile: same content in tabs. See [UI & Layout](#5-ui--layout).

**Q: How do I run it?**  
A: `npm install && npm run dev`, then open http://localhost:3000. See [Running & Developing](#10-running--developing).

**Q: Where are orders saved?**  
A: In `localStorage` under `pos_orders`. Loaded on app start; saved whenever the orders array changes. Stale open orders (>12h) are auto-completed on load.

**Q: Can I change the tax rate?**  
A: Yes, via `NEXT_PUBLIC_TAX_RATE` in `.env.local` (e.g. `10` for 10%). See [Configuration](#9-configuration).

**Q: What are the keyboard shortcuts?**  
A: Open the shortcuts modal with `?` or `Shift+/`. Common ones: e.g. Esc (clear cart), S (stats), R (orders sidebar), P (scroll to products). Exact list is in the in-app Keyboard Shortcuts modal.

---

## 12. Future Enhancements

Possible next steps (not implemented yet):

- **Backend & database**: REST/GraphQL API and DB (e.g. PostgreSQL/MongoDB) for orders, products, and users.
- **Authentication**: Login/logout and role-based access.
- **Real-time updates**: WebSockets or similar for live order/table updates across devices.
- **Receipt/KOT printing**: Integration with thermal printers or PDF export.
- **Inventory**: Stock levels and low-stock alerts.
- **Reports & analytics**: Sales, popular items, peak hours.
- **Multi-location / multi-tenant**: Multiple outlets or brands.
- **Employee management**: Waiter/cashier accounts and permissions.

---

## Summary

- **FoodGo** is a **frontend-only restaurant POS** built with **Next.js 14, React 18, TypeScript, and Tailwind CSS**.
- **Structure**: `app/` (layout + single page), `components/POS/` (all POS UI), `components/ui/` (Toast, InputModal), `hooks/usePOS.ts` (all logic and state), `types/pos.ts` (types and cart identity helpers).
- **Flow**: Products → Cart (with options) → Order context (type, table, customer, waiter) → Place Order → Execution sidebar → Payment → Completed; orders and optionally customers in **localStorage**.
- **UI**: Three-panel desktop layout (Execution | Order/Cart | Products) plus modals; mobile uses tabs. Theming and styling via Tailwind and `globals.css`.

For more detail on components and hierarchy, see **COMPONENT_HIERARCHY.md** and **PROJECT_OVERVIEW.md**. For a short cheat sheet, see **QUICK_REFERENCE.md**.
