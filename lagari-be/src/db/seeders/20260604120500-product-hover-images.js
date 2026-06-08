"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const extras = [
      {
        slug: "velocity",
        url: "https://www.lagari.pk/cdn/shop/files/rn-image_picker_lib_temp_26122126-acbd-4cc8-91fc-e2b08d125e56.png?v=1778198316",
        sort_order: 1,
      },
      {
        slug: "desert-noir",
        url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        sort_order: 1,
      },
    ];

    for (const extra of extras) {
      const [products] = await queryInterface.sequelize.query(
        `SELECT id FROM products WHERE slug = :slug LIMIT 1;`,
        { replacements: { slug: extra.slug } },
      );
      if (!products.length) continue;

      const productId = products[0].id;
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM product_images WHERE product_id = :productId AND url = :url LIMIT 1;`,
        { replacements: { productId, url: extra.url } },
      );
      if (existing.length > 0) continue;

      const imageId = (
        await queryInterface.sequelize.query(`SELECT uuid_generate_v4() AS id;`)
      )[0][0].id;

      await queryInterface.bulkInsert("product_images", [
        {
          id: imageId,
          product_id: productId,
          url: extra.url,
          sort_order: extra.sort_order,
          is_hero: false,
          created_at: now,
          updated_at: now,
        },
      ]);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("product_images", {
      url: [
        "https://www.lagari.pk/cdn/shop/files/rn-image_picker_lib_temp_26122126-acbd-4cc8-91fc-e2b08d125e56.png?v=1778198316",
        "https://images.unsplash.com/photo-1592945403247-bfd446f253d6?w=800&q=80",
        "https://images.unsplash.com/photo-1594035910387-825bfedda501?w=800&q=80",
      ],
    });
  },
};
