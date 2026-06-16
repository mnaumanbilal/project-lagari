"use strict";

/**
 * Migration: customer-based review verification
 *
 * Changes:
 *   1. Add customer_id FK to product_reviews (nullable — Shopify imports stay null)
 *   2. Add contact_phone_normalized (audit snapshot of phone used at submission)
 *   3. Add contact_email_normalized (audit snapshot of email used at submission)
 *   4. Drop the session-based unique index (product_id, session_id)
 *   5. Add a partial unique index on (customer_id, product_id) to be managed
 *      at the application layer for purchase-count-based quotas
 *   6. Backfill customer_id from orders.session_id where possible
 *   7. Add index on orders(customer_id, status) for purchase count queries
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add customer_id FK
    await queryInterface.addColumn("product_reviews", "customer_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: "customers", key: "id" },
      onDelete: "SET NULL",
    });

    // 2. Add contact audit snapshots
    await queryInterface.addColumn("product_reviews", "contact_phone_normalized", {
      type: Sequelize.STRING(20),
      allowNull: true,
    });

    await queryInterface.addColumn("product_reviews", "contact_email_normalized", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    // 3. Drop session-based unique index (superseded by customer + purchase-count logic)
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS product_reviews_product_session_uidx;`,
    );

    // 4. Index for fast customer+product queries (no DB unique — quota enforced in app)
    await queryInterface.addIndex(
      "product_reviews",
      ["customer_id", "product_id"],
      { name: "product_reviews_customer_product_idx" },
    );

    // 5. Backfill customer_id from orders.session_id for existing customer reviews
    await queryInterface.sequelize.query(`
      UPDATE product_reviews pr
      SET customer_id = o.customer_id
      FROM orders o
      WHERE pr.session_id = o.session_id
        AND pr.customer_id IS NULL
        AND pr.source = 'customer';
    `);

    // 6. Add composite index on orders for purchase count query performance
    await queryInterface.addIndex(
      "orders",
      ["customer_id", "status"],
      {
        name: "orders_customer_status_idx",
        where: { archived_at: null },
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("orders", "orders_customer_status_idx");
    await queryInterface.removeIndex("product_reviews", "product_reviews_customer_product_idx");

    // Restore session-based unique index
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS product_reviews_product_session_uidx
      ON product_reviews (product_id, session_id)
      WHERE session_id IS NOT NULL;
    `);

    await queryInterface.removeColumn("product_reviews", "contact_email_normalized");
    await queryInterface.removeColumn("product_reviews", "contact_phone_normalized");
    await queryInterface.removeColumn("product_reviews", "customer_id");
  },
};
