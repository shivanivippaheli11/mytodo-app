/* eslint-disable no-dupe-class-members */
"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      Todo.belongsTo(models.User, {
        foreignKey: "userId",
      });
      // define association here
    }

    static addTodo({ title, dueDate, userId }) {
      return this.create({
        title: title,
        dueDate: dueDate,
        completed: false,
        userId,
      });
    }
    static getTodos() {
      return Todo.findAll();
    }
    static async overdue(userId) {
      // FILL IN HERE TO RETURN OVERDUE ITEMS
      return await Todo.findAll({
        where: {
          userId,
          dueDate: {
            [Op.lt]: new Date().toLocaleDateString("en-CA"),
          },
          completed: false,
        },
      });
    }

    static async dueToday(userId) {
      // FILL IN HERE TO RETURN ITEMS DUE tODAY
      return await Todo.findAll({
        where: {
          userId,
          dueDate: {
            [Op.eq]: new Date().toLocaleDateString("en-CA"),
          },
          completed: false,
        },
      });
    }

    static async dueLater(userId) {
      // FILL IN HERE TO RETURN ITEMS DUE LATER
      return await Todo.findAll({
        where: {
          userId,
          dueDate: {
            [Op.gt]: new Date().toLocaleDateString("en-CA"),
          },
          completed: false,
        },
      });
    }
    static async completedItems(userId) {
      // FILL IN HERE TO RETURN OVERDUE ITEMS
      return await Todo.findAll({
        where: {
          userId,
          completed: true,
        },
      });
    }

    // eslint-disable-next-line no-dupe-class-members

    static async remove(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }
    markAsCompleted() {
      return this.update({ completed: true });
    }
    setCompletionStatus(bol) {
      return this.update({ completed: bol });
    }
  }
  Todo.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          len: {
            args: 5,
            msg: "Give a more descriptive title for Todo",
          },
        },
      },
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};
