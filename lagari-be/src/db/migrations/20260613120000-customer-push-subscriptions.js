"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("customer_push_subscriptions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "customers", key: "id" },
        onDelete: "SET NULL",
      },
      endpoint: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true,
      },
      p256dh: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      auth: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      user_agent: {
        type: Sequelize.STRING(512),
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

    await queryInterface.addIndex("customer_push_subscriptions", ["session_id"], {
      name: "customer_push_subscriptions_session_id_idx",
    });
    await queryInterface.addIndex("customer_push_subscriptions", ["customer_id"], {
      name: "customer_push_subscriptions_customer_id_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("customer_push_subscriptions");
  },
};
