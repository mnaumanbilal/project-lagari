"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
    );

    await queryInterface.createTable("categories", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
      },
      slug: { type: Sequelize.STRING, allowNull: false, unique: true },
      name: { type: Sequelize.STRING, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("note_tags", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
      },
      slug: { type: Sequelize.STRING, allowNull: false, unique: true },
      name: { type: Sequelize.STRING, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("products", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
      },
      slug: { type: Sequelize.STRING, allowNull: false, unique: true },
      title: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      designer_inspiration: { type: Sequelize.STRING, allowNull: true },
      scent_profile: {
        type: Sequelize.ENUM("light", "dark"),
        allowNull: true,
      },
      top_notes: { type: Sequelize.TEXT, allowNull: true },
      heart_notes: { type: Sequelize.TEXT, allowNull: true },
      base_notes: { type: Sequelize.TEXT, allowNull: true },
      catalog_type: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "fragrance",
      },
      is_published: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("products", ["slug"], {
      name: "products_slug_idx",
      where: { deleted_at: null },
    });
    await queryInterface.addIndex("products", ["designer_inspiration"], {
      name: "products_designer_inspiration_idx",
    });

    await queryInterface.createTable("product_categories", {
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "products", key: "id" },
        onDelete: "CASCADE",
      },
      category_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "categories", key: "id" },
        onDelete: "CASCADE",
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addConstraint("product_categories", {
      fields: ["product_id", "category_id"],
      type: "primary key",
      name: "product_categories_pkey",
    });

    await queryInterface.createTable("product_note_tags", {
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "products", key: "id" },
        onDelete: "CASCADE",
      },
      note_tag_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "note_tags", key: "id" },
        onDelete: "CASCADE",
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addConstraint("product_note_tags", {
      fields: ["product_id", "note_tag_id"],
      type: "primary key",
      name: "product_note_tags_pkey",
    });

    await queryInterface.createTable("product_variants", {
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
      sku: { type: Sequelize.STRING, allowNull: false, unique: true },
      name: { type: Sequelize.STRING, allowNull: false },
      price_pkr: { type: Sequelize.INTEGER, allowNull: false },
      compare_at_price_pkr: { type: Sequelize.INTEGER, allowNull: true },
      stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      low_stock_threshold: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("product_images", {
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
      url: { type: Sequelize.TEXT, allowNull: false },
      sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      is_hero: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("customers", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
      },
      phone: { type: Sequelize.STRING, allowNull: false, unique: true },
      full_name: { type: Sequelize.STRING, allowNull: true },
      email: { type: Sequelize.STRING, allowNull: true },
      rto_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("analytics_sessions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
      },
      started_at: { type: Sequelize.DATE, allowNull: false },
      last_activity_at: { type: Sequelize.DATE, allowNull: false },
      ended_at: { type: Sequelize.DATE, allowNull: true },
      user_agent: { type: Sequelize.TEXT, allowNull: true },
      referrer: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("orders", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
      },
      order_number: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        unique: true,
        allowNull: false,
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "customers", key: "id" },
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "analytics_sessions", key: "id" },
      },
      status: {
        type: Sequelize.ENUM(
          "pending",
          "confirmed",
          "shipped",
          "delivered",
          "rto",
        ),
        allowNull: false,
        defaultValue: "pending",
      },
      subtotal_pkr: { type: Sequelize.INTEGER, allowNull: false },
      discount_pkr: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_pkr: { type: Sequelize.INTEGER, allowNull: false },
      shipping_city: { type: Sequelize.STRING, allowNull: false },
      shipping_address: { type: Sequelize.TEXT, allowNull: false },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex("orders", ["status", "created_at"], {
      name: "orders_status_created_at_idx",
    });

    await queryInterface.createTable("order_items", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "orders", key: "id" },
        onDelete: "CASCADE",
      },
      variant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "product_variants", key: "id" },
      },
      product_title_snapshot: { type: Sequelize.STRING, allowNull: false },
      variant_name_snapshot: { type: Sequelize.STRING, allowNull: false },
      unit_price_pkr: { type: Sequelize.INTEGER, allowNull: false },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("admin_users", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
      },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("order_timeline_events", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "orders", key: "id" },
        onDelete: "CASCADE",
      },
      actor_admin_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "admin_users", key: "id" },
      },
      event_type: { type: Sequelize.STRING, allowNull: false },
      from_status: { type: Sequelize.STRING, allowNull: true },
      to_status: { type: Sequelize.STRING, allowNull: true },
      message: { type: Sequelize.TEXT, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("analytics_events", {
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
      event_name: { type: Sequelize.STRING, allowNull: false },
      payload: { type: Sequelize.JSONB, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("url_redirects", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
      },
      from_path: { type: Sequelize.STRING, allowNull: false, unique: true },
      to_path: { type: Sequelize.STRING, allowNull: false },
      status_code: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 301,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    const tables = [
      "url_redirects",
      "analytics_events",
      "order_timeline_events",
      "order_items",
      "orders",
      "analytics_sessions",
      "customers",
      "product_images",
      "product_variants",
      "product_note_tags",
      "product_categories",
      "products",
      "note_tags",
      "categories",
      "admin_users",
    ];
    for (const table of tables) {
      await queryInterface.dropTable(table);
    }
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_products_scent_profile";`,
    );
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_orders_status";`,
    );
  },
};
