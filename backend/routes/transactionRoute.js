const express = require("express");
const {getMyTransactions} = require("../controllers/transactionController");
const { protect, admin } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/my", protect, getMyTransactions);



module.exports = router;