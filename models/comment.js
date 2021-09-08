const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  messageId: { type: mongoose.Types.ObjectId, required: true, ref: "Message" },
  commentBody: { type: String, required: true, maxlength: 300, minlength: 5 },
  date: { type: String, required: true },
});

module.exports = mongoose.model("Comment", CommentSchema);
