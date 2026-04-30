module.exports.models = {
  migrate: "safe",  
  // migrate: "alter",
  
  attributes: {
    createdAt: { type: "number", autoCreatedAt: true },
    updatedAt: { type: "number", autoUpdatedAt: true },
    id: { type: 'string', columnName: '_id' },
  },

  dataEncryptionKeys: {
    default: "nw+FApd7X/A1IyhkTXrXNG80TJpaAcsNYKlMfzQfjvM=",
  },

  cascadeOnDestroy: true,
};