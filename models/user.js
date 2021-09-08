const mongoose = require("mongoose");
const uniqeValidator = require("mongoose-unique-validator");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: { type: String, required: true },
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 5 },
  img: { type: String, required: true },
  messages: [{ type: mongoose.Types.ObjectId, required: true, ref: "Message" }],
  sentMessages: [
    { type: mongoose.Types.ObjectId, required: true, ref: "Message" },
  ],
});

UserSchema.plugin(uniqeValidator);
module.exports = mongoose.model("User", UserSchema);
