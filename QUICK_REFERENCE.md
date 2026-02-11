# 🚀 Quick Reference Guide - FoodGo

## 📋 Project at a Glance

**Name**: FoodGo (Point of Sale System)  
**Type**: Restaurant Management System  
**Tech Stack**: Next.js 14 + React 18 + TypeScript + Tailwind CSS  
**Purpose**: Manage orders, tables, payments, and kitchen operations

---

## 🛠️ Technologies Used

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.0 | React framework with App Router |
| **React** | 18.2 | UI library for building components |
| **TypeScript** | 5.0 | Type-safe JavaScript |
| **Tailwind CSS** | 3.3 | Utility-first CSS framework |
| **PostCSS** | 8.4 | CSS processor |
| **ESLint** | 8.0 | Code linting |

---

## 📁 Project Structure (Simplified)

```
reactnextjs/
├── app/                    # Next.js pages
│   ├── page.tsx           # Main POS page ⭐
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
│
├── components/
│   ├── POS/               # POS components (19 files)
│   └── ui/                # Reusable UI (Toast, InputModal)
│
├── hooks/
│   └── usePOS.ts          # Main state management ⭐
│
├── types/
│   └── pos.ts             # TypeScript types
│
└── Config files           # package.json, tsconfig.json, etc.
```

---

## 🔑 Main Files & Their Purpose

| File | Purpose |
|------|---------|
| `app/page.tsx` | Main POS interface - orchestrates all components |
| `hooks/usePOS.ts` | All business logic and state management |
| `types/pos.ts` | TypeScript type definitions |
| `components/POS/OrderManagementPanel.tsx` | Cart and order details panel |
| `components/POS/ProductCatalogPanel.tsx` | Product browsing panel |
| `components/POS/ExecutionOrdersSidebar.tsx` | Active orders sidebar |
| `app/layout.tsx` | Root layout with ToastProvider |

---

## 🔄 How It Works (Simple Flow)

```
1. User opens app → app/page.tsx loads
2. usePOS hook initializes → loads orders from localStorage
3. User browses products → clicks product → added to cart
4. User manages cart → selects table/customer/waiter
5. User places order → order created → KOT printed
6. User processes payment → order completed → table freed
```

---

## 🚀 How to Run

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open browser
http://localhost:3000
```

---

## 📊 Key Features

✅ **Order Types**: Dine-in, Take-away, Delivery  
✅ **Table Management**: 18 tables, visual status  
✅ **Product Catalog**: Search, filter, categories  
✅ **Shopping Cart**: Quantity, modifiers, notes  
✅ **Discounts**: Percentage-based  
✅ **Tax Calculation**: Configurable (default 10%)  
✅ **Payment**: Cash, Card, Mobile Wallet  
✅ **Order Tracking**: 6 statuses (pending → completed)  
✅ **KOT Printing**: Kitchen Order Tickets  
✅ **Keyboard Shortcuts**: Power user features  

---

## 🎯 Main Components

### 1. **POSHeader** (Top Bar)
- Shows stats (active orders, revenue)
- Action buttons
- Time display

### 2. **OrderManagementPanel** (Left 40%)
- Shopping cart
- Order summary
- Customer/waiter selection
- Place Order button

### 3. **ProductCatalogPanel** (Right 60%)
- Product grid
- Search & filter
- Add to cart

### 4. **ExecutionOrdersSidebar** (Left Sidebar)
- Active orders list
- Order actions (modify, cancel, pay)

### 5. **Modals**
- PaymentModal
- DiscountModal
- AddCustomerModal
- TablesModal
- ProductOptionsModal
- OrderDetailsModal
- KitchenOrderTicket

---

## 💾 Data Storage

- **Current**: Browser localStorage
  - Orders: `localStorage.getItem('pos_orders')`
  - Customers: `localStorage.getItem('pos_customers')`
- **Future**: Backend API + Database

---

## 🎨 State Management

**Pattern**: Custom Hook (`usePOS`)

```typescript
// All state managed in one hook
const {
  cartItems,           // Cart state
  orders,              // All orders
  tables,              // Table status
  addToCart,           // Actions
  handlePlaceOrder,
  handlePayment,
  // ... more
} = usePOS()
```

---

## 📱 Responsive Design

- **Desktop (≥1024px)**: Three-panel layout
- **Mobile (<1024px)**: Tab navigation, one panel at a time

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `?` or `Shift+/` | Show shortcuts |
| `Esc` | Clear cart |
| `S` | Toggle stats |
| `R` | Toggle orders sidebar |
| `P` | Scroll to products |

---

## 🔧 Configuration

### Environment Variables
```env
NEXT_PUBLIC_TAX_RATE=10
```

### Tax Calculation
```
Subtotal = Sum of (item price × quantity - item discount)
Discount = Subtotal × discount percentage
Tax = (Subtotal - Discount) × tax rate
Total = Subtotal - Discount + Tax + Charge + Tips
```

---

## 📈 Order Status Flow

```
pending → preparing → ready → served → completed
                ↓
            cancelled
```

---

## 🎓 Quick Explanation Scripts

### 30-Second Pitch
"Modern restaurant POS system built with Next.js and React. Handles orders, tables, payments, and kitchen operations. Fully responsive with TypeScript for type safety."

### 2-Minute Overview
1. **What**: Restaurant POS system
2. **Tech**: Next.js 14, React 18, TypeScript, Tailwind
3. **Features**: Order management, table tracking, payment processing
4. **Architecture**: Custom hook for state, component-based UI
5. **Storage**: localStorage (ready for backend)
6. **Run**: `npm install && npm run dev`

### 5-Minute Deep Dive
1. Project structure and file organization
2. State management with `usePOS` hook
3. Component architecture (container/presentational)
4. Data flow (user action → state update → UI render)
5. TypeScript type safety
6. Responsive design approach

---

## 🐛 Common Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Check code quality

# Troubleshooting
rm -rf .next         # Clear Next.js cache
npm install          # Reinstall dependencies
```

---

## 📚 File Count Summary

- **Components**: 21 files (19 POS + 2 UI)
- **Hooks**: 1 file (usePOS.ts)
- **Types**: 1 file (pos.ts)
- **Pages**: 1 file (page.tsx)
- **Config Files**: 6 files

**Total**: ~30 main files

---

## 🎯 Key Concepts

1. **App Router**: Next.js 14 routing system
2. **Client Components**: `'use client'` directive for interactivity
3. **Custom Hooks**: Reusable stateful logic
4. **TypeScript Types**: Type safety and IntelliSense
5. **Tailwind Utilities**: Rapid UI development
6. **localStorage**: Browser-based persistence

---

## ✅ Project Status

- ✅ Core functionality complete
- ✅ Responsive design implemented
- ✅ TypeScript fully integrated
- ✅ Production-ready configuration
- ⏳ Backend integration pending
- ⏳ Database persistence pending

---

**Quick Start**: `npm install && npm run dev`  
**Documentation**: See `PROJECT_OVERVIEW.md` for complete details
