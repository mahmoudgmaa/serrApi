const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const Message = require("../models/message");
const Comment = require("../models/comment");
const mongoose = require("mongoose");
const Date = require("../models/Date");

const sendComment = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.json({
      message: "comment body should be from 5 to 300 charachters",
    });
  }
  const { messageId, commentBody, commentId } = req.body;
  if (!messageId || !commentBody) {
    return next(
      new HttpError("missing messageId or commentBody in req body", 422)
    );
  }
  if (commentBody.length < 5 || commentBody.length > 300) {
    return res.json({
      message: "comment body should be from 5 to 300 charachters",
    });
  }
  const dateObject = new Date();
  const date = dateObject.getDate();
  console.log(date);

  const comment = new Comment({
    _id: commentId,
    commentBody,
    messageId,
    date,
  });
  let message;
  try {
    message = await Message.findById(messageId);
  } catch (error) {
    return next(new HttpError("sending comment failed, please try again", 500));
  }
  if (!message) {
    return next(
      new HttpError("couldn't find message with the provided id", 422)
    );
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await comment.save({ session: sess });
    await sess.commitTransaction();
  } catch (error) {
    console.log(error);
    return next(
      new HttpError("couldn't send the comment, please try again", 422)
    );
  }
  res.status(201).json({ message: "comment sent succesfully" });
};
const getComments = async (req, res, next) => {
  const { messageId } = req.query;
  if (!messageId) {
    return next(new HttpError("missing messageId in query", 422));
  }
  let messageWithComments;
  try {
    messageWithComments = await Message.findById(messageId).populate(
      "comments"
    );
  } catch (error) {
    console.log(error);
    return next(new HttpError("error loading comments", 422));
  }
  if (!messageWithComments) {
    //|| messageWithComments.comments.length === 0
    return res.json({
      message: "couldn't find comments for the provided user id",
    });
  }
  res.status(201).json({
    message: "succeded",
    //messageWithComments.comments.map((c) =>
    result: messageWithComments.comments.toObject({ getters: true }),
    //),
  });
};
const deleteComment = async (req, res, next) => {
  const { commentId } = req.query;
  if (!commentId) {
    return next(new HttpError("missing commentId in body", 422));
  }
  let comment;
  try {
    comment = await Comment.findById(commentId).populate("messageId");
  } catch (error) {
    return next(
      new HttpError("something went wrong, couldn't delete the comment", 500)
    );
  }
  if (!comment) {
    return next(new HttpError("couldn't find comment for this id", 404));
  }
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await comment.remove({ session: sess });
    await sess.commitTransaction();
  } catch (error) {
    return next(
      new HttpError("something went wrong, couldn't delete the comment", 500)
    );
  }
  res.status(200).json({ message: "comment deleted" });
};
const editComment = async (req, res, next) => {
  const { commentId, commentBody } = req.body;
  if (!commentId || !commentBody) {
    return next(
      new HttpError("missing commentId or commentBody in req body", 422)
    );
  }
  let comment;
  try {
    comment = await Comment.findById(commentId);
    if (!comment) {
      return next(
        new HttpError("couldn't find a comment for the provided id", 422)
      );
    }
    comment.commentBody = commentBody;
    await comment.save();
  } catch (error) {
    return next(new HttpError("something went wrong", 500));
  }
  res.status(201).json({ message: "commednt updated successfully" });
};

exports.sendComment = sendComment;
exports.getComments = getComments;
exports.deleteComment = deleteComment;
exports.editComment = editComment;
