const { Schema, model } = require("mongoose");
const { ObjectId } = Schema.Types;

const schema = new Schema(
  {
    psuId: {
      type: String,
      trim: true,
      unique: true,
      index: true,
      require: true,
    },
    isAdmin: { type: Boolean, default: true },
    name: { th: { type: String }, en: { type: String } },
    allowedField: [{ type: String }],

    createdBy: { type: ObjectId, ref: "Admin", default: null },
    updatedBy: { type: ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true },
);

module.exports = model("Admin", schema);
