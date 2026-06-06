const { Schema, model } = require('mongoose');
const { ObjectId } = Schema.Types;

const schema = new Schema(
  {
    adminId: { type: ObjectId, ref: 'Admin', default: null },
    action: { type: String, required: true },
    description: { type: String, required: true },
    inputData: { type: Schema.Types.Mixed, default: null },
    outputData: { type: Schema.Types.Mixed, default: null },
    ipAddress: { type: String, required: true },
    userAgent: { type: String, required: true },
  },
  { timestamps: true },
);

module.exports = model('Log', schema);
