"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM products WHERE slug = 'velocity' LIMIT 1;`,
    );
    if (existing.length > 0) {
      console.log("Product velocity already exists — skipping seed.");
      return;
    }

    const now = new Date();
    const [categories] = await queryInterface.sequelize.query(
      `SELECT id, slug FROM categories WHERE slug = 'for-men';`,
    );
    const [noteTags] = await queryInterface.sequelize.query(
      `SELECT id, slug FROM note_tags WHERE slug IN ('citrus', 'woody');`,
    );

    const menCat = categories[0];
    const citrusTag = noteTags.find((t) => t.slug === "citrus");
    const woodyTag = noteTags.find((t) => t.slug === "woody");

    const productId = (
      await queryInterface.sequelize.query(`SELECT uuid_generate_v4() AS id;`)
    )[0][0].id;

    const description = `
<p><strong>Bold. Electric. Unstoppable.</strong></p>
<p>Velocity is crafted for the modern man who moves with confidence and commands attention without saying a word. Clean sophistication meets magnetic intensity in this powerful blend designed to leave a lasting impression.</p>
<p>It opens with a fresh and energizing burst of aromatic herbs and sparkling citrus, creating an instantly sharp and refined introduction. As the fragrance evolves, spicy warmth and green nuances add depth, masculinity, and character.</p>
<p>The dry down reveals a bold fusion of mineral warmth, smoky woods, and sensual amber — smooth, addictive, and undeniably confident.</p>
<h3>The Experience</h3>
<p>Velocity begins crisp and aromatic, transitions into a subtly sweet and spicy heart, and finishes with a deep woody-mineral base that radiates power and sophistication.</p>
<p>It is fresh yet intense. Smooth yet daring. Refined yet rebellious.</p>
<p><strong>Perfect for:</strong> evening wear, office &amp; formal settings, fall &amp; spring seasons, night drives &amp; special occasions — men who prefer bold, modern masculine fragrances.</p>
`.trim();

    await queryInterface.bulkInsert("products", [
      {
        id: productId,
        slug: "velocity",
        title: "Velocity - Inspired by CH Bad Boy",
        description,
        designer_inspiration: "Carolina Herrera Bad Boy",
        scent_profile: "dark",
        top_notes: "Pink Pepper, Lime, Gin Tonic Accord",
        heart_notes: "Plum, Geranium, Cypress, Nutmeg",
        base_notes: "Truffle Accord, Vetiver, Texas Cedarwood, Amber",
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

    for (const tag of [citrusTag, woodyTag].filter(Boolean)) {
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
      await queryInterface.sequelize.query(`SELECT uuid_generate_v4() AS id;`)
    )[0][0].id;

    await queryInterface.bulkInsert("product_variants", [
      {
        id: variantId,
        product_id: productId,
        sku: "VEL-EDP-50",
        name: "Eau De Parfum – 50ML",
        price_pkr: 3200,
        compare_at_price_pkr: 3999,
        stock: 50,
        low_stock_threshold: 10,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);

    const imageId = (
      await queryInterface.sequelize.query(`SELECT uuid_generate_v4() AS id;`)
    )[0][0].id;

    const imageUrl = "/products/velocity.png";

    await queryInterface.bulkInsert("product_images", [
      {
        id: imageId,
        product_id: productId,
        url: imageUrl,
        sort_order: 0,
        is_hero: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      `SELECT id FROM products WHERE slug = 'velocity';`,
    );
    if (!rows.length) return;
    const productId = rows[0].id;
    await queryInterface.bulkDelete("product_images", { product_id: productId });
    await queryInterface.bulkDelete("product_variants", { product_id: productId });
    await queryInterface.bulkDelete("product_note_tags", { product_id: productId });
    await queryInterface.bulkDelete("product_categories", { product_id: productId });
    await queryInterface.bulkDelete("products", { id: productId });
  },
};
