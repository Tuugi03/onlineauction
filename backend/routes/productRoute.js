const express = require("express");
const { postProduct, getAllProducts, deleteProduct, updateProduct, getAllProductsUser, getProduct, getAllSoldProduct } = require("../controllers/productController");
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../utils/fileUpload");

const router = express.Router();

router.post("/", protect, upload.single("image"), postProduct);
router.get("/getAllProducts",  getAllProducts);
router.get("/sold",  getAllSoldProduct);

router.delete("/:id", protect, deleteProduct);
router.put("/:id", protect, upload.single("image"), updateProduct);

router.get("/:id",  getProduct);


router.get("/user", protect, getAllProductsUser);
module.exports = router;