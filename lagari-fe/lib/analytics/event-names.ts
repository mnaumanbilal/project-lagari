export const ANALYTICS_EVENTS = {
  PAGE_VIEW: "page_view",
  PRODUCT_VIEW: "product_view",
  ADD_TO_CART: "add_to_cart",
  REMOVE_FROM_CART: "remove_from_cart",
  CHECKOUT_START: "checkout_start",
  CHECKOUT_ABANDON: "checkout_abandon",
  ORDER_PLACED: "order_placed",
  SEARCH: "search",
  CATEGORY_VIEW: "category_view",
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
