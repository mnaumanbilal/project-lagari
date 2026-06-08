"use strict";

const bcrypt = require("bcrypt");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const email = "admin";
    const password = "admin";
    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();

    const [rows] = await queryInterface.sequelize.query(
      `SELECT id FROM admin_users WHERE email = :email LIMIT 1;`,
      { replacements: { email } },
    );

    if (rows.length > 0) {
      await queryInterface.sequelize.query(
        `UPDATE admin_users SET password_hash = :passwordHash, updated_at = :now WHERE email = :email;`,
        { replacements: { email, passwordHash, now } },
      );
      console.log(`Admin user "${email}" password updated.`);
      return;
    }

    const id = (
      await queryInterface.sequelize.query(`SELECT uuid_generate_v4() AS id;`)
    )[0][0].id;

    await queryInterface.bulkInsert("admin_users", [
      {
        id,
        email,
        password_hash: passwordHash,
        created_at: now,
        updated_at: now,
      },
    ]);
    console.log(`Admin user "${email}" created.`);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("admin_users", { email: "admin" });
  },
};
