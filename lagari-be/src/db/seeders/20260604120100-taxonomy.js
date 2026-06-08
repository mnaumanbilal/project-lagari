"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const categories = [
      { slug: "for-men", name: "For Men" },
      { slug: "for-women", name: "For Women" },
      { slug: "unisex", name: "Unisex" },
      { slug: "all", name: "All" },
    ].map((c) => ({
      id: queryInterface.sequelize.literal("uuid_generate_v4()"),
      ...c,
      created_at: now,
      updated_at: now,
    }));

    const noteTags = [
      { slug: "oud", name: "Oud" },
      { slug: "citrus", name: "Citrus" },
      { slug: "floral", name: "Floral" },
      { slug: "woody", name: "Woody" },
      { slug: "gourmand", name: "Gourmand" },
    ].map((t) => ({
      id: queryInterface.sequelize.literal("uuid_generate_v4()"),
      ...t,
      created_at: now,
      updated_at: now,
    }));

    await queryInterface.bulkInsert("categories", categories);
    await queryInterface.bulkInsert("note_tags", noteTags);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("note_tags", null, {});
    await queryInterface.bulkDelete("categories", null, {});
  },
};
