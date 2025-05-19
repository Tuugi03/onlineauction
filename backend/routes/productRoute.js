const express = require("express");
const { postProduct, getAllProducts, deleteProduct, updateProduct,getAllProductsAdmin, getAllProductsUser, getProduct, getAllSoldProduct, getAllAvailableProducts } = require("../controllers/productController");
const { protect, admin } = require("../middleware/authMiddleware");
const { upload } = require("../utils/fileUpload");

const router = express.Router();

router.get("/products", getAllAvailableProducts);

router.post("/", protect, upload.array("images", 3), postProduct);
router.get("/my", protect, getAllProductsUser);
router.get("/getAllProducts",  getAllProducts);
router.get("/sold",  getAllSoldProduct);
router.get("/user/:userId", protect, admin, getAllProductsAdmin);

router.delete("/:id", protect, deleteProduct);
router.put("/:id", protect, upload.single("image"), updateProduct);
router.get("/:id",  getProduct);


module.exports = router;