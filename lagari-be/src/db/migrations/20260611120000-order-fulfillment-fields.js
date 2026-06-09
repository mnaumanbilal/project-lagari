"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("orders", "courier_name", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("orders", "tracking_number", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("orders", "admin_notes", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("orders", "admin_notes");
    await queryInterface.removeColumn("orders", "tracking_number");
    await queryInterface.removeColumn("orders", "courier_name");
  },
};
