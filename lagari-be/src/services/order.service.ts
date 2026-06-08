import { sequelize } from "../config/database";
import {
  Customer,
  Order,
  OrderItem,
  OrderTimelineEvent,
  Product,
  ProductVariant,
} from "../db/models";
import { clearCart, getCart } from "./cart.service";

export async function placeCodOrder(input: {
  sessionId: string;
  fullName: string;
  phone: string;
  city: string;
  address: string;
  email?: string;
}) {
  const cart = await getCart(input.sessionId);
  if (!cart.items.length) {
    return null;
  }

  return sequelize.transaction(async (t) => {
    const [customer] = await Customer.findOrCreate({
      where: { phone: input.phone },
      defaults: {
        phone: input.phone,
        fullName: input.fullName,
        email: input.email ?? null,
      },
      transaction: t,
    });

    await customer.update(
      { fullName: input.fullName, email: input.email ?? customer.email },
      { transaction: t },
    );

    const order = await Order.create(
      {
        customerId: customer.id,
        sessionId: input.sessionId,
        status: "pending",
        subtotalPkr: cart.subtotalPkr,
        discountPkr: 0,
        totalPkr: cart.subtotalPkr,
        shippingCity: input.city,
        shippingAddress: input.address,
        notes: null,
      },
      { transaction: t },
    );

    for (const line of cart.items) {
      const variant = await ProductVariant.findByPk(line.variantId, {
        include: [{ model: Product, as: "product" }],
        transaction: t,
      });
      if (!variant || variant.stock < line.quantity) {
        throw new Error(`Insufficient stock for ${line.variantName}`);
      }

      await variant.decrement("stock", { by: line.quantity, transaction: t });

      await OrderItem.create(
        {
          orderId: order.id,
          variantId: variant.id,
          productTitleSnapshot: line.productTitle,
          variantNameSnapshot: line.variantName,
          unitPricePkr: line.unitPricePkr,
          quantity: line.quantity,
        },
        { transaction: t },
      );
    }

    await OrderTimelineEvent.create(
      {
        orderId: order.id,
        actorAdminId: null,
        eventType: "placed",
        fromStatus: null,
        toStatus: "pending",
        message: "Order placed by customer (COD)",
      },
      { transaction: t },
    );

    await clearCart(input.sessionId);

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalPkr: order.totalPkr,
    };
  });
}
