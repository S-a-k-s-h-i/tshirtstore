const express = require("express");
const router = express.Router();

const {
  addProduct,
  getAllProducts,
  adminGetAllProducts,
  getSingleProduct,
  adminUpdateOneProduct,
  adminDeleteOneProduct,
  addReview,
  deleteReview,
  getOnlyReviewForOneProduct,
} = require("../controllers/productController");
const { isLoggedIn, customRole } = require("../middlewares/user");

//user routes
router.route("/products").get(getAllProducts);
router.route("/product/:id").get(getSingleProduct);
router.route("/review").put(isLoggedIn, addReview);
router.route("/review").delete(isLoggedIn, deleteReview);
router.route("/review/:id").get(getOnlyReviewForOneProduct);

//admin routes
router
  .route("/admin/product/add")
  .post(isLoggedIn, customRole("admin"), addProduct);

router
  .route("/admin/products")
  .get(isLoggedIn, customRole("admin"), adminGetAllProducts);

router
  .route("/admin/product/:id")
  .patch(isLoggedIn, customRole("admin"), adminUpdateOneProduct)
  .delete(isLoggedIn, customRole("admin"), adminDeleteOneProduct);

module.exports = router;
