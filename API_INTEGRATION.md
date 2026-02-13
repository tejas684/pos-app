# POS App – Complete API Integration Guide

> **Single source of truth** for all API configuration, endpoints, integration patterns, and developer reference.

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Configuration](#2-configuration)
3. [API Overview](#3-api-overview)
4. [Authentication APIs](#4-authentication-apis)
5. [Products & Categories](#5-products--categories)
6. [Waiters & Customers](#6-waiters--customers)
7. [Tables](#7-tables)
8. [Orders](#8-orders)
9. [User Flows](#9-user-flows)
10. [Component → API Mapping](#10-component--api-mapping)
11. [API Client Reference](#11-api-client-reference)
12. [Integration Checklist](#12-integration-checklist)

---

## 1. Quick Start

| Item | Value |
|------|-------|
| **Base URL** | `https://demo.webwideit.solutions/pos-aishwarya/public` |
| **Override** | Set `NEXT_PUBLIC_API_URL` in `.env.local` |
| **APIs** | 17 endpoints across Auth, Products, Orders, Tables, Customers |
| **Auth** | OTP-based login; JWT token in `Authorization: Bearer <token>` |

**Run locally:**
```bash
npm install && npm run dev
```

---

## 2. Configuration

### Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_API_URL=https://demo.webwideit.solutions/pos-aishwarya/public
```

- Leave empty or `''` if using same-origin (e.g. Next.js API routes).
- All endpoints are relative to this base URL.

### Authentication Storage

| Key | Content |
|-----|---------|
| `pos_token` | JWT token |
| `pos_user` | User object `{ id, name, email, role }` |

---

## 3. API Overview

| Category | Count | Purpose |
|----------|-------|---------|
| **Authentication** | 4 | OTP login, logout |
| **Products & Categories** | 2 | Menu items, category filtering |
| **Waiters & Customers** | 4 | Staff and customer management |
| **Tables** | 1 | Table layout and dine-in |
| **Orders** | 6 | Place, update, cancel, pay, view |

---

## 4. Authentication APIs

### 4.1 Generate OTP

| Field | Value |
|-------|-------|
| **Endpoint** | `POST api/admin/generate-otp` |
| **Auth** | No |
| **Request** | `{ email: string }` |
| **Response** | `{ message?: string }` |

Sends OTP to the user's email.

**Used in:** `app/login/page.tsx` → `requestOtp(email)` in AuthContext

---

### 4.2 Login with OTP

| Field | Value |
|-------|-------|
| **Endpoint** | `POST api/admin/login-otp` |
| **Auth** | No |
| **Request** | `{ email: string, otp: string }` |
| **Response** | `{ token: string, user?: { id, name, email, role } }` |

Verifies OTP and returns JWT. Token is stored in `localStorage`.

**Used in:** Login page → `loginWithOtp(email, otp)` in AuthContext

---

### 4.3 Logout

| Field | Value |
|-------|-------|
| **Endpoint** | `POST api/auth/logout` |
| **Auth** | Yes |
| **Request** | `{}` |

Invalidates session. Frontend clears token and user regardless of response.

**Used in:** `POSHeader` Logout button → `logout()` in AuthContext

---

### 4.4 Legacy Login (Unused)

| Field | Value |
|-------|-------|
| **Endpoint** | `POST api/auth/login` |
| **Request** | `{ email?, username?, password? }` |

Kept for compatibility; app uses OTP login only.

---

## 5. Products & Categories

### 5.1 Fetch Products

| Field | Value |
|-------|-------|
| **Endpoint** | `GET api/admin/all-products` |
| **Auth** | Yes |
| **Response** | Array of products (or `{ data: [...] }`, `{ products: [...] }`) |

Product shape: `{ id, name, price, category, image, sizes?, modifiers? }`

**Used in:** `POSDataContext` → `ProductCatalogPanel`, `ProductCatalog`, `ProductOptionsModal`

---

### 5.2 Fetch Categories

| Field | Value |
|-------|-------|
| **Endpoint** | `GET api/admin/all-categories` |
| **Auth** | Yes |
| **Response** | Array of categories (or `{ data: [...] }`, `{ categories: [...] }`) |

**Used in:** `POSDataContext` → `ProductCatalogPanel` (category tabs)

---

## 6. Waiters & Customers

### 6.1 Fetch Waiters

| Field | Value |
|-------|-------|
| **Endpoint** | `GET api/waiters` |
| **Auth** | Yes |
| **Response** | `[{ id, name }]` |

**Used in:** `POSDataContext` → `CustomerWaiterInfo` (waiter dropdown)

---

### 6.2 Fetch Customers

| Field | Value |
|-------|-------|
| **Endpoint** | `GET api/customers` |
| **Auth** | Yes |
| **Response** | `[{ id, name, last_name, phone, email }]` |

**Used in:** `POSDataContext` → `CustomerWaiterInfo`, `AddCustomerModal`

---

### 6.3 Create Customer

| Field | Value |
|-------|-------|
| **Endpoint** | `POST api/store/customers` |
| **Auth** | Yes |
| **Request** | `{ name: string, mobile: string }` |
| **Response** | `{ data?: { id, name, last_name, mobile }, message? }` |

**Used in:** `AddCustomerModal` submit → `createStoreCustomer()` in `app/page.tsx`

---

### 6.4 Update Customer

| Field | Value |
|-------|-------|
| **Endpoint** | `PUT api/update/customers/:id` |
| **Auth** | Yes |
| **Request** | `{ name: string, mobile: string }` |
| **Response** | `{ data?: {...}, message? }` |

**Used in:** `AddCustomerModal` edit submit → `updateStoreCustomer()` in `app/page.tsx`

---

## 7. Tables

### 7.1 Fetch Tables

| Field | Value |
|-------|-------|
| **Endpoint** | `GET api/admin/tables` |
| **Auth** | Yes |
| **Response** | `{ data: { tables: [...] } }` or array. Each: `{ id, name, capacity, status, x, y, area }` |

**Used in:** `usePOS` → `TablesModal`, `OrderManagementPanel` (dine-in table selection)

---

## 8. Orders

### 8.1 Fetch Display Orders

| Field | Value |
|-------|-------|
| **Endpoint** | `GET api/admin/orders/display` |
| **Auth** | Yes |
| **Response** | Array of orders: `id, order_no, table_number, order_type, items_count, total_price, status, customer, waiter, created_at` |

**Used in:** `POSDataContext` → `ExecutionOrdersSidebar`

---

### 8.2 Place Order

| Field | Value |
|-------|-------|
| **Endpoint** | `POST api/pos/place/order` |
| **Auth** | Yes |
| **Request** | `{ customer_id, waiter_id, order_type, areas, table_number, selected_persons, price_per_person, total_charge, delivery_partner, total_price, cart: [...] }` |
| **Response** | `{ success?, order_id?, order_no?, message?, data?, order? }` |

**Used in:** `usePOS.handlePlaceOrder()` → `placeOrderApi()`

---

### 8.3 Update Order

| Field | Value |
|-------|-------|
| **Endpoint** | `POST api/orders/:orderId/update` |
| **Auth** | Yes |
| **Request** | Same structure as Place Order |
| **Response** | `{ message?, data? }` |

**Used in:** Load order to cart → edit → `updateOrderApi()` in `usePOS`

---

### 8.4 Cancel Order

| Field | Value |
|-------|-------|
| **Endpoint** | `POST api/orders/:orderId/cancel` |
| **Auth** | Yes |
| **Request** | `{ reason: string }` |
| **Response** | `{ message? }` |

**Used in:** `ExecutionOrdersSidebar`, `OrderDetailsModal` → `cancelOrderApi()` in `usePOS`

---

### 8.5 Fetch Order Details

| Field | Value |
|-------|-------|
| **Endpoint** | `GET api/orders/details/:orderId` |
| **Auth** | Yes |
| **Response** | Full order: items, customer, waiter, table, totals, discount, tax, charge, tips |

**Used in:** Order Details modal → `fetchOrderDetails()` in `app/page.tsx`

---

### 8.6 Store Payment

| Field | Value |
|-------|-------|
| **Endpoint** | `POST api/order/payment/store` |
| **Auth** | Yes |
| **Request** | `{ order_id, total_amount, discount, online_amount, cash_amount, note }` |
| **Response** | `{ message?, data? }` |

**Used in:** `PaymentModal` → `storeOrderPaymentApi()`

---

## 9. User Flows

### Login Flow

```
Login Page
    │
    ├─► Enter email → "Send OTP" → generateOtpApi(email)
    │
    └─► Enter OTP → "Sign in" → loginWithOtpApi(email, otp)
            └─► Token stored → Redirect to POS
```

### Order Placement Flow

```
POS Main Page
    │
    ├─► POSDataContext: fetchProducts, fetchCategories, fetchWaiters,
    │   fetchCustomers, fetchDisplayOrders
    │
    ├─► usePOS: fetchTables
    │
    ├─► Add products to cart → Select customer, waiter, table (dine-in)
    │
    └─► "Place Order" → placeOrderApi() → Order in sidebar
```

### Payment Flow

```
Order card → "Account" (Pay) → PaymentModal
    → Enter cash/card amounts → storeOrderPaymentApi()
    → Order marked paid → Invoice printed
```

---

## 10. Component → API Mapping

| Component | APIs | Purpose |
|-----------|------|---------|
| **Login Page** | generateOtpApi, loginWithOtpApi | OTP login |
| **AuthContext** | generateOtpApi, loginWithOtpApi, logoutApi | Auth state |
| **POSDataContext** | fetchProducts, fetchCategories, fetchWaiters, fetchCustomers, fetchDisplayOrders | Master data |
| **usePOS** | fetchTables, placeOrderApi, updateOrderApi, cancelOrderApi | Orders & tables |
| **ProductCatalogPanel** | (from POSDataContext) | Product catalog |
| **CustomerWaiterInfo** | (from POSDataContext) | Customer & waiter selection |
| **AddCustomerModal** | (submit in parent) | Add/Edit customer form |
| **app/page.tsx** | fetchOrderDetails, createStoreCustomer, updateStoreCustomer | Order details, customer CRUD |
| **PaymentModal** | storeOrderPaymentApi | Payment submission |
| **ExecutionOrdersSidebar** | (from POSDataContext) | Order list |
| **TablesModal** | (from usePOS) | Table selection |

---

## 11. API Client Reference

**File:** `lib/api/client.ts`

- Base URL from `NEXT_PUBLIC_API_URL`
- `Authorization: Bearer <token>` added automatically (except `skipAuth: true` for login)
- Helpers: `apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete`
- Errors throw `ApiError` with `message`, `status`, `data`

**Usage:**

```ts
import { apiGet, apiPost, ApiError } from '@/lib/api'

const data = await apiGet<MyType>('/api/orders')
await apiPost('/api/pos/place/order', { customer_id, waiter_id, cart: [...] })
```

### Key Files

| File | Role |
|------|------|
| `lib/api/client.ts` | Base URL, fetch wrapper, auth header |
| `lib/api/auth.ts` | Auth APIs |
| `lib/api/pos.ts` | POS APIs (products, orders, customers, etc.) |
| `lib/api/index.ts` | Re-exports |
| `contexts/AuthContext.tsx` | Auth state |
| `contexts/POSDataContext.tsx` | POS master data |
| `hooks/usePOS.ts` | Order and table operations |

---

## 12. Integration Checklist

When connecting a new backend:

- [ ] **Auth:** Set paths in `lib/api/auth.ts` for login/logout; adjust request/response shapes if needed
- [ ] **Products:** Ensure `lib/api/pos.ts` maps your product/category response shape
- [ ] **Orders:** Verify place/update/cancel/payment payloads match your API
- [ ] **Tables:** Map table response to `{ id, name, capacity, status, x, y, area }`
- [ ] **Customers:** Map create/update to `{ name, mobile }`; adjust if backend uses different fields

### Complete Endpoint Reference

| # | Endpoint | Method | Auth | Purpose |
|---|----------|--------|------|---------|
| 1 | `api/admin/generate-otp` | POST | No | Send OTP to email |
| 2 | `api/admin/login-otp` | POST | No | Login with OTP; get token |
| 3 | `api/auth/login` | POST | No | Legacy (unused) |
| 4 | `api/auth/logout` | POST | Yes | Logout |
| 5 | `api/admin/all-products` | GET | Yes | All products |
| 6 | `api/admin/all-categories` | GET | Yes | All categories |
| 7 | `api/waiters` | GET | Yes | Waiter list |
| 8 | `api/customers` | GET | Yes | Customer list |
| 9 | `api/store/customers` | POST | Yes | Create customer |
| 10 | `api/update/customers/:id` | PUT | Yes | Update customer |
| 11 | `api/admin/tables` | GET | Yes | Table list |
| 12 | `api/admin/orders/display` | GET | Yes | Display orders |
| 13 | `api/pos/place/order` | POST | Yes | Place order |
| 14 | `api/orders/:id/update` | POST | Yes | Update order |
| 15 | `api/orders/:id/cancel` | POST | Yes | Cancel order |
| 16 | `api/orders/details/:id` | GET | Yes | Order details |
| 17 | `api/order/payment/store` | POST | Yes | Store payment |

---

### Error Handling

- API errors are caught and shown via toast notifications
- `ApiError` includes `status` and `data` for debugging

### Response Normalization

- Backend may return `{ data: [...] }`, `{ products: [...] }`, etc.
- `lib/api/pos.ts` normalizes responses for consistent use across the app
