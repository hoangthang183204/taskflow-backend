/**
 * User.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

const bcrypt = require("bcrypt");

module.exports = {
  attributes: {
    id: {
      type: "string",
      required: true,
      unique: true,
    },
    name: {
      type: "string",
      required: true,
    },

    email: {
      type: "string",
      required: true,
      unique: true,
    },

    password: {
      type: "string",
      required: true,
    },

    isDeleted: {
      type: "boolean",
      defaultsTo: false,
    },
    deletedAt: {
      type: "string",
      allowNull: true,
    },
  },

  beforeCreate: async function (values, proceed) {
    try {
      const hashed = await bcrypt.hash(values.password, 10);
      values.password = hashed;
      return proceed();
    } catch (err) {
      return proceed(err);
    }
  }, // Tự động mã hoá mật khẩu trước khi lưu vào database

  beforeFind: (criteria, proceed) => {
    if (!criteria.where) criteria.where = {};
    if (criteria.where.isDeleted === undefined) {
      criteria.where.isDeleted = false;
    }
    return proceed();
  }, // Tự động filter user đã xóa
};
