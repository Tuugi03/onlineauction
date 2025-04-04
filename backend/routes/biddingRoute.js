const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getBiddingHistory, placeBid, sellProduct } = require("../controllers/biddingController");

const router = express.Router();

router.get("/:productId", getBiddingHistory);
router.post("/", protect, placeBid);
router.post("/sell", protect, sellProduct);


module.exports = router;