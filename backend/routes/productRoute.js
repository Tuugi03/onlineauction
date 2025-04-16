const express = require("express");
const { postProduct, getAllProducts, deleteProduct, updateProduct, getAllProductsUser, getProduct, getAllSoldProduct, getAllAvailableProducts } = require("../controllers/productController");
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../utils/fileUpload");

const router = express.Router();

router.get("/products", getAllAvailableProducts);

router.post("/", protect, upload.single("image"), postProduct);
router.get("/getAllProducts",  getAllProducts);
router.get("/sold",  getAllSoldProduct);
router.get("/my", protect, getAllProductsUser);

router.delete("/:id", protect, deleteProduct);
router.put("/:id", protect, upload.single("image"), updateProduct);
router.get("/:id",  getProduct);


module.exports = router;