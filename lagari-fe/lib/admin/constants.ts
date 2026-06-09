/** Secret admin entry — not linked from the public storefront */
export const ADMIN_BASE_PATH = "/admin-panel-route";

export const ADMIN_LOGIN_PATH = ADMIN_BASE_PATH;

export const ADMIN_CONSOLE_PATH = `${ADMIN_BASE_PATH}/dashboard`;

/** @deprecated use ADMIN_CONSOLE_PATH */
export const ADMIN_DASHBOARD_PATH = ADMIN_CONSOLE_PATH;

export const ADMIN_ORDERS_PATH = `${ADMIN_BASE_PATH}/orders`;
export const ADMIN_PRODUCTS_PATH = `${ADMIN_BASE_PATH}/products`;
export const ADMIN_ANALYTICS_PATH = `${ADMIN_BASE_PATH}/analytics`;
export const ADMIN_REVIEWS_PATH = `${ADMIN_BASE_PATH}/reviews`;
