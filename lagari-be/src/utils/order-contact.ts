import type { Customer, Order } from "../db/models";

type OrderContactFields = Pick<
  Order,
  "customerNameSnapshot" | "customerPhoneSnapshot" | "customerEmailSnapshot"
>;

type CustomerContactFields = Pick<Customer, "fullName" | "phone" | "email">;

/** Contact shown on an order — snapshot at checkout, not live customer profile. */
export function resolveOrderCustomerContact(
  order: OrderContactFields,
  customer?: CustomerContactFields | null,
) {
  return {
    customerName:
      order.customerNameSnapshot?.trim() || customer?.fullName?.trim() || "—",
    customerPhone:
      order.customerPhoneSnapshot?.trim() || customer?.phone?.trim() || "—",
    customerEmail:
      order.customerEmailSnapshot?.trim() || customer?.email?.trim() || null,
  };
}
