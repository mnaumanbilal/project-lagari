"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [result] = await queryInterface.sequelize.query(
      `DELETE FROM product_images WHERE url LIKE '%images.unsplash.com%' RETURNING id;`,
    );
    if (result.length > 0) {
      console.log(`Removed ${result.length} broken Unsplash product image(s).`);
    }

    const now = new Date();
    const [desert] = await queryInterface.sequelize.query(
      `SELECT id FROM products WHERE slug = 'desert-noir' LIMIT 1;`,
    );
    if (desert.length > 0) {
      const productId = desert[0].id;
      const [hasHover] = await queryInterface.sequelize.query(
        `SELECT id FROM product_images WHERE product_id = :productId AND is_hero = false LIMIT 1;`,
        { replacements: { productId } },
      );
      if (!hasHover.length) {
        const imageId = (
          await queryInterface.sequelize.query(`SELECT uuid_generate_v4() AS id;`)
        )[0][0].id;
        await queryInterface.bulkInsert("product_images", [
          {
            id: imageId,
            product_id: productId,
            url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
            sort_order: 1,
            is_hero: false,
            created_at: now,
            updated_at: now,
          },
        ]);
      }
    }
  },

  async down() {
    /* no-op */
  },
};
