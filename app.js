const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path=require("path")
const HttpError = require("./models/http-error");
const UserRoutes = require("./routes/UserRoutes");
const MessageRoutes = require("./routes/MessageRoutes");
const CommentRoutes = require("./routes/CommentRoutes");
const fs=require("fs");
const dotenv = require("dotenv");
dotenv.config();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/uploads/images",express.static(path.join("uploads","images")))

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin,X-Requested-With,Content-Type,Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  next();
});

app.use("/api/user", UserRoutes);
app.use("/api/message", MessageRoutes);
// app.use("/api/comment", CommentRoutes);

app.use((req, res, next) => {
  throw new HttpError("couldn't find this route", 404);
});

app.use((error, req, res, next) => {
  if(req.file){
    fs.unlink(req.file.path,err=>{
      console.log(err)
    })
  }
  if (req.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occured" });
});

mongoose
  .connect(
    process.env.DB_CONNECT)
  .then(() => {
    app.listen(process.env.PORT || 5000, () => {
      console.log("Serr server is running on port " + process.env.PORT);
    });
  })
  .catch((err) => {
    console.log(err);
  });
