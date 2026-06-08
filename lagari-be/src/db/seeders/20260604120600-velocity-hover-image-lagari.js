"use strict";

const VELOCITY_HOVER_URL =
  "https://www.lagari.pk/cdn/shop/files/rn-image_picker_lib_temp_26122126-acbd-4cc8-91fc-e2b08d125e56.png?v=1778198316";

const OLD_UNSPLASH_HOVER =
  "https://images.unsplash.com/photo-1592945403247-bfd446f253d6?w=800&q=80";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const [products] = await queryInterface.sequelize.query(
      `SELECT id FROM products WHERE slug = 'velocity' LIMIT 1;`,
    );
    if (!products.length) return;

    const productId = products[0].id;

    const [updated] = await queryInterface.sequelize.query(
      `UPDATE product_images
       SET url = :url, updated_at = :now
       WHERE product_id = :productId
         AND (url = :oldUrl OR (is_hero = false AND sort_order = 1))
       RETURNING id;`,
      {
        replacements: {
          url: VELOCITY_HOVER_URL,
          oldUrl: OLD_UNSPLASH_HOVER,
          productId,
          now,
        },
      },
    );

    if (updated.length > 0) {
      console.log("Velocity hover image updated to Lagari CDN URL.");
      return;
    }

    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM product_images WHERE product_id = :productId AND url = :url LIMIT 1;`,
      { replacements: { productId, url: VELOCITY_HOVER_URL } },
    );
    if (existing.length > 0) return;

    const imageId = (
      await queryInterface.sequelize.query(`SELECT uuid_generate_v4() AS id;`)
    )[0][0].id;

    await queryInterface.bulkInsert("product_images", [
      {
        id: imageId,
        product_id: productId,
        url: VELOCITY_HOVER_URL,
        sort_order: 1,
        is_hero: false,
        created_at: now,
        updated_at: now,
      },
    ]);
    console.log("Velocity hover image inserted.");
  },

  async down(queryInterface) {
    const [products] = await queryInterface.sequelize.query(
      `SELECT id FROM products WHERE slug = 'velocity' LIMIT 1;`,
    );
    if (!products.length) return;
    await queryInterface.sequelize.query(
      `UPDATE product_images SET url = :oldUrl WHERE product_id = :productId AND url = :url;`,
      {
        replacements: {
          productId: products[0].id,
          url: VELOCITY_HOVER_URL,
          oldUrl: OLD_UNSPLASH_HOVER,
        },
      },
    );
  },
};
