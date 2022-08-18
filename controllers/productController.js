const bigPromise = require("../middlewares/bigPromise");
const Product = require("../models/product");
const cloudinary = require("cloudinary");
const customError = require("../utils/customError");
const WhereClause = require("../utils/whereClause");

exports.addProduct = bigPromise(async (req, res, next) => {
  if (!req.files) return next(new customError("Please provide photos", 400));

  let imagesArray = [];
  for (let index = 0; index < req.files.photos.length; index++) {
    const result = await cloudinary.v2.uploader.upload(
      req.files.photos[index].tempFilePath,
      {
        folder: "products",
        width: 150,
        crop: "scale",
      }
    );
    imagesArray.push({
      id: result.public_id,
      secure_url: result.secure_url,
    });
  }

  req.body.photos = imagesArray;
  req.body.user = req.user.id;

  //create product
  const product = await Product.create(req.body);

  res.status(200).json({
    success: true,
    product,
  });
});

exports.getAllProducts = bigPromise(async (req, res, next) => {
  const resultsPerPage = 6;
  const totalProductCount = await Product.countDocuments();

  let products = new WhereClause(Product.find(), req.query).search().filter();

  const filteredProductCount = products.length;

  products.pager(resultsPerPage);
  products = await products.base;

  res.status(200).json({
    success: true,
    products,
    filteredProductCount,
    totalProductCount,
  });
});

exports.getSingleProduct = bigPromise(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product)
    return next(new CustomError("No product found with this id", 404));

  res.status(200).json({
    success: true,
    product,
  });
});

exports.addReview = bigPromise(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(productId);

  const alreadyReview = await product.reviwes.find(
    (rev) => rev.user.toString() === req.user._id
  );

  if (alreadyReview) {
    alreadyReview.comment = comment;
    alreadyReview.rating = rating;
  } else {
    product.reviews.push(review);
    product.numberOfReviews = product.reviews.length + 1;
  }

  //adjust rating
  product.rating =
    product.reviews.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;

  //save
  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

exports.deleteReview = bigPromise(async (req, res, next) => {
  const { productId } = req.query;

  const product = await Product.findById(productId);

  //remove the review
  product.reviews.splice((rev) => rev.user.toString() === req.user._id, 1);

  //no of reviews
  product.numberOfReviews = product.reviews.length;

  //adjust rating
  product.ratings =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;

  //save
  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Review deleted successfully",
  });
});

exports.getOnlyReviewForOneProduct = bigPromise(async (req, res, next) => {
  const product = await Product.findById(productId);

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

//admin only controllers
exports.adminGetAllProducts = bigPromise(async (req, res, next) => {
  const products = await Product.find();
  const totalProductsCount = await Product.countDocuments();

  res.status(200).json({
    success: true,
    products,
    totalProductsCount,
  });
});

exports.adminUpdateOneProduct = bigPromise(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product)
    return next(new CustomError("No product found with this id", 401));

  if (req.files) {
    let imagesArray = [];
    //destroy the existing images
    for (let index = 0; index < product.photos.length; index++) {
      //fetch image id
      const imageId = product.photos[index].id;
      const res = await cloudinary.v2.uploader.destroy(imageId);
    }

    //upload and save the images
    for (let index = 0; index < req.files.photos.length; index++) {
      const result = await cloudinary.v2.uploader.upload(
        req.files.photos[index].tempFilePath,
        {
          folder: "products", //folder name -> .env
          width: 150,
          crop: "scale",
        }
      );
      imagesArray.push({
        id: result.public_id,
        secure_url: result.secure_url,
      });
    }
    req.body.photos = imagesArray;
  }

  //update product
  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true, //ensures that the response contains the new values
      runValidators: true, //everything taken care by the models
    }
  );

  res.status(200).json({
    success: true,
    updatedProduct,
  });
});

exports.adminDeleteOneProduct = bigPromise(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) next(new CustomError("Product not found with this id", 401));

  //delete product images
  for (let index = 0; index < product.photos.length; index++) {
    await cloudinary.v2.uploader.destroy(product.photos[index].id);
  }

  //delete product
  await Product.deleteOne({ _id: req.params.id });

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});
