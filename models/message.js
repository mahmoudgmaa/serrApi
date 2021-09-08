const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  isPublic: { type: Boolean, required: true },
  isFavourite: { type: Boolean, required: true },
  userId: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  messageBody: { type: String, required: true, maxlength: 750, minlength: 5 },
  // comments: { type: mongoose.Types.ObjectId, required: true, ref: "Comment" },
  comment: { type: String, maxlength: 250 },
  date: { type: String, required: true },
  receiverUserName:{type:String}
});

module.exports = mongoose.model("Message", MessageSchema);
