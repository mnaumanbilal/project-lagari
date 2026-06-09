"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("analytics_visitors", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
      },
      first_seen_at: { type: Sequelize.DATE, allowNull: false },
      last_seen_at: { type: Sequelize.DATE, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("analytics_visitors", ["first_seen_at"], {
      name: "analytics_visitors_first_seen_idx",
    });

    await queryInterface.addColumn("analytics_sessions", "visitor_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: "analytics_visitors", key: "id" },
      onDelete: "SET NULL",
    });

    await queryInterface.addIndex(
      "analytics_sessions",
      ["visitor_id", "started_at"],
      { name: "analytics_sessions_visitor_started_idx" },
    );

    await queryInterface.createTable("analytics_event_fingerprints", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "analytics_sessions", key: "id" },
        onDelete: "CASCADE",
      },
      visitor_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "analytics_visitors", key: "id" },
        onDelete: "SET NULL",
      },
      event_name: { type: Sequelize.STRING(64), allowNull: false },
      dedup_key: { type: Sequelize.STRING(255), allowNull: false },
      bucket_date: { type: Sequelize.DATEONLY, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex(
      "analytics_event_fingerprints",
      ["session_id", "event_name", "dedup_key", "bucket_date"],
      {
        name: "analytics_fingerprints_dedup_unique",
        unique: true,
      },
    );

    await queryInterface.addIndex(
      "analytics_event_fingerprints",
      ["event_name", "bucket_date"],
      { name: "analytics_fingerprints_event_date_idx" },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("analytics_event_fingerprints");
    await queryInterface.removeIndex(
      "analytics_sessions",
      "analytics_sessions_visitor_started_idx",
    );
    await queryInterface.removeColumn("analytics_sessions", "visitor_id");
    await queryInterface.dropTable("analytics_visitors");
  },
};
