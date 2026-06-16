"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("order_items", "product_slug_snapshot", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.sequelize.query(`
      UPDATE order_items oi
      SET product_slug_snapshot = p.slug
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE oi.variant_id = pv.id
        AND oi.product_slug_snapshot IS NULL
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("order_items", "product_slug_snapshot");
  },
};
