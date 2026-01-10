const express = require("express");
const router = express.Router();
const authControllers = require("../controllers/auth-controller");
const { loginSchema, signupSchema }= require("../validators/auth-validator");
const validate = require("../middlewares/validate-middleware");
const authMiddleware = require("../middlewares/auth-middleware");

router.route("/").get(authControllers.home);
router
  .route("/register")
  .post(validate(signupSchema), authControllers.register);
router.route("/login").post(validate(loginSchema), authControllers.login);
router.route("/send-otp").post(authControllers.sendOtp);
router.route("/verify-otp").post(authControllers.verifyOtp);

 
router.route("/user").get(authMiddleware, authControllers.user);

module.exports = router;