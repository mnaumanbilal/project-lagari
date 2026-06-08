"use strict";

const bcrypt = require("bcrypt");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const [categories] = await queryInterface.sequelize.query(
      `SELECT id, slug FROM categories WHERE slug IN ('for-men', 'unisex');`,
    );
    const [noteTags] = await queryInterface.sequelize.query(
      `SELECT id, slug FROM note_tags WHERE slug IN ('oud', 'woody');`,
    );

    const menCat = categories.find((c) => c.slug === "for-men");
    const unisexCat = categories.find((c) => c.slug === "unisex");
    const oudTag = noteTags.find((t) => t.slug === "oud");
    const woodyTag = noteTags.find((t) => t.slug === "woody");

    const productId = (
      await queryInterface.sequelize.query(
        `SELECT uuid_generate_v4() AS id;`,
      )
    )[0][0].id;

    await queryInterface.bulkInsert("products", [
      {
        id: productId,
        slug: "desert-noir",
        title: "Desert Noir",
        description:
          "<p>An artisanal impression of Louis Vuitton Ombre Nomade — deep oud, amber, and spice for evening wear.</p>",
        designer_inspiration: "Louis Vuitton Ombre Nomade",
        scent_profile: "dark",
        top_notes: "Bergamot, Raspberry",
        heart_notes: "Oud, Rose",
        base_notes: "Amber, Musk",
        catalog_type: "fragrance",
        is_published: true,
        deleted_at: null,
        created_at: now,
        updated_at: now,
      },
    ]);

    if (menCat) {
      await queryInterface.bulkInsert("product_categories", [
        {
          product_id: productId,
          category_id: menCat.id,
          created_at: now,
          updated_at: now,
        },
      ]);
    }
    if (unisexCat) {
      await queryInterface.bulkInsert("product_categories", [
        {
          product_id: productId,
          category_id: unisexCat.id,
          created_at: now,
          updated_at: now,
        },
      ]);
    }
    for (const tag of [oudTag, woodyTag].filter(Boolean)) {
      await queryInterface.bulkInsert("product_note_tags", [
        {
          product_id: productId,
          note_tag_id: tag.id,
          created_at: now,
          updated_at: now,
        },
      ]);
    }

    const variantId = (
      await queryInterface.sequelize.query(
        `SELECT uuid_generate_v4() AS id;`,
      )
    )[0][0].id;

    await queryInterface.bulkInsert("product_variants", [
      {
        id: variantId,
        product_id: productId,
        sku: "DN-50-EXTRAIT",
        name: "50ml Extrait",
        price_pkr: 6500,
        compare_at_price_pkr: null,
        stock: 25,
        low_stock_threshold: 10,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);

    await queryInterface.bulkInsert("product_images", [
      {
        id: (
          await queryInterface.sequelize.query(
            `SELECT uuid_generate_v4() AS id;`,
          )
        )[0][0].id,
        product_id: productId,
        url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        sort_order: 0,
        is_hero: true,
        created_at: now,
        updated_at: now,
      },
    ]);

    const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin";
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin";
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    await queryInterface.bulkInsert("admin_users", [
      {
        id: (
          await queryInterface.sequelize.query(
            `SELECT uuid_generate_v4() AS id;`,
          )
        )[0][0].id,
        email: adminEmail,
        password_hash: passwordHash,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("admin_users", null, {});
    await queryInterface.bulkDelete("product_images", null, {});
    await queryInterface.bulkDelete("product_variants", null, {});
    await queryInterface.bulkDelete("product_note_tags", null, {});
    await queryInterface.bulkDelete("product_categories", null, {});
    await queryInterface.bulkDelete("products", { slug: "desert-noir" }, {});
  },
};
