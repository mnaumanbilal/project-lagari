"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("admin_notifications", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
      },
      type: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      link_path: {
        type: Sequelize.STRING(512),
        allowNull: true,
      },
      payload: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("admin_notifications", ["created_at"], {
      name: "admin_notifications_created_at_idx",
    });
    await queryInterface.addIndex("admin_notifications", ["read_at"], {
      name: "admin_notifications_read_at_idx",
    });
    await queryInterface.addIndex("admin_notifications", ["type"], {
      name: "admin_notifications_type_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("admin_notifications");
  },
};
