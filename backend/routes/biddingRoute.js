const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getBiddingHistory, placeBid, sellProduct, checkUserBidStatus } = require("../controllers/biddingController");

const router = express.Router();

router.get("/:productId", getBiddingHistory);
router.post("/", protect, placeBid);
router.post("/sell", protect, sellProduct);
router.get('/check-bid-status/:productId', protect, checkUserBidStatus);
module.exports = router;