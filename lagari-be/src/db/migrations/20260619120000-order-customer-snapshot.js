"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("orders", "customer_name_snapshot", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("orders", "customer_phone_snapshot", {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
    await queryInterface.addColumn("orders", "customer_email_snapshot", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.sequelize.query(`
      UPDATE orders o
      SET customer_name_snapshot = c.full_name,
          customer_phone_snapshot = c.phone,
          customer_email_snapshot = c.email
      FROM customers c
      WHERE o.customer_id = c.id
        AND o.customer_name_snapshot IS NULL
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("orders", "customer_email_snapshot");
    await queryInterface.removeColumn("orders", "customer_phone_snapshot");
    await queryInterface.removeColumn("orders", "customer_name_snapshot");
  },
};
