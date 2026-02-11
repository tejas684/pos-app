# 🏗️ Component Hierarchy & Architecture

## 📊 Component Tree Structure

```
app/layout.tsx (Root Layout)
└── ToastProvider
    └── app/page.tsx (Main POS Page)
        │
        ├── POSHeader
        │   ├── Quick Stats Display
        │   ├── Time Display
        │   └── Action Buttons
        │
        ├── Mobile Dashboard Header (Mobile Only)
        │   ├── Dashboard Tab
        │   ├── Execution Orders Tab
        │   ├── Cart Tab
        │   └── Products Tab
        │
        ├── ExecutionOrdersSidebar (Left Sidebar)
        │   ├── Order List
        │   ├── Order Status Badges
        │   └── Order Action Buttons
        │       ├── Modify Order
        │       ├── View Details
        │       ├── Cancel Order
        │       ├── Process Payment
        │       └── Print KOT
        │
        ├── OrderManagementPanel (Center Panel)
        │   ├── CustomerWaiterInfo
        │   │   ├── Customer Selection
        │   │   └── Waiter Selection
        │   │
        │   ├── Order Type Selector
        │   │   ├── Dine-in
        │   │   ├── Take-away
        │   │   └── Delivery
        │   │
        │   ├── OrderItemsTable
        │   │   ├── Cart Item Rows
        │   │   │   ├── Item Details
        │   │   │   ├── Quantity Controls
        │   │   │   ├── Price Display
        │   │   │   └── Remove Button
        │   │   └── Edit Item Button
        │   │
        │   ├── OrderSummary
        │   │   ├── Subtotal
        │   │   ├── Discount
        │   │   ├── Tax
        │   │   ├── Charge
        │   │   ├── Tips
        │   │   └── Total Payable
        │   │
        │   └── Action Buttons
        │       ├── Place Order
        │       ├── Update Order
        │       └── Payment
        │
        ├── ProductCatalogPanel (Right Panel)
        │   ├── Search Bar
        │   ├── Category Filter
        │   └── ProductCatalog
        │       └── Product Grid
        │           └── Product Cards
        │               ├── Product Image
        │               ├── Product Name
        │               ├── Product Price
        │               └── Add to Cart Button
        │
        ├── QuickActionsMenu (Floating Button)
        │   ├── Discount
        │   ├── Payment
        │   ├── Table Selection
        │   └── Clear Cart
        │
        └── Modals (Conditional Rendering)
            ├── PaymentModal
            │   ├── Payment Method Selection
            │   ├── Amount Input
            │   ├── Change Calculation
            │   └── Confirm Payment
            │
            ├── DiscountModal
            │   ├── Discount Type (Percentage)
            │   ├── Discount Value Input
            │   ├── Discount Preview
            │   └── Apply Discount
            │
            ├── AddCustomerModal
            │   ├── Customer Name
            │   ├── Phone Number
            │   ├── Email (Optional)
            │   ├── Address (Optional)
            │   └── Save Customer
            │
            ├── TablesModal
            │   ├── Table Grid (18 tables)
            │   ├── Table Status (Available/Occupied)
            │   └── Select Table
            │
            ├── ProductOptionsModal
            │   ├── Size Selection
            │   ├── Modifiers/Add-ons
            │   ├── Special Notes
            │   └── Add to Cart
            │
            ├── OrderDetailsModal
            │   ├── Order Information
            │   ├── Order Items
            │   ├── Order Totals
            │   └── Action Buttons
            │
            ├── KitchenOrderTicket (KOT)
            │   ├── Order Header
            │   ├── Table Number
            │   ├── Order Items
            │   ├── Special Instructions
            │   └── Print/Download
            │
            ├── CartItemOptionsModal
            │   ├── Edit Quantity
            │   ├── Edit Discount
            │   ├── Edit Notes
            │   └── Save Changes
            │
            ├── EditItemModal
            │   └── (Similar to CartItemOptionsModal)
            │
            └── KeyboardShortcuts
                └── Shortcuts List
```

---

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                          │
│  (Click Product, Update Cart, Place Order, etc.)            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              COMPONENT (UI Layer)                            │
│  - ProductCatalogPanel                                      │
│  - OrderManagementPanel                                     │
│  - ExecutionOrdersSidebar                                   │
│  - Modals                                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Calls hook functions
                       │ Reads hook state
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              usePOS HOOK (Business Logic)                    │
│                                                              │
│  State Management:                                           │
│  ├── cartItems (useState)                                   │
│  ├── orders (useState)                                      │
│  ├── tables (useState)                                      │
│  ├── customer, waiter (useState)                            │
│  └── modal states (useState)                                │
│                                                              │
│  Computed Values (useMemo):                                  │
│  ├── subtotal                                               │
│  ├── discountAmount                                          │
│  ├── tax                                                     │
│  ├── totalPayable                                           │
│  └── quickStats                                              │
│                                                              │
│  Actions (useCallback):                                      │
│  ├── addToCart()                                            │
│  ├── updateCartItem()                                       │
│  ├── handlePlaceOrder()                                     │
│  ├── handlePayment()                                        │
│  └── ... more                                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Updates state
                       │ Saves to storage
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              localStorage (Persistence)                       │
│  - pos_orders                                               │
│  - pos_customers                                            │
└─────────────────────────────────────────────────────────────┘
                       │
                       │ State changes trigger
                       │ Component re-renders
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              UI UPDATES AUTOMATICALLY                        │
│  - Cart updates                                              │
│  - Order list updates                                        │
│  - Totals recalculate                                        │
│  - Toast notifications                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Component Responsibilities

### Container Component
**`app/page.tsx`**
- Orchestrates all child components
- Manages modal visibility
- Handles keyboard shortcuts
- Coordinates component interactions
- Uses `usePOS` hook for all state

### Presentational Components
**All components in `components/POS/`**
- Display UI based on props
- Call callback functions on user actions
- No direct state management
- Focused on presentation

### Business Logic
**`hooks/usePOS.ts`**
- All state management
- All business logic
- Calculations (totals, tax, discounts)
- Data persistence (localStorage)
- Order lifecycle management

---

## 📦 Component Categories

### 1. **Layout Components**
- `POSHeader` - Top navigation
- `OrderManagementPanel` - Left panel
- `ProductCatalogPanel` - Right panel
- `ExecutionOrdersSidebar` - Sidebar

### 2. **Display Components**
- `ProductCatalog` - Product grid
- `OrderItemsTable` - Cart items table
- `OrderSummary` - Totals display
- `CustomerWaiterInfo` - Customer/waiter display

### 3. **Modal Components**
- `PaymentModal`
- `DiscountModal`
- `AddCustomerModal`
- `TablesModal`
- `ProductOptionsModal`
- `OrderDetailsModal`
- `KitchenOrderTicket`
- `CartItemOptionsModal`
- `EditItemModal`
- `KeyboardShortcuts`

### 4. **Utility Components**
- `QuickActionsMenu` - Floating action button
- `Toast` - Notification system
- `InputModal` - Generic input modal

---

## 🔗 Component Dependencies

```
app/page.tsx
├── Depends on: usePOS hook
├── Renders: All POS components
└── Provides: Props and callbacks to children

usePOS hook
├── Depends on: types/pos.ts
├── Uses: React hooks (useState, useEffect, useMemo, useCallback)
└── Provides: State and functions to app/page.tsx

Components
├── Depends on: Props from parent
├── Uses: types/pos.ts for TypeScript types
└── May use: Toast for notifications
```

---

## 🎨 Styling Architecture

```
globals.css (Global Styles)
├── Tailwind Directives
│   ├── @tailwind base
│   ├── @tailwind components
│   └── @tailwind utilities
│
├── CSS Variables
│   └── Color definitions
│
└── Component Classes
    ├── .btn-primary
    ├── .btn-secondary
    ├── .card
    └── ... more

tailwind.config.js
├── Custom Colors
│   ├── primary (Blue)
│   ├── accent (Purple)
│   ├── success (Green)
│   ├── warning (Amber)
│   └── danger (Red)
│
├── Custom Shadows
├── Custom Animations
└── Custom Gradients

Components
└── Use Tailwind utility classes
    └── className="bg-primary-500 text-white"
```

---

## 🔄 State Management Flow

### State Updates
```
User Action
    ↓
Component calls function from usePOS
    ↓
usePOS updates state (useState)
    ↓
useMemo recalculates derived values
    ↓
Components re-render with new props
    ↓
UI updates
```

### Example: Adding Product to Cart
```
1. User clicks product in ProductCatalog
    ↓
2. ProductCatalog calls onProductSelect(product)
    ↓
3. app/page.tsx receives callback
    ↓
4. Calls handleProductSelect(product) from usePOS
    ↓
5. usePOS.addToCart(product) executes
    ↓
6. setCartItems() updates state
    ↓
7. subtotal, totalPayable recalculate (useMemo)
    ↓
8. OrderManagementPanel re-renders with new cartItems
    ↓
9. OrderSummary shows updated totals
    ↓
10. Toast notification appears
```

---

## 🎭 Component Communication Patterns

### 1. **Props Down, Events Up**
- Parent passes data via props
- Child calls callbacks to notify parent
- No direct child-to-child communication

### 2. **Context API (Toast)**
- `ToastProvider` wraps app
- Any component can show toast via `useToast()`
- No prop drilling needed

### 3. **Custom Hook (usePOS)**
- Single source of truth
- All components access same state
- Centralized business logic

---

## 📐 Layout Structure

### Desktop Layout (≥1024px)
```
┌─────────────────────────────────────────────────────────┐
│                    POSHeader                            │
├──────────┬──────────────────────┬───────────────────────┤
│          │                      │                       │
│ Execution│  Order Management   │  Product Catalog      │
│  Orders  │      Panel           │      Panel            │
│ Sidebar  │                      │                       │
│          │                      │                       │
└──────────┴──────────────────────┴───────────────────────┘
```

### Mobile Layout (<1024px)
```
┌─────────────────────────────────────┐
│          POSHeader                  │
├─────────────────────────────────────┤
│    Mobile Dashboard Tabs            │
├─────────────────────────────────────┤
│                                     │
│    Active Panel (One at a time)     │
│                                     │
│    - Dashboard                      │
│    - Execution Orders               │
│    - Cart                           │
│    - Products                       │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎯 Key Design Patterns

### 1. **Container/Presentational Pattern**
- Container: `app/page.tsx` (smart component)
- Presentational: All `components/POS/*` (dumb components)

### 2. **Custom Hook Pattern**
- Business logic in `usePOS`
- Reusable across components
- Separates concerns

### 3. **Composition Pattern**
- Components composed together
- No deep inheritance
- Flexible and maintainable

### 4. **Provider Pattern**
- `ToastProvider` for global state
- Context API for cross-component communication

---

## 📊 Component Size & Complexity

| Component | Lines | Complexity | Purpose |
|-----------|-------|------------|---------|
| `app/page.tsx` | ~668 | High | Main orchestrator |
| `hooks/usePOS.ts` | ~767 | Very High | Business logic |
| `OrderManagementPanel` | ~196 | Medium | Cart management |
| `ProductCatalogPanel` | ~221 | Medium | Product browsing |
| `ProductCatalog` | ~270 | Medium | Product grid |
| `ExecutionOrdersSidebar` | ~? | Medium | Active orders |
| Modals | ~100-200 each | Low-Medium | User interactions |

---

## 🔍 Component Interaction Examples

### Example 1: Placing an Order
```
User clicks "Place Order"
    ↓
OrderManagementPanel → onPlaceOrder()
    ↓
app/page.tsx → handlePlaceOrder()
    ↓
usePOS.handlePlaceOrder()
    ↓
- Validates cart, table, waiter
- Creates Order object
- Adds to orders array
- Clears cart
- Updates table status
    ↓
- setOrders() triggers re-render
- ExecutionOrdersSidebar shows new order
- KitchenOrderTicket modal opens
- Toast notification appears
```

### Example 2: Processing Payment
```
User clicks "Payment"
    ↓
OrderManagementPanel → onShowPaymentModal()
    ↓
app/page.tsx → setShowPaymentModal(true)
    ↓
PaymentModal renders
    ↓
User enters payment details → onPayment()
    ↓
app/page.tsx → handlePayment()
    ↓
usePOS.handlePayment()
    ↓
- Validates payment amount
- Updates order status to "completed"
- Frees table (if dine-in)
    ↓
- PaymentModal closes
- Order removed from active orders
- Table status updates to "available"
- Toast notification appears
```

---

This hierarchy shows how all components work together to create a cohesive POS system!
