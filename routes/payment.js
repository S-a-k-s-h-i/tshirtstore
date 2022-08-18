const express = require("express");
const router = express.Router();
const {
  captureStripePayments,
  captureRazorpayPayments,
} = require("../controllers/paymentController");
const { isLoggedIn } = require("../middlewares/user");

router.route("/capturestripe").post(isLoggedIn, captureStripePayments);
router.route("/capturerazorpay").post(isLoggedIn, captureRazorpayPayments);

module.exports = router;
