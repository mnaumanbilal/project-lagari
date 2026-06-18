import { LAGARI_CONTACT } from "../config/contact";
import { env, isSmtpConfigured } from "../config/env";
import {
  Customer,
  Order,
  OrderItem,
  type OrderStatus,
} from "../db/models";
import { sendCustomerEmail } from "../providers/email.provider";
import {
  buildCustomerOrderEmail,
  type OrderEmailContext,
} from "../templates/customer-order-email";
import { resolveOrderCustomerContact } from "../utils/order-contact";

export type CustomerOrderEvent = OrderStatus | "placed";

async function loadOrderContext(
  orderId: string,
  event: CustomerOrderEvent,
): Promise<OrderEmailContext | null> {
  const order = await Order.findByPk(orderId, {
    include: [
      { association: "customer" },
      { association: "items" },
    ],
  });
  if (!order) return null;

  const customer = (order as Order & { customer?: Customer }).customer;
  const items = (order as Order & { items?: OrderItem[] }).items ?? [];
  const contact = resolveOrderCustomerContact(order, customer);

  return {
    orderNumber: order.orderNumber,
    customerName: contact.customerName,
    status: event === "placed" ? "placed" : event,
    subtotalPkr: order.subtotalPkr,
    discountPkr: order.discountPkr,
    totalPkr: order.totalPkr,
    shippingCity: order.shippingCity,
    shippingAddress: order.shippingAddress,
    courierName: order.courierName,
    trackingNumber: order.trackingNumber,
    cancelReason: order.cancelReason,
    siteUrl: env.publicSiteUrl.replace(/\/$/, ""),
    whatsappPhone: LAGARI_CONTACT.whatsappPhone,
    whatsappHref: LAGARI_CONTACT.whatsappHref,
    items: items.map((item) => ({
      title: item.productTitleSnapshot,
      variant: item.variantNameSnapshot,
      productSlug: item.productSlugSnapshot,
      quantity: item.quantity,
      unitPricePkr: item.unitPricePkr,
      lineTotalPkr: item.unitPricePkr * item.quantity,
    })),
  };
}

export async function notifyCustomerOrderEvent(
  orderId: string,
  event: CustomerOrderEvent,
): Promise<void> {
  const ctx = await loadOrderContext(orderId, event);
  if (!ctx) return;

  const order = await Order.findByPk(orderId, {
    include: [{ association: "customer" }],
  });
  if (!order) return;

  const customer = (order as Order & { customer?: Customer }).customer;
  const email = resolveOrderCustomerContact(order, customer).customerEmail;

  if (email && isSmtpConfigured()) {
    const mail = buildCustomerOrderEmail(ctx);
    void sendCustomerEmail({
      to: email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    }).catch((err) => console.error("customer order email failed:", err));
  }
}
