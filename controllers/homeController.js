const BigPromise = require("../middlewares/bigPromise");

exports.home = BigPromise(async (req, res) => {
  // const db = await doSomething()
  res.status(200).json({
    success: true,
    greeting: "hello from api",
  });
});
