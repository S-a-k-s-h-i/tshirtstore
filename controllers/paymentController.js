const BigPromise = require("../middlewares/bigPromise");
const { v4: uuidv4 } = require("uuid");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Razorpay = require("razorpay");
const instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

exports.captureStripePayments = BigPromise(async (req, res, next) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: req.body.amount,
    currency: "inr",

    //optional
    metadata: { integration_check: "accept_a_payment" },
  });

  res.status(200).json({
    success: true,
    client_secret: paymentIntent.client_secret,
    amount: req.body.amount,
    //you can send id as well
    id: paymentIntent.id,
  });
});

exports.captureRazorpayPayments = BigPromise(async (req, res, next) => {
  const order = await instance.orders.create({
    amount: req.body.amount,
    currency: "INR",
    receipt: uuidv4(),
  });

  res.status(200).json({
    success: true,
    amount: req.body.amount,
    order,
  });
});
