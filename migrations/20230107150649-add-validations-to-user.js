"use strict";
const bcrypt = require("bcrypt");

module.exports = {
  async up(queryInterface, Sequelize) {
    queryInterface.changeColumn("Users", "firstName", {
      type: Sequelize.DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: true,
        len: { args: 1, msg: "FirstName Required" },
      },
    });
    queryInterface.changeColumn("Users", "email", {
      type: Sequelize.DataTypes.STRING,
      allowNull: false,
      unique: {
        args: true,
        msg: "Credentials already existing , Try Sign-in",
      },
      validate: {
        notNull: true,
        len: {
          args: 1,
          msg: "Email Required",
        },
      },
    });
    queryInterface.changeColumn("Users", "password", {
      type: Sequelize.DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: true,
        async passwordCheck(value) {
          if (await bcrypt.compare("", value)) {
            throw new Error("Password invalid");
          }
        },
      },
    });

    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down(queryInterface, Sequelize) {
    queryInterface.changeColumn("Users", "firstName", {
      type: Sequelize.DataTypes.STRING,
    });
    queryInterface.changeColumn("Users", "email", {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });
    queryInterface.changeColumn("Users", "password", {
      type: Sequelize.STRING,
    });

    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
