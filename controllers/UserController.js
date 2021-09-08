const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const User = require("../models/user");
const bycrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(
  "951458547942-k3hcfssnc6r7tue6ufvc4acptbojjtsi.apps.googleusercontent.com"
);
const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");
const { Storage } = require("@google-cloud/storage");
const path = require("path");
const { v4: uuid } = require("uuid");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "serr-seccret.appspot.com",
});

const signUp = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty) {
    return next(new HttpError("invalid inputs, please check your data", 422));
  }
  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    return next(new HttpError("signing up failed please try again", 500));
  }
  if (existingUser) {
    const error = new HttpError(
      "User exists already, please login instead.",
      422
    );
    return next(error);
  }
  let hashedPassword;

  try {
    hashedPassword = await bycrypt.hash(password, 12);
  } catch (error) {
    console.log(error);
    return next(new HttpError("couldn't create a user, please try again", 500));
  }

  let ud = uuid().split("-");
  const createdUser = new User({
    name,
    username: name + "_" + ud[0] + ud[1],
    email,
    password: hashedPassword,
    messages: [],
    sentMessages: [],
    img: "https://storage.googleapis.com/profile-pictures-for-serr-secret/profile-user.png",
  });
  try {
    await createdUser.save();
  } catch (error) {
    return next(new HttpError("signing up failed please try again", 500));
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: createdUser.id,
        email: createdUser.email,
      },
      "supersecret_never_share_it",
      { expiresIn: "350d" }
    );
  } catch (error) {
    return next(new HttpError("signing up failed please try again", 500));
  }
  res.status(201).json({
    userId: createdUser.id,
    username: createdUser.username,
    email: createdUser.email,
    token: token,
    name: createdUser.name,
    img: createdUser.img,
  });
};

const logIn = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return next(new HttpError("invalid inputs, please check your data", 422));
  }

  const { email, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    return next(new HttpError("logging in failed please try again", 500));
  }
  if (!existingUser) {
    return next(new HttpError("Invalid credentials, couldn't log you in", 401));
  }
  let isValidatePaassword = false;
  try {
    isValidatePaassword = await bycrypt.compare(
      password,
      existingUser.password
    );
  } catch (error) {
    return next(
      new HttpError(
        "couldn't log you in, please check your credintials and try again",
        500
      )
    );
  }

  if (!isValidatePaassword) {
    return next(
      new HttpError(
        "couldn't log you in, please check your credintials and try again",
        401
      )
    );
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      "supersecret_never_share_it",
      { expiresIn: "350d" }
    );
  } catch (error) {
    return next(new HttpError("logging in failed please try again", 500));
  }

  res.json({
    name: existingUser.name,
    username: existingUser.username,
    userId: existingUser.id,
    email: existingUser.email,
    img: existingUser.img,
    token: token,
  });
};

const getUser = async (req, res, next) => {
  const { fbid } = req.query;

  if (!fbid) {
    return next(new HttpError("missing fbid or name from query", 404));
  }

  let user;
  try {
    user = await User.findById(fbid).select([
      "-email",
      "-password",
      "-messages",
      "-sentMessages",
    ]);
  } catch (error) {
    return next(new HttpError("fetching failed please try again", 422));
  }

  if (!user) {
    res.json({ message: "this user don't exist" });
    return next(new HttpError("this user don't exist", 404));
  }
  res.json({ message: "succeded", result: user.toObject({ getters: true }) });
};

const deleteUser = async (req, res, next) => {
  const { fbid } = req.query;
  if (!fbid) {
    return next(new HttpError("missing fbid in query", 422));
  }

  let user;
  try {
    user = await User.findById(fbid).populate("messages");
  } catch (error) {
    return next(
      new HttpError("something went wrong, couldn't delete the user", 500)
    );
  }

  try {
    user.messages.forEach((m) => {
      m.remove();
    });
  } catch (error) {
    console.log(error);
  }

  try {
    await user.remove();
  } catch (error) {
    return next(
      new HttpError("something went wrong, couldn't delete the user", 500)
    );
  }
  res.status(200).json({ message: "user deleted" });
};

const updateUser = async (req, res, next) => {
  console.log("done");
  const { fbid, name } = req.body;

  console.log({ name: name, fbid: fbid });

  if (!fbid || !name) {
    console.log("error");
    return next(new HttpError("missing field from body", 422));
  }

  console.log(req.file);
  console.log("done after verify");

  // const storage = new Storage({
  //   projectId: "serr-seccret",
  //   keyFilename: path.join(__dirname, "/googleServiceAccount.json"),
  // });

  let user;
  try {
    user = await User.findById(fbid);
  } catch (error) {
    console.log(error);
    return next(
      new HttpError("something went wrong, couldn't update the user", 500)
    );
  }

  if (req.file) {
    const bucket = admin.storage().bucket();
    // storage
    //   .bucket("profile-pictures-for-serr-secret")
    bucket
      .upload(req.file.path)
      .then(async (res) => {
        user.name = name;
        user.img =
          "https://storage.googleapis.com/serr-seccret.appspot.com/" +
          req.file.filename;
        await user.save();
      })
      .catch((err) => {
        console.log(err);
        return next(
          new HttpError("something went wrong, couldn't update the user", 500)
        );
      });
  } else {
    try {
      user.name = name;
      await user.save();
    } catch (error) {
      return next(
        new HttpError("something went wrong, couldn't update the user", 500)
      );
    }
  }

  res.status(200).json({
    message: "User updated",
    result: req.file
      ? {
          name: name,
          img:
            "https://storage.googleapis.com/serr-seccret.appspot.com/" +
            req.file.filename,
        }
      : { name: name },
  });
};

const getUserBySearch = async (req, res, next) => {
  const { name } = req.query;
  if (!name) {
    return next(new HttpError("missing name in query"), 500);
  }
  const regex = new RegExp(name, "i");
  await User.find({ name: regex })
    .select(["-password", "-sentMessages", "-messages", "-email"])
    .then((users) => {
      res.status(200).json({ result: users, message: "succeded" });
    })
    .catch((err) => {
      console.log(err);
      return next(new HttpError("couldn't fetch the users", 404));
    });
};

const googleSign = async (req, res, next) => {
  const { tokenId } = req.body;
  console.log(tokenId);
  try {
    const response = await client.verifyIdToken({
      idToken: tokenId,
      audience: [
        "951458547942-vb6s99k6cnd1ih6mprcjlt271sehnm2u.apps.googleusercontent.com",
        "951458547942-k3hcfssnc6r7tue6ufvc4acptbojjtsi.apps.googleusercontent.com",
      ],
    });
    const { email, name, email_verified, picture } = response.payload;
    if (email_verified) {
      User.findOne({ email }).exec((err, user) => {
        if (err) {
          return next(new HttpError("signing failed please try again", 500));
        } else {
          if (user) {
            //login
            let token;
            try {
              token = jwt.sign(
                { userId: user.id, email: user.email },
                "supersecret_never_share_it",
                { expiresIn: "350d" }
              );
            } catch (error) {
              console.log(error);
              return next(
                new HttpError("logging in failed please try again", 500)
              );
            }

            return res.json({
              name: user.name,
              username: user.username,
              userId: user.id,
              email: user.email,
              img: user.img,
              token: token,
            });
          } else {
            //signup
            let ud = uuid().split("-");
            const createdUser = new User({
              name,
              username: name + "_" + ud[0] + ud[1],
              email,
              password: "**********",
              messages: [],
              sentMessages: [],
              img: picture,
            });
            createdUser.save().catch((error) => {
              return next(
                new HttpError("signing up failed please try again", 500)
              );
            });
            let token;
            try {
              token = jwt.sign(
                {
                  userId: createdUser.id,
                  email: createdUser.email,
                },
                "supersecret_never_share_it",
                { expiresIn: "350d" }
              );
            } catch (error) {
              return next(
                new HttpError("signing up failed please try again", 500)
              );
            }

            return res.status(201).json({
              userId: createdUser.id,
              email: createdUser.email,
              username: createdUser.username,
              token: token,
              name: createdUser.name,
              img: createdUser.img,
            });
          }
        }
      });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.signUp = signUp;
exports.logIn = logIn;
exports.getUser = getUser;
exports.deleteUser = deleteUser;
exports.updateUser = updateUser;
exports.getUserBySearch = getUserBySearch;
exports.googleSign = googleSign;
