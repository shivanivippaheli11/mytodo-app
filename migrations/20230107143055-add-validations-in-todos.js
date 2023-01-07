"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Todos", "title", {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notNull: true,
        len: {
          args: 5,
          msg: "Give a more descriptive title for Todo",
        },
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Todos", "title", {
      type: Sequelize.STRING,
    });
  },
};
