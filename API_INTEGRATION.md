# API Integration Guide

This document describes how APIs are used in the project and where to plug in your backend endpoints (login, logout, products, orders, tables, customers).

## Environment

Create a `.env.local` in the project root:

```env
NEXT_PUBLIC_API_URL=https://your-api.com
```

If your API is on the same origin (e.g. Next.js API routes), leave it empty or set to `''`.

---

## 1. Auth APIs (Login / Logout)

**Implemented:** Login and logout are wired to the API client; you only need to set the correct endpoints and payload shape.

### Login

- **File:** `lib/api/auth.ts`
- **Function:** `loginApi(payload)`
- **Current endpoint:** `POST /api/auth/login`
- **Payload sent:** `{ email?: string, username?: string, password: string }`
- **Expected response:** `{ token: string, user?: { id, name?, email?, role? } }`

Update the path in `auth.ts` if your login URL is different (e.g. `/auth/login`, `/v1/login`). If the response shape differs, update the `LoginResponse` type and `loginApi` so that the token (and optionally user) are stored.

### Logout

- **File:** `lib/api/auth.ts`
- **Function:** `logoutApi()`
- **Current endpoint:** `POST /api/auth/logout`
- **Headers:** `Authorization: Bearer <token>` (sent by the API client)

If your backend has no logout endpoint, the app still clears the token and user from storage when the user clicks Logout.

### Where auth is used

- **Login page:** `app/login/page.tsx` – form calls `login()` from `useAuth()`.
- **Protected route:** `components/AuthGuard.tsx` – redirects to `/login` if not authenticated.
- **Logout:** `components/POS/POSHeader.tsx` – Logout button calls `logout()` then redirects to `/login`.

---

## 2. Products API (replace static data)

**Current:** Products and categories are static in:

- `components/POS/ProductCatalog.tsx` – `sampleProducts`, `availableModifiers`
- `components/POS/ProductCatalogPanel.tsx` – `categories` array

**To integrate:**

1. Add a products API module, e.g. `lib/api/products.ts`:

   ```ts
   import { apiGet } from './client'

   export interface ApiProduct {
     id: string
     name: string
     price: number
     category: string
     image?: string
     sizes?: { id: string; name: string; price: number }[]
     modifiers?: { id: string; name: string; price: number }[]
   }

   export function fetchProducts() {
     return apiGet<ApiProduct[]>('/api/products')  // or your path
   }

   export function fetchCategories() {
     return apiGet<string[]>('/api/categories')   // or your path
   }
   ```

2. In `ProductCatalogPanel`, use `useEffect` + `useState` (or React Query/SWR) to call `fetchCategories()` and pass categories to the catalog.
3. In `ProductCatalog`, call `fetchProducts()` (and optionally a modifiers endpoint) and use that list instead of `sampleProducts` / `availableModifiers`.

---

## 3. Orders API (replace localStorage)

**Current:** Orders are stored in `localStorage` in `hooks/usePOS.ts` (`POS_ORDERS_KEY`, `loadOrdersFromStorage`, `saveOrdersToStorage`).

**To integrate:**

1. Add `lib/api/orders.ts` with functions such as:
   - `fetchOrders()` – GET list of orders (optional filters).
   - `createOrder(body)` – POST new order.
   - `updateOrder(id, body)` – PUT/PATCH order.
   - `updateOrderStatus(id, status)` – PATCH status.
   - `cancelOrder(id)` – POST/PATCH cancel.

2. In `usePOS.ts`:
   - Replace initial load: instead of `loadOrdersFromStorage()`, call `fetchOrders()` (e.g. on mount or via a refresh function).
   - On place order: call `createOrder()` (or `updateOrder()` for modifications), then update local state from the API response.
   - On payment/status change: call `updateOrder()` / `updateOrderStatus()` and then update local state.
   - On cancel: call `cancelOrder()` and then update local state.

Keep the same `Order` type from `types/pos.ts` (or map API response to it).

---

## 4. Tables API (replace hardcoded list)

**Current:** Tables are hardcoded in `hooks/usePOS.ts` (`defaultTables` in `useState` for `tables`).

**To integrate:**

1. Add `lib/api/tables.ts`:
   - `fetchTables()` – GET list of tables (and optionally status).

2. In `usePOS.ts`, load tables on mount (or when needed) with `fetchTables()` and set `tables` state. You can still derive “occupied” from orders if the API doesn’t provide it.

---

## 5. Customers API (replace localStorage)

**Current:** Customers are stored in `localStorage` (`pos_customers`) and updated in `app/page.tsx` (AddCustomerModal submit) and possibly in `AddCustomerModal.tsx`.

**To integrate:**

1. Add `lib/api/customers.ts`:
   - `fetchCustomers()` – GET list.
   - `createCustomer(body)` – POST.
   - `updateCustomer(id, body)` – PUT/PATCH.

2. In the AddCustomerModal submit handler (in `page.tsx`), replace the `localStorage` logic with:
   - Create: `createCustomer(data)` then set the selected customer from the response.
   - Update: `updateCustomer(customerToEdit.id, data)` then refresh local customer state.
3. If you have a customer dropdown or search, load options from `fetchCustomers()`.

---

## 6. API client reference

**File:** `lib/api/client.ts`

- All requests use `NEXT_PUBLIC_API_URL` as base URL.
- `Authorization: Bearer <token>` is added automatically except when `skipAuth: true` (e.g. login).
- Helpers: `apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete`.
- Errors throw `ApiError` with `message`, `status`, and optional `data`.

Usage example:

```ts
import { apiGet, apiPost, ApiError } from '@/lib/api'

const data = await apiGet<MyType>('/api/orders')
await apiPost('/api/orders', { tableId: '01', items: [...] })
```

---

## Summary: what to provide

When you have the exact API list, you can:

1. **Auth:** Set in `lib/api/auth.ts` the real paths and, if needed, request/response shapes for login and logout.
2. **Products:** Add `lib/api/products.ts` (and categories) and switch ProductCatalog / ProductCatalogPanel to use it.
3. **Orders:** Add `lib/api/orders.ts` and replace localStorage and local state updates in `usePOS.ts` with API calls.
4. **Tables:** Add `lib/api/tables.ts` and load tables in `usePOS.ts`.
5. **Customers:** Add `lib/api/customers.ts` and replace localStorage in the customer modal and any customer list with API calls.

If you share the base URL, path for each endpoint (e.g. `POST /auth/login`), and the request/response bodies, the integration can be implemented to match exactly.
