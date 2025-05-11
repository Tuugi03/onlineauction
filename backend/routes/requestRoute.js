const express = require("express");
const {getRequests,addRequest, deleteRequest} = require("../controllers/requestController");
const { protect, admin } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/", protect, admin, getRequests);
router.post("/add", protect, addRequest);
router.delete("/:id", protect,admin, deleteRequest );


module.exports = router;