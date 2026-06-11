"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("orders", "archived_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addIndex("orders", ["archived_at"], {
      name: "orders_archived_at_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("orders", "orders_archived_at_idx");
    await queryInterface.removeColumn("orders", "archived_at");
  },
};
