const express = require("express");
const router = express.Router();
const MessageController = require("../controllers/MessageController");
const { check } = require("express-validator");
const checkAuth = require("../middleware/check-auth");
const cors = require("cors");
router.use(cors());

router.get("/publicMessages", MessageController.getPublicMessages);
router.post(
  "/",
  [check("messageBody").notEmpty().isLength({ min: 5, max: 750 })],
  MessageController.sendMessage
);

router.use(checkAuth);
router.get("/favouriteMessages", MessageController.getFavouriteMessages);
router.get("/sentMessages", MessageController.getSentMessages);
router.get("/", MessageController.getMessages);
router.delete("/", MessageController.deleteMessage);
router.patch("/setIsPublic", MessageController.setIsPublic);
router.patch("/setIsFavourite", MessageController.setIsFavourite);
router.patch("/setComment",MessageController.setComment);
router.delete("/deleteComment",MessageController.deleteComment)

module.exports = router;
