const Order = require("../models/order");
const Product = require("../models/product");

const BigPromise = require("../middlewares/bigPromise");
const customError = require("../utils/customError");

exports.createOrder = BigPromise(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    taxAmount,
    shippingAmount,
    totalAmount,
  } = req.body;

  const order = await Order.create({
    shippingInfo,
    orderItems,
    paymentInfo,
    taxAmount,
    shippingAmount,
    totalAmount,
    user: req.user._id,
  });

  res.status(200).json({
    success: true,
    order,
  });
});

exports.getSingleOrder = BigPromise(async (req, res, next) => {
  const orderId = req.params.id;

  //fetch order by id
  const order = await Order.findById(orderId)
    .populate("user")
    .populate("orderItems.product", "name price photos");

  if (!order) return next(new customError("No order found with this id", 401));

  res.status(200).json({
    success: true,
    order,
  });
});

exports.getLoggedInOrders = BigPromise(async (req, res, next) => {
  //fetch all orders
  const orders = await Order.find({ user: req.user._id });

  if (!orders) return next(new customError("No orders", 401));

  res.status(200).json({
    success: true,
    orders,
  });
});

//for admin
exports.admingetAllOrders = BigPromise(async (req, res, next) => {
  const orders = await Order.find();

  res.status(200).json({
    success: true,
    orders,
  });
});

exports.adminUpdateOrder = BigPromise(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (order.orderStatus === "delivered")
    return next(new CustomError("Order is already marked as delivered", 401));

  order.orderStatus = req.body.orderStatus;

  order.orderItems.forEach(async (prod) => {
    await updateProductStock(prod.product, prod.quantity);
  });

  await order.save();

  res.status(200).json({
    success: true,
    order,
  });
});

exports.adminDeleteOrder = BigPromise(async (req, res, next) => {
  const orderId = req.params.id;

  //fetch order by id
  const order = await Order.findById(orderId);

  if (!order) return next(new customError("No order found with this id", 401));

  //delete product
  await Product.deleteOne({ _id: req.params.id });

  res.status(200).json({
    success: true,
    message: "Deleted successfully",
  });
});

async function updateProductStock(productId, quantity) {
  const product = await Product.findById(productId);

  //update stock
  product.stock = product.stock - quantity;

  await product.save({ validateBeforeSave: false });
}
