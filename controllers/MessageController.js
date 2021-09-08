const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const Message = require("../models/message");
const User = require("../models/user");
const mongoose = require("mongoose");
const Date = require("../models/Date");
const Comment = require("../models/comment");

const getMessages = async (req, res, next) => {
  const { fbid } = req.query;
  if (!fbid) {
    return next(new HttpError("missing fbid in query", 422));
  }
  // let messages;
  let userWithMessages;
  try {
    // messages = await Message.find({ userId: fbid });
    userWithMessages = await User.findById(fbid).populate("messages");
  } catch (error) {
    return next(new HttpError("error loading messages", 422));
  }
  if (!userWithMessages) {
    return next(new HttpError("couldn't find user with the provided id", 422));
  }
  if (userWithMessages.messages.length === 0) {
    return res.status(201).json({
      message: "succeded",
      result: [],
    });
  }
  res.status(201).json({
    message: "succeded",
    result: userWithMessages.messages.map((m) => m.toObject({ getters: true })),
  });
};

const sendMessage = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.json({
      message: "message body should be from 5 to 750 charachters",
    });
  }
  const { userId, messageBody, senderId } = req.body;
  console.log(userId);
  console.log(messageBody);

  if (!userId || !messageBody) {
    return next(
      new HttpError("missing userId or messageBody in req body", 422)
    );
  }
  if (messageBody.length < 5 || messageBody.length > 750) {
    return res.json({
      message: "message body should be from 5 to 750 charachters",
    });
  }

  const dateObject = new Date();
  const date = dateObject.getDate();

  let message = new Message({
    isPublic: false,
    isFavourite: false,
    userId,
    messageBody,
    date,
    comment: "",
  });

  let user;
  try {
    user = await User.findById(userId);
  } catch (error) {
    return next(new HttpError("sending message failed, please try again", 500));
  }

  if (!user) {
    return next(new HttpError("couldn't find user with the provided id", 422));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    if (!senderId) {
      await message.save({ session: sess });
      user.messages.push(message);
      await user.save({ session: sess });
      console.log(message);
    } else {
      let sender = await User.findById(senderId);
      message.receiverUserName = user.name;
      await message.save({ session: sess });
      user.messages.push(message);
      await user.save({ session: sess });
      sender.sentMessages.push(message);
      await sender.save({ session: sess });
      console.log(message);
    }
    await sess.commitTransaction();
  } catch (error) {
    console.log(error);

    return next(
      new HttpError("couldn't send the message, please try again", 422)
    );
  }
  res.status(201).json({ message: "message sent succesfully" });
};

const setIsPublic = async (req, res, next) => {
  const { messageId } = req.body;
  if (!messageId) {
    return res
      .status(201)
      .json({ message: "missing messageId in body", status: false });
  }
  let message;
  try {
    message = await Message.findById(messageId);
  } catch (error) {
    return next(new HttpError("Error happen while saving updates", 422));
  }

  message.isPublic = !message.isPublic;
  try {
    await message.save();
  } catch (error) {
    return next(new HttpError("Error happen while saving updates", 422));
  }

  res.status(201).json({ message: "message updated succefully", status: true });
};

const setIsFavourite = async (req, res, next) => {
  const { messageId } = req.body;
  if (!messageId) {
    return res
      .status(201)
      .json({ message: "missing messageId in body", status: false });
  }
  let message;
  try {
    message = await Message.findById(messageId);
  } catch (error) {
    return next(new HttpError("Error happen while saving updates", 422));
  }
  message.isFavourite = !message.isFavourite;
  try {
    await message.save();
  } catch (error) {
    return next(new HttpError("Error happen while saving updates", 422));
  }
  res.status(201).json({ message: "message updates succefully", status: true });
};

const deleteMessage = async (req, res, next) => {
  const { messageId } = req.query;
  if (!messageId) {
    return next(new HttpError("missing messageId in body", 422));
  }
  let message;
  try {
    message = await Message.findById(messageId).populate("userId");
  } catch (error) {
    return next(
      new HttpError("something went wrong, couldn't delete the message", 500)
    );
  }

  if (!message) {
    return next(new HttpError("couldn't find message for this id", 404));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await message.remove({ session: sess });
    message.userId.messages.pull(message);
    await message.userId.save({ session: sess });
    await sess.commitTransaction();
  } catch (error) {
    return next(
      new HttpError("something went wrong, couldn't delete the message", 500)
    );
  }
  res.status(200).json({ message: "message deleted" });
};

const getFavouriteMessages = async (req, res, next) => {
  const { fbid } = req.query;
  if (!fbid) {
    return next(new HttpError("missing fbid in query", 422));
  }
  // let messages;
  let userWithMessages;
  try {
    // messages = await Message.find({ userId: fbid });
    userWithMessages = await User.findById(fbid).populate("messages");
  } catch (error) {
    console.log(error);
    return next(new HttpError("error loading messages", 422));
  }
  if (!userWithMessages || userWithMessages.messages.length === 0) {
    return res.json({
      message: "succeded",
      result: [],
    });
  }
  const fav = userWithMessages.messages.filter((m) => m.isFavourite === true);

  if (fav.length === 0) {
    return res.json({
      message: "succeded",
      result: [],
    });
  }

  res.status(201).json({
    message: "succeded",
    result: fav.map((m) => m.toObject({ getters: true })),
  });
};

const getPublicMessages = async (req, res, next) => {
  const { fbid } = req.query;
  if (!fbid) {
    return next(new HttpError("missing fbid in query", 422));
  }
  // let messages;
  let userWithMessages;
  try {
    // messages = await Message.find({ userId: fbid });
    userWithMessages = await User.findById(fbid).populate("messages");
  } catch (error) {
    console.log(error);
    return next(new HttpError("error loading messages", 422));
  }
  if (!userWithMessages || userWithMessages.messages.length === 0) {
    return res.json({
      message: "succeded",
      result: [],
    });
  }
  const fav = userWithMessages.messages.filter((m) => m.isPublic === true);

  if (fav.length === 0) {
    return res.json({
      message: "succeded",
      result: [],
    });
  }

  res.status(201).json({
    message: "succeded",
    result: fav.map((m) => m.toObject({ getters: true })),
  });
};

const getSentMessages = async (req, res, next) => {
  const { fbid } = req.query;
  if (!fbid) {
    return next(new HttpError("missing fbid in query", 422));
  }
  // let messages;
  let userWithMessages;
  try {
    // messages = await Message.find({ userId: fbid });
    userWithMessages = await User.findById(fbid).populate("sentMessages");
  } catch (error) {
    console.log(error);
    return next(new HttpError("error loading messages", 422));
  }
  if (!userWithMessages || userWithMessages.sentMessages.length === 0) {
    return res.json({
      message: "succeded",
      result: [],
    });
  }
  res.status(201).json({
    message: "succeded",
    result: userWithMessages.sentMessages.map((m) => {
      return m.toObject({ getters: true });
    }),
  });
};

const setComment = async (req, res, next) => {
  const { messageId, commentBody } = req.body;
  if (!messageId) {
    return next(
      new HttpError("missing messageId or commentBody in query", 422)
    );
  }
  let message;
  try {
    message = await Message.findById(messageId);
  } catch (error) {
    return next(new HttpError("Error happen while saving comment", 422));
  }
  message.comment = commentBody;
  try {
    await message.save();
  } catch (error) {
    return next(new HttpError("Error happen while saving comment", 422));
  }
  res.status(201).json({ message: "comment updates succefully" });
};

const deleteComment = async (req, res, next) => {
  const { messageId } = req.body;
  if (!messageId) {
    return next(new HttpError("missing messageId in query", 422));
  }
  let message;
  try {
    message = await Message.findById(messageId);
  } catch (error) {
    return next(new HttpError("Error happen while deleting comment", 422));
  }
  message.comment = "";
  try {
    await message.save();
  } catch (error) {
    return next(new HttpError("Error happen while deleting comment", 422));
  }
  res.status(201).json({ message: "comment deleted succefully" });
};

exports.getMessages = getMessages;
exports.sendMessage = sendMessage;
exports.setIsPublic = setIsPublic;
exports.setIsFavourite = setIsFavourite;
exports.getPublicMessages = getPublicMessages;
exports.getFavouriteMessages = getFavouriteMessages;
exports.deleteMessage = deleteMessage;
exports.getSentMessages = getSentMessages;
exports.setComment = setComment;
exports.deleteComment = deleteComment;
