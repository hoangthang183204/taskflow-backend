module.exports.models = {
  // migrate: "safe",
  // // migrate: "alter",

  // attributes: {
  //   createdAt: { type: "number", autoCreatedAt: true },
  //   updatedAt: { type: "number", autoUpdatedAt: true },
  //   id: { type: 'string', columnName: '_id' },
  // },

  migrate: "safe",
  attributes: {
    createdAt: { type: "number", autoCreatedAt: true },
    updatedAt: { type: "number", autoUpdatedAt: true },
    id: { type: "number", autoIncrement: true }, // PostgreSQL dùng số tự tăng
  },

  dataEncryptionKeys: {
    default: "nw+FApd7X/A1IyhkTXrXNG80TJpaAcsNYKlMfzQfjvM=",
  },

  cascadeOnDestroy: true,
};
