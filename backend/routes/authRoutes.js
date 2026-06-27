// ../routes/authRoutes
const express = require('express');
const authRouter = express.Router();
const {login_user, register_user} = require("../controllers/authController");

authRouter.post("/register", register_user);
authRouter.post("/login", login_user);

module.exports = authRouter;