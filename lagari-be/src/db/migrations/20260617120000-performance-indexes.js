"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS analytics_events_session_created_idx
        ON analytics_events (session_id, created_at);

      CREATE INDEX IF NOT EXISTS analytics_sessions_active_last_activity_idx
        ON analytics_sessions (last_activity_at)
        WHERE ended_at IS NULL;

      CREATE INDEX IF NOT EXISTS orders_session_status_idx
        ON orders (session_id, status);

      CREATE INDEX IF NOT EXISTS product_variants_product_id_idx
        ON product_variants (product_id);

      CREATE INDEX IF NOT EXISTS order_items_order_id_idx
        ON order_items (order_id);

      CREATE INDEX IF NOT EXISTS order_items_variant_id_idx
        ON order_items (variant_id);

      CREATE INDEX IF NOT EXISTS products_published_list_idx
        ON products (is_published, deleted_at, created_at DESC);

      CREATE INDEX IF NOT EXISTS product_categories_category_id_idx
        ON product_categories (category_id);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS analytics_events_session_created_idx;
      DROP INDEX IF EXISTS analytics_sessions_active_last_activity_idx;
      DROP INDEX IF EXISTS orders_session_status_idx;
      DROP INDEX IF EXISTS product_variants_product_id_idx;
      DROP INDEX IF EXISTS order_items_order_id_idx;
      DROP INDEX IF EXISTS order_items_variant_id_idx;
      DROP INDEX IF EXISTS products_published_list_idx;
      DROP INDEX IF EXISTS product_categories_category_id_idx;
    `);
  },
};
