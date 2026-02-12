/**
 * API module – re-exports for use across the app.
 * Add more modules here as you integrate products, orders, tables, customers, etc.
 */

export {
  apiRequest,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  ApiError,
} from './client'
export type { ApiRequestConfig, RequestMethod } from './client'

export {
  loginApi,
  logoutApi,
  getStoredToken,
  getStoredUser,
  setAuthStorage,
  clearAuthStorage,
  generateOtpApi,
  loginWithOtpApi,
} from './auth'
export type { LoginResponse, LoginPayload } from './auth'

export {
  fetchProducts,
  fetchCategories,
  fetchWaiters,
  fetchCustomers,
  fetchDisplayOrders,
  normalizeOrderStatus,
  getOrderStatusFromApi,
  fetchTables,
  placeOrderApi,
  mapPlaceOrderResponseToOrder,
  cancelOrderApi,
  fetchOrderDetails,
  getApiCustomerFullName,
  storeOrderPaymentApi,
} from './pos'
export type {
  ApiProduct,
  ApiCategory,
  ApiWaiter,
  ApiCustomer,
  ApiDisplayOrder,
  ApiTable,
  PlaceOrderRequest,
  PlaceOrderResponse,
  PlaceOrderResponseOrder,
  PlaceOrderCartItem,
  CancelOrderRequest,
  CancelOrderResponse,
  OrderDetailsResult,
  StoreOrderPaymentRequest,
  StoreOrderPaymentResponse,
} from './pos'
