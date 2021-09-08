const express = require("express");
const router = express.Router();
const CommentController = require("../controllers/CommentController");
const { check } = require("express-validator");
const cors = require("cors");
router.use(cors());

router.get("/", CommentController.getComments);
router.post(
  "/",
  [check("commentBody").notEmpty().isLength({ min: 5, max: 300 })],
  CommentController.sendComment
);
router.delete("/", CommentController.deleteComment);
router.patch("/",CommentController.editComment)

module.exports = router;
