"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_orders_status" ADD VALUE IF NOT EXISTS 'cancelled';`,
    );

    await queryInterface.createTable("product_reviews", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "products", key: "id" },
        onDelete: "CASCADE",
      },
      author_name: { type: Sequelize.STRING, allowNull: false },
      rating: { type: Sequelize.INTEGER, allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: false },
      source: {
        type: Sequelize.ENUM("customer", "shopify"),
        allowNull: false,
        defaultValue: "customer",
      },
      is_published: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      shopify_legacy_id: { type: Sequelize.STRING, allowNull: true, unique: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("product_reviews", ["product_id", "is_published"], {
      name: "product_reviews_product_published_idx",
    });
    await queryInterface.addIndex("product_reviews", ["created_at"], {
      name: "product_reviews_created_at_idx",
    });

    await queryInterface.addIndex("analytics_events", ["event_name", "created_at"], {
      name: "analytics_events_name_created_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("analytics_events", "analytics_events_name_created_idx");
    await queryInterface.dropTable("product_reviews");
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_product_reviews_source";`);
  },
};
