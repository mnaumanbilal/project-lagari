"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("product_reviews", "is_verified_purchase", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn("product_reviews", "session_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: "analytics_sessions", key: "id" },
      onDelete: "SET NULL",
    });
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX product_reviews_product_session_uidx
      ON product_reviews (product_id, session_id)
      WHERE session_id IS NOT NULL;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS product_reviews_product_session_uidx;`,
    );
    await queryInterface.removeColumn("product_reviews", "session_id");
    await queryInterface.removeColumn("product_reviews", "is_verified_purchase");
  },
};
