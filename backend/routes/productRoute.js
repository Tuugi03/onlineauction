const express = require("express");
const { postProduct } = require("../controllers/productController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, postProduct);

module.exports = router;