const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const UserControllers = require("../controllers/UserController");
const cors = require("cors");
const fileUpload = require("../middleware/fileUpload");

router.use(cors());

router.post(
  "/signup",
  [
    check("name").notEmpty().isLength({ min: 2, max: 20 }),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  UserControllers.signUp
);

router.post(
  "/login",
  [check("email").notEmpty(), check("password").notEmpty()],
  UserControllers.logIn
);

router.get("/", UserControllers.getUser);

router.delete("/", UserControllers.deleteUser);

router.patch(
  "/",
  fileUpload.single("img"),
  [check("name").notEmpty().isLength({ min: 2, max: 20 })],
  UserControllers.updateUser
);

router.get("/search", UserControllers.getUserBySearch);
router.post("/googleSign", UserControllers.googleSign);

module.exports = router;
