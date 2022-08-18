const express = require("express");
const router = express.Router();
const { isLoggedIn, customRole } = require("../middlewares/user");

const {
  signup,
  login,
  logout,
  forgotPassword,
  resetToken,
  getLoggedInUserDetails,
  changePassword,
  updateUserDetails,
  admingetAllUsers,
  managergetAllUsers,
  adminGetUserById,
  adminUpdateUser,
  adminDeleteUser,
} = require("../controllers/userController");

router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/forgotPassword").post(forgotPassword);
router.route("/password/reset/:token").post(resetToken);
router.route("/userdashboard").get(isLoggedIn, getLoggedInUserDetails);
router.route("/password/update").post(isLoggedIn, changePassword);
router.route("/userdashboard/update").post(isLoggedIn, updateUserDetails);

//admin routes
router
  .route("/admin/users")
  .get(isLoggedIn, customRole("admin"), admingetAllUsers);
router
  .route("/admin/user/:id")
  .get(isLoggedIn, customRole("admin"), adminGetUserById);
router
  .route("/admin/updateUser/:id")
  .post(isLoggedIn, customRole("admin"), adminUpdateUser);
router
  .route("/admin/deleteUser/:id")
  .delete(isLoggedIn, customRole("admin"), adminDeleteUser);

//manager routes
router
  .route("/manager/users")
  .get(isLoggedIn, customRole("manager"), managergetAllUsers);

module.exports = router;
