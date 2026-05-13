module.exports = {
  attributes: {
    name: { type: 'string', required: true },
    description: { type: 'string' },
    userId: { type: 'string', required: true }, // Owner
    color: { type: 'string', defaultsTo: '#3B82F6' },
    icon: { type: 'string', defaultsTo: '📋' },
    createdAt: { type: 'number', autoCreatedAt: true },
    updatedAt: { type: 'number', autoUpdatedAt: true },
  },
};